<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Infrastructure;

use App\Domain\Fitment\Contracts\PapersSource;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Data\VehicleRecord;
use Illuminate\Support\Collection;

/**
 * The vehicle repository every surface reads, with the customer's own figures laid over the car they
 * belong to (Block C, item 10). Because it wraps the one repository the resolver is built with, the
 * product page, the listing, the basket and the order all answer from the same figures — no surface can
 * forget them (R-13).
 *
 * Only `find()` is overlaid. `byKeyNumbers()` chooses among the variants the vehicle data knows, and the
 * disambiguation must show the data's differences (R-01); the figures belong to a car already chosen.
 */
final readonly class PapersVehicleRepository implements VehicleRepository
{
    public function __construct(
        private VehicleRepository $inner,
        private PapersSource $papers,
    ) {}

    /** @return Collection<int, VehicleRecord> */
    public function byKeyNumbers(string $hsn, string $tsn): Collection
    {
        return $this->inner->byKeyNumbers($hsn, $tsn);
    }

    public function find(int $id): ?VehicleRecord
    {
        $vehicle = $this->inner->find($id);

        if ($vehicle === null) {
            return null;
        }

        return $this->papers->for($id)?->applyTo($vehicle) ?? $vehicle;
    }
}
