<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\CentreBoreSource;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/*
 * `fitments.centre_bore_mm` — the Mittenlochbohrung the document states for the vehicle a row
 * covers (client, 2026-09-23). The rim keeps its own figure in `wheel_configs.centre_bore_mm`;
 * these two columns are different claims and the engine must never confuse them.
 *
 * This is the DB half of the feature: the column exists, refuses a bore nobody could have
 * measured, and reaches the verdict through the Eloquent repository every surface uses.
 */

beforeEach(function (): void {
    $this->seed(ReferenceDataSeeder::class);
});

/** The worked example: an RS 4 Avant B9 on the 8,5J × 18 ET 35 demo wheel, cast 66,60. */
function boreFitment(?float $centreBoreMm): Fitment
{
    $vehicle = Vehicle::factory()->rs4AvantFirst()->create();
    $config = WheelConfig::factory()->havanna85x18()->create();

    $fitment = Fitment::factory()
        ->statingCentreBore($centreBoreMm)
        ->create(['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id]);

    FitmentTyreSize::factory()->for($fitment)->size(245, 45, 18.0)->create();

    return $fitment;
}

it('holds the bore as a nullable decimal the document may leave empty', function (): void {
    expect(Schema::hasColumn('fitments', 'centre_bore_mm'))->toBeTrue();

    $column = DB::selectOne(
        'SELECT IS_NULLABLE, DATA_TYPE, NUMERIC_PRECISION, NUMERIC_SCALE, COLUMN_COMMENT
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        ['fitments', 'centre_bore_mm'],
    );

    expect($column?->IS_NULLABLE)->toBe('YES')
        ->and(mb_strtolower((string) $column?->DATA_TYPE))->toBe('decimal')
        ->and((int) $column?->NUMERIC_PRECISION)->toBe(5)
        ->and((int) $column?->NUMERIC_SCALE)->toBe(2)
        // The comment is where the next reader learns it is not the rim's figure.
        ->and((string) $column?->COLUMN_COMMENT)->toContain('THIS vehicle');
});

it('refuses a bore of zero, because zero is not something anybody measured', function (): void {
    expect(fn () => boreFitment(0.0))->toThrow(QueryException::class);
});

it('carries the document\'s bore for this vehicle into the verdict, beside the rim\'s own', function (): void {
    $fitment = boreFitment(66.5);

    $verdict = app(FitmentResolver::class)->resolve($fitment->vehicle_id, $fitment->wheel_config_id);

    expect($verdict->isSellable())->toBeTrue()
        ->and($verdict->documentCentreBoreMm)->toBe(66.5)
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Document)
        // The rim is cast 66,60; the document says 66,5 for this car. Both survive the trip.
        ->and($verdict->wheel?->centreBoreMm)->toBe(66.6);
});

it('leaves the verdict silent where the row states no bore, so the storefront may fall back', function (): void {
    $fitment = boreFitment(null);

    $verdict = app(FitmentResolver::class)->resolve($fitment->vehicle_id, $fitment->wheel_config_id);

    expect($verdict->isSellable())->toBeTrue()
        ->and($verdict->documentCentreBoreMm)->toBeNull()
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Unstated)
        ->and($verdict->wheel?->centreBoreMm)->toBe(66.6);
});

it('states no bore where two published documents disagree about this car', function (): void {
    $first = boreFitment(66.5);

    // A second, independently valid document for the same wheel on the same car — the shape an ABE
    // and a Teilegutachten make when both cover a fitment and their measurements differ.
    $second = Fitment::factory()
        ->statingCentreBore(66.6)
        ->create(['vehicle_id' => $first->vehicle_id, 'wheel_config_id' => $first->wheel_config_id]);

    FitmentTyreSize::factory()->for($second)->size(245, 45, 18.0)->create();

    $verdict = app(FitmentResolver::class)->resolve($first->vehicle_id, $first->wheel_config_id);

    expect($verdict->isSellable())->toBeTrue()
        ->and($verdict->documentCentreBoreMm)->toBeNull()
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Conflicting);
});
