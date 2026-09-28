<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BrandLogoRequest;
use App\Http\Requests\Admin\BrandRequest;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Catalogue\BrandLogoStore;
use App\Support\BrandLogos;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function __construct(private readonly BrandLogoStore $logos) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Brand::class);
        $admin = self::admin($request);

        $brands = Brand::query()
            ->withCount(['wheelModels', 'tyreVariants'])
            ->orderBy('sort_order')->orderBy('name')
            ->get()
            ->map(static fn (Brand $brand): array => self::row($brand))
            ->all();

        return Inertia::render('Admin/Marken/Index', [
            'brands' => $brands,
            'can' => [
                'create' => $admin->can('create', Brand::class),
                'update' => $admin->may(PermissionModule::Catalogue, PermissionAction::Edit),
                'delete' => $admin->may(PermissionModule::Catalogue, PermissionAction::Delete),
            ],
        ]);
    }

    public function store(BrandRequest $request): RedirectResponse
    {
        $attributes = $request->attributesForBrand();

        DB::transaction(function () use ($attributes, $request): void {
            // A removed brand of the same name comes back instead of a second row with the same slug.
            $brand = Brand::withTrashed()->where('slug', $attributes['slug'])->first() ?? new Brand;

            if ($brand->trashed()) {
                $brand->restore();
            }

            $brand->fill($attributes)->save();
            AuditTrail::record($request->admin(), 'brand.created', ['brand_id' => $brand->id, 'name' => $brand->name], $brand);
        });

        return back()->with('toast', self::SAVED);
    }

    public function update(BrandRequest $request, Brand $brand): RedirectResponse
    {
        $attributes = $request->attributesForBrand();

        DB::transaction(static function () use ($attributes, $request, $brand): void {
            $old = $brand->only(['name', 'is_wheel_brand', 'sort_order']);
            $brand->fill($attributes)->save();
            AuditTrail::record($request->admin(), 'brand.updated', ['brand_id' => $brand->id, 'old' => $old, 'new' => $brand->only(['name', 'is_wheel_brand', 'sort_order'])], $brand);
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
        $this->authorize('delete', $brand);

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
            'wheels' => (int) $brand->getAttribute('wheel_models_count'),
            'tyres' => (int) $brand->getAttribute('tyre_variants_count'),
        ];
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }
}
