<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Support\BuildPeriod;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\FixedClock;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryVehicleRepository;

/*
 * The build month the record does not know (the client's rules of 26.11.2026, D-516): the answer never rests on a month
 * nobody knows. A row the car reaches whatever the months are applies as before; a row it reaches only in some months of
 * the year is „Noch nicht bestätigt“ (BUILD_MONTH_UNKNOWN), never a yes and never a no; a row it reaches in no month is
 * still refused. Fail-closed: no case is answered more freely than with the months known.
 */

const MONTHS_CAR = 50;

function monthsCar(BuildPeriod $period): VehicleRecord
{
    return new VehicleRecord(
        id: MONTHS_CAR, hsn: '0005', tsn: '582', vsn: '005',
        make: 'BMW', model: '3er', variant: '316Ci', typeDesignation: 'E46',
        buildWindow: BuildWindow::core($period->certainFrom(), $period->certainTo()),
        axleLoadFrontKg: 900, axleLoadRearKg: 1020, maxSpeedKmh: 225,
        powerKw: 85, powerPs: 116, bodyForm: 'Coupe', driveAxle: 'Hinterachse', doors: 2, seats: 4,
        buildPeriod: $period,
    );
}

function monthsVerdict(BuildPeriod $period, ?BuildWindow $window): FitmentVerdict
{
    $tables = FitmentFixtures::tables();
    $resolver = new FitmentResolver(
        vehicles: new InMemoryVehicleRepository([monthsCar($period)]),
        fitments: new InMemoryFitmentRepository([FitmentFixtures::row(vehicleId: MONTHS_CAR, window: $window ?? BuildWindow::unbounded())], [FitmentFixtures::wheel()]),
        speedSymbol: new SpeedSymbolDeriver($tables),
        clock: new FixedClock,
    );

    return $resolver->resolve(MONTHS_CAR, FitmentFixtures::WHEEL_CONFIG_ID);
}

$day = static fn (string $d): DateTimeImmutable => new DateTimeImmutable($d);

it('answers as before where the row reaches the car whatever its months are', function () use ($day): void {
    $period = new BuildPeriod(2004, null, 2008, null);
    $open = monthsVerdict($period, null);
    $before = monthsVerdict($period, new BuildWindow($day('2003-01-01'), null));

    expect($before->status)->toBe($open->status)
        ->and($before->reason?->code)->toBe($open->reason?->code)
        ->and($open->reason?->code)->not->toBeIn([VerdictReason::BUILD_MONTH_UNKNOWN, VerdictReason::OUTSIDE_BUILD_WINDOW]);
});

it('says „Noch nicht bestätigt“ where the unknown month decides — never a yes, never a no', function (BuildPeriod $period, BuildWindow $window): void {
    $verdict = monthsVerdict($period, $window);

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->reason?->code)->toBe(VerdictReason::BUILD_MONTH_UNKNOWN)
        ->and($verdict->reason?->textDe)->toBe('Ob die Freigabe für dein Fahrzeug gilt, hängt vom Baumonat ab. Unsere Fahrzeugdaten kennen nur das Baujahr – schreib uns, wann dein Auto gebaut wurde, und wir prüfen es.')
        ->and($verdict->isSellable())->toBeFalse();
})->with([
    'the row ends inside the start year' => [new BuildPeriod(2004, null, 2008, null), new BuildWindow(new DateTimeImmutable('2001-01-01'), new DateTimeImmutable('2004-06-30'))],
    'the row starts inside the end year' => [new BuildPeriod(2004, null, 2008, null), new BuildWindow(new DateTimeImmutable('2008-06-01'), null)],
    'one year, both months unknown' => [new BuildPeriod(2004, null, 2004, null), new BuildWindow(new DateTimeImmutable('2004-06-01'), null)],
    'still built, start month unknown' => [new BuildPeriod(2020, null, null, null), new BuildWindow(new DateTimeImmutable('2015-01-01'), new DateTimeImmutable('2020-06-30'))],
]);

it('still refuses where no month of the year reaches the row', function () use ($day): void {
    $verdict = monthsVerdict(new BuildPeriod(2004, null, 2008, null), new BuildWindow($day('2010-01-01'), null));

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->reason?->code)->toBe(VerdictReason::OUTSIDE_BUILD_WINDOW);
});

it('answers on the months where the record knows them', function () use ($day): void {
    $inside = monthsVerdict(new BuildPeriod(2004, 5, 2008, 3), new BuildWindow($day('2001-01-01'), $day('2004-06-30')));
    $outside = monthsVerdict(new BuildPeriod(2004, 7, 2008, 3), new BuildWindow($day('2001-01-01'), $day('2004-06-30')));

    expect($inside->reason?->code)->not->toBeIn([VerdictReason::BUILD_MONTH_UNKNOWN, VerdictReason::OUTSIDE_BUILD_WINDOW])
        ->and($outside->status)->toBe(VerdictStatus::NotPermitted)
        ->and($outside->reason?->code)->toBe(VerdictReason::OUTSIDE_BUILD_WINDOW);
});

it('lets an unknown month never answer more freely than any month it could be', function () use ($day): void {
    $rank = static fn (VerdictStatus $s): int => ['PERMITTED' => 0, 'CONDITIONAL' => 1, 'UNKNOWN' => 2, 'NOT_PERMITTED' => 3][$s->value];
    $windows = [null, new BuildWindow($day('2001-01-01'), $day('2004-06-30')), new BuildWindow($day('2004-03-01'), $day('2004-09-30')), new BuildWindow($day('2008-06-01'), null)];

    foreach ($windows as $window) {
        $unknown = monthsVerdict(new BuildPeriod(2004, null, 2008, null), $window);

        foreach (range(1, 12) as $start) {
            foreach ([1, 6, 12] as $end) {
                $known = monthsVerdict(new BuildPeriod(2004, $start, 2008, $end), $window);

                // Never PERMITTED or CONDITIONAL unless every month it could be is so.
                if ($rank($unknown->status) < 2) {
                    expect($rank($known->status))->toBeLessThanOrEqual($rank($unknown->status));
                }
            }
        }
    }
});
