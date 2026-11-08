<?php

declare(strict_types=1);

use App\Domain\Fitment\Infrastructure\ListingQuery;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Database\Seeders\ReferenceDataSeeder;

/*
 * The car's listing at its edges (D-433): „ohne Eintragung“ keeps only rows the record says need none — the stored flag is
 * the row's and its sizes' Abnahme in one bit (FitmentRows), so a wheel one size of which needs it is left out, never
 * shown under the filter. A filter the listing does not know, or an empty value, never reaches the SQL (R-14).
 */

beforeEach(function (): void {
    $this->seed(ReferenceDataSeeder::class);
});

it('keeps only the wheels that need no Eintragung under „ohne Eintragung“, and counts them so', function (): void {
    $vehicle = Vehicle::factory()->create();

    foreach ([false, true] as $entry) {
        $row = Fitment::factory()->create(['vehicle_id' => $vehicle->id, 'wheel_config_id' => WheelConfig::factory()->create()->id, 'requires_entry' => $entry]);
        FitmentTyreSize::factory()->for($row)->create();
    }

    $listing = app(ListingQuery::class);

    expect($listing->total($vehicle->id))->toBe(2)
        ->and($listing->total($vehicle->id, ['ohne_eintragung' => true]))->toBe(1)
        ->and($listing->total($vehicle->id, ['ohne_eintragung' => '1']))->toBe(1)
        ->and($listing->results($vehicle->id, ['ohne_eintragung' => 1])['rows'])->toHaveCount(1)
        ->and($listing->facets($vehicle->id)['ohne_eintragung'])->toBe([['value' => '1', 'count' => 1]]);
});

it('ignores a filter it does not know, an „ohne Eintragung“ that is not a yes, and empty values', function (): void {
    $vehicle = Vehicle::factory()->create();
    $row = Fitment::factory()->create(['vehicle_id' => $vehicle->id, 'wheel_config_id' => WheelConfig::factory()->create()->id, 'requires_entry' => true]);
    FitmentTyreSize::factory()->for($row)->create();

    $listing = app(ListingQuery::class);

    expect($listing->total($vehicle->id, ['ohne_eintragung' => '0']))->toBe(1)
        ->and($listing->total($vehicle->id, ['ohne_eintragung' => false]))->toBe(1)
        ->and($listing->total($vehicle->id, ['unbekannt' => 'x; DROP TABLE fitments']))->toBe(1)
        ->and($listing->total($vehicle->id, ['marke' => ['', null]]))->toBe(1)
        ->and($listing->total($vehicle->id, ['marke' => 'Keine Marke']))->toBe(0);
});
