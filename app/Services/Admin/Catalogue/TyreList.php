<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Models\TyreModel;
use App\Models\TyreModelImage;
use App\Models\TyreVariant;
use App\Support\GermanFormat;
use App\Support\SearchTerm;
use Illuminate\Contracts\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Facades\DB;

/**
 * Katalog › Reifen: the one query behind the list (his admin item 10, D-302; the Gutachten rework §9).
 *
 * A row is one tyre model with what its sizes add up to: how many, in which diameters, from what price, how many
 * of them the shop offers now — available (D-301) and their EU label complete on record (D-303). Search and filters find a model by
 * any of its sizes. Fifty to a page, so it stays usable with hundreds. A demonstration tyre says so and is never changed here.
 *
 * Parameter binding only (R-14).
 *
 * @phpstan-type Filters array{q: string|null, marke: int|null, saison: string|null, zoll: int|null, stand: string|null, sort: string, richtung: string}
 */
final class TyreList
{
    public const PER_PAGE = 50;

    /** The columns the list sorts by (F-32): the tyre's name, its lowest price, when it last changed. `reifen` A to Z is the plain list. */
    public const SORTS = ['reifen', 'preis', 'geaendert'];

    /** The Stand filter, as the list names it: a model with at least one such size. */
    public const STANDS = [
        'im-shop' => 'Im Shop',
        'nicht-verfuegbar' => 'Nicht verfügbar',
        'label-fehlt' => 'EU-Reifenlabel unvollständig',
        'demo' => 'Demodaten',
    ];

    /**
     * @param  Filters  $filters
     * @return Builder<TyreModel>
     */
    public function query(array $filters): Builder
    {
        $sizes = DB::table('tyre_variants as s')
            ->whereNull('s.deleted_at')
            ->select('s.brand_id', 's.name', 's.season')
            ->selectRaw('COUNT(*) as sizes, MIN(s.price_cents) as price_from, MAX(s.updated_at) as changed')
            ->groupBy('s.brand_id', 's.name', 's.season');

        $query = TyreModel::query()
            ->select('tyre_models.*')
            ->addSelect('brands.name as brand_name', 'sizes.sizes', 'sizes.price_from', 'sizes.changed')
            ->join('brands', 'brands.id', '=', 'tyre_models.brand_id')
            ->joinSub($sizes, 'sizes', static function (JoinClause $join): void {
                $join->on('sizes.brand_id', '=', 'tyre_models.brand_id')
                    ->on('sizes.name', '=', 'tyre_models.name')
                    ->on('sizes.season', '=', 'tyre_models.season');
            });

        $this->filter($query, $filters);

        $direction = $filters['richtung'] === 'ab' ? 'desc' : 'asc';
        $name = ['brands.name', 'tyre_models.name', 'tyre_models.season'];

        // The chosen column first, in its direction; then the plain list's order, so rows that tie keep one place.
        $first = match ($filters['sort']) {
            'preis' => ['sizes.price_from'],
            'geaendert' => ['sizes.changed'],
            default => $name,
        };

        foreach ($first as $column) {
            $query->orderBy($column, $direction);
        }

        foreach ($name as $column) {
            if (! in_array($column, $first, true)) {
                $query->orderBy($column);
            }
        }

        return $query->orderBy('tyre_models.id');
    }

    /** Every model with a size, whatever the filters say. */
    public function total(): int
    {
        return $this->query(['q' => null, 'marke' => null, 'saison' => null, 'zoll' => null, 'stand' => null, 'sort' => 'reifen', 'richtung' => 'auf'])->count();
    }

    /**
     * A model is in the list if one of its sizes answers: a size as a wall prints it, an EPREL number, a diameter, a stand.
     *
     * @param  Builder<TyreModel>  $query
     * @param  Filters  $filters
     */
    private function filter(Builder $query, array $filters): void
    {
        if ($filters['marke'] !== null) {
            $query->where('tyre_models.brand_id', $filters['marke']);
        }

        if ($filters['saison'] !== null) {
            $query->where('tyre_models.season', $filters['saison']);
        }

        if ($filters['q'] === null && $filters['zoll'] === null && $filters['stand'] === null) {
            return;
        }

        $query->whereExists(function (QueryBuilder $size) use ($filters): void {
            $size->selectRaw('1')
                ->from('tyre_variants as f')
                ->whereNull('f.deleted_at')
                ->whereColumn('f.brand_id', 'tyre_models.brand_id')
                ->whereColumn('f.name', 'tyre_models.name')
                ->whereColumn('f.season', 'tyre_models.season');

            if ($filters['q'] !== null) {
                $this->search($size, $filters['q']);
            }

            if ($filters['zoll'] !== null) {
                $size->where('f.diameter_in', $filters['zoll']);
            }

            match ($filters['stand']) {
                'im-shop' => $size->where('f.is_demo', false)->where('f.available', true)->where(static fn (QueryBuilder $q) => self::labelComplete($q, 'f')),
                'nicht-verfuegbar' => $size->where('f.is_demo', false)->where('f.available', false),
                'label-fehlt' => $size->where('f.is_demo', false)->whereNot(static fn (QueryBuilder $q) => self::labelComplete($q, 'f')),
                'demo' => $size->where('f.is_demo', true),
                default => null,
            };
        });
    }

    /** A size as a tyre's wall prints it — `225/45`, `225/45 R18`, `22545` — or words: brand, model, EPREL number. */
    private function search(QueryBuilder $size, string $term): void
    {
        if (preg_match('#^(\d{3})\s*/?\s*(\d{2})?\s*(?:Z?R\s*(\d{2}))?#i', $term, $parts) === 1) {
            // Digits alone may as well be an EPREL number (`381090`): both are looked for.
            $eprel = ctype_digit($term) ? '%'.$term.'%' : null;

            $size->where(static function (QueryBuilder $where) use ($parts, $eprel): void {
                $where->where(static function (QueryBuilder $match) use ($parts): void {
                    $match->where('f.width_mm', (int) $parts[1]);

                    if (($parts[2] ?? '') !== '') {
                        $match->where('f.aspect', (int) $parts[2]);
                    }

                    if (($parts[3] ?? '') !== '') {
                        $match->where('f.diameter_in', (int) $parts[3]);
                    }
                });

                if ($eprel !== null) {
                    $where->orWhere('f.eprel_id', 'like', $eprel);
                }
            });

            return;
        }

        // Two spaces, an umlaut written out: still found (SearchTerm, Human QA 28.10.2026).
        $size->where(static function (QueryBuilder $where) use ($term): void {
            foreach (SearchTerm::likes($term) as $like) {
                $where->orWhere('tyre_models.name', 'like', $like)
                    ->orWhere('brands.name', 'like', $like)
                    ->orWhereRaw("CONCAT_WS(' ', brands.name, tyre_models.name) LIKE ?", [$like])
                    ->orWhere('f.eprel_id', 'like', $like);
            }
        });
    }

    /** Every entry of the EU label on record (D-303), as TyreVariant::whereOffered reads it. */
    private static function labelComplete(QueryBuilder $query, string $table = 'tyre_variants'): void
    {
        foreach (array_keys(TyreVariant::LABEL_FIELDS) as $column) {
            $query->whereNotNull($table.'.'.$column);
        }

        $query->where($table.'.eprel_id', '<>', '');
    }

    /** The live tyres a real one still lacks its label for (D-303): the backfill above the list. */
    public function missingLabels(): int
    {
        return TyreVariant::query()->where('is_demo', false)->whereNot(static fn (QueryBuilder $q) => self::labelComplete($q))->count();
    }

    /**
     * The rows of one page, as the list shows them: what the sizes add up to and the cover photo, read once for the page.
     *
     * @param  list<TyreModel>  $models
     * @return list<array<string, mixed>>
     */
    public function rows(array $models): array
    {
        if ($models === []) {
            return [];
        }

        $key = static fn (int $brand, string $name, string $season): string => $brand."\0".mb_strtolower($name)."\0".$season;
        $sizes = TyreVariant::query()
            ->whereIn('brand_id', array_map(static fn (TyreModel $m): int => (int) $m->brand_id, $models))
            ->whereIn('name', array_map(static fn (TyreModel $m): string => (string) $m->name, $models))
            ->get()
            ->groupBy(static fn (TyreVariant $tyre): string => $key((int) $tyre->getAttribute('brand_id'), (string) $tyre->getAttribute('name'), (string) $tyre->getAttribute('season')));
        $images = TyreModelImage::query()
            ->whereIn('tyre_model_id', array_map(static fn (TyreModel $m): int => (int) $m->id, $models))
            ->orderBy('position')
            ->orderBy('id')
            ->get()
            ->groupBy('tyre_model_id');

        return array_map(static function (TyreModel $model) use ($key, $sizes, $images): array {
            $own = $sizes->get($key((int) $model->brand_id, (string) $model->name, (string) $model->season)) ?? collect();
            $photos = $images->get($model->id) ?? collect();
            $cover = $photos->first();
            $diameters = $own->map(static fn (TyreVariant $tyre): int => (int) $tyre->diameter_in)->unique()->sort()->values();
            $real = $own->reject(static fn (TyreVariant $tyre): bool => (bool) $tyre->is_demo);

            return [
                'id' => (int) $model->id,
                'brand' => (string) $model->getAttribute('brand_name'),
                'name' => (string) $model->name,
                'season' => (string) $model->season,
                'thumb' => $cover instanceof TyreModelImage ? $cover->manifest : null,
                'photos' => $photos->count(),
                'sizes' => $own->count(),
                // `18 Zoll`, `17–19 Zoll`
                'diameters' => $diameters->count() < 2
                    ? $diameters->first().GermanFormat::NBSP.'Zoll'
                    : $diameters->first().'–'.$diameters->last().GermanFormat::NBSP.'Zoll',
                // Minor units: the page writes the amount (num.ts formatMoney).
                'priceFromCents' => (int) $model->getAttribute('price_from'),
                'missingLabels' => $real->filter(static fn (TyreVariant $tyre): bool => $tyre->missingLabel() !== [])->count(),
                'offered' => $real->filter(static fn (TyreVariant $tyre): bool => $tyre->offered())->count(),
                'demo' => $own->contains(static fn (TyreVariant $tyre): bool => (bool) $tyre->is_demo),
                'changed' => GermanFormat::date($own->max('updated_at')),
                'href' => '/admin/reifen/modell/'.$model->id,
            ];
        }, $models);
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
