<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Support\BuildWindow;

/**
 * A body-style or drive code narrows a row; one the engine cannot decide is never a pass (the Borbet brief
 * §2.3, the corrections memo §1).
 */
function filterCar(?string $body, ?string $drive): VehicleRecord
{
    return new VehicleRecord(
        id: 1, hsn: '0005', tsn: 'ABC', vsn: null, make: 'BMW', model: '4er', variant: 'Coupé', typeDesignation: '3C',
        buildWindow: BuildWindow::unbounded(), axleLoadFrontKg: 1000, axleLoadRearKg: 1100, maxSpeedKmh: 250,
        bodyForm: $body, driveAxle: $drive,
    );
}

it('lets in the body styles the code names, and keeps out the others', function (): void {
    $coupeOnly = new RowFilter('Cpe', RowFilter::BODY_FORM, ['Coupe', 'Cabrio']);

    expect($coupeOnly->decide(filterCar('Coupé', 'Hinterachse')))->toBeTrue()
        ->and($coupeOnly->decide(filterCar('Kombi', 'Hinterachse')))->toBeFalse();
});

it('decides „nur mit“ and „nicht mit“ a drive', function (): void {
    expect((new RowFilter('A4', RowFilter::DRIVE, [], 'only', 'Allrad'))->decide(filterCar('Kombi', 'Allrad')))->toBeTrue()
        ->and((new RowFilter('A4', RowFilter::DRIVE, [], 'only', 'Allrad'))->decide(filterCar('Kombi', 'Hinterachse')))->toBeFalse()
        ->and((new RowFilter('A5', RowFilter::DRIVE, [], 'not', 'Allrad'))->decide(filterCar('Kombi', 'Hinterachse')))->toBeTrue();
});

it('cannot tell without the vehicle’s body style or drive, without a parameter, or for four-wheel steering', function (): void {
    expect((new RowFilter('Cpe', RowFilter::BODY_FORM, ['Coupe']))->decide(filterCar(null, 'Allrad')))->toBeNull()
        ->and((new RowFilter('Cpe', RowFilter::BODY_FORM, []))->decide(filterCar('Coupe', 'Allrad')))->toBeNull()
        ->and((new RowFilter('A4', RowFilter::DRIVE, [], 'only', 'Allrad'))->decide(filterCar('Kombi', null)))->toBeNull()
        ->and((new RowFilter('AL', RowFilter::DRIVE, [], 'not', 'Allradlenkung'))->decide(filterCar('Kombi', 'Allrad')))->toBeNull();
});
