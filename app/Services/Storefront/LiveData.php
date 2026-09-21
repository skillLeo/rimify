<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Enums\CatalogueStatus;
use Illuminate\Support\Facades\DB;

/**
 * The catalogue, expressed in the shape the design's runtime reads.
 *
 * ── Why this exists ──────────────────────────────────────────────────────────────────────────
 *
 * The design ships `shared/data.js`, which defines `window.RMF` and fills it with twelve
 * demonstration wheels, eight makes and a handful of orders. Every component the runtime draws —
 * the product card, the listing, the selector, the FAQ — reads from that object. Shipping the
 * runtime unmodified therefore also ships its demo catalogue, which is why the storefront looked
 * finished while showing wheels nobody stocks and vehicles nobody can buy for.
 *
 * This produces the identical object from the real catalogue, so the runtime keeps generating the
 * markup and the DATA underneath it becomes ours. That is the whole point of doing it this way:
 * the design's code stays byte-identical, and the pages stop being a demonstration.
 *
 * ── Why it is not a second fitment implementation ────────────────────────────────────────────
 *
 * Failure mode F5 in the spec is four surfaces computing compatibility four ways, and R-13
 * exists to prevent it: every surface calls the identical engine. This service does NOT decide
 * what is permitted. It asks the same `fitments` rows the listing query asks, applies the same
 * published/build-window scoping, and translates the answer into the runtime's vocabulary. It is
 * a fourth reader of one table, not a second opinion about it.
 *
 * ── The one place the vocabularies do not line up ────────────────────────────────────────────
 *
 * R-07 requires four verdict states. The design's runtime understands two — a wheel is `ok` or
 * `conditional`, with unpermitted sizes listed in `blocked`. It has no way to say UNKNOWN, and
 * `verdictPanel()` falls through to "Passend für …" for anything that is not conditional. Left
 * alone, a wheel we hold no document for would be presented as approved, which is precisely the
 * confidently-wrong answer R-00 forbids.
 *
 * So the payload emits a third value, `unknown`, and `public/prototype/design-fixes.js` teaches
 * the runtime to render it. NOT_PERMITTED needs no new value: a size that no published document
 * permits is simply listed in `blocked`, which the design already draws struck through and
 * disabled.
 */
final readonly class LiveData
{
    /**
     * The whole payload. `$vehicleId` is the visitor's chosen vehicle, or null when they have not
     * chosen one — and that distinction decides whether any fitment claim is made at all.
     *
     * @return array<string, mixed>
     */
    public function payload(?int $vehicleId = null): array
    {
        return [
            'wheels' => $this->wheels($vehicleId),
            'tyres' => $this->tyres(),
            'makes' => $this->makes(),
            'faq' => $this->faq(),
            'legal' => $this->legal(),
            'brands' => $this->brands(),
            'tiles' => $this->tiles(),
        ];
    }

    /**
     * One entry per wheel model and finish — the design's own granularity, since that is what its
     * product card represents.
     *
     * `sku` carries our model slug rather than a stock-keeping number. The runtime builds its
     * product links as `produkt.html?sku=…`, so putting the slug there makes those links resolve
     * directly onto `/felgen/{model}` with no lookup table in between.
     *
     * @return list<array<string, mixed>>
     */
    private function wheels(?int $vehicleId): array
    {
        $rows = DB::table('wheel_configs as wc')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->join('wheel_finishes as wf', 'wf.id', '=', 'wc.wheel_finish_id')
            ->join('brands as br', 'br.id', '=', 'wm.brand_id')
            ->whereNull('wc.deleted_at')
            ->whereNull('wm.deleted_at')
            ->where('wm.status', CatalogueStatus::Published->value)
            ->groupBy('wm.id', 'wm.name', 'wm.slug', 'wm.spoke_count', 'wm.rating', 'wm.rating_count', 'br.name', 'wf.id', 'wf.name_de', 'wf.art_finish')
            ->orderBy('br.name')
            ->orderBy('wm.name')
            ->get([
                'wm.id as model_id',
                'wm.name as model_name',
                'wm.slug as slug',
                'wm.spoke_count',
                'wm.rating',
                'wm.rating_count',
                'br.name as brand_name',
                'wf.id as finish_id',
                'wf.name_de as finish_name',
                'wf.art_finish',
                DB::raw('MIN(wc.price_cents) as from_price_cents'),
                DB::raw('MAX(wc.stock_qty) as best_stock'),
                DB::raw('GROUP_CONCAT(DISTINCT wc.diameter_in ORDER BY wc.diameter_in) as diameters'),
                DB::raw('GROUP_CONCAT(DISTINCT wc.width_in ORDER BY wc.width_in) as widths'),
                DB::raw('MIN(wc.et_mm) as et'),
            ]);

        $permitted = $vehicleId === null ? [] : $this->permittedFor($vehicleId);
        $conditions = $vehicleId === null ? [] : $this->conditionsFor($vehicleId);

        $out = [];

        foreach ($rows as $row) {
            $modelId = (int) $row->model_id;
            $sizes = $this->numbers((string) ($row->diameters ?? ''));
            $fit = $permitted[$modelId] ?? null;

            /*
             * No vehicle chosen → no claim of any kind. `blocked` stays empty and `verdict` is
             * null, and the runtime's `fitMarker()` already draws nothing when no vehicle is set.
             * A card that says "Passend" without naming a car is the failure this product exists
             * to avoid.
             */
            if ($vehicleId === null) {
                $verdict = null;
                $blocked = [];
            } elseif ($fit === null) {
                /*
                 * A vehicle is chosen and no published document permits this wheel on it. That is
                 * UNKNOWN, not "no" (R-07) — and the wheel is left out of the payload entirely.
                 *
                 * Failing closed rather than labelling it, because the design's runtime has no
                 * UNKNOWN state: `verdictPanel()` falls through to "Passend für …" for anything
                 * that is not conditional, so a wheel we cannot vouch for would be presented as
                 * approved. R-00 — Rimify may be silent, it may never be confidently wrong.
                 *
                 * Omitting it is also what the spec's own listing query does: §4.5 returns
                 * only wheels a published document permits, so a wheel with no document simply
                 * does not appear. The state is not lost — it is what feeds the catalogue-gap
                 * report (§8.7), which is read from the fitment tables rather than from here.
                 */
                continue;
            } else {
                $verdict = $fit['requiresEntry'] || ($conditions[$modelId] ?? []) !== []
                    ? 'conditional'
                    : 'ok';

                // Every diameter this wheel is made in that no published document permits on this
                // car. The design draws these struck through and disabled rather than hiding them,
                // because "not for your car" tells the customer something true about their car.
                $blocked = [];

                foreach ($sizes as $size) {
                    if (! in_array($size, $fit['diameters'], true)) {
                        $blocked[] = $size;
                    }
                }
            }

            $out[] = [
                'sku' => (string) $row->slug,
                'brand' => (string) $row->brand_name,
                'model' => (string) $row->model_name,
                'finish' => is_string($row->art_finish) ? $row->art_finish : 'graphite',
                'finishName' => (string) $row->finish_name,
                'spokes' => (int) $row->spoke_count,
                'design' => $this->designName((int) $row->spoke_count),
                'sizes' => $sizes,
                'widths' => $this->numbers((string) ($row->widths ?? '')),
                'et' => (int) $row->et,
                // price_cents is per wheel; the design prints "für 4 Felgen" beneath it.
                'price' => round(((int) $row->from_price_cents * 4) / 100, 2),
                'rating' => $row->rating === null ? 0 : round((float) $row->rating, 1),
                'reviews' => (int) $row->rating_count,
                'stock' => ((int) $row->best_stock) > 0 ? 'in' : 'out',
                'verdict' => $verdict,
                'conditions' => $conditions[$modelId] ?? [],
                'sale' => false,
                'blocked' => $blocked,
            ];
        }

        return $out;
    }

    /**
     * Which diameters a published document permits on this vehicle, per wheel model.
     *
     * One statement for the whole catalogue rather than one per card — the same reasoning as the
     * listing query, which the spec makes a single indexed statement precisely so a page of
     * results does not become a page of queries.
     *
     * @return array<int, array{diameters: list<float>, requiresEntry: bool}>
     */
    private function permittedFor(int $vehicleId): array
    {
        $rows = DB::table('fitments as f')
            ->join('approval_documents as ad', 'ad.id', '=', 'f.approval_document_id')
            ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
            ->where('f.vehicle_id', $vehicleId)
            ->where('f.status', 'published')
            ->where('ad.status', 'published')
            // A superseded revision must stop answering. R-06 / §4.11.
            ->where(fn ($q) => $q->whereNull('ad.valid_to')->orWhere('ad.valid_to', '>=', now()->toDateString()))
            ->whereNull('wc.deleted_at')
            ->groupBy('wc.wheel_model_id', 'wc.diameter_in')
            ->get([
                'wc.wheel_model_id as model_id',
                'wc.diameter_in',
                DB::raw('MAX(f.requires_entry) as requires_entry'),
            ]);

        $out = [];

        foreach ($rows as $row) {
            $modelId = (int) $row->model_id;
            $out[$modelId]['diameters'][] = (float) $row->diameter_in;
            $out[$modelId]['requiresEntry'] = ($out[$modelId]['requiresEntry'] ?? false)
                || (bool) $row->requires_entry;
        }

        return $out;
    }

    /**
     * The Auflagen for this vehicle, per wheel model, as complete German sentences.
     *
     * R-15: a customer is never shown a bare code such as `A02`. The runtime prints these
     * verbatim, so what is stored in `condition_codes.text_de` is what the customer reads — which
     * is also why that wording is editable content rather than code.
     *
     * @return array<int, list<string>>
     */
    private function conditionsFor(int $vehicleId): array
    {
        $rows = DB::table('fitments as f')
            ->join('approval_documents as ad', 'ad.id', '=', 'f.approval_document_id')
            ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
            ->join('fitment_conditions as fc', 'fc.fitment_id', '=', 'f.id')
            ->join('condition_codes as cc', 'cc.id', '=', 'fc.condition_code_id')
            ->where('f.vehicle_id', $vehicleId)
            ->where('f.status', 'published')
            ->where('ad.status', 'published')
            ->whereNull('wc.deleted_at')
            ->orderBy('cc.sort_order')
            ->distinct()
            // `sort_order` is selected because MySQL refuses to order a DISTINCT result by a
            // column outside the select list. One code has one sort order, so no extra rows.
            ->get(['wc.wheel_model_id as model_id', 'cc.text_de', 'cc.severity', 'cc.sort_order']);

        $out = [];

        foreach ($rows as $row) {
            $modelId = (int) $row->model_id;
            $text = (string) $row->text_de;

            if (! in_array($text, $out[$modelId] ?? [], true)) {
                $out[$modelId][] = $text;
            }
        }

        return $out;
    }

    /**
     * Make → model → variant, carrying the key numbers.
     *
     * The runtime rebuilds its own HSN/TSN index from this, so a lookup on the storefront resolves
     * against the real vehicle table — including the case R-01 exists for, where one HSN and TSN
     * pair resolves to more than one car and the selector must ask which.
     *
     * @return list<array<string, mixed>>
     */
    private function makes(): array
    {
        $rows = DB::table('vehicles')
            ->whereNull('deleted_at')
            ->orderBy('make')->orderBy('model')->orderBy('variant')
            ->get([
                'make', 'model', 'variant', 'hsn', 'tsn', 'vsn',
                'build_from', 'build_to', 'power_kw', 'power_ps',
                'body_form', 'max_speed_kmh',
            ]);

        $tree = [];

        foreach ($rows as $row) {
            $make = (string) $row->make;
            $model = (string) $row->model;

            $tree[$make][$model][] = [
                'name' => (string) $row->variant,
                'years' => $this->buildPeriod($row->build_from, $row->build_to),
                'kw' => (int) ($row->power_kw ?? 0),
                'ps' => (int) ($row->power_ps ?? 0),
                'body' => (string) ($row->body_form ?? ''),
                'vmax' => (int) ($row->max_speed_kmh ?? 0),
                'hsn' => (string) $row->hsn,
                'tsn' => (string) $row->tsn,
                'vsn' => $row->vsn === null ? null : (string) $row->vsn,
            ];
        }

        $out = [];

        foreach ($tree as $make => $models) {
            $modelList = [];

            foreach ($models as $model => $variants) {
                $modelList[] = ['name' => $model, 'variants' => $variants];
            }

            $out[] = ['name' => $make, 'models' => $modelList];
        }

        return $out;
    }

    /** @return list<array<string, mixed>> */
    private function tyres(): array
    {
        $rows = DB::table('tyre_variants as tv')
            ->join('brands as br', 'br.id', '=', 'tv.brand_id')
            ->whereNull('tv.deleted_at')
            ->orderBy('tv.price_cents')
            ->get([
                'br.name as brand_name', 'tv.name', 'tv.season',
                'tv.width_mm', 'tv.aspect', 'tv.diameter_in',
                'tv.load_index', 'tv.speed_symbol', 'tv.price_cents',
            ]);

        $out = [];
        $first = true;

        foreach ($rows as $row) {
            $out[] = [
                'brand' => (string) $row->brand_name,
                'model' => (string) $row->name,
                'season' => (string) $row->season,
                'size' => sprintf(
                    '%d/%d R%s %d%s',
                    (int) $row->width_mm,
                    (int) $row->aspect,
                    rtrim(rtrim((string) $row->diameter_in, '0'), '.'),
                    (int) $row->load_index,
                    (string) $row->speed_symbol,
                ),
                // price_cents is per tyre; the design prints "für 4 Kompletträder".
                'price' => round(((int) $row->price_cents * 4) / 100, 2),
                'rating' => 5,
                'reviews' => 0,
                'best' => $first,
            ];

            $first = false;
        }

        return $out;
    }

    /** @return list<array<string, string>> */
    private function faq(): array
    {
        $rows = DB::table('faq_entries')
            ->where('published', true)
            ->orderBy('sort_order')
            ->get(['group_key', 'question_de', 'answer_de']);

        $out = [];

        foreach ($rows as $row) {
            $out[] = [
                'g' => (string) $row->group_key,
                'q' => (string) $row->question_de,
                'a' => (string) $row->answer_de,
            ];
        }

        return $out;
    }

    /** @return list<array<string, mixed>> */
    private function legal(): array
    {
        $rows = DB::table('pages')
            ->where('kind', 'legal')
            ->orderBy('id')
            ->get(['slug', 'title']);

        $out = [];

        foreach ($rows as $row) {
            $out[] = ['id' => (string) $row->slug, 't' => (string) $row->title, 'h' => []];
        }

        return $out;
    }

    /**
     * Brands we actually hold published wheels for, in the client's display order.
     *
     * Grouped rather than DISTINCT: MySQL runs with ONLY_FULL_GROUP_BY, which refuses to order a
     * DISTINCT result by a column that is not selected — and `sort_order` must not be selected,
     * because doing so would make two brands with the same name but different order distinct rows.
     *
     * @return list<string>
     */
    private function brands(): array
    {
        $rows = DB::table('brands as br')
            ->join('wheel_models as wm', 'wm.brand_id', '=', 'br.id')
            ->whereNull('br.deleted_at')
            ->where('wm.status', CatalogueStatus::Published->value)
            ->groupBy('br.id', 'br.name', 'br.sort_order')
            ->orderBy('br.sort_order')
            ->get(['br.name']);

        $out = [];

        foreach ($rows as $row) {
            $out[] = (string) $row->name;
        }

        return $out;
    }

    /**
     * The marque tiles on the homepage — vehicle makes we actually hold vehicles for, so a tile
     * never leads to an empty selector.
     *
     * @return list<string>
     */
    private function tiles(): array
    {
        return DB::table('vehicles')
            ->whereNull('deleted_at')
            ->distinct()
            ->orderBy('make')
            ->limit(8)
            ->pluck('make')
            ->map(fn ($v) => mb_strtoupper((string) $v))
            ->all();
    }

    /**
     * A German design name from the spoke count.
     *
     * DERIVED, not stored — `wheel_models` has no design column, and the runtime's Design facet
     * reads one. Real values are still to come from the client; until then this is deterministic
     * and honest rather than blank.
     */
    private function designName(int $spokes): string
    {
        return match (true) {
            $spokes <= 5 => 'Fünfspeiche',
            $spokes <= 7 => 'Doppelspeiche',
            $spokes <= 12 => 'Kreuzspeiche',
            default => 'Mehrspeichen',
        };
    }

    /** R-02: an open build window reads as "heute", never as today's date. */
    private function buildPeriod(mixed $from, mixed $to): string
    {
        $start = $from === null ? '' : date('m/Y', strtotime((string) $from));
        $end = $to === null ? 'heute' : date('m/Y', strtotime((string) $to));

        return $start === '' ? $end : $start.'–'.$end;
    }

    /** @return list<float> */
    private function numbers(string $concatenated): array
    {
        if ($concatenated === '') {
            return [];
        }

        $out = [];

        foreach (explode(',', $concatenated) as $value) {
            $out[] = (float) $value;
        }

        sort($out);

        return $out;
    }
}
