<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ShippingMethodOrderRequest;
use App\Http\Requests\Admin\ShippingMethodRequest;
use App\Models\ShippingMethod;
use App\Services\Admin\AuditTrail;
use App\Support\GermanFormat;
use App\Support\Shipping;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Einstellungen › Versand (his round of 08.11, §7B; D-449): the shipping methods the checkout offers — create, edit, sort,
 * activate and deactivate. Each write asks ShippingMethodPolicy (R-11) and leaves one Protokoll entry. A method is never
 * deleted: an order keeps its own copy of what it was sent by, and a method no longer wanted is switched off.
 */
class VersandartenController extends Controller
{
    public const SAVED = 'Gespeichert. Die Kasse bietet die Versandarten so an.';

    public const NONE_ACTIVE = 'Gespeichert. Keine Versandart ist aktiv: Solange nimmt der Shop keine echte Bestellung an.';

    public function index(): Response
    {
        $this->authorize('viewAny', ShippingMethod::class);
        $methods = ShippingMethod::query()->orderBy('position')->orderBy('id')->get();
        $cheapest = Shipping::current();

        return Inertia::render('Admin/Einstellungen/Versand', [
            'methods' => $methods->map(static fn (ShippingMethod $method): array => self::row($method))->values()->all(),
            'countries' => Shipping::COUNTRIES,
            'productTypes' => Shipping::PRODUCT_TYPES,
            // What the product page says now: the cheapest active method for rims (§7B).
            'productLine' => $cheapest->source === 'Versand' ? $cheapest->summary() : null,
            // Until a method is saved, the `.env` stands as one (Shipping::options): said, so nobody wonders where it comes from.
            'fromEnv' => $methods->isEmpty() ? Shipping::current()->summary() : null,
            'canEdit' => request()->user('admin')?->can('create', ShippingMethod::class) === true,
        ]);
    }

    public function store(ShippingMethodRequest $request): RedirectResponse
    {
        $admin = $request->admin();

        DB::transaction(function () use ($request, $admin): void {
            $method = ShippingMethod::query()->create([
                ...$request->columns(),
                'currency' => 'EUR',
                'position' => (int) ShippingMethod::query()->max('position') + 1,
            ]);

            AuditTrail::record($admin, 'shipping_method.created', ['method' => $method->name, 'values' => self::audited($method)], $method);
        });

        return back()->with('toast', self::toast());
    }

    public function update(ShippingMethodRequest $request, ShippingMethod $method): RedirectResponse
    {
        $admin = $request->admin();

        DB::transaction(function () use ($request, $admin, $method): void {
            $before = self::audited($method);
            $method->fill($request->columns())->save();
            $after = self::audited($method->refresh());
            $changed = array_keys(array_filter($after, static fn (mixed $value, string $field): bool => ($before[$field] ?? null) !== $value, ARRAY_FILTER_USE_BOTH));

            if ($changed !== []) {
                AuditTrail::record($admin, 'shipping_method.updated', [
                    'method' => $method->name,
                    'old' => array_intersect_key($before, array_flip($changed)),
                    'new' => array_intersect_key($after, array_flip($changed)),
                ], $method);
            }
        });

        return back()->with('toast', self::toast());
    }

    /** „Nach oben“ / „Nach unten“: the order the checkout offers them in, as one list of ids. */
    public function sort(ShippingMethodOrderRequest $request): RedirectResponse
    {
        $admin = $request->admin();

        DB::transaction(static function () use ($request, $admin): void {
            foreach ($request->ids() as $i => $id) {
                ShippingMethod::query()->whereKey($id)->update(['position' => $i + 1]);
            }

            AuditTrail::record($admin, 'shipping_method.sorted', [
                'order' => ShippingMethod::query()->orderBy('position')->orderBy('id')->pluck('name')->all(),
            ]);
        });

        return back()->with('toast', 'Reihenfolge gespeichert. So bietet die Kasse die Versandarten an.');
    }

    /**
     * A method as the page lists and edits it.
     *
     * @return array<string, mixed>
     */
    private static function row(ShippingMethod $method): array
    {
        return [
            'id' => (int) $method->id,
            'name' => $method->name,
            'description' => $method->description_de ?? '',
            'price' => GermanFormat::money((int) $method->price_cents),
            // Typed back as the form types it: `4,90`, which Money::fromGerman reads again.
            'priceTyped' => self::typed((int) $method->price_cents),
            'freeFrom' => $method->free_from_cents === null ? null : GermanFormat::money($method->free_from_cents),
            'freeFromTyped' => $method->free_from_cents === null ? '' : self::typed($method->free_from_cents),
            'minDays' => (int) $method->delivery_min_days,
            'maxDays' => (int) $method->delivery_max_days,
            'deliveryTime' => Shipping::range((int) $method->delivery_min_days, (int) $method->delivery_max_days),
            'countries' => $method->countries ?? [],
            'productTypes' => $method->product_types ?? [],
            'active' => (bool) $method->active,
            'demo' => (bool) $method->is_demo,
        ];
    }

    /** `4,90` — the amount without the currency, as the form types it. */
    private static function typed(int $cents): string
    {
        return number_format($cents / 100, 2, ',', '.');
    }

    /**
     * What the Protokoll compares on a change, as plain values.
     *
     * @return array<string, mixed>
     */
    private static function audited(ShippingMethod $method): array
    {
        return [
            'name' => $method->name,
            'price_cents' => (int) $method->price_cents,
            'free_from_cents' => $method->free_from_cents,
            'delivery' => Shipping::range((int) $method->delivery_min_days, (int) $method->delivery_max_days),
            'countries' => $method->countries ?? [],
            'product_types' => $method->product_types,
            'description_de' => $method->description_de,
            'active' => (bool) $method->active,
        ];
    }

    private static function toast(): string
    {
        return ShippingMethod::query()->where('active', true)->exists() ? self::SAVED : self::NONE_ACTIVE;
    }
}
