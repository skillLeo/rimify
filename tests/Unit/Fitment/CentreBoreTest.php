<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\CentreBoreSource;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\InMemoryFitmentRepository;

/*
 * The Mittenlochbohrung is not a property of the rim (client, 2026-09-23): the approval states it
 * for the car the rim was tested on, so the same casting is 66,5 under one vehicle row and 66,6
 * under another. That makes it a relationship (CLAUDE.md §1) and puts it on the verdict, next to
 * everything else the document says about this wheel on this car.
 *
 * The engine reports only what the document states. It never substitutes the rim's own figure —
 * falling back to that is the storefront's decision, and one it has to label as the rim's.
 */

/** The fixture vehicle: Audi RS 4 Avant B9 pre-facelift. */
const BORE_VEHICLE = 1;

it('carries the bore the document states for this vehicle, alongside the rim\'s own figure', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(centreBoreMm: 66.5)])
        ->resolve(BORE_VEHICLE, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->documentCentreBoreMm)->toBe(66.5)
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Document)
        // Two different claims, both intact: the rim is cast 66,60, and this car's row says 66,5.
        ->and($verdict->wheel?->centreBoreMm)->toBe(66.60);
});

it('states no bore where the document states none, and never substitutes the rim\'s', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row()])
        ->resolve(BORE_VEHICLE, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->documentCentreBoreMm)->toBeNull()
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Unstated)
        // The rim's figure is still there for the storefront to fall back to — it just never
        // becomes the document's statement on the way through the engine.
        ->and($verdict->wheel?->centreBoreMm)->toBe(66.60);
});

it('takes the bore from the row that states one when another covering row is silent', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(id: 1, document: FitmentFixtures::document(revision: 1), centreBoreMm: 66.5),
        FitmentFixtures::row(id: 2, document: FitmentFixtures::document(revision: 4)),
    ])->resolve(BORE_VEHICLE, FitmentFixtures::WHEEL_CONFIG_ID);

    // Silence is not a competing measurement, so the one document that states a bore states it —
    // even though the other, newer one is the governing document for everything else.
    expect($verdict->document?->revision)->toBe(4)
        ->and($verdict->documentCentreBoreMm)->toBe(66.5)
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Document);
});

it('reads the same bore written at two precisions as one statement', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(id: 1, document: FitmentFixtures::document(revision: 1), centreBoreMm: 66.5),
        FitmentFixtures::row(id: 2, document: FitmentFixtures::document(revision: 4), centreBoreMm: 66.50),
    ])->resolve(BORE_VEHICLE, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->documentCentreBoreMm)->toBe(66.5)
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Document);
});

it('states no bore at all where two covering documents disagree about it', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(id: 1, document: FitmentFixtures::document(revision: 1), centreBoreMm: 66.5),
        FitmentFixtures::row(id: 2, document: FitmentFixtures::document(revision: 4), centreBoreMm: 66.6),
    ])->resolve(BORE_VEHICLE, FitmentFixtures::WHEEL_CONFIG_ID);

    // The wheel is still permitted — the disagreement is about one figure, not about the fitment.
    // But no number is stated, and the reason it is missing is on the record.
    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->documentCentreBoreMm)->toBeNull()
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Conflicting);
});

it('states no bore on a verdict that has no document behind it', function (): void {
    $verdict = FitmentFixtures::resolver([], new InMemoryFitmentRepository([], [FitmentFixtures::wheel()]))
        ->resolve(BORE_VEHICLE, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->document)->toBeNull()
        ->and($verdict->documentCentreBoreMm)->toBeNull()
        ->and($verdict->centreBoreSource)->toBe(CentreBoreSource::Unstated);
});

it('freezes the bore and its source into the order snapshot, and reads them back', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(centreBoreMm: 66.5)])
        ->resolve(BORE_VEHICLE, FitmentFixtures::WHEEL_CONFIG_ID);

    $payload = $verdict->toArray();
    $restored = FitmentVerdict::fromArray($payload);

    expect($payload['documentCentreBoreMm'])->toBe(66.5)
        ->and($payload['centreBoreSource'])->toBe('DOCUMENT')
        ->and($restored->documentCentreBoreMm)->toBe(66.5)
        ->and($restored->centreBoreSource)->toBe(CentreBoreSource::Document)
        ->and($restored->toArray())->toBe($payload);
});

it('records a conflict in the snapshot rather than a number nobody stated', function (): void {
    $payload = FitmentFixtures::resolver([
        FitmentFixtures::row(id: 1, document: FitmentFixtures::document(revision: 1), centreBoreMm: 66.5),
        FitmentFixtures::row(id: 2, document: FitmentFixtures::document(revision: 4), centreBoreMm: 66.6),
    ])->resolve(BORE_VEHICLE, FitmentFixtures::WHEEL_CONFIG_ID)->toArray();

    $restored = FitmentVerdict::fromArray($payload);

    expect($payload['documentCentreBoreMm'])->toBeNull()
        ->and($payload['centreBoreSource'])->toBe('CONFLICTING')
        ->and($restored->documentCentreBoreMm)->toBeNull()
        ->and($restored->centreBoreSource)->toBe(CentreBoreSource::Conflicting);
});
