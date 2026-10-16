<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Tyres\TyrePairing;
use App\Domain\Fitment\Tyres\TyrePairingTable;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryTyreCatalogue;

/*
 * D-256 (his item 8, Group A of the admin round): a Gutachten's own „Bereifungskombinationen“, entered as such. BBS's
 * Anlage BMW15 approves the wheel only „in Verbindung mit“ four combinations, so a list once entered is closed: a mixed
 * set only as a pair it names, four of a kind only in a size it names on both axles — and where an Auflage prints a
 * table too, only what both permit. The car's row still has to list each size on its axle.
 */

/** @param list<array{0: int, 1: array{int, int}, 2: array{int, int}}> $entries number, front [width, aspect], rear — all 19″ */
function kombiList(array $entries, ?int $page = 5): TyrePairingTable
{
    return TyrePairingTable::recorded(array_map(
        static fn (array $e): TyrePairing => new TyrePairing($e[0], new TyreSize($e[1][0], $e[1][1], 19.0), new TyreSize($e[2][0], $e[2][1], 19.0)),
        $entries,
    ), $page);
}

function kombiDocument(?TyrePairingTable $list, int $id = 57): DocumentRecord
{
    $base = FitmentFixtures::document();

    return new DocumentRecord(
        id: $id, kind: $base->kind, number: $base->number, revision: $base->revision, issuedOn: $base->issuedOn,
        pdfKey: $base->pdfKey, pdfSha256: $base->pdfSha256, sourcePage: $base->sourcePage, speedDerating: $base->speedDerating,
        completeness: $base->completeness, tyreCombinations: $list,
    );
}

/** The fixture RS 4 (1.210 kg front, 1.235 kg rear, 280 km/h) on a 19″ wheel whose row lists 235/45, 245/40, 255/40 on both axles. */
function kombiVerdict(?TyrePairingTable $list, array $conditions = []): FitmentVerdict
{
    $wheel = new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 10, wheelFinishId: 20, diameterIn: 19.0, widthIn: 8.5, etMm: 35,
        boltHoles: 5, boltCircleMm: 120.0, centreBoreMm: 72.6, priceCents: 22_900, stockQty: 12, sku: 'RMF-000884',
        modelName: 'LeMans', brandName: 'BBS', finishNameDe: 'Schwarz matt',
    );

    $row = FitmentFixtures::row(
        sizes: [new TyreSize(235, 45, 19.0), new TyreSize(245, 40, 19.0), new TyreSize(255, 40, 19.0)],
        conditions: $conditions,
        document: kombiDocument($list),
    );

    return FitmentFixtures::resolver([], new InMemoryFitmentRepository([$row], [$wheel]))->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
}

function kombiTyre(int $id, int $width, int $aspect, int $loadIndex): TyreRecord
{
    return new TyreRecord(
        id: $id, widthMm: $width, aspect: $aspect, diameterIn: 19.0, loadIndex: $loadIndex, speedSymbol: 'Y',
        speedRank: FitmentFixtures::tables()->speedSymbol('Y')?->rank ?? 0, priceCents: 21_900, stockQty: 8,
        brandName: 'Demo', name: 'Sport', season: 'sommer',
    );
}

/** @return array{0: TyreEligibility, 1: TyreRecord, 2: TyreRecord, 3: TyreRecord} the engine over one tyre of each size: 235/45, 245/40, 255/40 */
function kombiEngine(): array
{
    $tyres = [kombiTyre(11, 235, 45, 95), kombiTyre(13, 245, 40, 97), kombiTyre(12, 255, 40, 99)];

    return [new TyreEligibility(new InMemoryTyreCatalogue($tyres), new SpeedSymbolDeriver(FitmentFixtures::tables())), ...$tyres];
}

function kombiV19(): Condition
{
    /** @var array{conditions: list<array{code: string, text_de: string}>} $document */
    $document = json_decode((string) file_get_contents(__DIR__.'/../../../docs/gutachten/abe-55255.json'), true, flags: JSON_THROW_ON_ERROR);
    $text = collect($document['conditions'])->firstWhere('code', 'V19')['text_de'] ?? throw new RuntimeException('V19 is not in the transcription.');

    return Condition::ofKind('V19', ConditionKind::ReifenKombination, $text, sourcePage: 12);
}

/** BBS's shape: Nr. 1 the same size front and rear, Nr. 2 and 3 a wider rear. */
function kombiBbs(): TyrePairingTable
{
    return kombiList([[1, [235, 45], [235, 45]], [2, [235, 45], [255, 40]], [3, [245, 40], [255, 40]]]);
}

it('offers four of a kind only in a size the list names on both axles — though the row lists all three on both', function (): void {
    [$engine, $t235, $t245, $t255] = kombiEngine();
    $verdict = kombiVerdict(kombiBbs());
    $offer = $engine->offerFor($verdict);

    expect($verdict->isSellable())->toBeTrue()
        ->and($offer->refusal)->toBeNull()
        ->and(array_map(static fn (TyreRecord $t): int => $t->id, $offer->tyres))->toBe([11])
        // The basket's gate, tyre by tyre (R-11).
        ->and($engine->permits($verdict, $t235, 4))->toBeNull()
        ->and($engine->permits($verdict, $t245, 4))->toBe(KomplettradRefusal::SizeNotACombination)
        ->and($engine->permits($verdict, $t255, 4))->toBe(KomplettradRefusal::SizeNotACombination)
        // Without a list the same row sells all three: the list is what narrows it.
        ->and(array_map(static fn (TyreRecord $t): int => $t->id, $engine->offerFor(kombiVerdict(null))->tyres))->toEqualCanonicalizing([11, 12, 13]);
});

it('offers each pair the list names, in its numbering and on its page — and no pair it does not name', function (): void {
    [$engine, $t235, $t245, $t255] = kombiEngine();
    $verdict = kombiVerdict(kombiBbs());
    $offer = $engine->mixedOfferFor($verdict);

    expect($offer->refusal)->toBeNull()
        ->and($offer->hasTable)->toBeTrue()
        ->and(array_map(static fn ($pair): array => [$pair->pairing->number, $pair->front->labelDe(), $pair->rear->labelDe()], $offer->pairs))->toBe([
            [2, '235/45 R19', '255/40 R19'],
            [3, '245/40 R19', '255/40 R19'],
        ])
        ->and($offer->sourcePage)->toBe(5)
        // No Auflage printed the pairs: no code, no rules, no page for rules.
        ->and([$offer->code, $offer->rulesDe, $offer->rulesPage])->toBe([null, null, null])
        ->and($engine->permitsMixed($verdict, $t235, $t255))->toBeNull()
        ->and($engine->permitsMixed($verdict, $t235, $t245))->toBe(KomplettradRefusal::MixedPairNotListed)
        // The document's order only: 255/40 at the front is no combination.
        ->and($engine->permitsMixed($verdict, $t255, $t235))->toBe(KomplettradRefusal::MixedPairNotListed);
});

it('refuses four of a kind in so many words where the list names no size on both axles', function (): void {
    [$engine, $t235] = kombiEngine();
    $verdict = kombiVerdict(kombiList([[1, [235, 45], [255, 40]], [2, [245, 40], [255, 40]]]));

    expect($engine->offerFor($verdict)->refusal)->toBe(KomplettradRefusal::NoSameSizeCombination)
        ->and($engine->permits($verdict, $t235, 4))->toBe(KomplettradRefusal::NoSameSizeCombination)
        ->and(KomplettradRefusal::NoSameSizeCombination->sentenceDe())->toBe('Vier gleiche Reifen sind für dein Fahrzeug mit dieser Felge nicht als Kombination hinterlegt. Die Felge allein kannst du sofort bestellen.')
        // Mischbereifung still stands on the list.
        ->and(count($engine->mixedOfferFor($verdict)->pairs))->toBe(2);
});

it('says nothing about Mischbereifung where the list pairs no two different sizes', function (): void {
    [$engine] = kombiEngine();
    $verdict = kombiVerdict(kombiList([[1, [235, 45], [235, 45]], [2, [245, 40], [245, 40]]]));
    $offer = $engine->mixedOfferFor($verdict);

    expect($offer->hasTable)->toBeFalse()
        ->and($offer->pairs)->toBe([])
        ->and(array_map(static fn (TyreRecord $t): int => $t->id, $engine->offerFor($verdict)->tyres))->toEqualCanonicalizing([11, 13]);
});

it('offers only what both permit where an Auflage prints a table beside the list — the list\'s numbers, the Auflage\'s rules and page', function (): void {
    [$engine] = kombiEngine();
    // V19 lists 235/45 – 255/40 (its Nr. 8), not 245/40 – 255/40.
    $offer = $engine->mixedOfferFor(kombiVerdict(kombiBbs(), [kombiV19()]));

    expect(array_map(static fn ($pair): int => $pair->pairing->number, $offer->pairs))->toBe([2])
        ->and($offer->sourcePage)->toBe(5)
        ->and($offer->code)->toBe('V19')
        ->and($offer->rulesDe)->toStartWith('Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig')
        ->and($offer->rulesPage)->toBe(12);
});

it('keeps a printed table on its own page where no list is entered, as before', function (): void {
    [$engine] = kombiEngine();
    $offer = $engine->mixedOfferFor(kombiVerdict(null, [kombiV19()]));

    expect(array_map(static fn ($pair): int => $pair->pairing->number, $offer->pairs))->toBe([8])
        ->and([$offer->sourcePage, $offer->rulesPage])->toBe([12, 12]);
});

it('reads several documents\' lists together, toward caution: only the pairs every one of them names', function (): void {
    [$engine, $t235] = kombiEngine();
    $first = kombiDocument(kombiList([[1, [235, 45], [235, 45]], [2, [235, 45], [255, 40]]]), 57);
    $second = kombiDocument(kombiList([[1, [235, 45], [255, 40]], [2, [245, 40], [255, 40]]]), 58);
    $verdict = kombiVerdict(null)->withDocuments([$first, $second]);

    expect(array_map(static fn ($pair): int => $pair->pairing->number, $engine->mixedOfferFor($verdict)->pairs))->toBe([2])
        // The second names no size on both axles: four of a kind is not on record for both.
        ->and($engine->offerFor($verdict)->refusal)->toBe(KomplettradRefusal::NoSameSizeCombination)
        ->and($engine->permits($verdict, $t235, 4))->toBe(KomplettradRefusal::NoSameSizeCombination);
});
