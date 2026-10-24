<?php

declare(strict_types=1);

namespace App\Services\Commerce;

use App\Domain\Fitment\Infrastructure\EloquentTyreCatalogue;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\CombinationVerdict;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Storefront\VehicleContext;
use App\Enums\OrderLineKind;
use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Storefront\Basket;
use App\Support\VehicleName;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Writes an order from the basket, in one transaction: the customer and their addresses, the order
 * as PENDING_PAYMENT, a line per basket line at the price the basket shows, and — on every wheel and
 * Komplettrad line — the verdict frozen as the customer is shown it now (order_line_fitments, R-12).
 *
 * The verdict is resolved again here, at the moment of purchase, by the same resolver the basket
 * uses; a line that is no longer sellable stops the whole order with the basket's own sentence. The
 * caller has already asked Basket::refusalOf; this is the last check before money is asked for.
 *
 * @phpstan-type CustomerData array{email: string, phone: string|null, name: string, street: string, houseNumber: string, zip: string, city: string, billingSame: bool, billingName?: string, billingStreet?: string, billingHouseNumber?: string, billingZip?: string, billingCity?: string}
 */
final class OrderWriter
{
    /** How often a number refused by the unique index is drawn again before the order fails. */
    public const NUMBER_ATTEMPTS = 3;

    /** The refs of a test purchase off production, born demo with all it writes (D-239): `testkauf:<random>:<part>`. */
    public const DEMO_PREFIX = 'testkauf:';

    public function __construct(
        private readonly FitmentResolver $resolver,
        private readonly OrderPayments $payments,
        private readonly TyreEligibility $eligibility,
    ) {}

    /**
     * @param  CustomerData  $customer
     * @param  array{lines: list<array<string, mixed>>, totals: array<string, mixed>}  $summary
     */
    public function write(Request $request, array $customer, array $summary, string $paymentMethod, ?string $note = null): Order
    {
        $vehicleId = VehicleContext::decode(is_string($raw = $request->cookie(VehicleContext::COOKIE)) ? $raw : null)?->vehicleId;
        $vehicle = $vehicleId === null ? null : Vehicle::query()->find($vehicleId);

        if ($vehicle === null) {
            throw new OrderRefused(Basket::BLOCKED_REFUSAL);
        }

        // Every wheel line's verdict, resolved now: the snapshot is what the customer is shown at the
        // moment of purchase, and a line that stopped being sellable stops the order.
        $verdicts = [];
        $combinations = [];

        foreach ($summary['lines'] as $i => $line) {
            $verdict = $this->resolver->resolve((int) $vehicle->id, (int) $line['wheelConfigId']);

            // A rim alone is frozen with the rim's own answer where it sells while the tyres wait for the papers (D-289).
            if (($line['isSet'] ?? false) !== true) {
                $verdict = $verdict->forRimAlone() ?? $verdict;
            }

            if (! $verdict->isSellable()) {
                throw new OrderRefused(Basket::BLOCKED_REFUSAL);
            }

            $verdicts[$i] = $verdict;

            // A set per axle is answered as the set (D-335): both axles now, the weaker deciding — a rear that fails is never
            // sold beside a front that passes.
            $mixed = is_array($line['mixed'] ?? null) ? $line['mixed'] : null;

            if ($mixed !== null) {
                $answer = $this->combination($verdict, $mixed);

                if ($answer === null || ! $answer->isSellable()) {
                    throw new OrderRefused(Basket::BLOCKED_REFUSAL);
                }

                $combinations[$i] = $answer;
            }
        }

        // An example document never stands behind a real order (decision 6, the operator's brief of 15.10.2026, D-239):
        // on production a verdict resting on one is refused — the last check, after the basket's. Elsewhere the purchase
        // goes through and the order is born demo with every row it writes, so the test environment's reset takes it
        // away and no real figure ever counts it.
        $demoDocument = array_filter($verdicts, static fn (FitmentVerdict $verdict): bool => $verdict->document?->isDemo === true) !== [];

        if ($demoDocument && app()->environment('production')) {
            throw new OrderRefused(Basket::DEMO_DOCUMENT_REFUSAL);
        }

        $born = ! app()->environment('production') && ($demoDocument || self::demoGoods($summary['lines']))
            ? self::DEMO_PREFIX.Str::lower(Str::random(20))
            : null;

        return DB::transaction(function () use ($customer, $summary, $vehicle, $verdicts, $combinations, $paymentMethod, $note, $request, $born): Order {
            [$first, $last] = self::split($customer['name']);
            $person = self::row(Customer::class, ['email' => $customer['email'], 'firstname' => $first, 'lastname' => $last, 'phone' => $customer['phone']], $born, 'kunde');
            $delivery = self::row(Address::class, [
                'customer_id' => $person->id, 'full_name' => $customer['name'], 'street' => $customer['street'],
                'house_number' => $customer['houseNumber'], 'zip_code' => $customer['zip'], 'city' => $customer['city'], 'country' => 'DE',
            ], $born, 'lieferadresse');
            $billing = $customer['billingSame'] ? $delivery : self::row(Address::class, [
                'customer_id' => $person->id, 'full_name' => (string) ($customer['billingName'] ?? $customer['name']), 'street' => (string) ($customer['billingStreet'] ?? ''),
                'house_number' => (string) ($customer['billingHouseNumber'] ?? ''), 'zip_code' => (string) ($customer['billingZip'] ?? ''), 'city' => (string) ($customer['billingCity'] ?? ''), 'country' => 'DE',
            ], $born, 'rechnungsadresse');

            $totals = $summary['totals'];
            $order = self::withNumber(static fn (string $number): Order => self::row(Order::class, [
                'order_number' => $number,
                'customer_id' => $person->id,
                'delivery_address_id' => $delivery->id,
                'billing_address_id' => $billing->id,
                'status' => OrderStatus::PendingPayment->value,
                'vehicle_id' => $vehicle->id,
                'vehicle_label' => VehicleName::from($vehicle),
                'vehicle_make' => $vehicle->make,
                'vehicle_hsn' => $vehicle->hsn,
                'vehicle_tsn' => $vehicle->tsn,
                'vehicle_vsn' => $vehicle->vsn,
                'subtotal_cents' => (int) $totals['subtotalCents'],
                'shipping_cents' => (int) ($totals['shippingCents'] ?? 0),
                'tax_cents' => (int) $totals['taxCents'],
                'total_cents' => (int) $totals['totalCents'],
                'currency' => 'EUR',
                'payment_method' => $paymentMethod,
                'shipping_method' => 'standard',
                'note' => $note,
                'placed_at' => now(),
            ], $born, 'bestellung'));

            // A mixed set's two lines move together: one package group for both axles (#20, D-105).
            $groups = [];

            foreach ($summary['lines'] as $i => $line) {
                $isSet = ($line['isSet'] ?? false) === true;
                $mixed = is_array($line['mixed'] ?? null) ? $line['mixed'] : null;
                $group = $mixed === null ? $i + 1 : ($groups[(string) $mixed['setKey']] ??= $i + 1);
                $orderLine = self::row(OrderLine::class, [
                    'order_id' => $order->id,
                    'kind' => ($isSet ? OrderLineKind::Package : OrderLineKind::Wheel)->value,
                    'wheel_config_id' => (int) $line['wheelConfigId'],
                    'tyre_variant_id' => $isSet ? ($line['tyre']['id'] ?? null) : null,
                    'package_group' => $isSet ? $group : null,
                    'axle' => $mixed === null ? null : (string) $mixed['axle'],
                    'label' => self::label($line),
                    'quantity' => (int) $line['quantity'],
                    'unit_price_cents' => (int) $line['unitPriceCents'],
                    'line_total_cents' => (int) $line['lineTotalCents'],
                    'tax_rate_bp' => (int) $totals['vatRateBp'],
                    'currency' => 'EUR',
                ], $born, 'position:'.($i + 1));

                self::freeze($orderLine, $vehicle, (int) $line['wheelConfigId'], $verdicts[$i], $mixed, $born === null ? null : $born.':nachweis:'.($i + 1), $combinations[$i] ?? null);
            }

            $tpms = $totals['tpms'] ?? [];

            if (is_array($tpms) && ($tpms['choice'] ?? null) === 'ja' && is_int($tpms['unitPriceCents'] ?? null) && (int) ($tpms['quantity'] ?? 0) > 0) {
                $stored = $request->session()->get(Basket::SESSION_TPMS);
                self::row(OrderLine::class, [
                    'order_id' => $order->id,
                    'kind' => OrderLineKind::Accessory->value,
                    'tpms_sensor_price_id' => is_array($stored) && is_int($stored['priceId'] ?? null) ? $stored['priceId'] : null,
                    'label' => 'RDKS-Sensoren'.(is_string($tpms['makeLabel'] ?? null) ? ' für '.$tpms['makeLabel'] : ''),
                    'quantity' => (int) $tpms['quantity'],
                    'unit_price_cents' => (int) $tpms['unitPriceCents'],
                    'line_total_cents' => (int) $tpms['totalCents'],
                    'tax_rate_bp' => (int) $totals['vatRateBp'],
                    'currency' => 'EUR',
                ], $born, 'rdks');
            }

            // The goods are taken off the shelf with the order, all or nothing: too few left and the whole order
            // is rolled back with a sentence. They go back when it dies unpaid (OrderPayments).
            $this->payments->reserve($order);

            return $order;
        });
    }

    /**
     * The verdict as the customer is shown it now, frozen onto the line (append-only, R-12). On a Mischbereifung line
     * the axle's own record goes with it (D-105): which axle, its size and the size it was paired with, the document's
     * table entry and page, and what that axle asked for at its load — each axle separately, on its own line. And the set
     * as one of the Gutachten's combinations (D-335): its row and number, and both axles — size, tyre, the answer and what
     * it was measured against, the Auflagen —, so either line shows what was sold where.
     *
     * @param  array<string, mixed>|null  $mixed
     * @param  string|null  $demoRef  the snapshot's own ref where the order is born demo (R-12: fixed at insert)
     */
    private static function freeze(OrderLine $line, Vehicle $vehicle, int $configId, FitmentVerdict $verdict, ?array $mixed = null, ?string $demoRef = null, ?CombinationVerdict $combination = null): void
    {
        $record = $verdict->toArray();

        if ($mixed !== null) {
            unset($mixed['setKey']);
            $record['mixedTyres'] = $mixed;
        }

        if ($combination !== null) {
            $record['combination'] = $combination->toArray();
        }

        (new OrderLineFitment)->forceFill([
            ...($demoRef === null ? [] : ['is_demo' => true, 'demo_ref' => $demoRef]),
            'order_line_id' => $line->id,
            'vehicle_id' => $vehicle->id,
            'wheel_config_id' => $configId,
            'fitment_id' => $verdict->snapshot->fitmentId,
            'approval_document_id' => $verdict->document?->id,
            'document_revision' => $verdict->snapshot->documentRevision ?? $verdict->document?->revision,
            'verdict' => $record,
            'verdict_status' => $verdict->status->value,
            'requires_entry' => $verdict->requiresEntry,
            'pdf_sha256' => $verdict->document?->pdfSha256,
            'engine_version' => $verdict->snapshot->engineVersion,
            'computed_at' => $verdict->snapshot->computedAt,
        ])->save();
    }

    /**
     * The set's answer as one of the Gutachten's combinations (D-335), from the verdict frozen with it and both tyres as
     * they stand now; null where a tyre is gone or the pair is no combination the car's row carries.
     *
     * @param  array<string, mixed>  $mixed
     */
    private function combination(FitmentVerdict $verdict, array $mixed): ?CombinationVerdict
    {
        $tyre = static fn (mixed $id): ?TyreVariant => is_numeric($id) ? TyreVariant::query()->with('brand')->find((int) $id) : null;
        $front = $tyre($mixed['frontTyreId'] ?? null);
        $rear = $tyre($mixed['rearTyreId'] ?? null);

        if ($front === null || $rear === null) {
            return null;
        }

        return $this->eligibility->combinationVerdict($verdict, EloquentTyreCatalogue::toRecord($front), EloquentTyreCatalogue::toRecord($rear));
    }

    /**
     * A row the order writes — born demo under the order's ref where the order is (R-12: both columns fixed at insert),
     * so the reset that takes demo data away takes all of it, the snapshot included.
     *
     * @template T of Model
     *
     * @param  class-string<T>  $class
     * @param  array<string, mixed>  $attributes
     * @return T
     */
    private static function row(string $class, array $attributes, ?string $born, string $part): Model
    {
        $model = new $class;
        $model->forceFill($born === null ? $attributes : [...$attributes, 'is_demo' => true, 'demo_ref' => $born.':'.$part])->save();

        return $model;
    }

    /**
     * Whether the basket holds goods born demo — the acceptance set's wheel or tyre, the only demo goods a checkout
     * can reach (AcceptanceSet::sellable, off production).
     *
     * @param  list<array<string, mixed>>  $lines
     */
    private static function demoGoods(array $lines): bool
    {
        $configs = array_map(static fn (array $line): int => (int) $line['wheelConfigId'], $lines);
        $tyres = array_values(array_filter(array_map(
            static fn (array $line): ?int => is_array($line['tyre'] ?? null) && is_numeric($line['tyre']['id'] ?? null) ? (int) $line['tyre']['id'] : null,
            $lines,
        )));

        return WheelConfig::query()->whereIn('wheel_configs.id', $configs)
            ->join('wheel_models as wm', 'wm.id', '=', 'wheel_configs.wheel_model_id')
            ->where('wm.is_demo', true)
            ->exists()
            || ($tyres !== [] && TyreVariant::query()->whereIn('id', $tyres)->where('is_demo', true)->exists());
    }

    /** @param  array<string, mixed>  $line */
    private static function label(array $line): string
    {
        $wheel = trim($line['brandName'].' '.$line['title']).' · '.$line['subtitle'].' · '.$line['sizeLabel'];

        if (($line['isSet'] ?? false) !== true) {
            return $wheel;
        }

        // The tyre as the workshop fits it: brand, profile and size. Its `label` is the EU label, an array — read as text
        // it stopped every Komplettrad whose tyre carries one (found with D-303, where every offered tyre does).
        $tyre = is_array($line['tyre'] ?? null)
            ? trim(implode(' ', array_filter([$line['tyre']['brandName'] ?? '', $line['tyre']['name'] ?? '', $line['tyre']['sizeLabel'] ?? ''], static fn (mixed $part): bool => is_string($part) && $part !== '')))
            : '';
        // `Komplettrad Vorderachse: …` — the axle in the frozen words, where the workshop reads it (D-105).
        $axle = is_array($line['mixed'] ?? null) ? ' '.$line['mixed']['axleLabel'] : '';

        return 'Komplettrad'.$axle.': '.$wheel.($tyre === '' ? '' : ' mit '.$tyre);
    }

    /**
     * The order under the year's next number. Three guards, so two checkouts a second apart can never
     * share one: the number is read under a row lock (nextNumber), the table's unique index refuses a
     * duplicate whatever happens, and a refused number is simply drawn again — up to three times.
     *
     * @param  Closure(string): Order  $create
     */
    public static function withNumber(Closure $create): Order
    {
        for ($attempt = 1; ; $attempt++) {
            try {
                return $create(self::nextNumber());
            } catch (UniqueConstraintViolationException $e) {
                if ($attempt >= self::NUMBER_ATTEMPTS || ! str_contains($e->getMessage(), 'order_number')) {
                    throw $e;
                }
            }
        }
    }

    /**
     * `RMF-2026-1022`: the year's next number, read under a lock so two checkouts never share one.
     * Compared as a number, not as text: as text `RMF-2026-999` sorts above `RMF-2026-1000`, and
     * the same number would be issued twice.
     */
    public static function nextNumber(): string
    {
        $year = now()->year;
        $prefix = "RMF-{$year}-";
        $last = Order::query()
            ->where('order_number', 'like', $prefix.'%')
            ->lockForUpdate()
            ->selectRaw('MAX(CAST(SUBSTRING(order_number, ?) AS UNSIGNED)) AS n', [strlen($prefix) + 1])
            ->value('n');

        return $prefix.str_pad((string) ((int) $last + 1), 4, '0', STR_PAD_LEFT);
    }

    /** @return array{0: string|null, 1: string|null} first name(s) and last name */
    private static function split(string $name): array
    {
        $name = trim($name);
        $at = strrpos($name, ' ');

        return $at === false ? [null, $name] : [substr($name, 0, $at), substr($name, $at + 1)];
    }
}
