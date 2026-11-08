<?php

declare(strict_types=1);

use App\Models\ApprovalDocument;
use App\Models\Vehicle;
use Carbon\CarbonImmutable;

/**
 * A factory's dates follow the test's clock, not the wall clock (D-436). Faker's `dateTimeBetween('-5 years',
 * '-1 month')` reads the real time: a test that travels back to 27.09.2026 drew, now and then, a Gutachten
 * valid only from October — not yet valid on its frozen day — and its approved wheel counted as unapproved
 * (UebersichtVariantsTest on CI, 08.11.2026). Travelling far back makes every such draw land in the future.
 */
beforeEach(function (): void {
    $this->travelTo(CarbonImmutable::parse('2020-01-01 12:00', 'Europe/Berlin'));
});

it('dates a Gutachten before the travelled today, never after it', function (): void {
    foreach (range(1, 25) as $draw) {
        $document = ApprovalDocument::factory()->make();

        expect($document->valid_from->toDateString())->toBeLessThanOrEqual('2019-12-01')
            ->and($document->issued_on->toDateString())->toBeLessThanOrEqual('2019-12-01');
    }
});

it('ends a vehicle’s build window in the travelled today’s month at the latest', function (): void {
    foreach (range(1, 25) as $draw) {
        $vehicle = Vehicle::factory()->make();

        expect($vehicle->build_to->toDateString())->toBeLessThanOrEqual('2020-01-28')
            ->and($vehicle->build_from->toDateString())->toBeLessThanOrEqual('2017-01-01');
    }
});
