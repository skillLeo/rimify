<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Enums\TyreSeason;
use App\Models\TyreVariant;
use App\Support\SearchTerm;
use Illuminate\Contracts\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Katalog › Reifen: the one query behind the list (his admin item 10, D-302).
 *
 * A row is one tyre — one size of one profile, as the shop sells it — with whether the shop offers it now: available
 * (D-301), and its EU label complete on record (D-303). A demonstration tyre says so and is never changed here.
 *
 * Parameter binding only (R-14).
 *
 * @phpstan-type Filters array{q: string|null, marke: int|null, saison: string|null, zoll: int|null, stand: string|null, sort: string, richtung: string}
 */
final class TyreList
{
    public const PER_PAGE = 25;

    /** The columns the list sorts by (F-32): the tyre's name, its size, its price. `reifen` A to Z is the plain list. */
    public const SORTS = ['reifen', 'groesse', 'preis'];

    /** The Stand filter, as the list names it. */
    public const STANDS = [
        'im-shop' => 'Im Shop',
        'nicht-verfuegbar' => 'Nicht verfügbar',
        'label-fehlt' => 'EU-Reifenlabel unvollständig',
        'demo' => 'Demodaten',
    ];

    /**
     * @param  Filters  $filters
     * @return Builder<TyreVariant>
     */
    public function query(array $filters): Builder
    {
        $query = TyreVariant::query()
            ->select('tyre_variants.*')
            ->join('brands', 'brands.id', '=', 'tyre_variants.brand_id')
            ->addSelect('brands.name as brand_name');

        $this->filter($query, $filters);

        $direction = $filters['richtung'] === 'ab' ? 'desc' : 'asc';
        $name = ['brands.name', 'tyre_variants.name'];
        $size = ['tyre_variants.diameter_in', 'tyre_variants.width_mm', 'tyre_variants.aspect', 'tyre_variants.load_index'];

        // The chosen column first, in its direction; then the plain list's order, so rows that tie keep one place.
        $first = match ($filters['sort']) {
            'groesse' => $size,
            'preis' => ['tyre_variants.price_cents'],
            default => $name,
        };

        foreach ($first as $column) {
            $query->orderBy($column, $direction);
        }

        foreach ([...$name, ...$size] as $column) {
            if (! in_array($column, $first, true)) {
                $query->orderBy($column);
            }
        }

        return $query->orderBy('tyre_variants.id');
    }

    /**
     * @param  Builder<TyreVariant>  $query
     * @param  Filters  $filters
     */
    private function filter(Builder $query, array $filters): void
    {
        $term = $filters['q'];

        if ($term !== null) {
            // A size as a tyre's wall prints it — `225/45`, `225/45 R18`, `22545` — or words: brand, profile, EPREL number.
            if (preg_match('#^(\d{3})\s*/?\s*(\d{2})?\s*(?:Z?R\s*(\d{2}))?#i', $term, $size) === 1) {
                // Digits alone may as well be an EPREL number (`381090`): both are looked for.
                $eprel = ctype_digit($term) ? '%'.$term.'%' : null;

                $query->where(static function (Builder $where) use ($size, $eprel): void {
                    $where->where(static function (Builder $match) use ($size): void {
                        $match->where('tyre_variants.width_mm', (int) $size[1]);

                        if (($size[2] ?? '') !== '') {
                            $match->where('tyre_variants.aspect', (int) $size[2]);
                        }

                        if (($size[3] ?? '') !== '') {
                            $match->where('tyre_variants.diameter_in', (int) $size[3]);
                        }
                    });

                    if ($eprel !== null) {
                        $where->orWhere('tyre_variants.eprel_id', 'like', $eprel);
                    }
                });
            } else {
                // Two spaces, an umlaut written out: still found (SearchTerm, Human QA 28.10.2026).
                $query->where(static function (Builder $where) use ($term): void {
                    foreach (SearchTerm::likes($term) as $like) {
                        $where->orWhere('tyre_variants.name', 'like', $like)
                            ->orWhere('brands.name', 'like', $like)
                            ->orWhereRaw("CONCAT_WS(' ', brands.name, tyre_variants.name) LIKE ?", [$like])
                            ->orWhere('tyre_variants.eprel_id', 'like', $like);
                    }
                });
            }
        }

        if ($filters['marke'] !== null) {
            $query->where('tyre_variants.brand_id', $filters['marke']);
        }

        if ($filters['saison'] !== null) {
            $query->where('tyre_variants.season', $filters['saison']);
        }

        if ($filters['zoll'] !== null) {
            $query->where('tyre_variants.diameter_in', $filters['zoll']);
        }

        match ($filters['stand']) {
            'im-shop' => $query->where('tyre_variants.is_demo', false)->where('tyre_variants.available', true)->where(static fn (QueryBuilder $q) => self::labelComplete($q)),
            'nicht-verfuegbar' => $query->where('tyre_variants.is_demo', false)->where('tyre_variants.available', false),
            'label-fehlt' => $query->where('tyre_variants.is_demo', false)->whereNot(static fn (QueryBuilder $q) => self::labelComplete($q)),
            'demo' => $query->where('tyre_variants.is_demo', true),
            default => null,
        };
    }

    /** Every entry of the EU label on record (D-303), as TyreVariant::whereOffered reads it. */
    private static function labelComplete(QueryBuilder $query): void
    {
        foreach (array_keys(TyreVariant::LABEL_FIELDS) as $column) {
            $query->whereNotNull('tyre_variants.'.$column);
        }

        $query->where('tyre_variants.eprel_id', '<>', '');
    }

    /** The live tyres a real one still lacks its label for (D-303): the backfill above the list. */
    public function missingLabels(): int
    {
        return TyreVariant::query()->where('is_demo', false)->whereNot(static fn (QueryBuilder $q) => self::labelComplete($q))->count();
    }

    /**
     * One row as the list shows it.
     *
     * @return array<string, mixed>
     */
    public function row(TyreVariant $tyre): array
    {
        $missing = $tyre->missingLabel();

        return [
            'id' => (int) $tyre->id,
            'brand' => (string) $tyre->getAttribute('brand_name'),
            'name' => (string) $tyre->name,
            'season' => TyreSeason::from((string) $tyre->season)->longLabelDe(),
            'size' => $tyre->label(),
            'label' => $missing === [] ? self::labelSummary($tyre) : null,
            'missingLabel' => $missing,
            // Minor units: the page writes the amount (num.ts formatMoney).
            'priceCents' => (int) $tyre->price_cents,
            'available' => (bool) $tyre->available,
            'demo' => (bool) $tyre->is_demo,
            'offered' => $tyre->offered(),
            'href' => '/admin/reifen/'.$tyre->id,
        ];
    }

    /**
     * The label in one line's worth of parts — classes, noise, pictograms — for a tyre whose label is complete.
     *
     * @return array{fuel: string, wet: string, noiseDb: int, noiseClass: string, snow: bool, ice: bool}
     */
    public static function labelSummary(TyreVariant $tyre): array
    {
        return [
            'fuel' => (string) $tyre->eu_fuel_class,
            'wet' => (string) $tyre->eu_wet_grip_class,
            'noiseDb' => (int) $tyre->eu_noise_db,
            'noiseClass' => (string) $tyre->eu_noise_class,
            'snow' => $tyre->eu_snow_grip === true,
            'ice' => $tyre->eu_ice_grip === true,
        ];
    }

    /**
     * What the filters can offer: the brands that have a tyre, the diameters there are, and the stands with their counts.
     *
     * @return array{brands: list<array{value: string, label: string}>, diameters: list<array{value: string, label: string}>, stands: list<array{value: string, label: string}>}
     */
    public function options(): array
    {
        $brands = DB::table('brands')
            ->whereNull('brands.deleted_at')
            ->whereExists(static fn ($exists) => $exists->selectRaw('1')->from('tyre_variants as bt')->whereColumn('bt.brand_id', 'brands.id')->whereNull('bt.deleted_at'))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (object $b): array => ['value' => (string) $b->id, 'label' => (string) $b->name])
            ->values()
            ->all();

        $diameters = DB::table('tyre_variants')
            ->whereNull('deleted_at')
            ->distinct()
            ->orderBy('diameter_in')
            ->pluck('diameter_in')
            ->map(static fn (mixed $d): array => ['value' => (string) (int) $d, 'label' => (int) $d.' Zoll'])
            ->values()
            ->all();

        $stands = [];

        foreach (self::STANDS as $value => $label) {
            $stands[] = ['value' => $value, 'label' => $label];
        }

        return ['brands' => $brands, 'diameters' => $diameters, 'stands' => $stands];
    }
}
