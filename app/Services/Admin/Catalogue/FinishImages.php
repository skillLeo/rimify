<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Models\WheelFinish;
use App\Models\WheelFinishImage;
use Illuminate\Support\Facades\DB;

/**
 * A colour's photographs (COMPLIANCE row 23): any number, in the order a person sets, each with its own
 * alt text. The photos table is the truth; the colour's `image_manifest` is composed from it on every change
 * — the first photo as the cover, the others as its `views` (the product page already shows those as its
 * gallery) — so every reader of the cover stays as it was.
 */
final class FinishImages
{
    /** More would be a catalogue, not a gallery; the product page shows every one as a thumbnail. */
    public const MAX_PER_FINISH = 12;

    public const FULL = 'Diese Farbe hat schon zwölf Fotos. Entferne zuerst eines.';

    public const STALE = 'Die Fotos dieser Farbe haben sich inzwischen geändert. Lade die Seite neu und ordne sie noch einmal.';

    /**
     * @param  array<string, mixed>  $manifest
     */
    public function add(WheelFinish $finish, array $manifest, string $alt): WheelFinishImage
    {
        return DB::transaction(function () use ($finish, $manifest, $alt): WheelFinishImage {
            $next = (int) WheelFinishImage::query()->where('wheel_finish_id', $finish->id)->lockForUpdate()->max('position') + 1;
            unset($manifest['views']);

            $image = WheelFinishImage::query()->create([
                'wheel_finish_id' => $finish->id,
                'position' => $next,
                'manifest' => $manifest,
                'alt_de' => $alt,
            ]);

            $this->compose($finish);

            return $image;
        });
    }

    public function remove(WheelFinishImage $image): void
    {
        DB::transaction(function () use ($image): void {
            $finish = $image->finish()->firstOrFail();
            // The file stays in the bucket: an order confirmation or a cached page may still point at it.
            $image->delete();
            $this->renumber($finish);
            $this->compose($finish);
        });
    }

    /**
     * The colour's photos in the order given. Refused (false) unless the ids are exactly this colour's
     * photos, each once — a stale page never reorders a set it has not seen.
     *
     * @param  list<int>  $ids
     */
    public function reorder(WheelFinish $finish, array $ids): bool
    {
        return DB::transaction(function () use ($finish, $ids): bool {
            $current = WheelFinishImage::query()->where('wheel_finish_id', $finish->id)->lockForUpdate()->pluck('id')->map(static fn ($id): int => (int) $id)->sort()->values()->all();
            $given = $ids;
            sort($given);

            if ($given !== $current) {
                return false;
            }

            foreach ($ids as $index => $id) {
                WheelFinishImage::query()->whereKey($id)->update(['position' => $index + 1]);
            }

            $this->compose($finish);

            return true;
        });
    }

    public function relabel(WheelFinishImage $image, string $alt): void
    {
        DB::transaction(function () use ($image, $alt): void {
            $image->forceFill(['alt_de' => $alt])->save();
            $this->compose($image->finish()->firstOrFail());
        });
    }

    public function count(WheelFinish $finish): int
    {
        return WheelFinishImage::query()->where('wheel_finish_id', $finish->id)->count();
    }

    /**
     * The colour's cover from its photos: the first as the manifest itself, the rest as its views — each
     * carrying the sentence a person wrote for it as its `alt` (and as its thumbnail's `label`). No photo
     * left: no cover — a drawn placeholder is never brought back here.
     */
    public function compose(WheelFinish $finish): void
    {
        $images = WheelFinishImage::query()->where('wheel_finish_id', $finish->id)->orderBy('position')->orderBy('id')->get();
        $named = static fn (WheelFinishImage $image): array => [...$image->manifest, 'label' => $image->alt_de, 'alt' => $image->alt_de];

        if ($images->isEmpty()) {
            $manifest = is_array($finish->image_manifest) ? $finish->image_manifest : null;

            // A placeholder drawing (example data) stays; an uploaded photo whose rows are gone does not.
            if ($manifest !== null && ($manifest['kind'] ?? null) === 'photo') {
                $finish->forceFill(['image_manifest' => null, 'image_alt_de' => null])->save();
            }

            return;
        }

        $first = $images->first();
        $cover = $named($first);
        $views = $images->slice(1)->map($named)->values()->all();

        if ($views !== []) {
            $cover['views'] = $views;
        }

        $finish->forceFill(['image_manifest' => $cover, 'image_alt_de' => $first->alt_de])->save();
    }

    private function renumber(WheelFinish $finish): void
    {
        $ids = WheelFinishImage::query()->where('wheel_finish_id', $finish->id)->orderBy('position')->orderBy('id')->pluck('id');

        foreach ($ids->values() as $index => $id) {
            WheelFinishImage::query()->whereKey($id)->update(['position' => $index + 1]);
        }
    }
}
