<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\VehicleFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * A vehicle variant from the PKW-Liste export.
 *
 * Never hard-deleted (R-04): a vehicle that disappears from a new export is soft-deleted, so it
 * stops appearing in the selector while existing approval rows keep resolving and two-year-old
 * orders stay readable.
 *
 * @property int $id
 * @property string $hsn
 * @property string $tsn
 * @property string|null $vsn
 * @property string $make
 * @property string $model
 * @property string $variant
 * @property Carbon|null $build_from
 * @property Carbon|null $build_to
 * @property int|null $axle_load_front_kg
 * @property int|null $axle_load_rear_kg
 * @property int|null $max_speed_kmh
 * @property bool $needs_review
 */
class Vehicle extends Model
{
    /** @use HasFactory<VehicleFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'source_vehicle_id', 'hsn', 'tsn', 'vsn', 'make', 'model', 'variant', 'type_designation',
        'eg_nummer_raw', 'body_form', 'drive_axle', 'build_from', 'build_to',
        'axle_load_front_kg', 'axle_load_rear_kg', 'max_speed_kmh',
        'power_kw', 'power_ps', 'displacement_ccm', 'doors', 'seats',
        'needs_review', 'raw', 'imported_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'build_from' => 'immutable_date',
            'build_to' => 'immutable_date',
            'axle_load_front_kg' => 'integer',
            'axle_load_rear_kg' => 'integer',
            'max_speed_kmh' => 'integer',
            'power_kw' => 'integer',
            'power_ps' => 'integer',
            'displacement_ccm' => 'integer',
            'doors' => 'integer',
            'seats' => 'integer',
            'needs_review' => 'boolean',
            'raw' => 'array',
            'imported_at' => 'immutable_datetime',
        ];
    }

    /**
     * Normalises an EC approval number so the join survives the four incompatible formats the
     * source uses — `e1*2001/116*0447*11`, `E1*98/14*0105*`, bare national codes like `A333*`.
     *
     * Applied on import and on every lookup. Never stored destructively: `eg_nummer_raw` keeps
     * the original for display and for the audit trail.
     */
    public static function normaliseEcNumber(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $value = preg_replace('/\s+/u', '', trim($raw));

        if ($value === null || $value === '') {
            return null;
        }

        $value = mb_strtolower($value);
        $value = rtrim($value, '*');              // trailing asterisks carry no information
        $value = (string) preg_replace('/\*+/', '*', $value);  // collapse doubled separators

        return $value === '' ? null : $value;
    }

    /**
     * HSN keeps its leading zeros. A source that supplies three characters is left-padded rather
     * than accepted, because `005` and `0005` are different manufacturers.
     */
    /** @return Attribute<string|null, string|null> */
    protected function hsn(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => $value === null || $value === ''
                ? $value
                : str_pad(mb_strtoupper(trim($value)), 4, '0', STR_PAD_LEFT),
        );
    }

    /**
     * TSN is upper-cased on write; the collation then matches `aas` against `AAS` on read.
     *
     * @return Attribute<string|null, string|null>
     */
    protected function tsn(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => $value === null ? null : mb_strtoupper(trim($value)),
        );
    }

    /**
     * Writing the raw EC number always refreshes the normalised join column with it.
     *
     * @return Attribute<string|null, array{eg_nummer_raw: string|null, eg_nummer_norm: string|null}>
     */
    protected function egNummerRaw(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): array => [
                'eg_nummer_raw' => $value,
                'eg_nummer_norm' => self::normaliseEcNumber($value),
            ],
        );
    }

    /** Still in production: no end date at all, which is not the same as "ends today". */
    public function isStillBuilt(): bool
    {
        return $this->build_to === null;
    }

    /**
     * R-03: a vehicle whose axle loads or top speed could not be parsed can never produce a
     * positive verdict. The engine asks this before it asks anything else.
     */
    public function hasCompleteLegalData(): bool
    {
        return ! $this->needs_review
            && $this->axle_load_front_kg !== null && $this->axle_load_front_kg > 0
            && $this->axle_load_rear_kg !== null && $this->axle_load_rear_kg > 0
            && $this->max_speed_kmh !== null && $this->max_speed_kmh > 0;
    }

    /** @return HasMany<Fitment, $this> */
    public function fitments(): HasMany
    {
        return $this->hasMany(Fitment::class);
    }
}
