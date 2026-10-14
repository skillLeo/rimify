<?php

declare(strict_types=1);

namespace App\Services\GoLive;

use App\Domain\Fitment\Exceptions\ReferenceDataMissing;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Models\Fitment;
use App\Models\WheelConfig;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * How many pairs of a vehicle and a wheel land on „Felge freigegeben · Reifengröße noch nicht bestätigt“ (the
 * operator's brief of 14.10.2026, §1.5): the engine's own answer for every pair a released Gutachten names, counted —
 * never a query that guesses at it. A pair in this state is a wheel its document approves and the shop does not sell.
 *
 * The engine takes about ten milliseconds a pair, so a page never counts a large shop: rimify:go-live-check and the
 * hourly schedule count and keep the result for a day; a page reads what is kept, and counts itself only where the
 * shop is small enough to do it in passing. Where nothing is kept yet, it says so.
 *
 * @phpstan-type Count array{state: self::COUNTED|self::PENDING|self::NO_TABLES, pairs: int, open: int, demo: int, examples: list<string>, countedAt: string|null}
 */
final class TyreConfirmations
{
    public const CACHE_KEY = 'golive.tyre-confirmations.v2';

    public const CACHE_SECONDS = 86_400;

    public const COUNTED = 'counted';

    /** Nothing kept, and too many pairs to count while a page waits. */
    public const PENDING = 'pending';

    /** The engine's reference tables are missing: it answers nothing. */
    public const NO_TABLES = 'no-tables';

    /** Up to this many pairs a page counts itself — about two seconds. */
    public const INLINE_PAIRS = 200;

    /** How many of the open pairs the sentence names. */
    private const EXAMPLES = 3;

    /** @return Count */
    public function count(bool $fresh = false): array
    {
        if (! $fresh) {
            /** @var Count|null $kept */
            $kept = Cache::get(self::CACHE_KEY);

            if ($kept !== null) {
                return $kept;
            }
        }

        $pairs = $this->pairs();

        if (! $fresh && $pairs->count() > self::INLINE_PAIRS) {
            return ['state' => self::PENDING, 'pairs' => $pairs->count(), 'open' => 0, 'demo' => 0, 'examples' => [], 'countedAt' => null];
        }

        $count = $this->compute($pairs);

        if ($count['state'] === self::COUNTED) {
            Cache::put(self::CACHE_KEY, $count, self::CACHE_SECONDS);
        }

        return $count;
    }

    public static function forget(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Every pair a released, valid Gutachten names. A pair counts as an example pair only where every document that
     * names it is one.
     *
     * @return Collection<int, \stdClass>
     */
    private function pairs(): Collection
    {
        return Fitment::query()
            ->visibleToCustomers()
            ->join('vehicles as v', 'v.id', '=', 'fitments.vehicle_id')
            ->join('approval_documents as d', 'd.id', '=', 'fitments.approval_document_id')
            ->whereNull('v.deleted_at')
            ->groupBy('fitments.vehicle_id', 'fitments.wheel_config_id')
            ->select(['fitments.vehicle_id', 'fitments.wheel_config_id', DB::raw('MIN(d.is_demo) as demo')])
            ->orderBy('fitments.vehicle_id')
            ->toBase()
            ->get();
    }

    /**
     * @param  Collection<int, \stdClass>  $pairs
     * @return Count
     */
    private function compute(Collection $pairs): array
    {
        $at = (string) GermanFormat::dateTime(CarbonImmutable::now());

        if ($pairs->isEmpty()) {
            return ['state' => self::COUNTED, 'pairs' => 0, 'open' => 0, 'demo' => 0, 'examples' => [], 'countedAt' => $at];
        }

        // The engine refuses to be built without its reference tables (IndexTables): then nothing is answered.
        try {
            $resolver = app(FitmentResolver::class);
        } catch (ReferenceDataMissing) {
            return ['state' => self::NO_TABLES, 'pairs' => $pairs->count(), 'open' => 0, 'demo' => 0, 'examples' => [], 'countedAt' => null];
        }

        $byVehicle = [];

        foreach ($pairs as $pair) {
            $byVehicle[(int) $pair->vehicle_id][(int) $pair->wheel_config_id] = (bool) $pair->demo;
        }

        $open = 0;
        $demo = 0;
        $examples = [];

        foreach ($byVehicle as $vehicleId => $configs) {
            foreach ($resolver->resolveMany($vehicleId, array_keys($configs)) as $configId => $verdict) {
                if (! $verdict->tyreUnconfirmed()) {
                    continue;
                }

                $open++;
                $demo += $configs[$configId] ? 1 : 0;

                // One example per car: three finishes of one wheel on one car would say the same thing three times.
                if (count($examples) < self::EXAMPLES && ! isset($examples[$vehicleId])) {
                    $car = $verdict->vehicle;
                    $examples[$vehicleId] = [$configId, trim($car->make.' '.(str_starts_with($car->variant, $car->model) ? '' : $car->model.' ').$car->variant)];
                }
            }
        }

        $wheels = WheelConfig::query()->with('wheelModel')->findMany(array_column($examples, 0))->keyBy('id');

        return [
            'state' => self::COUNTED,
            'pairs' => $pairs->count(),
            'open' => $open,
            'demo' => $demo,
            'examples' => array_map(static function (array $example) use ($wheels): string {
                $config = $wheels->get($example[0]);

                return $example[1].' mit '.trim(($config?->wheelModel->name ?? 'Felge').' '.($config === null ? '' : GermanFormat::wheelSize($config->width_in, $config->diameter_in, $config->et_mm)));
            }, array_values($examples)),
            'countedAt' => $at,
        ];
    }
}
