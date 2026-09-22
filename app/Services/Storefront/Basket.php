<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Storefront\VehicleContext;
use App\Models\WheelConfig;
use App\Support\GermanFormat;
use Illuminate\Http\Request;

/**
 * The basket, held in the session and re-priced from the catalogue on every render.
 *
 * The session stores what the customer chose — a configuration id and a quantity — and nothing
 * else. It never stores a price: a price in a session is a price that can be stale by the time it
 * is charged, and the one number a customer will check against their bank statement is not a
 * number worth caching.
 *
 * Every line is a WHEEL line. RIMIFY sells Felgen alone or Kompletträder, never a standalone tyre
 * (ACCURACY.md D6); a Komplettrad, once it can be ordered, is a wheel line that carries its tyre.
 */
final readonly class Basket
{
    public const SESSION_KEY = 'cart';

    /** Why an order with a demo line cannot be placed. Demo rows are walkable; nothing binding happens. */
    public const DEMO_REFUSAL = 'In deinem Warenkorb liegen Felgen aus unserem Beispielsortiment. '
        .'Du kannst dir alles ansehen, bestellen kannst du sie noch nicht – es wurde nichts bestellt und nichts berechnet.';

    public const SHIPPING_REFUSAL = 'Die Versandkosten werden noch festgelegt. Solange kannst du noch nicht bestellen – '
        .'dein Warenkorb bleibt gespeichert.';

    public const BLOCKED_REFUSAL = 'Eine Position im Warenkorb kann so nicht bestellt werden. Im Warenkorb siehst du, welche es ist.';

    public const EMPTY_REFUSAL = 'Dein Warenkorb ist noch leer – lege zuerst eine Felge hinein.';

    private const VAT_RATE = 1.19;

    public function __construct(private FitmentResolver $resolver) {}

    /**
     * @return array{lines: list<array<string, mixed>>, totals: array<string, mixed>}
     */
    public function summary(Request $request): array
    {
        $vehicleId = $this->vehicleId($request);
        $lines = [];
        $subtotal = 0;

        foreach ($this->raw($request) as $line) {
            $rendered = $this->render($line, $vehicleId);

            if ($rendered === null) {
                continue;
            }

            $subtotal += (int) $rendered['lineTotalCents'];
            $lines[] = $rendered;
        }

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
                'shipping' => $shipping === null ? 'wird noch festgelegt' : GermanFormat::money($shipping),
                'freeShipping' => $shipping === 0 && $subtotal > 0,
                'taxCents' => $tax,
                'tax' => GermanFormat::money($tax),
                'totalCents' => $total,
                'total' => GermanFormat::money($total),
                'count' => array_sum(array_map(static fn (array $l): int => (int) $l['quantity'], $lines)),
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
     * @param  array{lines: list<array<string, mixed>>, totals: array<string, mixed>}  $summary
     */
    public function refusalOf(array $summary): ?string
    {
        $lines = $summary['lines'];

        if ($lines === []) {
            return self::EMPTY_REFUSAL;
        }

        foreach ($lines as $line) {
            if (($line['demo'] ?? true) !== false) {
                return self::DEMO_REFUSAL;
            }
        }

        foreach ($lines as $line) {
            $verdict = $line['verdict'] ?? null;

            if (($line['inStock'] ?? false) !== true || (is_array($verdict) && ($verdict['sellable'] ?? false) !== true)) {
                return self::BLOCKED_REFUSAL;
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
     * Keyed on the configuration, not on a generated line id: choosing the same wheel twice is one
     * line of eight, not two lines of four, and a basket that shows it twice reads as a bug.
     */
    public function add(Request $request, int $wheelConfigId, int $quantity): void
    {
        $key = $this->key($wheelConfigId);
        $cart = $this->rawKeyed($request);

        $existing = (int) ($cart[$key]['quantity'] ?? 0);

        $cart[$key] = [
            'kind' => 'WHEEL',
            'wheelConfigId' => $wheelConfigId,
            // A Komplettrad's tyre, once one can be chosen and checked against the fitment.
            'tyreVariantId' => null,
            'quantity' => min(99, $existing + $quantity),
        ];

        $request->session()->put(self::SESSION_KEY, $cart);
    }

    /**
     * Why this wheel may not be added right now, or null when it may.
     *
     * The product page disables its button in both cases; this is the same rule on the server, so
     * a stale tab or a hand-made request cannot put a wheel the engine refuses for the chosen car
     * into the basket under a "Zum Warenkorb hinzugefügt." toast. With no vehicle there is no
     * claim to check, in either direction (R-11: the UI only hides).
     *
     * A demo wheel may go into the basket: the flow stays walkable for review. The order is what
     * the server refuses (ACCURACY.md D4).
     */
    public function refusalFor(Request $request, int $wheelConfigId): ?string
    {
        $config = WheelConfig::query()->find($wheelConfigId);

        if ($config === null) {
            return 'Diese Felge gibt es nicht mehr.';
        }

        $vehicleId = $this->vehicleId($request);

        if ($vehicleId !== null && ! $this->resolver->resolve($vehicleId, $config->id)->isSellable()) {
            return 'Diese Felge ist für dein Fahrzeug nicht freigegeben.';
        }

        if ($config->stock_qty <= 0) {
            return 'Diese Größe ist derzeit ausverkauft.';
        }

        return null;
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
    }

    public function key(int $wheelConfigId): string
    {
        return 'wheel:'.$wheelConfigId;
    }

    /** Whether the client has given a shipping price (config/rimify.php `shipping.cost_cents`). */
    private function shippingConfigured(): bool
    {
        return is_int(config('rimify.shipping.cost_cents'));
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

    /**
     * A line whose catalogue row has gone is dropped rather than rendered half-empty — but only
     * because it no longer exists at all. A line that still exists and has merely become
     * unavailable, or has stopped being permitted on the chosen car, is kept and MARKED: silently
     * removing it leaves the customer with no idea why their basket changed, and the whole value
     * of this product is that it explains itself.
     *
     * A standalone tyre line left in an older session is not a product RIMIFY sells, so it is not
     * rendered, priced or counted.
     *
     * @param  array<string, mixed>  $line
     * @return array<string, mixed>|null
     */
    private function render(array $line, ?int $vehicleId): ?array
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

        return [
            'key' => $this->key($config->id),
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
            'unitPriceCents' => (int) $config->price_cents,
            'unitPrice' => GermanFormat::money((int) $config->price_cents),
            'lineTotalCents' => (int) $config->price_cents * $quantity,
            'lineTotal' => GermanFormat::money((int) $config->price_cents * $quantity),
            'inStock' => $config->stock_qty >= $quantity,
            // A seeded demonstration model: it may sit in the basket, it can never be ordered.
            'demo' => (bool) $model->is_demo,
            // Re-computed on every render, never trusted from the session: a document may have
            // been superseded since this line was added, and the basket is the last place that
            // can say so before money changes hands.
            'verdict' => $this->verdict($vehicleId, $config->id),
        ];
    }

    /**
     * @return array<string, mixed>|null null when no vehicle is chosen — with no car there is no
     *                                   compatibility claim to make, in either direction.
     */
    private function verdict(?int $vehicleId, int $wheelConfigId): ?array
    {
        if ($vehicleId === null) {
            return null;
        }

        $verdict = $this->resolver->resolve($vehicleId, $wheelConfigId);

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

    private function vehicleId(Request $request): ?int
    {
        $raw = $request->cookie(VehicleContext::COOKIE);

        return VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
    }
}
