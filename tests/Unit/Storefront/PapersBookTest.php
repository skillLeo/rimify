<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\PapersIndex;
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

it('keeps P.2 as a fifth figure where the customer gave it, and reads an entry without it as before', function (): void {
    $withPower = PapersFigures::tryFrom(1100, 1100, 250, 140);
    expect($withPower)->not->toBeNull();

    $book = (new PapersBook)->with(7, $withPower ?? papers())->with(8, papers());

    expect($book->encode())->toBe('8.1100.1100.250_7.1100.1100.250.140')
        ->and(PapersBook::decode($book->encode())->for(7)?->powerKw)->toBe(140)
        ->and(PapersBook::decode($book->encode())->for(8)?->powerKw)->toBeNull()
        // Out of range, the whole entry is dropped, never half kept.
        ->and(PapersBook::decode('9.1100.1100.250.5')->isEmpty())->toBeTrue()
        ->and(PapersFigures::tryFrom(1100, 1100, 250, 1001))->toBeNull();
});

it('keeps 15.1 and 15.2 where given, reads an entry without them as before, and drops an entry whose index it cannot read', function (): void {
    $index = PapersIndex::tryFrom(91, 'W', 95, '(Y)');
    $figures = PapersFigures::tryFrom(1100, 1100, 250, null, $index);
    $withPower = PapersFigures::tryFrom(1100, 1100, 250, 140, $index);

    expect($figures)->not->toBeNull()->and($withPower)->not->toBeNull();

    $book = (new PapersBook)->with(7, $figures ?? papers())->with(8, $withPower ?? papers())->with(9, papers());
    $read = PapersBook::decode($book->encode());

    // `(95Y)` travels as `95Yx`: no bracket in the cookie, nothing percent-encoded.
    expect($book->encode())->toBe('9.1100.1100.250_8.1100.1100.250.140.p91W.p95Yx_7.1100.1100.250.p91W.p95Yx')
        ->and(rawurlencode($book->encode()))->toBe($book->encode())
        ->and($read->for(7)?->index?->labelFor('FRONT'))->toBe('91W')
        ->and($read->for(7)?->index?->forAxle('REAR')['speedSymbol'])->toBe('(Y)')
        ->and($read->for(8)?->powerKw)->toBe(140)
        ->and($read->for(8)?->index?->labelFor('REAR'))->toBe('(95Y)')
        ->and($read->for(9)?->index)->toBeNull()
        // A symbol no papers print, or an index out of range: the whole entry goes, never the figures without it.
        ->and(PapersBook::decode('7.1100.1100.250.p91X.p94Y')->isEmpty())->toBeTrue()
        ->and(PapersBook::decode('7.1100.1100.250.p31W.p94Y')->isEmpty())->toBeTrue()
        ->and(PapersBook::decode('7.1100.1100.250.p91Wx.p94Y')->isEmpty())->toBeTrue();
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

// D-291: the form asks for what is missing, so an entry may hold T alone, or one axle where the data knows the other.
it('keeps only the figures the customer gave, a figure not given as „-“, and reads the full form as before', function (): void {
    $speedOnly = PapersFigures::tryFrom(null, null, 250);
    $rearOnly = PapersFigures::tryFrom(null, 1180, null, 140);

    expect($speedOnly)->not->toBeNull()->and($rearOnly)->not->toBeNull();

    $book = (new PapersBook)->with(7, $speedOnly ?? papers())->with(8, $rearOnly ?? papers())->with(9, papers());
    $read = PapersBook::decode($book->encode());

    expect($book->encode())->toBe('9.1100.1100.250_8.-.1180.-.140_7.-.-.250')
        ->and(rawurlencode($book->encode()))->toBe($book->encode())
        ->and($read->for(7)?->axleFrontKg)->toBeNull()
        ->and($read->for(7)?->topSpeedKmh)->toBe(250)
        ->and($read->for(8)?->axleRearKg)->toBe(1180)
        ->and($read->for(8)?->powerKw)->toBe(140)
        ->and($read->for(9)?->axleFrontKg)->toBe(1100)
        // Nothing at all is no entry; a figure out of range drops the entry as before.
        ->and(PapersFigures::tryFrom(null, null, null))->toBeNull()
        ->and(PapersBook::decode('7.-.-.-')->isEmpty())->toBeTrue()
        ->and(PapersBook::decode('7.-.-.9')->isEmpty())->toBeTrue();

    // Laid over the car: what the customer did not give stays the data's, and the car waits while one is missing (R-03).
    $car = new VehicleRecord(
        id: 7, hsn: '0005', tsn: 'CDA', vsn: null, make: 'BMW', model: '4er', variant: '420i Coupé', typeDesignation: '3C',
        buildWindow: BuildWindow::fromDates(new DateTimeImmutable('2020-01-01'), null),
        axleLoadFrontKg: 1100, axleLoadRearKg: null, maxSpeedKmh: null, needsReview: true,
    );

    $withSpeed = ($speedOnly ?? papers())->applyTo($car);
    expect($withSpeed->axleLoadFrontKg)->toBe(1100)
        ->and($withSpeed->axleLoadRearKg)->toBeNull()
        ->and($withSpeed->maxSpeedKmh)->toBe(250)
        ->and($withSpeed->needsReview)->toBeTrue();

    $complete = (PapersFigures::tryFrom(null, 1180, 250) ?? papers())->applyTo($car);
    expect($complete->axleLoadRearKg)->toBe(1180)
        ->and($complete->needsReview)->toBeFalse()
        ->and($complete->hasCompleteLegalData())->toBeTrue();
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
