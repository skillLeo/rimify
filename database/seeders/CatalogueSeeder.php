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
use App\Support\DemoWheels;
use App\Support\MakeName;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Twenty-one wheel models, deliberately uneven, every one of them flagged `is_demo`.
 *
 * A demo catalogue where every product is in stock, unconditioned and identically priced proves
 * nothing: it is exactly the dataset under which a listing page looks finished and then falls over
 * on the client's own data. So two models are out of stock, the spoke counts and palettes differ
 * per model so the grid reads as a real catalogue rather than one wheel twenty times, the bolt
 * patterns span the German market (5 × 112, 5 × 120, 5 × 108, 5 × 114,3), and the prices run from
 * 479,00 € to 1.196,00 €.
 *
 * A real brand or model name appears only on a photograph of that exact product
 * (docs/phase0/ACCURACY.md D1). The MOTEC MCR4 Ultimate keeps its name because its photographs are
 * the client's own studio shots, and its finish, sizes, KBA numbers, loads and weights are only the
 * values the research report verified (docs/reviews/accuracy-research-motec.md): anything it could
 * not verify is NULL and does not render. Every other model is a neutral demonstration wheel under
 * the brand `Demo`, named for its spoke pattern and numbered in model order ("Fünfspeiche F-01").
 * No demo model carries a type designation, a KBA number or a rating: there is no document behind
 * them and no review table, and an invented one would be confidently wrong (CLAUDE.md §2).
 *
 * The renames happen IN PLACE. A model is found by its slug or by the slug it had before
 * (`formerSlug`), a finish by its name or its former name, so a database seeded before the rename
 * keeps every id, SKU, configuration and fitment, and a second run changes nothing.
 *
 * The first twelve models are kept exactly as first seeded — same order, same finishes, same
 * sizes — because their configurations' SKUs are numbered in sequence and the fitment seeds hang
 * off those rows. New models are appended, never inserted. The MCR4's configurations carry their
 * SKUs explicitly: the two it had before keep theirs, and two sizes no Motec document covers
 * (9,5J × 19 ET 40, and 8,5J × 20 in 5 × 112, which is not offered in this finish) are retired —
 * soft-deleted, with their SKUs, so a sold order line still resolves.
 *
 * Each finish that has a photograph in database/seeders/content/wheel-photos.php carries that
 * cut-out's manifest, read from where `wheels:process-images` wrote it; a finish without one draws
 * the outline.
 */
class CatalogueSeeder extends Seeder
{
    /** Lochkreis and Mittenlochbohrung of the first twelve models, before per-model patterns existed. */
    private const DEFAULT_BOLT = [5, 112.0, 66.60];

    /**
     * Brand names this catalogue used before the accuracy pass. None of them has a product here
     * any more: once no model and no tyre refers to one it is soft-deleted, so it can never render.
     *
     * Except the ones BrandLogoSeeder now maintains as researched manufacturers with their own
     * logos (BORBET, OZ Racing, ALUTEC, BBS, Brock, Dezent, AEZ). Those stay as rows without a
     * product, which no storefront gate lists — a brand needs a published model with an in-stock
     * configuration to appear anywhere — and retiring them here would only undo that seeder.
     */
    public const FORMER_BRANDS = [
        'BORBET', 'OZ Racing', 'ALUTEC', 'BBS', 'YIDO', 'Rotiform', 'Brock', 'MAM', 'Dezent', 'AEZ',
    ];

    /**
     * brand, name, the slug it had before the rename, spokes, [finish, hex, palette, former
     * finish name?], sizes as [width, diameter, ET, euro, optional per-size facts], stock, and an
     * optional [bolt holes, bolt circle mm, centre bore mm] for the whole model.
     *
     * Per-size facts are used by the MCR4 only, each one read from the wheel's own ABE: `bolt`
     * (the execution's pattern and bore), `kba` (the ABE number stamped on that size), `load`
     * (Radlast, kg), `weight` (g, Motec's "ca." figure; NULL where Motec publishes none) and `sku`.
     *
     * @var list<array{
     *     brand: string,
     *     name: string,
     *     formerSlug: string|null,
     *     spokes: int,
     *     finishes: list<array{0: string, 1: string, 2: string, 3?: string}>,
     *     sizes: list<array{0: float, 1: float, 2: int, 3: float, 4?: array{bolt: array{0: int, 1: float, 2: float}, kba: string, load: int, weight: int|null, sku: int}}>,
     *     stock: int,
     *     bolt?: array{0: int, 1: float, 2: float}
     * }>
     */
    private const MODELS = [
        [
            'brand' => 'Demo', 'name' => 'Fünfspeiche F-01', 'formerSlug' => 'borbet-havanna',
            'spokes' => 5,
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
            'brand' => 'Demo', 'name' => 'Zehnspeiche Z-02', 'formerSlug' => 'borbet-lv5',
            'spokes' => 10,
            'finishes' => [
                ['Schwarz matt', '#1A1C20', 'black'],
                ['Silber', '#C3C8CF', 'silver'],
            ],
            'sizes' => [[7.5, 17.0, 38, 719.00], [8.0, 18.0, 35, 799.00]],
            'stock' => 0,
        ],
        [
            'brand' => 'Demo', 'name' => 'Zehnspeiche Z-03', 'formerSlug' => 'oz-racing-superturismo-gt',
            'spokes' => 10,
            'finishes' => [
                ['Matt Race Silber', '#C3C8CF', 'silver'],
                ['Schwarz matt', '#1A1C20', 'black'],
            ],
            'sizes' => [[8.0, 18.0, 35, 969.00], [8.5, 18.0, 40, 1019.00], [9.0, 19.0, 42, 1196.00]],
            'stock' => 8,
        ],
        [
            'brand' => 'Demo', 'name' => 'Siebenspeiche S-04', 'formerSlug' => 'oz-racing-ultraleggera',
            'spokes' => 7,
            'finishes' => [
                ['Graphite matt', '#3A3E45', 'graphite'],
                ['Poliert', '#D5DAE0', 'polished'],
            ],
            'sizes' => [[8.0, 18.0, 38, 1049.00], [8.5, 19.0, 42, 1149.00]],
            'stock' => 6,
        ],
        [
            'brand' => 'Demo', 'name' => 'Fünfspeiche F-05', 'formerSlug' => 'alutec-monstr',
            'spokes' => 5,
            'finishes' => [
                ['Racing Schwarz', '#1A1C20', 'black'],
                ['Graphite matt', '#3A3E45', 'graphite'],
            ],
            'sizes' => [[8.0, 18.0, 40, 699.00], [8.5, 19.0, 45, 789.00]],
            'stock' => 21,
        ],
        [
            'brand' => 'Demo', 'name' => 'Fünfspeiche F-06', 'formerSlug' => 'alutec-grip',
            'spokes' => 5,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Polar Silber', '#D5DAE0', 'polished'],
            ],
            'sizes' => [[7.0, 16.0, 38, 689.00], [7.5, 17.0, 38, 739.00]],
            'stock' => 34,
        ],
        [
            'brand' => 'Demo', 'name' => 'Zehnspeiche Z-07', 'formerSlug' => 'bbs-ci-r',
            'spokes' => 10,
            'finishes' => [
                ['Platinum Silber', '#C3C8CF', 'silver'],
                ['Satin Schwarz', '#1A1C20', 'black'],
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.0, 18.0, 44, 1096.00], [8.5, 19.0, 44, 1149.00], [9.0, 19.0, 42, 1196.00]],
            'stock' => 4,
        ],
        [
            'brand' => 'Demo', 'name' => 'Zehnspeiche Z-08', 'formerSlug' => 'bbs-sr',
            'spokes' => 10,
            'finishes' => [
                ['Himalaya Grau', '#3A3E45', 'graphite'],
                ['Volcano Grau', '#3A3E45', 'graphite'],
            ],
            'sizes' => [[8.0, 18.0, 45, 899.00], [8.5, 18.0, 40, 949.00]],
            'stock' => 15,
        ],
        [
            'brand' => 'Demo', 'name' => 'Vielspeiche V-09', 'formerSlug' => 'yido-performance-1',
            'spokes' => 20,
            'finishes' => [
                ['Schwarz poliert', '#1A1C20', 'black'],
                ['Silber', '#C3C8CF', 'silver'],
            ],
            'sizes' => [[8.5, 19.0, 35, 829.00], [9.5, 19.0, 40, 899.00]],
            'stock' => 9,
        ],
        [
            // The second out-of-stock model.
            'brand' => 'Demo', 'name' => 'Vielspeiche V-10', 'formerSlug' => 'yido-performance-2',
            'spokes' => 20,
            'finishes' => [
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.5, 19.0, 42, 869.00], [9.5, 20.0, 45, 1049.00]],
            'stock' => 0,
        ],
        [
            'brand' => 'Demo', 'name' => 'Fünfspeiche F-11', 'formerSlug' => 'rotiform-kps',
            'spokes' => 5,
            'finishes' => [
                ['Gloss Schwarz', '#1A1C20', 'black'],
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.5, 19.0, 35, 949.00], [9.0, 19.0, 40, 989.00]],
            'stock' => 7,
        ],
        [
            'brand' => 'Demo', 'name' => 'Siebenspeiche S-12', 'formerSlug' => 'rotiform-blq',
            'spokes' => 7,
            'finishes' => [
                ['Silber gebürstet', '#D5DAE0', 'polished'],
                ['Schwarz matt', '#1A1C20', 'black'],
            ],
            'sizes' => [[8.0, 18.0, 35, 779.00], [8.5, 18.0, 45, 819.00]],
            'stock' => 18,
        ],

        // ── Appended for the demo catalogue (OVERHAUL.md §2). Never reorder the twelve above. ──
        [
            'brand' => 'Demo', 'name' => 'Zehnspeiche Z-13', 'formerSlug' => 'brock-b32',
            'spokes' => 10,
            'finishes' => [
                ['Kristallsilber', '#C3C8CF', 'silver'],
                ['Schwarz Klarlack', '#1A1C20', 'black'],
            ],
            'sizes' => [[7.5, 17.0, 45, 549.00], [8.0, 18.0, 45, 619.00], [8.5, 19.0, 45, 699.00]],
            'bolt' => [5, 112.0, 66.60],
            'stock' => 26,
        ],
        [
            'brand' => 'Demo', 'name' => 'Fünfspeiche F-14', 'formerSlug' => 'brock-b40',
            'spokes' => 5,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Schwarz matt', '#1A1C20', 'black'],
            ],
            'sizes' => [[8.0, 18.0, 35, 639.00], [8.5, 19.0, 40, 729.00]],
            // A BMW pattern, so not every demo wheel claims the VW group's 5 × 112.
            'bolt' => [5, 120.0, 72.60],
            'stock' => 14,
        ],
        [
            'brand' => 'Demo', 'name' => 'Fünfspeiche F-15', 'formerSlug' => 'mam-a5',
            'spokes' => 5,
            'finishes' => [
                ['Palladium', '#B9BEC6', 'silver'],
                ['Schwarz matt', '#1A1C20', 'black'],
            ],
            'sizes' => [[8.0, 18.0, 30, 589.00], [8.5, 19.0, 35, 669.00]],
            'bolt' => [5, 112.0, 66.60],
            'stock' => 19,
        ],
        [
            'brand' => 'Demo', 'name' => 'Zehnspeiche Z-16', 'formerSlug' => 'mam-rs4',
            'spokes' => 10,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Schwarz Front poliert', '#2A2E35', 'polished'],
            ],
            'sizes' => [[7.5, 17.0, 40, 559.00], [8.0, 18.0, 42, 629.00]],
            'bolt' => [5, 108.0, 63.40],
            'stock' => 11,
        ],
        [
            'brand' => 'Demo', 'name' => 'Fünfspeiche F-17', 'formerSlug' => 'dezent-tz',
            'spokes' => 5,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Schwarz', '#1A1C20', 'black'],
            ],
            'sizes' => [[7.0, 17.0, 40, 529.00], [7.5, 18.0, 45, 599.00]],
            'bolt' => [5, 114.3, 67.10],
            'stock' => 30,
        ],
        [
            'brand' => 'Demo', 'name' => 'Zehnspeiche Z-18', 'formerSlug' => 'dezent-tn',
            'spokes' => 10,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Dark', '#3A3E45', 'graphite'],
            ],
            'sizes' => [[7.0, 16.0, 38, 479.00], [7.5, 17.0, 38, 539.00]],
            'bolt' => [5, 112.0, 57.10],
            'stock' => 40,
        ],
        [
            'brand' => 'Demo', 'name' => 'Zehnspeiche Z-19', 'formerSlug' => 'aez-leipzig',
            'spokes' => 10,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Dark', '#3A3E45', 'graphite'],
            ],
            'sizes' => [[8.0, 18.0, 35, 749.00], [8.5, 19.0, 40, 829.00]],
            'bolt' => [5, 112.0, 66.60],
            'stock' => 9,
        ],
        [
            'brand' => 'Demo', 'name' => 'Fünfspeiche F-20', 'formerSlug' => 'oz-racing-formula-hlt',
            'spokes' => 5,
            'finishes' => [
                ['Race Silber', '#C3C8CF', 'silver'],
                ['Grigio Corsa', '#5A5F66', 'graphite'],
            ],
            'sizes' => [[8.0, 18.0, 45, 899.00], [8.5, 19.0, 40, 979.00], [9.0, 19.0, 45, 1049.00]],
            'bolt' => [5, 112.0, 66.60],
            'stock' => 7,
        ],
        [
            // The client's own supplier, photographed in MOTEC's studio. Finish and sizes are the
            // Light Grey D5 combinations Motec offers that an ABE covers (the research report's
            // verified-official rows 3, 12, 1, 4, 7, 10, 13, 15, 17, 25 and 29, in that order);
            // bore 66,6 mm in 5 × 112 as the ABE states it, 72,6 mm in the other executions. Prices
            // and stock are demonstration values.
            'brand' => 'MOTEC', 'name' => 'MCR4 Ultimate', 'formerSlug' => null,
            'spokes' => 10,
            'finishes' => [
                ['Light Grey D5', '#B9BEC5', 'silver', 'Light Grey'],
            ],
            'sizes' => [
                [8.0, 18.0, 45, 796.00, ['bolt' => [5, 112.0, 66.60], 'kba' => '53811', 'load' => 620, 'weight' => 7_800, 'sku' => 95]],
                [8.5, 19.0, 45, 876.00, ['bolt' => [5, 112.0, 66.60], 'kba' => '53810', 'load' => 620, 'weight' => 8_600, 'sku' => 96]],
                [8.0, 18.0, 45, 796.00, ['bolt' => [5, 108.0, 72.60], 'kba' => '53811', 'load' => 620, 'weight' => 7_800, 'sku' => 99]],
                [8.0, 18.0, 50, 796.00, ['bolt' => [5, 114.3, 72.60], 'kba' => '53811', 'load' => 620, 'weight' => 7_700, 'sku' => 100]],
                [8.0, 19.0, 48, 836.00, ['bolt' => [5, 112.0, 66.60], 'kba' => '53809', 'load' => 620, 'weight' => 8_300, 'sku' => 101]],
                [8.5, 19.0, 30, 876.00, ['bolt' => [5, 112.0, 66.60], 'kba' => '53810', 'load' => 620, 'weight' => 8_800, 'sku' => 102]],
                [8.5, 19.0, 45, 876.00, ['bolt' => [5, 114.3, 72.60], 'kba' => '53810', 'load' => 620, 'weight' => 8_700, 'sku' => 103]],
                [8.5, 19.0, 35, 876.00, ['bolt' => [5, 120.0, 72.60], 'kba' => '53810', 'load' => 640, 'weight' => 9_100, 'sku' => 104]],
                [9.5, 19.0, 20, 916.00, ['bolt' => [5, 112.0, 66.60], 'kba' => '55070', 'load' => 690, 'weight' => 10_400, 'sku' => 105]],
                [8.5, 20.0, 35, 996.00, ['bolt' => [5, 120.0, 72.60], 'kba' => '54949', 'load' => 730, 'weight' => null, 'sku' => 106]],
                [9.5, 20.0, 37, 1036.00, ['bolt' => [5, 114.3, 72.60], 'kba' => '54950', 'load' => 760, 'weight' => 10_600, 'sku' => 107]],
            ],
            'bolt' => [5, 112.0, 66.60],
            'stock' => 16,
        ],
    ];

    /**
     * The six tyres, each with the label values its EPREL registration gives (the research report's
     * corrected rows, docs/reviews/accuracy-research-guides-tyres.md) and that registration's id.
     * Label values travel with a verified register entry or not at all (D7): a tyre whose EPREL
     * entry is not verified is listed here under the brand `Demo` with a neutral name, NULL label
     * values and a NULL EPREL id, and shows no label. All six were verified.
     *
     * brand, name, season, width, aspect, diameter, load index, speed symbol, speed rank, fuel
     * class, wet grip class, noise dB, noise class, EPREL id.
     *
     * @var list<array{0: string, 1: string, 2: string, 3: int, 4: int, 5: float, 6: int, 7: string, 8: int, 9: string|null, 10: string|null, 11: int|null, 12: string|null, 13: string|null}>
     */
    private const TYRES = [
        // EPREL 2402971 (on the market since 2025); the older 382152 carries fuel class D.
        ['Bridgestone', 'Potenza Sport', 'sommer', 245, 45, 18.0, 100, 'Y', 13, 'C', 'A', 72, 'B', '2402971'],
        ['Continental', 'PremiumContact 7', 'sommer', 245, 45, 18.0, 96, 'Y', 13, 'C', 'A', 71, 'B', '834095'],
        ['Michelin', 'Pilot Sport 5', 'sommer', 245, 45, 18.0, 100, 'Y', 13, 'C', 'A', 72, 'B', '909785'],
        // 624311 carries the same label.
        ['Bridgestone', 'Blizzak LM005', 'winter', 245, 45, 18.0, 100, 'V', 11, 'C', 'A', 72, 'B', '381960'],
        ['Continental', 'AllSeasonContact 2', 'ganzjahres', 255, 40, 19.0, 100, 'Y', 13, 'B', 'B', 72, 'B', '1226698'],
        ['Michelin', 'Pilot Sport 4 S', 'sommer', 255, 40, 19.0, 100, 'Y', 13, 'D', 'B', 71, 'B', '409928'],
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
        $this->attachPhotographs();
        $this->seedTyres($brands);
        $this->retireFormerBrands();
    }

    /** The slug a model is found by: brand and name, German transliteration (`fuenfspeiche`). */
    public static function slugFor(string $brand, string $name): string
    {
        return Str::slug($brand.'-'.$name, '-', 'de');
    }

    /**
     * Every model this seeder writes, as new slug => the slug it had before the rename (null for a
     * model that kept its name).
     *
     * @return array<string, string|null>
     */
    public static function slugs(): array
    {
        $out = [];

        foreach (self::MODELS as $spec) {
            $out[self::slugFor($spec['brand'], $spec['name'])] = $spec['formerSlug'];
        }

        return $out;
    }

    /** @return array<string, Brand> */
    private function seedBrands(): array
    {
        $names = ['MOTEC', 'Demo', 'Bridgestone', 'Continental', 'Michelin'];

        $brands = [];
        $sort = 0;

        foreach ($names as $name) {
            // One spelling per brand, compared without regard to case: "motec" and "MOTEC" are
            // the same brand and must never become two rows (docs/phase0/ADDENDUM.md D5).
            $spelling = MakeName::normalise($name);
            $existing = Brand::withTrashed()->whereRaw('LOWER(name) = ?', [mb_strtolower($spelling)])->first();

            $brand = $existing ?? new Brand(['slug' => Str::slug($spelling)]);
            $brand->fill(['name' => $spelling, 'sort_order' => $sort += 10]);
            $brand->deleted_at = null;
            $brand->save();

            $brands[$name] = $brand;
        }

        return $brands;
    }

    /** @param array<string, Brand> $brands */
    private function seedWheels(array $brands): void
    {
        $sku = 0;

        foreach (self::MODELS as $spec) {
            $model = $this->model($spec['brand'], $spec['name'], $spec['formerSlug']);

            $model->fill([
                'brand_id' => $brands[$spec['brand']]->id,
                'name' => $spec['name'],
                'slug' => self::slugFor($spec['brand'], $spec['name']),
                // A type designation is what a Gutachten prints; a demo wheel has no Gutachten,
                // and the MCR4's type is per size (MCR4-8519 …), not per model.
                'type_designation' => null,
                'spoke_count' => $spec['spokes'],
                // No review table exists, so there is no rating to show (findings #47, #60).
                'rating' => null,
                'rating_count' => 0,
                'status' => CatalogueStatus::Published->value,
                // Every row this seeder writes is a demonstration, and the page says so.
                'is_demo' => true,
            ])->save();

            $kept = [];

            foreach ($spec['finishes'] as $order => $finishSpec) {
                [$finishName, $hex, $palette] = $finishSpec;
                $finish = $this->finish($model->id, $finishName, $finishSpec[3] ?? null);
                $finish->fill(['name_de' => $finishName, 'hex' => $hex, 'art_finish' => $palette, 'sort_order' => $order * 10])->save();

                foreach ($spec['sizes'] as $sizeOrder => $size) {
                    [$width, $diameter, $et, $euro] = $size;
                    $facts = $size[4] ?? null;
                    $sku++;

                    [$boltHoles, $boltCircle, $centreBore] = $facts['bolt'] ?? $spec['bolt'] ?? self::DEFAULT_BOLT;

                    // A darker or polished finish carries a small surcharge, which is true of the
                    // real catalogue and is also what makes the swatch row worth looking at.
                    $surcharge = match ($palette) {
                        'polished' => 4_000,
                        'bronze' => 3_000,
                        'black' => 1_500,
                        default => 0,
                    };

                    // Soft-deleted rows are found too: a size retired by an earlier run and now
                    // back in the list is restored, never inserted twice under the same SKU.
                    $config = WheelConfig::withTrashed()->firstOrNew([
                        'wheel_model_id' => $model->id,
                        'wheel_finish_id' => $finish->id,
                        'diameter_in' => $diameter,
                        'width_in' => $width,
                        'et_mm' => $et,
                        'bolt_circle_mm' => $boltCircle,
                    ]);

                    $config->fill([
                        'bolt_holes' => $boltHoles,
                        'centre_bore_mm' => $centreBore,
                        'hump' => 'H2',
                        'bead_profile' => 'J',
                        // Only a number read in the wheel's own ABE; a demo wheel has none.
                        'kba_number' => $facts['kba'] ?? null,
                        'sku' => sprintf('RMF-%06d', $facts['sku'] ?? $sku),
                        'price_cents' => (int) round($euro * 100) + $surcharge,
                        'currency' => 'EUR',
                        // Stock varies per size so a size chip can be sold out while the
                        // model is not — which is the case the PDP has to get right.
                        'stock_qty' => $spec['stock'] === 0
                            ? 0
                            : max(0, $spec['stock'] - ($sizeOrder % 4) * 3 - $order),
                        'weight_g' => $facts === null
                            ? 9_400 + (int) ($diameter * 260) + (int) ($width * 120)
                            : $facts['weight'],
                        'max_load_kg' => $facts['load'] ?? null,
                    ]);
                    $config->deleted_at = null;
                    $config->save();

                    $kept[] = $config->id;
                }
            }

            // A size that is no longer in the list is retired, never deleted: an order line or a
            // fitment may still name it (R-05).
            WheelConfig::query()
                ->where('wheel_model_id', $model->id)
                ->whereNotIn('id', $kept)
                ->get()
                ->each(static fn (WheelConfig $config): ?bool => $config->delete());
        }
    }

    /** The model under its current slug, else under the slug it had before the rename, else new. */
    private function model(string $brand, string $name, ?string $formerSlug): WheelModel
    {
        $slug = self::slugFor($brand, $name);

        $model = WheelModel::query()->where('slug', $slug)->first();

        if ($model === null && $formerSlug !== null) {
            $model = WheelModel::query()->where('slug', $formerSlug)->first();
        }

        return $model ?? new WheelModel(['slug' => $slug]);
    }

    /** The finish under its name, else under its former name, else new. */
    private function finish(int $modelId, string $name, ?string $formerName): WheelFinish
    {
        $finish = WheelFinish::query()->where('wheel_model_id', $modelId)->where('name_de', $name)->first();

        if ($finish === null && $formerName !== null) {
            $finish = WheelFinish::query()->where('wheel_model_id', $modelId)->where('name_de', $formerName)->first();
        }

        return $finish ?? new WheelFinish(['wheel_model_id' => $modelId, 'name_de' => $name]);
    }

    /**
     * The cut-outs, finish by finish, from the photograph map. A demo finish that is not in the
     * map — or whose cut-out has not been rendered on this machine — carries NULL and draws the
     * outline: missing data fails closed, it never borrows another finish's picture.
     *
     * An entry with a `view` is a further angle of a finish: it joins that finish's manifest under
     * `views`, labelled, in map order — and only when the finish has its front view, because the
     * gallery opens on the front.
     */
    private function attachPhotographs(): void
    {
        $demoModelIds = WheelModel::query()->where('is_demo', true)->pluck('id');

        WheelFinish::query()
            ->whereIn('wheel_model_id', $demoModelIds)
            ->whereNotNull('image_manifest')
            ->update(['image_manifest' => null]);

        /** @var array<int, list<array<string, mixed>>> $views */
        $views = [];

        foreach (DemoWheels::photos() as $photo) {
            $model = WheelModel::query()->where('slug', $photo['model'])->first();

            if ($model === null) {
                continue;
            }

            $finish = WheelFinish::query()
                ->where('wheel_model_id', $model->id)
                ->where('name_de', $photo['finish'])
                ->first();

            if ($finish === null) {
                continue;
            }

            $manifest = DemoWheels::manifest($photo['slug']);

            if (isset($photo['view'])) {
                if ($manifest !== null) {
                    $views[$finish->id][] = [...self::pictureFields($manifest), 'label' => $photo['view']];
                }

                continue;
            }

            $finish->image_manifest = $manifest;
            $finish->save();
        }

        foreach ($views as $finishId => $list) {
            $finish = WheelFinish::query()->find($finishId);

            if ($finish === null || $finish->image_manifest === null) {
                continue;
            }

            $finish->image_manifest = [...$finish->image_manifest, 'views' => $list];
            $finish->save();
        }
    }

    /**
     * What a thumbnail needs of a manifest — the picture, not the 4:3 frame, the anchors, the
     * credit or the fingerprint.
     *
     * @param  array<string, mixed>  $manifest
     * @return array<string, mixed>
     */
    private static function pictureFields(array $manifest): array
    {
        return array_intersect_key($manifest, array_flip(['name', 'base', 'width', 'height', 'widths', 'fallback', 'placeholder']));
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
        foreach (self::TYRES as [$brand, $name, $season, $width, $aspect, $diameter, $load, $symbol, $rank, $fuel, $grip, $noise, $noiseClass, $eprelId]) {
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

    /**
     * A wheel brand this catalogue no longer sells under must not render anywhere — not in the
     * menu, the brand tiles, the search or its suggestions. Soft-deleted once nothing refers to
     * it; a brand that still carries a model or a tyre (a client's own row) is left alone, and so
     * is one BrandLogoSeeder maintains: that row is a researched manufacturer without a catalogue
     * yet, which every gate already leaves out.
     */
    private function retireFormerBrands(): void
    {
        Brand::query()
            ->whereIn('name', self::FORMER_BRANDS)
            ->whereDoesntHave('wheelModels')
            ->whereDoesntHave('tyreVariants')
            ->get()
            ->reject(static fn (Brand $brand): bool => BrandLogoSeeder::maintains((string) $brand->name))
            ->each(static fn (Brand $brand): ?bool => $brand->delete());
    }
}
