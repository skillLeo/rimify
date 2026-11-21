<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Domain\Fitment\Derivation\SpeedLoadTable;
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
 * a tyre verdict is never positive without the car's axle loads and top speed — without them it is „Noch nicht
 * bestätigt“, the absence of a grant, never a grant with conditions (D-286); the answer is the weaker.
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
function decideFor(VehicleRecord $vehicle, array $conditions = [], ?WheelConfigRecord $wheel = null, ?array $sizes = null, ?int $axleLimitKg = null): FitmentVerdict
{
    $tables = FitmentFixtures::tables();
    $document = new DocumentRecord(
        id: 57, kind: 'ABE', number: '55255', revision: 1, sourcePage: 4,
        axleLimitKg: $axleLimitKg,
    );
    $row = FitmentFixtures::row(vehicleId: $vehicle->id, sizes: $sizes ?? [new TyreSize(225, 40, 19.0)], conditions: $conditions, document: $document);

    return (new FitmentResolver(
        vehicles: new InMemoryVehicleRepository([$vehicle]),
        fitments: new InMemoryFitmentRepository([$row], [$wheel ?? db8gt2()]),
        speedSymbol: new SpeedSymbolDeriver($tables),
        clock: new FixedClock,
    ))->resolve($vehicle->id, FitmentFixtures::WHEEL_CONFIG_ID);
}

/* ── Without the figures: the wheel answers, the tyres are „Noch nicht bestätigt“ until the papers are in ─── */

/* ── With the figures: a definite answer, both constraints shown, the binding one named ────────── */

/* ── Always shown: the answer and its document; the sum on one click (the decision of 29.09.2026) ─── */

it('keeps the summary, the basis and the flag in the frozen verdict', function (): void {
    $verdict = decideFor(bmw4er3C(1210, 1235, 280));
    $restored = FitmentVerdict::fromArray($verdict->toArray());

    expect($restored->tyre?->summary)->toBe($verdict->tyre?->summary)
        ->and($restored->tyre?->basis)->toBe($verdict->tyre?->basis)
        ->and($restored->tyre?->lines)->toBe($verdict->tyre?->lines);
});

/* ── The wheel's tested load, per axle, the binding axle named ─────────────────────────────────── */

it('refuses the wheel when half an axle it may go on is more than its tested load, naming the axle', function (): void {
    $verdict = decideFor(bmw4er3C(1250, 1500, 250));

    expect($verdict->status)->toBe(VerdictStatus::NotPermitted)
        ->and($verdict->reason?->code)->toBe(VerdictReason::WHEEL_LOAD_EXCEEDED)
        ->and($verdict->reason?->textDe)->toBe('Die Felge ist für '.kg('700').' je Rad geprüft. Maßgeblich ist die zulässige Achslast der Hinterachse: '.kg('1.500').' aus unseren Fahrzeugdaten, also '.kg('750').' je Rad – mehr, als die Felge tragen darf.');

    // Exactly the tested load is fine.
    expect(decideFor(bmw4er3C(1250, 1400, 250))->status)->not->toBe(VerdictStatus::NotPermitted);

    // Where the binding load is the customer's own, the refusal says so: a mistyped figure is theirs to correct (the
    // interaction review of D-291).
    $typed = decideFor((PapersFigures::tryFrom(1610, null, 250) ?? throw new LogicException)->applyTo(bmw4er3C(1100, 1100)));

    expect($typed->status)->toBe(VerdictStatus::NotPermitted)
        ->and($typed->reason?->textDe)->toBe('Die Felge ist für '.kg('700').' je Rad geprüft. Maßgeblich ist die zulässige Achslast der Vorderachse: '.kg('1.610').' nach deiner Angabe aus Feld 8.1, also '.kg('805').' je Rad – mehr, als die Felge tragen darf.');
});

/* ── ETRTO's table (D-459): a share, a „–“, nothing — three answers ──────────────────────────────── */

it('reads the table three ways: a share applies, a dash is not permitted, a missing cell is unknown', function (): void {
    $table = SpeedLoadTable::etrto();

    $share = $table->lookup(250, 'W');
    $dash = $table->lookup(280, 'W');
    $absent = $table->lookup(280, '(W)');

    expect($share->percent)->toBe(95)->and($share->isNotPermitted())->toBeFalse()->and($share->isAbsent())->toBeFalse()
        ->and($dash->isNotPermitted())->toBeTrue()->and($dash->required)->toBe('Y')
        ->and($absent->isAbsent())->toBeTrue();
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

/* ── Whole numbers only: no float decides a tyre ──────────────────────────────────────────────── */

it('takes the decision in integers — no float, no division, no rounding in the path', function (): void {
    $method = new ReflectionMethod(LoadIndexDeriver::class, 'forAxleAt');

    foreach ($method->getParameters() as $parameter) {
        expect((string) $parameter->getType())->toBe('int');
    }

    $lines = array_slice(file((string) $method->getFileName()) ?: [], $method->getStartLine() - 1, $method->getEndLine() - $method->getStartLine() + 1);
    $code = '';

    foreach (token_get_all('<?php '.implode('', $lines)) as $token) {
        // The source without its comments: the docblock may talk about floats, the code may not use one.
        if (is_array($token) && in_array($token[0], [T_COMMENT, T_DOC_COMMENT], true)) {
            continue;
        }

        $code .= is_array($token) ? $token[1] : $token;
    }

    expect($code)->not->toMatch('~(?<![/*])/(?![/*])~')
        ->and($code)->not->toMatch('/\bfloat\b|\bround\s*\(|\bceil\s*\(|\bfloor\s*\(|\bfdiv\s*\(|\bintdiv\s*\(/i');
});

/* ── ETRTO's row boundaries, as ABE 55255 prints them too ──────────────────────────────────────── */

/* ── The rest ─────────────────────────────────────────────────────────────────────────────────── */

it('keeps the tyre half conditional where the document restricts the tyre choice itself', function (): void {
    $brands = new Condition(code: 'R01', severity: Severity::Restriction, textDe: 'Nur Reifen der im Gutachten genannten Hersteller zulässig.', affectsTyreChoice: true);
    $verdict = decideFor(bmw4er3C(1100, 1100, 250), [$brands]);

    expect($verdict->wheelStatus)->toBe(VerdictStatus::Permitted)
        ->and($verdict->tyre?->status)->toBe(VerdictStatus::Conditional)
        ->and($verdict->status)->toBe(VerdictStatus::Conditional);
});

it('asks four identical tyres for the higher speed symbol where the document prints a stricter one for the rear', function (): void {
    // One size, printed per axle: W at the front, Y at the rear. Four of a kind must meet the rear's Y.
    $verdict = decideFor(bmw4er3C(1100, 1100, 200), sizes: [
        new TyreSize(225, 40, 19.0, documentMinSpeedSymbol: 'W', axle: 'FRONT'),
        new TyreSize(225, 40, 19.0, documentMinSpeedSymbol: 'Y', axle: 'REAR'),
    ]);

    expect($verdict->front->minSpeedSymbol)->toBe('W')
        ->and($verdict->rear->minSpeedSymbol)->toBe('Y')
        ->and($verdict->tyre?->summary)->toEndWith('Geschwindigkeitsindex Y.');
});
