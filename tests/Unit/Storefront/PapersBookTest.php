<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Storefront\PapersBook;

/**
 * The `rmf_papiere` cookie (the second review of C9, §5): one compact map keyed by vehicle, at most five
 * cars and 500 bytes, the oldest dropped; every figure re-checked on reading.
 */
function papers(int $front = 1100, int $rear = 1100, int $speed = 250): PapersFigures
{
    $figures = PapersFigures::tryFrom($front, $rear, $speed);

    expect($figures)->not->toBeNull();

    return $figures;
}

it('keeps each car’s figures under its own id, the latest first, in a compact value', function (): void {
    $book = (new PapersBook)->with(1843, papers())->with(977, papers(980, 1010, 210));

    expect($book->encode())->toBe('977.980.1010.210_1843.1100.1100.250')
        ->and(PapersBook::decode($book->encode())->for(1843)?->axleRearKg)->toBe(1100)
        ->and(PapersBook::decode($book->encode())->for(977)?->topSpeedKmh)->toBe(210)
        // Only digits, dots and underscores: nothing a cookie header would percent-encode.
        ->and(rawurlencode($book->encode()))->toBe($book->encode());
});

it('replaces a car’s figures in place rather than keeping two, and forgets one car without touching the others', function (): void {
    $book = (new PapersBook)->with(1, papers())->with(2, papers())->with(1, papers(1200, 1200, 280));

    expect(array_keys($book->entries))->toBe([1, 2])
        ->and($book->for(1)?->axleFrontKg)->toBe(1200)
        ->and(array_keys($book->without(1)->entries))->toBe([2]);
});

it('holds at most five cars and drops the oldest', function (): void {
    $book = new PapersBook;

    foreach (range(1, 7) as $id) {
        $book = $book->with($id, papers());
    }

    expect(array_keys($book->entries))->toBe([7, 6, 5, 4, 3])
        ->and(strlen($book->encode()))->toBeLessThanOrEqual(PapersBook::MAX_BYTES);
});

it('stays under 500 bytes with five of the longest entries it can hold', function (): void {
    $book = new PapersBook;

    foreach (range(9_999_999_995, 9_999_999_999) as $id) {
        $book = $book->with($id, papers(4000, 4000, 420));
    }

    expect(count($book->entries))->toBe(5)
        ->and(strlen($book->encode()))->toBeLessThanOrEqual(PapersBook::MAX_BYTES);
});

it('drops, entry by entry, whatever is malformed or out of range, and never guesses', function (): void {
    $book = PapersBook::decode('1.1100.1100.250_2.99999.1100.250_3.1100.1100.9_x.1.2.3_4.0.0.0_5.1100,5.1100.250_6.1100.1100.250');

    expect(array_keys($book->entries))->toBe([1, 6])
        ->and(PapersBook::decode('')->isEmpty())->toBeTrue()
        ->and(PapersBook::decode(null)->isEmpty())->toBeTrue()
        ->and(PapersBook::decode(str_repeat('1.1100.1100.250_', 40))->isEmpty())->toBeTrue();
});

it('refuses figures no road car has', function (): void {
    expect(PapersFigures::tryFrom(99_999, 1100, 250))->toBeNull()
        ->and(PapersFigures::tryFrom(1100, 299, 250))->toBeNull()
        ->and(PapersFigures::tryFrom(1100, 1100, 421))->toBeNull()
        ->and(PapersFigures::tryFrom(1100, 1100, 59))->toBeNull()
        ->and(PapersFigures::tryFrom(300, 4000, 60))->not->toBeNull();
});

it('lays the figures over the car so that an answer can only grow stricter', function (): void {
    $car = new VehicleRecord(
        id: 1, hsn: '0005', tsn: 'CDA', vsn: null, make: 'BMW', model: '4er', variant: '420i Coupé', typeDesignation: '3C',
        buildWindow: BuildWindow::fromDates(new DateTimeImmutable('2020-01-01'), null),
        axleLoadFrontKg: 1100, axleLoadRearKg: null, maxSpeedKmh: 250, needsReview: true,
    );

    $read = papers(1050, 1180, 240)->applyTo($car);

    // The data's 1.100 kg outweighs a typed 1.050 kg; the typed 1.180 kg fills the gap; the data's 250 km/h stands.
    expect($read->axleLoadFrontKg)->toBe(1100)
        ->and($read->axleLoadRearKg)->toBe(1180)
        ->and($read->maxSpeedKmh)->toBe(250)
        ->and($read->needsReview)->toBeFalse()
        ->and($read->hasCompleteLegalData())->toBeTrue()
        ->and(papers()->applyTo(new VehicleRecord(...[...get_object_vars($car), 'isDeleted' => true]))->hasCompleteLegalData())->toBeFalse();
});
