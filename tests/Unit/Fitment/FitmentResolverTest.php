<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\InMemoryFitmentRepository;

/*
 * The state matrix. Every branch of the resolver is reachable here, and every negative branch is
 * asserted to be the RIGHT kind of negative — because conflating UNKNOWN with NOT_PERMITTED tells
 * the customer something false and tells RIMIFY nothing.
 */

const RS4_FIRST = 1;
const RS4_SECOND = 2;
const NEEDS_REVIEW = 8;

it('permits a clean fitment with no conditions and no entry requirement', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row()])
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->reason)->toBeNull()
        ->and($verdict->document?->revision)->toBe(2)
        ->and($verdict->isSellable())->toBeTrue();
});

it('downgrades to CONDITIONAL when entry in the papers is required', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(requiresEntry: true)])
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->requiresEntry)->toBeTrue()
        ->and($verdict->entryNoteDe)->toContain('Prüfstelle')
        ->and($verdict->isSellable())->toBeTrue();
});

it('downgrades to CONDITIONAL for a purchase-affecting condition', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(conditions: [FitmentFixtures::specificBolts()]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->conditions)->toHaveCount(1);
});

it('stays PERMITTED for an INFO condition, which changes nothing', function (): void {
    // Treating every condition as alarming teaches customers to ignore all of them.
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(conditions: [FitmentFixtures::infoOnly()]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->conditions)->toHaveCount(1);
});

it('flags a workshop condition as needing explicit acknowledgement', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(conditions: [FitmentFixtures::archRolling()]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->requiresAcknowledgement())->toBeTrue();
});

/*
 * UNKNOWN — we do not know. Distinct from "we checked and the answer is no".
 */

it('yields UNKNOWN for a vehicle whose legal data could not be parsed', function (): void {
    // R-03 outranks everything: no derivation, no positive verdict, whatever the document says.
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(vehicleId: NEEDS_REVIEW)])
        ->resolve(NEEDS_REVIEW, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->reason?->code)->toBe(VerdictReason::VEHICLE_INCOMPLETE)
        ->and($verdict->isSellable())->toBeFalse();
});

it('yields UNKNOWN when no document mentions the wheel at all', function (): void {
    $verdict = FitmentFixtures::resolver([], new InMemoryFitmentRepository([], [FitmentFixtures::wheel()]))
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->reason?->code)->toBe(VerdictReason::NO_DOCUMENT)
        ->and($verdict->reason?->textDe)->toBe('Für diese Kombination liegt uns kein Gutachten vor.');
});

it('yields UNKNOWN for a vehicle that does not exist', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row()])
        ->resolve(999_999, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->reason?->code)->toBe(VerdictReason::VEHICLE_NOT_FOUND);
});

/*
 * NOT_PERMITTED — we hold a document and it does not cover this.
 */

it('yields NOT_PERMITTED when a document exists but covers no row for this vehicle', function (): void {
    $repository = (new InMemoryFitmentRepository([], [FitmentFixtures::wheel()]))
        ->withDocumentButNoRows(FitmentFixtures::WHEEL_CONFIG_ID);

    $verdict = FitmentFixtures::resolver([], $repository)
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->reason?->code)->toBe(VerdictReason::NOT_COVERED);
});

it('yields NOT_PERMITTED when the document does not cover the build window', function (): void {
    // The RS4 pre-facelift was built 03/2018–11/2019; this approval starts in 2024.
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(window: new BuildWindow(new DateTimeImmutable('2024-01-01'), null)),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->reason?->code)->toBe(VerdictReason::OUTSIDE_BUILD_WINDOW);
});

it('yields NOT_PERMITTED when width or offset falls outside the permitted range', function (): void {
    // The wheel is 8,5J ET 35; the document permits 9,0–10,0J only.
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(widthMin: 9.0, widthMax: 10.0),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->reason?->code)->toBe(VerdictReason::WIDTH_OR_ET_OUTSIDE_RANGE);
});

it('yields NOT_PERMITTED when the row covers the car but permits no tyre size', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(sizes: [])])
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->reason?->code)->toBe(VerdictReason::NO_TYRE_SIZE);
});

it('matches an open-ended approval window against a car still in production', function (): void {
    // The facelift has build_to NULL. An approval scoped "ab 12/2019" with no end must cover it.
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(
            vehicleId: RS4_SECOND,
            window: new BuildWindow(new DateTimeImmutable('2019-12-01'), null),
        ),
    ])->resolve(RS4_SECOND, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Permitted);
});

/*
 * R-06 — the stricter of document and derivation governs, and the verdict says which.
 */

it('derives the minimum when the document is silent', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row()])
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    // 1210 kg front → 605.0 per tyre → 91; 1235 kg rear → 617.5 → 92; 280 km/h → Y.
    expect($verdict->front->minLoadIndex)->toBe(91)
        ->and($verdict->rear->minLoadIndex)->toBe(92)
        ->and($verdict->front->minSpeedSymbol)->toBe('Y')
        ->and($verdict->front->minSource)->toBe(MinSource::Derived);
});

it('lets a stricter document minimum govern, and records that it did', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(sizes: [new TyreSize(245, 45, 18.0, documentMinLoadIndex: 95)]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->front->minLoadIndex)->toBe(95)
        ->and($verdict->front->minSource)->toBe(MinSource::Document);
});

it('ignores a laxer document minimum — the derivation is the floor', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(sizes: [new TyreSize(245, 45, 18.0, documentMinLoadIndex: 80)]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->front->minLoadIndex)->toBe(91)
        ->and($verdict->front->minSource)->toBe(MinSource::Derived);
});

it('ignores a document speed symbol it does not recognise, rather than relaxing', function (): void {
    // An unrecognised symbol would otherwise rank as nothing and silently weaken the requirement.
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(sizes: [new TyreSize(245, 45, 18.0, documentMinSpeedSymbol: 'ZR')]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->front->minSpeedSymbol)->toBe('Y')
        ->and($verdict->front->minSource)->toBe(MinSource::Derived);
});

it('derives front and rear separately', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row()])
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->front->minLoadIndex)->not->toBe($verdict->rear->minLoadIndex);
});

/*
 * Merging several covering rows — always toward caution.
 */

it('requires entry if ANY covering document requires it', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(id: 1, requiresEntry: false),
        FitmentFixtures::row(id: 2, requiresEntry: true, document: FitmentFixtures::document(revision: 3)),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->requiresEntry)->toBeTrue()
        ->and($verdict->status)->toBe(VerdictStatus::Conditional);
});

it('shows the union of conditions across covering documents', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(id: 1, conditions: [FitmentFixtures::specificBolts()]),
        FitmentFixtures::row(id: 2, conditions: [FitmentFixtures::archRolling()]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    $codes = array_map(static fn ($c): string => $c->code, $verdict->conditions);

    expect($codes)->toContain('SPECIFIC_BOLTS')->toContain('ARCH_ROLLING');
});

it('offers only the intersection of tyre sizes across covering documents', function (): void {
    // A size only one document permits is the permissive answer, and is not offered.
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(id: 1, sizes: [new TyreSize(245, 45, 18.0), new TyreSize(255, 40, 18.0)]),
        FitmentFixtures::row(id: 2, sizes: [new TyreSize(245, 45, 18.0)]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->front->sizes)->toHaveCount(1)
        ->and($verdict->front->sizes[0]->widthMm)->toBe(245);
});

it('reports the newest revision among the covering documents', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(id: 1, document: FitmentFixtures::document(revision: 1)),
        FitmentFixtures::row(id: 2, document: FitmentFixtures::document(revision: 4)),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->document?->revision)->toBe(4)
        ->and($verdict->snapshot->documentRevision)->toBe(4);
});

/*
 * The snapshot payload and the wire shape.
 */

it('carries a snapshot identifying the row, revision, time and engine build', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row()])
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->snapshot->fitmentId)->toBe(20431)
        ->and($verdict->snapshot->documentRevision)->toBe(2)
        ->and($verdict->snapshot->engineVersion)->toBe('1.0.0')
        ->and($verdict->snapshot->toArray()['computedAt'])->toBe('2026-09-21T14:22:31Z');
});

it('round-trips losslessly through the frozen array shape', function (): void {
    $verdict = FitmentFixtures::resolver([
        FitmentFixtures::row(requiresEntry: true, conditions: [FitmentFixtures::specificBolts()]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    $restored = FitmentVerdict::fromArray($verdict->toArray());

    expect($restored->toArray())->toBe($verdict->toArray())
        ->and($restored->status)->toBe($verdict->status)
        ->and($restored->document?->pdfSha256)->toBe($verdict->document?->pdfSha256)
        ->and($restored->front->minLoadIndex)->toBe($verdict->front->minLoadIndex);
});

it('renders the verdict in the shape the order line stores', function (): void {
    $payload = FitmentFixtures::resolver([
        FitmentFixtures::row(requiresEntry: true, conditions: [FitmentFixtures::entryRequired()]),
    ])->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID)->toArray();

    expect($payload['status'])->toBe('CONDITIONAL')
        ->and($payload['vehicle']['hsn'])->toBe('1860')
        ->and($payload['vehicle']['tsn'])->toBe('AAS')
        ->and($payload['wheel']['label'])->toContain('8,5J')
        ->and($payload['document']['kind'])->toBe('TEILEGUTACHTEN')
        ->and($payload['document']['pdfSha256'])->not->toBeNull()
        ->and($payload['requiresEntry'])->toBeTrue()
        ->and($payload['tyres']['perAxle'])->toBe('SAME')
        ->and($payload['tyres']['front']['minSource'])->toBe('DERIVED')
        ->and($payload['reason'])->toBeNull()
        // R-15: what reaches the customer is a sentence, never the code.
        ->and($payload['conditions'][0]['textDe'])->toBe('Eintragung in die Fahrzeugpapiere erforderlich.');
});

it('never reports a document on a verdict that has none', function (): void {
    $verdict = FitmentFixtures::resolver([], new InMemoryFitmentRepository([], [FitmentFixtures::wheel()]))
        ->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->document)->toBeNull()
        ->and($verdict->requiresEntry)->toBeFalse()
        ->and($verdict->conditions)->toBe([])
        ->and($verdict->front->sizes)->toBe([])
        ->and($verdict->front->minLoadIndex)->toBeNull();
});

it('never returns PERMITTED without a document, across every fixture', function (): void {
    $repositories = [
        new InMemoryFitmentRepository([], [FitmentFixtures::wheel()]),
        (new InMemoryFitmentRepository([], [FitmentFixtures::wheel()]))
            ->withDocumentButNoRows(FitmentFixtures::WHEEL_CONFIG_ID),
    ];

    foreach ($repositories as $repository) {
        foreach ([RS4_FIRST, RS4_SECOND, NEEDS_REVIEW] as $vehicleId) {
            $verdict = FitmentFixtures::resolver([], $repository)
                ->resolve($vehicleId, FitmentFixtures::WHEEL_CONFIG_ID);

            expect($verdict->status)->not->toBe(VerdictStatus::Permitted)
                ->and($verdict->status)->not->toBe(VerdictStatus::Conditional);
        }
    }
});

it('marks only UNKNOWN as feeding the catalogue-gap report', function (): void {
    expect(VerdictStatus::Unknown->feedsGapReport())->toBeTrue()
        ->and(VerdictStatus::NotPermitted->feedsGapReport())->toBeFalse()
        ->and(VerdictStatus::Permitted->feedsGapReport())->toBeFalse();
});

it('gives the same verdict for the same inputs, every time', function (): void {
    // Cross-surface equivalence in miniature: one resolver, one answer.
    $rows = [FitmentFixtures::row(requiresEntry: true)];

    $a = FitmentFixtures::resolver($rows)->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);
    $b = FitmentFixtures::resolver($rows)->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($a->toArray())->toBe($b->toArray());
});

it('resolves the two RS4 variants independently of each other', function (): void {
    // The whole reason disambiguation exists: the rows are per vehicle, not per key-number pair.
    $resolver = FitmentFixtures::resolver([FitmentFixtures::row(vehicleId: RS4_FIRST)]);

    expect($resolver->resolve(RS4_FIRST, FitmentFixtures::WHEEL_CONFIG_ID)->status)
        ->toBe(VerdictStatus::Permitted)
        ->and($resolver->resolve(RS4_SECOND, FitmentFixtures::WHEEL_CONFIG_ID)->status)
        ->toBe(VerdictStatus::NotPermitted);
});
