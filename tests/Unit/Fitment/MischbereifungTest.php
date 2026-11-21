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
        // A load-index limit is said, never computed (D-481): it stops no offer, also without the car's own figures.
        ->and(mixedEligibility($tyre)->permits(mixedVerdict(sizes: [new TyreSize(235, 45, 19.0, conditions: [mixedLimit('T95', 1380)])], vehicleId: 8), $tyre))
        ->toBeNull();
});

/* ── The branches each mixed answer takes at its edges (D-433) ───────────────────────────────────────────────────── */

it('refuses a mixed set whose tyre does not fit the rim’s diameter on its own axle', function (): void {
    // A wheel set whose rear rim is 20″: the 19″ pair is in the table, and its rear tyre still cannot go on that rim.
    $live = mixedVerdict();
    $rim = $live->wheel ?? throw new LogicException;
    $staggered = Rebuild::of($live, ['rearWheel' => Rebuild::of($rim, ['id' => 885, 'diameterIn' => 20.0])]);

    expect(mixedEligibility()->permitsMixed($staggered, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99)))->toBe(KomplettradRefusal::DiameterMismatch)
        ->and(mixedEligibility()->permitsMixed($live, mixedTyre(11, 235, 45, 95), mixedTyre(12, 255, 40, 99)))->toBeNull();
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
