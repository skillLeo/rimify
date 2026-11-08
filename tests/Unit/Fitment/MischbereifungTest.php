<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Tyres\TyrePairingTable;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\Severity;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Support\GermanFormat;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryTyreCatalogue;
use Tests\Support\Fitment\Rebuild;

/*
 * #20 Mischbereifung, through the document (D-105): ABE 55255's V19 on page 12 lists 27 front/rear pairings; a pair is
 * offered only where that table lists it, front first, and the car's row lists both sizes — each axle measured against
 * its own load. Read from the transcription the seeder loads (docs/gutachten/abe-55255.json), never retyped.
 */

function mixedV19Text(): string
{
    /** @var array{conditions: list<array{code: string, text_de: string}>} $document */
    $document = json_decode((string) file_get_contents(__DIR__.'/../../../docs/gutachten/abe-55255.json'), true, flags: JSON_THROW_ON_ERROR);

    foreach ($document['conditions'] as $condition) {
        if ($condition['code'] === 'V19') {
            return $condition['text_de'];
        }
    }

    throw new RuntimeException('V19 is not in the transcription.');
}

function mixedV19(?string $text = null): Condition
{
    return Condition::ofKind('V19', ConditionKind::ReifenKombination, $text ?? mixedV19Text(), sourcePage: 12);
}

/** A load-index limit as ABE 55255 prints them: T95 → load index 95 up to the axle load it states. */
function mixedLimit(string $code, int $kg): Condition
{
    return Condition::ofKind($code, ConditionKind::ReifenTragfaehigkeit, "Reifen mit Tragfähigkeitsindex {$code} bis {$kg} kg Achslast.", maxAxleLoadKg: $kg);
}

/**
 * The BMW X3 X83's 19″ row, on the fixture RS 4's figures (1.210 kg front, 1.235 kg rear, 280 km/h: 93 Y on both
 * axles): 235/45, 245/40 and 255/40 R19, both axles.
 *
 * @param  list<Condition>  $conditions
 * @param  list<TyreSize>|null  $sizes
 */
function mixedVerdict(array $conditions = [], ?array $sizes = null, int $vehicleId = 1): FitmentVerdict
{
    $wheel = new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 10, wheelFinishId: 20, diameterIn: 19.0, widthIn: 8.5, etMm: 35,
        boltHoles: 5, boltCircleMm: 120.0, centreBoreMm: 72.6, priceCents: 22_900, stockQty: 12, sku: 'RMF-000884',
        modelName: 'Fünfspeiche F-01', brandName: 'Demo', finishNameDe: 'Graphite matt',
    );

    $row = FitmentFixtures::row(
        vehicleId: $vehicleId,
        sizes: $sizes ?? [new TyreSize(235, 45, 19.0), new TyreSize(245, 40, 19.0), new TyreSize(255, 40, 19.0)],
        conditions: $conditions === [] ? [mixedV19()] : $conditions,
    );

    return FitmentFixtures::resolver([], new InMemoryFitmentRepository([$row], [$wheel]))->resolve($vehicleId, FitmentFixtures::WHEEL_CONFIG_ID);
}

function mixedTyre(int $id, int $width, int $aspect, int $loadIndex, string $brand = 'Demo', string $name = 'Sport', bool $sellable = true, int $price = 21_900): TyreRecord
{
    return new TyreRecord(
        id: $id, widthMm: $width, aspect: $aspect, diameterIn: 19.0, loadIndex: $loadIndex, speedSymbol: 'Y',
        speedRank: FitmentFixtures::tables()->speedSymbol('Y')?->rank ?? 0, priceCents: $price, sellable: $sellable,
        brandName: $brand, name: $name, season: 'sommer',
    );
}

function mixedEligibility(TyreRecord ...$tyres): TyreEligibility
{
    return new TyreEligibility(new InMemoryTyreCatalogue(array_values($tyres)), new SpeedSymbolDeriver(FitmentFixtures::tables()));
}

it('reads V19 as the document prints it: 27 entries, 52 pairs, front first, and the sentence after the table', function (): void {
    $table = TyrePairingTable::parse(mixedV19Text());
    $keys = array_map(static fn ($p): string => $p->key(), $table->pairs);

    expect($table->isRead())->toBeTrue()
        ->and($table->pairs)->toHaveCount(52)
        ->and(max(array_map(static fn ($p): int => $p->number, $table->pairs)))->toBe(27)
        // Nr. 8: 235/45R19 – 255/40R19, 265/40R19
        ->and($table->find(new TyreSize(235, 45, 19.0), new TyreSize(255, 40, 19.0))?->number)->toBe(8)
        ->and($keys)->toContain('235/45/19|265/40/19', '275/30/19|315/25/19', '215/35/19|245/30/19')
        // Plausible, and not in the table: never offered.
        ->and($table->find(new TyreSize(245, 40, 19.0), new TyreSize(255, 40, 19.0)))->toBeNull()
        // The document's order only — 255/40 at the front with 235/45 at the rear is not Nr. 8.
        ->and($table->find(new TyreSize(255, 40, 19.0), new TyreSize(235, 45, 19.0)))->toBeNull()
        ->and($table->rulesDe)->toStartWith('Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig')
        ->and($table->rulesDe)->toEndWith('mitzuführen.');
});

it('reads no table at all where any part of it cannot be read strictly — never half a table', function (string $mangled): void {
    expect(TyrePairingTable::parse($mangled)->pairs)->toBe([]);
})->with([
    'no axle order printed' => fn (): string => str_replace('(Vorderachse – Hinterachse) ', '', mixedV19Text()),
    'the axle order reversed' => fn (): string => str_replace('(Vorderachse – Hinterachse)', '(Hinterachse – Vorderachse)', mixedV19Text()),
    'a size cut short' => fn (): string => str_replace('Nr. 3: 225/40R19 – 245/35R19', 'Nr. 3: 225/40R19 – 245/35R1', mixedV19Text()),
    'an entry missing' => fn (): string => str_replace('Nr. 5: 225/55R19 – 275/45R19; ', '', mixedV19Text()),
    'a word inside an entry' => fn (): string => str_replace('Nr. 8: 235/45R19 – 255/40R19, 265/40R19', 'Nr. 8: 235/45R19 – 255/40R19 oder 265/40R19', mixedV19Text()),
    'not a table at all' => fn (): string => 'Reifen gleicher Größe auf beiden Achsen.',
]);

it('offers the pair V19 lists for the sizes the car’s row names — Nr. 8, 235/45 front with 255/40 rear — and no other', function (): void {
    $verdict = mixedVerdict();
    $offer = mixedEligibility(
        mixedTyre(11, 235, 45, 95),
        mixedTyre(12, 255, 40, 99),
        mixedTyre(13, 245, 40, 97),
        mixedTyre(14, 255, 40, 99, brand: 'Andere', name: 'Grip'),
    )->mixedOfferFor($verdict);

    expect($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->tyre?->figuresPermitted)->toBeTrue()
        ->and($offer->refusal)->toBeNull()
        ->and($offer->hasTable)->toBeTrue()
        ->and($offer->code)->toBe('V19')
        ->and($offer->sourcePage)->toBe(12)
        ->and($offer->pairs)->toHaveCount(1)
        ->and($offer->pairs[0]->pairing->number)->toBe(8)
        ->and($offer->pairs[0]->front->labelDe())->toBe('235/45 R19')
        ->and($offer->pairs[0]->rear->labelDe())->toBe('255/40 R19')
        // One maker on every tyre, as V19's own sentence asks (D-336): the other maker's 255/40 is not paired.
        ->and(array_map(static fn (array $set): array => [$set['front']->id, $set['rear']->id], $offer->pairs[0]->sets))->toBe([[11, 12]]);
});

it('refuses a plausible but unlisted pair, a pair the wrong way round and two makers at the basket gate (R-11)', function (): void {
    $verdict = mixedVerdict();
    $eligibility = mixedEligibility();

    expect($eligibility->permitsMixed($verdict, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99)))->toBeNull()
        ->and($eligibility->permitsMixed($verdict, mixedTyre(13, 245, 40, 97), mixedTyre(12, 255, 40, 99)))->toBe(KomplettradRefusal::MixedPairNotListed)
        ->and($eligibility->permitsMixed($verdict, mixedTyre(12, 255, 40, 99), mixedTyre(11, 235, 45, 95)))->toBe(KomplettradRefusal::MixedPairNotListed)
        ->and($eligibility->permitsMixed($verdict, mixedTyre(11, 235, 45, 95), mixedTyre(14, 255, 40, 99, brand: 'Andere', name: 'Grip')))->toBe(KomplettradRefusal::MixedNotOneMaker)
        ->and($eligibility->permitsMixed($verdict, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99, sellable: false)))->toBe(KomplettradRefusal::OutOfStock);
});

it('measures each axle against its own load and names the axle that asks for more', function (): void {
    // 235/45 carries its own T95 (95 up to 1.380 kg) and T99; 245/40 a T91 that reaches 1.300 kg. Merged per axle the
    // front would read 93 — but a 235/45 on a 1.210 kg front axle needs 95, by its own codes.
    $verdict = mixedVerdict(sizes: [
        new TyreSize(235, 45, 19.0, conditions: [mixedLimit('T95', 1380), mixedLimit('T99', 1550)]),
        new TyreSize(245, 40, 19.0, conditions: [mixedLimit('T91', 1300)]),
        new TyreSize(255, 40, 19.0),
    ]);
    $eligibility = mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99));
    $pair = $eligibility->mixedOfferFor($verdict)->pairs[0] ?? null;

    expect($verdict->front->minLoadIndex)->toBe(93)
        ->and($pair?->frontMinimum)->toBe(['loadIndex' => 95, 'speedSymbol' => 'Y', 'axleLoadKg' => 1210])
        ->and($pair?->rearMinimum)->toBe(['loadIndex' => 93, 'speedSymbol' => 'Y', 'axleLoadKg' => 1235])
        ->and($pair?->bindingAxle())->toBe('FRONT')
        ->and($pair?->minimumSentenceDe())->toBe(sprintf(
            'Bei Mischbereifung prüfen wir jede Achse mit ihrer eigenen Achslast: vorne (%s) mindestens Tragfähigkeitsindex 95 und Geschwindigkeitsindex Y, hinten (%s) mindestens Tragfähigkeitsindex 93 und Geschwindigkeitsindex Y. Mehr verlangt die Vorderachse.',
            GermanFormat::kilograms(1210),
            GermanFormat::kilograms(1235),
        ))
        // A 94 meets the merged axle, not its size's own limit.
        ->and($eligibility->permitsMixed($verdict, mixedTyre(15, 235, 45, 94), mixedTyre(12, 255, 40, 99)))->toBe(KomplettradRefusal::BelowMinimum)
        ->and($eligibility->permitsMixed($verdict, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99)))->toBeNull();
});

it('never offers Mischbereifung without the car’s axle loads and top speed — R-03', function (): void {
    $verdict = mixedVerdict(vehicleId: 8);
    $offer = mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99))->mixedOfferFor($verdict);

    // „Noch nicht bestätigt“ until the papers are in (D-286): nothing sells, so — as for every answer that does not —
    // no table is offered yet; the refusal names the papers as the way on.
    expect($verdict->tyre?->figuresPermitted)->toBeFalse()
        ->and($offer->refusal)->toBe(KomplettradRefusal::TyresAwaitPapers)
        ->and($offer->hasTable)->toBeFalse()
        ->and($offer->pairs)->toBe([]);

    // A car with its figures, on the same row, is offered Nr. 8.
    expect(mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99))->mixedOfferFor(mixedVerdict())->pairs)->toHaveCount(1);
});

it('says nothing about Mischbereifung where the document prints no table, and refuses where it prints one it cannot read', function (): void {
    $none = mixedEligibility()->mixedOfferFor(mixedVerdict(conditions: [FitmentFixtures::specificBolts()]));
    $unread = mixedEligibility()->mixedOfferFor(mixedVerdict(conditions: [mixedV19('Nur die im Gutachten genannten Kombinationen.')]));

    expect($none->refusal)->toBe(KomplettradRefusal::NoMixedPairing)
        ->and($none->hasTable)->toBeFalse()
        ->and($unread->refusal)->toBe(KomplettradRefusal::TyreChoiceRestricted)
        ->and($unread->hasTable)->toBeFalse();
});

it('no longer refuses four identical tyres over a table that only speaks of different sizes — and still refuses a rule it cannot read', function (): void {
    $tyre = mixedTyre(11, 235, 45, 95);

    expect(mixedEligibility($tyre)->permits(mixedVerdict(), $tyre, 4))->toBeNull()
        ->and(mixedEligibility($tyre)->permits(mixedVerdict(conditions: [mixedV19(), new Condition(
            code: 'TYRE_BRAND_LIMIT', severity: Severity::Info,
            textDe: 'Nur Reifen der im Gutachten genannten Hersteller zulässig.', affectsTyreChoice: true,
        )]), $tyre))->toBe(KomplettradRefusal::TyreChoiceRestricted)
        // A load-index limit is read only from the car's own figures: without them, nothing is sold against it — the
        // tyres wait for the papers (D-286).
        ->and(mixedEligibility($tyre)->permits(mixedVerdict(sizes: [new TyreSize(235, 45, 19.0, conditions: [mixedLimit('T95', 1380)])], vehicleId: 8), $tyre))
        ->toBe(KomplettradRefusal::TyresAwaitPapers);
});

/* ── The branches each mixed answer takes at its edges (D-433) ───────────────────────────────────────────────────── */

it('drops a listed pair whose rear size its own load-index limit rules out for this car, and then has none to offer', function (): void {
    // 255/40 R19 carries only T98 up to 1.100 kg; the RS 4's rear axle carries 1.235 kg — above it, so Nr. 8 is not a pair
    // it may have. 235/45's own T95 reaches 1.380 kg, so the axle as a whole is settled.
    $verdict = mixedVerdict(sizes: [
        new TyreSize(235, 45, 19.0, conditions: [mixedLimit('T95', 1380)]),
        new TyreSize(245, 40, 19.0),
        new TyreSize(255, 40, 19.0, conditions: [mixedLimit('T98', 1100)]),
    ]);
    $eligibility = mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99));
    $offer = $eligibility->mixedOfferFor($verdict);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Conditional)
        ->and($offer->pairs)->toBe([])
        ->and($offer->refusal)->toBe(KomplettradRefusal::NoMixedPairing)
        ->and($offer->hasTable)->toBeTrue()
        // Since D-434 255/40 leaves both axles — its own limit reaches neither load —, and the verdict says why; at the
        // basket the pair is then not one on record for this car.
        ->and(array_map(static fn (TyreSize $s): string => $s->labelDe(), $verdict->rear->sizes))->toBe(['235/45 R19', '245/40 R19'])
        ->and($eligibility->permitsMixed($verdict, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99)))->toBe(KomplettradRefusal::MixedPairNotListed);

    // An answer frozen before D-434 still holds 255/40 on its rear axle, its T98 beside it: the pair is dropped at the
    // offer and refused at the basket by the size's own limit — the backstop behind the resolver.
    $limited = new TyreSize(255, 40, 19.0, conditions: [mixedLimit('T98', 1100)]);
    $frozen = Rebuild::of($verdict, ['rear' => Rebuild::of($verdict->rear, ['sizes' => [...$verdict->rear->sizes, $limited], 'bySize' => []])]);
    $frozenOffer = $eligibility->mixedOfferFor($frozen);

    expect($frozenOffer->pairs)->toBe([])
        ->and($frozenOffer->refusal)->toBe(KomplettradRefusal::NoMixedPairing)
        ->and($eligibility->permitsMixed($frozen, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99)))->toBe(KomplettradRefusal::AxleLoadAboveLimit);
});

it('holds a load limit printed beside one size to that size alone — the axle’s other sizes stand on their own rules (D-434)', function (): void {
    // Only 255/40 carries a limit, T98 up to 1.100 kg; the RS 4 carries 1.210 kg front and 1.235 kg rear — above it, so the
    // paper gives that size no index for this car and it is not offered. 235/45 and 245/40 carry no limit: their own
    // minimum is the derived 93 Y. Before D-434 the one size's limit left every size on the axle „Noch nicht bestätigt“.
    $verdict = mixedVerdict(sizes: [
        new TyreSize(235, 45, 19.0),
        new TyreSize(245, 40, 19.0),
        new TyreSize(255, 40, 19.0, conditions: [mixedLimit('T98', 1100)]),
    ]);
    $labels = static fn (array $sizes): array => array_map(static fn (TyreSize $s): string => $s->labelDe(), $sizes);
    $lines = implode(' ', $verdict->tyre->lines ?? []);

    expect($verdict->tyre?->status)->not->toBe(VerdictStatus::Unknown)
        ->and($verdict->isSellable())->toBeTrue()
        ->and($labels($verdict->front->sizes))->toBe(['235/45 R19', '245/40 R19'])
        ->and($labels($verdict->rear->sizes))->toBe(['235/45 R19', '245/40 R19'])
        ->and($verdict->front->minLoadIndex)->toBe(93)
        ->and($verdict->rear->minimumFor(new TyreSize(235, 45, 19.0)))->toBe(['loadIndex' => 93, 'speedSymbol' => 'Y'])
        // Said per axle, as what is on record (R-17): the size, the limit's reach and the axle's load.
        ->and($lines)->toContain(sprintf(
            'Für 255/40 R19 sind zu den Auflagen dieses Gutachtens Tragfähigkeitsindizes nur bis %s Achslast hinterlegt; die Hinterachse trägt %s. Diese Größe können wir deshalb nicht bestätigen.',
            GermanFormat::kilograms(1100),
            GermanFormat::kilograms(1235),
        ))
        ->and(mixedEligibility(mixedTyre(11, 235, 45, 93))->permits($verdict, mixedTyre(11, 235, 45, 93), 4))->toBeNull()
        // The limited size itself is still never sold: the paper prints no index for it at this load.
        ->and(mixedEligibility(mixedTyre(12, 255, 40, 99))->permits($verdict, mixedTyre(12, 255, 40, 99), 4))->not->toBeNull();
});

it('still confirms no tyre where every size’s own limits stop below the axle’s load — nothing is left to judge (D-434)', function (): void {
    $verdict = mixedVerdict(sizes: [
        new TyreSize(235, 45, 19.0, conditions: [mixedLimit('T95', 1100)]),
        new TyreSize(255, 40, 19.0, conditions: [mixedLimit('T98', 1100)]),
    ]);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->isSellable())->toBeFalse()
        ->and(implode(' ', $verdict->tyre->lines ?? []))->toContain('Tragfähigkeitsindizes nur bis '.GermanFormat::kilograms(1100).' Achslast hinterlegt');
});

it('still holds every size to a limit printed on the row — that one is the combination’s, not a size’s (D-434)', function (): void {
    $verdict = mixedVerdict(conditions: [mixedV19(), mixedLimit('T98', 1100)]);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->isSellable())->toBeFalse();
});

it('refuses a mixed set whose tyre does not fit the rim’s diameter on its own axle', function (): void {
    // A wheel set whose rear rim is 20″: the 19″ pair is in the table, and its rear tyre still cannot go on that rim.
    $live = mixedVerdict();
    $rim = $live->wheel ?? throw new LogicException;
    $staggered = Rebuild::of($live, ['rearWheel' => Rebuild::of($rim, ['id' => 885, 'diameterIn' => 20.0])]);

    expect(mixedEligibility()->permitsMixed($staggered, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99)))->toBe(KomplettradRefusal::DiameterMismatch)
        ->and(mixedEligibility()->permitsMixed($live, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99)))->toBeNull();
});

it('offers no mixed set over an axle-load note it cannot read as an index — that is a rule for a person, not for the engine', function (): void {
    // A load figure without an index: the RS 4's 1.235 kg rear is above it, so the tyre half stays CONDITIONAL and names the
    // note — and no tyre is sold against a rule the engine does not read (rule 2).
    $note = Condition::ofKind('A12', ConditionKind::ReifenTragfaehigkeit, 'Nur bis zu einer zulässigen Achslast von 1.200 kg.', maxAxleLoadKg: 1200);
    $verdict = mixedVerdict(conditions: [mixedV19(), FitmentFixtures::specificBolts(), $note]);
    $offer = mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99))->mixedOfferFor($verdict);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->tyre?->figuresPermitted)->toBeFalse()
        ->and($offer->refusal)->toBe(KomplettradRefusal::TyreChoiceRestricted)
        ->and($offer->pairs)->toBe([]);
});

it('never offers a mixed set on a sellable answer whose tyres the car’s figures did not settle — a backstop behind R-03', function (): void {
    // No live answer reaches this: without the figures the tyres are „Noch nicht bestätigt“ and rule 1 refuses first. A
    // verdict that says otherwise must still be refused here, and with the reason that names the figures.
    $live = mixedVerdict(conditions: [mixedV19(), mixedLimit('T95', 1380)]);
    $unsettled = Rebuild::of($live, ['tyre' => Rebuild::of($live->tyre, ['figuresPermitted' => false])]);
    $offer = mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99))->mixedOfferFor($unsettled);

    expect($live->isSellable())->toBeTrue()
        ->and($offer->refusal)->toBe(KomplettradRefusal::NoUsableMinimum)
        ->and($offer->pairs)->toBe([]);
});

it('answers four of a kind apart from a printed table: a same-size entry in it is no mixed pair', function (): void {
    $text = str_replace('Nr. 8: 235/45R19 – 255/40R19, 265/40R19', 'Nr. 8: 235/45R19 – 235/45R19, 255/40R19', mixedV19Text());
    $offer = mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99))->mixedOfferFor(mixedVerdict(conditions: [mixedV19($text)]));

    expect(TyrePairingTable::parse($text)->find(new TyreSize(235, 45, 19.0), new TyreSize(235, 45, 19.0)))->not->toBeNull()
        ->and(array_map(static fn ($p): string => $p->pairing->key(), $offer->pairs))->toBe(['235/45/19|255/40/19']);
});

it('finds the pair an offer holds for two sizes, and none for two it does not', function (): void {
    $offer = mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99))->mixedOfferFor(mixedVerdict());

    expect($offer->pairFor(new TyreSize(235, 45, 19.0), new TyreSize(255, 40, 19.0))?->pairing->number)->toBe(8)
        ->and($offer->pairFor(new TyreSize(255, 40, 19.0), new TyreSize(235, 45, 19.0)))->toBeNull();
});

it('says a refusal without a clause of the document as its own sentence', function (): void {
    expect(mixedEligibility()->sentenceFor(mixedVerdict(), KomplettradRefusal::BelowMinimum))->toBe(KomplettradRefusal::BelowMinimum->sentenceDe());
});

it('reads every tyre rule of an answer before it refuses one it cannot — a backstop behind rule 2', function (): void {
    // On a live answer only an axle-load note leaves the figures unsettled, and the note itself ends the reading. A verdict
    // built otherwise is read in full: an axle code and the table pass, a load limit waits for the figures, a condition that
    // is no tyre rule is passed over — and a tyre rule of no kind the engine knows refuses every tyre.
    $live = mixedVerdict(conditions: [
        Condition::ofKind('R02', ConditionKind::ReifenAchse, 'Nur an der Hinterachse zulässig.', axle: 'REAR'),
        mixedV19(),
        mixedLimit('T95', 1380),
        FitmentFixtures::specificBolts(),
        new Condition(code: 'Y01', severity: Severity::Info, textDe: 'Nur Reifen der im Gutachten genannten Hersteller zulässig.', affectsTyreChoice: true),
    ]);
    $unsettled = Rebuild::of($live, ['tyre' => Rebuild::of($live->tyre, ['figuresPermitted' => false])]);

    expect($live->isSellable())->toBeTrue()
        ->and(mixedEligibility(mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99))->mixedOfferFor($unsettled)->refusal)->toBe(KomplettradRefusal::TyreChoiceRestricted);
});
