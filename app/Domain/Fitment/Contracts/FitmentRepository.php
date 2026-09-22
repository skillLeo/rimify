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
     * Published rows permitting these wheel configurations on this vehicle, read in one pass for
     * the whole set — a page of listing cards asks about dozens of configurations at once.
     *
     * Every configuration asked about is a key of the result, with an empty list when no row
     * names it, so a missing key can never be mistaken for "not asked".
     *
     * @param  list<int>  $wheelConfigIds
     * @return array<int, list<FitmentRow>>
     */
    public function publishedRowsFor(int $vehicleId, array $wheelConfigIds): array;

    /**
     * Which of these wheel configurations does ANY published, valid document hold a row for — for
     * any vehicle at all?
     *
     * This is what separates NOT_PERMITTED from UNKNOWN. If no document mentions the wheel, we
     * hold no evidence either way and must say so; if documents exist but none covers this car,
     * we have checked and the answer is no.
     *
     * @param  list<int>  $wheelConfigIds
     * @return list<int>
     */
    public function configsWithPublishedDocument(array $wheelConfigIds): array;

    /**
     * @param  list<int>  $wheelConfigIds
     * @return array<int, WheelConfigRecord> keyed by configuration id; an unknown id is absent
     */
    public function findWheelConfigs(array $wheelConfigIds): array;
}
