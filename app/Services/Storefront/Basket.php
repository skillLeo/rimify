<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Storefront\VehicleContext;
use App\Models\TyreVariant;
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
 */
final readonly class Basket
{
    public const SESSION_KEY = 'cart';

    /** Free shipping from 500 €, which is what the storefront advertises. */
    private const FREE_SHIPPING_FROM_CENTS = 50_000;

    private const SHIPPING_CENTS = 990;

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

        $shipping = ($subtotal === 0 || $subtotal >= self::FREE_SHIPPING_FROM_CENTS)
            ? 0
            : self::SHIPPING_CENTS;

        $total = $subtotal + $shipping;
        // German prices are shown gross, so VAT is extracted from the total rather than added.
        $tax = (int) round($total - ($total / self::VAT_RATE));

        return [
            'lines' => $lines,
            'totals' => [
                'subtotalCents' => $subtotal,
                'subtotal' => GermanFormat::money($subtotal),
                'shippingCents' => $shipping,
                'shipping' => GermanFormat::money($shipping),
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
     * Add a line, or raise the quantity if it is already there.
     *
     * Keyed on the configuration, not on a generated line id: choosing the same wheel twice is one
     * line of eight, not two lines of four, and a basket that shows it twice reads as a bug.
     */
    public function add(Request $request, string $kind, int $referenceId, int $quantity): void
    {
        $key = $this->key($kind, $referenceId);
        $cart = $this->rawKeyed($request);

        $existing = (int) ($cart[$key]['quantity'] ?? 0);

        $cart[$key] = [
            'kind' => $kind,
            'wheelConfigId' => $kind === 'WHEEL' ? $referenceId : null,
            'tyreVariantId' => $kind === 'TYRE' ? $referenceId : null,
            'quantity' => min(99, $existing + $quantity),
        ];

        $request->session()->put(self::SESSION_KEY, $cart);
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

    public function key(string $kind, int $referenceId): string
    {
        return ($kind === 'TYRE' ? 'tyre:' : 'wheel:').$referenceId;
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
     * @param  array<string, mixed>  $line
     * @return array<string, mixed>|null
     */
    private function render(array $line, ?int $vehicleId): ?array
    {
        $kind = is_string($line['kind'] ?? null) ? $line['kind'] : 'WHEEL';
        $quantity = max(1, (int) ($line['quantity'] ?? 1));

        if ($kind === 'TYRE') {
            $tyre = TyreVariant::query()->with('brand')->find($line['tyreVariantId'] ?? null);

            if ($tyre === null) {
                return null;
            }

            return [
                'key' => 'tyre:'.$tyre->id,
                'kind' => 'TYRE',
                'tyreVariantId' => $tyre->id,
                'brandName' => $tyre->brand->name,
                'title' => $tyre->name,
                'subtitle' => GermanFormat::tyreSize(
                    (int) $tyre->width_mm,
                    (int) $tyre->aspect,
                    (float) $tyre->diameter_in,
                    (int) $tyre->load_index,
                    $tyre->speed_symbol,
                ),
                'art' => ['kind' => 'tyre', 'label' => GermanFormat::tyreSize(
                    (int) $tyre->width_mm,
                    (int) $tyre->aspect,
                    (float) $tyre->diameter_in,
                    (int) $tyre->load_index,
                    $tyre->speed_symbol,
                )],
                'quantity' => $quantity,
                'unitPriceCents' => (int) $tyre->price_cents,
                'unitPrice' => GermanFormat::money((int) $tyre->price_cents),
                'lineTotalCents' => (int) $tyre->price_cents * $quantity,
                'lineTotal' => GermanFormat::money((int) $tyre->price_cents * $quantity),
                'inStock' => $tyre->stock_qty >= $quantity,
            ];
        }

        $config = WheelConfig::query()
            ->with(['wheelModel.brand', 'wheelFinish'])
            ->find($line['wheelConfigId'] ?? null);

        if ($config === null) {
            return null;
        }

        $model = $config->wheelModel;

        return [
            'key' => 'wheel:'.$config->id,
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
