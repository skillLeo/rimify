<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\AdminUser;
use App\Models\Customer;
use App\Models\Fitment;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\Setting;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Support\GermanFormat;
use App\Support\OrderLineLabel;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * The admin's demonstration data: 210 days of a German wheel shop, ending on the anchor day, that
 * every widget of the Übersicht tells the same way (docs: the Übersicht brief, §3).
 *
 * The story. Weekdays sell more than weekends; the autumn change-over lifts the last three weeks; a
 * two-day payment outage about nine weeks back; a Tuesday promotion six weeks back. Most orders are
 * paid; the recent ones are still being packed or waiting, the older ones went out with tracking.
 * About fifteen fitment checks run per order sold, and fewer of them end in „unbekannt“ over the
 * last eight weeks as the catalogue fills. The makes the catalogue covers least are the ones people
 * ask about in vain (Nachfrage-Lücken). A small demo team leaves its traces in the Protokoll.
 *
 * Integrity before volume. Totals are summed from their lines, VAT is taken out of the gross at
 * 19 %, money is cents, a payment follows the order and a shipment the payment. Every wheel line's
 * snapshot comes from the same FitmentResolver the storefront calls, on a clock set to the sale —
 * so the Prüfnachweis says what the customer was shown, and the same on every run.
 *
 * Determinism. Every day draws from its own seeded stream: the same anchor and scale give the same
 * rows, and a second run finds each row by its `demo_ref` and changes nothing. Every row written is
 * born demo (R-12), so `demo:purge` can take all of it away again, and nothing else.
 *
 * @phpstan-type Planned array{index: int, k: int, at: CarbonImmutable, outcome: string, method: string, paid: CarbonImmutable|null, open: bool, quantity: int, u: list<float>}
 */
final class DemoDashboard
{
    public const SEED = 20_260_927;

    /** The story's length, ending on the anchor day. */
    public const DAYS = 210;

    /** Placed orders per day at scale 1, before the season, the weekday and the events. */
    private const BASE_PER_DAY = 3.5;

    /** By ISO weekday: Monday 1 … Sunday 7. */
    private const WEEKDAY = [1 => 1.12, 2 => 1.10, 3 => 1.08, 4 => 1.10, 5 => 1.04, 6 => 0.72, 7 => 0.55];

    /** The autumn change-over: the last three weeks climb to 70 % more. */
    private const SEASON_DAYS = 21;

    private const SEASON_PEAK = 0.7;

    /** The payment outage, about nine weeks back (days before the anchor). */
    private const OUTAGE = [62, 63];

    private const OUTAGE_FACTOR = 0.15;

    /** The promotion: the Tuesday of the week six weeks back. */
    private const PROMO_AROUND = 42;

    private const PROMO_FACTOR = 3.2;

    /** How orders end, in per cent: 78 paid, 8 open, 5 cancelled, 4 refunded, 3 failed, 2 expired. */
    private const OUTCOMES = ['paid' => 78, 'open' => 8, 'cancelled' => 5, 'refunded' => 4, 'failed' => 3, 'expired' => 2];

    /**
     * Wheels per order, in turn: a single replacement, a set, a single, a pair (one axle), a single. A cycle,
     * not a draw: every stretch of the story holds the same mix, so a period's Ø Bestellwert moves
     * with what was sold, not with how the dice fell for sets against singles.
     */
    private const QUANTITY_CYCLE = [1, 4, 1, 2, 1];

    /**
     * Paid orders not yet sent, at scale 1: the most recently paid, as a warehouse ships first in,
     * first out. Of them about seven in ten are being packed, the rest wait.
     */
    private const OPEN_ORDERS = 9;

    /** A refund needs a delivery to come back: none among the last days' orders. */
    private const REFUND_AFTER_DAYS = 5;

    /** A set of four goes out as a Komplettrad this often, where a tyre is permitted. */
    private const KOMPLETTRAD = 0.22;

    /** The Top-Felgen after the leader, in per cent of orders; the rest share what is left. */
    private const LEADER_SHARE = 18.0;

    private const FOLLOWER_SHARES = [14.0, 11.0, 9.0, 7.0, 6.0, 5.0];

    /** Of the leader's orders, this many are its 8,5J × 19. */
    private const LEADER_SIZE = 0.6;

    private const PAYMENT_METHODS = ['card' => 45, 'paypal' => 30, 'klarna' => 15, 'sepa_debit' => 10];

    /** Placed at these Berlin hours, weighted: the evening is the shop's busiest time. */
    private const HOURS = [7 => 2, 8 => 3, 9 => 4, 10 => 5, 11 => 5, 12 => 5, 13 => 5, 14 => 5, 15 => 5, 16 => 5, 17 => 6, 18 => 7, 19 => 8, 20 => 9, 21 => 8, 22 => 5, 23 => 2];

    /** Of the orders, this many come from someone who ordered before. */
    private const RETURNING = 0.18;

    /** Fitment checks per order sold, and how they end before the catalogue filled (per cent). */
    private const CHECKS_PER_ORDER = 15.0;

    private const VERDICTS = ['PERMITTED' => 60.0, 'CONDITIONAL' => 19.0, 'NOT_PERMITTED' => 14.0, 'UNKNOWN' => 7.0];

    /** Over the last eight weeks „unbekannt“ falls by this many points; „freigegeben“ gains them. */
    private const UNKNOWN_WEEKS = 8;

    private const UNKNOWN_DROP = 4.0;

    private const FIRST_NAMES = [
        'Anna', 'Lukas', 'Leonie', 'Finn', 'Mia', 'Jonas', 'Hannah', 'Elias', 'Lea', 'Paul',
        'Emilia', 'Ben', 'Sophie', 'Noah', 'Marie', 'Felix', 'Lina', 'Leon', 'Clara', 'Maximilian',
        'Aylin', 'Emre', 'Zeynep', 'Can', 'Katarzyna', 'Piotr', 'Elena', 'Nikola', 'Sara', 'Mehmet',
        'Petra', 'Thomas', 'Sabine', 'Andreas', 'Claudia', 'Michael', 'Birgit', 'Stefan', 'Nadine', 'Oliver',
    ];

    private const LAST_NAMES = [
        'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
        'Koch', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Braun', 'Zimmermann', 'Krüger',
        'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Köhler', 'Walter', 'Maier', 'Kaya', 'Yılmaz',
        'Nowak', 'Kowalski', 'Petrović', 'Böhm', 'Lindner', 'Vogel', 'Frank', 'Albrecht', 'Seidel', 'Kuhn',
    ];

    /** @var array<string, string> city => postcode */
    private const CITIES = [
        'Berlin' => '10115', 'Hamburg' => '20457', 'München' => '80331', 'Köln' => '50667', 'Frankfurt am Main' => '60311',
        'Stuttgart' => '70173', 'Düsseldorf' => '40213', 'Leipzig' => '04109', 'Dortmund' => '44135', 'Essen' => '45127',
        'Bremen' => '28195', 'Dresden' => '01067', 'Hannover' => '30159', 'Nürnberg' => '90402', 'Duisburg' => '47051',
        'Bochum' => '44787', 'Wuppertal' => '42103', 'Bielefeld' => '33602', 'Bonn' => '53111', 'Münster' => '48143',
        'Mannheim' => '68159', 'Karlsruhe' => '76133', 'Augsburg' => '86150', 'Wiesbaden' => '65183', 'Freiburg im Breisgau' => '79098',
        'Regensburg' => '93047', 'Ingolstadt' => '85049', 'Ulm' => '89073', 'Kassel' => '34117', 'Rostock' => '18055',
    ];

    private const STREETS = [
        'Hauptstraße', 'Schulstraße', 'Gartenstraße', 'Bahnhofstraße', 'Dorfstraße', 'Bergstraße', 'Birkenweg', 'Lindenstraße',
        'Kirchstraße', 'Waldstraße', 'Ringstraße', 'Friedhofstraße', 'Wiesenweg', 'Am Markt', 'Rosenweg', 'Mühlenweg',
        'Eichenallee', 'Feldstraße', 'Industriering', 'Am Hafen', 'Goethestraße', 'Schillerstraße', 'Parkstraße', 'Talstraße',
    ];

    /**
     * The demo team: whose names the Protokoll shows. Their accounts are suspended with a password
     * nobody knows — they exist to be named, never to sign in.
     *
     * @var list<array{0: string, 1: string, 2: list<string>}>
     */
    private const STAFF = [
        ['Anna Keller', 'anna.keller', ['orders.exported', 'orders.exported', 'faq.updated']],
        ['Tobias Brandt', 'tobias.brandt', ['orders.exported']],
        ['Miriam Özdemir', 'miriam.oezdemir', ['page.draft_saved', 'page.published', 'faq.updated']],
        ['Jan Vogel', 'jan.vogel', ['orders.exported', 'page.draft_saved']],
        ['Katrin Albers', 'katrin.albers', ['faq.updated', 'faq.updated', 'orders.exported']],
    ];

    /** Pages the demo team may have worked on: never a legal text. */
    private const PAGES = ['startseite', 'versand', 'kontakt', 'meistgestellte-fragen'];

    private DemoClock $clock;

    private FitmentResolver $resolver;

    private CarbonImmutable $anchor;

    /** The anchor day's cut-off: nothing in the story happens after it. */
    private CarbonImmutable $cutoff;

    private float $scale = 1.0;

    /** @var array<int, WheelConfig> */
    private array $configs = [];

    /** @var array<string, TyreVariant|null> */
    private array $tyres = [];

    /** @var array<int, Vehicle|null> */
    private array $vehicles = [];

    public function __construct(private TyreEligibility $eligibility) {}

    /**
     * Writes the story ending on `$anchor` (a Berlin date), `$scale` times as busy.
     *
     * @return array<string, int> demo rows per table afterwards
     */
    public function seed(CarbonImmutable $anchor, float $scale = 1.0): array
    {
        DemoGuard::ensure();

        $set = DemoTables::set();
        $day = $anchor->setTimezone(GermanFormat::TIMEZONE)->toDateString();

        if ($set !== null && ($set['anchor'] !== $day || abs($set['scale'] - $scale) > 0.0001)) {
            throw new RuntimeException(sprintf(
                'Demo data for %s at scale %s is in place. Run demo:reanchor to move it, or demo:purge first.',
                $set['anchor'],
                rtrim(rtrim(number_format($set['scale'], 2, '.', ''), '0'), '.'),
            ));
        }

        $this->anchor = CarbonImmutable::parse($day, GermanFormat::TIMEZONE)->startOfDay();
        $this->cutoff = $this->anchor->setTime(8, 0);
        $this->scale = $scale;
        $this->clock = new DemoClock($this->cutoff->toDateTimeImmutable());
        // The storefront's resolver, as FitmentServiceProvider builds it — on the demo clock.
        $this->resolver = new FitmentResolver(
            vehicles: app(VehicleRepository::class),
            fitments: app(FitmentRepository::class),
            loadIndex: app(LoadIndexDeriver::class),
            speedSymbol: app(SpeedSymbolDeriver::class),
            clock: $this->clock,
        );

        $plan = $this->plan();

        DB::transaction(function () use ($plan, $day, $scale): void {
            $staff = $this->staff();
            $this->orders($plan);
            $this->checks();
            $this->demand();
            $this->activity($staff);

            Setting::set(DemoTables::SETTING, ['anchor' => $day, 'scale' => $scale, 'seed' => self::SEED]);
        });

        return DemoTables::counts();
    }

    // ── The story's shape ───────────────────────────────────────────────────────────

    /** The Berlin day `$k` days before the anchor. */
    private function day(int $k): CarbonImmutable
    {
        return $this->anchor->subDays($k);
    }

    /** Placed orders expected on day `$k`, at this scale. */
    public function rate(int $k): float
    {
        $day = $this->day($k);
        $growth = 0.85 + 0.15 * (self::DAYS - 1 - $k) / (self::DAYS - 1);
        $season = $k < self::SEASON_DAYS ? 1 + self::SEASON_PEAK * (self::SEASON_DAYS - $k) / self::SEASON_DAYS : 1.0;
        $outage = in_array($k, self::OUTAGE, true) ? self::OUTAGE_FACTOR : 1.0;
        $promo = $k === $this->promoDay() ? self::PROMO_FACTOR : 1.0;
        // The anchor day so far: the morning only.
        $today = $k === 0 ? 0.3 : 1.0;

        return self::BASE_PER_DAY * $this->scale * $growth * self::WEEKDAY[$day->dayOfWeekIso] * $season * $outage * $promo * $today;
    }

    /** The Tuesday of the week around six weeks back. */
    private function promoDay(): int
    {
        for ($k = self::PROMO_AROUND - 3; $k <= self::PROMO_AROUND + 3; $k++) {
            if ($this->day($k)->dayOfWeekIso === 2) {
                return $k;
            }
        }

        return self::PROMO_AROUND;
    }

    // ── The orders ───────────────────────────────────────────────────────────────────

    /**
     * Every order of the story, oldest first, decided before anything is written: when it came in,
     * how it ended, how it was paid, and — for the paid ones — whether it has gone out yet.
     *
     * @return list<Planned>
     */
    private function plan(): array
    {
        $plan = [];
        $index = 0;
        $sold = 0;

        for ($k = self::DAYS - 1; $k >= 0; $k--) {
            $random = DemoRandom::for(self::SEED, "orders:{$k}");
            $n = $random->count($this->rate($k));
            $times = [];

            for ($i = 0; $i < $n; $i++) {
                $u = $random->floats(16);
                $hour = $k === 0 ? 6 + (int) floor($u[0] * 2) : (int) DemoRandom::weighted(self::HOURS, $u[0]);
                $times[] = ['at' => $this->day($k)->setTime($hour, (int) floor($u[1] * 60), (int) floor($u[2] * 60)), 'u' => $u];
            }

            // A day's orders in the order they came in.
            usort($times, static fn (array $a, array $b): int => $a['at'] <=> $b['at']);

            foreach ($times as $order) {
                $u = $order['u'];
                $outcome = (string) DemoRandom::weighted(self::OUTCOMES, $u[3]);
                // A refund follows a delivery: an order of the last days that would be refunded is paid.
                $outcome = $outcome === 'refunded' && $k < self::REFUND_AFTER_DAYS ? 'paid' : $outcome;
                $method = (string) DemoRandom::weighted(self::PAYMENT_METHODS, $u[11]);
                // SEPA takes a day to arrive: not for an order of the last day, which would be paid tomorrow.
                $method = $method === 'sepa_debit' && $k <= 1 ? 'card' : $method;
                $paid = in_array($outcome, ['paid', 'refunded'], true)
                    ? ($method === 'sepa_debit'
                        ? $order['at']->addDay()->setTime(9 + (int) floor($u[12] * 4), (int) floor($u[13] * 60))
                        : $order['at']->addMinutes(1 + (int) floor($u[12] * 4)))
                    : null;

                // The cycle turns over the paid orders: every period's revenue holds the same mix.
                $cycle = $outcome === 'paid' ? $sold++ : $index;
                $quantity = self::QUANTITY_CYCLE[$cycle % count(self::QUANTITY_CYCLE)];

                $plan[] = ['index' => ++$index, 'k' => $k, 'at' => $order['at'], 'outcome' => $outcome, 'method' => $method, 'paid' => $paid, 'open' => false, 'quantity' => $quantity, 'u' => $u];
            }
        }

        // First in, first out: the most recently paid are the ones still in the warehouse.
        $paid = array_keys(array_filter($plan, static fn (array $o): bool => $o['outcome'] === 'paid'));
        usort($paid, static fn (int $a, int $b): int => $plan[$b]['paid'] <=> $plan[$a]['paid']);

        foreach (array_slice($paid, 0, max(1, (int) round(self::OPEN_ORDERS * $this->scale))) as $i) {
            $plan[$i]['open'] = true;
        }

        return $plan;
    }

    /** @param  list<Planned>  $plan */
    private function orders(array $plan): void
    {
        $models = $this->models();

        if ($models === []) {
            return;
        }

        $weights = array_map(static fn (array $m): float => $m['share'], $models);
        $customers = 0;

        foreach ($plan as $order) {
            $u = $order['u'];
            $model = $models[(int) DemoRandom::weighted($weights, $u[4])];
            $pick = $this->fitmentFor($model, $u[5], $u[6], $order['at']);

            if ($pick === null) {
                continue;
            }

            // A returning customer, or the next new one.
            $customer = $customers > 0 && $u[7] < self::RETURNING ? 1 + (int) floor($u[8] * $customers) : ++$customers;

            $this->writeOrder($order, $customer, $pick['fitment'], $pick['verdict'], $u);
        }
    }

    /**
     * The wheel models orders go to: the MCR4 Ultimate leads where the catalogue has it, then the
     * models with the most fitments, then all the rest in equal parts.
     *
     * @return list<array{id: int, share: float, fitments: list<Fitment>, sized: list<Fitment>}>
     */
    private function models(): array
    {
        $fitments = Fitment::query()
            ->visibleToCustomers()
            ->whereHas('tyreSizes')
            ->with('wheelConfig')
            ->orderBy('fitments.id')
            ->get();

        $byModel = [];

        foreach ($fitments as $fitment) {
            $config = $fitment->wheelConfig;

            if ($config instanceof WheelConfig) {
                $byModel[$config->wheel_model_id][] = $fitment;
            }
        }

        if ($byModel === []) {
            return [];
        }

        $leader = DB::table('wheel_models')->whereIn('id', array_keys($byModel))->where('name', 'MCR4 Ultimate')->value('id');
        $ranked = array_keys($byModel);
        usort($ranked, static fn (int $a, int $b): int => [count($byModel[$b]), $a] <=> [count($byModel[$a]), $b]);

        if (is_numeric($leader)) {
            $ranked = [(int) $leader, ...array_values(array_filter($ranked, static fn (int $id): bool => $id !== (int) $leader))];
        }

        $shares = [self::LEADER_SHARE, ...self::FOLLOWER_SHARES];
        $rest = count($ranked) > count($shares) ? (100 - array_sum($shares)) / (count($ranked) - count($shares)) : 0.0;
        $models = [];

        foreach ($ranked as $position => $id) {
            $list = $byModel[$id];
            $sized = array_values(array_filter($list, static function (Fitment $f): bool {
                $config = $f->wheelConfig;

                return $config instanceof WheelConfig && (float) $config->width_in === 8.5 && (float) $config->diameter_in === 19.0;
            }));
            $models[] = ['id' => $id, 'share' => $shares[$position] ?? $rest, 'fitments' => $list, 'sized' => $position === 0 ? $sized : []];
        }

        return $models;
    }

    /**
     * A fitment of the model and the verdict the customer was shown, computed at the sale. Only a
     * wheel the verdict permits — outright or with Auflagen — was ever sold: any other is passed
     * over for the next of the model's fitments.
     *
     * @param  array{id: int, share: float, fitments: list<Fitment>, sized: list<Fitment>}  $model
     * @return array{fitment: Fitment, verdict: FitmentVerdict}|null
     */
    private function fitmentFor(array $model, float $uSize, float $uPick, CarbonImmutable $at): ?array
    {
        $list = $model['sized'] !== [] && $uSize < self::LEADER_SIZE ? $model['sized'] : $model['fitments'];
        $start = (int) floor($uPick * count($list));
        // In UTC, as every timestamp is stored (a Berlin wall time would be written two hours off).
        $this->clock->set($at->utc()->toDateTimeImmutable());

        for ($i = 0; $i < count($list); $i++) {
            $fitment = $list[($start + $i) % count($list)];
            $verdict = $this->resolver->resolve($fitment->vehicle_id, $fitment->wheel_config_id);

            if (in_array($verdict->status->value, ['PERMITTED', 'CONDITIONAL'], true)) {
                return ['fitment' => $fitment, 'verdict' => $verdict];
            }
        }

        return null;
    }

    /**
     * @param  Planned  $order
     * @param  list<float>  $u
     */
    private function writeOrder(array $order, int $customerNo, Fitment $fitment, FitmentVerdict $verdict, array $u): void
    {
        $index = $order['index'];
        $placed = $order['at'];
        $method = $order['method'];
        $config = $this->config($fitment->wheel_config_id);
        $vehicle = $this->vehicles[$fitment->vehicle_id] ??= $fitment->vehicle()->first();

        if ($vehicle === null) {
            return;
        }

        [$customer, $address] = $this->customer($customerNo);

        $quantity = $order['quantity'];
        $tyre = $quantity === 4 && $u[10] < self::KOMPLETTRAD ? $this->tyreFor($fitment, $verdict) : null;

        [$status, $paid, $shipped] = $this->outcome($order, $u);

        $wheelTotal = $config->price_cents * $quantity;
        $tyreTotal = $tyre === null ? 0 : $tyre->price_cents * 4;
        $serviceTotal = $tyre === null ? 0 : 4 * 1_900;
        $subtotal = $wheelTotal + $tyreTotal + $serviceTotal;
        // Demonstration figures, as CommerceSeeder's: the client has named no shipping price yet.
        $shipping = $subtotal >= 50_000 ? 0 : 990;
        $total = $subtotal + $shipping;
        // German VAT is inside the gross price: taken out of the total, never added to it.
        $tax = (int) round($total - ($total / 1.19));
        $ref = sprintf('%05d', $index);

        $orderRow = $this->upsert(Order::class, "demo:order:{$ref}", [
            'order_number' => sprintf('RMF-D-%d-%05d', $placed->year, $index),
            'customer_id' => $customer->getKey(),
            'delivery_address_id' => $address->getKey(),
            'billing_address_id' => $address->getKey(),
            'status' => $status->value,
            'vehicle_id' => $vehicle->id,
            'vehicle_make' => $vehicle->make,
            'vehicle_label' => trim($vehicle->make.' '.$vehicle->model.' '.$vehicle->variant),
            'vehicle_hsn' => $vehicle->hsn,
            'vehicle_tsn' => $vehicle->tsn,
            'vehicle_vsn' => $vehicle->vsn,
            'subtotal_cents' => $subtotal,
            'shipping_cents' => $shipping,
            'tax_cents' => $tax,
            'total_cents' => $total,
            'currency' => 'EUR',
            // Chosen at the checkout; an order that expired or was cancelled before paying never got there.
            'payment_method' => in_array($status, [OrderStatus::Expired, OrderStatus::Cancelled], true) ? null : $method,
            'placed_at' => $placed->utc(),
            'paid_at' => $paid?->utc(),
            'shipped_at' => $shipped?->utc(),
            'tracking_code' => $shipped === null ? null : sprintf('00340434%010d', 5_000_000 + $index),
            'created_at' => $placed->utc(),
            'updated_at' => ($shipped ?? $paid ?? $placed)->utc(),
        ]);

        $group = $tyre === null ? null : 1;
        $lineAt = $placed->utc();

        $wheelLine = $this->upsert(OrderLine::class, "demo:line:{$ref}-1", [
            'order_id' => $orderRow->getKey(),
            'kind' => OrderLineKind::Wheel->value,
            'wheel_config_id' => $config->id,
            'package_group' => $group,
            'label' => OrderLineLabel::wheel($config),
            'quantity' => $quantity,
            'unit_price_cents' => $config->price_cents,
            'line_total_cents' => $wheelTotal,
            'tax_rate_bp' => 1900,
            'currency' => 'EUR',
            'created_at' => $lineAt,
            'updated_at' => $lineAt,
        ]);

        $this->snapshot($wheelLine, $fitment, $verdict, "demo:olf:{$ref}-1");

        if ($tyre !== null) {
            $this->upsert(OrderLine::class, "demo:line:{$ref}-2", [
                'order_id' => $orderRow->getKey(),
                'kind' => OrderLineKind::Tyre->value,
                'tyre_variant_id' => $tyre->id,
                'package_group' => $group,
                'label' => OrderLineLabel::tyre($tyre),
                'quantity' => 4,
                'unit_price_cents' => $tyre->price_cents,
                'line_total_cents' => $tyreTotal,
                'tax_rate_bp' => 1900,
                'currency' => 'EUR',
                'created_at' => $lineAt,
                'updated_at' => $lineAt,
            ]);

            $this->upsert(OrderLine::class, "demo:line:{$ref}-3", [
                'order_id' => $orderRow->getKey(),
                'kind' => OrderLineKind::Service->value,
                'package_group' => $group,
                'label' => 'Montage und Auswuchten',
                'quantity' => 4,
                'unit_price_cents' => 1_900,
                'line_total_cents' => $serviceTotal,
                'tax_rate_bp' => 1900,
                'currency' => 'EUR',
                'created_at' => $lineAt,
                'updated_at' => $lineAt,
            ]);
        }
    }

    /**
     * How far an order got. A checkout left open expires after a day, as a payment session does:
     * `open` stays open only for the last two days. Of the paid, the most recent are still in the
     * warehouse (packed or waiting); every other went out one to three working days after the
     * payment, with tracking — and after three weeks it counts as completed.
     *
     * @param  Planned  $order
     * @param  list<float>  $u
     * @return array{0: OrderStatus, 1: CarbonImmutable|null, 2: CarbonImmutable|null}
     */
    private function outcome(array $order, array $u): array
    {
        $k = $order['k'];
        $paidAt = $order['paid'];

        if ($paidAt === null || $order['outcome'] !== 'paid') {
            return [match ($order['outcome']) {
                'open' => $k <= 1 ? OrderStatus::PendingPayment : OrderStatus::Expired,
                'failed' => OrderStatus::Failed,
                'cancelled' => OrderStatus::Cancelled,
                'refunded' => OrderStatus::Refunded,
                default => OrderStatus::Expired,
            }, $paidAt, null];
        }

        if ($order['open']) {
            return [$u[14] < 0.72 ? OrderStatus::InFulfilment : OrderStatus::Paid, $paidAt, null];
        }

        // Sent in the warehouse's hours; one paid late yesterday went out first thing this morning.
        $shipAt = $paidAt->addWeekdays(1 + (int) floor($u[14] * 3))->setTime(10 + (int) floor($u[15] * 6), (int) floor($u[13] * 60));

        if ($shipAt > $this->cutoff) {
            $shipAt = max($paidAt->addHour(), $this->cutoff->subMinutes(30 + (int) floor($u[15] * 60)));
        }

        return [$k >= 21 ? OrderStatus::Completed : OrderStatus::Shipped, $paidAt, $shipAt];
    }

    /** The snapshot, from the resolver's verdict at the sale. Append-only: one already there stays (R-12). */
    private function snapshot(Model $line, Fitment $fitment, FitmentVerdict $verdict, string $ref): void
    {
        if (OrderLineFitment::query()->whereKey($line->getKey())->exists()) {
            return;
        }

        $document = $fitment->approvalDocument;

        (new OrderLineFitment)->forceFill([
            'order_line_id' => $line->getKey(),
            'vehicle_id' => $fitment->vehicle_id,
            'wheel_config_id' => $fitment->wheel_config_id,
            'fitment_id' => $fitment->id,
            'approval_document_id' => $fitment->approval_document_id,
            'document_revision' => $document->revision,
            'verdict' => $verdict->toArray(),
            'verdict_status' => $verdict->status->value,
            'requires_entry' => $verdict->requiresEntry,
            'pdf_sha256' => $document->pdf_sha256,
            'engine_version' => $verdict->snapshot->engineVersion,
            'computed_at' => $verdict->snapshot->computedAt,
            'is_demo' => 1,
            'demo_ref' => $ref,
        ])->save();
    }

    private function config(int $id): WheelConfig
    {
        return $this->configs[$id] ??= WheelConfig::query()->with(['wheelModel.brand', 'wheelFinish'])->findOrFail($id);
    }

    /** The cheapest tyre the verdict permits on this wheel (TyreEligibility, as the storefront). */
    private function tyreFor(Fitment $fitment, FitmentVerdict $verdict): ?TyreVariant
    {
        $key = $fitment->vehicle_id.':'.$fitment->wheel_config_id;

        if (! array_key_exists($key, $this->tyres)) {
            $offer = $this->eligibility->offerFor($verdict);
            $this->tyres[$key] = $offer->tyres === [] ? null : TyreVariant::query()->with('brand')->find($offer->tyres[0]->id);
        }

        return $this->tyres[$key];
    }

    /**
     * Customer number `$n` and their address — the same person for the same number on every run.
     *
     * @return array{0: Model, 1: Model}
     */
    private function customer(int $n): array
    {
        $first = self::FIRST_NAMES[($n * 7) % count(self::FIRST_NAMES)];
        $last = self::LAST_NAMES[($n * 13 + intdiv($n, count(self::LAST_NAMES))) % count(self::LAST_NAMES)];
        $cities = array_keys(self::CITIES);
        $city = $cities[($n * 11) % count($cities)];
        $ref = sprintf('%04d', $n);
        $since = $this->anchor->subDays(self::DAYS)->utc();

        $customer = $this->upsert(Customer::class, "demo:customer:{$ref}", [
            'email' => sprintf('%s.%s.%d@example.com', self::ascii($first), self::ascii($last), $n),
            'firstname' => $first,
            'lastname' => $last,
            'created_at' => $since,
            'updated_at' => $since,
        ]);

        $address = $this->upsert(Address::class, "demo:address:{$ref}", [
            'customer_id' => $customer->getKey(),
            'full_name' => "{$first} {$last}",
            'street' => self::STREETS[($n * 5) % count(self::STREETS)],
            'house_number' => (string) (1 + ($n * 37) % 120),
            'zip_code' => self::CITIES[$city],
            'city' => $city,
            'country' => 'DE',
            'created_at' => $since,
            'updated_at' => $since,
        ]);

        return [$customer, $address];
    }

    // ── The checks, the demand, the team ─────────────────────────────────────────────

    /**
     * The fitment checks per day, by how they ended: about fifteen per order sold, „unbekannt“
     * falling over the last eight weeks. Kept in `verdict_tallies` under a surface of their own.
     */
    private function checks(): void
    {
        $existing = DB::table('verdict_tallies')->where('is_demo', true)->pluck('n', 'demo_ref')->all();
        $rows = [];

        for ($k = self::DAYS - 1; $k >= 0; $k--) {
            $random = DemoRandom::for(self::SEED, "checks:{$k}");
            $total = (int) round($this->rate($k) * self::OUTCOMES['paid'] / 100 * self::CHECKS_PER_ORDER * (0.9 + 0.2 * $random->float()));
            $weeks = self::UNKNOWN_WEEKS * 7;
            $drop = $k < $weeks ? self::UNKNOWN_DROP * ($weeks - $k) / $weeks : 0.0;
            $shares = self::VERDICTS;
            $shares['UNKNOWN'] -= $drop;
            $shares['PERMITTED'] += $drop;

            foreach (self::apportion($total, $shares) as $status => $n) {
                $ref = "demo:tally:{$k}:{$status}";

                if ($n === 0 || ($existing[$ref] ?? null) === $n) {
                    continue;
                }

                if (array_key_exists($ref, $existing)) {
                    DB::table('verdict_tallies')->where('demo_ref', $ref)->update(['n' => $n]);

                    continue;
                }

                $rows[] = ['day' => $this->day($k)->toDateString(), 'surface' => 'demo', 'status' => $status, 'n' => $n, 'is_demo' => true, 'demo_ref' => $ref];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('verdict_tallies')->insert($chunk);
        }
    }

    /**
     * People asking in vain for the cars the catalogue covers least: the three makes with the
     * smallest share of vehicles that have a Gutachten, and their uncovered models — a few by
     * number (HSN/TSN) the selector did not know. More of it recently, as the season starts.
     */
    private function demand(): void
    {
        $covered = Fitment::query()->visibleToCustomers()->select('fitments.vehicle_id')->distinct()->toBase();
        $makes = DB::table('vehicles')
            ->whereNull('deleted_at')
            ->groupBy('make')
            ->selectRaw('make, COUNT(*) AS total, SUM(CASE WHEN id IN ('.$covered->toSql().') THEN 1 ELSE 0 END) AS covered', $covered->getBindings())
            ->get()
            ->sortBy(static fn (object $row): array => [(int) $row->covered / max(1, (int) $row->total), (string) $row->make])
            ->take(3)
            ->pluck('make')
            ->all();

        $vehicles = DB::table('vehicles')
            ->whereNull('deleted_at')
            ->whereIn('make', $makes)
            ->whereNotIn('id', $covered)
            ->orderBy('id')
            ->limit(12)
            ->get(['id', 'make', 'model', 'variant', 'hsn', 'tsn']);

        if ($vehicles->isEmpty()) {
            return;
        }

        $keys = [['0603', 'BKQ'], ['8566', 'AKR'], ['0005', 'CJK'], ['1313', 'BRN']];
        $existing = array_flip(DB::table('catalogue_gap_events')->where('is_demo', true)->pluck('demo_ref')->all());
        // The first uncovered cars draw most of the asking.
        $weights = [];

        foreach ($vehicles->values() as $i => $vehicle) {
            $weights[$i] = 1 / (1 + $i * 0.6);
        }

        $rows = [];
        $n = 0;

        for ($k = 41; $k >= 0; $k--) {
            $random = DemoRandom::for(self::SEED, "demand:{$k}");
            $count = $random->count($this->scale * 2.4 * (1 + (41 - $k) / 41));

            for ($i = 0; $i < $count; $i++) {
                $u = $random->floats(5);
                $ref = sprintf('demo:gap:%05d', ++$n);
                $at = $this->day($k)->setTime(8 + (int) floor($u[0] * 14), (int) floor($u[1] * 60));

                if (isset($existing[$ref]) || $at > $this->cutoff) {
                    continue;
                }

                if ($u[2] < 0.12) {
                    [$hsn, $tsn] = $keys[(int) floor($u[3] * count($keys))];
                    $rows[] = ['vehicle_id' => null, 'wheel_config_id' => null, 'hsn' => $hsn, 'tsn' => $tsn, 'vehicle_label' => null, 'reason_code' => 'VEHICLE_NOT_FOUND', 'surface' => 'selector', 'occurred_at' => $at->utc(), 'is_demo' => true, 'demo_ref' => $ref];

                    continue;
                }

                $vehicle = $vehicles[(int) DemoRandom::weighted($weights, $u[3])];
                $surface = (string) DemoRandom::weighted(['pdp' => 5, 'plp' => 3, 'check' => 2], $u[4]);
                $rows[] = [
                    'vehicle_id' => $vehicle->id, 'wheel_config_id' => null, 'hsn' => $vehicle->hsn, 'tsn' => $vehicle->tsn,
                    'vehicle_label' => trim($vehicle->make.' '.$vehicle->model.' '.$vehicle->variant),
                    'reason_code' => 'NO_DOCUMENT', 'surface' => $surface, 'occurred_at' => $at->utc(), 'is_demo' => true, 'demo_ref' => $ref,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('catalogue_gap_events')->insert($chunk);
        }
    }

    /**
     * The demo team's accounts: suspended, with a password derived from this installation's key
     * that nobody knows — named in the Protokoll, never signed in.
     *
     * @return list<array{id: int, email: string, events: list<string>}>
     */
    private function staff(): array
    {
        $team = [];
        $since = $this->anchor->subDays(self::DAYS + 30)->utc();

        foreach (self::STAFF as $i => [$name, $local, $events]) {
            $ref = 'demo:staff:'.($i + 1);
            $email = "{$local}@demo.example.com";
            $id = DB::table('admin_users')->where('demo_ref', $ref)->value('id');

            if ($id === null) {
                $id = DB::table('admin_users')->insertGetId([
                    'name' => $name,
                    'email' => $email,
                    'password' => self::unusablePassword($ref),
                    'status' => 'suspended',
                    'created_at' => $since,
                    'updated_at' => $since,
                    'is_demo' => true,
                    'demo_ref' => $ref,
                ]);
            }

            $team[] = ['id' => (int) $id, 'email' => $email, 'events' => $events];
        }

        return $team;
    }

    /**
     * The last five weeks of the team's work, as the Protokoll shows it — only events it can put in
     * words, only pages that are no legal text, only FAQ entries that exist.
     *
     * @param  list<array{id: int, email: string, events: list<string>}>  $staff
     */
    private function activity(array $staff): void
    {
        $pages = DB::table('pages')->whereIn('slug', self::PAGES)->orderBy('id')->get(['slug', 'title'])->all();
        $questions = Schema::hasTable('faqs') && Schema::hasColumn('faqs', 'question_de')
            ? DB::table('faqs')->orderBy('id')->limit(8)->pluck('question_de')->all()
            : [];
        $existing = array_flip(DB::table('audit_logs')->where('is_demo', true)->pluck('demo_ref')->all());
        $causer = (new AdminUser)->getMorphClass();
        $rows = [];
        $n = 0;

        for ($k = 34; $k >= 0; $k--) {
            $day = $this->day($k);

            if ($day->isWeekend()) {
                continue;
            }

            $random = DemoRandom::for(self::SEED, "activity:{$k}");
            $count = $random->count(1.6);
            $entries = [];

            for ($i = 0; $i < $count; $i++) {
                $u = $random->floats(5);
                $entries[] = ['at' => $day->setTime(8 + (int) floor($u[0] * 9), (int) floor($u[1] * 60)), 'u' => $u];
            }

            usort($entries, static fn (array $a, array $b): int => $a['at'] <=> $b['at']);

            foreach ($entries as $entry) {
                $u = $entry['u'];
                $ref = sprintf('demo:audit:%04d', ++$n);
                $person = $staff[(int) floor($u[2] * count($staff))];
                $event = $person['events'][(int) floor($u[3] * count($person['events']))];
                $properties = match ($event) {
                    'orders.exported' => ['filters' => $u[4] < 0.6 ? ['status' => 'offen'] : ['zeitraum' => '30'], 'count' => 4 + (int) floor($u[4] * 30), 'format' => $u[4] < 0.5 ? 'xlsx' : 'csv'],
                    'page.draft_saved', 'page.published' => $pages === [] ? null : self::pageProperties($pages[(int) floor($u[4] * count($pages))], $event),
                    'faq.updated' => $questions === [] ? null : ['question' => (string) $questions[(int) floor($u[4] * count($questions))], 'changed' => ['answer_de']],
                    default => null,
                };

                if ($properties === null || isset($existing[$ref]) || $entry['at'] > $this->cutoff) {
                    continue;
                }

                $rows[] = [
                    'log_name' => 'admin',
                    'description' => $event,
                    'causer_type' => $causer,
                    'causer_id' => $person['id'],
                    'properties' => json_encode($properties, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                    'actor_email' => $person['email'],
                    'created_at' => $entry['at']->utc(),
                    'updated_at' => $entry['at']->utc(),
                    'is_demo' => true,
                    'demo_ref' => $ref,
                ];
            }
        }

        // In the order it happened: the Protokoll and „Letzte Aktivität“ read the newest by id.
        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('audit_logs')->insert($chunk);
        }
    }

    /** @return array<string, mixed> */
    private static function pageProperties(object $page, string $event): array
    {
        $properties = ['page' => (string) $page->title, 'slug' => (string) $page->slug];

        return $event === 'page.published' ? [...$properties, 'changes' => ['Abschnitt 2 · Text'], 'note' => null] : $properties;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────────

    /**
     * The demo row with this ref, written with these values — found again on the next run and left
     * alone when nothing differs. Only ever a row born demo: the ref is looked up among those.
     *
     * @template T of Model
     *
     * @param  class-string<T>  $class
     * @param  array<string, mixed>  $attributes
     * @return T
     */
    private function upsert(string $class, string $ref, array $attributes): Model
    {
        $model = $class::query()->where('is_demo', true)->where('demo_ref', $ref)->first() ?? new $class;
        $model->forceFill([...$attributes, 'is_demo' => 1, 'demo_ref' => $ref]);

        if (! $model->exists || $model->isDirty()) {
            $model->save();
        }

        return $model;
    }

    /**
     * Whole numbers that add up to `$total`, split by the shares (largest remainder first).
     *
     * @param  array<string, float>  $shares
     * @return array<string, int>
     */
    public static function apportion(int $total, array $shares): array
    {
        $sum = array_sum($shares);
        $exact = array_map(static fn (float $s): float => $total * $s / $sum, $shares);
        $whole = array_map(static fn (float $e): int => (int) floor($e), $exact);
        $left = $total - array_sum($whole);
        $remainders = [];

        foreach ($exact as $key => $e) {
            $remainders[$key] = $e - $whole[$key];
        }

        arsort($remainders);

        foreach (array_slice(array_keys($remainders), 0, $left) as $key) {
            $whole[$key]++;
        }

        return $whole;
    }

    /** A bcrypt hash of a secret derived from the app key: valid, stable per installation, unknown. */
    private static function unusablePassword(string $ref): string
    {
        $secret = hash_hmac('sha256', $ref, (string) config('app.key'));
        $salt = substr(strtr(base64_encode(hash('sha256', 'salt:'.$secret, true)), '+', '.'), 0, 22);
        $rounds = str_pad((string) max(4, (int) config('hashing.bcrypt.rounds', 12)), 2, '0', STR_PAD_LEFT);

        return crypt($secret, "\$2y\${$rounds}\${$salt}");
    }

    private static function ascii(string $name): string
    {
        return mb_strtolower(strtr($name, [
            'ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss', 'Ä' => 'ae', 'Ö' => 'oe', 'Ü' => 'ue', 'ı' => 'i', 'ć' => 'c',
        ]));
    }
}
