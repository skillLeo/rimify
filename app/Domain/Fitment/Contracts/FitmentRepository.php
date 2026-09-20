<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Contracts;

use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\WheelConfigRecord;

/**
 * How the engine reaches approval rows.
 *
 * Every method here returns only what a customer may be shown: published rows of published,
 * currently valid documents. Draft, retired, superseded and withdrawn records are invisible at
 * this boundary rather than filtered afterwards, so no caller can forget.
 */
interface FitmentRepository
{
    /**
     * Published rows permitting this wheel configuration on this vehicle.
     *
     * @return list<FitmentRow>
     */
    public function publishedRowsFor(int $vehicleId, int $wheelConfigId): array;

    /**
     * Does ANY published, valid document hold a row for this wheel configuration — for any
     * vehicle at all?
     *
     * This is what separates NOT_PERMITTED from UNKNOWN. If no document mentions the wheel, we
     * hold no evidence either way and must say so; if documents exist but none covers this car,
     * we have checked and the answer is no.
     */
    public function hasPublishedDocumentForConfig(int $wheelConfigId): bool;

    public function findWheelConfig(int $wheelConfigId): ?WheelConfigRecord;
}
