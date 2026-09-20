<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Infrastructure;

use App\Domain\Fitment\Support\RangeSql;
use App\Enums\CatalogueStatus;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use Illuminate\Support\Facades\DB;

/**
 * The product listing: every wheel legally permitted on one vehicle, as ONE statement.
 *
 * A listing filtered in application code has to load every candidate row into memory before
 * rejecting most of them, which is how a listing page ends up taking four seconds. Filtering in
 * the database against the composite indexes is what puts "results under two seconds at P95"
 * within reach by design rather than by bolting a cache on later.
 *
 * `ROW_NUMBER() OVER (PARTITION BY model, finish)` replaces PostgreSQL's `DISTINCT ON`: one card
 * per model-and-finish, showing its cheapest permitted configuration.
 *
 * Facet counts come from a single aggregate over the same predicate, so a count can never
 * disagree with the list it describes.
 */
final readonly class ListingQuery
{
    /** Filters that narrow the result set. Unknown keys are ignored rather than trusted. */
    public const FACETS = ['marke', 'zoll', 'breite', 'et', 'farbe', 'ohne_eintragung'];

    /**
     * @param  array<string, mixed>  $filters
     * @return array{rows: list<array<string, mixed>>, total: int}
     */
    public function results(int $vehicleId, array $filters = [], int $perPage = 24, int $page = 1): array
    {
        [$where, $bindings] = $this->predicate($vehicleId, $filters);

        $sql = "
            SELECT * FROM (
                SELECT
                    wm.id                AS model_id,
                    wm.name              AS model_name,
                    wm.slug              AS model_slug,
                    br.name              AS brand_name,
                    wf.id                AS finish_id,
                    wf.name_de           AS finish_name,
                    wc.id                AS wheel_config_id,
                    wc.price_cents       AS price_cents,
                    wc.stock_qty         AS stock_qty,
                    wc.diameter_in       AS diameter_in,
                    wc.width_in          AS width_in,
                    wc.et_mm             AS et_mm,
                    MIN(wc.price_cents)  OVER (PARTITION BY wm.id, wf.id) AS from_price_cents,
                    MAX(wc.stock_qty)    OVER (PARTITION BY wm.id, wf.id) AS best_stock_qty,
                    MAX(f.requires_entry) OVER (PARTITION BY wm.id, wf.id) AS any_entry_required,
                    ROW_NUMBER()         OVER (PARTITION BY wm.id, wf.id ORDER BY wc.price_cents ASC, wc.id ASC) AS rn
                {$this->fromAndJoins()}
                WHERE {$where}
            ) t
            WHERE t.rn = 1
            ORDER BY t.from_price_cents ASC, t.model_id ASC, t.finish_id ASC
            LIMIT ? OFFSET ?
        ";

        $offset = max(0, ($page - 1) * $perPage);

        /** @var list<object> $rows */
        $rows = DB::select($sql, [...$bindings, $perPage, $offset]);

        return [
            'rows' => array_map(static fn (object $r): array => (array) $r, $rows),
            'total' => $this->total($vehicleId, $filters),
        ];
    }

    /**
     * How many cards the current filter set produces, for pagination.
     *
     * @param  array<string, mixed>  $filters
     */
    public function total(int $vehicleId, array $filters = []): int
    {
        [$where, $bindings] = $this->predicate($vehicleId, $filters);

        $sql = "
            SELECT COUNT(*) AS c FROM (
                SELECT 1
                {$this->fromAndJoins()}
                WHERE {$where}
                GROUP BY wm.id, wf.id
            ) t
        ";

        $row = DB::selectOne($sql, $bindings);

        return $row === null ? 0 : (int) $row->c;
    }

    /**
     * Every facet's option counts, from ONE aggregate over the same predicate.
     *
     * Counts are computed with the OTHER filters applied but not the facet's own — which is what
     * makes "18 Zoll (312)" mean "312 results if you add this", rather than a number that only
     * matches when nothing else is selected. Options returning zero are kept in the result so the
     * UI can disable rather than hide them.
     *
     * Returned as a list of value/count pairs rather than a keyed map: PHP silently converts a
     * numeric-looking array key, so an 18-inch diameter would arrive as the integer 18 and a
     * width of 8.5 as the string "8.5" — two facets, two different key types, one confused UI.
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, list<array{value: string, count: int}>>
     */
    public function facets(int $vehicleId, array $filters = []): array
    {
        $facets = [];

        foreach (['marke', 'zoll', 'breite', 'et', 'farbe'] as $facet) {
            $others = $filters;
            unset($others[$facet]);

            [$where, $bindings] = $this->predicate($vehicleId, $others);
            $column = $this->facetColumn($facet);

            $sql = "
                SELECT {$column} AS v, COUNT(DISTINCT wm.id, wf.id) AS c
                {$this->fromAndJoins()}
                WHERE {$where}
                GROUP BY {$column}
                ORDER BY {$column} ASC
            ";

            $counts = [];

            foreach (DB::select($sql, $bindings) as $row) {
                $counts[] = ['value' => (string) $row->v, 'count' => (int) $row->c];
            }

            $facets[$facet] = $counts;
        }

        // The Ohne-Eintragung toggle is a first-class facet: for a large share of German buyers it
        // is the single most important attribute of the purchase.
        $others = $filters;
        unset($others['ohne_eintragung']);
        [$where, $bindings] = $this->predicate($vehicleId, $others);

        $sql = "
            SELECT COUNT(DISTINCT wm.id, wf.id) AS c
            {$this->fromAndJoins()}
            WHERE {$where} AND f.requires_entry = 0
        ";

        $row = DB::selectOne($sql, $bindings);
        $facets['ohne_eintragung'] = [['value' => '1', 'count' => $row === null ? 0 : (int) $row->c]];

        return $facets;
    }

    /**
     * The FROM and JOIN clause, identical for results, total and facets — which is what guarantees
     * a facet count can never describe a different set from the list beside it.
     */
    private function fromAndJoins(): string
    {
        return '
            FROM fitments f
            JOIN approval_documents ad ON ad.id = f.approval_document_id
            JOIN vehicles v            ON v.id = f.vehicle_id
            JOIN wheel_configs wc      ON wc.id = f.wheel_config_id
            JOIN wheel_models wm       ON wm.id = wc.wheel_model_id
            JOIN wheel_finishes wf     ON wf.id = wc.wheel_finish_id
            JOIN brands br             ON br.id = wm.brand_id
        ';
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{0: string, 1: list<mixed>}
     */
    private function predicate(int $vehicleId, array $filters): array
    {
        $today = now()->toDateString();

        // Leading with `f.vehicle_id = ? AND f.status = ?` matches idx_fitment_lookup's key order.
        $clauses = [
            'f.vehicle_id = ?',
            'f.status = ?',
            'ad.status = ?',
            '(ad.valid_from IS NULL OR ad.valid_from <= ?)',
            '(ad.valid_to IS NULL OR ad.valid_to >= ?)',
            'v.deleted_at IS NULL',
            'wm.status = ?',
            'wc.deleted_at IS NULL',
            'wm.deleted_at IS NULL',
            // R-03: a vehicle we cannot characterise never appears in a listing as permitted.
            'v.needs_review = 0',
            'v.axle_load_front_kg IS NOT NULL',
            'v.axle_load_rear_kg IS NOT NULL',
            'v.max_speed_kmh IS NOT NULL',
            // The document's own build-window scope against the vehicle's, written once.
            '('.RangeSql::windowsOverlapExpression('f', 'v').')',
            // The wheel's actual geometry inside what the row permits, written once.
            '('.RangeSql::withinExpression('wc.width_in', 'f.permitted_width').')',
            '('.RangeSql::withinExpression('wc.et_mm', 'f.permitted_et').')',
        ];

        $bindings = [
            $vehicleId,
            FitmentStatus::Published->value,
            DocumentStatus::Published->value,
            $today,
            $today,
            CatalogueStatus::Published->value,
        ];

        foreach ($this->normalise($filters) as $facet => $value) {
            if ($facet === 'ohne_eintragung') {
                $clauses[] = 'f.requires_entry = 0';

                continue;
            }

            $column = $this->facetColumn($facet);
            /** @var list<scalar> $values */
            $values = is_array($value) ? array_values($value) : [$value];
            $placeholders = implode(', ', array_fill(0, count($values), '?'));
            $clauses[] = "{$column} IN ({$placeholders})";
            $bindings = [...$bindings, ...$values];
        }

        return [implode(' AND ', $clauses), $bindings];
    }

    /**
     * Only known facets survive, and every value arrives as a binding — a filter name from a query
     * string never reaches the SQL text (R-14).
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    private function normalise(array $filters): array
    {
        $clean = [];

        foreach ($filters as $key => $value) {
            if (! in_array($key, self::FACETS, true)) {
                continue;
            }

            if ($key === 'ohne_eintragung') {
                if ($value === true || $value === '1' || $value === 1) {
                    $clean[$key] = true;
                }

                continue;
            }

            $values = array_values(array_filter(
                is_array($value) ? $value : [$value],
                static fn ($v): bool => $v !== null && $v !== '',
            ));

            if ($values !== []) {
                $clean[$key] = $values;
            }
        }

        return $clean;
    }

    /** Facet name to column. A match arm, so no caller-supplied string is ever interpolated. */
    private function facetColumn(string $facet): string
    {
        return match ($facet) {
            'marke' => 'br.name',
            'zoll' => 'wc.diameter_in',
            'breite' => 'wc.width_in',
            'et' => 'wc.et_mm',
            'farbe' => 'wf.name_de',
            default => throw new \InvalidArgumentException("Unknown facet [{$facet}]."),
        };
    }
}
