<?php

declare(strict_types=1);

namespace Tests\Support\Fitment;

use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Data\VehicleRecord;
use Illuminate\Support\Collection;

/**
 * An in-memory vehicle repository, so the resolver can be exercised with no database and no
 * framework booted (R-13).
 *
 * It deliberately mirrors the database's matching semantics — case-insensitive key numbers, soft
 * deletes hidden — rather than the resolver's, so a test passing here means the resolver is right
 * and not merely consistent with a fake that was written to agree with it.
 */
final class InMemoryVehicleRepository implements VehicleRepository
{
    /** @param list<VehicleRecord> $vehicles */
    public function __construct(private array $vehicles = []) {}

    public function add(VehicleRecord $vehicle): self
    {
        $this->vehicles[] = $vehicle;

        return $this;
    }

    /** @return Collection<int, VehicleRecord> */
    public function byKeyNumbers(string $hsn, string $tsn): Collection
    {
        $matches = array_filter(
            $this->vehicles,
            // utf8mb4_0900_ai_ci compares case-insensitively; the fake must too.
            static fn (VehicleRecord $v): bool => ! $v->isDeleted
                && mb_strtoupper($v->hsn) === mb_strtoupper($hsn)
                && mb_strtoupper($v->tsn) === mb_strtoupper($tsn),
        );

        return new Collection(array_values($matches));
    }

    public function find(int $id): ?VehicleRecord
    {
        foreach ($this->vehicles as $vehicle) {
            if ($vehicle->id === $id && ! $vehicle->isDeleted) {
                return $vehicle;
            }
        }

        return null;
    }
}
