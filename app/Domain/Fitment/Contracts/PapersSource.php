<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Contracts;

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\VehicleBuild;

/**
 * Where the figures a customer typed from their own papers come from. The engine asks this and never
 * knows it is a cookie today and an account tomorrow (R-13).
 */
interface PapersSource
{
    public function for(int $vehicleId): ?PapersFigures;

    /** The body style and drive the owner told us for this car, where the vehicle data holds none (§1.1). */
    public function buildFor(int $vehicleId): ?VehicleBuild;
}
