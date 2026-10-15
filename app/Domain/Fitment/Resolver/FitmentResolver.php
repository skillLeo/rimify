<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Contracts\Clock;
use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Data\ConflictDecision;
use App\Domain\Fitment\Data\DeratingLookup;
use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\SpeedDeratingTable;
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
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\LoadIndexCode;
use App\Domain\Fitment\Verdict\MinSource;
use App\Domain\Fitment\Verdict\Severity;
use App\Domain\Fitment\Verdict\TyreCheck;
use App\Domain\Fitment\Verdict\VerdictReason;
use App\Domain\Fitment\Verdict\VerdictSnapshot;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Support\GermanFormat;

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
 * Each document is decided on its own rows (the corrections memo §3). Several rows of ONE document
 * are read together TOWARD CAUTION: `requiresEntry` is OR, conditions are the union, tyre sizes are
 * the intersection, and minima take the maximum. Several documents are never blended by the engine:
 * where they agree the newest is named with the others, where they disagree the answer is UNKNOWN
 * until a person decides (decide()). The per-vehicle centre bore has no stricter side, so
 * disagreeing rows produce no bore at all. Every one of those choices is the one that fails to a
 * missed sale rather than to a wrong answer.
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
        // A removed vehicle answers nothing. A vehicle without axle loads or top speed still gets its
        // wheel verdict — the Gutachten names its type and kW band — but never a positive tyre half:
        // that half is CONDITIONAL and says what to compare in the papers (R-03 as amended on
        // 28.09.2026, buildPositiveVerdict()).
        if ($vehicle->isDeleted) {
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
        // A document we hold only part of (Anlagen missing): a car its rows do not name is not refused on its word.
        $incomplete = $documented === [] ? [] : $this->fitments->incompleteDocumentsFor(array_keys($documented));

        foreach ($ids as $id) {
            $wheel = $wheels[$id] ?? null;

            if ($covering[$id] === []) {
                $verdicts[$id] = $this->negativeWithoutCoverage(
                    $vehicle,
                    $wheel,
                    isset($documented[$id]),
                    $rowsByConfig[$id] ?? [],
                    $incomplete[$id] ?? null,
                );

                continue;
            }

            // ── The document's own narrowing, and what we could not read of it ───────────
            // A body-style or drive code drops a row for a car it excludes, and one printed beside a size
            // drops that size; one we cannot decide (no body style on record, no parameter entered) is
            // never read as a pass. A row left without a size is a row that excludes the car.
            $excludedBy = null;
            $undecided = null;
            $admitted = [];
            // What of the car the undecided rows would need: asked for by name, never as a riddle (§1.1).
            $missing = [];

            foreach ($covering[$id] as $row) {
                $admit = $row->filtersAdmit($vehicle);
                $sizes = [];

                if ($admit === true) {
                    foreach ($row->tyreSizes as $size) {
                        $sizeAdmit = $size->filtersAdmit($vehicle);

                        if ($sizeAdmit === null) {
                            $admit = null;

                            break;
                        }

                        if ($sizeAdmit) {
                            $sizes[] = $size;
                        }
                    }

                    if ($admit === true && $sizes === [] && $row->tyreSizes !== []) {
                        $admit = false;
                    }
                }

                if ($admit === false) {
                    $excludedBy ??= $row->document;
                } elseif ($admit === null) {
                    $undecided ??= $row->document;

                    foreach ([$row->filters, ...array_map(static fn (TyreSize $s): array => $s->filters, $row->tyreSizes)] as $filters) {
                        foreach (RowFilter::openFacts($filters, $vehicle) as $fact) {
                            $missing[$fact] = true;
                        }
                    }
                } else {
                    $admitted[] = count($sizes) === count($row->tyreSizes) ? $row : $row->withTyreSizes($sizes);
                }
            }

            if ($undecided !== null) {
                $verdicts[$id] = $this->negative(VerdictStatus::Unknown, $vehicle, $wheel, VerdictReason::of(VerdictReason::BODY_OR_DRIVE_UNKNOWN), $undecided, array_keys($missing));

                continue;
            }

            if ($admitted === []) {
                $verdicts[$id] = $this->negative(VerdictStatus::NotPermitted, $vehicle, $wheel, VerdictReason::of(VerdictReason::BODY_OR_DRIVE_EXCLUDED), $excludedBy);

                continue;
            }

            // A code its own document does not define: the sentence is missing, so the answer is.
            foreach ($admitted as $row) {
                if ($row->unresolvedCodes !== []) {
                    $verdicts[$id] = $this->negative(VerdictStatus::Unknown, $vehicle, $wheel, VerdictReason::of(VerdictReason::CONDITION_UNRESOLVED), $row->document);

                    continue 2;
                }
            }

            $covering[$id] = $admitted;
        }

        // Several documents cover a pair: what a person decided about their disagreement, asked once
        // for the batch and only where it is needed.
        $contested = [];

        foreach ($ids as $id) {
            if (! isset($verdicts[$id]) && count(array_unique(array_map(static fn (FitmentRow $r): int => $r->document->id, $covering[$id]))) > 1) {
                $contested[] = $id;
            }
        }

        $decisions = $contested === [] ? [] : $this->fitments->conflictDecisionsFor($vehicle->id, $contested);

        foreach ($ids as $id) {
            if (isset($verdicts[$id])) {
                continue;
            }

            $wheel = $wheels[$id] ?? null;

            // ── Steps 4, 5 and 6 · per document, never blended without a person's word ────
            try {
                $verdicts[$id] = $this->decide($vehicle, $wheel, $covering[$id], $decisions[$id] ?? null);
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

        // In the order asked, whichever pass decided each.
        return array_replace(array_fill_keys($ids, null), $verdicts);
    }

    /**
     * One verdict per document, decided on that document's own rows (the corrections memo §3). One
     * document: its verdict. Several that say the same: the newest one's verdict, every document named.
     * Several that differ — another answer, another Eintragung, other Auflagen, other tyre sizes — stay
     * UNKNOWN until a person decides on the Konflikte page: „nur Dokument X gilt“ reads X alone; „beide
     * gelten jeweils für sich“ reads them together, toward caution, and names both.
     *
     * @param  list<FitmentRow>  $rows
     */
    private function decide(VehicleRecord $vehicle, ?WheelConfigRecord $wheel, array $rows, ?ConflictDecision $decision): FitmentVerdict
    {
        /** @var array<int, list<FitmentRow>> $byDocument */
        $byDocument = [];

        foreach ($rows as $row) {
            $byDocument[$row->document->id][] = $row;
        }

        if (count($byDocument) === 1) {
            return $this->buildPositiveVerdict($vehicle, $wheel, $rows);
        }

        // Newest first: by the date it was issued, then its revision.
        $order = array_map(static fn (array $own): DocumentRecord => $own[0]->document, array_values($byDocument));
        usort($order, static fn (DocumentRecord $a, DocumentRecord $b): int => [$b->issuedOn?->format('Y-m-d') ?? '', $b->revision, $b->id] <=> [$a->issuedOn?->format('Y-m-d') ?? '', $a->revision, $a->id]);

        if ($decision?->mode === ConflictDecision::ONLY && $decision->documentId !== null && isset($byDocument[$decision->documentId])) {
            return $this->buildPositiveVerdict($vehicle, $wheel, $byDocument[$decision->documentId]);
        }

        if ($decision?->mode === ConflictDecision::EACH) {
            return $this->buildPositiveVerdict($vehicle, $wheel, $rows)->withDocuments($order);
        }

        $each = array_map(fn (DocumentRecord $d): FitmentVerdict => $this->buildPositiveVerdict($vehicle, $wheel, $byDocument[$d->id]), $order);

        // They agree on the answer: read together, so each one's own sentences are shown and a detail
        // they state differently — the centre bore — is said to differ rather than taken from one.
        if (count(array_unique(array_map(self::position(...), $each))) === 1) {
            return $this->buildPositiveVerdict($vehicle, $wheel, $rows)->withDocuments($order);
        }

        return $this->negative(VerdictStatus::Unknown, $vehicle, $wheel, VerdictReason::of(VerdictReason::DOCUMENTS_DISAGREE), $order[0]);
    }

    /**
     * What a document says about the pair, in terms two documents can be compared in: not their codes —
     * each document numbers its own — but the answer, the Eintragung, what the Auflagen ask of the
     * customer, and the tyre sizes per axle. A note that changes nothing is left out.
     */
    private static function position(FitmentVerdict $verdict): string
    {
        $asks = [];

        foreach ($verdict->conditions as $condition) {
            if ($condition->severity !== Severity::Info) {
                $asks[$condition->kind === null ? $condition->severity->value.':'.$condition->sentenceDe() : $condition->kind->value] = true;
            }
        }

        $asks = array_keys($asks);
        sort($asks);
        $sizes = static function (AxleRequirement $axle): array {
            $keys = array_map(static fn (TyreSize $s): string => $s->key(), $axle->sizes);
            sort($keys);

            return $keys;
        };

        return (string) json_encode([$verdict->status->value, $verdict->requiresEntry, $asks, $sizes($verdict->front), $sizes($verdict->rear)]);
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
        // The combination's own Auflagen, kept apart from the sizes': what a customer reads is said per size
        // (FitmentVerdict::conditionGroups()), while `$conditions` holds both for the decision below.
        $combination = [];

        foreach ($covering as $row) {
            // OR: if any document says the fitment must be entered, it must be entered.
            $requiresEntry = $requiresEntry || $row->requiresEntry;

            if ($row->requiresEntry && $row->entryNoteDe !== null && trim($row->entryNoteDe) !== '') {
                $entryNotes[$row->entryNoteDe] = true;
            }

            // Union: showing a condition that turns out not to apply costs a moment's reading;
            // omitting one that does apply costs a workshop visit nobody budgeted for.
            $conditions = Condition::union($conditions, $row->conditions);
            $combination = Condition::union($combination, $row->conditions);
        }

        [$front, $frontCheck] = $this->axleRequirement($covering, $vehicle->axleLoadFrontKg, $vehicle->maxSpeedKmh, 'FRONT', $vehicle->powerKw);
        [$rear, $rearCheck] = $this->axleRequirement($covering, $vehicle->axleLoadRearKg, $vehicle->maxSpeedKmh, 'REAR', $vehicle->powerKw);

        // A size the document gives only for a kW band, on a car whose power is not known: kept, never
        // PERMITTED — the band is said, with the field of the papers to compare it with (Block D).
        if ($vehicle->powerKw === null) {
            $bands = self::powerBandConditions([...$front->sizes, ...$rear->sizes]);
            $conditions = Condition::union($conditions, $bands);
            // Our own sentence, naming the sizes it is about: said once, with the combination.
            $combination = Condition::union($combination, $bands);
        }

        // An Auflage the document hangs off one tyre size stays with that size for the customer's
        // choice, and counts here too: until a size is chosen, the verdict carries every Auflage a
        // permitted size could bring (union, as above).
        foreach ([...$front->sizes, ...$rear->sizes] as $size) {
            $conditions = Condition::union($conditions, $size->conditions);
            $requiresEntry = $requiresEntry || $size->requiresEntry;
        }

        // The entry flag and the Auflagen about entry must never disagree. A row's flag is already
        // derived from its Abnahme codes (or a Prüfer's override with its reason); an Auflage without a
        // kind — the old catalogue's entry key — still sets it. A „Keine Eintragung erforderlich.“ loses
        // to any source that requires one — the cautious answer, never both (R-02).
        foreach ($conditions as $condition) {
            $requiresEntry = $requiresEntry || ($condition->kind === null && $condition->requiresEntry());
        }

        if ($requiresEntry) {
            $conditions = array_values(array_filter($conditions, static fn (Condition $c): bool => $c->code !== Condition::NO_ENTRY_REQUIRED));
            $combination = array_values(array_filter($combination, static fn (Condition $c): bool => $c->code !== Condition::NO_ENTRY_REQUIRED));
        }

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

        // The wheel's own tested load, where its document states one: with the car's axle loads known,
        // half of each axle the wheel may go on must not exceed it — per axle, because front and rear may
        // carry different sizes, and the axle that binds is named.
        $overload = $this->wheelOverload($vehicle, $wheel, $front, $rear);

        if ($overload !== null) {
            return $this->negative(VerdictStatus::NotPermitted, $vehicle, $wheel, $overload, $covering[0]->document);
        }

        // ── The wheel half: the document's Auflagen and the Eintragung. Tyre limits are the other half.
        $hasPurchaseAffectingCondition = false;

        foreach ($conditions as $condition) {
            if ($condition->downgradesVerdict() && ! $condition->affectsTyreChoice) {
                $hasPurchaseAffectingCondition = true;
            }
        }

        // Entry in the papers is itself something the customer must do before driving, so it
        // downgrades the verdict just as an ACTION condition does.
        $wheelStatus = ($requiresEntry || $hasPurchaseAffectingCondition)
            ? VerdictStatus::Conditional
            : VerdictStatus::Permitted;

        // The document reported is the one whose row is most specific: the newest revision among
        // the covering rows, so a reissue is what the customer is shown.
        $document = $this->governingDocument($covering);

        // ── The tyre half, and the answer: the weaker of the two, never PERMITTED while the tyres
        // are open (R-03).
        $tyre = $this->tyreCheck($vehicle, $wheel, $conditions, $front, $rear, $frontCheck, $rearCheck, $document);

        // The customer's own figures laid over the car (C10): did they make the answer stricter than the
        // vehicle data alone? Then the sum is owed at once, not behind a click (the decision of 29.09.2026).
        if ($vehicle->beforePapers !== null) {
            $before = $vehicle->beforePapers;
            [$beforeFront, $beforeFrontCheck] = $this->axleRequirement($covering, $before->axleLoadFrontKg, $before->maxSpeedKmh, 'FRONT', $before->powerKw);
            [$beforeRear, $beforeRearCheck] = $this->axleRequirement($covering, $before->axleLoadRearKg, $before->maxSpeedKmh, 'REAR', $before->powerKw);
            $beforeTyre = $this->tyreCheck($before, $wheel, $conditions, $beforeFront, $beforeRear, $beforeFrontCheck, $beforeRearCheck, $document);
            $tyre = $tyre->withStricterByPapers($this->stricter($tyre, $front, $rear, $beforeTyre, $beforeFront, $beforeRear));
        }

        $status = VerdictStatus::weaker($wheelStatus, $tyre->status);

        // Where the tyres decide against the wheel, the answer says why in the tyres' own words.
        $reason = match ($tyre->status) {
            VerdictStatus::NotPermitted => new VerdictReason(VerdictReason::TYRE_NOT_PERMITTED, $tyre->lines[0] ?? VerdictReason::sentenceFor(VerdictReason::TYRE_NOT_PERMITTED)),
            VerdictStatus::Unknown => new VerdictReason(VerdictReason::TYRE_UNKNOWN, $tyre->lines[0] ?? VerdictReason::sentenceFor(VerdictReason::TYRE_UNKNOWN)),
            default => null,
        };

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
            reason: $reason,
            snapshot: new VerdictSnapshot(
                fitmentId: $this->governingRow($covering)->id,
                documentRevision: $document->revision,
                computedAt: $this->clock->now(),
                engineVersion: EngineVersion::CURRENT,
            ),
            documentCentreBoreMm: $centreBoreMm,
            centreBoreSource: $centreBoreSource,
            wheelStatus: $wheelStatus,
            tyre: $tyre,
            combinationConditions: $combination,
        );
    }

    /**
     * The tested wheel load against each axle the wheel may go on (the operator's review of C9, §4): null
     * when it holds, or when either figure is not known — the document's listing of the car governs then —
     * else why not, naming the axle that binds, with the sum.
     */
    private function wheelOverload(VehicleRecord $vehicle, ?WheelConfigRecord $wheel, AxleRequirement $front, AxleRequirement $rear): ?VerdictReason
    {
        $radlast = $wheel?->maxLoadKg;

        if ($radlast === null || $radlast <= 0 || ! $vehicle->hasCompleteLegalData()) {
            return null;
        }

        $over = [];

        foreach ([['Vorderachse', $front, (int) $vehicle->axleLoadFrontKg], ['Hinterachse', $rear, (int) $vehicle->axleLoadRearKg]] as [$name, $axle, $load]) {
            // Whole numbers: half the axle above the tested load is the axle above twice it.
            if ($axle->hasPermittedSizes() && $load > 2 * $radlast) {
                $over[$name] = $load;
            }
        }

        if ($over === []) {
            return null;
        }

        arsort($over);
        $name = (string) array_key_first($over);
        $load = $over[$name];

        return new VerdictReason(VerdictReason::WHEEL_LOAD_EXCEEDED, sprintf(
            'Die Felge ist für %s je Rad geprüft. Maßgeblich ist die %s mit %s: %s je Rad – mehr, als die Felge tragen darf.',
            GermanFormat::kilograms($radlast),
            $name,
            GermanFormat::kilograms($load),
            self::halfKg($load),
        ));
    }

    /**
     * The tyre half of the verdict (R-03 as amended on 28.09.2026; the operator's review of C9).
     *
     * Without the car's axle loads and top speed it is CONDITIONAL, and says which threshold the document
     * sets — its `reifen_tragfaehigkeit` Auflagen, T88 → 1.120 kg — and which fields of the papers to
     * compare it with. With them it is decided per axle the wheel may go on: the document's own load-index
     * limit and the derated requirement are stated separately and the stricter is named; a „–“ in the
     * document's table raises the speed symbol; a speed, a symbol or a table the document does not print
     * is UNKNOWN. A tyre rule the document writes that no figure can settle keeps it CONDITIONAL.
     *
     * @param  list<Condition>  $conditions
     * @param  array<string, mixed>  $frontCheck
     * @param  array<string, mixed>  $rearCheck
     */
    private function tyreCheck(VehicleRecord $vehicle, ?WheelConfigRecord $wheel, array $conditions, AxleRequirement $front, AxleRequirement $rear, array $frontCheck, array $rearCheck, DocumentRecord $document): TyreCheck
    {
        $thresholds = [];

        foreach ($conditions as $condition) {
            if ($condition->kind === ConditionKind::ReifenTragfaehigkeit && $condition->maxAxleLoadKg !== null) {
                $thresholds[] = ['textDe' => $condition->sentenceDe(), 'maxAxleLoadKg' => $condition->maxAxleLoadKg];
            }
        }

        if (! $vehicle->hasCompleteLegalData()) {
            $lines = [];

            foreach ($thresholds as $threshold) {
                $lines[] = sprintf(
                    '%s Vergleiche die %s mit den Feldern 8.1 (vorn) und 8.2 (hinten) deiner Zulassungsbescheinigung Teil I – im alten Fahrzeugschein Ziffer 16.',
                    rtrim($threshold['textDe']),
                    GermanFormat::kilograms($threshold['maxAxleLoadKg']),
                );
            }

            if ($wheel?->maxLoadKg !== null && $wheel->maxLoadKg > 0) {
                $lines[] = sprintf(
                    'Die Felge ist für %s je Rad geprüft: Die zulässige Achslast in den Feldern 8.1 und 8.2 darf höchstens %s betragen.',
                    GermanFormat::kilograms($wheel->maxLoadKg),
                    GermanFormat::kilograms($wheel->maxLoadKg * 2),
                );
            }

            $lines[] = 'Welche Reifen du fahren darfst, hängt von der zulässigen Achslast (Felder 8.1 und 8.2) und der Höchstgeschwindigkeit (Feld T) deines Fahrzeugs ab. Trag sie ein, dann sagen wir es dir genau.';

            return new TyreCheck(VerdictStatus::Conditional, $lines, $thresholds);
        }

        $lines = [];
        $status = VerdictStatus::Permitted;

        foreach ([['Vorderachse', $front, $frontCheck], ['Hinterachse', $rear, $rearCheck]] as [$name, $axle, $check]) {
            if (! $axle->hasPermittedSizes()) {
                continue;
            }

            [$axleStatus, $axleLines] = $this->axleLines($name, $axle, $check, $wheel);
            $status = VerdictStatus::weaker($status, $axleStatus);
            $lines = [...$lines, ...$axleLines];
        }

        if ($status !== VerdictStatus::Permitted) {
            // The first line of a failing axle is the reason; keep it first.
            usort($lines, static fn (string $a, string $b): int => (int) str_starts_with($b, '!') <=> (int) str_starts_with($a, '!'));

            // A sentence both axles give — „Zu diesem Gutachten ist keine Tragfähigkeitstabelle … hinterlegt.“ — is said once.
            $lines = array_values(array_unique(array_map(static fn (string $l): string => ltrim($l, '!'), $lines)));

            // Always shown: why not, and the document it rests on.
            return new TyreCheck($status, $lines, $thresholds, true, $lines[0] ?? null, self::basis($document, $front->hasPermittedSizes() ? $frontCheck : $rearCheck));
        }

        // Always shown, whatever folds the sum away: the axle that binds and what it asks for, and the
        // document it came from (the operator's decision of 29.09.2026).
        [$summary, $bindingCheck] = $this->bindingSummary($vehicle, $front, $rear, $frontCheck, $rearCheck);
        $basis = self::basis($document, $bindingCheck);

        // Four identical tyres meet the stricter axle, and the line says which one bound.
        if ($front->hasPermittedSizes() && $rear->hasPermittedSizes() && $this->sameSizes($front, $rear)) {
            $frontLoad = (int) $vehicle->axleLoadFrontKg;
            $rearLoad = (int) $vehicle->axleLoadRearKg;
            $frontIndex = (int) $front->minLoadIndex;
            $rearIndex = (int) $rear->minLoadIndex;
            $bindingIndex = max($frontIndex, $rearIndex);
            // The axle that asks for more binds; where both ask for the same index, the heavier one (C-09).
            $rearBinds = $rearIndex !== $frontIndex ? $rearIndex > $frontIndex : $rearLoad > $frontLoad;
            $lines[] = $frontLoad === $rearLoad
                ? sprintf('Beide Achsen tragen %s: vier gleiche Reifen brauchen mindestens Tragfähigkeitsindex %d.', GermanFormat::kilograms($frontLoad), $bindingIndex)
                : sprintf(
                    'Für vier gleiche Reifen maßgeblich ist die %s mit %s: mindestens Tragfähigkeitsindex %d.',
                    $rearBinds ? 'Hinterachse' : 'Vorderachse',
                    GermanFormat::kilograms($rearBinds ? $rearLoad : $frontLoad),
                    $bindingIndex,
                );
        }

        $restricting = array_filter(
            $conditions,
            static fn (Condition $c): bool => $c->affectsTyreChoice && $c->kind !== ConditionKind::ReifenTragfaehigkeit,
        );

        if ($restricting !== []) {
            $lines[] = 'Das Gutachten schreibt außerdem vor, welche Reifen du fahren darfst – die Auflagen unter „Reifen“ gelten zusätzlich.';

            // Settled on the figures, every axle: what is left is the document's written rule (D-105).
            return new TyreCheck(VerdictStatus::Conditional, $lines, $thresholds, true, $summary, $basis, figuresPermitted: true);
        }

        return new TyreCheck(VerdictStatus::Permitted, $lines, $thresholds, true, $summary, $basis, figuresPermitted: true);
    }

    /**
     * One sentence per kW band the permitted sizes carry, for a car whose power is not known:
     * `225/35 R19 und 235/35 R19 sind laut Gutachten nur für Fahrzeuge mit 85–195 kW zugelassen. …`
     *
     * @param  list<TyreSize>  $sizes
     * @return list<Condition>
     */
    private static function powerBandConditions(array $sizes): array
    {
        $byBand = [];

        foreach ($sizes as $size) {
            $band = $size->powerBandDe();

            if ($band !== null) {
                $byBand[$band][$size->key()] = $size->labelDe();
            }
        }

        $out = [];

        foreach ($byBand as $band => $labels) {
            $labels = array_values($labels);
            $last = (string) array_pop($labels);
            $list = $labels === [] ? $last : implode(', ', $labels).' und '.$last;

            $out[] = new Condition(
                code: 'KW '.$band,
                severity: Severity::Action,
                textDe: sprintf(
                    '%s %s laut Gutachten nur für Fahrzeuge mit %s zugelassen. Vergleiche das mit der Leistung in Feld P.2 deiner Zulassungsbescheinigung (im alten Fahrzeugschein Ziffer 7).',
                    $list,
                    $labels === [] ? 'ist' : 'sind',
                    $band,
                ),
            );
        }

        return $out;
    }

    /**
     * The one line the customer always sees: `Hinterachse mit 1.235 kg: mindestens Tragfähigkeitsindex 93,
     * Geschwindigkeitsindex Y.` — the axle that asks for more (a tie: the heavier), or each axle where the
     * document permits different sizes on them. With the check of the axle it names, for its basis.
     *
     * @param  array<string, mixed>  $frontCheck
     * @param  array<string, mixed>  $rearCheck
     * @return array{0: string, 1: array<string, mixed>}
     */
    private function bindingSummary(VehicleRecord $vehicle, AxleRequirement $front, AxleRequirement $rear, array $frontCheck, array $rearCheck): array
    {
        $frontLoad = (int) $vehicle->axleLoadFrontKg;
        $rearLoad = (int) $vehicle->axleLoadRearKg;
        $says = static fn (string $axle, int $load, int $index, string $symbol): string => sprintf(
            '%s mit %s: mindestens Tragfähigkeitsindex %d, Geschwindigkeitsindex %s',
            $axle,
            GermanFormat::kilograms($load),
            $index,
            $symbol,
        );

        if (! $rear->hasPermittedSizes()) {
            return [$says('Vorderachse', $frontLoad, (int) $front->minLoadIndex, (string) $front->minSpeedSymbol).'.', $frontCheck];
        }

        if (! $front->hasPermittedSizes()) {
            return [$says('Hinterachse', $rearLoad, (int) $rear->minLoadIndex, (string) $rear->minSpeedSymbol).'.', $rearCheck];
        }

        if (! $this->sameSizes($front, $rear)) {
            return [
                $says('Vorderachse', $frontLoad, (int) $front->minLoadIndex, (string) $front->minSpeedSymbol).'; '
                    .$says('Hinterachse', $rearLoad, (int) $rear->minLoadIndex, (string) $rear->minSpeedSymbol).'.',
                $rearCheck,
            ];
        }

        // Four identical tyres meet both axles: the higher index, the higher symbol.
        $frontIndex = (int) $front->minLoadIndex;
        $rearIndex = (int) $rear->minLoadIndex;
        $rearBinds = $rearIndex !== $frontIndex ? $rearIndex > $frontIndex : $rearLoad > $frontLoad;
        $symbol = ($this->speedSymbol->rankOf($rear->minSpeedSymbol) ?? 0) > ($this->speedSymbol->rankOf($front->minSpeedSymbol) ?? 0)
            ? (string) $rear->minSpeedSymbol
            : (string) $front->minSpeedSymbol;

        if ($frontLoad === $rearLoad) {
            return [$says('Beide Achsen', $frontLoad, max($frontIndex, $rearIndex), $symbol).'.', $rearCheck];
        }

        return $rearBinds
            ? [$says('Hinterachse', $rearLoad, $rearIndex, $symbol).'.', $rearCheck]
            : [$says('Vorderachse', $frontLoad, $frontIndex, $symbol).'.', $frontCheck];
    }

    /**
     * The document the tyre answer came from: its table where one was read — above 210 km/h, and never passed
     * off as printed when the demo seed wrote it — else the document itself.
     *
     * @param  array<string, mixed>  $check
     */
    private static function basis(DocumentRecord $document, array $check): string
    {
        $table = $check['tableSource'] ?? null;
        $speed = $check['speed'] ?? null;

        if (is_string($table) && is_int($speed) && $speed > SpeedDeratingTable::NO_DERATING_UP_TO_KMH) {
            return 'Grundlage: '.$table.'.';
        }

        return 'Grundlage: Gutachten '.($document->number ?? '').'.';
    }

    /**
     * Whether the customer's figures made the tyre answer stricter than the vehicle data alone: a weaker
     * status, or a higher load index or speed symbol on an axle the wheel may go on.
     */
    private function stricter(TyreCheck $now, AxleRequirement $front, AxleRequirement $rear, TyreCheck $before, AxleRequirement $beforeFront, AxleRequirement $beforeRear): bool
    {
        if ($now->status !== $before->status && VerdictStatus::weaker($now->status, $before->status) === $now->status) {
            return true;
        }

        foreach ([[$front, $beforeFront], [$rear, $beforeRear]] as [$axle, $was]) {
            if (! $axle->hasPermittedSizes()) {
                continue;
            }

            if ($axle->minLoadIndex !== null && $was->minLoadIndex !== null && $axle->minLoadIndex > $was->minLoadIndex) {
                return true;
            }

            $rank = $this->speedSymbol->rankOf($axle->minSpeedSymbol);
            $wasRank = $this->speedSymbol->rankOf($was->minSpeedSymbol);

            if ($rank !== null && $wasRank !== null && $rank > $wasRank) {
                return true;
            }
        }

        return false;
    }

    /**
     * One axle, as the customer can follow it — the load per wheel, the document's own load-index limit and
     * the derated requirement each on its own, and which of them binds:
     * `Hinterachse: 1.180 kg ÷ 2 = 590 kg je Rad. Laut Auflage T91 genügt … Bei 250 km/h trägt … Maßgeblich …`
     *
     * A line that is the reason an axle fails starts with `!` (removed by the caller).
     *
     * @param  array<string, mixed>  $check
     * @return array{0: VerdictStatus, 1: list<string>}
     */
    private function axleLines(string $name, AxleRequirement $axle, array $check, ?WheelConfigRecord $wheel): array
    {
        $load = (int) $check['load'];
        $speed = (int) $check['speed'];
        $lead = sprintf('%s: %s ÷ 2 = %s je Rad.', $name, GermanFormat::kilograms($load), self::halfKg($load));

        /** @var DeratingLookup|null $lookup */
        $lookup = $check['lookup'];

        if ($lookup !== null && $lookup->isNotPermitted() && $check['raisedFrom'] === null) {
            return [VerdictStatus::NotPermitted, [sprintf('!Bei %s km/h ist laut Tabelle des Gutachtens kein Reifen mit Geschwindigkeitsindex %s zulässig.', GermanFormat::integer($speed), $check['symbol'])]];
        }

        if ($lookup === null || $lookup->isAbsent()) {
            return [VerdictStatus::Unknown, [$check['hasTable']
                ? sprintf('!Für %s km/h ist in der hinterlegten Tabelle für Geschwindigkeitsindex %s kein Wert eingetragen. Die Reifen können wir deshalb nicht bestätigen.', GermanFormat::integer($speed), $check['symbol'])
                : sprintf('!Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt. Für %s km/h können wir die Reifen deshalb nicht bestätigen.', GermanFormat::integer($speed))]];
        }

        if ($check['limitsUncovered'] !== null) {
            return [VerdictStatus::Unknown, [sprintf(
                '!Zu den Auflagen dieses Gutachtens sind Tragfähigkeitsindizes nur bis %s Achslast hinterlegt; die %s trägt %s. Die Reifen können wir deshalb nicht bestätigen.',
                GermanFormat::kilograms((int) $check['limitsUncovered']),
                $name,
                GermanFormat::kilograms($load),
            )]];
        }

        if ($check['derived'] === null || ! $axle->hasUsableMinimum()) {
            return [VerdictStatus::Unknown, [sprintf('!Für eine Achslast von %s nennt die Tragfähigkeitstabelle keinen Index. Die Reifen können wir deshalb nicht bestätigen.', GermanFormat::kilograms($load))]];
        }

        // An axle-load note of the document this axle is above: said, and the answer stays open.
        if ($check['axleNote'] !== null) {
            return [VerdictStatus::Conditional, [sprintf(
                '!Die Auflage %s nennt eine zulässige Achslast bis %s; die %s trägt laut Fahrzeugpapieren %s. Lies die Auflage im Gutachten – ob sie für dein Fahrzeug gilt, klären wir gern mit dir.',
                $check['axleNote']['code'],
                GermanFormat::kilograms((int) $check['axleNote']['kg']),
                $name,
                GermanFormat::kilograms($load),
            )]];
        }

        $lines = [$lead];

        if ($wheel?->maxLoadKg !== null && $wheel->maxLoadKg > 0) {
            $lines[] = sprintf('Die Felge ist für %s je Rad geprüft – das reicht.', GermanFormat::kilograms($wheel->maxLoadKg));
        }

        // The document's own stated limit, on its own.
        if ($check['limit'] !== null) {
            $lines[] = sprintf(
                'Laut Auflage %s genügt Tragfähigkeitsindex %d bis %s Achslast.',
                $check['limit']['code'],
                $check['limit']['index'],
                GermanFormat::kilograms($check['limit']['kg']),
            );
        }

        // The table's „–“ for the lower symbols, said as the document says it.
        if ($check['raisedFrom'] !== null) {
            $lines[] = sprintf('Bei %s km/h ist ein %s-Reifen laut Tabelle des Gutachtens nicht zulässig, erforderlich ist %s.', GermanFormat::integer($speed), $check['raisedFrom'], $check['symbol']);
        }

        // The derated requirement, on its own.
        $derived = $check['derived'];
        $percent = (int) $lookup->percent;
        $source = $check['tableSource'];
        $lines[] = $percent === 100
            ? sprintf('Bei %s km/h trägt ein Reifen mit Geschwindigkeitsindex %s seine volle Last: das verlangt Tragfähigkeitsindex %d (%s).', GermanFormat::integer($speed), $check['symbol'], $derived->index, GermanFormat::kilograms($derived->capacityKg))
            : sprintf(
                'Bei %s km/h trägt ein Reifen mit Geschwindigkeitsindex %s nur %d %% seiner Last%s: %s ÷ %s = %s – das verlangt Tragfähigkeitsindex %d (%s).',
                GermanFormat::integer($speed),
                $check['symbol'],
                $percent,
                $source === null ? '' : ' ('.$source.')',
                self::halfKg($load),
                GermanFormat::trimmedDecimal($percent / 100, 2),
                // Display only: the decision was taken in whole numbers (LoadIndexDeriver::forAxleAt()).
                GermanFormat::trimmedDecimal(round($load * 50 / $percent, 1), 1).GermanFormat::NBSP.'kg',
                $derived->index,
                GermanFormat::kilograms($derived->capacityKg),
            );

        $binding = match ($check['binding']) {
            'limit' => sprintf('die Auflage %s', $check['limit']['code'] ?? ''),
            'size' => 'die Reifengröße im Gutachten',
            default => 'die Minderung bei hoher Geschwindigkeit',
        };

        $lines[] = sprintf('Maßgeblich ist %s: mindestens Tragfähigkeitsindex %d, Geschwindigkeitsindex %s.', $binding, (int) $axle->minLoadIndex, $axle->minSpeedSymbol);

        return [VerdictStatus::Permitted, $lines];
    }

    /** Half an axle load, as read: `550 kg`, `617,5 kg` — display only, never a decision. */
    private static function halfKg(int $axleLoadKg): string
    {
        return $axleLoadKg % 2 === 0
            ? GermanFormat::kilograms(intdiv($axleLoadKg, 2))
            : GermanFormat::integer(intdiv($axleLoadKg, 2)).',5'.GermanFormat::NBSP.'kg';
    }

    private function sameSizes(AxleRequirement $front, AxleRequirement $rear): bool
    {
        $keys = static function (AxleRequirement $axle): array {
            $out = array_map(static fn (TyreSize $s): string => $s->key(), $axle->sizes);
            sort($out);

            return $out;
        };

        return $keys($front) === $keys($rear);
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
     * The permitted sizes and the governing minima for one axle — and, beside them, how they were reached,
     * for the sentences the tyre half shows (tyreCheck()).
     *
     * The load index is the stricter of three: half the axle load raised by the document's own table of
     * tyre load at speed (read at the speed rounded up to its row, for the symbol that governs; a „–“ raises
     * the symbol to the one the row requires); the document's `reifen_tragfaehigkeit` limits (the smallest
     * index whose limit reaches this axle); and a size's own stated minimum (R-06).
     *
     * @param  list<FitmentRow>  $covering
     * @return array{0: AxleRequirement, 1: array<string, mixed>}
     */
    private function axleRequirement(
        array $covering,
        ?int $axleLoadKg,
        ?int $maxSpeedKmh,
        string $axle,
        ?int $powerKw = null,
    ): array {
        $sizes = null;
        $sizeLoadIndex = null;
        $documentSpeedSymbol = null;
        $tables = [];
        $limits = [];

        foreach ($covering as $row) {
            if (! $this->rowCoversAxle($row, $axle)) {
                continue;
            }

            // Only the sizes the document permits on THIS axle: a size scoped to `FRONT` never
            // lands on the rear, so a staggered line reads as MIXED rather than as four identical
            // wheels the document does not permit.
            // And only the sizes whose kW band covers the car's power (Block D): a size the document gives
            // only at 85–125 kW is not offered to a 150 kW car. Power unknown: kept, and the verdict says
            // which band to compare with field P.2 (buildPositiveVerdict()).
            // A size the document prints more than once for the car — at two kW bands, with two load
            // indexes — is one size to the customer, carrying what every entry asks (mergeSameSizes()).
            $rowSizes = $this->mergeSameSizes(array_values(array_filter($row->tyreSizesForAxle($axle), static fn (TyreSize $size): bool => $size->allowsPower($powerKw))));

            // Intersection across documents: a size only one of them permits is not offered.
            $sizes = $sizes === null ? $rowSizes : TyreSize::intersect($sizes, $rowSizes);
            $tables[$row->document->id] = $row->document->speedDerating;

            foreach ($rowSizes as $size) {
                if ($size->documentMinLoadIndex !== null) {
                    $sizeLoadIndex = max($sizeLoadIndex ?? 0, $size->documentMinLoadIndex);
                }

                // The strictest symbol any offered size prints binds the axle: the 18″ Nachtrag gives one
                // car 89Y beside 91W, and the axle's line must not read W.
                $documentSpeedSymbol = $this->stricterPrinted($documentSpeedSymbol, $size->documentMinSpeedSymbol);
            }

            // The document's load-index limits that reach this axle: on the row, and on its sizes here.
            foreach ([$row->conditions, ...array_map(static fn (TyreSize $s): array => $s->conditions, $rowSizes)] as $list) {
                foreach ($list as $condition) {
                    if ($condition->kind === ConditionKind::ReifenTragfaehigkeit && $condition->maxAxleLoadKg !== null) {
                        $limits[$condition->code."\u{0}".$condition->maxAxleLoadKg] = $condition;
                    }
                }
            }
        }

        $derivedSpeedSymbol = $this->speedSymbol->forTopSpeed($maxSpeedKmh);

        // R-06: the stricter of document and derivation governs, and the verdict records which.
        [$minSpeedSymbol, $speedSource] = $this->stricterSpeedSymbol(
            $derivedSpeedSymbol?->symbol,
            $documentSpeedSymbol,
        );

        // The document's own table, at the speed rounded up; a „–“ for the governing symbol raises it to
        // the one the row requires, and says so. No table, no row, no column: nothing is derived.
        $lookup = null;
        $raisedFrom = null;
        $tableList = array_values($tables);

        if ($maxSpeedKmh !== null && $minSpeedSymbol !== null) {
            $lookup = SpeedDeratingTable::strictest($tableList, $maxSpeedKmh, $minSpeedSymbol);

            if ($lookup->isNotPermitted() && $lookup->required !== null) {
                $raisedFrom = $minSpeedSymbol;
                $minSpeedSymbol = $lookup->required;
                $speedSource = MinSource::Document;
                $lookup = SpeedDeratingTable::strictest($tableList, $maxSpeedKmh, $minSpeedSymbol);
            }
        }

        $derivedLoadIndex = $axleLoadKg === null || $axleLoadKg <= 0 || $lookup === null || $lookup->percent === null
            ? null
            : $this->loadIndex->forAxleAt($axleLoadKg, $lookup->percent);

        // The load-index limits: only codes that name an index (T88 → 88), read as the document states them —
        // the index the code names, up to the axle load it prints; the document wins even where that is not
        // exactly twice the index's capacity (the second review of C9, §3). The smallest index whose limit
        // reaches this axle binds; limits that all stop below it say nothing for it. Any other code with a
        // kilogram figure is an axle-load note: this axle above it is said, never read as a load index.
        $limit = null;
        $limitsUncovered = null;
        $axleNote = null;

        if ($axleLoadKg !== null && $axleLoadKg > 0 && $limits !== []) {
            $maxKg = 0;
            $named = 0;

            foreach ($limits as $condition) {
                $kg = (int) $condition->maxAxleLoadKg;
                $index = LoadIndexCode::indexNamedBy($condition->code);

                if ($index === null) {
                    if ($axleLoadKg > $kg) {
                        $axleNote ??= ['code' => $condition->code, 'kg' => $kg];
                    }

                    continue;
                }

                $named++;
                $maxKg = max($maxKg, $kg);

                if ($kg >= $axleLoadKg && ($limit === null || $index < $limit['index'])) {
                    $limit = ['code' => $condition->code, 'kg' => $kg, 'index' => $index];
                }
            }

            if ($limit === null && $named > 0) {
                $limitsUncovered = $maxKg;
            }
        }

        $documentLoadIndex = max($sizeLoadIndex ?? 0, $limit['index'] ?? 0) ?: null;

        [$minLoadIndex, $loadSource] = $this->stricterLoadIndex(
            $derivedLoadIndex?->index,
            $documentLoadIndex,
        );

        $binding = match (true) {
            $loadSource !== MinSource::Document => 'derived',
            $limit !== null && $limit['index'] === $minLoadIndex => 'limit',
            default => 'size',
        };

        $sourceTable = array_values(array_filter($tableList))[0] ?? null;
        $documentNumber = null;

        foreach ($covering as $row) {
            if ($row->document->speedDerating !== null) {
                $documentNumber = $row->document->number;

                break;
            }
        }

        return [
            new AxleRequirement(
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
            ),
            [
                'load' => $axleLoadKg,
                'speed' => $maxSpeedKmh,
                'symbol' => $minSpeedSymbol,
                'lookup' => $lookup,
                'raisedFrom' => $raisedFrom,
                'derived' => $derivedLoadIndex,
                'limit' => $limit,
                'axleNote' => $axleNote,
                'limitsUncovered' => $limitsUncovered,
                'binding' => $binding,
                'hasTable' => array_filter($tableList) !== [],
                // A table the demo seed wrote is never passed off as printed by this document.
                'tableSource' => match (true) {
                    $sourceTable === null => null,
                    $sourceTable->seededFrom !== null => 'Beispieltabelle aus den Demodaten, nicht aus dem Gutachten '.$documentNumber,
                    default => trim(sprintf(
                        'Tabelle%s im Gutachten %s',
                        $sourceTable->sourcePage === null ? '' : ' auf Seite '.$sourceTable->sourcePage,
                        (string) $documentNumber,
                    )),
                },
            ],
        ];
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

    /**
     * Of two symbols a document prints, the one that asks for more. One the table does not know is not
     * trusted over one it does; two it does not know keep the first.
     */
    private function stricterPrinted(?string $current, ?string $printed): ?string
    {
        if ($current === null || $printed === null) {
            return $current ?? $printed;
        }

        $currentRank = $this->speedSymbol->rankOf($current);
        $printedRank = $this->speedSymbol->rankOf($printed);

        if ($printedRank === null) {
            return $current;
        }

        return $currentRank === null || $printedRank > $currentRank ? $printed : $current;
    }

    /**
     * One size printed more than once for the car on one axle — ABE 55255 gives BMW Z3 its 225/35R19 at
     * 85–110 and at 85–125 kW, each with its own codes; the 18″ Nachtrag gives BMW 346X its 225/40R18 as 88W,
     * 88Y and 92 — becomes one size carrying what every entry asks: all their Auflagen, the Eintragung if any
     * needs it, the highest load index and the strictest speed symbol printed, and every kW band. The
     * customer buys one tyre that satisfies them all; that is cautious, never wrong.
     *
     * @param  list<TyreSize>  $sizes
     * @return list<TyreSize>
     */
    private function mergeSameSizes(array $sizes): array
    {
        $groups = [];

        foreach ($sizes as $size) {
            $groups[$size->key()][] = $size;
        }

        $out = [];

        foreach ($groups as $group) {
            if (count($group) === 1) {
                $out[] = $group[0];

                continue;
            }

            $loadIndex = null;
            $symbol = null;
            $axle = null;
            $entry = false;
            $conditions = [];
            $bands = [];
            $unbanded = false;

            foreach ($group as $size) {
                if ($size->documentMinLoadIndex !== null) {
                    $loadIndex = max($loadIndex ?? 0, $size->documentMinLoadIndex);
                }

                $symbol = $this->stricterPrinted($symbol, $size->documentMinSpeedSymbol);
                // Every entry covers the axle asked about; one that covers both makes the size a both-axle size.
                $axle = $axle === null || $axle === $size->axle ? $size->axle : 'ALL';
                $entry = $entry || $size->requiresEntry;
                $conditions = Condition::union($conditions, $size->conditions);

                if ($size->hasPowerBand()) {
                    $bands = [...$bands, ...$size->bands()];
                } else {
                    $unbanded = true;
                }
            }

            // An entry without a band permits the size at any power: the bands of the others then say nothing.
            $bands = $unbanded ? [] : $bands;
            $first = $group[0];

            $out[] = new TyreSize(
                widthMm: $first->widthMm,
                aspect: $first->aspect,
                diameterIn: $first->diameterIn,
                documentMinLoadIndex: $loadIndex,
                documentMinSpeedSymbol: $symbol,
                axle: (string) $axle,
                requiresEntry: $entry,
                conditions: $conditions,
                kwMin: $bands === [] ? null : min(array_column($bands, 0)),
                kwMax: $bands === [] ? null : max(array_column($bands, 1)),
                powerBands: $bands,
            );
        }

        return $out;
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
     * @param  DocumentRecord|null  $incomplete  a document of the wheel's whose Verwendungsbereich we hold only in part
     */
    private function negativeWithoutCoverage(
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        bool $documented,
        array $allRows,
        ?DocumentRecord $incomplete = null,
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

        // The rows do not name the car, and nobody has asserted that the document is entered whole (EIGENE-FUNDE 119,
        // D-227): a document is incomplete until someone says it is complete. With the missing Anlagen on record (ABE
        // 53841: 1–15 of 16) the answer names them; without, it says the entry is unconfirmed. „Noch nicht bestätigt“,
        // never „nicht zulässig“ (R-07). A car the rows DO name, and rule out by window or geometry, stays refused
        // below — the document spoke.
        if ($allRows === [] && $incomplete !== null) {
            return $this->negative(
                VerdictStatus::Unknown,
                $vehicle,
                $wheel,
                VerdictReason::of($incomplete->missingAnnexes !== null ? VerdictReason::ANNEX_MISSING : VerdictReason::COVERAGE_UNCONFIRMED),
                $incomplete,
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

    /** @param list<string> $missingFacts */
    private function negative(
        VerdictStatus $status,
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        VerdictReason $reason,
        ?DocumentRecord $document = null,
        array $missingFacts = [],
    ): FitmentVerdict {
        return FitmentVerdict::negative(
            $status,
            $vehicle,
            $wheel,
            $reason,
            $this->clock->now(),
            EngineVersion::CURRENT,
            $document,
            $missingFacts,
        );
    }
}
