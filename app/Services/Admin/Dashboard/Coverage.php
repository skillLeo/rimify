<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Enums\ApprovalKind;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\Approvals\FitmentRows;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The Abdeckungs-Matrix: makes down the side, rim sizes across, and in every cell how many of that
 * make's vehicle variants have at least one wheel of that size a customer may be shown — the
 * client's core asset, made visible (docs/admin/rest-build-plan.md, „Übersicht und Shell“ step E).
 *
 * "Approved" means exactly what the storefront means (Fitment::visibleToCustomers): a published row
 * of a published, currently valid document. One aggregate query, cached for an hour and dropped the
 * moment a document is published (ForgetCoverage), so the matrix never contradicts the shop for long.
 *
 * @phpstan-type Cell array{size: string, count: int, level: int, sentence: string, href: string}
 * @phpstan-type Row array{make: string, variants: int, covered: int, cells: list<Cell>}
 * @phpstan-type Matrix array{sizes: list<array{key: string, label: string}>, rows: list<Row>, max: int, summary: array{fitments: string, variants: string, sentence: string}, computedAt: string, incomplete: list<array{document: string, href: string, sentence: string, base: string|null}>}
 */
final class Coverage
{
    /** Versioned: a change to what the matrix carries (its labels) must not wait an hour for the cache. */
    public const CACHE_KEY = 'admin.coverage.v3';

    public const CACHE_SECONDS = 3600;

    /** The steps of the sequential ramp (`--chart-seq-1` … `-7`); 0 is an empty cell. */
    public const LEVELS = 7;

    /** @return Matrix */
    public function matrix(): array
    {
        /** @var Matrix */
        return Cache::remember(self::CACHE_KEY, self::CACHE_SECONDS, fn (): array => $this->compute());
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** @return Matrix */
    private function compute(): array
    {
        $variants = DB::table('vehicles')
            ->whereNull('deleted_at')
            ->selectRaw('make, COUNT(*) as n')
            ->groupBy('make')
            ->pluck('n', 'make')
            ->map(static fn (mixed $n): int => (int) $n)
            ->all();

        $approved = Fitment::query()
            ->visibleToCustomers()
            ->join('vehicles as v', 'v.id', '=', 'fitments.vehicle_id')
            ->join('wheel_configs as wc', 'wc.id', '=', 'fitments.wheel_config_id')
            ->whereNull('v.deleted_at');

        $cells = (clone $approved)
            ->groupBy('v.make', 'wc.diameter_in')
            ->selectRaw('v.make as make, wc.diameter_in as size, COUNT(DISTINCT v.id) as covered')
            ->toBase()
            ->get();

        $coveredPerMake = (clone $approved)
            ->groupBy('v.make')
            ->selectRaw('v.make as make, COUNT(DISTINCT v.id) as covered')
            ->toBase()
            ->pluck('covered', 'make')
            ->all();

        $fitments = (clone $approved)->count('fitments.id');
        $vehicles = (clone $approved)->distinct()->count('v.id');

        $sizes = $cells->pluck('size')->map(static fn (mixed $s): string => self::size((string) $s))->unique()->sort(SORT_NUMERIC)->values()->all();
        $counts = [];

        foreach ($cells as $cell) {
            $counts[(string) $cell->make][self::size((string) $cell->size)] = (int) $cell->covered;
        }

        $max = $counts === [] ? 0 : max(array_map('max', $counts));

        // Largest makes first: where most customers' cars are.
        arsort($variants);
        $rows = [];

        foreach ($variants as $make => $total) {
            $row = ['make' => (string) $make, 'variants' => $total, 'covered' => (int) ($coveredPerMake[$make] ?? 0), 'cells' => []];

            foreach ($sizes as $size) {
                $count = $counts[$make][$size] ?? 0;
                $row['cells'][] = [
                    'size' => $size,
                    'count' => $count,
                    'level' => self::level($count, $max),
                    'sentence' => "{$make}, {$size} Zoll: ".GermanFormat::integer($count).' von '.GermanFormat::integer($total).($total === 1 ? ' Variante' : ' Varianten'),
                    'href' => '/admin/abdeckung?'.http_build_query(['marke' => $make, 'zoll' => $size]),
                ];
            }

            $rows[] = $row;
        }

        return [
            'sizes' => array_map(static fn (string $s): array => ['key' => $s, 'label' => "{$s} Zoll"], $sizes),
            'rows' => $rows,
            'max' => $max,
            'summary' => [
                'fitments' => GermanFormat::integer($fitments),
                'variants' => GermanFormat::integer($vehicles),
                'sentence' => 'Abdeckung insgesamt: '.GermanFormat::integer($fitments).($fitments === 1 ? ' Freigabe' : ' Freigaben').' über '.GermanFormat::integer($vehicles).($vehicles === 1 ? ' Variante' : ' Varianten'),
            ],
            'computedAt' => (string) GermanFormat::dateTime(CarbonImmutable::now()),
            // A released Nachtrag without its base: the matrix counts its approvals, and says they are
            // not the whole approval (the corrections memo §4).
            'incomplete' => ApprovalDocument::query()->currentlyValid()
                ->where('kind', ApprovalKind::Nachtrag->value)->whereNull('supplement_to_id')
                ->orderBy('id')->get()
                ->map(static fn (ApprovalDocument $d): array => [
                    'document' => FitmentRows::label($d),
                    'href' => '/admin/gutachten/'.$d->id,
                    'sentence' => (string) $d->baseMissingDe(),
                    'base' => $d->supplement_to_number,
                ])->values()->all(),
            // A released document that prints no table of tyre load at speed: above 210 km/h the shop confirms
            // no tyres from it, and says so to the customer (FitmentResolver) — here the gap is named for the
            // people who run the shop, not only in the answer a fast car gets.
            'noSpeedTable' => ApprovalDocument::query()->currentlyValid()
                ->whereNotExists(static fn ($q) => $q->selectRaw('1')->from('document_speed_deratings as d')->whereColumn('d.approval_document_id', 'approval_documents.id'))
                ->orderBy('id')->get()
                ->map(static fn (ApprovalDocument $d): array => [
                    'document' => FitmentRows::label($d),
                    'href' => '/admin/gutachten/'.$d->id,
                ])->values()->all(),
        ];
    }

    /** The ramp step for a count: none for zero, else 1 … 7 in proportion to the largest cell. */
    public static function level(int $count, int $max): int
    {
        if ($count <= 0 || $max <= 0) {
            return 0;
        }

        return max(1, min(self::LEVELS, (int) ceil($count / $max * self::LEVELS)));
    }

    /** `19.0` → `19`, `18.5` → `18,5`: a rim size as it is spoken. */
    private static function size(string $raw): string
    {
        return GermanFormat::trimmedDecimal((float) $raw, 1);
    }
}
