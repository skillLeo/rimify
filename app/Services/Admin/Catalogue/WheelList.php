<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Enums\CatalogueStatus;
use App\Enums\FitmentStatus;
use App\Models\WheelModel;
use App\Support\GermanFormat;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Katalog › Felgen: the one query behind the list (the review release §4.2).
 *
 * A row is a model — the thing the team names and publishes — with what its sizes add up to: how
 * many, from which price, how many in stock, and how many of them an approval document already
 * covers. That last figure is counted from published fitment rows, never from a flag, so a model
 * whose Gutachten has not been entered says so: „Freigaben noch nicht hinterlegt“.
 *
 * Parameter binding only (R-14).
 *
 * @phpstan-type Filters array{q: string|null, status: string|null, marke: int|null, freigaben: string|null, demo: string|null, sort: string, richtung: string}
 */
final class WheelList
{
    public const PER_PAGE = 25;

    public const SORTS = ['name', 'aktualisiert', 'preis', 'groessen'];

    /** The Freigaben filter: every size covered, some, or none. */
    public const COVERAGE = ['alle', 'teilweise', 'keine'];

    /**
     * @param  Filters  $filters
     * @return Builder<WheelModel>
     */
    public function query(array $filters): Builder
    {
        $query = WheelModel::query()
            ->select('wheel_models.*')
            ->join('brands', 'brands.id', '=', 'wheel_models.brand_id')
            ->addSelect('brands.name as brand_name')
            ->withCount(['configs as sizes', 'finishes'])
            ->withMin('configs as from_cents', 'price_cents')
            ->withSum('configs as stock', 'stock_qty')
            ->withMin('configs as smallest', 'diameter_in')
            ->withMax('configs as largest', 'diameter_in')
            ->addSelect(['covered' => self::coveredSizes()])
            ->with(['finishes' => static fn ($finishes) => $finishes->orderBy('sort_order')->orderBy('id')]);

        $this->filter($query, $filters);
        $this->sort($query, $filters['sort'], $filters['richtung']);

        return $query;
    }

    /**
     * The sizes of a model that at least one published fitment names — a correlated count, so the
     * list reads it for the page's 25 rows only.
     */
    private static function coveredSizes(): \Illuminate\Database\Query\Builder
    {
        return DB::table('wheel_configs as cc')
            ->whereColumn('cc.wheel_model_id', 'wheel_models.id')
            ->whereNull('cc.deleted_at')
            ->whereExists(static function ($exists): void {
                $exists->selectRaw('1')
                    ->from('fitments as cf')
                    ->whereColumn('cf.wheel_config_id', 'cc.id')
                    ->where('cf.status', FitmentStatus::Published->value);
            })
            ->selectRaw('COUNT(*)');
    }

    /**
     * @param  Builder<WheelModel>  $query
     * @param  Filters  $filters
     */
    private function filter(Builder $query, array $filters): void
    {
        $term = $filters['q'];

        if ($term !== null) {
            $like = '%'.addcslashes($term, '%_\\').'%';

            $query->where(static function (Builder $where) use ($like): void {
                $where->where('wheel_models.name', 'like', $like)
                    ->orWhere('brands.name', 'like', $like)
                    ->orWhereRaw("CONCAT_WS(' ', brands.name, wheel_models.name) LIKE ?", [$like])
                    ->orWhere('wheel_models.type_designation', 'like', $like)
                    ->orWhereHas('configs', static function (Builder $config) use ($like): void {
                        $config->where('sku', 'like', $like)->orWhere('ean', 'like', $like);
                    });
            });
        }

        // Archived models are out of the way unless asked for: they are the catalogue's past.
        $status = $filters['status'];

        if ($status !== null) {
            $query->where('wheel_models.status', $status);
        } else {
            $query->where('wheel_models.status', '<>', CatalogueStatus::Archived->value);
        }

        if ($filters['marke'] !== null) {
            $query->where('wheel_models.brand_id', $filters['marke']);
        }

        if ($filters['demo'] === 'ja') {
            $query->where('wheel_models.is_demo', true);
        } elseif ($filters['demo'] === 'nein') {
            $query->where('wheel_models.is_demo', false);
        }

        $coverage = $filters['freigaben'];

        if ($coverage !== null) {
            $sizes = DB::table('wheel_configs as sc')->whereColumn('sc.wheel_model_id', 'wheel_models.id')->whereNull('sc.deleted_at')->selectRaw('COUNT(*)');
            $covered = self::coveredSizes();

            match ($coverage) {
                // A model without sizes is covered by nothing, and never counted as fully covered.
                'alle' => $query->whereRaw('('.$covered->toSql().') = ('.$sizes->toSql().')', [...$covered->getBindings(), ...$sizes->getBindings()])
                    ->whereRaw('('.$sizes->toSql().') > 0', $sizes->getBindings()),
                'teilweise' => $query->whereRaw('('.$covered->toSql().') > 0', $covered->getBindings())
                    ->whereRaw('('.$covered->toSql().') < ('.$sizes->toSql().')', [...$covered->getBindings(), ...$sizes->getBindings()]),
                default => $query->whereRaw('('.$covered->toSql().') = 0', $covered->getBindings()),
            };
        }
    }

    /** @param  Builder<WheelModel>  $query */
    private function sort(Builder $query, string $sort, string $direction): void
    {
        $dir = $direction === 'ab' ? 'desc' : 'asc';

        match ($sort) {
            'aktualisiert' => $query->orderBy('wheel_models.updated_at', $dir),
            // A model without a price sorts last either way: it has nothing to compare.
            'preis' => $query->orderByRaw('from_cents IS NULL')->orderBy('from_cents', $dir),
            'groessen' => $query->orderBy('sizes', $dir),
            default => $query->orderBy('brands.name', $dir)->orderBy('wheel_models.name', $dir),
        };

        $query->orderBy('wheel_models.id', $dir);
    }

    /**
     * One row as the list shows it.
     *
     * @return array<string, mixed>
     */
    public function row(WheelModel $model): array
    {
        $sizes = (int) $model->getAttribute('sizes');
        $covered = (int) $model->getAttribute('covered');
        $smallest = $model->getAttribute('smallest');
        $largest = $model->getAttribute('largest');
        $finish = $model->finishes->first(static fn ($f): bool => is_array($f->image_manifest));
        $updated = $model->updated_at;

        return [
            'id' => (int) $model->id,
            'brand' => (string) $model->getAttribute('brand_name'),
            'name' => $model->name,
            'status' => $model->status->value,
            'statusLabel' => self::statusLabel($model->status),
            'demo' => $model->is_demo,
            'finishes' => (int) $model->getAttribute('finishes_count'),
            'sizes' => $sizes,
            'diameters' => $smallest === null ? null : self::diameters((float) $smallest, (float) $largest),
            // Minor units: the page writes the amount (num.ts formatMoney).
            'fromCents' => $model->getAttribute('from_cents') === null ? null : (int) $model->getAttribute('from_cents'),
            'stock' => (int) $model->getAttribute('stock'),
            'covered' => $covered,
            'coverage' => self::coverage($covered, $sizes),
            'image' => $finish === null ? null : ['manifest' => $finish->image_manifest, 'alt' => $finish->image_alt_de ?? $model->name],
            'updated' => $updated instanceof Carbon ? GermanFormat::date($updated) : null,
            'href' => '/admin/felgen/'.$model->id,
        ];
    }

    /** @return array{label: string, tone: string} */
    public static function coverage(int $covered, int $sizes): array
    {
        return match (true) {
            $sizes === 0 => ['label' => 'Noch keine Größen', 'tone' => 'neutral'],
            $covered === 0 => ['label' => 'Freigaben noch nicht hinterlegt', 'tone' => 'warn'],
            $covered === $sizes => ['label' => $sizes === 1 ? 'Die Größe hat eine Freigabe' : 'Alle '.$sizes.' Größen haben Freigaben', 'tone' => 'plain'],
            default => ['label' => $covered.' von '.$sizes.' Größen mit Freigabe', 'tone' => 'plain'],
        };
    }

    public static function statusLabel(CatalogueStatus $status): string
    {
        return match ($status) {
            CatalogueStatus::Draft => 'Entwurf',
            CatalogueStatus::Published => 'Im Shop',
            CatalogueStatus::Archived => 'Archiviert',
        };
    }

    /** `18–19 Zoll`, `19 Zoll`. */
    private static function diameters(float $smallest, float $largest): string
    {
        $inch = static fn (float $d): string => GermanFormat::decimal($d, fmod($d, 1.0) === 0.0 ? 0 : 1);

        return ($smallest === $largest ? $inch($smallest) : $inch($smallest).GermanFormat::ENDASH.$inch($largest)).' Zoll';
    }

    /**
     * What the filters can offer: the brands that have a model, and how many models each status holds.
     *
     * @return array{brands: list<array{value: string, label: string}>, statuses: list<array{value: string, label: string, count: int}>}
     */
    public function options(): array
    {
        $counts = DB::table('wheel_models')->whereNull('deleted_at')->select('status')->selectRaw('COUNT(*) as n')->groupBy('status')->pluck('n', 'status');
        $statuses = [];

        foreach (CatalogueStatus::cases() as $status) {
            $statuses[] = ['value' => $status->value, 'label' => self::statusLabel($status), 'count' => (int) ($counts[$status->value] ?? 0)];
        }

        $brands = DB::table('brands')
            ->whereNull('brands.deleted_at')
            ->whereExists(static fn ($exists) => $exists->selectRaw('1')->from('wheel_models as bm')->whereColumn('bm.brand_id', 'brands.id')->whereNull('bm.deleted_at'))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (object $b): array => ['value' => (string) $b->id, 'label' => (string) $b->name])
            ->values()
            ->all();

        return ['brands' => $brands, 'statuses' => $statuses];
    }
}
