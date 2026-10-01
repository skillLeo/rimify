<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\CatalogueStatus;
use App\Models\Brand;
use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use Illuminate\Database\Seeder;

/**
 * The golden record's wheel (Block D, item 12): the Borbet DB8GT2 as the client sent it on 27.09.2026 —
 * a real product, never demo data.
 *
 * Both sizes, both colours, the four official photographs (database/seeders/content/wheel-photos.php).
 * Every figure is the document's where a document states it, and the client's where none does
 * (docs/review/DATA-CONFLICTS.md):
 *
 * - 8,5J × 18 H2, ET 35, LK 5/120, Mittenloch 72,5 mm, Radlast 650 kg — Gutachten 366-0350-21-WIRD/N1,
 *   page 1 (a Nachtrag to ABE 53841; KBA 53841 is the number on the wheel);
 * - 8,5J × 19 H2, ET 35, LK 5/120, Mittenloch 72,6 mm, Radlast 700 kg — ABE 55255, Anlage 19, page 1;
 * - weight 8,8 / 9,6 kg and the description: the client's (the manufacturer's statement).
 *
 * No price came with it, and none is made up: the model stays a draft (Entwurf) with its prices at
 * zero until a person enters them in Katalog › Felgen — the admin refuses to publish a size without
 * a price. Until then the storefront lists nothing of it; the hero shows its photograph and its
 * values, without a price and without a link.
 *
 * The hero names it when nobody has chosen a hero product yet (the operator's brief of 28.09.2026:
 * "the hero shows a wheel we actually sell, with a real ABE behind it"); a choice already made stands.
 *
 * Idempotent: found by slug, sizes by their values, so a re-run updates in place and a person's price,
 * stock or publication is never undone.
 */
class GoldenRecordSeeder extends Seeder
{
    public const SLUG = 'borbet-db8gt2';

    /** Name, swatch (measured on the photographs), palette, sort order. */
    private const FINISHES = [
        ['Schwarz matt', '#1C1D1F', 'black', 0],
        ['Bronze matt', '#8F6E4C', 'bronze', 10],
    ];

    /** Diameter, KBA number on the wheel, bore, Radlast, weight in grams. */
    private const SIZES = [
        [18.0, '53841', 72.50, 650, 8_800],
        [19.0, '55255', 72.60, 700, 9_600],
    ];

    private const DESCRIPTION = 'Aufs Wesentliche reduziert: maximaler Fahrspaß bei minimalem Gewicht – die Borbet DB8GT2 '
        .'ist das ikonische Sechsspeichenrad für japanische und deutsche Modern Classics. Gegossen, 8,8 kg (18 Zoll) '
        .'und 9,6 kg (19 Zoll) je Rad (Herstellerangaben).';

    public function run(): void
    {
        $brand = Brand::withTrashed()->where('slug', 'borbet')->first()
            ?? new Brand(['slug' => 'borbet', 'name' => 'BORBET']);
        $brand->is_wheel_brand = true;
        $brand->deleted_at = null;
        $brand->save();

        $model = WheelModel::withTrashed()->where('slug', self::SLUG)->first();
        $new = $model === null;
        $model ??= new WheelModel(['slug' => self::SLUG]);

        $model->fill([
            'brand_id' => $brand->id,
            'name' => 'DB8GT2',
            'spoke_count' => 6,
            'description_de' => $model->description_de ?? self::DESCRIPTION,
            'is_demo' => false,
        ]);

        // A new record starts as a draft; a status a person set later is theirs.
        if ($new) {
            $model->status = CatalogueStatus::Draft;
        }

        $model->deleted_at = null;
        $model->save();

        foreach (self::FINISHES as [$name, $hex, $palette, $order]) {
            $finish = WheelFinish::withTrashed()->where('wheel_model_id', $model->id)->where('name_de', $name)->first()
                ?? new WheelFinish(['wheel_model_id' => $model->id, 'name_de' => $name]);
            $finish->fill(['hex' => $hex, 'art_finish' => $palette, 'sort_order' => $order]);
            $finish->deleted_at = null;
            $finish->save();

            foreach (self::SIZES as [$diameter, $kba, $bore, $load, $weight]) {
                $config = WheelConfig::withTrashed()->firstOrNew([
                    'wheel_model_id' => $model->id,
                    'wheel_finish_id' => $finish->id,
                    'diameter_in' => $diameter,
                    'width_in' => 8.5,
                    'et_mm' => 35,
                    'bolt_circle_mm' => 120.0,
                ]);

                $config->fill([
                    'bolt_holes' => 5,
                    'centre_bore_mm' => $bore,
                    'hump' => 'H2',
                    'bead_profile' => 'J',
                    'kba_number' => $kba,
                    'sku' => sprintf('BOR-DB8GT2-85%d-%s', (int) $diameter, $palette === 'black' ? 'SM' : 'BM'),
                    'currency' => 'EUR',
                    'weight_g' => $weight,
                    'max_load_kg' => $load,
                ]);

                // No price was sent: zero marks "not priced yet" and keeps the size unpublishable. A
                // price a person entered is never overwritten.
                if (! $config->exists) {
                    $config->price_cents = 0;
                    $config->stock_qty = 0;
                }

                $config->deleted_at = null;
                $config->save();
            }
        }

        CatalogueSeeder::attachMappedPhotographs();

        // The hero names this wheel unless a person chose another real one. A choice that names a demonstration model,
        // a model that is gone or one that is archived is no choice: ContentSeeder clears it right after this seeder,
        // and checking only for „none" here left the hero empty on a database seeded before the demo catalogue left
        // the storefront — the preview lost its hero photograph and the numbers section that way (D-089).
        if (! self::realChoice(Setting::get('hero_product_id'))) {
            Setting::set('hero_product_id', (int) $model->id);
        }
    }

    /** Whether the hero setting names a real wheel a person chose: one that exists, is no demo and is not archived. */
    private static function realChoice(mixed $chosen): bool
    {
        if (! is_int($chosen) && ! (is_string($chosen) && ctype_digit($chosen))) {
            return false;
        }

        $model = WheelModel::query()->find((int) $chosen);

        return $model !== null && ! $model->is_demo && $model->status !== CatalogueStatus::Archived;
    }
}
