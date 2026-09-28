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
use App\Services\Demo\DemoPlaceholders;
use App\Support\DemoWheels;
use App\Support\MakeName;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Twenty-one wheel models, deliberately uneven, every one of them flagged `is_demo` — the example
 * data the admin is reviewed on (the review release §2).
 *
 * A demo catalogue where every product is in stock, unconditioned and identically priced proves
 * nothing: it is exactly the dataset under which a list looks finished and then falls over on the
 * client's own data. So two models are out of stock, the spoke counts and palettes differ per model,
 * the bolt patterns span the German market (5 × 112, 5 × 120, 5 × 108, 5 × 114,3) and the prices run
 * from 479,00 € to 1.196,00 €. The sizes, ET values, bolt patterns and bores are combinations that
 * exist — wrong numbers would make every fitment screen meaningless to review.
 *
 * Invented brands only: Nordfelge, Kraftrad, Stahlwerk 19, Aventin and Bergsteig — obviously ours,
 * never a real maker's name on data we made up, and never a maker's photograph (§5 UWG). No model
 * carries a type designation, a KBA number, a Radlast or a rating: there is no document and no review
 * behind them, and an invented one would be confidently wrong (CLAUDE.md §2).
 *
 * A demo model is never published: it is seeded as a draft, and the database refuses a published row
 * that is demo (`wheel_models_demo_never_published`). The storefront shows real records only.
 *
 * The renames happen IN PLACE. A model is found by its slug or by any slug it had before
 * (`formerSlugs`: its `Demo …` name, and the real maker's name before that), a finish by its name or
 * its former name, so a database seeded under any earlier name keeps every id, SKU, configuration
 * and fitment, and a second run changes nothing.
 *
 * The first twelve models are kept exactly as first seeded — same order, same finishes, same
 * sizes — because their configurations' SKUs are numbered in sequence and the fitment seeds hang
 * off those rows. New models are appended, never inserted. Bergsteig Gipfel's configurations carry
 * their SKUs explicitly, so the ones it had before keep theirs; a size no longer listed is retired —
 * soft-deleted, with its SKU, so a sold order line still resolves.
 *
 * Pictures: a finish carries a cut-out's manifest only where database/seeders/content/wheel-photos.php
 * maps one (none, today); a finish without one draws the outline.
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
        // Before the review release: the neutral range, the one real wheel, the three tyre makers.
        'Demo', 'MOTEC', 'Bridgestone', 'Continental', 'Michelin',
    ];

    /** The invented brands, in the order the admin lists them; `Laufwerk` makes the tyres. */
    public const BRANDS = ['Nordfelge', 'Kraftrad', 'Stahlwerk 19', 'Aventin', 'Bergsteig', 'Laufwerk'];

    /**
     * Each wheel brand's colour: the ground of its placeholder drawings (DemoPlaceholders). Dark
     * enough for white text at 7:1 or better.
     *
     * @var array<string, string>
     */
    public const BRAND_COLOURS = [
        'Nordfelge' => '#2B4C6F',
        'Kraftrad' => '#7A2E2E',
        'Stahlwerk 19' => '#3F454D',
        'Aventin' => '#4E3F6E',
        'Bergsteig' => '#2F5A43',
    ];

    /**
     * Tests only: the seeded catalogue as a test's own shop — published and not demo — for the
     * storefront tests, whose subject is a shop with wheels in it (tests/Pest.php sets it for them).
     * Honoured only while the application runs its tests, so no database anyone can deploy ever
     * gets a published invented product from this seeder.
     */
    public static bool $shopFixture = false;

    private static function asShop(): bool
    {
        return self::$shopFixture && app()->runningUnitTests();
    }

    /**
     * brand, name, the slugs it had before (newest first), spokes, [finish, hex, palette, former
     * finish name?], sizes as [width, diameter, ET, euro, optional per-size facts], stock, and an
     * optional [bolt holes, bolt circle mm, centre bore mm] for the whole model.
     *
     * Per-size facts: `bolt` (a size's own pattern and bore, where the model has several) and `sku`
     * (a fixed article number, where one was sold before).
     *
     * @var list<array{
     *     brand: string,
     *     name: string,
     *     formerSlugs: list<string>,
     *     spokes: int,
     *     finishes: list<array{0: string, 1: string, 2: string, 3?: string}>,
     *     sizes: list<array{0: float, 1: float, 2: int, 3: float, 4?: array{bolt: array{0: int, 1: float, 2: float}, sku: int}}>,
     *     stock: int,
     *     bolt?: array{0: int, 1: float, 2: float}
     * }>
     */
    private const MODELS = [
        [
            'brand' => 'Nordfelge', 'name' => 'Fjord', 'formerSlugs' => ['demo-fuenfspeiche-f-01', 'borbet-havanna'],
            'spokes' => 5,
            'finishes' => [
                ['Graphit matt', '#3A3E45', 'graphite', 'Graphite matt'],
                ['Schwarz glänzend', '#1A1C20', 'black'],
                ['Silber', '#C3C8CF', 'silver'],
            ],
            'sizes' => [[8.0, 18.0, 35, 689.00], [8.5, 18.0, 35, 729.00], [9.0, 19.0, 40, 849.00]],
            'stock' => 12,
        ],
        [
            // Out of stock, on purpose: the card, the chip and the disabled action all have to
            // hold up without a single unit behind them.
            'brand' => 'Nordfelge', 'name' => 'Skagen', 'formerSlugs' => ['demo-zehnspeiche-z-02', 'borbet-lv5'],
            'spokes' => 10,
            'finishes' => [
                ['Schwarz matt', '#1A1C20', 'black'],
                ['Silber', '#C3C8CF', 'silver'],
            ],
            'sizes' => [[7.5, 17.0, 38, 719.00], [8.0, 18.0, 35, 799.00]],
            'stock' => 0,
        ],
        [
            'brand' => 'Kraftrad', 'name' => 'KR-10', 'formerSlugs' => ['demo-zehnspeiche-z-03', 'oz-racing-superturismo-gt'],
            'spokes' => 10,
            'finishes' => [
                ['Silber matt', '#C3C8CF', 'silver', 'Matt Race Silber'],
                ['Schwarz matt', '#1A1C20', 'black'],
            ],
            'sizes' => [[8.0, 18.0, 35, 969.00], [8.5, 18.0, 40, 1019.00], [9.0, 19.0, 42, 1196.00]],
            'stock' => 8,
        ],
        [
            'brand' => 'Nordfelge', 'name' => 'Aero 7', 'formerSlugs' => ['demo-siebenspeiche-s-04', 'oz-racing-ultraleggera'],
            'spokes' => 7,
            'finishes' => [
                ['Graphit matt', '#3A3E45', 'graphite', 'Graphite matt'],
                ['Poliert', '#D5DAE0', 'polished'],
            ],
            'sizes' => [[8.0, 18.0, 38, 1049.00], [8.5, 19.0, 42, 1149.00]],
            'stock' => 6,
        ],
        [
            'brand' => 'Kraftrad', 'name' => 'KR-5', 'formerSlugs' => ['demo-fuenfspeiche-f-05', 'alutec-monstr'],
            'spokes' => 5,
            'finishes' => [
                ['Schwarz', '#1A1C20', 'black', 'Racing Schwarz'],
                ['Graphit matt', '#3A3E45', 'graphite', 'Graphite matt'],
            ],
            'sizes' => [[8.0, 18.0, 40, 699.00], [8.5, 19.0, 45, 789.00]],
            'stock' => 21,
        ],
        [
            'brand' => 'Stahlwerk 19', 'name' => 'Kontur S', 'formerSlugs' => ['demo-fuenfspeiche-f-06', 'alutec-grip'],
            'spokes' => 5,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Hellsilber', '#D5DAE0', 'polished', 'Polar Silber'],
            ],
            'sizes' => [[7.0, 16.0, 38, 689.00], [7.5, 17.0, 38, 739.00]],
            'stock' => 34,
        ],
        [
            'brand' => 'Bergsteig', 'name' => 'Grat', 'formerSlugs' => ['demo-zehnspeiche-z-07', 'bbs-ci-r'],
            'spokes' => 10,
            'finishes' => [
                ['Silber glänzend', '#C3C8CF', 'silver', 'Platinum Silber'],
                ['Schwarz seidenmatt', '#1A1C20', 'black', 'Satin Schwarz'],
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.0, 18.0, 44, 1096.00], [8.5, 19.0, 44, 1149.00], [9.0, 19.0, 42, 1196.00]],
            'stock' => 4,
        ],
        [
            'brand' => 'Bergsteig', 'name' => 'Kamm', 'formerSlugs' => ['demo-zehnspeiche-z-08', 'bbs-sr'],
            'spokes' => 10,
            'finishes' => [
                ['Grau matt', '#3A3E45', 'graphite', 'Himalaya Grau'],
                ['Anthrazit', '#3A3E45', 'graphite', 'Volcano Grau'],
            ],
            'sizes' => [[8.0, 18.0, 45, 899.00], [8.5, 18.0, 40, 949.00]],
            'stock' => 15,
        ],
        [
            'brand' => 'Aventin', 'name' => 'Mesh 20', 'formerSlugs' => ['demo-vielspeiche-v-09', 'yido-performance-1'],
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
            'brand' => 'Aventin', 'name' => 'Mesh 20 R', 'formerSlugs' => ['demo-vielspeiche-v-10', 'yido-performance-2'],
            'spokes' => 20,
            'finishes' => [
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.5, 19.0, 42, 869.00], [9.5, 20.0, 45, 1049.00]],
            'stock' => 0,
        ],
        [
            'brand' => 'Aventin', 'name' => 'Linea 5', 'formerSlugs' => ['demo-fuenfspeiche-f-11', 'rotiform-kps'],
            'spokes' => 5,
            'finishes' => [
                ['Schwarz glänzend', '#1A1C20', 'black', 'Gloss Schwarz'],
                ['Bronze matt', '#8A6A3C', 'bronze'],
            ],
            'sizes' => [[8.5, 19.0, 35, 949.00], [9.0, 19.0, 40, 989.00]],
            'stock' => 7,
        ],
        [
            'brand' => 'Stahlwerk 19', 'name' => 'Profil 7', 'formerSlugs' => ['demo-siebenspeiche-s-12', 'rotiform-blq'],
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
            'brand' => 'Kraftrad', 'name' => 'KR-9', 'formerSlugs' => ['demo-zehnspeiche-z-13', 'brock-b32'],
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
            'brand' => 'Bergsteig', 'name' => 'Pass 5', 'formerSlugs' => ['demo-fuenfspeiche-f-14', 'brock-b40'],
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
            'brand' => 'Stahlwerk 19', 'name' => 'Kontur X', 'formerSlugs' => ['demo-fuenfspeiche-f-15', 'mam-a5'],
            'spokes' => 5,
            'finishes' => [
                ['Hellgrau', '#B9BEC6', 'silver', 'Palladium'],
                ['Schwarz matt', '#1A1C20', 'black'],
            ],
            'sizes' => [[8.0, 18.0, 30, 589.00], [8.5, 19.0, 35, 669.00]],
            'bolt' => [5, 112.0, 66.60],
            'stock' => 19,
        ],
        [
            'brand' => 'Aventin', 'name' => 'Linea 10', 'formerSlugs' => ['demo-zehnspeiche-z-16', 'mam-rs4'],
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
            'brand' => 'Nordfelge', 'name' => 'Fjord S', 'formerSlugs' => ['demo-fuenfspeiche-f-17', 'dezent-tz'],
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
            'brand' => 'Stahlwerk 19', 'name' => 'Raster 10', 'formerSlugs' => ['demo-zehnspeiche-z-18', 'dezent-tn'],
            'spokes' => 10,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Anthrazit', '#3A3E45', 'graphite', 'Dark'],
            ],
            'sizes' => [[7.0, 16.0, 38, 479.00], [7.5, 17.0, 38, 539.00]],
            'bolt' => [5, 112.0, 57.10],
            'stock' => 40,
        ],
        [
            'brand' => 'Bergsteig', 'name' => 'Sattel', 'formerSlugs' => ['demo-zehnspeiche-z-19', 'aez-leipzig'],
            'spokes' => 10,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver'],
                ['Anthrazit', '#3A3E45', 'graphite', 'Dark'],
            ],
            'sizes' => [[8.0, 18.0, 35, 749.00], [8.5, 19.0, 40, 829.00]],
            'bolt' => [5, 112.0, 66.60],
            'stock' => 9,
        ],
        [
            'brand' => 'Kraftrad', 'name' => 'KR-5 S', 'formerSlugs' => ['demo-fuenfspeiche-f-20', 'oz-racing-formula-hlt'],
            'spokes' => 5,
            'finishes' => [
                ['Silber', '#C3C8CF', 'silver', 'Race Silber'],
                ['Dunkelgrau', '#5A5F66', 'graphite', 'Grigio Corsa'],
            ],
            'sizes' => [[8.0, 18.0, 45, 899.00], [8.5, 19.0, 40, 979.00], [9.0, 19.0, 45, 1049.00]],
            'bolt' => [5, 112.0, 66.60],
            'stock' => 7,
        ],
        [
            // Once the MOTEC MCR4 Ultimate, which this catalogue may no longer carry: a real brand on
            // demonstration prices, stock and fitments, pictured by the maker's own photographs (the
            // review release §2). Now an invented wheel like the rest. It keeps what makes it useful
            // to review — eleven sizes over four bolt patterns, sizes that exist — and it drops every
            // fact that came from the MCR4's own ABEs (KBA numbers, Radlast, weights, hump and
            // Felgenhorn): stated of an invented wheel, each would be a claim with nothing behind it.
            // Its SKUs stay, so a sold order line still resolves.
            'brand' => 'Bergsteig', 'name' => 'Gipfel', 'formerSlugs' => ['motec-mcr4-ultimate'],
            'spokes' => 10,
            'finishes' => [
                ['Hellgrau', '#B9BEC5', 'silver', 'Light Grey D5|Light Grey'],
            ],
            'sizes' => [
                [8.0, 18.0, 45, 796.00, ['bolt' => [5, 112.0, 66.50], 'sku' => 95]],
                [8.5, 19.0, 45, 876.00, ['bolt' => [5, 112.0, 66.50], 'sku' => 96]],
                [8.0, 18.0, 45, 796.00, ['bolt' => [5, 108.0, 72.60], 'sku' => 99]],
                [8.0, 18.0, 50, 796.00, ['bolt' => [5, 114.3, 72.60], 'sku' => 100]],
                [8.0, 19.0, 48, 836.00, ['bolt' => [5, 112.0, 66.50], 'sku' => 101]],
                [8.5, 19.0, 30, 876.00, ['bolt' => [5, 112.0, 66.50], 'sku' => 102]],
                [8.5, 19.0, 45, 876.00, ['bolt' => [5, 114.3, 72.60], 'sku' => 103]],
                [8.5, 19.0, 35, 876.00, ['bolt' => [5, 120.0, 72.60], 'sku' => 104]],
                [9.5, 19.0, 20, 916.00, ['bolt' => [5, 112.0, 66.50], 'sku' => 105]],
                [8.5, 20.0, 35, 996.00, ['bolt' => [5, 120.0, 72.60], 'sku' => 106]],
                [9.5, 20.0, 37, 1036.00, ['bolt' => [5, 114.3, 72.60], 'sku' => 107]],
            ],
            'bolt' => [5, 112.0, 66.50],
            'stock' => 16,
        ],
    ];

    /**
     * The six tyres: an invented maker, `Laufwerk`, in sizes, load indices and speed symbols that
     * exist. No EU tyre label: label values travel with a verified EPREL registration or not at all
     * (D7), and an invented tyre has none — its label shows as not given.
     *
     * brand, name, season, width, aspect, diameter, load index, speed symbol, speed rank, and the
     * [brand, name] it was seeded under before (found and renamed in place).
     *
     * @var list<array{0: string, 1: string, 2: string, 3: int, 4: int, 5: float, 6: int, 7: string, 8: int, 9: array{0: string, 1: string}}>
     */
    private const TYRES = [
        ['Laufwerk', 'Sommer S1', 'sommer', 245, 45, 18.0, 100, 'Y', 13, ['Bridgestone', 'Potenza Sport']],
        ['Laufwerk', 'Sommer S2', 'sommer', 245, 45, 18.0, 96, 'Y', 13, ['Continental', 'PremiumContact 7']],
        ['Laufwerk', 'Sommer S3', 'sommer', 245, 45, 18.0, 100, 'Y', 13, ['Michelin', 'Pilot Sport 5']],
        ['Laufwerk', 'Winter W1', 'winter', 245, 45, 18.0, 100, 'V', 11, ['Bridgestone', 'Blizzak LM005']],
        ['Laufwerk', 'Allwetter A1', 'ganzjahres', 255, 40, 19.0, 100, 'Y', 13, ['Continental', 'AllSeasonContact 2']],
        ['Laufwerk', 'Sommer S4', 'sommer', 255, 40, 19.0, 100, 'Y', 13, ['Michelin', 'Pilot Sport 4 S']],
    ];

    public function run(): void
    {
        // The example catalogue is demo (the launch release §3): never written to the live shop, whoever
        // calls this seeder — `demo:assert-clean` would stop the next deploy on it.
        if (app()->environment('production')) {
            return;
        }

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
        $this->attachPlaceholders();
        $this->seedTyres($brands);
        $this->retireFormerBrands();
    }

    /** The slug a model is found by: brand and name, German transliteration (`fuenfspeiche`). */
    public static function slugFor(string $brand, string $name): string
    {
        return Str::slug($brand.'-'.$name, '-', 'de');
    }

    /**
     * Every model this seeder writes, as slug now => the slugs it had before, newest first.
     *
     * @return array<string, list<string>>
     */
    public static function slugs(): array
    {
        $out = [];

        foreach (self::MODELS as $spec) {
            $out[self::slugFor($spec['brand'], $spec['name'])] = self::formerSlugs($spec);
        }

        return $out;
    }

    /**
     * Every slug a model had before, as the slug it has now — for a seeder that still names a model
     * the old way (ApprovalSeeder's coverage, the demo orders).
     */
    public static function currentSlug(string $slug): string
    {
        foreach (self::MODELS as $spec) {
            if (in_array($slug, self::formerSlugs($spec), true)) {
                return self::slugFor($spec['brand'], $spec['name']);
            }
        }

        return $slug;
    }

    /** @return array<string, Brand> */
    private function seedBrands(): array
    {
        $names = self::BRANDS;

        $brands = [];
        // After the slot BrandLogoSeeder keeps for the client's supplier (MOTEC_SORT_ORDER = 10), and
        // before the researched brands (from 100): the wall's order never ties.
        $sort = BrandLogoSeeder::MOTEC_SORT_ORDER;

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
            $model = $this->model($spec['brand'], $spec['name'], self::formerSlugs($spec));

            $model->fill([
                'brand_id' => $brands[$spec['brand']]->id,
                'name' => $spec['name'],
                'slug' => self::slugFor($spec['brand'], $spec['name']),
                // A type designation is what a Gutachten prints; a demo wheel has no Gutachten.
                'type_designation' => null,
                'spoke_count' => $spec['spokes'],
                // No review table exists, so there is no rating to show (findings #47, #60).
                'rating' => null,
                'rating_count' => 0,
                // Never published: example data lives in the admin, the storefront shows real
                // records only — and the database refuses the other way round.
                'status' => self::asShop() ? CatalogueStatus::Published->value : CatalogueStatus::Draft->value,
                // Every row this seeder writes is a demonstration, and the admin says so.
                'is_demo' => ! self::asShop(),
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
                        // Only what a document prints — and a demo wheel has no document: no hump,
                        // no Felgenhorn, no KBA number, no Radlast.
                        'hump' => null,
                        'bead_profile' => null,
                        'kba_number' => null,
                        'sku' => sprintf('RMF-%06d', $facts['sku'] ?? $sku),
                        'price_cents' => (int) round($euro * 100) + $surcharge,
                        'currency' => 'EUR',
                        // Stock varies per size so a size chip can be sold out while the
                        // model is not — which is the case the PDP has to get right.
                        'stock_qty' => $spec['stock'] === 0
                            ? 0
                            : max(0, $spec['stock'] - ($sizeOrder % 4) * 3 - $order),
                        'weight_g' => 9_400 + (int) ($diameter * 260) + (int) ($width * 120),
                        'max_load_kg' => null,
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

    /**
     * A model spec's former slugs, as the strings they are.
     *
     * @param  array<array-key, mixed>  $spec
     * @return list<string>
     */
    private static function formerSlugs(array $spec): array
    {
        $former = $spec['formerSlugs'] ?? [];

        return array_values(array_filter(is_array($former) ? $former : [], 'is_string'));
    }

    /**
     * The model under its current slug, else under a slug it had before (newest first), else new.
     *
     * @param  list<string>  $formerSlugs
     */
    private function model(string $brand, string $name, array $formerSlugs): WheelModel
    {
        $slug = self::slugFor($brand, $name);

        foreach ([$slug, ...$formerSlugs] as $candidate) {
            $model = WheelModel::query()->where('slug', $candidate)->first();

            if ($model !== null) {
                return $model;
            }
        }

        return new WheelModel(['slug' => $slug]);
    }

    /** The finish under its name, else under a former name (`a|b`, newest first), else new. */
    private function finish(int $modelId, string $name, ?string $formerNames): WheelFinish
    {
        $candidates = [$name, ...($formerNames === null ? [] : explode('|', $formerNames))];

        foreach ($candidates as $candidate) {
            $finish = WheelFinish::query()->where('wheel_model_id', $modelId)->where('name_de', $candidate)->first();

            if ($finish !== null) {
                return $finish;
            }
        }

        return new WheelFinish(['wheel_model_id' => $modelId, 'name_de' => $name]);
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
     * Every demo finish without a photograph gets its placeholder drawing (DemoPlaceholders): honest
     * about what it is, never a photograph. A real row is left alone — its pictures are its own.
     */
    private function attachPlaceholders(): void
    {
        $drawer = app(DemoPlaceholders::class);

        foreach (WheelModel::query()->where('is_demo', true)->with(['brand', 'finishes', 'configs'])->orderBy('id')->get() as $model) {
            $diameters = $model->configs->map(static fn (WheelConfig $c): float => (float) $c->diameter_in)->unique()->values()->all();

            foreach ($model->finishes as $finish) {
                if ($finish->image_manifest !== null) {
                    continue;
                }

                $finish->image_manifest = $drawer->draw(
                    Str::slug($model->slug.'-'.$finish->name_de, '-', 'de'),
                    (string) $model->brand->name,
                    (string) $model->name,
                    self::BRAND_COLOURS[(string) $model->brand->name] ?? '#3F454D',
                    (string) $finish->hex,
                    (int) $model->spoke_count,
                    $diameters,
                );
                $finish->save();
            }
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
        foreach (self::TYRES as [$brand, $name, $season, $width, $aspect, $diameter, $load, $symbol, $rank, [$formerBrand, $formerName]]) {
            $size = ['width_mm' => $width, 'aspect' => $aspect, 'diameter_in' => $diameter];

            // Under its name now, else under the maker and name it was seeded with before: renamed
            // in place, so a Komplettrad order line that names it still resolves.
            $tyre = TyreVariant::query()->where(['brand_id' => $brands[$brand]->id, 'name' => $name, ...$size])->first()
                ?? TyreVariant::query()
                    ->whereHas('brand', static fn ($q) => $q->withTrashed()->where('name', $formerBrand))
                    ->where(['name' => $formerName, ...$size])
                    ->first()
                ?? new TyreVariant;

            $tyre->forceFill([
                'brand_id' => $brands[$brand]->id,
                'name' => $name,
                ...$size,
                'season' => $season,
                'load_index' => $load,
                'speed_symbol' => $symbol,
                'speed_rank' => $rank,
                'eu_fuel_class' => null,
                'eu_wet_grip_class' => null,
                'eu_noise_db' => null,
                'eu_noise_class' => null,
                'eprel_id' => null,
                'price_cents' => 14_900 + $load * 90,
                'currency' => 'EUR',
                'stock_qty' => 24,
                // Demonstration data, like every wheel this seeder writes: the demo gate has to
                // catch a Komplettrad built from this tyre too.
                'is_demo' => ! self::asShop(),
            ])->save();
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
