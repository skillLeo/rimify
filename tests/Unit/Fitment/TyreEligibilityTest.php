<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\Severity;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryTyreCatalogue;

/*
 * Every rule of docs/specs/komplettrad.md §3.3, in its order, against the worked example: the
 * Audi RS 4 Avant B9 (front and rear 93 at 280 km/h — a Y tyre carries 95 % there — and Y) on the demo 8,5J × 18 wheel. Each rule fails closed,
 * and none of them may be re-implemented anywhere else (R-13) — so every branch is asserted here,
 * with nothing booted and no database.
 */

function eligibilityOver(TyreRecord ...$tyres): TyreEligibility
{
    return new TyreEligibility(
        new InMemoryTyreCatalogue(array_values($tyres)),
        new SpeedSymbolDeriver(FitmentFixtures::tables()),
    );
}

/** A 245/45 R18 95Y the shop sells — meets the RS 4's minimum (93, Y) with room to spare. */
function permittedTyre(
    int $id = 1,
    int $widthMm = 245,
    int $aspect = 45,
    float $diameterIn = 18.0,
    int $loadIndex = 95,
    string $speedSymbol = 'Y',
    int $priceCents = 18_900,
    bool $sellable = true,
): TyreRecord {
    return new TyreRecord(
        id: $id,
        widthMm: $widthMm,
        aspect: $aspect,
        diameterIn: $diameterIn,
        loadIndex: $loadIndex,
        speedSymbol: $speedSymbol,
        speedRank: FitmentFixtures::tables()->speedSymbol($speedSymbol)?->rank ?? 0,
        priceCents: $priceCents,
        sellable: $sellable,
        brandName: 'Demo',
        name: 'Sport',
        season: 'sommer',
    );
}

/** The fixture RS 4 (vehicle 1) on the fixture wheel, decided by the live resolver. */
function liveVerdict(FitmentRow ...$rows): FitmentVerdict
{
    return FitmentFixtures::resolver(array_values($rows))->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
}

/** A live verdict with its axle requirements swapped — for shapes the resolver itself never emits. */
function withAxles(FitmentVerdict $verdict, AxleRequirement $front, AxleRequirement $rear): FitmentVerdict
{
    return new FitmentVerdict(
        status: $verdict->status,
        vehicle: $verdict->vehicle,
        wheel: $verdict->wheel,
        document: $verdict->document,
        requiresEntry: $verdict->requiresEntry,
        entryNoteDe: $verdict->entryNoteDe,
        conditions: $verdict->conditions,
        front: $front,
        rear: $rear,
        reason: $verdict->reason,
        snapshot: $verdict->snapshot,
    );
}

function tyreBrandLimit(): Condition
{
    return new Condition(
        code: 'TYRE_BRAND_LIMIT',
        severity: Severity::Info,
        textDe: 'Nur Reifen der im Gutachten genannten Hersteller zulässig.',
        affectsTyreChoice: true,
    );
}

it('permits a tyre the document lists, in the wheel diameter, at or above the minimum, in stock', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and(eligibilityOver()->permits($verdict, permittedTyre()))->toBeNull()
        ->and(eligibilityOver()->permits($verdict, permittedTyre(loadIndex: 93, speedSymbol: 'Y')))->toBeNull();
});

/*
 * The guard before rule 1: a snapshot is evidence of what was decided, never an input.
 */

it('refuses a verdict restored from a snapshot before reading any rule', function (): void {
    $live = liveVerdict(FitmentFixtures::row());
    $restored = FitmentVerdict::fromArray($live->toArray());

    // Same data, different provenance — and only the provenance decides.
    expect($restored->restored)->toBeTrue()
        ->and($restored->status)->toBe($live->status)
        ->and(eligibilityOver()->permits($live, permittedTyre()))->toBeNull()
        ->and(eligibilityOver()->permits($restored, permittedTyre()))->toBe(KomplettradRefusal::VerdictRestored);

    $offer = eligibilityOver(permittedTyre())->offerFor($restored);

    expect($offer->refusal)->toBe(KomplettradRefusal::VerdictRestored)
        ->and($offer->tyres)->toBe([])
        ->and($offer->minimumSentenceDe)->toBeNull();
});

/*
 * Rule 1 — selected on the status. UNKNOWN is not NOT_PERMITTED (R-07).
 */

it('refuses an UNKNOWN verdict with its own sentence, never the NOT_PERMITTED one', function (): void {
    // No document mentions the wheel at all.
    $verdict = liveVerdict();
    $refusal = eligibilityOver()->permits($verdict, permittedTyre());

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($refusal)->toBe(KomplettradRefusal::VerdictUnknown)
        ->and($refusal?->sentenceDe())->toContain('kein Gutachten')
        ->and($refusal?->sentenceDe())->not->toBe(KomplettradRefusal::VerdictNotPermitted->sentenceDe())
        ->and(eligibilityOver()->offerFor($verdict)->refusal)->toBe(KomplettradRefusal::VerdictUnknown);
});

it('refuses a NOT_PERMITTED verdict as not permitted', function (): void {
    // The wheel is 8,5J; the document permits 9,0–10,0J only.
    $verdict = liveVerdict(FitmentFixtures::row(widthMin: 9.0, widthMax: 10.0));

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and(eligibilityOver()->permits($verdict, permittedTyre()))->toBe(KomplettradRefusal::VerdictNotPermitted);
});

it('answers UNKNOWN for a verdict that holds no wheel, whatever its status says', function (): void {
    // A repository that knows the rows but not the configuration: the resolver skips the
    // geometry check and still says PERMITTED — but we hold nothing to fit a tyre to.
    $permittedWithoutWheel = FitmentFixtures::resolver([], new InMemoryFitmentRepository([FitmentFixtures::row()], []))
        ->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);

    $notPermittedWithoutWheel = FitmentFixtures::resolver(
        [],
        (new InMemoryFitmentRepository([], []))->withDocumentButNoRows(FitmentFixtures::WHEEL_CONFIG_ID),
    )->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($permittedWithoutWheel->status)->toBe(VerdictStatus::Permitted)
        ->and($permittedWithoutWheel->wheel)->toBeNull()
        ->and(eligibilityOver()->permits($permittedWithoutWheel, permittedTyre()))->toBe(KomplettradRefusal::VerdictUnknown)
        ->and($notPermittedWithoutWheel->status)->toBe(VerdictStatus::NotPermitted)
        ->and(eligibilityOver()->permits($notPermittedWithoutWheel, permittedTyre()))->toBe(KomplettradRefusal::VerdictUnknown);
});

it('still permits a CONDITIONAL verdict — conditions are read, not refused', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row(requiresEntry: true, conditions: [FitmentFixtures::specificBolts()]));

    expect($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and(eligibilityOver()->permits($verdict, permittedTyre()))->toBeNull();
});

/*
 * Rule 2 — the document restricts which tyres may be fitted.
 */

it('refuses when a condition restricts the tyre choice', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row(conditions: [tyreBrandLimit()]));

    expect($verdict->isSellable())->toBeTrue()
        ->and(eligibilityOver()->permits($verdict, permittedTyre()))->toBe(KomplettradRefusal::TyreChoiceRestricted);
});

/*
 * Rule 3 — staggered, two independent guards.
 */

it('refuses a MIXED layout — rule 3a on two axle-scoped rows', function (): void {
    $verdict = liveVerdict(
        FitmentFixtures::row(id: 1, axle: 'FRONT', sizes: [new TyreSize(245, 40, 18.0)]),
        FitmentFixtures::row(id: 2, axle: 'REAR', sizes: [new TyreSize(275, 35, 18.0)]),
    );

    expect($verdict->tyreLayout())->toBe('MIXED')
        ->and(eligibilityOver()->permits($verdict, permittedTyre(widthMm: 245, aspect: 40)))->toBe(KomplettradRefusal::StaggeredLayout)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(widthMm: 275, aspect: 35)))->toBe(KomplettradRefusal::StaggeredLayout);
});

it('refuses one all-axle row carrying a FRONT size and a REAR size — rule 3a through the per-size axle', function (): void {
    // The normal shape of a staggered Teilegutachten line: one row, axle ALL, two scoped sizes.
    // Before the §3.3a filter both sizes landed on both axles and the layout read SAME.
    $verdict = liveVerdict(FitmentFixtures::row(sizes: [
        new TyreSize(245, 40, 18.0, axle: 'FRONT'),
        new TyreSize(275, 35, 18.0, axle: 'REAR'),
    ]));

    expect($verdict->front->sizes)->toHaveCount(1)
        ->and($verdict->front->sizes[0]->widthMm)->toBe(245)
        ->and($verdict->front->sizes[0]->axle)->toBe('FRONT')
        ->and($verdict->rear->sizes)->toHaveCount(1)
        ->and($verdict->rear->sizes[0]->widthMm)->toBe(275)
        ->and($verdict->rear->sizes[0]->axle)->toBe('REAR')
        ->and($verdict->tyreLayout())->toBe('MIXED')
        ->and(eligibilityOver()->permits($verdict, permittedTyre(widthMm: 275, aspect: 35)))->toBe(KomplettradRefusal::StaggeredLayout);
});

it('refuses an axle-scoped size even when the two sets are equal — rule 3b with the filter bypassed', function (): void {
    // The document lists the same size explicitly as a FRONT row and a REAR row. The sets are
    // identical, so 3a cannot see it; the axle on the size itself is what 3b reads.
    $sizes = [new TyreSize(245, 45, 18.0, axle: 'FRONT'), new TyreSize(245, 45, 18.0, axle: 'REAR')];
    $verdict = withAxles(
        liveVerdict(FitmentFixtures::row()),
        new AxleRequirement($sizes, 91, 'Y', MinSource::Derived),
        new AxleRequirement($sizes, 92, 'Y', MinSource::Derived),
    );

    expect($verdict->tyreLayout())->toBe('SAME')
        ->and(eligibilityOver()->permits($verdict, permittedTyre()))->toBe(KomplettradRefusal::StaggeredLayout);
});

/*
 * Rules 4 and 5 — nothing listed, nothing derivable.
 */

it('refuses when the axles permit no size at all — rule 4', function (): void {
    $verdict = withAxles(
        liveVerdict(FitmentFixtures::row()),
        new AxleRequirement([], 91, 'Y', MinSource::Derived),
        new AxleRequirement([], 92, 'Y', MinSource::Derived),
    );

    expect(eligibilityOver()->permits($verdict, permittedTyre()))->toBe(KomplettradRefusal::NoPermittedSizes);
});

it('treats a null minimum as unusable, never as no minimum — rule 5', function (): void {
    $live = liveVerdict(FitmentFixtures::row());
    $sizes = [new TyreSize(245, 45, 18.0)];

    $noLoad = withAxles(
        $live,
        new AxleRequirement($sizes, null, 'Y', MinSource::Derived),
        new AxleRequirement($sizes, 92, 'Y', MinSource::Derived),
    );
    $noSpeed = withAxles(
        $live,
        new AxleRequirement($sizes, 91, 'Y', MinSource::Derived),
        new AxleRequirement($sizes, 92, null, MinSource::Derived),
    );

    expect(eligibilityOver()->permits($noLoad, permittedTyre(loadIndex: 120, speedSymbol: '(Y)')))->toBe(KomplettradRefusal::NoUsableMinimum)
        ->and(eligibilityOver()->permits($noSpeed, permittedTyre(loadIndex: 120, speedSymbol: '(Y)')))->toBe(KomplettradRefusal::NoUsableMinimum)
        ->and(eligibilityOver()->minimumSentenceDe($noLoad))->toBeNull()
        ->and(eligibilityOver()->minimumSentenceDe($noSpeed))->toBeNull();
});

it('refuses when an axle carries a speed symbol the table does not know', function (): void {
    // Non-null, so rule 5 passes; unrankable, so nothing can be compared against it.
    $verdict = withAxles(
        liveVerdict(FitmentFixtures::row()),
        new AxleRequirement([new TyreSize(245, 45, 18.0)], 91, 'ZR', MinSource::Derived),
        new AxleRequirement([new TyreSize(245, 45, 18.0)], 92, 'Y', MinSource::Derived),
    );

    $offer = eligibilityOver(permittedTyre(speedSymbol: '(Y)'))->offerFor($verdict);

    expect(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: '(Y)')))->toBe(KomplettradRefusal::NoUsableMinimum)
        ->and(eligibilityOver()->minimumSentenceDe($verdict))->toBeNull()
        ->and($offer->tyres)->toBe([])
        ->and($offer->refusal)->toBe(KomplettradRefusal::NoTyreAvailable)
        ->and($offer->minimumSentenceDe)->toBeNull();
});

/*
 * Rules 6 and 7 — the tyre against the wheel and the listed sizes.
 */

it('refuses a tyre in the wrong diameter — rule 6', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());

    expect(eligibilityOver()->permits($verdict, permittedTyre(aspect: 40, diameterIn: 17.0)))->toBe(KomplettradRefusal::DiameterMismatch)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(diameterIn: 19.0)))->toBe(KomplettradRefusal::DiameterMismatch);
});

it('refuses a size the document does not list — rule 7', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());

    expect(eligibilityOver()->permits($verdict, permittedTyre(widthMm: 255, aspect: 40)))->toBe(KomplettradRefusal::SizeNotPermitted);
});

it('checks the size on both axles, so a size listed on the front only is refused', function (): void {
    $verdict = liveVerdict(
        FitmentFixtures::row(id: 1, axle: 'FRONT', sizes: [new TyreSize(245, 45, 18.0), new TyreSize(255, 40, 18.0)]),
        FitmentFixtures::row(id: 2, axle: 'REAR', sizes: [new TyreSize(245, 45, 18.0)]),
    );

    // The rear does not list 255/40; the sets therefore differ, and the staggered guard is the
    // arm that fires — either way, the tyre is never offered as a four-wheel set.
    expect(eligibilityOver()->permits($verdict, permittedTyre(widthMm: 255, aspect: 40)))
        ->not->toBeNull()
        ->toBe(KomplettradRefusal::StaggeredLayout);
});

/*
 * Rule 8 — R-06, the stricter governs, per axle, by rank and never by letter.
 */

it('refuses a tyre below the axle minimum — rule 8', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());

    // Both axles need 93 at 280 km/h: a 92 fails, a 93 passes.
    expect(eligibilityOver()->permits($verdict, permittedTyre(loadIndex: 92)))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(loadIndex: 93)))->toBeNull()
        ->and(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: 'W')))->toBe(KomplettradRefusal::BelowMinimum);
});

it('ranks speed symbols and never compares them as letters', function (): void {
    // H (210 km/h) sits between U (200) and V (240); alphabetically it sorts before both.
    $sizes = [new TyreSize(245, 45, 18.0)];
    $verdict = withAxles(
        liveVerdict(FitmentFixtures::row()),
        new AxleRequirement($sizes, 91, 'H', MinSource::Derived),
        new AxleRequirement($sizes, 92, 'H', MinSource::Derived),
    );

    expect(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: 'U')))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: 'V')))->toBeNull()
        // And (Y) outranks Y although it sorts before it as a string.
        ->and(eligibilityOver()->permits(liveVerdict(FitmentFixtures::row()), permittedTyre(speedSymbol: '(Y)')))->toBeNull();
});

it('lets a document load index above the derived one govern, and credits the document for that half only', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row(sizes: [new TyreSize(245, 45, 18.0, documentMinLoadIndex: 95)]));

    expect($verdict->front->minLoadIndex)->toBe(95)
        ->and($verdict->front->minLoadSource)->toBe(MinSource::Document)
        ->and($verdict->front->minSpeedSource)->toBe(MinSource::Derived)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(loadIndex: 94)))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(loadIndex: 95)))->toBeNull()
        ->and(eligibilityOver()->minimumSentenceDe($verdict))->toBe(
            'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. '
            .'Der Tragfähigkeitsindex steht so im Gutachten, der Geschwindigkeitsindex ergibt sich aus den Daten deines Fahrzeugs.'
        );
});

it('lets a document speed symbol above the derived one govern, and credits the document for that half only', function (): void {
    // The BMW 3er, 225 km/h (V derived); the document asks W. At 225 km/h a W tyre loses nothing, so the
    // load index is half the axle load: 450 kg → 80, 510 kg → 85.
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(vehicleId: 3, sizes: [new TyreSize(245, 45, 18.0, documentMinSpeedSymbol: 'W')])])
        ->resolve(3, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->front->minSpeedSymbol)->toBe('W')
        ->and($verdict->front->minSpeedSource)->toBe(MinSource::Document)
        ->and($verdict->front->minLoadSource)->toBe(MinSource::Derived)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: 'V')))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: 'W')))->toBeNull()
        ->and(eligibilityOver()->minimumSentenceDe($verdict))->toBe(
            'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 85 und Geschwindigkeitsindex W. '
            .'Der Tragfähigkeitsindex ergibt sich aus den Daten deines Fahrzeugs, der Geschwindigkeitsindex steht so im Gutachten.'
        );
});

it('states no minimum for a symbol the derating table does not list, and offers no tyre on it', function (): void {
    // The RS 4 at 280 km/h under a document asking (Y): its table (ABE 55255, p. 6) has columns V, W and Y
    // only — the document does not say what a (Y) tyre carries there, so the tyre half is UNKNOWN.
    $verdict = liveVerdict(FitmentFixtures::row(sizes: [new TyreSize(245, 45, 18.0, documentMinSpeedSymbol: '(Y)')]));

    expect($verdict->front->minSpeedSymbol)->toBe('(Y)')
        ->and($verdict->front->minLoadIndex)->toBeNull()
        ->and($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->status)->toBe(VerdictStatus::Unknown)
        // The wheel is approved; only the tyres are open — never „kein Gutachten“ (R-03 split).
        ->and(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: '(Y)')))->toBe(KomplettradRefusal::TyresUnknown)
        ->and(eligibilityOver()->minimumSentenceDe($verdict))->toBeNull();
});

it('names both halves as documented when both came from the Gutachten', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(vehicleId: 3, sizes: [
        new TyreSize(245, 45, 18.0, documentMinLoadIndex: 95, documentMinSpeedSymbol: 'W'),
    ])])->resolve(3, FitmentFixtures::WHEEL_CONFIG_ID);

    $offer = eligibilityOver(permittedTyre(loadIndex: 95, speedSymbol: 'W'))->offerFor($verdict);

    expect(eligibilityOver()->minimumSentenceDe($verdict))->toBe(
        'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex W. '
        .'Diese Mindestwerte stehen so im Gutachten.'
    )
        ->and($offer->minSource)->toBe(MinSource::Document)
        ->and($offer->tyres)->toHaveCount(1);
});

it('names both halves as derived when the document is silent, using the stricter axle', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());

    // Front and rear 93 (the speed derating at 280 km/h): what four identical tyres must meet.
    expect(eligibilityOver()->minimumSentenceDe($verdict))->toBe(
        'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 93 und Geschwindigkeitsindex Y. '
        .'Diese Mindestwerte ergeben sich aus Achslast und Höchstgeschwindigkeit deines Fahrzeugs.'
    )
        ->and(eligibilityOver()->offerFor($verdict)->minSource)->toBe(MinSource::Derived);
});

it('does not let a document minimum below the derived one relax anything', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row(sizes: [
        new TyreSize(245, 45, 18.0, documentMinLoadIndex: 80, documentMinSpeedSymbol: 'V'),
    ]));

    expect($verdict->rear->minLoadIndex)->toBe(93)
        ->and($verdict->rear->minSpeedSymbol)->toBe('Y')
        ->and(eligibilityOver()->permits($verdict, permittedTyre(loadIndex: 92)))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: 'V')))->toBe(KomplettradRefusal::BelowMinimum)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(loadIndex: 93, speedSymbol: 'Y')))->toBeNull()
        ->and(eligibilityOver()->minimumSentenceDe($verdict))->toContain('Tragfähigkeitsindex 93 und Geschwindigkeitsindex Y.')
        ->and(eligibilityOver()->minimumSentenceDe($verdict))->toContain('ergeben sich aus Achslast');
});

it('ignores a document symbol it does not recognise, but refuses a tyre symbol it does not recognise', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row(sizes: [new TyreSize(245, 45, 18.0, documentMinSpeedSymbol: 'ZR')]));

    // D-027: the unknown document symbol is ignored and the derived Y still stands beneath it.
    expect($verdict->front->minSpeedSymbol)->toBe('Y')
        ->and(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: 'Y')))->toBeNull()
        // A tyre we cannot rank is not "fast enough".
        ->and(eligibilityOver()->permits($verdict, permittedTyre(loadIndex: 120, speedSymbol: 'ZR')))->toBe(KomplettradRefusal::BelowMinimum);
});

it('binds the axle to the strictest symbol any listed size prints, never to the last one printed', function (): void {
    // The axle once took the LAST size's symbol, so 255/40's V overwrote 245/45's (Y) and the derived Y
    // governed an axle whose document asks (Y) of one of its sizes (Block D: engine 1.1.0). The axle now binds
    // to (Y): what the customer is told is never below what the document asks of a size they may buy. This
    // document's table (ABE 55255's) prints no (Y) column, so no load at that speed can be read from it: the
    // tyres are open, and no Komplettrad is put together on a guess.
    $verdict = liveVerdict(FitmentFixtures::row(sizes: [
        new TyreSize(245, 45, 18.0, documentMinSpeedSymbol: '(Y)'),
        new TyreSize(255, 40, 18.0, documentMinSpeedSymbol: 'V'),
    ]));

    expect($verdict->front->minSpeedSymbol)->toBe('(Y)')
        ->and($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(speedSymbol: '(Y)')))->toBe(KomplettradRefusal::TyresUnknown)
        ->and(eligibilityOver()->permits($verdict, permittedTyre(widthMm: 255, aspect: 40, speedSymbol: 'Y')))->toBe(KomplettradRefusal::TyresUnknown);
});

it('takes the stricter axle for each half of the minimum, with the source that governed that half', function (): void {
    $live = liveVerdict(FitmentFixtures::row());
    $sizes = [new TyreSize(245, 45, 18.0)];

    // Load: front 95 from the document. Speed: rear (Y) from the document.
    $split = withAxles(
        $live,
        new AxleRequirement($sizes, 95, 'Y', MinSource::Document, MinSource::Document, MinSource::Derived),
        new AxleRequirement($sizes, 92, '(Y)', MinSource::Document, MinSource::Derived, MinSource::Document),
    );

    // A tie on the number where one axle wrote it down: the document is credited, because the
    // statement "steht so im Gutachten" is true of that number.
    $tie = withAxles(
        $live,
        new AxleRequirement($sizes, 95, 'Y', MinSource::Document, MinSource::Document, MinSource::Derived),
        new AxleRequirement($sizes, 95, 'Y', MinSource::Derived),
    );

    expect(eligibilityOver()->minimumSentenceDe($split))->toBe(
        'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex (Y). '
        .'Diese Mindestwerte stehen so im Gutachten.'
    )
        ->and(eligibilityOver()->minimumSentenceDe($tie))->toBe(
            'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. '
            .'Der Tragfähigkeitsindex steht so im Gutachten, der Geschwindigkeitsindex ergibt sich aus den Daten deines Fahrzeugs.'
        );
});

it('credits the papers for the half they set, and the other half to its own source (D-242)', function (): void {
    $live = liveVerdict(FitmentFixtures::row());
    $sizes = [new TyreSize(245, 45, 18.0)];

    // Both halves from 15.1/15.2: the front's 95 is the stricter index; on the tied Y the papers outrank the computation.
    $both = withAxles(
        $live,
        new AxleRequirement($sizes, 95, 'Y', MinSource::Derived, MinSource::Papers, MinSource::Papers),
        new AxleRequirement($sizes, 93, 'Y', MinSource::Derived),
    );

    $loadOnly = withAxles(
        $live,
        new AxleRequirement($sizes, 95, 'Y', MinSource::Derived, MinSource::Papers, MinSource::Derived),
        new AxleRequirement($sizes, 93, 'Y', MinSource::Derived),
    );

    // The index tied and written in the Gutachten; the symbol (Y) from the papers.
    $speedOnly = withAxles(
        $live,
        new AxleRequirement($sizes, 93, '(Y)', MinSource::Document, MinSource::Document, MinSource::Papers),
        new AxleRequirement($sizes, 93, 'Y', MinSource::Derived),
    );

    expect(eligibilityOver()->minimumSentenceDe($both))->toBe(
        'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. '
        .'Diese Mindestwerte stehen nach deinen Angaben so in deinen Fahrzeugpapieren (Felder 15.1 und 15.2).'
    )
        ->and(eligibilityOver()->minimumSentenceDe($loadOnly))->toBe(
            'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y. '
            .'Der Tragfähigkeitsindex steht nach deinen Angaben so in deinen Fahrzeugpapieren (Felder 15.1 und 15.2), der Geschwindigkeitsindex ergibt sich aus den Daten deines Fahrzeugs.'
        )
        ->and(eligibilityOver()->minimumSentenceDe($speedOnly))->toBe(
            'Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex 93 und Geschwindigkeitsindex (Y). '
            .'Der Tragfähigkeitsindex steht so im Gutachten, der Geschwindigkeitsindex steht nach deinen Angaben so in deinen Fahrzeugpapieren (Felder 15.1 und 15.2).'
        )
        // A tyre below the papers' floor is refused like any other below the minimum.
        ->and(eligibilityOver()->permits($both, permittedTyre(loadIndex: 94)))->toBe(KomplettradRefusal::BelowMinimum);
});

it('returns no minimum sentence for a verdict that has none to state', function (): void {
    expect(eligibilityOver()->minimumSentenceDe(liveVerdict()))->toBeNull();
});

/*
 * Rule 9 — sold by the shop now: available, never a count (D-301), its EU label on record (D-303).
 */

it('refuses a tyre the shop does not sell now, whatever the quantity — rule 9', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());
    $notSold = permittedTyre(sellable: false);

    expect(eligibilityOver()->permits($verdict, $notSold, 4))->toBe(KomplettradRefusal::OutOfStock)
        ->and(eligibilityOver()->permits($verdict, $notSold))->toBe(KomplettradRefusal::OutOfStock)
        // Never a count: any number of a tyre the shop sells passes rule 9.
        ->and(eligibilityOver()->permits($verdict, permittedTyre(), 40))->toBeNull()
        ->and(eligibilityOver()->permits($verdict, permittedTyre()))->toBeNull();
});

/*
 * The offer — every permitted tyre, cheapest first, or the one sentence saying why there is none.
 */

it('offers every permitted tyre cheapest first, with the minimum sentence', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());

    $offer = eligibilityOver(
        permittedTyre(id: 1, priceCents: 20_000),
        permittedTyre(id: 2, priceCents: 15_000),
        permittedTyre(id: 3, priceCents: 15_000),
        permittedTyre(id: 4, widthMm: 255, aspect: 40),      // not listed
        permittedTyre(id: 5, loadIndex: 90),                  // below the minimum
        permittedTyre(id: 6, priceCents: 9_000, sellable: false), // cheapest, but not sold now
    )->offerFor($verdict);

    expect(array_map(static fn (TyreRecord $t): int => $t->id, $offer->tyres))->toBe([2, 3, 1])
        ->and($offer->refusal)->toBeNull()
        ->and($offer->minimumSentenceDe)->toContain('Tragfähigkeitsindex 93 und Geschwindigkeitsindex Y')
        ->and($offer->minSource)->toBe(MinSource::Derived);
});

it('lists what the shop does not sell now only when asked to', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());
    $eligibility = eligibilityOver(
        permittedTyre(id: 1, priceCents: 20_000),
        permittedTyre(id: 2, priceCents: 9_000, sellable: false),
    );

    expect(array_map(static fn (TyreRecord $t): int => $t->id, $eligibility->offerFor($verdict)->tyres))->toBe([1])
        ->and(array_map(static fn (TyreRecord $t): int => $t->id, $eligibility->offerFor($verdict, sellableOnly: false)->tyres))->toBe([2, 1]);
});

it('says so when nothing in the catalogue fits, and still states the minimum', function (): void {
    $verdict = liveVerdict(FitmentFixtures::row());

    foreach ([
        eligibilityOver(),
        eligibilityOver(permittedTyre(widthMm: 255, aspect: 40)),
        eligibilityOver(permittedTyre(loadIndex: 90)),
        eligibilityOver(permittedTyre(sellable: false)),
    ] as $eligibility) {
        $offer = $eligibility->offerFor($verdict);

        expect($offer->tyres)->toBe([])
            ->and($offer->refusal)->toBe(KomplettradRefusal::NoTyreAvailable)
            ->and($offer->minimumSentenceDe)->toContain('Tragfähigkeitsindex 93');
    }
});

it('returns an empty, refused offer for a verdict the rules refuse, with no minimum', function (): void {
    $offer = eligibilityOver(permittedTyre())->offerFor(liveVerdict(FitmentFixtures::row(conditions: [tyreBrandLimit()])));

    expect($offer->tyres)->toBe([])
        ->and($offer->refusal)->toBe(KomplettradRefusal::TyreChoiceRestricted)
        ->and($offer->minimumSentenceDe)->toBeNull()
        ->and($offer->minSource)->toBe(MinSource::Derived);
});
