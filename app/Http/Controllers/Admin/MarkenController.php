<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BrandLogoRequest;
use App\Http\Requests\Admin\BrandManufacturerRequest;
use App\Http\Requests\Admin\BrandRequest;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Catalogue\BrandLogoStore;
use App\Services\Admin\Lists\ListPaging;
use App\Support\BrandLogos;
use App\Support\EditStamp;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Katalog › Marken: every brand the shop knows — its name, whether it is a wheel brand on the homepage's
 * brand wall, its place there, and its logo. Until now a brand came only from the import or the Felge
 * form, and a logo only from a script (BrandLogoSeeder); a real supplier's brand arrived without one.
 *
 * Every write is authorised by BrandPolicy (R-11), runs in one transaction and leaves one Protokoll entry.
 * A brand that still carries a wheel or a tyre is never removed.
 */
class MarkenController extends Controller
{
    public const SAVED = 'Gespeichert.';

    public const LOGO_SAVED = 'Logo gespeichert. Die Markenwand zeigt es ab jetzt.';

    public const LOGO_REMOVED = 'Logo entfernt. Die Markenwand zeigt den Namen.';

    public const DELETED = 'Marke entfernt.';

    public const RESTORED = 'Die entfernte Marke ist wieder da.';

    public const RESTORED_WITH_LOGO = 'Die entfernte Marke ist wieder da, mit ihrem früheren Logo.';

    /** What the brand form writes — and so what its stamp covers (EditStamp, the admin audit's F-25). */
    private const FIELDS = ['name', 'is_wheel_brand', 'sort_order'];

    public function __construct(private readonly BrandLogoStore $logos) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Brand::class);
        $admin = self::admin($request);

        $query = Brand::query()
            // Removed Felgen count too: they keep their brand (BrandPolicy), and the list must not
            // offer an „Entfernen“ the server refuses (K2-16).
            ->withCount([
                'wheelModels',
                'tyreVariants',
                'wheelModels as removed_wheels_count' => static fn (Builder $q) => $q->withoutGlobalScope(SoftDeletingScope::class)->whereNotNull('wheel_models.deleted_at'),
            ])
            ->orderBy('sort_order')->orderBy('name');

        // By its name (umlauts as typed). A thousand brands on one page took 3–5 s and one 805 ms query: the counts are
        // asked for one page at a time now (the admin audit's F-04, F-31).
        $search = is_string($request->query('q')) ? mb_substr(trim((string) $request->query('q')), 0, 60) : '';

        if ($search !== '') {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(static fn ($where) => $where->where('name', 'like', $like)->orWhere('slug', 'like', $like));
        }

        $page = $query->paginate(ListPaging::PER_PAGE, ['*'], 'seite', ListPaging::requested($request->query('seite')));

        return Inertia::render('Admin/Marken/Index', [
            'brands' => collect($page->items())->map(static fn (Brand $brand): array => self::row($brand))->all(),
            'search' => $search,
            'found' => $page->total(),
            'pagination' => ListPaging::props($page, '/admin/marken', ['q' => $search]),
            // The page's line, over every brand on file — not the page's fifty.
            'summary' => [
                'total' => Brand::query()->count(),
                'wall' => Brand::query()->where('is_wheel_brand', true)->count(),
                'logos' => Brand::query()->whereNotNull('logo_path')->get(['slug', 'logo_path'])
                    ->filter(static fn (Brand $brand): bool => BrandLogos::resolve((string) $brand->slug, $brand->logo_path) !== null)->count(),
            ],
            // A new brand joins the wall at its end, as the Felge form and the import place one (K2-12).
            'nextSortOrder' => (int) Brand::query()->max('sort_order') + 10,
            'can' => [
                'create' => $admin->canQuietly('create', Brand::class),
                'update' => $admin->may(PermissionModule::Catalogue, PermissionAction::Edit),
                'delete' => $admin->may(PermissionModule::Catalogue, PermissionAction::Delete),
            ],
        ]);
    }

    public function store(BrandRequest $request): RedirectResponse
    {
        $attributes = $request->attributesForBrand();

        $toast = self::saying(static fn (): string => DB::transaction(static function () use ($attributes, $request): string {
            // A removed brand of the same name comes back — with its id, its history and its logo —
            // instead of a second row; and says so, in the toast and in the Protokoll (K2-13). Its name,
            // place and wall setting are what the form says now; only the logo is what it had (K2-34).
            $brand = Brand::onlyTrashed()->where('slug', $attributes['slug'])->latest('deleted_at')->first();

            if ($brand instanceof Brand) {
                $brand->restore();
                $brand->fill($attributes)->save();
                $withLogo = $brand->logo_path !== null && $brand->logo_path !== '';
                AuditTrail::record($request->admin(), 'brand.restored', ['brand_id' => $brand->id, 'name' => $brand->name, 'with_logo' => $withLogo], $brand);

                return $withLogo ? self::RESTORED_WITH_LOGO : self::RESTORED;
            }

            $brand = Brand::query()->create($attributes);
            AuditTrail::record($request->admin(), 'brand.created', ['brand_id' => $brand->id, 'name' => $brand->name], $brand);

            return self::SAVED;
        }));

        return back()->with('toast', $toast);
    }

    public function update(BrandRequest $request, Brand $brand): RedirectResponse
    {
        $attributes = $request->attributesForBrand();

        self::saying(static fn () => DB::transaction(static function () use ($attributes, $request, $brand): void {
            // The brand as it is now, held: a save from a form opened on another state is refused (EditStamp, F-25).
            $locked = Brand::query()->whereKey($brand->id)->lockForUpdate()->firstOrFail();
            EditStamp::guard($request, $locked->only(self::FIELDS));
            $old = $locked->only(self::FIELDS);
            $locked->fill($attributes)->save();
            AuditTrail::record($request->admin(), 'brand.updated', ['brand_id' => $locked->id, 'old' => $old, 'new' => $locked->only(self::FIELDS)], $locked);
        }));

        return back()->with('toast', self::SAVED);
    }

    /**
     * A name another request took in between the check and the write is said under Name — never a
     * server error (K2-01).
     *
     * @template T
     *
     * @param  callable(): T  $write
     * @return T
     */
    private static function saying(callable $write): mixed
    {
        try {
            return $write();
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['name' => 'Diese Marke gibt es schon.']);
        }
    }

    /**
     * Herstellerangaben for GPSR: saved together, audited with the fields that changed — the product page prints
     * them as entered, and a brand without them is named by the preflight.
     */
    public function manufacturer(BrandManufacturerRequest $request, Brand $brand): RedirectResponse
    {
        $attributes = $request->attributesForBrand();

        DB::transaction(static function () use ($attributes, $request, $brand): void {
            EditStamp::guard($request, Brand::query()->whereKey($brand->id)->lockForUpdate()->firstOrFail()->only(Brand::MANUFACTURER_FIELDS));
            $before = $brand->only(Brand::MANUFACTURER_FIELDS);
            $brand->forceFill($attributes)->save();
            $changed = array_keys(array_filter($attributes, static fn ($value, string $key): bool => $value !== $before[$key], ARRAY_FILTER_USE_BOTH));
            AuditTrail::record($request->admin(), 'brand.manufacturer_updated', ['brand_id' => $brand->id, 'name' => $brand->name, 'changed' => $changed, 'complete' => $brand->manufacturer() !== null], $brand);
        });

        return back()->with('toast', self::SAVED);
    }

    public function logo(BrandLogoRequest $request, Brand $brand): RedirectResponse
    {
        $result = $this->logos->store($brand, $request->logo());

        if ($result['refusal'] !== null) {
            return back()->withErrors(['logo' => $result['refusal']]);
        }

        $previous = $brand->logo_path;

        DB::transaction(static function () use ($brand, $result, $request, $previous): void {
            $brand->forceFill(['logo_path' => $result['path']])->save();
            AuditTrail::record($request->admin(), 'brand.logo_changed', ['brand_id' => $brand->id, 'name' => $brand->name, 'had_logo' => $previous !== null], $brand);
        });

        if ($previous !== $result['path']) {
            $this->logos->forget($previous);
        }

        return back()->with('toast', self::LOGO_SAVED);
    }

    public function removeLogo(Request $request, Brand $brand): RedirectResponse
    {
        $this->authorize('update', $brand);
        $previous = $brand->logo_path;

        DB::transaction(static function () use ($brand, $request): void {
            $brand->forceFill(['logo_path' => null])->save();
            AuditTrail::record(self::admin($request), 'brand.logo_removed', ['brand_id' => $brand->id, 'name' => $brand->name], $brand);
        });

        $this->logos->forget($previous);

        return back()->with('toast', self::LOGO_REMOVED);
    }

    public function destroy(Request $request, Brand $brand): RedirectResponse
    {
        $admin = self::admin($request);
        $decision = Gate::forUser($admin)->inspect('delete', $brand);

        // Who may remove brands but hits one still in use is told why, in the Policy's own words —
        // not a „Dafür fehlt dir das Recht“ they do have (K2-16). Who may not remove at all gets 403.
        if ($decision->denied()) {
            if ($admin->may(PermissionModule::Catalogue, PermissionAction::Delete)) {
                throw ValidationException::withMessages(['brand' => (string) $decision->message()]);
            }

            $decision->authorize();
        }

        DB::transaction(static function () use ($brand, $request): void {
            AuditTrail::record(self::admin($request), 'brand.deleted', ['brand_id' => $brand->id, 'name' => $brand->name], $brand);
            $brand->delete();
        });

        return back()->with('toast', self::DELETED);
    }

    /** @return array<string, mixed> */
    private static function row(Brand $brand): array
    {
        $logo = BrandLogos::resolve((string) $brand->slug, $brand->logo_path);

        return [
            'id' => (int) $brand->id,
            'name' => (string) $brand->name,
            'slug' => (string) $brand->slug,
            'isWheelBrand' => (bool) $brand->is_wheel_brand,
            'sortOrder' => (int) $brand->sort_order,
            'logo' => $logo,
            // Set but not drawable: the file is missing or cannot be sized — said, not hidden.
            'logoBroken' => $logo === null && $brand->logo_path !== null && $brand->logo_path !== '',
            // GPSR: what is entered, for the form, and whether the product page can name the manufacturer.
            'manufacturer' => [
                'manufacturerName' => $brand->manufacturer_name,
                'manufacturerAddress' => $brand->manufacturer_address,
                'manufacturerContact' => $brand->manufacturer_contact,
                'euResponsibleName' => $brand->eu_responsible_name,
                'euResponsibleAddress' => $brand->eu_responsible_address,
                'euResponsibleContact' => $brand->eu_responsible_contact,
                'safetyNote' => $brand->safety_note,
            ],
            'manufacturerComplete' => $brand->manufacturer() !== null,
            // The Herstellerangaben as loaded: a save against older ones is refused (EditStamp, the admin audit's F-25).
            'manufacturerStamp' => EditStamp::of($brand->only(Brand::MANUFACTURER_FIELDS)),
            // Name, wall and position as loaded: „Bearbeiten“ sends it back, a save against older ones is refused (F-25).
            'stamp' => EditStamp::of($brand->only(self::FIELDS)),
            'wheels' => (int) $brand->getAttribute('wheel_models_count'),
            'removedWheels' => (int) $brand->getAttribute('removed_wheels_count'),
            'tyres' => (int) $brand->getAttribute('tyre_variants_count'),
        ];
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }
}
