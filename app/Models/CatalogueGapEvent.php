<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A vehicle that returned no permitted wheel.
 *
 * Every UNKNOWN verdict lands here, which is how refusing to guess and learning which Gutachten to
 * obtain next turn out to be the same mechanism: the gap report ranks these by frequency and tells
 * the client which document to buy, in order of real demand.
 */
class CatalogueGapEvent extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'vehicle_id', 'wheel_config_id', 'hsn', 'tsn', 'vehicle_label',
        'reason_code', 'surface', 'occurred_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['occurred_at' => 'immutable_datetime'];
    }

    /**
     * Record a gap. Every caller goes through here so `occurred_at` cannot be forgotten and the
     * surface cannot drift from the four the CHECK constraint allows.
     *
     * Recording must never be able to break the page that recorded it: this is analytics about a
     * customer who already has a disappointing answer on screen, and a failed insert would turn
     * that into an error page.
     */
    public static function record(
        string $reasonCode,
        string $surface,
        ?int $vehicleId = null,
        ?int $wheelConfigId = null,
        ?string $hsn = null,
        ?string $tsn = null,
        ?string $vehicleLabel = null,
    ): void {
        try {
            self::create([
                'vehicle_id' => $vehicleId,
                'wheel_config_id' => $wheelConfigId,
                'hsn' => $hsn,
                'tsn' => $tsn,
                'vehicle_label' => $vehicleLabel,
                'reason_code' => $reasonCode,
                'surface' => $surface,
                'occurred_at' => now(),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
