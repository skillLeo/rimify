<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Brand;
use App\Support\BrandLogos;
use App\Support\MakeName;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;

/**
 * The wheel brands RIMIFY researched, as brand rows with their own logos — and nothing else.
 *
 * This seeder creates no wheel model, no configuration and no stock, so it moves nothing on the
 * storefront: the homepage, the Felgen menu, the counters and the search all list a brand only
 * when it has a published model with an in-stock configuration, and that gate is untouched. A row
 * here is the place a brand's catalogue will land in, with its logo and its order already right.
 *
 * Order: MOTEC first — the client's own supplier, and the same place CatalogueSeeder gives it —
 * then the researched brands by rank (BBS, BORBET, OZ Racing, RONAL, AEZ, RIAL, DEZENT, DOTZ,
 * ALUTEC, ATS, Brock, CMS).
 *
 * Idempotent, and careful about what it does not own:
 *
 *  - a brand is found by its slug, else by its name compared without regard to case, so a row
 *    seeded under an older spelling ("Dezent") is renamed in place and keeps its id;
 *  - a retired brand is brought back only when it carries no product; one that was retired while
 *    it still had wheels stays retired, because restoring it would put those wheels back on the
 *    storefront as a side effect of a seed (CLAUDE.md §2);
 *  - an uploaded logo (`logo_path` on the public disk) is left exactly as it is; only a bundled
 *    `/images/brands/…` path is this seeder's to set or to clear;
 *  - the sample range `Demo` is touched for one reason only: to make sure it has no logo. It is
 *    never dressed up as a manufacturer (docs/design/sections/home-brands.md §4.2).
 *
 * The logo files themselves are written by `node scripts/brand-logo.mjs` from the official sources
 * in database/seeders/content/brand-logos/source/ (credits: docs/image-credits.md, "Markenlogos").
 * A brand whose logo has not been processed simply gets none, and its name stays its mark.
 */
final class BrandLogoSeeder extends Seeder
{
    /** MOTEC's place in the order — the same value CatalogueSeeder writes, so neither moves it. */
    public const MOTEC_SORT_ORDER = 10;

    /** Where the researched brands start, clear of the seeded MOTEC, Demo and tyre brands. */
    public const RANKED_SORT_BASE = 100;

    /**
     * The researched brands: the name as the brand writes it, its slug, and its rank (0 = MOTEC).
     *
     * @var list<array{slug: string, name: string, rank: int}>
     */
    public const BRANDS = [
        ['slug' => 'motec', 'name' => 'MOTEC', 'rank' => 0],
        ['slug' => 'bbs', 'name' => 'BBS', 'rank' => 1],
        ['slug' => 'borbet', 'name' => 'BORBET', 'rank' => 2],
        ['slug' => 'oz-racing', 'name' => 'OZ Racing', 'rank' => 3],
        ['slug' => 'ronal', 'name' => 'RONAL', 'rank' => 4],
        ['slug' => 'aez', 'name' => 'AEZ', 'rank' => 5],
        ['slug' => 'rial', 'name' => 'RIAL', 'rank' => 6],
        ['slug' => 'dezent', 'name' => 'DEZENT', 'rank' => 7],
        ['slug' => 'dotz', 'name' => 'DOTZ', 'rank' => 8],
        ['slug' => 'alutec', 'name' => 'ALUTEC', 'rank' => 9],
        ['slug' => 'ats', 'name' => 'ATS', 'rank' => 10],
        ['slug' => 'brock', 'name' => 'Brock', 'rank' => 11],
        ['slug' => 'cms', 'name' => 'CMS', 'rank' => 12],
    ];

    public static function sortOrder(int $rank): int
    {
        return $rank === 0 ? self::MOTEC_SORT_ORDER : self::RANKED_SORT_BASE + $rank * 10;
    }

    /** Whether this seeder owns a brand, by its name or its slug, compared without case. */
    public static function maintains(string $nameOrSlug): bool
    {
        $needle = mb_strtolower(trim($nameOrSlug));

        foreach (self::BRANDS as $spec) {
            if ($needle === mb_strtolower($spec['name']) || $needle === $spec['slug']) {
                return true;
            }
        }

        return false;
    }

    public function run(): void
    {
        foreach (self::BRANDS as $spec) {
            $this->apply($spec);
        }

        $this->keepSampleRangeBare();
    }

    /** @param array{slug: string, name: string, rank: int} $spec */
    private function apply(array $spec): void
    {
        $bySlug = Brand::withTrashed()->where('slug', $spec['slug'])->first();
        $byName = Brand::withTrashed()->whereRaw('LOWER(name) = ?', [mb_strtolower($spec['name'])])->first();

        if ($bySlug !== null && $byName !== null && $bySlug->id !== $byName->id) {
            // Two rows, one name and one slug: merging them would move products. A human decides.
            $this->warn(sprintf(
                '%s: the slug is on brand #%d and the name on brand #%d; neither was touched.',
                $spec['name'],
                (int) $bySlug->id,
                (int) $byName->id,
            ));

            return;
        }

        $brand = $bySlug ?? $byName ?? new Brand(['slug' => $spec['slug']]);

        if ($brand->trashed() && ($brand->wheelModels()->exists() || $brand->tyreVariants()->exists())) {
            $this->warn(sprintf('%s is retired and still carries products; left retired.', $spec['name']));

            return;
        }

        $current = $brand->logo_path;

        $brand->fill([
            'name' => MakeName::normalise($spec['name']),
            'sort_order' => self::sortOrder($spec['rank']),
            'logo_path' => $this->logoPath($spec['slug'], is_string($current) ? $current : null),
        ]);
        $brand->deleted_at = null;
        $brand->save();
    }

    /** The processed logo, unless somebody uploaded one — an upload is never overwritten. */
    private function logoPath(string $slug, ?string $current): ?string
    {
        if ($current !== null && $current !== '' && ! str_starts_with($current, BrandLogos::BUNDLED_PREFIX)) {
            return $current;
        }

        return BrandLogos::bundledPath($slug);
    }

    /** The sample range is a range, not a make: it never carries a logo. */
    private function keepSampleRangeBare(): void
    {
        Brand::withTrashed()
            ->where('slug', BrandLogos::SAMPLE_RANGE)
            ->whereNotNull('logo_path')
            ->get()
            ->each(static function (Brand $brand): void {
                $brand->logo_path = null;
                $brand->save();
            });
    }

    /**
     * A seed that leaves a brand alone says so where it is always read: the log. A release seed
     * runs unattended on the host, and a seeder has no console of its own to rely on.
     */
    private function warn(string $message): void
    {
        Log::warning('BrandLogoSeeder: '.$message);
    }
}
