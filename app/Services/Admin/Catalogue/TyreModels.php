<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Models\Brand;
use App\Models\TyreModel;
use App\Models\TyreModelImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Tyre models (the Gutachten rework §9, D-407): one for every brand, name and season its sizes carry, its photographs and its facts.
 * The sizes keep those three themselves, for everything that reads a tyre; changing them on the model changes them on every size,
 * in one transaction, and nowhere else. A model comes into being with its first size, by whatever road the size came.
 */
final class TyreModels
{
    /** The shop shows them side by side in the details: Seite, Lauffläche, Profil, schräg. */
    public const MAX_PHOTOS = 4;

    public const FULL = 'Dieses Reifenmodell hat schon vier Fotos. Entferne zuerst eines.';

    public const STALE = 'Die Fotos dieses Reifenmodells haben sich inzwischen geändert. Lade die Seite neu und ordne sie noch einmal.';

    public const TAKEN = 'Dieses Reifenmodell gibt es schon. Ändere dort, was du brauchst, oder wähl einen anderen Namen.';

    /** A row for every model a live size names, however the size was made: one statement, safe to repeat. */
    public function sync(): void
    {
        $now = now();

        DB::table('tyre_models')->insertOrIgnoreUsing(
            ['brand_id', 'name', 'season', 'created_at', 'updated_at'],
            DB::table('tyre_variants')->whereNull('deleted_at')->distinct()->select('brand_id', 'name', 'season')->selectRaw('? as created_at, ? as updated_at', [$now, $now]),
        );
    }

    /**
     * New facts for the model and every one of its sizes. A model of those three that has sizes of its own is refused: two models
     * would become one by accident. One without any gives way, unless it still holds photographs.
     *
     * @return list<string> the facts that changed
     */
    public function change(TyreModel $model, Brand $brand, string $name, string $season): array
    {
        return DB::transaction(function () use ($model, $brand, $name, $season): array {
            $other = TyreModel::query()->where('brand_id', $brand->id)->where('name', $name)->where('season', $season)->whereKeyNot($model->id)->lockForUpdate()->first();

            if ($other !== null) {
                if ($other->sizes()->exists() || $other->images()->exists()) {
                    throw ValidationException::withMessages(['name' => self::TAKEN]);
                }

                $other->delete();
            }

            $sizes = $model->sizes()->withTrashed();
            $sizes->update(['brand_id' => $brand->id, 'name' => $name, 'season' => $season]);

            $model->fill(['brand_id' => $brand->id, 'name' => $name, 'season' => $season]);
            $changed = array_keys($model->getDirty());
            $model->save();

            return array_values(array_diff($changed, ['updated_at']));
        });
    }

    /** @param  array<string, mixed>  $manifest */
    public function addPhoto(TyreModel $model, array $manifest, string $alt): TyreModelImage
    {
        return DB::transaction(function () use ($model, $manifest, $alt): TyreModelImage {
            // Counted under the model's own row lock: two tabs at three photos never make five.
            TyreModel::query()->whereKey($model->id)->lockForUpdate()->first();
            $existing = TyreModelImage::query()->where('tyre_model_id', $model->id);

            if ($existing->count() >= self::MAX_PHOTOS) {
                throw ValidationException::withMessages(['image' => self::FULL]);
            }

            return TyreModelImage::query()->create([
                'tyre_model_id' => $model->id,
                'position' => (int) $existing->max('position') + 1,
                'manifest' => $manifest,
                'alt_de' => $alt,
            ]);
        });
    }

    public function photoCount(TyreModel $model): int
    {
        return TyreModelImage::query()->where('tyre_model_id', $model->id)->count();
    }

    public function removePhoto(TyreModelImage $image): void
    {
        DB::transaction(function () use ($image): void {
            $modelId = $image->tyre_model_id;
            // The file stays in the bucket, as a rim's: a cached page may still point at it.
            $image->delete();

            foreach (TyreModelImage::query()->where('tyre_model_id', $modelId)->orderBy('position')->orderBy('id')->pluck('id')->values() as $index => $id) {
                TyreModelImage::query()->whereKey($id)->update(['position' => $index + 1]);
            }
        });
    }

    /**
     * The photos in the order given. Refused (false) unless the ids are exactly this model's, each once: a stale page never
     * reorders a set it has not seen.
     *
     * @param  list<int>  $ids
     */
    public function reorderPhotos(TyreModel $model, array $ids): bool
    {
        return DB::transaction(function () use ($model, $ids): bool {
            $current = TyreModelImage::query()->where('tyre_model_id', $model->id)->lockForUpdate()->pluck('id')->map(static fn ($id): int => (int) $id)->sort()->values()->all();
            $given = $ids;
            sort($given);

            if ($given !== $current) {
                return false;
            }

            foreach ($ids as $index => $id) {
                TyreModelImage::query()->whereKey($id)->update(['position' => $index + 1]);
            }

            return true;
        });
    }

    /**
     * The photographs of the models these sizes belong to, for the shop: size id → manifests with their sentence, first the cover.
     * A size whose model has none is not in the answer: the page draws a neutral silhouette, never another tyre's photograph.
     *
     * @param  list<int>  $variantIds
     * @return array<int, list<array<string, mixed>>>
     */
    public function photosOf(array $variantIds): array
    {
        if ($variantIds === []) {
            return [];
        }

        $rows = DB::table('tyre_variants as v')
            ->join('tyre_models as m', static fn ($join) => $join->on('m.brand_id', '=', 'v.brand_id')->on('m.name', '=', 'v.name')->on('m.season', '=', 'v.season'))
            ->join('tyre_model_images as i', 'i.tyre_model_id', '=', 'm.id')
            ->whereIn('v.id', $variantIds)
            ->orderBy('i.position')
            ->orderBy('i.id')
            ->get(['v.id as variant_id', 'i.manifest', 'i.alt_de']);
        $out = [];

        foreach ($rows as $row) {
            $manifest = json_decode((string) $row->manifest, true);

            if (is_array($manifest)) {
                $out[(int) $row->variant_id][] = [...$manifest, 'alt' => (string) $row->alt_de, 'label' => (string) $row->alt_de];
            }
        }

        return $out;
    }
}
