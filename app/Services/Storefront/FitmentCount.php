<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\VehicleResolver;
use Illuminate\Support\Facades\Cache;

/**
 * The number under the selector: how many wheels a published document permits on this exact
 * vehicle, split into those without and with an Eintragung. The same predicate as the listing,
 * so the button never promises a count the listing does not deliver.
 *
 * By key numbers, the answer follows the resolver's rules: no match is zero, one match is that
 * car's count, several matches are handed back as a choice — never guessed (R-01).
 */
final readonly class FitmentCount
{
    private const TTL = 600;

    public function __construct(private ListingQuery $listing, private VehicleResolver $resolver) {}

    /**
     * @return array{count: int, permitted: int, conditional: int, vehicle: array{id: int, label: string, short: string}, ambiguous: list<never>}
     */
    public function forVehicle(VehicleRecord $vehicle): array
    {
        /** @var array{count: int, permitted: int, conditional: int} $counts */
        $counts = Cache::remember('fitment.count.'.$vehicle->id, self::TTL, function () use ($vehicle): array {
            $total = $this->listing->total($vehicle->id);
            $facets = $this->listing->facets($vehicle->id);
            $withoutEntry = (int) ($facets['ohne_eintragung'][0]['count'] ?? 0);

            return [
                'count' => $total,
                'permitted' => min($total, $withoutEntry),
                'conditional' => max(0, $total - $withoutEntry),
            ];
        });

        return [
            ...$counts,
            'vehicle' => $this->describe($vehicle),
            'ambiguous' => [],
        ];
    }

    /**
     * @return array{count: int, permitted: int, conditional: int, vehicle: array{id: int, label: string, short: string}|null, ambiguous: list<array{id: int, label: string, short: string}>}
     */
    public function byKeyNumbers(string $hsn, string $tsn): array
    {
        $candidates = $this->resolver->byKeyNumbers($hsn, $tsn);

        if ($candidates->count() === 1) {
            /** @var VehicleRecord $vehicle */
            $vehicle = $candidates->first();

            return $this->forVehicle($vehicle);
        }

        return [
            'count' => 0,
            'permitted' => 0,
            'conditional' => 0,
            'vehicle' => null,
            'ambiguous' => $candidates->map(fn (VehicleRecord $v): array => $this->describe($v))->values()->all(),
        ];
    }

    public static function forget(int $vehicleId): void
    {
        Cache::forget('fitment.count.'.$vehicleId);
    }

    /**
     * @return array{id: int, label: string, short: string}
     */
    private function describe(VehicleRecord $vehicle): array
    {
        return [
            'id' => $vehicle->id,
            'label' => trim($vehicle->make.' '.$vehicle->variant),
            'short' => trim($vehicle->make.' '.$vehicle->model),
        ];
    }
}
