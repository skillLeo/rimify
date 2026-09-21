<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Contracts;

use App\Domain\Fitment\Data\VehicleRecord;
use Illuminate\Support\Collection;

/**
 * How the engine reaches vehicles. The engine depends on this interface, never on Eloquent, so the
 * whole resolver can be exercised against in-memory fakes with no database at all (R-13).
 */
interface VehicleRepository
{
    /**
     * Every vehicle matching a key-number pair.
     *
     * Returns a Collection ALWAYS, including when it holds one member or none. There is
     * deliberately no `firstByKeyNumbers()` on this interface: the demo data contains a pair that
     * resolves to two cars differing in exactly the fields the legal answer is derived from, so a
     * "first match" accessor is a wrong answer waiting to be called (R-01).
     *
     * @return Collection<int, VehicleRecord>
     */
    public function byKeyNumbers(string $hsn, string $tsn): Collection;

    public function find(int $id): ?VehicleRecord;
}
