<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Enums\TyreSeason;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TyreDeleteRequest;
use App\Http\Requests\Admin\TyreFilterRequest;
use App\Http\Requests\Admin\TyreVariantRequest;
use App\Http\Requests\Admin\TyreViewRequest;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Models\TyreVariant;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Catalogue\CatalogueBrands;
use App\Services\Admin\Catalogue\TyreList;
use App\Support\GermanFormat;
use App\Support\Money;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Katalog › Reifen (his admin item 10, D-302): every tyre the shop can put on a Felge — one size of one profile per
 * record, with its EU tyre label from the start — made, changed and taken out here.
 *
 * A tyre is sold only as part of a Komplettrad, and only where a Gutachten permits its size for the car; this page decides
 * none of that (R-13). What it decides is whether the shop offers the tyre at all: available or not (D-301), and its
 * label complete on record (D-303). A save says which, at once, above the form. Every write is authorised by
 * TyreVariantPolicy (R-11), runs in one transaction and leaves one Protokoll entry.
 */
class ReifenController extends Controller
{
    public const CREATED = 'Reifen angelegt.';

    public const SAVED = 'Gespeichert.';

    public const DELETED = 'Reifen entfernt. Der Shop bietet ihn nicht mehr an.';

    /** What the Protokoll compares on a change, by the names the form gives them. */
    private const AUDITED = [
        'brand_id', 'name', 'season', 'width_mm', 'aspect', 'diameter_in', 'load_index', 'speed_symbol',
        'eu_fuel_class', 'eu_wet_grip_class', 'eu_noise_db', 'eu_noise_class', 'eu_snow_grip', 'eu_ice_grip', 'eprel_id',
        'price_cents', 'available',
    ];

    public function __construct(private readonly TyreList $list) {}

    public function index(TyreFilterRequest $request): Response|RedirectResponse
    {
        $filters = $request->filters();
        $canonical = $request->canonical();
        $page = $this->list->query($filters)->paginate(TyreList::PER_PAGE, ['*'], 'seite', $request->page());

        if ($page->isEmpty() && $page->total() > 0) {
            return redirect()->to(self::url($canonical, $page->lastPage()));
        }

        /** @var list<TyreVariant> $tyres */
        $tyres = array_values($page->items());
        $admin = $request->admin();

        return Inertia::render('Admin/Reifen/Index', [
            'tyres' => array_map($this->list->row(...), $tyres),
            'filters' => [
                'q' => $canonical['q'] ?? '',
                'marke' => $canonical['marke'] ?? '',
                'saison' => $canonical['saison'] ?? '',
                'zoll' => $canonical['zoll'] ?? '',
                'stand' => $canonical['stand'] ?? '',
            ],
            'options' => $this->list->options(),
            // Real tyres whose label is not complete on record: kept, and not offered until it is (D-303).
            'missingLabels' => $this->list->missingLabels(),
            'filtered' => $canonical !== [],
            'totalAll' => TyreVariant::query()->count(),
            'pagination' => [
                'current' => $page->currentPage(),
                'last' => $page->lastPage(),
                'total' => $page->total(),
                'prev' => $page->currentPage() > 1 ? self::url($canonical, $page->currentPage() - 1) : null,
                'next' => $page->hasMorePages() ? self::url($canonical, $page->currentPage() + 1) : null,
            ],
            // Presentation only: every write asks TyreVariantPolicy on the server (R-11).
            'can' => self::can($admin),
        ]);
    }

    public function create(TyreViewRequest $request): Response
    {
        return Inertia::render('Admin/Reifen/Edit', $this->props(null, $request->admin(), $request->template()));
    }

    public function store(TyreVariantRequest $request): RedirectResponse
    {
        $attributes = $request->tyreAttributes();
        $admin = $request->admin();

        $tyre = DB::transaction(static function () use ($attributes, $admin): TyreVariant {
            $brand = CatalogueBrands::resolve($attributes['brand_id'], $attributes['brand_new'], wheelBrand: false);
            $tyre = TyreVariant::query()->create(self::columns($attributes, $brand) + ['currency' => 'EUR', 'is_demo' => false]);

            AuditTrail::record($admin, 'tyre.created', ['name' => self::nameOf($tyre, $brand), 'offered' => $tyre->offered()], $tyre);

            return $tyre;
        });

        return redirect('/admin/reifen/'.$tyre->id)->with('toast', self::CREATED);
    }

    public function edit(TyreViewRequest $request, TyreVariant $tyre): Response
    {
        $tyre->loadMissing('brand');
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, self::nameOf($tyre, $tyre->brand));

        return Inertia::render('Admin/Reifen/Edit', $this->props($tyre, $request->admin(), null));
    }

    public function update(TyreVariantRequest $request, TyreVariant $tyre): RedirectResponse
    {
        $attributes = $request->tyreAttributes();
        $admin = $request->admin();

        DB::transaction(static function () use ($attributes, $admin, $tyre): void {
            $before = $tyre->only(self::AUDITED);
            $brand = CatalogueBrands::resolve($attributes['brand_id'], $attributes['brand_new'], wheelBrand: false);
            $tyre->fill(self::columns($attributes, $brand))->save();
            $after = $tyre->only(self::AUDITED);
            $changed = array_keys(array_filter($after, static fn (mixed $value, string $key): bool => $value !== $before[$key], ARRAY_FILTER_USE_BOTH));

            AuditTrail::record($admin, 'tyre.updated', ['name' => self::nameOf($tyre, $brand), 'changed' => $changed, 'offered' => $tyre->offered()], $tyre);
        });

        return back()->with('toast', self::SAVED);
    }

    public function destroy(TyreDeleteRequest $request, TyreVariant $tyre): RedirectResponse
    {
        $admin = $request->admin();

        DB::transaction(static function () use ($admin, $tyre): void {
            AuditTrail::record($admin, 'tyre.deleted', ['name' => self::nameOf($tyre, $tyre->loadMissing('brand')->brand)], $tyre);
            $tyre->delete();
        });

        return redirect('/admin/reifen')->with('toast', self::DELETED);
    }

    /**
     * @param  array<string, mixed>  $attributes  TyreVariantRequest::tyreAttributes()
     * @return array<string, mixed>
     */
    private static function columns(array $attributes, Brand $brand): array
    {
        unset($attributes['brand_id'], $attributes['brand_new']);

        return ['brand_id' => $brand->id] + $attributes;
    }

    /** `Continental PremiumContact 7 225/45 R18 95Y` */
    private static function nameOf(TyreVariant $tyre, ?Brand $brand): string
    {
        return trim(($brand->name ?? '').' '.$tyre->name.' '.$tyre->label());
    }

    /** @return array<string, mixed> */
    private function props(?TyreVariant $tyre, AdminUser $admin, ?TyreVariant $template): array
    {
        return [
            'tyre' => $tyre === null ? null : [
                'id' => (int) $tyre->id,
                'brandId' => (int) $tyre->brand_id,
                'name' => (string) $tyre->name,
                'season' => (string) $tyre->season,
                'width' => (string) $tyre->width_mm,
                'aspect' => (string) $tyre->aspect,
                'diameter' => (string) (int) $tyre->diameter_in,
                'loadIndex' => (string) $tyre->load_index,
                'speedSymbol' => (string) $tyre->speed_symbol,
                'fuel' => $tyre->eu_fuel_class ?? '',
                'wet' => $tyre->eu_wet_grip_class ?? '',
                'noiseDb' => $tyre->eu_noise_db === null ? '' : (string) $tyre->eu_noise_db,
                'noiseClass' => $tyre->eu_noise_class ?? '',
                'snow' => $tyre->eu_snow_grip,
                'ice' => $tyre->eu_ice_grip,
                'eprelId' => $tyre->eprel_id ?? '',
                'price' => Money::fromMinor((int) $tyre->price_cents)->toGerman(),
                'available' => (bool) $tyre->available,
                'demo' => (bool) $tyre->is_demo,
                // Ordered once: its size stays the size sold (TyreVariantRequest::SOLD).
                'sold' => $tyre->wasOrdered(),
                'fullTitle' => self::nameOf($tyre, $tyre->brand),
                // What the shop does with it now, read from the saved row (D-301, D-303).
                'offered' => $tyre->offered(),
                'missingLabel' => $tyre->is_demo ? [] : $tyre->missingLabel(),
                'updated' => $tyre->updated_at === null ? null : GermanFormat::dateTime($tyre->updated_at),
            ],
            // „Weitere Größe“: brand, profile and season of the tyre it starts from — never its size or its label.
            'template' => $template === null || $template->is_demo ? null : [
                'brandId' => (int) $template->brand_id,
                'name' => (string) $template->name,
                'season' => (string) $template->season,
            ],
            'brands' => Brand::query()->orderBy('name')->get(['id', 'name'])
                ->map(static fn (Brand $b): array => ['value' => (int) $b->id, 'label' => (string) $b->name])->values()->all(),
            'options' => [
                'seasons' => array_map(static fn (TyreSeason $s): array => ['value' => $s->value, 'label' => $s->longLabelDe()], TyreSeason::cases()),
                'speedSymbols' => array_column(ReferenceTables::SPEED_SYMBOLS, 'symbol'),
                'classes' => TyreVariantRequest::CLASSES,
                'noiseClasses' => TyreVariantRequest::NOISE_CLASSES,
            ],
            'can' => self::can($admin),
        ];
    }

    /** @return array{create: bool, edit: bool, delete: bool} */
    private static function can(AdminUser $admin): array
    {
        return [
            'create' => $admin->may(PermissionModule::Catalogue, PermissionAction::Create),
            'edit' => $admin->may(PermissionModule::Catalogue, PermissionAction::Edit),
            'delete' => $admin->may(PermissionModule::Catalogue, PermissionAction::Delete),
        ];
    }

    /** @param  array<string, string>  $query */
    private static function url(array $query, int $page): string
    {
        if ($page > 1) {
            $query['seite'] = (string) $page;
        }

        return $query === [] ? '/admin/reifen' : '/admin/reifen?'.http_build_query($query);
    }
}
