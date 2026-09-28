<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\SpeedDeratingTable;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\Severity;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictStatus;
use Tests\Support\Fitment\FitmentFixtures;
use Tests\Support\Fitment\FixedClock;
use Tests\Support\Fitment\InMemoryFitmentRepository;
use Tests\Support\Fitment\InMemoryVehicleRepository;

/*
 * R-03 as amended on 28.09.2026 (the operator's Answer 1, docs/specs/vehicles-and-tyres.md C9) and the
 * operator's review of C9: a wheel verdict rests on the vehicle type and kW band a released Gutachten names;
 * a tyre verdict is never positive without the car's axle loads and top speed; the answer is the weaker.
 * The document's own table of tyre load at speed reads three ways — a share, a „–“, nothing — and the
 * speed is rounded up to its row.
 */

const TYRE_HALF_NBSP = "\u{00A0}";

function kg(string $figure): string
{
    return $figure.TYRE_HALF_NBSP.'kg';
}

/** The BMW 4er Coupé, type 3C, as ABE 55255 names it: no key numbers, no axle loads, no top speed. */
function bmw4er3C(?int $front = null, ?int $rear = null, ?int $speed = null): VehicleRecord
{
    return new VehicleRecord(
        id: 40, hsn: '', tsn: '', vsn: null,
        make: 'BMW', model: '4er Coupé', variant: '4er Coupé', typeDesignation: '3C',
        buildWindow: BuildWindow::unbounded(),
        axleLoadFrontKg: $front, axleLoadRearKg: $rear, maxSpeedKmh: $speed,
        powerKw: 135, bodyForm: 'Coupé', driveAxle: 'Hinterachse',
        needsReview: $front === null || $rear === null || $speed === null,
    );
}

/** The DB8GT2 8,5J × 19, tested for 700 kg a wheel (ABE 55255, p. 1). */
function db8gt2(): WheelConfigRecord
{
    return new WheelConfigRecord(
        id: FitmentFixtures::WHEEL_CONFIG_ID, wheelModelId: 23, wheelFinishId: 44,
        diameterIn: 19.0, widthIn: 8.5, etMm: 35, boltHoles: 5, boltCircleMm: 120.0, centreBoreMm: 72.6,
        priceCents: 0, stockQty: 0, maxLoadKg: 700,
    );
}

/** A load-index Auflage as ABE 55255 prints them: LI n only up to twice its capacity in axle load. */
function tCode(int $index, int $kg): Condition
{
    $code = 'T'.str_pad((string) ($index % 100), 2, '0', STR_PAD_LEFT);

    return Condition::ofKind($code, ConditionKind::ReifenTragfaehigkeit, sprintf('Reifen mit Tragfähigkeitsindex %d sind nur bis zu einer zulässigen Achslast von %s kg zulässig.', $index, number_format($kg, 0, ',', '.')), null, 6, $kg);
}

/**
 * @param  list<Condition>  $conditions
 * @param  list<TyreSize>|null  $sizes
 */
function decideFor(VehicleRecord $vehicle, array $conditions = [], ?WheelConfigRecord $wheel = null, ?SpeedDeratingTable $table = null, bool $withTable = true, ?array $sizes = null): FitmentVerdict
{
    $tables = FitmentFixtures::tables();
    $document = new DocumentRecord(
        id: 57, kind: 'ABE', number: '55255', revision: 1, sourcePage: 4,
        speedDerating: $withTable ? ($table ?? FitmentFixtures::deratingTable()) : null,
    );
    $row = FitmentFixtures::row(vehicleId: $vehicle->id, sizes: $sizes ?? [new TyreSize(225, 40, 19.0)], conditions: $conditions, document: $document);

    return (new FitmentResolver(
        vehicles: new InMemoryVehicleRepository([$vehicle]),
        fitments: new InMemoryFitmentRepository([$row], [$wheel ?? db8gt2()]),
        loadIndex: new LoadIndexDeriver($tables),
        speedSymbol: new SpeedSymbolDeriver($tables),
        clock: new FixedClock,
    ))->resolve($vehicle->id, FitmentFixtures::WHEEL_CONFIG_ID);
}

/* ── Without the figures: the wheel answers, the tyres wait for the papers ──────────────────────── */

it('gives the BMW 4er 3C a positive wheel verdict without axle data, and a CONDITIONAL tyre line naming 1.120 kg', function (): void {
    $verdict = decideFor(bmw4er3C(), [tCode(88, 1120)]);

    expect($verdict->wheelStatus)->toBe(VerdictStatus::Permitted)
        ->and($verdict->tyre?->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->isSellable())->toBeTrue()
        ->and($verdict->tyre?->thresholds)->toBe([[
            'textDe' => 'Reifen mit Tragfähigkeitsindex 88 sind nur bis zu einer zulässigen Achslast von 1.120 kg zulässig.',
            'maxAxleLoadKg' => 1120,
        ]]);

    $lines = implode(' ', $verdict->tyre->lines ?? []);

    expect($lines)->toContain('Vergleiche die '.kg('1.120').' mit den Feldern 8.1 (vorn) und 8.2 (hinten) deiner Zulassungsbescheinigung Teil I')
        ->and($lines)->toContain('im alten Fahrzeugschein Ziffer 16')
        ->and($lines)->toContain('Die Felge ist für '.kg('700').' je Rad geprüft')
        ->and($lines)->toContain('höchstens '.kg('1.400'))
        ->and($lines)->toContain('Höchstgeschwindigkeit (Feld T)');
});

it('is never PERMITTED while the tyre half is CONDITIONAL or UNKNOWN', function (): void {
    foreach (VerdictStatus::cases() as $wheel) {
        foreach (VerdictStatus::cases() as $tyre) {
            $combined = VerdictStatus::weaker($wheel, $tyre);

            expect($combined === VerdictStatus::Permitted)->toBe($wheel === VerdictStatus::Permitted && $tyre === VerdictStatus::Permitted);

            if (in_array($tyre, [VerdictStatus::Conditional, VerdictStatus::Unknown], true)) {
                expect($combined)->not->toBe(VerdictStatus::Permitted);
            }
        }
    }

    // And through the resolver: a document with no Auflage at all, on a car without figures.
    $verdict = decideFor(bmw4er3C());

    expect($verdict->wheelStatus)->toBe(VerdictStatus::Permitted)
        ->and($verdict->status)->toBe(VerdictStatus::Conditional);
});

/* ── With the figures: a definite answer, both constraints shown, the binding one named ────────── */

it('gives a definite answer once the figures from the papers are entered, and shows the sum', function (): void {
    // 8.1 and 8.2: 1.100 kg each; T: 250 km/h → W, which carries 95 % at 250 (ABE 55255, p. 6).
    $verdict = decideFor(bmw4er3C(1100, 1100, 250), [tCode(88, 1120)]);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->front->minLoadIndex)->toBe(89)
        ->and($verdict->front->minSpeedSymbol)->toBe('W')
        ->and(array_slice($verdict->tyre->lines ?? [], 0, 5))->toBe([
            'Vorderachse: '.kg('1.100').' ÷ 2 = '.kg('550').' je Rad.',
            'Die Felge ist für '.kg('700').' je Rad geprüft – das reicht.',
            // The document's own stated limit, on its own …
            'Laut Auflage T88 genügt Tragfähigkeitsindex 88 bis '.kg('1.120').' Achslast.',
            // … the derated requirement, on its own: 550 ÷ 0,95 = 578,9 → LI 89 (580 kg) …
            'Bei 250 km/h trägt ein Reifen mit Geschwindigkeitsindex W nur 95 % seiner Last (Tabelle auf Seite 6 im Gutachten 55255): '
                .kg('550').' ÷ 0,95 = '.kg('579').' – das verlangt Tragfähigkeitsindex 89 ('.kg('580').').',
            // … and which one binds.
            'Maßgeblich ist die Minderung bei hoher Geschwindigkeit: mindestens Tragfähigkeitsindex 89, Geschwindigkeitsindex W.',
        ])
        ->and(array_slice($verdict->tyre->lines ?? [], -1))->toBe(['Beide Achsen tragen '.kg('1.100').': vier gleiche Reifen brauchen mindestens Tragfähigkeitsindex 89.']);
});

it('lets the document’s own load-index limit bind where it is stricter, and says so', function (): void {
    // 1.180 kg at 200 km/h: no derating, 590 kg → LI 90 (600 kg). The document's limits: LI 88 to 1.120,
    // LI 89 to 1.160, LI 91 to 1.230 — the smallest that reaches 1.180 is 91, and 91 binds.
    $verdict = decideFor(bmw4er3C(1180, 1180, 200), [tCode(88, 1120), tCode(89, 1160), tCode(91, 1230)]);

    expect($verdict->front->minLoadIndex)->toBe(91)
        ->and($verdict->tyre?->lines)->toContain('Laut Auflage T91 genügt Tragfähigkeitsindex 91 bis '.kg('1.230').' Achslast.')
        ->and($verdict->tyre?->lines)->toContain('Bei 200 km/h trägt ein Reifen mit Geschwindigkeitsindex U seine volle Last: das verlangt Tragfähigkeitsindex 90 ('.kg('600').').')
        ->and($verdict->tyre?->lines)->toContain('Maßgeblich ist die Auflage T91: mindestens Tragfähigkeitsindex 91, Geschwindigkeitsindex U.');
});

it('does not know what the tyres need where the document’s limits all stop below the axle', function (): void {
    $verdict = decideFor(bmw4er3C(1300, 1300, 200), [tCode(88, 1120), tCode(89, 1160)]);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->reason?->code)->toBe(VerdictReason::TYRE_UNKNOWN)
        ->and($verdict->reason?->textDe)->toBe('Die Auflagen des Gutachtens nennen Tragfähigkeitsindizes nur bis '.kg('1.160').' Achslast; die Vorderachse trägt '.kg('1.300').'. Die Reifen können wir deshalb nicht bestätigen.');
});

/* ── The wheel's tested load, per axle, the binding axle named ─────────────────────────────────── */

it('refuses the wheel when half an axle it may go on is more than its tested load, naming the axle', function (): void {
    $verdict = decideFor(bmw4er3C(1250, 1500, 250));

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->reason?->code)->toBe(VerdictReason::WHEEL_LOAD_EXCEEDED)
        ->and($verdict->reason?->textDe)->toBe('Die Felge ist für '.kg('700').' je Rad geprüft. Maßgeblich ist die Hinterachse mit '.kg('1.500').': '.kg('750').' je Rad – mehr, als die Felge tragen darf.');

    // Exactly the tested load is fine.
    expect(decideFor(bmw4er3C(1250, 1400, 250))->status)->not->toBe(VerdictStatus::NotPermitted);
});

it('judges a rear-only size against the rear axle alone', function (): void {
    // A front axle the wheel would overload does not matter where the document puts the wheel on the rear only.
    $verdict = decideFor(bmw4er3C(1500, 1300, 250), sizes: [new TyreSize(255, 35, 19.0, axle: 'REAR')]);

    expect($verdict->status)->not->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->front->hasPermittedSizes())->toBeFalse()
        ->and(implode(' ', $verdict->tyre->lines ?? []))->toContain('Hinterachse: '.kg('1.300'))
        ->and(implode(' ', $verdict->tyre->lines ?? []))->not->toContain('Vorderachse');
});

/* ── The table: a share, a „–“, nothing — three answers ─────────────────────────────────────────── */

it('reads the table three ways: a share applies, a dash is not permitted, a missing cell is unknown', function (): void {
    $table = FitmentFixtures::deratingTable();

    $share = $table->lookup(250, 'W');
    $dash = $table->lookup(280, 'W');
    $absent = $table->lookup(280, '(Y)');

    expect($share->percent)->toBe(95)->and($share->isNotPermitted())->toBeFalse()->and($share->isAbsent())->toBeFalse()
        ->and($dash->isNotPermitted())->toBeTrue()->and($dash->required)->toBe('Y')
        ->and($absent->isAbsent())->toBeTrue();
});

it('rounds the top speed up to the next row, never down and never between rows', function (): void {
    $table = FitmentFixtures::deratingTable();

    // Up to 210 km/h no tyre loses load; 211 reads the 220 row; 235 reads 240 (91 %, not 94 % and not 92,5 %).
    expect($table->lookup(210, 'V')->percent)->toBe(100)
        ->and($table->lookup(180, 'H')->percent)->toBe(100)
        ->and($table->lookup(211, 'V')->percent)->toBe(97)
        ->and($table->lookup(235, 'V')->percent)->toBe(91)
        ->and($table->lookup(300, 'Y')->percent)->toBe(85)
        ->and($table->lookup(301, 'Y')->isAbsent())->toBeTrue();

    // Through the engine: 235 km/h → V at 91 %: 1.000 kg → 500 ÷ 0,91 = 549,5 kg → LI 88 (560 kg).
    expect(decideFor(bmw4er3C(1000, 1000, 235))->front->minLoadIndex)->toBe(88);
});

it('raises the speed symbol where the document’s table marks it „–“, and says what is required', function (): void {
    // A document whose table rules W out at 270 km/h, though a W tyre is rated for 270.
    $table = new SpeedDeratingTable([270 => ['V' => null, 'W' => null, 'Y' => 100]], 6);
    $verdict = decideFor(bmw4er3C(1100, 1100, 270), table: $table);

    expect($verdict->front->minSpeedSymbol)->toBe('Y')
        ->and($verdict->status)->toBe(VerdictStatus::Permitted)
        ->and($verdict->tyre?->lines)->toContain('Bei 270 km/h ist ein W-Reifen laut Tabelle des Gutachtens nicht zulässig, erforderlich ist Y.');
});

it('answers NOT_PERMITTED where the table rules out every symbol at the car’s speed', function (): void {
    $table = new SpeedDeratingTable([270 => ['V' => null, 'W' => null]], 6);
    $verdict = decideFor(bmw4er3C(1100, 1100, 270), table: $table);

    expect($verdict->tyre?->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->reason?->code)->toBe(VerdictReason::TYRE_NOT_PERMITTED)
        ->and($verdict->reason?->textDe)->toBe('Bei 270 km/h ist laut Tabelle des Gutachtens kein Reifen mit Geschwindigkeitsindex W zulässig.');
});

it('answers UNKNOWN above the table, and for a document that prints no table above 210 km/h', function (): void {
    $above = decideFor(bmw4er3C(1100, 1100, 310));
    $noTable = decideFor(bmw4er3C(1100, 1100, 250), withTable: false);
    $slow = decideFor(bmw4er3C(1100, 1100, 200), withTable: false);

    expect($above->status)->toBe(VerdictStatus::Unknown)
        ->and($above->reason?->textDe)->toBe('Für 310 km/h nennt die Tabelle des Gutachtens für Geschwindigkeitsindex (Y) keinen Wert. Die Reifen können wir deshalb nicht bestätigen.')
        ->and($noTable->status)->toBe(VerdictStatus::Unknown)
        ->and($noTable->reason?->textDe)->toBe('Das Gutachten druckt keine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit. Für 250 km/h können wir die Reifen deshalb nicht bestätigen.')
        // Up to 210 km/h no table is needed: no tyre loses load there.
        ->and($slow->status)->toBe(VerdictStatus::Permitted);
});

/* ── The free cross-check: every load-index limit is twice a capacity from the table ─────────────── */

it('finds every load-index Auflage of ABE 55255 exactly twice the capacity of its index', function (): void {
    // The fourteen codes the operator's review lists (ABE 55255): code → kg.
    $printed = ['T84' => 1000, 'T85' => 1030, 'T87' => 1090, 'T88' => 1120, 'T89' => 1160, 'T91' => 1230, 'T92' => 1260,
        'T93' => 1300, 'T94' => 1340, 'T95' => 1380, 'T96' => 1420, 'T98' => 1500, 'T99' => 1550, 'T00' => 1600];

    foreach ($printed as $code => $kg) {
        $index = (int) substr($code, 1) ?: 100;

        expect($kg)->toBe(2 * ReferenceTables::LOAD_INDEX_CAPACITY_KG[$index], "{$code}: {$kg} kg")
            ->and((new LoadIndexDeriver(FitmentFixtures::tables()))->indexForCapacity(intdiv($kg, 2))?->index)->toBe($index);
    }
});

it('does not know what the tyres need under a limit that is not twice a capacity', function (): void {
    $verdict = decideFor(bmw4er3C(1100, 1100, 200), [Condition::ofKind('T88', ConditionKind::ReifenTragfaehigkeit, 'Reifen mit Tragfähigkeitsindex 88 …', null, 6, 1125)]);

    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->reason?->textDe)->toContain('Die Auflage T88 nennt '.kg('1.125'));
});

/* ── The rest ─────────────────────────────────────────────────────────────────────────────────── */

it('keeps the tyre half conditional where the document restricts the tyre choice itself', function (): void {
    $brands = new Condition(code: 'R01', severity: Severity::Restriction, textDe: 'Nur Reifen der im Gutachten genannten Hersteller zulässig.', affectsTyreChoice: true);
    $verdict = decideFor(bmw4er3C(1100, 1100, 250), [$brands]);

    expect($verdict->wheelStatus)->toBe(VerdictStatus::Permitted)
        ->and($verdict->tyre?->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->status)->toBe(VerdictStatus::Conditional);
});

it('carries both halves through the snapshot, and reads an older snapshot without them', function (): void {
    $verdict = decideFor(bmw4er3C(), [tCode(88, 1120)]);
    $restored = FitmentVerdict::fromArray($verdict->toArray());

    expect($restored->wheelStatus)->toBe(VerdictStatus::Permitted)
        ->and($restored->tyre?->status)->toBe(VerdictStatus::Conditional)
        ->and($restored->tyre?->lines)->toBe($verdict->tyre?->lines)
        ->and($restored->conditions[0]->maxAxleLoadKg)->toBe(1120);

    $old = $verdict->toArray();
    unset($old['wheelStatus'], $old['tyreCheck']);

    expect(FitmentVerdict::fromArray($old)->tyre)->toBeNull()
        ->and(FitmentVerdict::fromArray($old)->wheelStatus)->toBeNull();
});
