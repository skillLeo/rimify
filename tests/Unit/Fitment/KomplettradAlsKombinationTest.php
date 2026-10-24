<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\MixedPair;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Tyres\TyrePairing;
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

/*
 * F-10, decided by the operator on 24.10.2026 on the client's item 8 (D-335): where the Gutachten lists its tyre
 * combinations, the Komplettrad is the combination — two wheels on the front axle in the size it names there, two on
 * the rear in its size — and never four of one size. Each axle is answered against its own load (8.1 front, 8.2 rear)
 * and the top speed (R-03), the set is the weaker axle, a size the document gives one axle never stands on the other, and
 * an axle without a tyre the shop sells leaves its combination without a set: nothing fills the gap.
 *
 * BBS's shape (Anlage BMW15) on the fixture RS 4 — 1.210 kg front, 1.235 kg rear, 280 km/h: 93 Y on both axles —: Nr. 1
 * the same size on both axles, Nr. 2 and Nr. 3 a wider rear the row gives the rear axle alone, and 245/40 for the front
 * alone. That axle scope is what kept F-10's Gutachten from offering any Komplettrad at all.
 */

/** @param list<array{0: int, 1: array{int, int}, 2: array{int, int}}> $entries number, front [width, aspect], rear — all 19″, each its row 700 + number */
function alsKombiList(array $entries): TyrePairingTable
{
    return TyrePairingTable::recorded(array_map(
        static fn (array $e): TyrePairing => new TyrePairing($e[0], new TyreSize($e[1][0], $e[1][1], 19.0), new TyreSize($e[2][0], $e[2][1], 19.0), 700 + $e[0]),
        $entries,
    ), 5);
}

/** Nr. 1: 235/45 on both axles; Nr. 2: 235/45 front with 255/40 rear; Nr. 3: 245/40 front with 255/40 rear. */
function alsKombiBbs(): TyrePairingTable
{
    return alsKombiList([[1, [235, 45], [235, 45]], [2, [235, 45], [255, 40]], [3, [245, 40], [255, 40]]]);
}

/** An Auflage the document hangs off one size: ABE 55255's A10 and A12, the snow chains (D-199). */
function alsKombiChains(string $code, string $text): Condition
{
    return Condition::ofKind($code, ConditionKind::Hinweis, $text, sourcePage: 7);
}

/**
 * The row: 235/45 on both axles, 245/40 for the front alone, 255/40 for the rear alone.
 *
 * @param  list<Condition>  $conditions  the row's own
 */
function alsKombiVerdict(TyrePairingTable $list, array $conditions = []): FitmentVerdict
{
    $base = FitmentFixtures::document();
    $document = new DocumentRecord(
        id: $base->id, kind: $base->kind, number: $base->number, revision: $base->revision, issuedOn: $base->issuedOn,
        pdfKey: $base->pdfKey, pdfSha256: $base->pdfSha256, sourcePage: $base->sourcePage, speedDerating: $base->speedDerating,
        completeness: $base->completeness, tyreCombinations: $list,
    );
    $wheel = new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 10, wheelFinishId: 20, diameterIn: 19.0, widthIn: 8.5, etMm: 35,
        boltHoles: 5, boltCircleMm: 120.0, centreBoreMm: 72.6, priceCents: 22_900, stockQty: 12, sku: 'RMF-000884',
        modelName: 'CH-R', brandName: 'BBS', finishNameDe: 'Schwarz matt',
    );
    $row = FitmentFixtures::row(
        sizes: [
            new TyreSize(235, 45, 19.0, conditions: [alsKombiChains('A10', 'Nur feingliedrige Schneeketten an der Hinterachse zulässig.')]),
            new TyreSize(245, 40, 19.0, axle: 'FRONT'),
            new TyreSize(255, 40, 19.0, axle: 'REAR', conditions: [alsKombiChains('A12', 'Die Verwendung von Schneeketten ist nicht zulässig.')]),
        ],
        conditions: $conditions,
        document: $document,
    );

    return FitmentFixtures::resolver([], new InMemoryFitmentRepository([$row], [$wheel]))->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
}

function alsKombiTyre(int $id, int $width, int $aspect, int $loadIndex, bool $sellable = true): TyreRecord
{
    return new TyreRecord(
        id: $id, widthMm: $width, aspect: $aspect, diameterIn: 19.0, loadIndex: $loadIndex, speedSymbol: 'Y',
        speedRank: FitmentFixtures::tables()->speedSymbol('Y')?->rank ?? 0, priceCents: 21_900, sellable: $sellable,
        brandName: 'Demo', name: 'Sport', season: 'sommer',
    );
}

function alsKombiEngine(TyreRecord ...$tyres): TyreEligibility
{
    return new TyreEligibility(new InMemoryTyreCatalogue(array_values($tyres)), new SpeedSymbolDeriver(FitmentFixtures::tables()));
}

/** @return array<int, MixedPair> the offer's combinations by their number */
function alsKombiPairs(TyreEligibility $engine, FitmentVerdict $verdict): array
{
    $pairs = [];

    foreach ($engine->mixedOfferFor($verdict)->pairs as $pair) {
        $pairs[$pair->pairing->number] = $pair;
    }

    return $pairs;
}

/** @param list<array{front: TyreRecord, rear: TyreRecord}> $sets */
function alsKombiSets(array $sets): array
{
    return array_map(static fn (array $set): array => [$set['front']->id, $set['rear']->id], $sets);
}

it('offers the combination with one size on both axles as that combination, 2 + 2 — never as four of one size @admin-208', function (): void {
    $t235 = alsKombiTyre(11, 235, 45, 95);
    $engine = alsKombiEngine($t235);
    $verdict = alsKombiVerdict(alsKombiBbs());
    $offer = $engine->mixedOfferFor($verdict);
    $pair = alsKombiPairs($engine, $verdict)[1] ?? null;

    expect($verdict->isSellable())->toBeTrue()
        // F-10: before the decision, rule 3b refused every Komplettrad over the 255/40 the row gives the rear axle alone.
        ->and($engine->offerFor($verdict)->refusal)->toBe(KomplettradRefusal::AsCombination)
        ->and($engine->permits($verdict, $t235, 4))->toBe(KomplettradRefusal::AsCombination)
        ->and([$offer->refusal, $offer->hasTable, $offer->listed])->toBe([null, true, true])
        ->and([$pair?->front->labelDe(), $pair?->rear->labelDe(), $pair?->pairing->id])->toBe(['235/45 R19', '235/45 R19', 701])
        // One tyre on both axles, two of it on each.
        ->and(alsKombiSets($pair->sets ?? []))->toBe([[11, 11]])
        ->and($pair?->missing)->toBe([])
        ->and($pair?->minimumSentenceDe())->toBe('Wir prüfen jede Achse mit ihrer eigenen Achslast. Vorderachse mit 1.210'.GermanFormat::NBSP.'kg: mindestens Tragfähigkeitsindex 93, Geschwindigkeitsindex Y; Hinterachse mit 1.235'.GermanFormat::NBSP.'kg: mindestens Tragfähigkeitsindex 93, Geschwindigkeitsindex Y.')
        ->and($engine->permitsMixed($verdict, $t235, $t235))->toBeNull();

    // Each axle against its own load — 8.1 at the front, 8.2 at the rear — and the top speed: 93 Y on both at 280 km/h.
    $answer = $engine->combinationVerdict($verdict, $t235, $t235);

    expect($answer?->status())->toBe(VerdictStatus::Permitted)
        ->and([$answer?->front->axle, $answer?->front->minimum, $answer?->rear->axle, $answer?->rear->minimum])->toBe([
            'FRONT', ['loadIndex' => 93, 'speedSymbol' => 'Y', 'axleLoadKg' => 1210],
            'REAR', ['loadIndex' => 93, 'speedSymbol' => 'Y', 'axleLoadKg' => 1235],
        ])
        ->and($answer?->toArray())->toMatchArray(['id' => 701, 'number' => 1, 'sourcePage' => 5, 'status' => 'PERMITTED'])
        ->and($answer?->toArray()['front']['tyre'])->toMatchArray(['id' => 11, 'label' => '235/45 R19 95Y'])
        ->and($answer?->toArray()['rear']['tyre'])->toMatchArray(['id' => 11, 'label' => '235/45 R19 95Y']);
});

it('offers the combinations with a wider rear as 2 + 2 in the sizes they name — a size the document gives one axle never as four, never on the other axle @admin-208', function (): void {
    $t235 = alsKombiTyre(11, 235, 45, 95);
    $t245 = alsKombiTyre(13, 245, 40, 97);
    $t255 = alsKombiTyre(12, 255, 40, 99);
    $engine = alsKombiEngine($t235, $t245, $t255);
    // Nr. 4 names the rear-only 255/40 on both axles, Nr. 5 puts it on the front: no set this car may have.
    $verdict = alsKombiVerdict(alsKombiList([[1, [235, 45], [235, 45]], [2, [235, 45], [255, 40]], [3, [245, 40], [255, 40]], [4, [255, 40], [255, 40]], [5, [255, 40], [235, 45]]]));
    $pairs = alsKombiPairs($engine, $verdict);

    expect(array_keys($pairs))->toBe([1, 2, 3])
        ->and(array_map(static fn (MixedPair $p): array => [$p->front->labelDe(), $p->rear->labelDe()], $pairs))->toBe([
            1 => ['235/45 R19', '235/45 R19'],
            2 => ['235/45 R19', '255/40 R19'],
            3 => ['245/40 R19', '255/40 R19'],
        ])
        ->and(alsKombiSets($pairs[2]->sets))->toBe([[11, 12]])
        ->and(alsKombiSets($pairs[3]->sets))->toBe([[13, 12]])
        // Never four of the axle-limited size, never on the other axle — at the basket's gate as on the page (R-11).
        ->and($engine->permits($verdict, $t255, 4))->toBe(KomplettradRefusal::AsCombination)
        ->and($engine->permitsMixed($verdict, $t255, $t255))->toBe(KomplettradRefusal::MixedPairNotListed)
        ->and($engine->permitsMixed($verdict, $t255, $t235))->toBe(KomplettradRefusal::MixedPairNotListed)
        ->and($engine->permitsMixed($verdict, $t245, $t235))->toBe(KomplettradRefusal::MixedPairNotListed)
        ->and($engine->combinationVerdict($verdict, $t255, $t235))->toBeNull()
        ->and($engine->permitsMixed($verdict, $t235, $t255))->toBeNull();

    // The set's answer axle by axle, each with the Auflagen of the size it carries — the snow chains of 235/45 at the
    // front line, the 255/40's „keine Schneeketten“ at the rear, never one list for both (D-199).
    $answer = $engine->combinationVerdict($verdict, $t235, $t255);
    $sentences = static fn (array $conditions): array => array_map(static fn (Condition $c): string => $c->sentenceDe(), $conditions);

    expect($answer?->status())->toBe(VerdictStatus::Permitted)
        ->and([$answer?->front->labelDe(), $answer?->front->size->labelDe(), $answer?->rear->labelDe(), $answer?->rear->size->labelDe()])
        ->toBe(['Vorderachse', '235/45 R19', 'Hinterachse', '255/40 R19'])
        ->and($sentences($answer->front->conditions ?? []))->toBe(['Nur feingliedrige Schneeketten an der Hinterachse zulässig.'])
        ->and($sentences($answer->rear->conditions ?? []))->toBe(['Die Verwendung von Schneeketten ist nicht zulässig.'])
        ->and($answer?->toArray()['rear'])->toMatchArray(['axle' => 'REAR', 'axleLabel' => 'Hinterachse', 'size' => '255/40 R19', 'status' => 'PERMITTED']);
});

it('offers no Komplettrad for a combination the shop has no tyre for on one axle — the rim alone stays, and no other size fills the gap @admin-208', function (): void {
    $t235 = alsKombiTyre(11, 235, 45, 95);
    $t245 = alsKombiTyre(13, 245, 40, 97);
    // The only 255/40 is not sold now (D-301); 265/35 is a size no combination names.
    $t255 = alsKombiTyre(12, 255, 40, 99, sellable: false);
    $t265 = alsKombiTyre(14, 265, 35, 99);
    $engine = alsKombiEngine($t235, $t245, $t255, $t265);
    $verdict = alsKombiVerdict(alsKombiBbs());
    $pairs = alsKombiPairs($engine, $verdict);

    expect($pairs[2]->sets)->toBe([])
        ->and($pairs[2]->missing)->toBe(['REAR'])
        ->and($pairs[2]->noSetSentenceDe())->toBe('Für die Hinterachse (255/40 R19) können wir dir gerade keinen passenden Reifen anbieten – ein Komplettrad gibt es in dieser Kombination deshalb nicht. Die Felge allein kannst du bestellen.')
        ->and($pairs[3]->sets)->toBe([])
        ->and($pairs[3]->missing)->toBe(['REAR'])
        // Nr. 1 stands on its own tyre.
        ->and(alsKombiSets($pairs[1]->sets))->toBe([[11, 11]])
        ->and($pairs[1]->noSetSentenceDe())->toBeNull()
        // Nothing in the gap: another size at the rear is no combination, the one tyre of the size is not sold.
        ->and($engine->permitsMixed($verdict, $t235, $t245))->toBe(KomplettradRefusal::MixedPairNotListed)
        ->and($engine->permitsMixed($verdict, $t235, $t265))->toBe(KomplettradRefusal::MixedPairNotListed)
        ->and($engine->permitsMixed($verdict, $t235, $t255))->toBe(KomplettradRefusal::OutOfStock)
        // The rim alone still sells: the wheel's answer is untouched.
        ->and($verdict->isSellable())->toBeTrue();

    // Nothing on the shelf for either axle of Nr. 3: both named.
    $bare = alsKombiPairs(alsKombiEngine($t235), $verdict)[3];

    expect($bare->missing)->toBe(['FRONT', 'REAR'])
        ->and($bare->noSetSentenceDe())->toBe('Für die Vorderachse (245/40 R19) und die Hinterachse (255/40 R19) können wir dir gerade keine passenden Reifen anbieten – ein Komplettrad gibt es in dieser Kombination deshalb nicht. Die Felge allein kannst du bestellen.');
});

it('answers a set NOT_PERMITTED where its rear axle fails above 210 km/h and its front passes — the weaker axle, never CONDITIONAL @admin-208', function (): void {
    // At 280 km/h a Y tyre carries 95 % of its load (the document's table, ABE 55255 page 6): the rear's 1.235 kg ÷ 2 =
    // 617,5 kg ask 650 kg, index 93 — at full load a 92 (630 kg) would have carried it. The front asks 93 too.
    $front = alsKombiTyre(11, 235, 45, 93);
    $rear = alsKombiTyre(12, 255, 40, 92);
    $engine = alsKombiEngine($front, $rear);
    $verdict = alsKombiVerdict(alsKombiBbs(), [FitmentFixtures::specificBolts()]);
    $answer = $engine->combinationVerdict($verdict, $front, $rear);

    expect($verdict->vehicle->maxSpeedKmh)->toBe(280)
        ->and((FitmentFixtures::tables()->loadIndex(92)->capacityKg ?? 0) * 2)->toBeGreaterThanOrEqual(1235)
        // The wheel's answer is CONDITIONAL (its Auflage) — and the front axle with it.
        ->and($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($answer?->front->status)->toBe(VerdictStatus::Conditional)
        ->and($answer?->front->refusal)->toBeNull()
        ->and($answer?->rear->minimum)->toBe(['loadIndex' => 93, 'speedSymbol' => 'Y', 'axleLoadKg' => 1235])
        ->and($answer?->rear->status)->toBe(VerdictStatus::NotPermitted)
        ->and($answer?->rear->refusal)->toBe(KomplettradRefusal::BelowMinimum)
        // The set: the weaker axle — never lifted to „mit Auflagen“ by the front that passes.
        ->and($answer?->status())->toBe(VerdictStatus::NotPermitted)
        ->and($answer?->isSellable())->toBeFalse()
        ->and($answer?->refusal())->toBe(KomplettradRefusal::BelowMinimum)
        ->and($answer?->toArray())->toMatchArray(['number' => 2, 'status' => 'NOT_PERMITTED'])
        // Not offered on the page, refused at the basket's gate (R-11).
        ->and(alsKombiPairs($engine, $verdict)[2]->sets)->toBe([])
        ->and(alsKombiPairs($engine, $verdict)[2]->missing)->toBe(['REAR'])
        ->and($engine->permitsMixed($verdict, $front, $rear))->toBe(KomplettradRefusal::BelowMinimum);
});

it('answers no axle on its tyre where the offer itself refuses — a tyre rule the engine does not read, the car\'s papers missing (R-03)', function (): void {
    $t235 = alsKombiTyre(11, 235, 45, 95);
    $engine = alsKombiEngine($t235);

    // A rule about the tyres the engine cannot read: the verdict sells the wheel, the set is not confirmed — never „mit Auflagen“.
    $unread = alsKombiVerdict(alsKombiBbs(), [new Condition(
        code: 'TYRE_BRAND_LIMIT', severity: Severity::Info,
        textDe: 'Nur Reifen der im Gutachten genannten Hersteller zulässig.', affectsTyreChoice: true,
    )]);
    $answer = $engine->combinationVerdict($unread, $t235, $t235);

    expect($unread->isSellable())->toBeTrue()
        ->and($engine->mixedOfferFor($unread)->refusal)->toBe(KomplettradRefusal::TyreChoiceRestricted)
        ->and([$answer?->front->status, $answer?->rear->status, $answer?->status()])->toBe([VerdictStatus::Unknown, VerdictStatus::Unknown, VerdictStatus::Unknown])
        ->and($answer?->refusal())->toBe(KomplettradRefusal::TyreChoiceRestricted);

    // The car without its axle loads and top speed (vehicle 8, flagged for review): the tyres wait for the papers.
    $base = FitmentFixtures::document();
    $row = FitmentFixtures::row(
        vehicleId: 8,
        sizes: [new TyreSize(235, 45, 19.0)],
        document: new DocumentRecord(
            id: $base->id, kind: $base->kind, number: $base->number, revision: $base->revision, issuedOn: $base->issuedOn,
            pdfKey: $base->pdfKey, pdfSha256: $base->pdfSha256, sourcePage: $base->sourcePage, speedDerating: $base->speedDerating,
            completeness: $base->completeness, tyreCombinations: alsKombiBbs(),
        ),
    );
    $wheel = new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 10, wheelFinishId: 20, diameterIn: 19.0, widthIn: 8.5, etMm: 35,
        boltHoles: 5, boltCircleMm: 120.0, centreBoreMm: 72.6, priceCents: 22_900, stockQty: 12, sku: 'RMF-000884',
    );
    $papers = FitmentFixtures::resolver([], new InMemoryFitmentRepository([$row], [$wheel]))->resolve(8, FitmentFixtures::WHEEL_CONFIG_ID);
    $waiting = $engine->combinationVerdict($papers, $t235, $t235);

    expect($papers->tyre?->awaitsPapers())->toBeTrue()
        ->and($waiting?->status())->toBe(VerdictStatus::Unknown)
        ->and($waiting?->refusal())->toBe(KomplettradRefusal::TyresAwaitPapers)
        ->and($waiting?->isSellable())->toBeFalse();
});

it('answers nothing for a frozen verdict: a snapshot is never the input to a sale', function (): void {
    $t235 = alsKombiTyre(11, 235, 45, 95);
    $live = alsKombiVerdict(alsKombiBbs());
    $frozen = FitmentVerdict::fromArray($live->toArray());
    $answer = alsKombiEngine($t235)->combinationVerdict($frozen, $t235, $t235);

    // A snapshot carries no list (DocumentRecord): no combination is answered from it, and no axle is positive.
    expect($answer)->toBeNull()
        ->and(alsKombiEngine($t235)->permitsMixed($frozen, $t235, $t235))->toBe(KomplettradRefusal::VerdictRestored);
});

it('says the one-maker rule beside a list that prints none as ours, never as the document\'s (R-17)', function (): void {
    $t235 = alsKombiTyre(11, 235, 45, 95);
    $other = new TyreRecord(
        id: 15, widthMm: 255, aspect: 40, diameterIn: 19.0, loadIndex: 99, speedSymbol: 'Y',
        speedRank: FitmentFixtures::tables()->speedSymbol('Y')?->rank ?? 0, priceCents: 21_900, sellable: true,
        brandName: 'Andere', name: 'Grip', season: 'sommer',
    );

    expect(alsKombiEngine()->permitsMixed(alsKombiVerdict(alsKombiBbs()), $t235, $other))->toBe(KomplettradRefusal::CombinationNotOneMaker)
        ->and(KomplettradRefusal::CombinationNotOneMaker->sentenceDe())->not->toContain('Gutachten');
});
