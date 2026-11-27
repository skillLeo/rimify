<?php

declare(strict_types=1);

use App\Domain\Fitment\Support\BuildPeriod;
use App\Support\GermanFormat;

/*
 * A build period as the record states it (D-516): shown with what it knows and not a digit more, and the two windows that
 * follow from it — the certain one every comparison reads, the possible one only the unknown month reaches.
 */

it('shows what the record knows', function (BuildPeriod $period, string $label): void {
    expect($period->label())->toBe($label);
})->with([
    'both months' => [new BuildPeriod(1999, 12, 2004, 1), "12/1999\u{00A0}– 01/2004"],
    'no months' => [new BuildPeriod(1999, null, 2004, null), "1999\u{00A0}– 2004"],
    'start month only' => [new BuildPeriod(1999, 12, 2004, null), "12/1999\u{00A0}– 2004"],
    'end month only' => [new BuildPeriod(1999, null, 2004, 1), "1999\u{00A0}– 01/2004"],
    'still built' => [new BuildPeriod(2020, 10, null, null), 'seit 10/2020'],
    'still built, no month' => [new BuildPeriod(2020, null, null, null), 'seit 2020'],
    'nothing' => [new BuildPeriod(null, null, null, null), 'Bauzeitraum unbekannt'],
]);

it('reads the certain window from the latest start to the earliest end, the possible one the other way', function (): void {
    $p = new BuildPeriod(2004, null, 2008, null);

    expect($p->certainFrom()?->format('Y-m-d'))->toBe('2004-12-01')
        ->and($p->certainTo()?->format('Y-m-d'))->toBe('2008-01-31')
        ->and($p->possibleFrom()?->format('Y-m-d'))->toBe('2004-01-01')
        ->and($p->possibleTo()?->format('Y-m-d'))->toBe('2008-12-31')
        ->and($p->hasUnknownMonth())->toBeTrue()
        ->and((new BuildPeriod(2004, 3, null, null))->certainTo())->toBeNull()
        ->and((new BuildPeriod(2004, 3, 2008, 2))->hasUnknownMonth())->toBeFalse();
});

it('formats the shop’s periods through one helper', function (): void {
    expect(GermanFormat::buildPeriod(new DateTimeImmutable('2018-03-01'), new DateTimeImmutable('2019-11-30')))->toBe("03/2018\u{00A0}– 11/2019")
        ->and(GermanFormat::buildPeriod(new DateTimeImmutable('2019-12-01'), null))->toBe('seit 12/2019')
        ->and(GermanFormat::buildPeriodParts(1999, null, 2004, null))->toBe("1999\u{00A0}– 2004");
});
