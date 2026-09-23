<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Infrastructure\EloquentTyreCatalogue;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\VehicleContext;
use App\Enums\TyreSeason;
use App\Models\BalanceWeightColour;
use App\Models\TyreVariant;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Commerce\KomplettradPrice;
use App\Services\Commerce\KomplettradPricer;
use App\Services\Commerce\KomplettradSettings;
use App\Support\GermanFormat;
use App\Support\MakeName;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;

/**
 * The basket, held in the session and re-priced from the catalogue on every render.
 *
 * The session stores what the customer chose — a configuration id, a tyre id, a colour id and a
 * quantity — and nothing else. It never stores a price: a price in a session is a price that can
 * be stale by the time it is charged, and the one number a customer will check against their bank
 * statement is not a number worth caching.
 *
 * Every line is a WHEEL line. RIMIFY sells Felgen alone or Kompletträder, never a standalone tyre
 * (ACCURACY.md D6); a Komplettrad is a wheel line that carries its tyre. Whether that tyre may go
 * on that wheel on the chosen car is asked of the fitment engine on every add and on every render
 * (R-13), and a line that has stopped being sellable is marked, never dropped (R-11).
 */
final readonly class Basket
{
    public const SESSION_KEY = 'cart';

    /**
     * The RDKS answer — basket-level, one car, one answer — bound to the make it was given for
     * (§4.2): `['choice' => 'ja'|'nein', 'makeKey' => 'volkswagen', 'unitPriceCents' => 4900,
     * 'priceId' => 17]`. The two quote fields are never rendered, summed or billed; they exist so
     * that a price which moves between the render and the submission can be seen (§5.3).
     */
    public const SESSION_TPMS = 'cart_tpms';

    /** Why an order with a demo line cannot be placed. Demo rows are walkable; nothing binding happens. */
    public const DEMO_REFUSAL = 'In deinem Warenkorb liegen Felgen aus unserem Beispielsortiment. '
        .'Du kannst dir alles ansehen, bestellen kannst du sie noch nicht – es wurde nichts bestellt und nichts berechnet.';

    public const SHIPPING_REFUSAL = 'Die Versandkosten werden noch festgelegt. Solange kannst du noch nicht bestellen – '
        .'dein Warenkorb bleibt gespeichert.';

    public const BLOCKED_REFUSAL = 'Eine Position im Warenkorb kann so nicht bestellt werden. Im Warenkorb siehst du, welche es ist.';

    public const EMPTY_REFUSAL = 'Dein Warenkorb ist noch leer – lege zuerst eine Felge hinein.';

    /** A Komplettrad while the mounting fee is unconfigured: nothing is guessed, the order waits (D-032). */
    public const MOUNTING_REFUSAL = 'Der Preis für Montage und Auswuchten steht noch nicht fest. '
        .'Solange kannst du Kompletträder noch nicht bestellen – dein Warenkorb bleibt gespeichert.';

    /** A Komplettrad in the basket and no answer to the RDKS question yet (§4.9). */
    public const TPMS_UNANSWERED_REFUSAL = 'Bitte sag uns noch, ob du RDKS-Sensoren brauchst.';

    /** `Ja` for a make whose sensor price nobody has entered: nothing is guessed, the order waits (§4.9). */
    public const TPMS_UNAVAILABLE_REFUSAL = 'Für dein Fahrzeug können wir RDKS-Sensoren gerade nicht '
        .'berechnen. Bestell ohne Sensoren oder schreib uns – wir melden uns mit dem Preis.';

    /** What the checkout card says while the make has no price (§8.3); `%s` is the make label. */
    public const TPMS_NO_PRICE_NOTICE = 'Für %s haben wir den Preis für RDKS-Sensoren noch nicht hinterlegt. '
        .'Schreib uns kurz – wir melden uns mit dem Preis. Ohne Sensoren kannst du sofort bestellen.';

    /** The same card with no vehicle at all — unreachable behind BLOCKED_REFUSAL, but never an empty notice. */
    public const TPMS_NO_VEHICLE_NOTICE = 'Für RDKS-Sensoren brauchen wir dein Fahrzeug – der Preis hängt von der Automarke ab.';

    /* What the add-time gate answers (§4.4), each a full sentence. */
    public const WHEEL_GONE = 'Diese Felge gibt es nicht mehr.';

    public const WHEEL_NOT_PERMITTED = 'Diese Felge ist für dein Fahrzeug nicht freigegeben.';

    /** UNKNOWN is not NOT_PERMITTED (R-07): a car with no Gutachten on file is not told it is unapproved. */
    public const WHEEL_UNKNOWN = 'Zu dieser Felge liegt uns für dein Fahrzeug kein Gutachten vor. Schreib uns, dann prüfen wir das für dich.';

    public const WHEEL_SOLD_OUT = 'Diese Größe ist derzeit ausverkauft.';

    public const TYRE_GONE = 'Diesen Reifen gibt es nicht mehr.';

    public const NO_WEIGHT_COLOUR_REFUSAL = 'Kompletträder können wir gerade nicht zusammenstellen. Die Felge allein kannst du bestellen.';

    /** The product page's code for the sentence above — the one refusal the engine does not raise. */
    public const NO_WEIGHT_COLOUR_CODE = 'NO_WEIGHT_COLOUR';

    public const WEIGHT_COLOUR_GONE = 'Diese Farbe für die Wuchtgewichte gibt es nicht mehr.';

    /* How a line that has become unsellable is marked on render (§4.5). Never dropped. */
    public const LINE_TYRE_GONE = 'Diesen Reifen gibt es nicht mehr. Nimm bitte einen anderen oder bestell die Felge allein.';

    public const LINE_VEHICLE_MISSING = 'Für dieses Komplettrad brauchen wir dein Fahrzeug. Wähl es bitte wieder aus, dann prüfen wir die Reifengröße erneut.';

    public const LINE_COLOUR_GONE = 'Die gewählte Farbe der Wuchtgewichte gibt es nicht mehr. Bitte wähl eine neue Farbe.';

    /** What an unpriced component reads (§8.2) — the same words unconfigured shipping uses. */
    public const OPEN_PRICE = 'wird noch festgelegt';

    private const VAT_RATE = 1.19;

    public function __construct(
        private FitmentResolver $resolver,
        private TyreEligibility $eligibility,
        private KomplettradPricer $pricer,
        private KomplettradSettings $settings,
    ) {}

    /**
     * @return array{lines: list<array<string, mixed>>, totals: array<string, mixed>}
     */
    public function summary(Request $request): array
    {
        $vehicleId = $this->vehicleId($request);
        $raw = $this->raw($request);
        // The active colours, read once per render and only when a Komplettrad line needs them.
        $colours = $this->hasSet($raw) ? $this->activeColours() : new Collection;
        $lines = [];
        $subtotal = 0;

        foreach ($raw as $line) {
            $rendered = $this->render($line, $vehicleId, $colours);

            if ($rendered === null) {
                continue;
            }

            $subtotal += (int) $rendered['lineTotalCents'];
            $lines[] = $rendered;
        }

        // The sensors are part of the goods, so they are in the subtotal — and only on `ja` (§4.8).
        $tpms = $this->tpms($request, $lines);
        $subtotal += (int) $tpms['totalCents'];

        $shipping = $this->shippingFor($subtotal);

        // While the shipping price is unknown it stays out of the total: the page says so beside
        // the figure rather than adding a number nobody has confirmed.
        $total = $subtotal + ($shipping ?? 0);
        // German prices are shown gross, so VAT is extracted from the total rather than added.
        $tax = (int) round($total - ($total / self::VAT_RATE));

        return [
            'lines' => $lines,
            'totals' => [
                'subtotalCents' => $subtotal,
                'subtotal' => GermanFormat::money($subtotal),
                'shippingConfigured' => $this->shippingConfigured(),
                'shippingCents' => $shipping,
                'shipping' => $shipping === null ? self::OPEN_PRICE : GermanFormat::money($shipping),
                'freeShipping' => $shipping === 0 && $subtotal > 0,
                'taxCents' => $tax,
                'tax' => GermanFormat::money($tax),
                'totalCents' => $total,
                'total' => GermanFormat::money($total),
                'count' => array_sum(array_map(static fn (array $l): int => (int) $l['quantity'], $lines)),
                // Like shipping: while the client has not named the fee, no Komplettrad can be ordered.
                'mountingConfigured' => $this->mountingConfigured(),
                'tpms' => $tpms,
            ],
        ];
    }

    /**
     * Why an order cannot be placed from this basket, or null when nothing in the basket stands in
     * the way. The checkout shows the same sentence the server answers a submission with.
     */
    public function orderRefusal(Request $request): ?string
    {
        return $this->refusalOf($this->summary($request));
    }

    /**
     * The refusals in order (§4.9); each replaces nothing above it.
     *
     * @param  array{lines: list<array<string, mixed>>, totals: array<string, mixed>}  $summary
     */
    public function refusalOf(array $summary): ?string
    {
        $lines = $summary['lines'];

        if ($lines === []) {
            return self::EMPTY_REFUSAL;
        }

        // A demo wheel — or, on a Komplettrad, a demo tyre: the line says so, and it is never sold.
        foreach ($lines as $line) {
            if (($line['demo'] ?? true) !== false) {
                return self::DEMO_REFUSAL;
            }
        }

        // Stock, an unsellable verdict, and any line the render marked with a reason.
        foreach ($lines as $line) {
            $verdict = $line['verdict'] ?? null;

            if (($line['inStock'] ?? false) !== true
                || ($line['blockReasons'] ?? []) !== []
                || (is_array($verdict) && ($verdict['sellable'] ?? false) !== true)) {
                return self::BLOCKED_REFUSAL;
            }
        }

        // A Komplettrad whose mounting fee nobody has named: nothing is guessed, nothing is
        // silently zero, and the order waits until the figure exists (D-032).
        foreach ($lines as $line) {
            if (($line['isSet'] ?? false) === true && ($line['priceOpen'] ?? true) === true) {
                return self::MOUNTING_REFUSAL;
            }
        }

        // The RDKS question, asked only of a basket with a Komplettrad (D-034): unanswered holds
        // the order; `ja` for a make without a price is a number nobody confirmed (§4.9).
        $tpms = $summary['totals']['tpms'] ?? null;
        $tpms = is_array($tpms) ? $tpms : [];

        if (($tpms['applicable'] ?? false) === true) {
            $choice = $tpms['choice'] ?? null;

            if ($choice === null) {
                return self::TPMS_UNANSWERED_REFUSAL;
            }

            if ($choice === 'ja' && ($tpms['available'] ?? false) !== true) {
                return self::TPMS_UNAVAILABLE_REFUSAL;
            }
        }

        if ($summary['totals']['shippingConfigured'] !== true) {
            return self::SHIPPING_REFUSAL;
        }

        return null;
    }

    /**
     * Add a line, or raise the quantity if it is already there.
     *
     * Keyed on the configuration and the tyre, not on a generated line id: choosing the same
     * combination twice is one line of eight, not two lines of four, and a basket that shows it
     * twice reads as a bug. A Felge and a Komplettrad of the same rim are two lines.
     *
     * The colour is an attribute, not part of the identity: merging keeps the stored colour unless
     * a new one is passed, and a Komplettrad added without one gets the admin's default (§4.1).
     */
    public function add(
        Request $request,
        int $wheelConfigId,
        int $quantity,
        ?int $tyreVariantId = null,
        ?int $weightColourId = null,
    ): void {
        $key = $this->key($wheelConfigId, $tyreVariantId);
        $cart = $this->rawKeyed($request);
        $existing = $cart[$key] ?? [];

        $colourId = $weightColourId ?? $this->id($existing['weightColourId'] ?? null);

        if ($tyreVariantId !== null && $colourId === null) {
            $colourId = BalanceWeightColour::default()?->id;
        }

        $cart[$key] = [
            'kind' => 'WHEEL',
            'wheelConfigId' => $wheelConfigId,
            'tyreVariantId' => $tyreVariantId,
            'weightColourId' => $tyreVariantId === null ? null : $colourId,
            'quantity' => min(99, (int) ($existing['quantity'] ?? 0) + $quantity),
        ];

        $request->session()->put(self::SESSION_KEY, $cart);
    }

    /**
     * Why this line may not be added right now, or null when it may — the server-side gate (R-11).
     *
     * The product page disables its button in the same cases; this is the same rule on the server,
     * so a stale tab or a hand-made request cannot put a wheel the engine refuses for the chosen
     * car — or a tyre the document does not permit on it — into the basket under a success toast.
     * With no vehicle a Felge makes no claim in either direction and may be added; a Komplettrad
     * may not, because without a verdict there is no permitted-size list (D-033).
     *
     * The quantity is a parameter, not something this method can recover: four Kompletträder
     * against one tyre in stock are refused at the click, not discovered at the checkout.
     *
     * A demo wheel may go into the basket: the flow stays walkable for review. The order is what
     * the server refuses (ACCURACY.md D4).
     */
    public function refusalFor(
        Request $request,
        int $wheelConfigId,
        ?int $tyreVariantId = null,
        ?int $weightColourId = null,
        int $quantity = 1,
    ): ?string {
        $config = WheelConfig::query()->find($wheelConfigId);

        if ($config === null) {
            return self::WHEEL_GONE;
        }

        $vehicleId = $this->vehicleId($request);
        $verdict = $vehicleId === null ? null : $this->resolver->resolve($vehicleId, $config->id);

        // Selected on the status, never through one "not sellable" branch (R-07): only
        // NOT_PERMITTED means "we checked and your car may not have this".
        if ($verdict !== null && ! $verdict->isSellable()) {
            return $verdict->status === VerdictStatus::NotPermitted ? self::WHEEL_NOT_PERMITTED : self::WHEEL_UNKNOWN;
        }

        if ($config->stock_qty < $quantity) {
            return self::WHEEL_SOLD_OUT;
        }

        // Everything below is Komplettrad-only.
        if ($tyreVariantId === null) {
            return null;
        }

        if ($verdict === null) {
            return KomplettradRefusal::NoVehicle->sentenceDe();
        }

        $tyre = TyreVariant::query()->with('brand')->find($tyreVariantId);

        if ($tyre === null) {
            return self::TYRE_GONE;
        }

        // The one place "may this tyre go on this wheel on this car" is answered (R-13).
        $refusal = $this->eligibility->permits($verdict, EloquentTyreCatalogue::toRecord($tyre), $quantity);

        if ($refusal !== null) {
            return $refusal->sentenceDe();
        }

        if ($weightColourId === null) {
            return BalanceWeightColour::default() === null ? self::NO_WEIGHT_COLOUR_REFUSAL : null;
        }

        return BalanceWeightColour::query()->active()->whereKey($weightColourId)->exists()
            ? null
            : self::WEIGHT_COLOUR_GONE;
    }

    /** A quantity of zero is a removal, which is what the stepper's minus reaches at one. */
    public function setQuantity(Request $request, string $key, int $quantity): void
    {
        $cart = $this->rawKeyed($request);

        if (! isset($cart[$key])) {
            return;
        }

        if ($quantity < 1) {
            unset($cart[$key]);
        } else {
            $line = $cart[$key];
            $line['quantity'] = min(99, $quantity);
            $cart[$key] = $line;
        }

        $request->session()->put(self::SESSION_KEY, $cart);
    }

    public function remove(Request $request, string $key): void
    {
        $cart = $this->rawKeyed($request);
        unset($cart[$key]);

        $request->session()->put(self::SESSION_KEY, $cart);
    }

    public function clear(Request $request): void
    {
        $request->session()->forget(self::SESSION_KEY);
        $request->session()->forget(self::SESSION_TPMS);
    }

    /**
     * The Wuchtgewichte colour of a Komplettrad line (§4.10): null once set, else why not. The
     * colour is re-checked for `active` here, whatever the page offered (R-11). A line that is
     * not a Komplettrad carries no weights, so there is nothing to set and nothing is written.
     */
    public function setWeightColour(Request $request, string $key, int $colourId): ?string
    {
        $cart = $this->rawKeyed($request);
        $line = $cart[$key] ?? null;

        if ($line === null || $this->id($line['tyreVariantId'] ?? null) === null) {
            return null;
        }

        if (! BalanceWeightColour::query()->active()->whereKey($colourId)->exists()) {
            return self::WEIGHT_COLOUR_GONE;
        }

        $line['weightColourId'] = $colourId;
        $cart[$key] = $line;

        $request->session()->put(self::SESSION_KEY, $cart);

        return null;
    }

    /**
     * Takes the tyre off a Komplettrad line (§4.10): the old key goes, the rims merge into the
     * Felgen-only line of the same configuration, capped at 99 like every merge. The colour goes
     * with the tyre — there are no weights without one. False when the key names no Komplettrad.
     */
    public function removeTyre(Request $request, string $key): bool
    {
        $cart = $this->rawKeyed($request);
        $line = $cart[$key] ?? null;

        if ($line === null || $this->id($line['tyreVariantId'] ?? null) === null) {
            return false;
        }

        $wheelConfigId = $this->id($line['wheelConfigId'] ?? null);

        if ($wheelConfigId === null) {
            return false;
        }

        unset($cart[$key]);

        $target = $this->key($wheelConfigId);
        $existing = $cart[$target] ?? [];

        $cart[$target] = [
            'kind' => 'WHEEL',
            'wheelConfigId' => $wheelConfigId,
            'tyreVariantId' => null,
            'weightColourId' => null,
            'quantity' => min(99, (int) ($existing['quantity'] ?? 0) + max(1, (int) ($line['quantity'] ?? 1))),
        ];

        $request->session()->put(self::SESSION_KEY, $cart);

        return true;
    }

    /**
     * Records the RDKS answer (§5.3), bound to the current vehicle's make, together with the quote
     * the customer was just shown — the id and the cents of the live row — so a price that moves
     * between this render and the submission can be seen (§4.2). On `nein` there is nothing to
     * charge and nothing to compare, and the quote fields are null. The whole array is rewritten;
     * a stale entry is overwritten, never trusted.
     */
    public function answerTpms(Request $request, string $choice): void
    {
        $make = $this->vehicleMake($request);
        $price = $choice === 'ja' ? $this->pricer->sensorFor($make) : null;

        $request->session()->put(self::SESSION_TPMS, [
            'choice' => $choice,
            'makeKey' => $make === null ? '' : MakeName::key($make),
            'unitPriceCents' => $price?->priceCents,
            'priceId' => $price?->priceId,
        ]);
    }

    /** The RDKS answer as it applies to the current vehicle: null while unanswered, or answered for another make (§4.2). */
    public function tpmsChoice(Request $request): ?string
    {
        $make = $this->vehicleMake($request);

        return $this->boundChoice($this->storedTpms($request), $make === null ? '' : MakeName::key($make));
    }

    /**
     * Whether the sensor price the customer was quoted (§4.2) no longer matches the live row for
     * the current vehicle's make: a changed price, a different row or a row that has gone means
     * the order must not be written at a figure nobody confirmed (§5.3). False whenever there is
     * no bound `ja` to compare — an unanswered or stale answer is refused by refusalOf(), not here.
     */
    public function tpmsQuoteChanged(Request $request): bool
    {
        $stored = $this->storedTpms($request);
        $make = $this->vehicleMake($request);

        if ($this->boundChoice($stored, $make === null ? '' : MakeName::key($make)) !== 'ja') {
            return false;
        }

        $fresh = $this->pricer->sensorFor($make);

        /*
         * A quote from the default carries no row id, so `priceId` is null on both sides while
         * nothing has changed — and stops matching the moment the admin enters a row for this make,
         * which is exactly when the customer would otherwise be billed a figure they never saw.
         */
        return $fresh === null
            || $fresh->priceId !== $stored['priceId']
            || $fresh->priceCents !== $stored['unitPriceCents'];
    }

    /** Drops the RDKS answer, so the question is asked again — at whatever the price now is. */
    public function forgetTpms(Request $request): void
    {
        $request->session()->forget(self::SESSION_TPMS);
    }

    /** Whether any line in the session is a Komplettrad — read from the session shape alone, without a render. */
    public function containsSet(Request $request): bool
    {
        return $this->hasSet($this->raw($request));
    }

    /** `wheel:12` for a Felge, `wheel:12:tyre:7` for a Komplettrad — the Felgen key is byte-identical to before, so existing sessions survive. */
    public function key(int $wheelConfigId, ?int $tyreVariantId = null): string
    {
        return 'wheel:'.$wheelConfigId.($tyreVariantId === null ? '' : ':tyre:'.$tyreVariantId);
    }

    /**
     * The EU tyre label, only where the tyre carries a verified EPREL id (ACCURACY D7) — the rule
     * the homepage's featured tyre already applies. Without one, no label is shown at all; a
     * missing class inside a labelled tyre is null, never invented.
     *
     * @return array{fuel: string|null, wetGrip: string|null, noiseDb: int|null, noiseClass: string|null, eprelId: string}|null
     */
    public static function euLabel(TyreVariant $tyre): ?array
    {
        $eprel = $tyre->eprel_id;

        if (! is_string($eprel) || trim($eprel) === '') {
            return null;
        }

        $fuel = $tyre->getAttribute('eu_fuel_class');
        $wet = $tyre->getAttribute('eu_wet_grip_class');
        $noise = $tyre->getAttribute('eu_noise_db');
        $noiseClass = $tyre->eu_noise_class;

        return [
            'fuel' => is_string($fuel) && $fuel !== '' ? $fuel : null,
            'wetGrip' => is_string($wet) && $wet !== '' ? $wet : null,
            'noiseDb' => is_numeric($noise) ? (int) $noise : null,
            'noiseClass' => is_string($noiseClass) && $noiseClass !== '' ? $noiseClass : null,
            'eprelId' => $eprel,
        ];
    }

    /** Whether the client has given a shipping price (config/rimify.php `shipping.cost_cents`). */
    private function shippingConfigured(): bool
    {
        return is_int(config('rimify.shipping.cost_cents'));
    }

    /** Whether the admin has named the mounting fee (D-032), read exactly as the pricer reads it. */
    private function mountingConfigured(): bool
    {
        return $this->settings->mountingPerWheelCents() !== null;
    }

    /** The shipping for a subtotal in cents, or null while no shipping price is configured. */
    private function shippingFor(int $subtotal): ?int
    {
        $cost = config('rimify.shipping.cost_cents');

        if (! is_int($cost)) {
            return null;
        }

        $freeFrom = config('rimify.shipping.free_from_cents');

        if ($subtotal === 0 || (is_int($freeFrom) && $subtotal >= $freeFrom)) {
            return 0;
        }

        return max(0, $cost);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function rawKeyed(Request $request): array
    {
        $cart = $request->session()->get(self::SESSION_KEY, []);

        if (! is_array($cart)) {
            return [];
        }

        $out = [];

        foreach ($cart as $key => $line) {
            if (is_string($key) && is_array($line)) {
                $out[$key] = $line;
            }
        }

        return $out;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function raw(Request $request): array
    {
        $cart = $request->session()->get(self::SESSION_KEY, []);

        if (! is_array($cart)) {
            return [];
        }

        $out = [];

        foreach ($cart as $line) {
            if (is_array($line)) {
                $out[] = $line;
            }
        }

        return $out;
    }

    /** @param  list<array<string, mixed>>  $raw */
    private function hasSet(array $raw): bool
    {
        foreach ($raw as $line) {
            if ($this->id($line['tyreVariantId'] ?? null) !== null) {
                return true;
            }
        }

        return false;
    }

    /** A positive id from whatever the session holds, or null. */
    private function id(mixed $value): ?int
    {
        return is_numeric($value) && (int) $value > 0 ? (int) $value : null;
    }

    /**
     * @return Collection<array-key, BalanceWeightColour> the active colours in the admin's order, keyed by id
     */
    private function activeColours(): Collection
    {
        return BalanceWeightColour::query()
            ->active()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->keyBy('id');
    }

    /**
     * A line whose catalogue row has gone is dropped rather than rendered half-empty — but only
     * because it no longer exists at all. A line that still exists and has merely become
     * unavailable, or has stopped being permitted on the chosen car, is kept and MARKED: silently
     * removing it leaves the customer with no idea why their basket changed, and the whole value
     * of this product is that it explains itself.
     *
     * A Komplettrad is re-verified the same way on every render (§4.5): its tyre and its colour are
     * re-read like the wheel, the verdict is re-resolved from the current cookie vehicle, and the
     * fitment engine is asked again whether the tyre may go on it at the current quantity.
     *
     * A standalone tyre line left in an older session is not a product RIMIFY sells, so it is not
     * rendered, priced or counted.
     *
     * @param  array<string, mixed>  $line
     * @param  Collection<array-key, BalanceWeightColour>  $colours
     * @return array<string, mixed>|null
     */
    private function render(array $line, ?int $vehicleId, Collection $colours): ?array
    {
        if (($line['kind'] ?? 'WHEEL') !== 'WHEEL') {
            return null;
        }

        $quantity = max(1, (int) ($line['quantity'] ?? 1));

        $config = WheelConfig::query()
            ->with(['wheelModel.brand', 'wheelFinish'])
            ->find($line['wheelConfigId'] ?? null);

        if ($config === null) {
            return null;
        }

        $model = $config->wheelModel;

        $tyreId = $this->id($line['tyreVariantId'] ?? null);
        $isSet = $tyreId !== null;
        $tyre = $isSet ? TyreVariant::query()->with('brand')->find($tyreId) : null;
        $colourId = $this->id($line['weightColourId'] ?? null);
        $colour = $isSet && $colourId !== null ? $colours->get($colourId) : null;

        // Re-computed on every render, never trusted from the session: a document may have been
        // superseded since this line was added, and the basket is the last place that can say so
        // before money changes hands.
        $verdict = $vehicleId === null ? null : $this->resolver->resolve($vehicleId, $config->id);
        $blockReasons = $isSet ? $this->blockReasons($verdict, $tyre, $colour, $quantity) : [];

        // Re-priced from the catalogue and the configuration by the one pricer the order writer
        // uses (§4.6). The unit price is the KNOWN components per wheel; an unpriced one is left
        // out and `priceOpen` says so — never a guessed figure, never a silent 0,00 €.
        $price = $this->pricer->perWheel($config, $tyre, $colour);
        $unit = $price->knownPerWheelCents();

        return [
            'key' => $this->key($config->id, $tyreId),
            'kind' => 'WHEEL',
            'wheelConfigId' => $config->id,
            'slug' => $model->slug,
            'brandName' => $model->brand->name,
            'title' => $model->name,
            'subtitle' => $config->wheelFinish->name_de,
            'sizeLabel' => GermanFormat::wheelSize(
                (float) $config->width_in,
                (float) $config->diameter_in,
                (int) $config->et_mm,
            ),
            'art' => [
                'kind' => 'wheel',
                'finish' => $config->wheelFinish->art_finish,
                'spokes' => $model->spoke_count,
            ],
            'quantity' => $quantity,
            'unitPriceCents' => $unit,
            'unitPrice' => GermanFormat::money($unit, $price->currency),
            'lineTotalCents' => $unit * $quantity,
            'lineTotal' => GermanFormat::money($unit * $quantity, $price->currency),
            'inStock' => $config->stock_qty >= $quantity && ($tyre === null || $tyre->stock_qty >= $quantity),
            // A seeded demonstration row — the model or, on a Komplettrad, the tyre: it may sit in
            // the basket, it can never be ordered (ACCURACY.md D4).
            'demo' => (bool) $model->is_demo || ($tyre !== null && $tyre->is_demo),
            'verdict' => $verdict === null ? null : $this->verdictArray($verdict),
            // The Komplettrad half of the line (§4.7).
            'isSet' => $isSet,
            'setLabel' => $isSet ? 'Komplettrad' : 'Felge',
            'tyre' => $tyre === null ? null : $this->tyrePayload($tyre, $quantity, $price->currency),
            'weights' => $price->isSet && $colour !== null ? $this->weightsPayload($colour, $price->currency) : null,
            'weightOptions' => $isSet ? $this->weightOptions($colours) : [],
            'mounting' => $price->isSet ? [
                'configured' => $price->mountingCents !== null,
                'unitPriceCents' => $price->mountingCents,
                'unitPrice' => $price->mountingCents === null
                    ? self::OPEN_PRICE
                    : GermanFormat::money($price->mountingCents, $price->currency),
            ] : null,
            'components' => $this->components($price, $colour, $quantity),
            'priceOpen' => ! $price->complete(),
            'blockReasons' => $blockReasons,
        ];
    }

    /**
     * Why a Komplettrad line cannot be ordered as it stands — full German sentences, in the order
     * of §4.5, empty when nothing is wrong.
     *
     * @return list<string>
     */
    private function blockReasons(?FitmentVerdict $verdict, ?TyreVariant $tyre, ?BalanceWeightColour $colour, int $quantity): array
    {
        $reasons = [];

        if ($tyre === null) {
            $reasons[] = self::LINE_TYRE_GONE;
        }

        if ($verdict === null) {
            $reasons[] = self::LINE_VEHICLE_MISSING;
        } elseif ($tyre !== null) {
            $refusal = $this->eligibility->permits($verdict, EloquentTyreCatalogue::toRecord($tyre), $quantity);

            if ($refusal !== null) {
                $reasons[] = $refusal->sentenceDe();
            }
        }

        if ($colour === null) {
            $reasons[] = self::LINE_COLOUR_GONE;
        }

        return $reasons;
    }

    /**
     * The component rows a Komplettrad prints (§4.11): `Felge`, `Reifen`, `Montage und
     * Auswuchten`, `Wuchtgewichte (Silber)`. An unpriced component reads `wird noch festgelegt`,
     * carries no line total and is `open`. A Felgen-only line is the rim alone.
     *
     * @return list<array{key: string, label: string, quantity: int, unitPrice: string, lineTotal: string|null, open: bool}>
     */
    private function components(KomplettradPrice $price, ?BalanceWeightColour $colour, int $quantity): array
    {
        $row = static fn (string $key, string $label, ?int $cents): array => [
            'key' => $key,
            'label' => $label,
            'quantity' => $quantity,
            'unitPrice' => $cents === null ? self::OPEN_PRICE : GermanFormat::money($cents, $price->currency),
            'lineTotal' => $cents === null ? null : GermanFormat::money($cents * $quantity, $price->currency),
            'open' => $cents === null,
        ];

        $components = [$row('wheel', 'Felge', $price->wheelCents)];

        if (! $price->isSet) {
            return $components;
        }

        $components[] = $row('tyre', 'Reifen', $price->tyreCents);
        $components[] = $row('mounting', 'Montage und Auswuchten', $price->mountingCents);
        $components[] = $row(
            'weights',
            $colour === null ? 'Wuchtgewichte' : sprintf('Wuchtgewichte (%s)', $colour->name_de),
            $price->weightsPriced ? $price->weightsCents : null,
        );

        return $components;
    }

    /** @return array<string, mixed> */
    private function tyrePayload(TyreVariant $tyre, int $quantity, string $currency): array
    {
        return [
            'id' => (int) $tyre->id,
            'brandName' => (string) $tyre->brand?->name,
            'name' => (string) $tyre->name,
            'season' => (string) $tyre->season,
            'seasonLabel' => TyreSeason::from((string) $tyre->season)->longLabelDe(),
            'sizeLabel' => $tyre->label(),
            'unitPriceCents' => (int) $tyre->price_cents,
            'unitPrice' => GermanFormat::money((int) $tyre->price_cents, $currency),
            'inStock' => $tyre->stock_qty >= $quantity,
            'label' => self::euLabel($tyre),
        ];
    }

    /** @return array<string, mixed> */
    private function weightsPayload(BalanceWeightColour $colour, string $currency): array
    {
        return [
            'colourId' => (int) $colour->id,
            'name' => $colour->name_de,
            'swatchHex' => $colour->swatch_hex,
            'surchargeCents' => $colour->surcharge_cents,
            'surcharge' => GermanFormat::money($colour->surcharge_cents, $currency),
        ];
    }

    /**
     * @param  Collection<array-key, BalanceWeightColour>  $colours
     * @return list<array<string, mixed>>
     */
    private function weightOptions(Collection $colours): array
    {
        return $colours
            ->map(static fn (BalanceWeightColour $colour): array => [
                'id' => (int) $colour->id,
                'name' => $colour->name_de,
                'swatchHex' => $colour->swatch_hex,
                'surchargeCents' => $colour->surcharge_cents,
                'surcharge' => GermanFormat::money($colour->surcharge_cents, $colour->currency),
                'isDefault' => $colour->is_default,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function verdictArray(FitmentVerdict $verdict): array
    {
        return [
            'status' => $verdict->status->value,
            'label' => $verdict->status->labelDe(),
            'sellable' => $verdict->isSellable(),
            'requiresEntry' => $verdict->requiresEntry,
            // Full German sentences, never codes: a customer shown `A02` and left to work out
            // what it means has been told nothing (R-15).
            'conditions' => array_map(
                static fn (Condition $condition): string => $condition->sentenceDe(),
                $verdict->conditions,
            ),
        ];
    }

    /**
     * The RDKS block of the totals (§4.8): whether the question applies, what one sensor costs for
     * the CURRENT vehicle's make — re-read from `tpms_sensor_prices` on every render, never from
     * the session — and the answer, read from the session only when it was given for that same
     * make (§4.2). The `line` string is formatted here, once, so the page prints it and never
     * multiplies cents (§5.4).
     *
     * @param  list<array<string, mixed>>  $lines
     * @return array<string, mixed>
     */
    private function tpms(Request $request, array $lines): array
    {
        $quantity = 0;

        foreach ($lines as $line) {
            if (($line['isSet'] ?? false) === true) {
                $quantity += (int) $line['quantity'];
            }
        }

        $applicable = $quantity > 0;
        $make = $applicable ? $this->vehicleMake($request) : null;
        $makeKey = $make === null ? '' : MakeName::key($make);
        $price = $makeKey === '' ? null : $this->pricer->sensorFor($make);
        $choice = $applicable ? $this->boundChoice($this->storedTpms($request), $makeKey) : null;

        $unit = $price?->priceCents;
        $currency = $price === null ? 'EUR' : $price->currency;
        $total = $choice === 'ja' && $unit !== null ? $unit * $quantity : 0;
        // The quote's spelling where there is one (it is what the order line will say), else the vehicle's.
        $makeLabel = $price !== null ? $price->makeLabelDe : ($make === null ? null : MakeName::normalise($make));

        $notice = null;

        if ($applicable && $price === null) {
            $notice = $makeLabel === null ? self::TPMS_NO_VEHICLE_NOTICE : sprintf(self::TPMS_NO_PRICE_NOTICE, $makeLabel);
        }

        return [
            'applicable' => $applicable,
            'quantity' => $quantity,
            'available' => $price !== null,
            'makeLabel' => $makeLabel,
            'unitPriceCents' => $unit,
            'unitPrice' => $unit === null ? null : GermanFormat::money($unit, $currency),
            'line' => $unit === null ? null : sprintf('%d × %s', $quantity, GermanFormat::money($unit, $currency)),
            'choice' => $choice,
            'totalCents' => $total,
            'total' => GermanFormat::money($total, $currency),
            'notice' => $notice,
        ];
    }

    /**
     * What the session holds for the RDKS answer (§4.2), every field checked: a session is
     * client-adjacent state and nothing in it is assumed well-formed.
     *
     * @return array{choice: string|null, makeKey: string, unitPriceCents: int|null, priceId: int|null}
     */
    private function storedTpms(Request $request): array
    {
        $raw = $request->session()->get(self::SESSION_TPMS);
        $raw = is_array($raw) ? $raw : [];
        $choice = $raw['choice'] ?? null;
        $makeKey = $raw['makeKey'] ?? null;

        return [
            'choice' => $choice === 'ja' || $choice === 'nein' ? $choice : null,
            'makeKey' => is_string($makeKey) ? $makeKey : '',
            'unitPriceCents' => $this->id($raw['unitPriceCents'] ?? null),
            'priceId' => $this->id($raw['priceId'] ?? null),
        ];
    }

    /**
     * The stored answer, or null unless it was given for this very make: a stale answer never
     * survives a vehicle change, in either direction, and no make at all binds nothing (§4.2).
     *
     * @param  array{choice: string|null, makeKey: string, unitPriceCents: int|null, priceId: int|null}  $stored
     */
    private function boundChoice(array $stored, string $makeKey): ?string
    {
        return $makeKey !== '' && $stored['makeKey'] === $makeKey ? $stored['choice'] : null;
    }

    /** The current vehicle's make as the catalogue spells it, or null without a vehicle or without a usable make. */
    private function vehicleMake(Request $request): ?string
    {
        $vehicleId = $this->vehicleId($request);

        if ($vehicleId === null) {
            return null;
        }

        $make = Vehicle::query()->whereKey($vehicleId)->value('make');

        return is_string($make) && trim($make) !== '' ? $make : null;
    }

    private function vehicleId(Request $request): ?int
    {
        $raw = $request->cookie(VehicleContext::COOKIE);

        return VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
    }
}
