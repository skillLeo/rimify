<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\BuildFromName;
use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\VehicleBuild;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Storefront\PapersBook;

/*
 * The operator's last prompt §1.1: most cars a Gutachten names come without a body style or drive, so a row printed
 * for „Kombi“ or „nur mit Allradantrieb“ could not be answered. Derived first, from a whole unambiguous word of the
 * name; asked second, and the owner's answer kept beside 8.1, 8.2 and T; the vehicle data's own values always
 * stand; and every answer says which of the three it rests on.
 */

function buildCar(string $model, string $variant, ?string $body = null, ?string $drive = null): VehicleRecord
{
    return new VehicleRecord(
        id: 7, hsn: null, tsn: null, vsn: null, make: 'BMW', model: $model, variant: $variant, typeDesignation: $variant,
        buildWindow: BuildWindow::unbounded(), axleLoadFrontKg: null, axleLoadRearKg: null, maxSpeedKmh: null,
        bodyForm: $body, driveAxle: $drive, needsReview: true,
    );
}

it('derives a body style or drive only from a whole word that leaves no doubt', function (string $model, string $variant, ?string $body, ?string $word, ?string $drive): void {
    $derived = BuildFromName::of($model, $variant);

    expect($derived['bodyForm'])->toBe($body)
        ->and($derived['bodyWord'])->toBe($word)
        ->and($derived['driveAxle'])->toBe($drive);
})->with([
    'Touring' => ['3er-Touring (VI)', '3K', 'Kombi', 'Touring', null],
    'Touring and 4x4' => ['5er-Touring', '4x4 560X', 'Kombi', 'Touring', 'Allrad'],
    'Allrad in the model' => ['3er-Allrad (IV)', '346X', null, null, 'Allrad'],
    'Avant quattro' => ['A4', 'Avant 2.0 TDI quattro', 'Kombi', 'Avant', 'Allrad'],
    'xDrive glued to its figure' => ['X3', 'xDrive30d', null, null, 'Allrad'],
    '4MATIC' => ['C-Klasse', 'C 300 4MATIC', null, null, 'Allrad'],
    'Coupé with an accent' => ['4er', 'Coupé 420i', 'Coupe', 'Coupé', null],
    'Cabriolet' => ['3er', 'Cabriolet 330Ci', 'Cabrio', 'Cabriolet', null],
    'Roadster' => ['Z4', 'Roadster 2.5i', 'Roadster', 'Roadster', null],
    // A four-door car, not a Coupé: the word stands inside another.
    'GranCoupé' => ['4er-GranCoupé', '3C', null, null, null],
    // Four-wheel steering, not four-wheel drive.
    'Allradlenkung' => ['5er-Reihe', '5L mit Allradlenkung', null, null, null],
    // Two body styles in one name: nothing derived, asked instead.
    'two ways' => ['6er', 'Coupé und Cabrio', null, null, null],
    'nothing to go on' => ['1er-Reihe', '1K4', null, null, null],
]);

it('fills a gap from the owner first, then the name — and never over the vehicle data', function (): void {
    $touring = buildCar('3er-Touring (VI)', '3K');
    $said = VehicleBuild::tryFrom('Limousine', 'Hinterachse');

    $fromName = VehicleBuild::overlay($touring, null);
    $fromOwner = VehicleBuild::overlay($touring, $said);
    $fromData = VehicleBuild::overlay(buildCar('3er-Touring (VI)', '3K', 'Kombi', 'Allrad'), $said);

    expect([$fromName->bodyForm, $fromName->bodyFormSource, $fromName->driveAxle, $fromName->driveAxleSource])->toBe(['Kombi', VehicleBuild::FROM_NAME, null, null])
        ->and([$fromOwner->bodyForm, $fromOwner->bodyFormSource, $fromOwner->driveAxle, $fromOwner->driveAxleSource])->toBe(['Limousine', VehicleBuild::FROM_CUSTOMER, 'Hinterachse', VehicleBuild::FROM_CUSTOMER])
        ->and([$fromData->bodyForm, $fromData->bodyFormSource, $fromData->driveAxle])->toBe(['Kombi', null, 'Allrad'])
        ->and(VehicleBuild::tryFrom('Pickup', 'Kette'))->toBeNull();
});

it('keeps where each value came from when the papers are laid over the car', function (): void {
    $figures = PapersFigures::tryFrom(1100, 1100, 250);
    expect($figures)->not->toBeNull();

    $read = $figures?->applyTo(VehicleBuild::overlay(buildCar('3er-Touring (VI)', '3K'), null));

    expect($read?->bodyForm)->toBe('Kombi')->and($read?->bodyFormSource)->toBe(VehicleBuild::FROM_NAME);
});

it('names the facts a row would need and the car lacks — and none a row does not narrow by', function (): void {
    $kombi = new RowFilter('Car', RowFilter::BODY_FORM, ['Kombi']);
    $allrad = new RowFilter('A56', RowFilter::DRIVE, [], 'only', 'Allrad');
    $everyBody = new RowFilter('Pkw geschlossen', RowFilter::BODY_FORM, RowFilter::BODY_FORMS);
    $noParameter = new RowFilter('X', RowFilter::BODY_FORM, []);

    expect(RowFilter::openFacts([$kombi, $allrad], buildCar('1er-Reihe', '1K4')))->toBe(['bodyForm', 'driveAxle'])
        ->and(RowFilter::openFacts([$kombi, $allrad], buildCar('1er-Reihe', '1K4', 'Kombi')))->toBe(['driveAxle'])
        ->and(RowFilter::openFacts([$everyBody], buildCar('1er-Reihe', '1K4')))->toBe([])
        ->and(RowFilter::openFacts([$noParameter], buildCar('1er-Reihe', '1K4')))->toBe([]);
});

it('keeps the owner’s answer in the same cookie beside the figures, and reads an old cookie as before', function (): void {
    $figures = PapersFigures::tryFrom(1100, 1100, 250);
    $build = VehicleBuild::tryFrom('Schrägheck', 'Hinterachse');
    expect($figures)->not->toBeNull()->and($build)->not->toBeNull();

    $book = (new PapersBook)->with(82, $figures)->withBuild(82, $build)->withBuild(80, VehicleBuild::tryFrom('Kombi', null));
    $read = PapersBook::decode($book->encode());

    expect($book->encode())->toBe('82.1100.1100.250_80-k20_82-k53')
        ->and(rawurlencode($book->encode()))->toBe($book->encode())
        ->and($read->buildFor(82)?->bodyForm)->toBe('Schrägheck')
        ->and($read->buildFor(82)?->driveAxle)->toBe('Hinterachse')
        ->and($read->buildFor(80)?->driveAxle)->toBeNull()
        ->and($read->for(82)?->axleFrontKg)->toBe(1100)
        // The figures go, the answer stays; the answer goes, the figures stay.
        ->and($read->without(82)->buildFor(82)?->bodyForm)->toBe('Schrägheck')
        ->and($read->withoutBuild(82)->for(82)?->topSpeedKmh)->toBe(250)
        // An old cookie, and a malformed or empty answer, read as before: dropped, never guessed.
        ->and(PapersBook::decode('82.1100.1100.250')->buildFor(82))->toBeNull()
        ->and(PapersBook::decode('82-k00_83-k93_84-k5')->builds)->toBe([]);
});
