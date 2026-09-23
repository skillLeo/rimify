<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ApprovalKind;
use App\Enums\Axle;
use App\Enums\ConflictKind;
use App\Enums\ConflictStatus;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Models\ConditionCode;
use App\Models\Fitment;
use App\Models\FitmentConflict;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelModel;
use App\Support\MakeName;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Nine demonstration approval documents, and the fitment rows that hang off them.
 *
 * The fitment row is the primary object in this database: compatibility is a relationship between
 * a vehicle, a wheel configuration and the document that permits it, never an attribute of the
 * wheel. Everything the customer sees about fitment is read from these rows.
 *
 * None of these documents exists, and none of them says otherwise (docs/phase0/ACCURACY.md D3):
 * the issuer is `Prüfstelle (Demodaten)`, never a real testing body, the report numbers are
 * `DEMO-…`, and no document carries a KBA number — an ABE is the one kind that is defined by one,
 * so every demo document is a Teilegutachten. A database seeded before this rule has its documents
 * renamed in place, found by their former report numbers.
 *
 * Demo fitments are still physically honest. A wheel is paired only with a vehicle whose factory
 * bolt pattern it shares and whose hub fits through its centre bore (VEHICLES, from
 * docs/reviews/accuracy-map-calculator-catalogue.md §3.1); a vehicle whose pattern or hub is not
 * known gets no fitment at all. The MOTEC is further limited to the makes its real ABE 53810 names
 * for that bolt pattern (docs/reviews/accuracy-research-motec.md §2.4). On a database seeded before
 * the filter, a demo fitment that fails it is set to `retired`, never deleted: fitments are RESTRICT
 * (R-05) and frozen order snapshots name some of them (R-12).
 *
 * A fitment row also carries the Mittenlochbohrung its document states for that vehicle, because
 * the bore is a relationship and not a rim attribute (CLAUDE.md §1): the MOTEC's 5 × 112 executions
 * are catalogued at 66,5 mm and its ABE prints 66,6 mm for the cars it covers without a centring
 * ring, and a customer with such a car must read the document's figure. Every other demo document
 * states none, and NULL is exactly that statement (documentCentreBore()).
 *
 * Tyre sizes are no longer taken from the rim diameter alone (a 205/55 R16 "approved" on a
 * Cayenne). A size is seeded only when the rim is at least the car's smallest factory rim, the
 * tyre suits the rim's width, and its diameter is close to the car's factory size (TYRES,
 * tyreSizes()). Where the factory size is not known the fitment has no tyre size, and the engine
 * answers that nothing is mountable rather than guessing.
 *
 * The fifth document disagrees with the first, on purpose. It claims a fitment that the first
 * document permits freely requires entry in the vehicle papers — the one disagreement the system
 * treats as a hard block, because there is no safe way to average "you need a TÜV appointment"
 * with "you do not". It is seeded as a DRAFT row plus an open, blocking conflict, so the
 * storefront is unaffected and the admin panel has a genuine unresolved conflict on day one.
 *
 * The last four cover the demo catalogue's remaining ranges, so a model with a photograph (the
 * MCR4) also has a car it may go on.
 */
class ApprovalSeeder extends Seeder
{
    /** Every demo document's issuer: no real organisation. */
    public const ISSUER = 'Prüfstelle (Demodaten)';

    /**
     * slot => [report number, the report number it had before, months since issue, page count].
     *
     * @var array<string, array{0: string, 1: string, 2: int, 3: int}>
     */
    private const DOCUMENTS = [
        'range1' => ['DEMO-0001', 'TG-2026-0001', 8, 14],
        'range2' => ['DEMO-0002', 'TG-2026-0002', 8, 18],
        'range3' => ['DEMO-0003', 'ABE-46120', 14, 9],
        'range4' => ['DEMO-0004', 'TG-2026-0004', 3, 11],
        'conflicting' => ['DEMO-0005', 'TG-2026-0005', 1, 7],
        'range6' => ['DEMO-0006', 'TG-2026-0006', 6, 12],
        'range7' => ['DEMO-0007', 'TG-2026-0007', 5, 10],
        'range8' => ['DEMO-0008', 'TG-2026-0008', 4, 16],
        'motec' => ['DEMO-0009', 'TG-2026-0009', 2, 12],
    ];

    /**
     * Which wheel models each document covers, by slug — the same groups as before the rename.
     *
     * One report per range, which is how approvals are actually commissioned — never one report
     * per car. The conflicting document re-states a single fitment of the first range and nothing
     * else, so the admin's conflict queue opens on one clear disagreement.
     *
     * @var array<string, list<string>>
     */
    public const COVERAGE = [
        'range1' => ['demo-fuenfspeiche-f-01', 'demo-zehnspeiche-z-02'],
        'range2' => ['demo-zehnspeiche-z-03', 'demo-siebenspeiche-s-04', 'demo-fuenfspeiche-f-05', 'demo-fuenfspeiche-f-06', 'demo-fuenfspeiche-f-20'],
        'range3' => ['demo-zehnspeiche-z-07', 'demo-zehnspeiche-z-08'],
        'range4' => ['demo-vielspeiche-v-09', 'demo-vielspeiche-v-10', 'demo-fuenfspeiche-f-11', 'demo-siebenspeiche-s-12'],
        'conflicting' => ['demo-fuenfspeiche-f-01', 'demo-zehnspeiche-z-02'],
        'range6' => ['demo-zehnspeiche-z-13', 'demo-fuenfspeiche-f-14'],
        'range7' => ['demo-fuenfspeiche-f-15', 'demo-zehnspeiche-z-16'],
        'range8' => ['demo-fuenfspeiche-f-17', 'demo-zehnspeiche-z-18', 'demo-zehnspeiche-z-19'],
        'motec' => ['motec-mcr4-ultimate'],
    ];

    /**
     * Each seeded vehicle generation's factory bolt pattern and hub diameter, keyed
     * `make|model|type`: [bolt holes, bolt circle mm, hub mm]. From the calculator/catalogue map's
     * per-vehicle table (§3.1). A hub of NULL is one the map does not assert (BMW Z8); a
     * generation that is not listed is one whose pattern is not certain (Opel Mokka B, Ford Puma).
     * Either way the vehicle gets no demo fitment.
     *
     * @var array<string, array{0: int, 1: float, 2: float|null}>
     */
    public const VEHICLES = [
        'Audi|RS 4|B9' => [5, 112.0, 66.5],
        'BMW|3er|E36' => [5, 120.0, 72.6],
        'BMW|Z8|E52' => [5, 120.0, null],
        'Audi|RS 4|B5' => [5, 112.0, 57.1],
        'Audi|RS 4|B7' => [5, 112.0, 57.1],
        'Volkswagen|Fox|5Z' => [4, 100.0, 57.1],
        'Mercedes-Benz|C-Klasse|W205' => [5, 112.0, 66.6],
        'Volkswagen|Golf|MK8' => [5, 112.0, 57.1],
        'Porsche|911|992' => [5, 130.0, 71.6],
        'Opel|Astra|K' => [5, 105.0, 56.6],
        'Ford|Focus|MK4' => [5, 108.0, 63.4],
        'Škoda|Octavia|NX' => [5, 112.0, 57.1],
        'BMW|3er|G20' => [5, 112.0, 66.5],
        'Mercedes-Benz|A-Klasse|W177' => [5, 112.0, 66.6],
        'Audi|A3|8Y' => [5, 112.0, 57.1],
        'Audi|A4|B9' => [5, 112.0, 66.5],
        'Audi|Q5|FY' => [5, 112.0, 66.5],
        'Audi|TT|8S' => [5, 112.0, 57.1],
        'BMW|1er|F40' => [5, 112.0, 66.5],
        'BMW|4er|G22' => [5, 112.0, 66.5],
        'BMW|4er|G23' => [5, 112.0, 66.5],
        'BMW|5er|G30' => [5, 112.0, 66.5],
        'BMW|5er|G31' => [5, 112.0, 66.5],
        'BMW|X3|G01' => [5, 112.0, 66.5],
        'Volkswagen|Polo|AW' => [5, 100.0, 57.1],
        'Volkswagen|Passat|B8' => [5, 112.0, 57.1],
        'Volkswagen|Tiguan|AD1' => [5, 112.0, 57.1],
        'Volkswagen|T-Roc|A11' => [5, 112.0, 57.1],
        'Mercedes-Benz|CLA|C118' => [5, 112.0, 66.6],
        'Mercedes-Benz|E-Klasse|W213' => [5, 112.0, 66.6],
        'Mercedes-Benz|E-Klasse|S213' => [5, 112.0, 66.6],
        'Mercedes-Benz|GLC|X254' => [5, 112.0, 66.6],
        'Porsche|718|982' => [5, 130.0, 71.6],
        'Porsche|Macan|95B' => [5, 112.0, 66.5],
        'Porsche|Cayenne|9YA' => [5, 130.0, 71.6],
        'Porsche|Cayenne|9YB' => [5, 130.0, 71.6],
        'Opel|Corsa|F' => [4, 108.0, 65.1],
        'Opel|Insignia|B' => [5, 120.0, 67.1],
        'Ford|Fiesta|MK8' => [4, 108.0, 63.4],
        'Ford|Kuga|MK3' => [5, 108.0, 63.4],
        'Škoda|Fabia|PJ' => [5, 100.0, 57.1],
        'Škoda|Superb|3V' => [5, 112.0, 57.1],
        'Škoda|Kodiaq|NS' => [5, 112.0, 57.1],
        'Škoda|Enyaq|5AZ' => [5, 112.0, 57.1],
    ];

    /**
     * Each variant's factory tyre, keyed `make|variant`: [[width, aspect, rim], smallest factory
     * rim in inches]. A demo tyre size is seeded on a fitment only when the wheel's rim is at least
     * that large and the tyre's diameter is close to this one (tyreSizes()) — a plausibility filter
     * for demonstration data, not a rule anyone may drive by. A variant that is not listed is one
     * whose factory size is not certain here: its fitments carry no tyre size.
     *
     * @var array<string, array{0: array{0: int, 1: int, 2: int}, 1: int}>
     */
    public const TYRES = [
        'Audi|RS 4 Avant Quattro' => [[265, 35, 19], 19],
        'BMW|3er Coupé' => [[225, 50, 16], 16],
        'Audi|RS4 2.7 Avant' => [[255, 35, 18], 18],
        'Audi|RS4 4.2 FSI Quattro' => [[255, 40, 18], 18],
        'Volkswagen|Golf GTI' => [[225, 40, 18], 17],
        'Ford|Focus ST' => [[235, 40, 18], 18],
        'Škoda|Octavia RS' => [[225, 40, 18], 18],
        'BMW|330i Limousine' => [[225, 45, 18], 17],
        'Mercedes-Benz|A 200' => [[205, 55, 16], 16],
        'Audi|A3 Sportback 35 TFSI' => [[205, 55, 16], 16],
        'Audi|A3 Limousine 40 TFSI' => [[225, 45, 17], 17],
        'Audi|S3 Sportback quattro' => [[225, 40, 18], 18],
        'Audi|A4 Avant 40 TDI quattro' => [[225, 50, 17], 17],
        'Audi|A4 Limousine 45 TFSI' => [[225, 50, 17], 17],
        'Audi|Q5 40 TDI quattro' => [[235, 60, 18], 18],
        'Audi|SQ5 TDI' => [[255, 45, 20], 20],
        'Audi|TT Coupé 45 TFSI' => [[245, 40, 18], 18],
        'Audi|TT RS Coupé' => [[255, 35, 19], 19],
        'BMW|118i' => [[205, 55, 16], 16],
        'BMW|M135i xDrive' => [[225, 40, 18], 18],
        'BMW|420i Coupé' => [[225, 45, 18], 18],
        'BMW|M440i xDrive Coupé' => [[225, 45, 18], 18],
        'BMW|430i Cabrio' => [[225, 45, 18], 18],
        'BMW|520d Limousine' => [[225, 55, 17], 17],
        'BMW|540i xDrive Touring' => [[245, 45, 18], 18],
        'BMW|X3 xDrive20d' => [[225, 60, 18], 18],
        'Volkswagen|Passat Variant 2.0 TDI' => [[215, 55, 17], 17],
        'Volkswagen|Passat Variant 2.0 TSI 4MOTION' => [[235, 45, 18], 18],
        'Volkswagen|Tiguan 1.5 TSI' => [[215, 65, 17], 17],
        'Volkswagen|T-Roc 1.5 TSI' => [[215, 55, 17], 17],
        'Mercedes-Benz|E 220 d Limousine' => [[225, 55, 17], 17],
        'Mercedes-Benz|E 300 de T-Modell' => [[245, 45, 18], 18],
        'Mercedes-Benz|GLC 220 d 4MATIC' => [[235, 60, 18], 18],
        'Mercedes-Benz|GLC 300 4MATIC' => [[235, 60, 18], 18],
        'Opel|Insignia Sports Tourer 2.0 D' => [[225, 55, 17], 17],
        'Opel|Insignia GSi 4x4' => [[245, 35, 20], 20],
        'Ford|Kuga 1.5 EcoBoost' => [[225, 65, 17], 17],
        'Škoda|Superb Combi 2.0 TDI' => [[215, 55, 17], 17],
        'Škoda|Superb Combi 2.0 TSI 4x4' => [[235, 45, 18], 18],
        'Škoda|Kodiaq 2.0 TDI 4x4' => [[235, 55, 18], 18],
        'Škoda|Kodiaq RS' => [[235, 45, 20], 20],
        'Škoda|Enyaq iV 60' => [[235, 55, 19], 19],
    ];

    /**
     * The makes ABE 53810 names for each MCR4 execution, by bolt circle (research report §2.4,
     * the annexes' "Hersteller" lines). Stricter than the union of all 34 makes: a make counts
     * only for the execution its own annex covers. Porsche is in none of them.
     *
     * @var array<string, list<string>>
     */
    public const MOTEC_MAKES = [
        '112.0' => ['Audi', 'BMW', 'Infiniti', 'Mercedes-Benz', 'MG', 'MINI', 'SEAT', 'Škoda', 'Ssangyong', 'Toyota', 'Volkswagen'],
        '108.0' => ['Citroën', 'DS', 'Ford', 'Jaguar', 'Lynk & Co', 'Opel', 'Peugeot', 'Volvo'],
        '114.3' => ['Chrysler', 'Citroën', 'Dacia', 'Dodge', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Lancia', 'Lexus', 'Mazda', 'Mitsubishi', 'Nissan', 'Peugeot', 'Renault', 'Suzuki', 'Tesla', 'Toyota'],
        '120.0' => ['BMW', 'MINI'],
    ];

    /**
     * The makes whose annexes use an MCR4 5 × 112 execution WITHOUT a centring ring. For those cars
     * the ABE prints its own Mittenloch-ø in the marking `5/112/66,6`, and that figure — not the
     * 66,5 mm of Motec's catalogue — is what the document states about this wheel on that car
     * (accuracy-research-motec.md §2.4, "Executions covered" and the annex table: annexes 4, 5, 6
     * and 7 read "no ring"; §2.5.1 records the two figures and their sources).
     *
     * Audi is deliberately absent although two no-ring annexes name it: the same make also appears
     * in the ringed annexes (2, 3 and 14), so the document does not say which of the two applies to
     * a given Audi. Where a document is ambiguous the row states no bore at all, and the storefront
     * shows the rim's own figure labelled as the rim's (CLAUDE.md §2).
     *
     * A ringed annex is never a bore. "Ø66,45 → Ø57,1" is the centring ring's diameter, not the
     * wheel's Mittenlochbohrung, and seeding it as one would print a figure on the product page
     * that no document states about the rim.
     *
     * @var list<string>
     */
    public const MOTEC_NO_RING_MAKES = ['BMW', 'Infiniti', 'Mercedes-Benz', 'MINI', 'Ssangyong', 'Toyota'];

    /** The bore those annexes print for the 5 × 112 executions, in millimetres. */
    public const MOTEC_NO_RING_BORE_MM = 66.60;

    /**
     * Common car tyre sizes per rim diameter, [width, aspect]: the pool a demo fitment's sizes are
     * chosen from, per car, by the rules in tyreSizes().
     *
     * @var array<int, list<array{0: int, 1: int}>>
     */
    private const TYRE_POOL = [
        16 => [[205, 55], [205, 60], [215, 60], [215, 65]],
        17 => [[225, 45], [225, 50], [215, 55], [225, 55], [215, 65], [225, 65], [235, 65]],
        18 => [[225, 40], [235, 40], [245, 40], [225, 45], [235, 45], [245, 45], [235, 50], [225, 55], [235, 55], [225, 60], [235, 60]],
        19 => [[235, 35], [245, 35], [255, 35], [265, 35], [235, 40], [245, 40], [255, 40], [245, 45], [235, 50], [245, 50], [255, 50], [235, 55]],
        20 => [[235, 30], [245, 30], [255, 30], [275, 30], [245, 35], [255, 35], [265, 35], [255, 40], [235, 45], [245, 45], [255, 45], [265, 45]],
    ];

    /**
     * How far a demo size's diameter may lie from the factory size's: the rule of thumb the
     * Felgenrechner shows (−2,5 % to +1,5 %), used here only to keep demonstration data plausible.
     */
    private const TYRE_BAND = [-0.025, 0.015];

    public function run(): void
    {
        // Guarded on the data rather than on `callOnce`, which Laravel tracks in a process-static
        // array and which therefore lies to the second test of a RefreshDatabase run.
        if (WheelConfig::query()->doesntExist()) {
            $this->call(CatalogueSeeder::class);
        }

        if (Vehicle::query()->doesntExist()) {
            $this->call(VehicleSeeder::class);
        }

        $documents = $this->seedDocuments();

        // R-03: a vehicle whose axle loads or top speed we could not parse never appears in a
        // listing as permitted, so it gets no fitment rows here either.
        $vehicles = Vehicle::query()
            ->where('needs_review', false)
            ->whereNotNull('axle_load_front_kg')
            ->whereNotNull('axle_load_rear_kg')
            ->whereNotNull('max_speed_kmh')
            ->orderBy('id')
            ->get();

        foreach ($documents as $slot => $document) {
            $this->seedFitments($document, $vehicles, $slot);
            $this->reconcile($document, $slot);
        }

        $this->seedConflict($documents['conflicting'], $documents['range1']);
    }

    /**
     * Whether a demo document may pair this wheel with this vehicle: the same factory bolt
     * pattern, a known hub that fits through the wheel's centre bore, and — for the MCR4 — a make
     * its ABE names for that pattern. Anything not known answers no.
     */
    public static function compatible(
        string $make,
        string $model,
        ?string $type,
        int $boltHoles,
        float $boltCircleMm,
        float $centreBoreMm,
        bool $motec = false,
    ): bool {
        $factory = self::VEHICLES[$make.'|'.$model.'|'.($type ?? '')] ?? null;

        if ($factory === null) {
            return false;
        }

        [$holes, $circle, $hub] = $factory;

        if ($hub === null || $holes !== $boltHoles || abs($circle - $boltCircleMm) > 0.05) {
            return false;
        }

        // The hub must go through the bore; a centring ring can close a larger bore, nothing can
        // open a smaller one. The bore compared is the one the document states for THIS car where
        // it states one: the rim's catalogue figure is not the document's claim, and where the two
        // differ the document wins (R-06).
        if ((self::documentCentreBore($make, $boltCircleMm, $motec) ?? $centreBoreMm) + 0.005 < $hub) {
            return false;
        }

        if (! $motec) {
            return true;
        }

        foreach (self::MOTEC_MAKES[number_format($boltCircleMm, 1, '.', '')] ?? [] as $allowed) {
            if (MakeName::same(MakeName::normalise($allowed), MakeName::normalise($make))) {
                return true;
            }
        }

        return false;
    }

    /**
     * The Mittenlochbohrung this demo document states for THIS vehicle, or null where it states
     * none — which is the common case and the honest one.
     *
     * The bore is a relationship, not a rim attribute (CLAUDE.md §1): the same casting is measured
     * against the car it was tested on, so the figure belongs on the fitment row. Only the MOTEC
     * document states one here, and only for the makes its 5 × 112 annexes cover without a centring
     * ring; every other demo document is silent, and silence is what `fitments.centre_bore_mm`
     * records as NULL.
     */
    public static function documentCentreBore(string $make, float $boltCircleMm, bool $motec = false): ?float
    {
        if (! $motec || abs($boltCircleMm - 112.0) > 0.05) {
            return null;
        }

        foreach (self::MOTEC_NO_RING_MAKES as $allowed) {
            if (MakeName::same(MakeName::normalise($allowed), MakeName::normalise($make))) {
                return self::MOTEC_NO_RING_BORE_MM;
            }
        }

        return null;
    }

    /**
     * The demo tyre sizes a fitment of this wheel may name on this variant, as [width, aspect],
     * closest first, at most two (two where possible, so the intersection rule — where two
     * documents agree only on the sizes both name — stays testable from seeded data).
     *
     * A size qualifies when the rim is at least the variant's smallest factory rim, the tyre's
     * width suits the rim's (roughly the ETRTO range: 70 to 95 % of the section width), and its
     * diameter lies within TYRE_BAND of the factory size's. None qualifies when the factory size is
     * not known: then the fitment names no tyre size, and the engine says nothing is mountable
     * rather than guessing.
     *
     * @return list<array{0: int, 1: int}>
     */
    public static function tyreSizes(string $make, string $variant, float $rimIn, float $rimWidthIn): array
    {
        $factory = self::TYRES[$make.'|'.$variant] ?? null;

        if ($factory === null || $rimIn < $factory[1]) {
            return [];
        }

        [[$width, $aspect, $rim]] = $factory;
        $reference = self::tyreDiameterMm($width, $aspect, (float) $rim);
        [$below, $above] = self::TYRE_BAND;

        $fits = [];

        foreach (self::TYRE_POOL[(int) round($rimIn)] ?? [] as [$tyreWidth, $tyreAspect]) {
            $sectionIn = $tyreWidth / 25.4;

            if ($rimWidthIn < 0.70 * $sectionIn - 0.001 || $rimWidthIn > 0.95 * $sectionIn + 0.001) {
                continue;
            }

            $delta = self::tyreDiameterMm($tyreWidth, $tyreAspect, $rimIn) / $reference - 1;

            if ($delta < $below || $delta > $above) {
                continue;
            }

            $fits[] = [$tyreWidth, $tyreAspect, abs($delta)];
        }

        usort($fits, static fn (array $a, array $b): int => [$a[2], $a[0], $a[1]] <=> [$b[2], $b[0], $b[1]]);

        return array_map(static fn (array $fit): array => [$fit[0], $fit[1]], array_slice($fits, 0, 2));
    }

    /** A tyre's outside diameter from its size: rim plus two sidewalls. */
    public static function tyreDiameterMm(int $widthMm, int $aspect, float $rimIn): float
    {
        return $rimIn * 25.4 + 2 * $widthMm * $aspect / 100;
    }

    /**
     * @return array{
     *     range1: ApprovalDocument,
     *     range2: ApprovalDocument,
     *     range3: ApprovalDocument,
     *     range4: ApprovalDocument,
     *     conflicting: ApprovalDocument,
     *     range6: ApprovalDocument,
     *     range7: ApprovalDocument,
     *     range8: ApprovalDocument,
     *     motec: ApprovalDocument
     * }
     */
    private function seedDocuments(): array
    {
        $out = [];

        foreach (self::DOCUMENTS as $slot => [$reportNumber, $formerNumber, $months, $pages]) {
            $out[$slot] = $this->document($reportNumber, $formerNumber, now()->subMonths($months)->toDateString(), $pages);
        }

        /** @var array{range1: ApprovalDocument, range2: ApprovalDocument, range3: ApprovalDocument, range4: ApprovalDocument, conflicting: ApprovalDocument, range6: ApprovalDocument, range7: ApprovalDocument, range8: ApprovalDocument, motec: ApprovalDocument} $out */
        return $out;
    }

    /**
     * The document under its report number, else under the number it had before (renamed in place,
     * so every fitment and frozen order keeps pointing at the same row), else new.
     */
    private function document(string $reportNumber, string $formerNumber, string $issuedOn, int $pageCount): ApprovalDocument
    {
        $document = ApprovalDocument::query()->where('report_number', $reportNumber)->first()
            ?? ApprovalDocument::query()->where('report_number', $formerNumber)->first()
            ?? new ApprovalDocument;

        $document->fill([
            'report_number' => $reportNumber,
            'kind' => ApprovalKind::Teilegutachten->value,
            // An ABE's number is the KBA's; a demonstration claims none (finding #27).
            'kba_number' => null,
            'approval_mark' => null,
            'issuer' => self::ISSUER,
            'issued_on' => $issuedOn,
            'revision' => 1,
            'valid_from' => $issuedOn,
            // NULL means still valid. Never today's date — that would expire every current
            // document the moment the clock ticked past midnight (R-02).
            'valid_to' => null,
            'pdf_key' => sprintf('gutachten/%s.pdf', strtolower($reportNumber)),
            'pdf_sha256' => hash('sha256', $reportNumber),
            'page_count' => $pageCount,
            'status' => DocumentStatus::Published->value,
        ])->save();

        return $document;
    }

    /**
     * The wheel configurations a document covers, in id order, each with its position in that
     * list (which decides entry and conditions, as it always has).
     *
     * @return Collection<int, WheelConfig>
     */
    private function configsFor(string $slot): Collection
    {
        $slugs = self::COVERAGE[$slot] ?? [];

        if ($slugs === []) {
            return new Collection;
        }

        return WheelConfig::query()
            ->whereIn('wheel_model_id', WheelModel::query()->whereIn('slug', $slugs)->select('id'))
            ->orderBy('id')
            ->get()
            ->values();
    }

    /**
     * Each document covers the wheels of one range, which is how approvals actually work: a
     * manufacturer commissions one report covering its own range, not a report per car.
     *
     * Per vehicle, the configurations that pass the physical filter are taken six at a time from a
     * position that moves with the vehicle, wrapping round, so a car with only a few matching
     * wheels still gets them.
     *
     * @param  Collection<int, Vehicle>  $vehicles
     */
    private function seedFitments(ApprovalDocument $document, Collection $vehicles, string $slot): void
    {
        $configs = $this->configsFor($slot);

        if ($configs->isEmpty()) {
            return;
        }

        $draft = $slot === 'conflicting';
        $motec = $slot === 'motec';
        $now = now();

        // Which rows this document already has, as one query. Written as a bulk insert rather than
        // a row-at-a-time `updateOrCreate` because the demo catalogue is around 1,500 fitments,
        // each with tyre sizes and conditions: per-row round trips turn a three-second seed into a
        // minute, and a slow seeder is a slow test suite for the rest of the project.
        $existing = $this->fitmentIds($document->id);

        $rows = [];
        /** @var array<string, array{entry: bool, offset: int}> $meta */
        $meta = [];

        foreach ($vehicles as $vehicleOffset => $vehicle) {
            /** @var list<array{0: int, 1: WheelConfig}> $matching position in the document's list, config */
            $matching = [];

            foreach ($configs as $position => $config) {
                if (self::compatible(
                    $vehicle->make,
                    $vehicle->model,
                    $vehicle->type_designation,
                    (int) $config->bolt_holes,
                    (float) $config->bolt_circle_mm,
                    (float) $config->centre_bore_mm,
                    $motec,
                )) {
                    $matching[] = [$position, $config];
                }
            }

            $count = count($matching);

            if ($count === 0) {
                continue;
            }

            $start = ($vehicleOffset * 3) % $count;
            // The conflicting document touches exactly one car and one wheel — the first pairing
            // the first range makes — so the conflict queue has one clear entry.
            $take = $draft ? 1 : min(6, $count);

            for ($k = 0; $k < $take; $k++) {
                [$configOffset, $config] = $matching[($start + $k) % $count];
                $key = $vehicle->id.':'.$config->id;

                // Roughly one in four fitments needs entry in the papers, which matches the real
                // mix closely enough that the `Ohne Eintragung` facet is worth having.
                $requiresEntry = $draft || ($configOffset % 4 === 0 && $slot !== 'range3');

                $meta[$key] = ['entry' => $requiresEntry, 'offset' => $configOffset];

                if (isset($existing[$key])) {
                    continue;
                }

                $rows[] = [
                    'approval_document_id' => $document->id,
                    'vehicle_id' => $vehicle->id,
                    'wheel_config_id' => $config->id,
                    'axle' => Axle::All->value,
                    // NULL on both sides: the document does not narrow the vehicle's own build
                    // window, which is the common case.
                    'build_from' => null,
                    'build_to' => null,
                    'permitted_width_min' => 7.0,
                    'permitted_width_max' => 9.5,
                    'permitted_et_min' => 30,
                    'permitted_et_max' => 48,
                    // What THIS document says the bore is on THIS car, or NULL where it says
                    // nothing. Never the rim's own figure copied across: that would turn a
                    // catalogue number into a document's statement.
                    'centre_bore_mm' => self::documentCentreBore($vehicle->make, (float) $config->bolt_circle_mm, $motec),
                    'requires_entry' => $requiresEntry,
                    'entry_note_de' => $requiresEntry
                        ? 'Eintragung durch eine amtlich anerkannte Prüfstelle erforderlich.'
                        : null,
                    'source_page' => 3 + ($configOffset % 5),
                    'status' => $draft ? FitmentStatus::Draft->value : FitmentStatus::Published->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            if ($draft) {
                break;
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('fitments')->insert($chunk);
        }

        if ($meta === []) {
            return;
        }

        $this->seedConditions($this->fitmentIds($document->id), $meta, $now);
    }

    /**
     * Every fitment of this document, old or new, held to the same filter: a row that fails it — or
     * whose wheel or vehicle has been retired — is `retired`, never deleted (R-05, R-12); a row that
     * passes it again is live again. Each live row's tyre sizes are then exactly the plausible ones.
     */
    private function reconcile(ApprovalDocument $document, string $slot): void
    {
        $motec = $slot === 'motec';
        $live = $slot === 'conflicting' ? FitmentStatus::Draft->value : FitmentStatus::Published->value;
        $now = now();

        $rows = DB::table('fitments as f')
            ->join('vehicles as v', 'v.id', '=', 'f.vehicle_id')
            ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
            ->where('f.approval_document_id', $document->id)
            ->orderBy('f.id')
            ->get([
                'f.id', 'f.status', 'f.centre_bore_mm as stated_bore_mm',
                'v.make', 'v.model', 'v.variant', 'v.type_designation', 'v.deleted_at as vehicle_deleted_at',
                'wc.bolt_holes', 'wc.bolt_circle_mm', 'wc.centre_bore_mm', 'wc.diameter_in', 'wc.width_in', 'wc.deleted_at as config_deleted_at',
            ]);

        $retire = [];
        $restore = [];
        /** @var array<int, list<array{0: int, 1: int, 2: float}>> $sizes */
        $sizes = [];
        /** @var array<string, list<int>> $bores the stated bore ('' for none) => the rows to set it on */
        $bores = [];

        foreach ($rows as $row) {
            $ok = $row->vehicle_deleted_at === null
                && $row->config_deleted_at === null
                && self::compatible(
                    (string) $row->make,
                    (string) $row->model,
                    $row->type_designation === null ? null : (string) $row->type_designation,
                    (int) $row->bolt_holes,
                    (float) $row->bolt_circle_mm,
                    (float) $row->centre_bore_mm,
                    $motec,
                );

            if (! $ok) {
                if ($row->status !== FitmentStatus::Retired->value) {
                    $retire[] = (int) $row->id;
                }

                continue;
            }

            if ($row->status === FitmentStatus::Retired->value) {
                $restore[] = (int) $row->id;
            }

            // A database seeded before the column existed carries NULL on every row; the document's
            // own bore for this car is written here, once, and cleared again where the document
            // turns out to state none.
            $stated = self::documentCentreBore((string) $row->make, (float) $row->bolt_circle_mm, $motec);
            $current = $row->stated_bore_mm === null ? null : (float) $row->stated_bore_mm;

            if ($stated !== $current) {
                $bores[$stated === null ? '' : number_format($stated, 2, '.', '')][] = (int) $row->id;
            }

            $diameter = (float) $row->diameter_in;
            $sizes[(int) $row->id] = array_map(
                static fn (array $size): array => [$size[0], $size[1], $diameter],
                self::tyreSizes((string) $row->make, (string) $row->variant, $diameter, (float) $row->width_in),
            );
        }

        foreach (array_chunk($retire, 500) as $chunk) {
            DB::table('fitments')->whereIn('id', $chunk)->update(['status' => FitmentStatus::Retired->value, 'updated_at' => $now]);
        }

        foreach (array_chunk($restore, 500) as $chunk) {
            DB::table('fitments')->whereIn('id', $chunk)->update(['status' => $live, 'updated_at' => $now]);
        }

        foreach ($bores as $value => $ids) {
            foreach (array_chunk($ids, 500) as $chunk) {
                DB::table('fitments')->whereIn('id', $chunk)->update([
                    'centre_bore_mm' => $value === '' ? null : (float) $value,
                    'updated_at' => $now,
                ]);
            }
        }

        $this->syncTyreSizes($sizes, $now);
    }

    /**
     * Each live fitment's tyre sizes made exactly the plausible ones: missing ones added, the rest
     * removed. NULL minima mean the document states none, so the derivation from the vehicle's axle
     * load and top speed is the only floor — never "no minimum".
     *
     * @param  array<int, list<array{0: int, 1: int, 2: float}>>  $wanted  fitment id => [width, aspect, rim]
     */
    private function syncTyreSizes(array $wanted, \DateTimeInterface $now): void
    {
        $key = static fn (int $fitmentId, int $width, int $aspect, float $rim): string => sprintf('%d:%d:%d:%.1f', $fitmentId, $width, $aspect, $rim);

        $want = [];

        foreach ($wanted as $fitmentId => $list) {
            foreach ($list as [$width, $aspect, $rim]) {
                $want[$key($fitmentId, $width, $aspect, $rim)] = [
                    'fitment_id' => $fitmentId,
                    'width_mm' => $width,
                    'aspect' => $aspect,
                    'diameter_in' => $rim,
                    'axle' => Axle::All->value,
                    'min_load_index' => null,
                    'min_speed_symbol' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        $stale = [];

        foreach (array_chunk(array_keys($wanted), 500) as $chunk) {
            $have = DB::table('fitment_tyre_sizes')
                ->whereIn('fitment_id', $chunk)
                ->get(['id', 'fitment_id', 'width_mm', 'aspect', 'diameter_in']);

            foreach ($have as $row) {
                $k = $key((int) $row->fitment_id, (int) $row->width_mm, (int) $row->aspect, (float) $row->diameter_in);

                if (isset($want[$k])) {
                    unset($want[$k]);
                } else {
                    $stale[] = (int) $row->id;
                }
            }
        }

        foreach (array_chunk($stale, 500) as $chunk) {
            DB::table('fitment_tyre_sizes')->whereIn('id', $chunk)->delete();
        }

        foreach (array_chunk(array_values($want), 500) as $chunk) {
            DB::table('fitment_tyre_sizes')->insertOrIgnore($chunk);
        }
    }

    /**
     * This document's fitment ids, keyed `vehicleId:configId` — one query for the whole document.
     *
     * @return array<string, int>
     */
    private function fitmentIds(int $documentId): array
    {
        $rows = DB::table('fitments')
            ->where('approval_document_id', $documentId)
            ->get(['id', 'vehicle_id', 'wheel_config_id']);

        $ids = [];

        foreach ($rows as $row) {
            $ids[$row->vehicle_id.':'.$row->wheel_config_id] = (int) $row->id;
        }

        return $ids;
    }

    /**
     * @param  array<string, int>  $ids
     * @param  array<string, array{entry: bool, offset: int}>  $meta
     */
    private function seedConditions(array $ids, array $meta, \DateTimeInterface $now): void
    {
        $codes = $this->conditionCodes();
        $rows = [];

        foreach ($meta as $key => $row) {
            if (! isset($ids[$key])) {
                continue;
            }

            $attach = [];

            if ($row['entry'] && $codes['entry'] !== null) {
                $attach[$codes['entry']->id] = null;
            }

            // A share of fitments carries conditions, which is what the Auflagen panel and the
            // amber CONDITIONAL verdict exist for.
            if ($row['offset'] % 3 === 0 && $codes['bolts'] !== null) {
                $attach[$codes['bolts']->id] = null;
            }

            if ($row['offset'] % 5 === 2 && $codes['arch'] !== null) {
                $attach[$codes['arch']->id] = 'Nur an der Hinterachse.';
            }

            foreach ($attach as $conditionCodeId => $note) {
                $rows[] = [
                    'fitment_id' => $ids[$key],
                    'condition_code_id' => $conditionCodeId,
                    'note_de' => $note,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('fitment_conditions')->insertOrIgnore($chunk);
        }
    }

    /** @return array<string, ConditionCode|null> */
    private function conditionCodes(): array
    {
        return [
            'entry' => ConditionCode::query()->where('code', 'ENTRY_REQUIRED')->first(),
            'bolts' => ConditionCode::query()->where('code', 'SPECIFIC_BOLTS')->first(),
            'arch' => ConditionCode::query()->where('code', 'ARCH_ROLLING')->first(),
        ];
    }

    /**
     * The disagreement, recorded as a row with a status rather than announced and forgotten.
     *
     * Entry requirement is the one conflict kind that blocks: every other kind can be published as
     * the intersection of the two documents, but there is no intersection between "requires entry"
     * and "does not".
     */
    private function seedConflict(ApprovalDocument $candidate, ApprovalDocument $existing): void
    {
        $candidateFitment = Fitment::query()
            ->where('approval_document_id', $candidate->id)
            ->where('status', '!=', FitmentStatus::Retired->value)
            ->orderBy('id')
            ->first();

        if ($candidateFitment === null) {
            return;
        }

        $existingFitment = Fitment::query()
            ->where('approval_document_id', $existing->id)
            ->where('vehicle_id', $candidateFitment->vehicle_id)
            ->where('wheel_config_id', $candidateFitment->wheel_config_id)
            ->first();

        if ($existingFitment === null) {
            return;
        }

        FitmentConflict::updateOrCreate(
            [
                'candidate_fitment_id' => $candidateFitment->id,
                'existing_fitment_id' => $existingFitment->id,
            ],
            [
                'kind' => ConflictKind::EntryRequirement->value,
                'status' => ConflictStatus::Open->value,
                'vehicle_id' => $candidateFitment->vehicle_id,
                'wheel_config_id' => $candidateFitment->wheel_config_id,
                'blocking' => true,
                // Both sides, as they are shown side by side in the admin panel. The reviewer
                // decides; the system never picks a winner for a blocking conflict.
                'detail' => [
                    'field' => 'requires_entry',
                    'existing' => [
                        'document' => $existing->report_number,
                        'issuer' => $existing->issuer,
                        'requires_entry' => (bool) $existingFitment->requires_entry,
                        'source_page' => $existingFitment->source_page,
                    ],
                    'candidate' => [
                        'document' => $candidate->report_number,
                        'issuer' => $candidate->issuer,
                        'requires_entry' => (bool) $candidateFitment->requires_entry,
                        'source_page' => $candidateFitment->source_page,
                    ],
                ],
            ],
        );
    }
}
