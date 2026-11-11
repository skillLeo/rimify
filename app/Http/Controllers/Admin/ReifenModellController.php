<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Enums\TyreSeason;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\TyreModelImageRequest;
use App\Http\Requests\Admin\TyreModelPhotoOrderRequest;
use App\Http\Requests\Admin\TyreModelRequest;
use App\Http\Requests\Admin\TyreModelViewRequest;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Models\TyreModel;
use App\Models\TyreModelImage;
use App\Models\TyreVariant;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Catalogue\CatalogueBrands;
use App\Services\Admin\Catalogue\TyreList;
use App\Services\Admin\Catalogue\TyreModels;
use App\Services\Storage\ImageUpload;
use App\Services\Storage\PhotoManifest;
use App\Services\Storage\UploadRejected;
use App\Support\EditStamp;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Katalog › Reifen › one model (the Gutachten rework §9): its photographs, its facts and its sizes. A size is opened and saved on its
 * own page, as before (ReifenController); here is what they share. Every change is authorised by TyreModelPolicy (R-11), runs in one
 * transaction and leaves one Protokoll entry.
 */
class ReifenModellController extends Controller
{
    public const SAVED = 'Gespeichert. Das gilt für alle Größen dieses Reifens.';

    public const IMAGE_SAVED = 'Foto gespeichert.';

    public const IMAGE_REMOVED = 'Foto entfernt. Der Shop zeigt wieder die neutrale Reifenzeichnung.';

    public const PHOTO_REMOVED = 'Foto entfernt.';

    public const PHOTOS_ORDERED = 'Reihenfolge gespeichert. Das erste Foto ist das Hauptbild im Shop.';

    public function show(TyreModelViewRequest $request, TyreModel $model): Response|RedirectResponse
    {
        $model->load(['brand', 'images']);
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, $model->title());

        $sizes = $model->sizes()->orderBy('diameter_in')->orderBy('width_mm')->orderBy('aspect')->orderBy('load_index')->orderBy('id')->get();
        $admin = $request->admin();

        return Inertia::render('Admin/Reifen/Modell', [
            'model' => [
                'id' => (int) $model->id,
                'brandId' => (int) $model->brand_id,
                'brand' => (string) ($model->brand->name ?? ''),
                'name' => (string) $model->name,
                'season' => (string) $model->season,
                'title' => $model->title(),
                'demo' => $sizes->contains(static fn (TyreVariant $tyre): bool => (bool) $tyre->is_demo),
                'updated' => GermanFormat::dateTime($sizes->max('updated_at') ?? $model->updated_at),
            ],
            'photos' => $model->images->map(static fn (TyreModelImage $image): array => [
                'id' => (int) $image->id,
                'manifest' => $image->manifest,
                'alt' => $image->alt_de,
            ])->values()->all(),
            'photoOrderStamp' => EditStamp::of(self::photoOrder($model)),
            'maxPhotos' => TyreModels::MAX_PHOTOS,
            'sizes' => $sizes->map(static fn (TyreVariant $tyre): array => [
                'id' => (int) $tyre->id,
                'size' => $tyre->label(),
                'priceCents' => (int) $tyre->price_cents,
                'available' => (bool) $tyre->available,
                'label' => $tyre->missingLabel() === [] ? TyreList::labelSummary($tyre) : null,
                'missingLabel' => $tyre->missingLabel(),
                'eprel' => $tyre->eprel_id,
                'demo' => (bool) $tyre->is_demo,
                'offered' => $tyre->offered(),
                'href' => '/admin/reifen/'.$tyre->id,
            ])->values()->all(),
            // The facts as loaded: a save made on an older state is refused (EditStamp, F-25).
            'stamp' => EditStamp::of(self::facts($model)),
            'brands' => self::brands($model),
            'seasons' => array_map(static fn (TyreSeason $s): array => ['value' => $s->value, 'label' => $s->longLabelDe()], TyreSeason::cases()),
            'can' => self::can($admin),
        ]);
    }

    public function update(TyreModelRequest $request, TyreModel $model, TyreModels $models): RedirectResponse
    {
        $admin = $request->admin();
        $brandId = $request->validated('brand_id');
        $new = $request->validated('brand_new');

        DB::transaction(static function () use ($request, $model, $models, $admin, $brandId, $new): void {
            EditStamp::guard($request, self::facts(TyreModel::query()->whereKey($model->id)->lockForUpdate()->firstOrFail()));

            $brand = CatalogueBrands::resolve($brandId === null ? null : (int) $brandId, is_string($new) && $new !== '' ? $new : null, wheelBrand: false);
            $changed = $models->change($model, $brand, (string) $request->validated('name'), (string) $request->validated('season'));

            AuditTrail::record($admin, 'tyre.model_updated', ['name' => $model->refresh()->loadMissing('brand')->title(), 'changed' => $changed], $model);
        });

        return back()->with('toast', self::SAVED);
    }

    /** One more photograph, after the ones it has. Before the file is stored: a fifth is not kept in the bucket either. */
    public function image(TyreModelImageRequest $request, TyreModel $model, ImageUpload $uploads, TyreModels $models): RedirectResponse
    {
        $file = $request->file('image');

        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages(['image' => 'Bitte wähl ein Foto aus.']);
        }

        if ($models->photoCount($model) >= TyreModels::MAX_PHOTOS) {
            throw ValidationException::withMessages(['image' => TyreModels::FULL]);
        }

        try {
            $stored = $uploads->store($file, 'media_products', 'tyres/'.Str::slug($model->loadMissing('brand')->title()), true);
        } catch (UploadRejected $e) {
            throw ValidationException::withMessages(['image' => $e->getMessage()]);
        }

        DB::transaction(static function () use ($models, $model, $stored, $request): void {
            $models->addPhoto($model, PhotoManifest::of($stored), $request->alt());
            $model->touch();
            AuditTrail::record($request->admin(), 'tyre.image_uploaded', ['name' => $model->title()], $model);
        });

        return back()->with('toast', self::IMAGE_SAVED);
    }

    public function removeImage(TyreModelImageRequest $request, TyreModel $model, TyreModelImage $image, TyreModels $models): RedirectResponse
    {
        abort_unless($image->tyre_model_id === $model->id, 404);

        DB::transaction(static function () use ($models, $image, $model, $request): void {
            $models->removePhoto($image);
            $model->touch();
            AuditTrail::record($request->admin(), 'tyre.image_removed', ['name' => $model->loadMissing('brand')->title()], $model);
        });

        return back()->with('toast', $models->photoCount($model) === 0 ? self::IMAGE_REMOVED : self::PHOTO_REMOVED);
    }

    public function reorderImages(TyreModelPhotoOrderRequest $request, TyreModel $model, TyreModels $models): RedirectResponse
    {
        DB::transaction(static function () use ($models, $model, $request): void {
            // The order as it is now, held: a move from a page in an older order is refused (EditStamp, F-25).
            EditStamp::guard($request, self::photoOrder($model));

            if (! $models->reorderPhotos($model, $request->ids())) {
                throw ValidationException::withMessages(['ids' => TyreModels::STALE]);
            }

            $model->touch();
            AuditTrail::record($request->admin(), 'tyre.images_reordered', ['name' => $model->loadMissing('brand')->title()], $model);
        });

        return back()->with('toast', self::PHOTOS_ORDERED);
    }

    public function relabelImage(TyreModelImageRequest $request, TyreModel $model, TyreModelImage $image): RedirectResponse
    {
        abort_unless($image->tyre_model_id === $model->id, 404);

        DB::transaction(static function () use ($image, $request, $model): void {
            $image->forceFill(['alt_de' => $request->alt()])->save();
            $model->touch();
            AuditTrail::record($request->admin(), 'tyre.image_relabelled', ['name' => $model->loadMissing('brand')->title()], $model);
        });

        return back()->with('toast', 'Gespeichert.');
    }

    /** @return list<int> */
    private static function photoOrder(TyreModel $model): array
    {
        return TyreModelImage::query()->where('tyre_model_id', $model->id)->orderBy('position')->orderBy('id')->pluck('id')->map(static fn ($id): int => (int) $id)->values()->all();
    }

    /** @return array{brand_id: int, name: string, season: string} */
    private static function facts(TyreModel $model): array
    {
        return ['brand_id' => (int) $model->brand_id, 'name' => (string) $model->name, 'season' => (string) $model->season];
    }

    /**
     * Tyre makers, as a size's form offers them; the model's own always stands (the admin audit's F-09).
     *
     * @return list<array{value: int, label: string}>
     */
    private static function brands(TyreModel $model): array
    {
        return Brand::query()
            ->where(static fn ($q) => $q->where('is_wheel_brand', false)->orWhereHas('tyreVariants'))
            ->orWhere('id', $model->brand_id)
            ->orderBy('name')->get(['id', 'name'])
            ->map(static fn (Brand $b): array => ['value' => (int) $b->id, 'label' => (string) $b->name])->values()->all();
    }

    /** @return array{edit: bool, create: bool} */
    private static function can(AdminUser $admin): array
    {
        return [
            'edit' => $admin->may(PermissionModule::Catalogue, PermissionAction::Edit),
            'create' => $admin->may(PermissionModule::Catalogue, PermissionAction::Create),
        ];
    }
}
