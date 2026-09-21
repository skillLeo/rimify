<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Support\GermanFormat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * The make → model → variant tree the selector drills through.
 *
 * Soft-deleted vehicles are excluded at every level: a make whose last model was removed by an
 * import must stop appearing, or the customer taps into an empty list and concludes the site does
 * not know their car (R-04 keeps the rows for the orders that reference them, not for the picker).
 *
 * Cached, because the tree changes when an import runs and at no other time.
 */
final readonly class VehicleTree
{
    private const TTL = 900;

    /**
     * @return list<array{make: string, models: int}>
     */
    public function makes(): array
    {
        /** @var list<array{make: string, models: int}> $makes */
        $makes = Cache::remember('vehicle-tree.makes', self::TTL, function (): array {
            $rows = DB::table('vehicles')
                ->whereNull('deleted_at')
                ->groupBy('make')
                ->orderBy('make')
                ->get(['make', DB::raw('COUNT(DISTINCT model) as models')]);

            $out = [];

            foreach ($rows as $row) {
                $out[] = ['make' => (string) $row->make, 'models' => (int) $row->models];
            }

            return $out;
        });

        return $makes;
    }

    /**
     * @return list<array{model: string, variants: int}>
     */
    public function models(string $make): array
    {
        $rows = DB::table('vehicles')
            ->whereNull('deleted_at')
            ->where('make', $make)
            ->groupBy('model')
            ->orderBy('model')
            ->get(['model', DB::raw('COUNT(*) as variants')]);

        $out = [];

        foreach ($rows as $row) {
            $out[] = ['model' => (string) $row->model, 'variants' => (int) $row->variants];
        }

        return $out;
    }

    /**
     * The variants of one model, each labelled with its build window.
     *
     * The build window is on the label because it is frequently the only thing distinguishing two
     * otherwise identical rows — and it is exactly the field whose axle loads and top speed differ,
     * which is to say the field that decides the legal answer.
     *
     * @return list<array<string, mixed>>
     */
    public function variants(string $make, string $model): array
    {
        $rows = DB::table('vehicles')
            ->whereNull('deleted_at')
            ->where('make', $make)
            ->where('model', $model)
            ->orderBy('variant')
            ->orderByRaw('build_from IS NULL, build_from')
            ->get([
                'id', 'variant', 'type_designation', 'hsn', 'tsn', 'vsn',
                'build_from', 'build_to', 'power_ps', 'body_form', 'needs_review',
            ]);

        $out = [];

        foreach ($rows as $row) {
            $out[] = [
                'id' => (int) $row->id,
                'variant' => (string) $row->variant,
                'typeDesignation' => $row->type_designation,
                'keyNumbers' => GermanFormat::keyNumbers((string) $row->hsn, (string) $row->tsn),
                'hsn' => (string) $row->hsn,
                'tsn' => (string) $row->tsn,
                'vsn' => $row->vsn,
                'buildWindow' => GermanFormat::buildPeriod(
                    $row->build_from === null ? null : new \DateTimeImmutable((string) $row->build_from),
                    $row->build_to === null ? null : new \DateTimeImmutable((string) $row->build_to),
                ),
                'powerPs' => $row->power_ps === null ? null : (int) $row->power_ps,
                'bodyForm' => $row->body_form,
                // Shown, not hidden: the customer is told plainly that this row is incomplete,
                // rather than being given a confident answer derived from missing data (R-03).
                'needsReview' => (bool) $row->needs_review,
            ];
        }

        return $out;
    }
}
