<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use Illuminate\Support\Facades\DB;

/**
 * The Felgenrechner's starting values for the chosen car: the first permitted configuration and
 * its first tyre size from the documents — real data, or nothing. The homepage teaser and
 * /felgenrechner both read it here, so the two can never start a customer on different sizes.
 */
final readonly class CalculatorPrefill
{
    /**
     * @return array{widthIn: float, diameterIn: float, etMm: int, tyreWidth: int, aspect: int}|null
     */
    public function forVehicle(int $vehicleId): ?array
    {
        $row = DB::table('fitments as f')
            ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
            ->join('fitment_tyre_sizes as ts', 'ts.fitment_id', '=', 'f.id')
            ->where('f.vehicle_id', $vehicleId)
            ->whereNull('wc.deleted_at')
            ->orderBy('wc.diameter_in')
            ->orderBy('f.id')
            ->first(['wc.width_in', 'wc.diameter_in', 'wc.et_mm', 'ts.width_mm', 'ts.aspect']);

        if ($row === null) {
            return null;
        }

        return [
            'widthIn' => (float) $row->width_in,
            'diameterIn' => (float) $row->diameter_in,
            'etMm' => (int) $row->et_mm,
            'tyreWidth' => (int) $row->width_mm,
            'aspect' => (int) $row->aspect,
        ];
    }
}
