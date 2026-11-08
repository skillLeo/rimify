<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\BuildFromName;
use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleBuild;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\IndexTables;
use App\Domain\Fitment\Derivation\LoadIndex;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbol;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Domain\Fitment\Verdict\HintColour;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\PapersWording;
use App\Domain\Fitment\Verdict\Severity;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\VehicleFixtures;

/*
 * The engine's small parts, each at its edges (D-433): the guards that keep a wrong figure out of the tables, the helpers
 * that compare and print, and the sentences the shop says. The fitment suite alone covers every line of app/Domain/Fitment,
 * so a change to the engine is measured against the engine's own tests (composer verify:fitment).
 */

it('refuses a load index or a speed symbol that could only be a typing slip — none would ever compare as „no requirement“', function (): void {
    expect(fn () => new LoadIndex(0, 450))->toThrow(InvalidArgumentException::class, 'A load index must be positive, got [0].')
        ->and(fn () => new LoadIndex(91, 0))->toThrow(InvalidArgumentException::class, 'A load capacity must be positive, got [0].')
        ->and(fn () => new SpeedSymbol('', 10, 240))->toThrow(InvalidArgumentException::class, 'A speed symbol cannot be empty.')
        ->and(fn () => new SpeedSymbol('V', 0, 240))->toThrow(InvalidArgumentException::class, 'A speed rank must be positive, got [0].')
        ->and(fn () => new SpeedSymbol('V', 10, 0))->toThrow(InvalidArgumentException::class, 'A speed rating must be positive, got [0].');
});

it('compares load indices and speed symbols by number, the stricter winning, and prints them as the tyre does', function (): void {
    $li93 = new LoadIndex(93, 650);
    $li95 = new LoadIndex(95, 690);
    $w = new SpeedSymbol('W', 11, 270);
    $y = new SpeedSymbol('Y', 12, 300);

    expect($li95->isAtLeast($li93))->toBeTrue()
        ->and($li93->isAtLeast($li95))->toBeFalse()
        ->and($li93->isAtLeast($li93))->toBeTrue()
        ->and($li93->stricterOf($li95))->toBe($li95)
        ->and($li95->stricterOf($li93))->toBe($li95)
        ->and($li93->stricterOf(null))->toBe($li93)
        ->and((string) $li93)->toBe('93')
        ->and($y->isAtLeast($w))->toBeTrue()
        ->and($w->isAtLeast($y))->toBeFalse()
        ->and($w->stricterOf($y))->toBe($y)
        ->and($y->stricterOf($w))->toBe($y)
        ->and($w->stricterOf(null))->toBe($w)
        ->and((string) $w)->toBe('W')
        ->and($w->covers(270))->toBeTrue()
        ->and($w->covers(271))->toBeFalse()
        ->and((new SpeedSymbol('(Y)', 13))->covers(420))->toBeTrue();
});

it('never derives a symbol for a top speed its table does not reach, and never a negative margin', function (): void {
    // A table without the open-ended (Y): above 240 km/h nothing covers the car, and nothing is guessed.
    $short = new IndexTables([new LoadIndex(91, 615)], [new SpeedSymbol('H', 9, 210), new SpeedSymbol('V', 10, 240)]);

    expect((new SpeedSymbolDeriver($short))->forTopSpeed(240)?->symbol)->toBe('V')
        ->and((new SpeedSymbolDeriver($short))->forTopSpeed(241))->toBeNull()
        ->and($short->highestSpeedSymbol()->symbol)->toBe('V')
        ->and(FitmentFixtures::tables()->highestSpeedSymbol()->maxKmh)->toBeNull()
        ->and(fn () => new LoadIndexDeriver(FitmentFixtures::tables(), -1))->toThrow(InvalidArgumentException::class, 'may not be negative');
});

it('reads a load at a percentage only between 1 and 100 and a capacity only where the table prints it', function (): void {
    $deriver = new LoadIndexDeriver(FitmentFixtures::tables());

    expect($deriver->forAxleAt(1235, 0))->toBeNull()
        ->and($deriver->forAxleAt(1235, 101))->toBeNull()
        ->and($deriver->forAxleAt(0, 95))->toBeNull()
        // 2 × 650 × 95 = 123.500 = 100 × 1.235: LI 93 carries the RS 4's rear axle at 95 % exactly.
        ->and($deriver->forAxleAt(1235, 95)?->index)->toBe(93)
        ->and($deriver->indexForCapacity(560)?->index)->toBe(88)
        ->and($deriver->indexForCapacity(561))->toBeNull();
});

it('names the symbols the document’s table marks „–“ at the car’s speed, and none where the table has no row for it', function (): void {
    $table = FitmentFixtures::deratingTable();

    expect($table->notPermittedAt(280))->toBe(['V', 'W'])
        ->and($table->notPermittedAt(250))->toBe(['V'])
        ->and($table->notPermittedAt(220))->toBe([])
        ->and($table->notPermittedAt(400))->toBe([]);
});

it('sells a tyre against a minimum only where both halves of it are known (R-03)', function (): void {
    $tyre = new TyreRecord(id: 1, widthMm: 245, aspect: 45, diameterIn: 18.0, loadIndex: 95, speedSymbol: 'Y', speedRank: 12, priceCents: 18_900, sellable: true);

    expect($tyre->satisfies(95, 12))->toBeTrue()
        ->and($tyre->satisfies(96, 12))->toBeFalse()
        ->and($tyre->satisfies(95, 13))->toBeFalse()
        ->and($tyre->satisfies(null, 12))->toBeFalse()
        ->and($tyre->satisfies(95, null))->toBeFalse();
});

it('keeps no figure from the papers that lies outside its range, and none where nothing was given', function (): void {
    expect(PapersFigures::tryFrom(PapersFigures::AXLE_MIN_KG - 1, null, null))->toBeNull()
        ->and(PapersFigures::tryFrom(null, PapersFigures::AXLE_MAX_KG + 1, null))->toBeNull()
        ->and(PapersFigures::tryFrom(1210, 1235, PapersFigures::SPEED_MAX_KMH + 1))->toBeNull()
        ->and(PapersFigures::tryFrom(1210, 1235, 280, PapersFigures::POWER_MIN_KW - 1))->toBeNull()
        ->and(PapersFigures::tryFrom(null, null, null))->toBeNull()
        ->and(PapersFigures::tryFrom(1210, 1235, 280)?->topSpeedKmh)->toBe(280);
});

it('reads no body form from a word the name negates — „ohne Kombi“ is not a Kombi', function (): void {
    expect(BuildFromName::of('A4', 'Avant quattro')['bodyForm'])->toBe('Kombi')
        ->and(BuildFromName::of('A4', 'ohne Avant')['bodyForm'])->toBeNull();
});

it('says what an answer assumed about the car, and whose word it was — never the data’s own values', function (): void {
    $car = VehicleFixtures::rs4First();

    expect(VehicleBuild::assumed($car))->toBe([])
        ->and(VehicleBuild::assumed($car->withBuild('Coupe', VehicleBuild::FROM_CUSTOMER, 'Allrad', VehicleBuild::FROM_NAME)))->toBe([
            ['fact' => 'Karosserieform', 'value' => 'Coupé', 'source' => 'nach deiner Angabe'],
            ['fact' => 'Antriebsart', 'value' => 'Allradantrieb', 'source' => 'erkannt am Fahrzeugnamen'],
        ]);
});

it('prints a build window open at its start as „bis“ and holds a date by both ends', function (): void {
    $window = new BuildWindow(new DateTimeImmutable('2018-03-01'), new DateTimeImmutable('2019-11-30'));

    expect((new BuildWindow(null, new DateTimeImmutable('2019-11-30')))->labelDe())->toBe('bis 11/2019')
        ->and($window->contains(new DateTimeImmutable('2018-03-01')))->toBeTrue()
        ->and($window->contains(new DateTimeImmutable('2019-11-30')))->toBeTrue()
        ->and($window->contains(new DateTimeImmutable('2018-02-28')))->toBeFalse()
        ->and($window->contains(new DateTimeImmutable('2019-12-01')))->toBeFalse()
        ->and(BuildWindow::unbounded()->contains(new DateTimeImmutable('1990-01-01')))->toBeTrue();
});

it('labels a wheel and a tyre size as the shop prints them, and counts stock only above zero', function (): void {
    $wheel = FitmentFixtures::wheel();
    $plain = new WheelConfigRecord(
        id: 1, wheelModelId: 1, wheelFinishId: 1, diameterIn: 18.0, widthIn: 8.0, etMm: 40, boltHoles: 5, boltCircleMm: 112.0,
        centreBoreMm: 57.1, priceCents: 1, stockQty: 0, modelName: 'Havanna',
    );

    expect($wheel->productLabel())->toBe('Demo Fünfspeiche F-01 · Graphite matt')
        ->and($wheel->isInStock())->toBeTrue()
        ->and($plain->productLabel())->toBe('Havanna')
        ->and($plain->isInStock())->toBeFalse()
        ->and((new TyreSize(245, 45, 18.0))->powerBandDe())->toBeNull();
});

it('refuses a condition without a German sentence — a customer is never left with a bare code (R-15)', function (): void {
    expect(fn () => new Condition(code: 'A02', severity: Severity::Info, textDe: '  '))
        ->toThrow(InvalidArgumentException::class, 'Condition [A02] has no German sentence.');
});

it('makes a row conditional only through a condition that downgrades the verdict', function (): void {
    expect(FitmentFixtures::row(conditions: [FitmentFixtures::infoOnly()])->hasPurchaseAffectingCondition())->toBeFalse()
        ->and(FitmentFixtures::row(conditions: [FitmentFixtures::infoOnly(), FitmentFixtures::specificBolts()])->hasPurchaseAffectingCondition())->toBeTrue()
        ->and(FitmentFixtures::row()->hasPurchaseAffectingCondition())->toBeFalse();
});

it('says the papers line either way, and one line per size only where the sizes disagree', function (): void {
    expect(PapersWording::entryLineOrNone(true, false))->toBe(PapersWording::ENTRY_REQUIRED)
        ->and(PapersWording::entryLineOrNone(true, true))->toBe(PapersWording::ABNAHME_REQUIRED)
        ->and(PapersWording::entryLineOrNone(false, false))->toBe(PapersWording::NO_ENTRY)
        ->and(PapersWording::entryLineOrNone(false, true))->toBe(PapersWording::NO_ABNAHME)
        ->and(PapersWording::entryBySize([['size' => '245/45 R18', 'entry' => true], ['size' => '255/40 R18', 'entry' => true]], false))->toBeNull()
        ->and(PapersWording::entryBySize([['size' => '245/45 R18', 'entry' => false]], false))->toBeNull();
});

it('tells whoever sets a level or a colour what the shop does with it, in German', function (): void {
    expect(ConditionLevel::Hinweis->shopEffectDe())->toContain('„Freigegeben“ statt „Mit Auflagen“')
        ->and(ConditionLevel::Auflage->shopEffectDe())->toContain('nie „Freigegeben“')
        ->and(ConditionLevel::NichtZulaessig->shopEffectDe())->toContain('wirkt das wie eine Auflage')
        ->and(HintColour::Green->labelDe())->toBe('Grün')
        ->and(HintColour::Yellow->labelDe())->toBe('Gelb');
});

it('lists every value of the stored enums, so a column check can never miss one', function (): void {
    expect(MinSource::values())->toBe(array_map(static fn (MinSource $c): string => $c->value, MinSource::cases()))
        ->and(Severity::values())->toBe(array_map(static fn (Severity $c): string => $c->value, Severity::cases()))
        ->and(VerdictStatus::values())->toBe(['PERMITTED', 'CONDITIONAL', 'NOT_PERMITTED', 'UNKNOWN']);
});

it('has a plain German sentence for every reason an answer can give, never a code', function (string $code): void {
    $sentence = VerdictReason::sentenceFor($code);

    expect($sentence)->not->toBe('')
        ->and($sentence)->not->toContain($code)
        ->and(VerdictReason::of($code)->code)->toBe($code);
})->with([
    VerdictReason::VEHICLE_INCOMPLETE, VerdictReason::REFERENCE_DATA_MISSING, VerdictReason::CONDITION_UNRESOLVED,
    VerdictReason::WHEEL_LOAD_EXCEEDED, VerdictReason::TYRE_NOT_PERMITTED, VerdictReason::TYRE_UNKNOWN,
]);
