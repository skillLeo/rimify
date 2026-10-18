<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Domain\Fitment\Resolver\VehicleResolver;
use App\Enums\CatalogueStatus;
use App\Support\CatalogueVersion;
use App\Support\VehicleName;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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
     * `shopEmpty`: no wheel is published at all — a car's 0 then says the shop is still empty, not that no document
     * names the car (the operator's brief of 05.10.2026, §2). Asked on every count, never cached with the car's.
     *
     * @return array{count: int, permitted: int, conditional: int, vehicle: array{id: int, label: string, short: string}, ambiguous: list<never>, shopEmpty: bool}
     */
    public function forVehicle(VehicleRecord $vehicle): array
    {
        /** @var array{count: int, permitted: int, conditional: int} $counts */
        // Under the catalogue's version (D-294): a wheel published or a Gutachten released counts at once.
        $counts = Cache::remember(CatalogueVersion::key('fitment.count.'.$vehicle->id), self::TTL, function () use ($vehicle): array {
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
            'shopEmpty' => self::shopEmpty(),
        ];
    }

    /**
     * @return array{count: int, permitted: int, conditional: int, vehicle: array{id: int, label: string, short: string}|null, ambiguous: list<array{id: int, label: string, short: string}>, shopEmpty: bool}
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
            'shopEmpty' => self::shopEmpty(),
        ];
    }

    public static function forget(int $vehicleId): void
    {
        Cache::forget(CatalogueVersion::key('fitment.count.'.$vehicleId));
    }

    /** No wheel published at all: a test environment reset to an empty shop, or a shop before its first wheel. */
    public static function shopEmpty(): bool
    {
        return ! DB::table('wheel_models')->whereNull('deleted_at')->where('status', CatalogueStatus::Published->value)->exists();
    }

    /**
     * @return array{id: int, label: string, short: string}
     */
    private function describe(VehicleRecord $vehicle): array
    {
        return [
            'id' => $vehicle->id,
            'label' => VehicleName::forShop($vehicle->make, $vehicle->model, $vehicle->variant, $vehicle->typeDesignation),
            'short' => trim($vehicle->make.' '.$vehicle->model),
        ];
    }
}
