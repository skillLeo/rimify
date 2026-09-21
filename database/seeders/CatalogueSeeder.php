<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\CatalogueStatus;
use App\Models\Brand;
use App\Models\LoadIndexEntry;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Support\MakeName;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Twelve wheel models, deliberately uneven.
 *
 * A demo catalogue where every product is in stock, unconditioned and identically priced proves
 * nothing: it is exactly the dataset under which a listing page looks finished and then falls over
 * on the client's own data. So two models are out of stock, the spoke counts and palettes differ
 * per model so the drawn grid reads as a real catalogue rather than one wheel twelve times, and
 * the prices span the whole 689,00 – 1.196,00 € band the spec names.
 *
 * Ratings are stored, not computed. There is no review table yet, and a star figure recalculated
 * on every listing render would be the slowest join on the busiest page for a number that changes
 * once a week.
 */
class CatalogueSeeder extends Seeder
{
    /**
     * brand => [name, type designation, spokes, rating, rating count, [finish, hex, palette], sizes]
     *
     * @var list<array{
     *     brand: string,
     *     name: string,
     *     type: string,
     *     spokes: int,
     *     rating: float,
     *     ratings: int,
     *     finishes: list<array{0: string, 1: string, 2: string}>,
     *     sizes: list<array{0: float, 1: float, 2: int, 3: float}>,
     *     stock: int
     * }>
     */
    private const MODELS = [
        [
            'brand' => 'BORBET', 'name' => 'Havanna', 'type' => 'BO-HV',
            'spokes' => 5, 'rating' => 4.8, 'ratings' => 555,
            'finishes' => [
                ['Graphite matt', '#3A3E45', 'graphite'],
                ['Schwarz glänzend', '#1A1C20', 'black'],
                ['Silber', '#C3C8CF', 'silver'],
            ],
            'sizes' => [[8.0, 18.0, 35, 689.00], [8.5, 18.0, 35, 729.00], [9.0, 19.0, 40, 849.00]],
            'stock' => 12,
        ],
        [
            // Out of stock, on purpose: the card, the chip and the disabled action all have to
            // hold up without a single unit behind them.
            'brand' => 'BORBET', 'name' => 'LV5', 'type' => 'BO-LV5',
            'spokes' => 10, 'rating' => 4.4, 'ratings' => 212,
            'finishes' => [
                ['Schwarz matt', '#1A1C20', 'black'],
                ['Silber', '#C3C8CF', 'silver'],
            ],
            'sizes' => [[7.5, 17.0, 38, 719.00], [8.0, 18.0, 35, 799.00]],
            'stock' => 0,
        ],
        [
            'brand' => 'OZ RACING', 'name' => 'Superturismo GT', 'type' => 'OZ-STG',
            'spokes' => 10, 'rating' => 4.9, 'ratings' => 831,
            'finishes' => [
                ['Matt Race Silber', '#C3C8CF', 'silver'],
                ['Schwarz matt', '#1A1C20', 'black'],
            ],
            'sizes' => [[8.0, 18.0, 35, 969.00], [8.5, 18.0, 40, 1019.00], [9.0, 19.0, 42, 1196.00]],
            'stock' => 8,
        ],
        [
            'brand' => 'OZ RACING', 'name' => 'Ultraleggera', 'type' => 'OZ-UL',
            'spokes' => 7, 'rating' => 4.7, 'ratings' => 402,
            'finishes' => [
                ['Graphite matt', '#3A3E45', 'graphite'],
                ['Poliert', '#D5DAE0', 'polished'],
            ],
            'sizes' => [[8.0, 18.0, 38, 1049.00], [8.5, 19.0, 42, 1149.00]],
            'stock' => 6,
        ],
        [
            'brand' => 'ALUTEC', 'name' => 'Monstr', 'type' => 'AL-MST',
            'spokes' => 5, 'rating' => 4.3, 'ratings' => 188,
            'finishes' => [
                ['Racing Schwarz', '#1A1C20', 'black'],
                ['Graphite matt', '#3A3E45', 'graphite'],
            ],
            'sizes' => [[8.0, 18.0, 40, 699.00], [8.5, 19.0, 45, 789.00]],
            'stock' => 21,
        ],
        [
            'brand' => 'ALUTEC', 'name' => 'Grip', 'type' => 'AL-GRP',
            'spokes' => 5, 'rating' => 4.2, 'ratings' => 96,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Polar Silber', '#D5DAE0', 'polished'],
            ],
            'sizes' => [[7.0, 16.0, 38, 689.00], [7.5, 17.0, 38, 739.00]],
            'stock' => 34,
        ],
        [
            'brand' => 'BBS', 'name' => 'CI-R', 'type' => 'BBS-CIR',
            'spokes' => 10, 'rating' => 4.9, 'ratings' => 1204,
            'finishes' => [
                ['Platinum Silber', '#C3C8CF', 'silver'],
                ['Satin Schwarz', '#1A1C20', 'black'],
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.0, 18.0, 44, 1096.00], [8.5, 19.0, 44, 1149.00], [9.0, 19.0, 42, 1196.00]],
            'stock' => 4,
        ],
        [
            'brand' => 'BBS', 'name' => 'SR', 'type' => 'BBS-SR',
            'spokes' => 10, 'rating' => 4.6, 'ratings' => 318,
            'finishes' => [
                ['Himalaya Grau', '#3A3E45', 'graphite'],
                ['Volcano Grau', '#3A3E45', 'graphite'],
            ],
            'sizes' => [[8.0, 18.0, 45, 899.00], [8.5, 18.0, 40, 949.00]],
            'stock' => 15,
        ],
        [
            'brand' => 'YIDO', 'name' => 'Performance 1', 'type' => 'YD-P1',
            'spokes' => 20, 'rating' => 4.5, 'ratings' => 143,
            'finishes' => [
                ['Schwarz poliert', '#1A1C20', 'black'],
                ['Silber', '#C3C8CF', 'silver'],
            ],
            'sizes' => [[8.5, 19.0, 35, 829.00], [9.5, 19.0, 40, 899.00]],
            'stock' => 9,
        ],
        [
            // The second out-of-stock model.
            'brand' => 'YIDO', 'name' => 'Performance 2', 'type' => 'YD-P2',
            'spokes' => 20, 'rating' => 4.4, 'ratings' => 77,
            'finishes' => [
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.5, 19.0, 42, 869.00], [9.5, 20.0, 45, 1049.00]],
            'stock' => 0,
        ],
        [
            'brand' => 'Rotiform', 'name' => 'KPS', 'type' => 'RF-KPS',
            'spokes' => 5, 'rating' => 4.7, 'ratings' => 265,
            'finishes' => [
                ['Gloss Schwarz', '#1A1C20', 'black'],
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.5, 19.0, 35, 949.00], [9.0, 19.0, 40, 989.00]],
            'stock' => 7,
        ],
        [
            'brand' => 'Rotiform', 'name' => 'BLQ', 'type' => 'RF-BLQ',
            'spokes' => 7, 'rating' => 4.6, 'ratings' => 331,
            'finishes' => [
                ['Silber gebürstet', '#D5DAE0', 'polished'],
                ['Schwarz matt', '#1A1C20', 'black'],
            ],
            'sizes' => [[8.0, 18.0, 35, 779.00], [8.5, 18.0, 45, 819.00]],
            'stock' => 18,
        ],
    ];

    public function run(): void
    {
        // Guarded on the data, never on `callOnce`. Laravel tracks callOnce in a PROCESS-STATIC
        // array, so under RefreshDatabase the second test in a run is told the seeder already ran
        // while its transaction has just rolled the rows away — leaving an empty catalogue and a
        // failure nowhere near its cause.
        if (LoadIndexEntry::query()->doesntExist()) {
            $this->call(ReferenceDataSeeder::class);
        }

        $brands = $this->seedBrands();
        $this->seedWheels($brands);
        $this->seedTyres($brands);
    }

    /** @return array<string, Brand> */
    private function seedBrands(): array
    {
        $names = [
            'BORBET', 'OZ RACING', 'ALUTEC', 'BBS', 'YIDO', 'Rotiform',
            'Bridgestone', 'Continental', 'Michelin',
        ];

        $brands = [];
        $sort = 0;

        foreach ($names as $name) {
            // One spelling per brand, compared without regard to case: "rotiform" and "Rotiform"
            // are the same brand and must never become two rows (docs/phase0/ADDENDUM.md D5).
            $spelling = MakeName::normalise($name);
            $existing = Brand::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($spelling)])->first();

            $brands[$name] = Brand::updateOrCreate(
                ['slug' => $existing === null ? Str::slug($spelling) : $existing->slug],
                ['name' => $spelling, 'sort_order' => $sort += 10],
            );
        }

        return $brands;
    }

    /** @param array<string, Brand> $brands */
    private function seedWheels(array $brands): void
    {
        $sku = 0;

        foreach (self::MODELS as $spec) {
            $model = WheelModel::updateOrCreate(
                ['slug' => Str::slug($spec['brand'].'-'.$spec['name'])],
                [
                    'brand_id' => $brands[$spec['brand']]->id,
                    'name' => $spec['name'],
                    'type_designation' => $spec['type'],
                    'spoke_count' => $spec['spokes'],
                    'rating' => $spec['rating'],
                    'rating_count' => $spec['ratings'],
                    'status' => CatalogueStatus::Published->value,
                ],
            );

            foreach ($spec['finishes'] as $order => [$finishName, $hex, $palette]) {
                $finish = WheelFinish::updateOrCreate(
                    ['wheel_model_id' => $model->id, 'name_de' => $finishName],
                    ['hex' => $hex, 'art_finish' => $palette, 'sort_order' => $order * 10],
                );

                foreach ($spec['sizes'] as $sizeOrder => [$width, $diameter, $et, $euro]) {
                    $sku++;

                    // A darker or polished finish carries a small surcharge, which is true of the
                    // real catalogue and is also what makes the swatch row worth looking at.
                    $surcharge = match ($palette) {
                        'polished' => 4_000,
                        'bronze' => 3_000,
                        'black' => 1_500,
                        default => 0,
                    };

                    WheelConfig::updateOrCreate(
                        [
                            'wheel_model_id' => $model->id,
                            'wheel_finish_id' => $finish->id,
                            'diameter_in' => $diameter,
                            'width_in' => $width,
                            'et_mm' => $et,
                            'bolt_circle_mm' => 112.0,
                        ],
                        [
                            'bolt_holes' => 5,
                            'centre_bore_mm' => 66.60,
                            'hump' => 'H2',
                            'bead_profile' => 'J',
                            'kba_number' => sprintf('%05d', 46_000 + $sku),
                            'sku' => sprintf('RMF-%06d', $sku),
                            'price_cents' => (int) round($euro * 100) + $surcharge,
                            'currency' => 'EUR',
                            // Stock varies per size so a size chip can be sold out while the
                            // model is not — which is the case the PDP has to get right.
                            'stock_qty' => $spec['stock'] === 0
                                ? 0
                                : max(0, $spec['stock'] - $sizeOrder * 3 - $order),
                            'weight_g' => 9_400 + (int) ($diameter * 260) + (int) ($width * 120),
                        ],
                    );
                }
            }
        }
    }

    /**
     * Six tyres. `speed_rank` is seeded alongside `speed_symbol` because every comparison in the
     * engine uses the rank: H sits between U and V, so comparing the letters is code that reads
     * correct and is wrong in the permissive direction (R-05).
     *
     * @param  array<string, Brand>  $brands
     */
    private function seedTyres(array $brands): void
    {
        // Label classes and noise as printed on the EU label; the EPREL id is the register entry
        // the label links to, and it is null until the real one is known.
        $tyres = [
            ['Bridgestone', 'Potenza Sport', 'sommer', 245, 45, 18.0, 100, 'Y', 13, 'C', 'A', 71, 'B', null],
            ['Continental', 'PremiumContact 7', 'sommer', 245, 45, 18.0, 96, 'W', 12, 'B', 'A', 70, 'B', null],
            ['Michelin', 'Pilot Sport 5', 'sommer', 245, 45, 18.0, 92, 'Y', 13, 'C', 'A', 72, 'B', null],
            ['Bridgestone', 'Blizzak LM005', 'winter', 245, 45, 18.0, 100, 'V', 11, 'C', 'B', 72, 'B', null],
            ['Continental', 'AllSeasonContact 2', 'ganzjahres', 255, 40, 19.0, 100, 'Y', 13, 'C', 'B', 72, 'B', null],
            ['Michelin', 'Pilot Sport 4 S', 'sommer', 255, 40, 19.0, 100, 'Y', 13, 'D', 'A', 73, 'C', null],
        ];

        foreach ($tyres as [$brand, $name, $season, $width, $aspect, $diameter, $load, $symbol, $rank, $fuel, $grip, $noise, $noiseClass, $eprelId]) {
            TyreVariant::updateOrCreate(
                [
                    'brand_id' => $brands[$brand]->id,
                    'name' => $name,
                    'width_mm' => $width,
                    'aspect' => $aspect,
                    'diameter_in' => $diameter,
                ],
                [
                    'season' => $season,
                    'load_index' => $load,
                    'speed_symbol' => $symbol,
                    'speed_rank' => $rank,
                    'eu_fuel_class' => $fuel,
                    'eu_wet_grip_class' => $grip,
                    'eu_noise_db' => $noise,
                    'eu_noise_class' => $noiseClass,
                    'eprel_id' => $eprelId,
                    'price_cents' => 14_900 + $load * 90,
                    'currency' => 'EUR',
                    'stock_qty' => 24,
                ],
            );
        }
    }
}
