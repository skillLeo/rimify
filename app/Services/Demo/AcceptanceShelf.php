<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Enums\CatalogueStatus;
use Illuminate\Support\Facades\DB;

/**
 * Demonstration rims for the client's preview (the operator's brief of 29.10.2026, §0: every item visible with the data
 * on the preview, made by us where it is missing and marked as demo), written by `rimify:demo --abnahme --regal`.
 *
 * The acceptance set sells one model; the homepage's shelf shows itself from four and holds eight (the client's #5,
 * D-353). Three models „Regal-Beispiel 1–3 (Demo)“ of the brand „RIMIFY Demo“, each in two finishes and one size, make
 * eight rims with the set's two. No photograph — the shop draws the outline and says „Platzhalterbild · kein Produktfoto“
 * (CLAUDE.md §5: placeholder imagery for demo entries only) — and no Gutachten: no car is ever told one fits. For the
 * client's other points on the same rims: stars typed for one (#19, D-345) and one colour of another not available
 * (admin item 7, D-350). Every row born demo under `abnahme:regal:` — System › Zurücksetzen › Demodaten takes it away
 * with the rest of the set; written again, it writes nothing twice.
 */
final class AcceptanceShelf
{
    public const PREFIX = AcceptanceSet::PREFIX.'regal:';

    /** Number => name, spokes, diameter, width, ET, price per rim in cents. */
    private const MODELS = [
        1 => ['Regal-Beispiel 1 (Demo)', 5, 18.0, 8.0, 40, 19_900],
        2 => ['Regal-Beispiel 2 (Demo)', 10, 18.0, 8.0, 35, 21_900],
        3 => ['Regal-Beispiel 3 (Demo)', 7, 19.0, 8.5, 45, 24_900],
    ];

    /** Name, swatch, palette, sort order, SKU code. */
    private const FINISHES = [
        ['Silber', '#C9CDD2', 'silver', 0, 'SI'],
        ['Graphit', '#4A4D52', 'graphite', 10, 'GR'],
    ];

    /** The demo stars on model 1 (#19): typed, as the admin types them — beside the shop's sentence about them. */
    private const STARS = ['rating' => 4.7, 'count' => 12];

    /** The model whose second colour is not available (admin item 7): its card and its page offer „Anfrage“. */
    private const UNAVAILABLE = 3;

    /** @return array<string, int> rows written, by table */
    public function seed(): array
    {
        // Never in production, nor wherever demo data is off — as the acceptance set itself.
        DemoGuard::ensure();

        $counts = [];

        return DB::transaction(function () use (&$counts): array {
            $brandId = $this->brand($counts);

            foreach (self::MODELS as $n => [$name, $spokes, $diameter, $width, $et, $price]) {
                $ref = self::PREFIX.'wheel:'.$n;

                if (DB::table('wheel_models')->where('demo_ref', $ref)->exists()) {
                    continue;
                }

                $modelId = (int) DB::table('wheel_models')->insertGetId([
                    'brand_id' => $brandId,
                    'name' => $name,
                    'slug' => 'regal-beispiel-'.$n.'-demo',
                    'spoke_count' => $spokes,
                    'description_de' => 'Eine Beispielfelge für die Vorschau: kein echtes Produkt, kein Foto, kein Gutachten.',
                    'internal_note' => 'Demodaten für die Vorschau (rimify:demo --abnahme --regal). Entfernen: System › Zurücksetzen › Demodaten.',
                    'status' => CatalogueStatus::Published->value,
                    'stated_rating' => $n === 1 ? self::STARS['rating'] : null,
                    'stated_rating_count' => $n === 1 ? self::STARS['count'] : null,
                    'rating_count' => 0,
                    'is_demo' => true,
                    'demo_ref' => $ref,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $counts['wheel_models'] = ($counts['wheel_models'] ?? 0) + 1;

                foreach (self::FINISHES as $i => [$finish, $hex, $palette, $order, $code]) {
                    $finishId = (int) DB::table('wheel_finishes')->insertGetId([
                        'wheel_model_id' => $modelId,
                        'name_de' => $finish,
                        'hex' => $hex,
                        'art_finish' => $palette,
                        'sort_order' => $order,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $counts['wheel_finishes'] = ($counts['wheel_finishes'] ?? 0) + 1;

                    DB::table('wheel_configs')->insert([
                        'wheel_model_id' => $modelId,
                        'wheel_finish_id' => $finishId,
                        'diameter_in' => $diameter,
                        'width_in' => $width,
                        'et_mm' => $et,
                        'bolt_holes' => 5,
                        'bolt_circle_mm' => 112.0,
                        'centre_bore_mm' => 66.6,
                        'sku' => sprintf('DEMO-REGAL-%d-%s', $n, $code),
                        'price_cents' => $price,
                        'currency' => 'EUR',
                        'stock_qty' => 0,
                        'available' => ! ($n === self::UNAVAILABLE && $i === 1),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $counts['wheel_configs'] = ($counts['wheel_configs'] ?? 0) + 1;
                }
            }

            return $counts;
        });
    }

    /** @param  array<string, int>  $counts */
    private function brand(array &$counts): int
    {
        $existing = DB::table('brands')->where('demo_ref', self::PREFIX.'brand')->value('id');

        if ($existing !== null) {
            return (int) $existing;
        }

        $counts['brands'] = 1;

        return (int) DB::table('brands')->insertGetId([
            'name' => 'RIMIFY Demo',
            'slug' => 'rimify-demo',
            'is_wheel_brand' => true,
            'sort_order' => 990,
            'is_demo' => true,
            'demo_ref' => self::PREFIX.'brand',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
