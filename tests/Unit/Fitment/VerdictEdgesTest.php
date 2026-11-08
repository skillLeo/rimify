<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Resolver\VehicleDisambiguator;
use App\Domain\Fitment\Resolver\WheelSet;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Tyres\MixedPair;
use App\Domain\Fitment\Tyres\TyreLineRule;
use App\Domain\Fitment\Tyres\TyrePairing;
use App\Domain\Fitment\Tyres\TyrePairingTable;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionGroups;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\Rebuild;
use Tests\Support\Fitment\VehicleFixtures;

/*
 * The edges of what an answer says (D-433): the papers line, the rim sold alone, the Auflagen per size, the tables as read,
 * and the answer for a front/rear wheel set. Each is a sentence a customer reads, or a „no“ that must stay one.
 */

function veDocument(int $id, ?bool $correction): DocumentRecord
{
    return new DocumentRecord(id: $id, kind: 'ABE', number: 'ABE '.$id, revision: 1, papersCorrectionRequired: $correction);
}

it('says the papers need no correction only where every document the answer rests on frees them (§ 15 FZV)', function (): void {
    $live = FitmentFixtures::resolver([FitmentFixtures::row()])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
    $free = veDocument(1, false);

    expect($live->isSellable())->toBeTrue()
        ->and(Rebuild::of($live, ['document' => $free, 'documents' => [$free, veDocument(2, false)]])->papersExempt())->toBeTrue()
        // One of the two says nothing, or asks for the correction: the line is not said.
        ->and(Rebuild::of($live, ['document' => $free, 'documents' => [$free, veDocument(2, null)]])->papersExempt())->toBeFalse()
        ->and(Rebuild::of($live, ['document' => $free, 'documents' => [$free, veDocument(2, true)]])->papersExempt())->toBeFalse()
        ->and(Rebuild::of($live, ['document' => veDocument(2, null), 'documents' => []])->papersExempt())->toBeFalse();
});

it('asks for a tick only where a condition needs one', function (): void {
    $plain = FitmentFixtures::resolver([FitmentFixtures::row(conditions: [FitmentFixtures::specificBolts()])])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
    $arch = FitmentFixtures::resolver([FitmentFixtures::row(conditions: [FitmentFixtures::archRolling()])])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($plain->requiresAcknowledgement())->toBeFalse()
        ->and($arch->requiresAcknowledgement())->toBeTrue();
});

it('names the one axle a rim sold alone may go on, with its sizes, where its tyres wait for the papers (D-289)', function (string $axle, string $says): void {
    // The C 43 without axle loads or top speed: the wheel is approved, the tyres wait for fields 8.1, 8.2 and T.
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(vehicleId: 8, axle: $axle)])->resolve(8, FitmentFixtures::WHEEL_CONFIG_ID);
    $alone = $verdict->forRimAlone();

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($alone?->rimAloneNoteDe)->toStartWith("Die Felge ist für dein Fahrzeug {$says}, mit Reifen der Größe 245/45 R18.")
        ->and($alone?->rimAloneNoteDe)->toContain('fehlten uns die Felder 8.1, 8.2 und T');
})->with([
    'front only' => ['FRONT', 'nur an der Vorderachse zulässig'],
    'rear only' => ['REAR', 'nur an der Hinterachse zulässig'],
]);

it('gives a size the answer does not name every size’s own Auflagen — the cautious reading, never fewer', function (): void {
    $a = Condition::ofKind('A01', ConditionKind::Hinweis, 'Hinweis zu 245/45.');
    $b = Condition::ofKind('A02', ConditionKind::Hinweis, 'Hinweis zu 255/40.');
    $groups = new ConditionGroups([], [
        ['size' => new TyreSize(245, 45, 18.0), 'axles' => ['FRONT' => true], 'own' => [$a], 'entry' => false],
        ['size' => new TyreSize(255, 40, 18.0), 'axles' => ['REAR' => true], 'own' => [$b], 'entry' => false],
    ]);

    expect(array_map(static fn (Condition $c): string => $c->code, $groups->ownFor('245/45/18')))->toBe(['A01'])
        ->and(array_map(static fn (Condition $c): string => $c->code, $groups->ownFor('225/40/18')))->toBe(['A01', 'A02']);
});

it('reads no table from a heading without entries, nor from an entry without its dash', function (): void {
    expect(TyrePairingTable::parse('Folgende Reifenkombinationen sind möglich: (Vorderachse – Hinterachse)')->pairs)->toBe([])
        ->and(TyrePairingTable::parse('Folgende Reifenkombinationen sind möglich: (Vorderachse – Hinterachse) Nr. 1: 235/45R19 255/40R19.')->pairs)->toBe([])
        ->and(TyrePairingTable::parse('Folgende Reifenkombinationen sind möglich: (Vorderachse – Hinterachse) Nr. 1: 235/45R19 – 255/40R19.')->pairs)->toHaveCount(1);
});

it('quotes no clause about makers and profiles where the document’s sentence holds none', function (): void {
    expect(TyreLineRule::none()->quoteDe())->toBeNull()
        ->and(TyreLineRule::parse(null)->quoteDe())->toBeNull();
});

it('says why a listed pair has no set in the words of the rule that stopped it', function (?string $reason, string $starts): void {
    $front = new TyreSize(235, 45, 19.0);
    $rear = new TyreSize(255, 40, 19.0);
    $pair = new MixedPair(new TyrePairing(8, $front, $rear), $front, $rear, [], [], [], noSetReason: $reason);

    expect($pair->noSetSentenceDe())->toStartWith($starts);
})->with([
    'the profile rule' => [MixedPair::NO_SET_PROFILE, 'Das Gutachten verlangt, dass die Reifen vorne und hinten vom selben Hersteller sind und dasselbe Profil haben.'],
    'the maker rule' => [MixedPair::NO_SET_MAKER, 'Das Gutachten verlangt, dass die Reifen vorne und hinten vom selben Hersteller sind. Solche'],
    'our season' => [MixedPair::NO_SET_SEASON, 'In diesen Größen können wir dir gerade keine Reifen derselben Saison'],
]);

it('cannot tell a car by a kind of restriction it does not know — „nicht sicher“, never covered', function (): void {
    $unknownKind = new RowFilter(code: 'K9', kind: 'radstand', textDe: 'Nur für den langen Radstand.');
    $notAllrad = new RowFilter(code: 'K3', kind: RowFilter::DRIVE, driveMode: 'not', drive: 'Allrad', textDe: 'Nicht für Allrad.');
    $noDrive = Rebuild::of(VehicleFixtures::rs4First(), ['driveAxle' => null]);

    expect($unknownKind->decide(VehicleFixtures::rs4First()))->toBeNull()
        ->and(RowFilter::admitAll([$unknownKind, new RowFilter(code: 'K1', kind: RowFilter::BODY_FORM, bodyForms: ['Kombi'])], VehicleFixtures::rs4First()))->toBeNull()
        ->and($notAllrad->decide(VehicleFixtures::rs4First()))->toBeFalse()
        ->and(RowFilter::openFacts([$notAllrad], $noDrive))->not->toBe([]);
});

it('shows a chooser only differences a customer can see, a dash where the data has nothing', function (): void {
    $bare = new VehicleRecord(
        id: 90, hsn: '9999', tsn: 'ZZZ', vsn: null, make: 'Opel', model: 'Astra', variant: 'Astra', typeDesignation: null,
        buildWindow: BuildWindow::unbounded(), axleLoadFrontKg: null, axleLoadRearKg: null, maxSpeedKmh: null,
    );

    foreach (['power', 'body_form', 'max_speed', 'doors', 'seats', 'drive_axle', 'axle_load_front', 'colour'] as $attribute) {
        expect(VehicleDisambiguator::value($bare, $attribute))->toBe('—');
    }

    expect(VehicleDisambiguator::labelDe('power'))->toBe('Leistung')
        ->and(VehicleDisambiguator::labelDe('body_form'))->toBe('Karosserie')
        ->and(VehicleDisambiguator::labelDe('doors'))->toBe('Türen')
        ->and(VehicleDisambiguator::labelDe('seats'))->toBe('Sitze')
        ->and(VehicleDisambiguator::labelDe('drive_axle'))->toBe('Antrieb')
        ->and(VehicleDisambiguator::labelDe('colour'))->toBe('colour');
});

it('answers a front/rear wheel set with no tyre half and no row Auflagen where one end has none — never one end’s alone', function (): void {
    $live = FitmentFixtures::resolver([FitmentFixtures::row()])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);
    $frozen = Rebuild::of($live, ['tyre' => null, 'combinationConditions' => null]);

    $set = (new WheelSet(884, 885, $live, $frozen))->combined();
    $both = (new WheelSet(884, 885, $live, $live))->combined();

    expect($set->tyre)->toBeNull()
        ->and($set->combinationConditions)->toBeNull()
        ->and($both->tyre?->status)->toBe($live->tyre?->status)
        ->and($both->combinationConditions)->toBe($live->combinationConditions);
});

it('ignores a speed symbol a document prints that the table does not know, and keeps the size’s own (D-027)', function (): void {
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(sizes: [
        new TyreSize(245, 45, 18.0, documentMinSpeedSymbol: 'Y'),
        new TyreSize(255, 40, 18.0, documentMinSpeedSymbol: 'Q9'),
    ])])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);

    // The RS 4 derives Y at 280 km/h: the unknown „Q9“ neither lowers that nor stands in for it.
    expect($verdict->front->minSpeedSymbol)->toBe('Y')
        ->and($verdict->front->minimumFor(new TyreSize(255, 40, 18.0))['speedSymbol'])->toBe('Y');
});

it('reads one size printed twice, once for a power band and once for any power, as any power — with the stricter figures of both', function (): void {
    // The RS 4's 331 kW lies in the band, so both entries cover it: one size, every band dropped, the higher index kept.
    // (A band the car lies outside never reaches the merge — that entry does not cover the car at all.)
    $verdict = FitmentFixtures::resolver([FitmentFixtures::row(sizes: [
        new TyreSize(245, 45, 18.0, documentMinLoadIndex: 96, kwMin: 300, kwMax: 340),
        new TyreSize(245, 45, 18.0, documentMinLoadIndex: 94),
    ])])->resolve(1, FitmentFixtures::WHEEL_CONFIG_ID);

    expect($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->front->sizes)->toHaveCount(1)
        ->and($verdict->front->sizes[0]->powerBandDe())->toBeNull()
        ->and($verdict->front->minLoadIndex)->toBe(96);
});
