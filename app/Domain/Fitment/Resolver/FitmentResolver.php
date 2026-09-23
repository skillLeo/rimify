<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Contracts\Clock;
use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Derivation\LoadIndexDeriver;
use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Domain\Fitment\EngineVersion;
use App\Domain\Fitment\Exceptions\ReferenceDataMissing;
use App\Domain\Fitment\Support\BuildWindow;
use App\Domain\Fitment\Verdict\AxleRequirement;
use App\Domain\Fitment\Verdict\CentreBoreSource;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictSnapshot;
use App\Domain\Fitment\Verdict\VerdictStatus;

/**
 * Decides whether a wheel is legal on a car.
 *
 * Six steps, in this order, on every surface:
 *   1. resolve the vehicle
 *   2. find published rows whose build window overlaps the vehicle's
 *   3. keep the rows whose permitted width and offset contain the wheel's actual geometry
 *   4. collect the permitted tyre sizes, per axle
 *   5. apply the minima derived from the vehicle record itself
 *   6. attach the conditions and the entry flag
 *
 * The order matters. Steps 1–2 narrow by law, 3–4 by document, 5 by physics derived from the
 * vehicle, 6 adds the human-readable obligations. Reordering 2 and 5 produces results that pass
 * the physics check with no document behind them.
 *
 * Where several published rows cover the same combination the engine merges TOWARD CAUTION:
 * `requiresEntry` is OR, conditions are the union, tyre sizes are the intersection, and minima
 * take the maximum. The per-vehicle centre bore has no stricter side, so disagreeing rows produce
 * no bore at all. Every one of those choices is the one that fails to a missed sale rather than
 * to a wrong answer.
 */
final readonly class FitmentResolver
{
    public function __construct(
        private VehicleRepository $vehicles,
        private FitmentRepository $fitments,
        private LoadIndexDeriver $loadIndex,
        private SpeedSymbolDeriver $speedSymbol,
        private Clock $clock,
    ) {}

    public function resolve(int $vehicleId, int $wheelConfigId): FitmentVerdict
    {
        $vehicle = $this->vehicles->find($vehicleId);

        if ($vehicle === null) {
            return $this->unknownWithoutVehicle($vehicleId, $wheelConfigId);
        }

        return $this->resolveForVehicle($vehicle, $wheelConfigId);
    }

    /**
     * `resolve()` for several configurations of one vehicle, with the vehicle looked up once.
     *
     * @param  list<int>  $wheelConfigIds
     * @return array<int, FitmentVerdict> keyed by configuration id, one for every id asked about
     */
    public function resolveMany(int $vehicleId, array $wheelConfigIds): array
    {
        $vehicle = $this->vehicles->find($vehicleId);

        if ($vehicle === null) {
            $verdicts = [];

            foreach (array_unique($wheelConfigIds) as $id) {
                $verdicts[$id] = $this->unknownWithoutVehicle($vehicleId, $id);
            }

            return $verdicts;
        }

        return $this->resolveManyForVehicle($vehicle, $wheelConfigIds);
    }

    public function resolveForVehicle(VehicleRecord $vehicle, int $wheelConfigId): FitmentVerdict
    {
        return $this->resolveManyForVehicle($vehicle, [$wheelConfigId])[$wheelConfigId];
    }

    /**
     * One verdict per configuration asked about, each decided exactly as `resolveForVehicle()`
     * decides it — that method is this one with a single id. Only the reads are shared: the rows,
     * the configurations and the "does any document know this wheel" question are each asked once
     * for the whole set, so a page of listing cards costs a handful of queries, not a handful per
     * configuration.
     *
     * @param  list<int>  $wheelConfigIds
     * @return array<int, FitmentVerdict> keyed by configuration id, one for every id asked about
     */
    public function resolveManyForVehicle(VehicleRecord $vehicle, array $wheelConfigIds): array
    {
        $ids = array_values(array_unique($wheelConfigIds));

        if ($ids === []) {
            return [];
        }

        $wheels = $this->fitments->findWheelConfigs($ids);
        $verdicts = [];

        // ── Step 1 · the vehicle must be usable at all ───────────────────────────────────
        // Asked before anything else: a vehicle whose axle loads or top speed could not be parsed
        // can never produce a positive verdict, because both derivations return null and a null
        // minimum is not "no minimum" (R-03). This outranks R-06 — a document stating its own
        // minimum does not rescue a vehicle we cannot characterise.
        if (! $vehicle->hasCompleteLegalData()) {
            foreach ($ids as $id) {
                $verdicts[$id] = $this->negative(
                    VerdictStatus::Unknown,
                    $vehicle,
                    $wheels[$id] ?? null,
                    VerdictReason::of(VerdictReason::VEHICLE_INCOMPLETE),
                );
            }

            return $verdicts;
        }

        // ── Steps 2 and 3 · rows scoped by law and by document ───────────────────────────
        $rowsByConfig = $this->fitments->publishedRowsFor($vehicle->id, $ids);
        $covering = [];

        foreach ($ids as $id) {
            $wheel = $wheels[$id] ?? null;

            $covering[$id] = array_values(array_filter(
                $rowsByConfig[$id] ?? [],
                fn (FitmentRow $row): bool => $row->windowCovers($vehicle->buildWindow)
                    && ($wheel === null || $row->permitsGeometry($wheel->widthIn, $wheel->etMm)),
            ));
        }

        // Asked only about the configurations nothing covers, which is the only place the answer
        // is used.
        $uncovered = array_keys(array_filter($covering, static fn (array $rows): bool => $rows === []));
        $documented = $uncovered === []
            ? []
            : array_flip($this->fitments->configsWithPublishedDocument($uncovered));

        foreach ($ids as $id) {
            $wheel = $wheels[$id] ?? null;

            if ($covering[$id] === []) {
                $verdicts[$id] = $this->negativeWithoutCoverage(
                    $vehicle,
                    $wheel,
                    isset($documented[$id]),
                    $rowsByConfig[$id] ?? [],
                );

                continue;
            }

            // ── Steps 4, 5 and 6 · merged toward caution across every covering row ───────
            try {
                $verdicts[$id] = $this->buildPositiveVerdict($vehicle, $wheel, $covering[$id]);
            } catch (ReferenceDataMissing) {
                // A configuration fault must never present itself as a permissive legal answer.
                $verdicts[$id] = $this->negative(
                    VerdictStatus::Unknown,
                    $vehicle,
                    $wheel,
                    VerdictReason::of(VerdictReason::REFERENCE_DATA_MISSING),
                );
            }
        }

        return $verdicts;
    }

    /** @param list<FitmentRow> $covering */
    private function buildPositiveVerdict(
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        array $covering,
    ): FitmentVerdict {
        // Step 6's inputs, merged toward caution.
        $requiresEntry = false;
        $entryNotes = [];
        $conditions = [];

        foreach ($covering as $row) {
            // OR: if any document says the fitment must be entered, it must be entered.
            $requiresEntry = $requiresEntry || $row->requiresEntry;

            if ($row->requiresEntry && $row->entryNoteDe !== null && trim($row->entryNoteDe) !== '') {
                $entryNotes[$row->entryNoteDe] = true;
            }

            // Union: showing a condition that turns out not to apply costs a moment's reading;
            // omitting one that does apply costs a workshop visit nobody budgeted for.
            $conditions = Condition::union($conditions, $row->conditions);
        }

        $front = $this->axleRequirement($covering, $vehicle->axleLoadFrontKg, $vehicle->maxSpeedKmh, 'FRONT');
        $rear = $this->axleRequirement($covering, $vehicle->axleLoadRearKg, $vehicle->maxSpeedKmh, 'REAR');

        // Step 5's failure mode: the document covers the car but nothing is legally mountable.
        if (! $front->hasPermittedSizes() && ! $rear->hasPermittedSizes()) {
            return $this->negative(
                VerdictStatus::NotPermitted,
                $vehicle,
                $wheel,
                VerdictReason::of(VerdictReason::NO_TYRE_SIZE),
                $covering[0]->document,
            );
        }

        // A minimum we could not derive is not a minimum of zero.
        if (! $front->hasUsableMinimum() || ! $rear->hasUsableMinimum()) {
            return $this->negative(
                VerdictStatus::Unknown,
                $vehicle,
                $wheel,
                VerdictReason::of(VerdictReason::VEHICLE_INCOMPLETE),
                $covering[0]->document,
            );
        }

        $hasPurchaseAffectingCondition = false;

        foreach ($conditions as $condition) {
            if ($condition->downgradesVerdict()) {
                $hasPurchaseAffectingCondition = true;
            }
        }

        // Entry in the papers is itself something the customer must do before driving, so it
        // downgrades the verdict just as an ACTION condition does.
        $status = ($requiresEntry || $hasPurchaseAffectingCondition)
            ? VerdictStatus::Conditional
            : VerdictStatus::Permitted;

        // The document reported is the one whose row is most specific: the newest revision among
        // the covering rows, so a reissue is what the customer is shown.
        $document = $this->governingDocument($covering);

        [$centreBoreMm, $centreBoreSource] = $this->documentCentreBore($covering);

        return new FitmentVerdict(
            status: $status,
            vehicle: $vehicle,
            wheel: $wheel,
            document: $document,
            requiresEntry: $requiresEntry,
            entryNoteDe: $entryNotes === [] ? null : implode(' ', array_keys($entryNotes)),
            conditions: $conditions,
            front: $front,
            rear: $rear,
            reason: null,
            snapshot: new VerdictSnapshot(
                fitmentId: $this->governingRow($covering)->id,
                documentRevision: $document->revision,
                computedAt: $this->clock->now(),
                engineVersion: EngineVersion::CURRENT,
            ),
            documentCentreBoreMm: $centreBoreMm,
            centreBoreSource: $centreBoreSource,
        );
    }

    /**
     * The Mittenlochbohrung the covering rows state for this vehicle, merged toward caution.
     *
     * The bore is stated per vehicle row, not per rim, so this is the one figure on the verdict
     * that the customer's car decides. Merging it is unlike the minima: there is no "stricter" of
     * two bores — a smaller one will not seat on the hub and a larger one needs a Zentrierring, so
     * neither direction is the safe one. Where two covering documents disagree the engine
     * therefore states nothing and says so, rather than picking a number that is wrong for one of
     * them (§2: be silent rather than confidently wrong). The governing row is NOT used as a
     * tie-break: a newer revision is the better source for what a document says, not evidence that
     * an older, still-valid document's measurement was withdrawn.
     *
     * @param  list<FitmentRow>  $covering
     * @return array{0: float|null, 1: CentreBoreSource}
     */
    private function documentCentreBore(array $covering): array
    {
        $stated = [];

        foreach ($covering as $row) {
            if ($row->centreBoreMm !== null) {
                // Keyed at the column's own precision, so 66.6 and 66.60 are one statement rather
                // than two disagreeing ones.
                $stated[number_format($row->centreBoreMm, 2, '.', '')] = $row->centreBoreMm;
            }
        }

        if ($stated === []) {
            return [null, CentreBoreSource::Unstated];
        }

        if (count($stated) > 1) {
            return [null, CentreBoreSource::Conflicting];
        }

        return [array_values($stated)[0], CentreBoreSource::Document];
    }

    /**
     * The permitted sizes and the governing minima for one axle.
     *
     * @param  list<FitmentRow>  $covering
     */
    private function axleRequirement(
        array $covering,
        ?int $axleLoadKg,
        ?int $maxSpeedKmh,
        string $axle,
    ): AxleRequirement {
        $sizes = null;
        $documentLoadIndex = null;
        $documentSpeedSymbol = null;

        foreach ($covering as $row) {
            if (! $this->rowCoversAxle($row, $axle)) {
                continue;
            }

            // Only the sizes the document permits on THIS axle: a size scoped to `FRONT` never
            // lands on the rear, so a staggered line reads as MIXED rather than as four identical
            // wheels the document does not permit.
            $rowSizes = $row->tyreSizesForAxle($axle);

            // Intersection across documents: a size only one of them permits is not offered.
            $sizes = $sizes === null ? $rowSizes : TyreSize::intersect($sizes, $rowSizes);

            foreach ($rowSizes as $size) {
                if ($size->documentMinLoadIndex !== null) {
                    $documentLoadIndex = max($documentLoadIndex ?? 0, $size->documentMinLoadIndex);
                }

                if ($size->documentMinSpeedSymbol !== null) {
                    $documentSpeedSymbol = $size->documentMinSpeedSymbol;
                }
            }
        }

        $derivedLoadIndex = $this->loadIndex->forAxle($axleLoadKg);
        $derivedSpeedSymbol = $this->speedSymbol->forTopSpeed($maxSpeedKmh);

        // R-06: the stricter of document and derivation governs, and the verdict records which.
        [$minLoadIndex, $loadSource] = $this->stricterLoadIndex(
            $derivedLoadIndex?->index,
            $documentLoadIndex,
        );

        [$minSpeedSymbol, $speedSource] = $this->stricterSpeedSymbol(
            $derivedSpeedSymbol?->symbol,
            $documentSpeedSymbol,
        );

        return new AxleRequirement(
            sizes: $sizes ?? [],
            minLoadIndex: $minLoadIndex,
            minSpeedSymbol: $minSpeedSymbol,
            // If either half came from the document, the reasoning is "the document said so" —
            // and each half records its own source, so a sentence about the load index can never
            // credit a Gutachten that only stated a speed symbol.
            minSource: ($loadSource === MinSource::Document || $speedSource === MinSource::Document)
                ? MinSource::Document
                : MinSource::Derived,
            minLoadSource: $loadSource,
            minSpeedSource: $speedSource,
        );
    }

    /** @return array{0: int|null, 1: MinSource} */
    private function stricterLoadIndex(?int $derived, ?int $document): array
    {
        if ($derived === null) {
            // R-03 outranks R-06: without a derivation we cannot state a floor, and a document
            // minimum alone does not tell us the car can carry it.
            return [null, MinSource::Derived];
        }

        if ($document === null || $document <= $derived) {
            return [$derived, MinSource::Derived];
        }

        return [$document, MinSource::Document];
    }

    /** @return array{0: string|null, 1: MinSource} */
    private function stricterSpeedSymbol(?string $derived, ?string $document): array
    {
        if ($derived === null) {
            return [null, MinSource::Derived];
        }

        if ($document === null) {
            return [$derived, MinSource::Derived];
        }

        $derivedRank = $this->speedSymbol->rankOf($derived);
        $documentRank = $this->speedSymbol->rankOf($document);

        // An unrecognised document symbol is ignored rather than trusted: it would otherwise rank
        // as nothing and silently relax the requirement.
        if ($documentRank === null || $derivedRank === null || $documentRank <= $derivedRank) {
            return [$derived, MinSource::Derived];
        }

        return [$document, MinSource::Document];
    }

    private function rowCoversAxle(FitmentRow $row, string $axle): bool
    {
        return $axle === 'FRONT' ? $row->coversFront() : $row->coversRear();
    }

    /** @param list<FitmentRow> $covering */
    private function governingRow(array $covering): FitmentRow
    {
        $governing = $covering[0];

        foreach ($covering as $row) {
            if ($row->document->revision > $governing->document->revision) {
                $governing = $row;
            }
        }

        return $governing;
    }

    /** @param list<FitmentRow> $covering */
    private function governingDocument(array $covering): DocumentRecord
    {
        return $this->governingRow($covering)->document;
    }

    /**
     * No covering row. The distinction here is the whole reason there are four states: we either
     * hold a document and it does not cover this car, or we hold nothing at all.
     *
     * @param  bool  $documented  whether any published, valid document holds a row for the wheel
     * @param  list<FitmentRow>  $allRows
     */
    private function negativeWithoutCoverage(
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        bool $documented,
        array $allRows,
    ): FitmentVerdict {
        if (! $documented) {
            // We hold no evidence either way — and this is what the catalogue-gap report ranks.
            return $this->negative(
                VerdictStatus::Unknown,
                $vehicle,
                $wheel,
                VerdictReason::of(VerdictReason::NO_DOCUMENT),
            );
        }

        // Rows exist for this vehicle, so the document knows the car — the reason it failed is
        // either the build window or the geometry, and the customer deserves to be told which.
        $reasonCode = VerdictReason::NOT_COVERED;

        foreach ($allRows as $row) {
            if (! $row->windowCovers($vehicle->buildWindow)) {
                $reasonCode = VerdictReason::OUTSIDE_BUILD_WINDOW;

                break;
            }

            if ($wheel !== null && ! $row->permitsGeometry($wheel->widthIn, $wheel->etMm)) {
                $reasonCode = VerdictReason::WIDTH_OR_ET_OUTSIDE_RANGE;

                break;
            }
        }

        return $this->negative(
            VerdictStatus::NotPermitted,
            $vehicle,
            $wheel,
            VerdictReason::of($reasonCode),
            $allRows === [] ? null : $allRows[0]->document,
        );
    }

    private function unknownWithoutVehicle(int $vehicleId, int $wheelConfigId): FitmentVerdict
    {
        $placeholder = new VehicleRecord(
            id: $vehicleId,
            hsn: '0000', tsn: '000', vsn: null,
            make: '', model: '', variant: 'Unbekanntes Fahrzeug', typeDesignation: null,
            buildWindow: BuildWindow::unbounded(),
            axleLoadFrontKg: null, axleLoadRearKg: null, maxSpeedKmh: null,
            needsReview: true,
        );

        return $this->negative(
            VerdictStatus::Unknown,
            $placeholder,
            $this->fitments->findWheelConfigs([$wheelConfigId])[$wheelConfigId] ?? null,
            VerdictReason::of(VerdictReason::VEHICLE_NOT_FOUND),
        );
    }

    private function negative(
        VerdictStatus $status,
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        VerdictReason $reason,
        ?DocumentRecord $document = null,
    ): FitmentVerdict {
        return FitmentVerdict::negative(
            $status,
            $vehicle,
            $wheel,
            $reason,
            $this->clock->now(),
            EngineVersion::CURRENT,
            $document,
        );
    }
}
