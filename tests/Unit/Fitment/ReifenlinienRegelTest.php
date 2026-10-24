<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Tyres\TyreEligibility;
use App\Domain\Fitment\Tyres\TyreLineRule;
use App\Domain\Fitment\Tyres\TyrePairingTable;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryTyreCatalogue;

/*
 * D-336, the operator's decision of 24.10.2026: what a set's makers and profile types must be comes from the document's
 * own recorded Auflage, read strictly — never from a rule of ours, because another document may say something else
 * (R-17). ABE 55255's V19 asks for one maker on every tyre and one profile type on each axle; another document asks for
 * one maker and one type on every tyre. The engine had one rule for all — the same maker, tyre line and season front and
 * rear — and refused sets V19 allows.
 */

/** ABE 55255's V19 as transcribed (docs/gutachten/abe-55255.json): the 27 pairs, then the sentence after the table. */
function linieV19(): string
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

/** V19's table with another sentence after it — or none: the pairs alone. */
function linieTable(string $rules): string
{
    $table = (string) preg_replace('/(Nr\. 27: 275\/30R19 – 315\/25R19)\..*$/su', '$1.', linieV19());

    return trim($table.' '.$rules);
}

/** The BMW X3 X83's 19″ row on the fixture's figures (1.210 kg front, 1.235 kg rear, 280 km/h), with this Auflage. */
function linieVerdict(string $text): FitmentVerdict
{
    $wheel = new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 10, wheelFinishId: 20, diameterIn: 19.0, widthIn: 8.5, etMm: 35,
        boltHoles: 5, boltCircleMm: 120.0, centreBoreMm: 72.6, priceCents: 22_900, stockQty: 12, sku: 'RMF-000884',
        modelName: 'Fünfspeiche F-01', brandName: 'Demo', finishNameDe: 'Graphite matt',
    );

    $row = FitmentFixtures::row(
        vehicleId: 1,
        sizes: [new TyreSize(235, 45, 19.0), new TyreSize(245, 40, 19.0), new TyreSize(255, 40, 19.0)],
        conditions: [Condition::ofKind('V19', ConditionKind::ReifenKombination, $text, sourcePage: 12)],
    );

    return FitmentFixtures::resolver([], new InMemoryFitmentRepository([$row], [$wheel]))->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
}

/** A tyre of V19's pair Nr. 8: 235/45 R19 at the front, 255/40 R19 at the rear — each enough for its axle. */
function linieTyre(int $id, string $axle, string $brand = 'Demo', string $name = 'Sport', string $season = 'sommer', int $price = 21_900): TyreRecord
{
    [$width, $aspect, $loadIndex] = $axle === 'FRONT' ? [235, 45, 95] : [255, 40, 99];

    return new TyreRecord(
        id: $id, widthMm: $width, aspect: $aspect, diameterIn: 19.0, loadIndex: $loadIndex, speedSymbol: 'Y',
        speedRank: FitmentFixtures::tables()->speedSymbol('Y')?->rank ?? 0, priceCents: $price, sellable: true,
        brandName: $brand, name: $name, season: $season,
    );
}

function linieEligibility(TyreRecord ...$tyres): TyreEligibility
{
    return new TyreEligibility(new InMemoryTyreCatalogue(array_values($tyres)), new SpeedSymbolDeriver(FitmentFixtures::tables()));
}

/** @return list<array{0: int, 1: int}> the offer's sets for V19's pair Nr. 8, front and rear tyre */
function linieSets(TyreEligibility $eligibility, FitmentVerdict $verdict): array
{
    $offer = $eligibility->mixedOfferFor($verdict);

    expect($offer->refusal)->toBeNull()->and($offer->pairs)->toHaveCount(1);

    return array_map(static fn (array $set): array => [$set['front']->id, $set['rear']->id], $offer->pairs[0]->sets);
}

// ── The reader ──────────────────────────────────────────────────────────────────────────────────────────────────────

it('reads V19 as the document words it: one maker on every tyre, one profile type on each axle @d-336', function (): void {
    // The sentence after the table, as the engine reads it.
    $rule = TyreLineRule::parse(TyrePairingTable::parse(linieV19())->rulesDe);

    expect($rule->read)->toBeTrue()
        ->and($rule->maker)->toBe(TyreLineRule::SET)
        ->and($rule->profile)->toBe(TyreLineRule::AXLE)
        // The document's own words, cut where its sentence carries on — never a rule of ours.
        ->and($rule->quoteDe())->toBe("\u{201E}Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig […]\u{201C}");
});

it('reads each document\'s own wording, and nothing where it says nothing of makers @d-336', function (string $text, ?string $maker, ?string $profile): void {
    $rule = TyreLineRule::parse($text);

    expect($rule->read)->toBeTrue()
        ->and([$rule->maker, $rule->profile])->toBe([$maker, $profile]);
})->with([
    'one maker and one type on every tyre' => ['Es sind vorn und hinten nur Reifen eines Herstellers und Typs zulässig.', TyreLineRule::SET, TyreLineRule::SET],
    'one maker and one profile type on each axle' => ['Es sind achsweise nur Reifen eines Herstellers und eines Profiltyps zulässig.', TyreLineRule::AXLE, TyreLineRule::AXLE],
    'one maker on every tyre' => ['Es sind nur Reifen eines Herstellers zulässig.', TyreLineRule::SET, null],
    'a confirmation by the car\'s maker is not a rule about makers' => ['Diese Bestätigung des Fahrzeugherstellers ist vom Führer des Fahrzeugs mitzuführen.', null, null],
    'nothing at all' => ['', null, null],
]);

it('reads nothing of a rule about makers or profiles in words it does not know — never half @d-336', function (string $text): void {
    expect(TyreLineRule::parse($text)->read)->toBeFalse();
})->with([
    'another wording' => ['Die Reifen müssen vom selben Hersteller stammen.'],
    'a second clause beside one it reads' => ['Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig. Die Profilausführung muss gleich sein.'],
    // Read as a rule for every tyre, it would part front and rear the document lets differ.
    'an axle the clause read leaves out' => ['Achsweise gilt: Es sind nur Reifen eines Herstellers zulässig.'],
]);

it('tells what a front and a rear tyre break, and takes no unknown name for the same one @d-336', function (): void {
    $v19 = TyreLineRule::parse('Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig.');
    $typeToo = TyreLineRule::parse('Es sind vorn und hinten nur Reifen eines Herstellers und Typs zulässig.');

    expect($v19->broken(linieTyre(1, 'FRONT'), linieTyre(2, 'REAR', name: 'Touring')))->toBeNull()
        ->and($v19->broken(linieTyre(1, 'FRONT'), linieTyre(2, 'REAR', brand: 'Andere')))->toBe(TyreLineRule::MAKER)
        ->and($v19->broken(linieTyre(1, 'FRONT'), linieTyre(2, 'REAR', brand: '')))->toBe(TyreLineRule::MAKER)
        ->and($typeToo->broken(linieTyre(1, 'FRONT'), linieTyre(2, 'REAR', name: 'Touring')))->toBe(TyreLineRule::PROFILE)
        ->and($typeToo->broken(linieTyre(1, 'FRONT'), linieTyre(2, 'REAR')))->toBeNull();
});

// ── The engine: the rule the document records, and no other ────────────────────────────────────────────────────────

it('offers and sells two profile types of one maker where V19 asks only one type on each axle — the over-refusal @d-336', function (): void {
    $verdict = linieVerdict(linieV19());
    $eligibility = linieEligibility(linieTyre(11, 'FRONT'), linieTyre(12, 'REAR', name: 'Touring'));

    // Before: one tyre line front and rear was required of every document — no set, and the gate refused.
    expect(linieSets($eligibility, $verdict))->toBe([[11, 12]])
        ->and($eligibility->permitsMixed($verdict, linieTyre(11, 'FRONT'), linieTyre(12, 'REAR', name: 'Touring')))->toBeNull();
});

it('refuses two makers where V19 asks one maker on every tyre, quoting the recorded clause @d-336', function (): void {
    $verdict = linieVerdict(linieV19());
    $eligibility = linieEligibility(linieTyre(11, 'FRONT'), linieTyre(14, 'REAR', brand: 'Andere'));
    $refusal = $eligibility->permitsMixed($verdict, linieTyre(11, 'FRONT'), linieTyre(14, 'REAR', brand: 'Andere'));

    expect($refusal)->toBe(KomplettradRefusal::MixedNotOneMaker)
        ->and(linieSets($eligibility, $verdict))->toBe([])
        ->and($eligibility->sentenceFor($verdict, $refusal))->toContain("\u{201E}Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig […]\u{201C}");
});

it('refuses two tyre lines where the document asks one type on every tyre — its rule, not V19\'s @d-336', function (): void {
    $verdict = linieVerdict(linieTable('Es sind vorn und hinten nur Reifen eines Herstellers und Typs zulässig.'));
    $eligibility = linieEligibility(linieTyre(11, 'FRONT'), linieTyre(12, 'REAR', name: 'Touring'), linieTyre(13, 'REAR'));

    expect($eligibility->permitsMixed($verdict, linieTyre(11, 'FRONT'), linieTyre(12, 'REAR', name: 'Touring')))->toBe(KomplettradRefusal::MixedNotOneProfile)
        ->and($eligibility->sentenceFor($verdict, KomplettradRefusal::MixedNotOneProfile))->toContain("\u{201E}Es sind vorn und hinten nur Reifen eines Herstellers und Typs zulässig.\u{201C}")
        ->and(linieSets($eligibility, $verdict))->toBe([[11, 13]]);
});

it('asks nothing of makers where the document\'s sentence says nothing of them — two makers are a legal set @d-336', function (): void {
    $verdict = linieVerdict(linieTable(''));
    $eligibility = linieEligibility(linieTyre(11, 'FRONT'), linieTyre(14, 'REAR', brand: 'Andere'));

    expect($eligibility->permitsMixed($verdict, linieTyre(11, 'FRONT'), linieTyre(14, 'REAR', brand: 'Andere')))->toBeNull()
        ->and(linieSets($eligibility, $verdict))->toBe([[11, 14]]);
});

it('fails closed on a rule about makers in words it does not read: no set, a person clarifies @d-336', function (): void {
    $verdict = linieVerdict(linieTable('Die Reifen müssen vom selben Hersteller stammen.'));
    $eligibility = linieEligibility(linieTyre(11, 'FRONT'), linieTyre(12, 'REAR'));

    expect($eligibility->mixedOfferFor($verdict)->refusal)->toBe(KomplettradRefusal::TyreChoiceRestricted)
        ->and($eligibility->permitsMixed($verdict, linieTyre(11, 'FRONT'), linieTyre(12, 'REAR')))->toBe(KomplettradRefusal::TyreChoiceRestricted);
});

it('refuses no set for its seasons — no document says it — while the offer pairs one season front and rear @d-336', function (): void {
    $verdict = linieVerdict(linieV19());
    $eligibility = linieEligibility(linieTyre(11, 'FRONT'), linieTyre(12, 'REAR', season: 'winter'));
    $pair = $eligibility->mixedOfferFor($verdict)->pairs[0];

    expect($eligibility->permitsMixed($verdict, linieTyre(11, 'FRONT'), linieTyre(12, 'REAR', season: 'winter')))->toBeNull()
        ->and($pair->sets)->toBe([])
        // Ours, said as ours: what we pair, never what the document asks.
        ->and($pair->noSetSentenceDe())->toStartWith('In diesen Größen können wir dir gerade keine Reifen derselben Saison');
});

it('puts one maker\'s one line first, then the price — two of a kind is what most buy @d-336', function (): void {
    $verdict = linieVerdict(linieV19());
    $eligibility = linieEligibility(
        linieTyre(11, 'FRONT', price: 20_000),
        linieTyre(12, 'REAR', name: 'Touring', price: 15_000),
        linieTyre(13, 'REAR', price: 25_000),
    );

    expect(linieSets($eligibility, $verdict))->toBe([[11, 13], [11, 12]]);
});
