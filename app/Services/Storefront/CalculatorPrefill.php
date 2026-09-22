<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Enums\CatalogueStatus;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use Illuminate\Support\Facades\DB;

/**
 * The Felgenrechner's starting values for the chosen car: the smallest size — the smallest rim
 * diameter, then the narrowest rim and tyre — that a published, currently valid Gutachten names
 * for it, with that fitment's tyre size. It is **not** the car's factory size (finding C3), and
 * the page says so in those words. Only rows a customer could be shown count: a published fitment
 * of a published document inside its validity, on a published, undeleted wheel. No such row, no
 * prefill — the calculator then starts on the worked example (fail closed, CLAUDE.md §2).
 *
 * The homepage teaser and /felgenrechner both read it here, so the two can never start a customer
 * on different sizes.
 */
final readonly class CalculatorPrefill
{
    /**
     * @return array{widthIn: float, diameterIn: float, etMm: int, tyreWidth: int, aspect: int}|null
     */
    public function forVehicle(int $vehicleId): ?array
    {
        $today = now()->toDateString();

        $row = DB::table('fitments as f')
            ->join('approval_documents as ad', 'ad.id', '=', 'f.approval_document_id')
            ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
            ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
            ->join('fitment_tyre_sizes as ts', 'ts.fitment_id', '=', 'f.id')
            ->where('f.vehicle_id', $vehicleId)
            ->where('f.status', FitmentStatus::Published->value)
            ->where('ad.status', DocumentStatus::Published->value)
            ->where(fn ($q) => $q->whereNull('ad.valid_from')->orWhere('ad.valid_from', '<=', $today))
            ->where(fn ($q) => $q->whereNull('ad.valid_to')->orWhere('ad.valid_to', '>=', $today))
            ->where('wm.status', CatalogueStatus::Published->value)
            ->whereNull('wm.deleted_at')
            ->whereNull('wc.deleted_at')
            ->orderBy('wc.diameter_in')
            ->orderBy('wc.width_in')
            ->orderBy('ts.width_mm')
            ->orderBy('ts.aspect')
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
