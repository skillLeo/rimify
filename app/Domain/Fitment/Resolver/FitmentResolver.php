<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Contracts\Clock;
use App\Domain\Fitment\Contracts\FitmentRepository;
use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Data\ConflictDecision;
use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\FitmentRow;
use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
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
use App\Domain\Fitment\Verdict\PairConditions;
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
    /**
     * The tyres where the document lists its combinations per vehicle type and none for this car's EG number (D-358):
     * what is unknown, why, and what settles it — said of our record, never of the document (R-17).
     */
    public const NO_COMBINATION_ENTRY = 'Für die EG-Typgenehmigungsnummer deines Fahrzeugs (Feld K der Zulassungsbescheinigung Teil I) ist bei uns noch keine Bereifungskombination aus diesem Gutachten hinterlegt. Deshalb können wir die Reifen noch nicht bestätigen. Sobald die Kombinationen für deinen Fahrzeugtyp eingetragen sind, siehst du sie hier.';

    public function __construct(
        private VehicleRepository $vehicles,
        private FitmentRepository $fitments,
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
            // The codes that keep the car out, named in the answer where every row does (512a).
            $refusing = [];

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
                    // The row's own codes, or — where the row lets the car in and every size keeps it out — the sizes'.
                    $byRow = RowFilter::refusing($row->filters, $vehicle);
                    $refusing = [...$refusing, ...($byRow !== [] ? $byRow : array_merge([], ...array_map(static fn (TyreSize $s): array => RowFilter::refusing($s->filters, $vehicle), $row->tyreSizes)))];
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
                $verdicts[$id] = $this->negative(VerdictStatus::NotPermitted, $vehicle, $wheel, VerdictReason::excludedBy(array_map(static fn (RowFilter $f): ?string => $f->textDe, $refusing)), $excludedBy);

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
            } catch (ReferenceDataMissing) { // @codeCoverageIgnoreStart
                // Unreachable, kept as a fail-closed net (D-433): the engine refuses to start with empty index
                // tables (IndexTables' constructor — DerivationTest „refuses to construct an index table that is empty“).
                // A configuration fault must never present itself as a permissive legal answer.
                $verdicts[$id] = $this->negative(
                    VerdictStatus::Unknown,
                    $vehicle,
                    $wheel,
                    VerdictReason::of(VerdictReason::REFERENCE_DATA_MISSING),
                );
            } // @codeCoverageIgnoreEnd
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

        // D-481 (the client's message of 19.11.2026; R-03 and R-06 as amended on 21.11.2026): the tyres' minimum is what the
        // documents print beside each size — nothing is derived from the car's axle loads, its top speed or ETRTO's table.
        [$front] = $this->axleRequirement($covering, 'FRONT', $vehicle->powerKw);
        [$rear] = $this->axleRequirement($covering, 'REAR', $vehicle->powerKw);

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

        // The Auflagen typed beside a combination of the car's list (D-451): each said with its own combination only, both axles. For
        // the decision they count as they did on the combination's sizes: every one a combination with a permitted size brings.
        $pairConditions = self::pairConditions($covering, $front, $rear);

        foreach ($pairConditions as $pair) {
            $conditions = Condition::union($conditions, $pair->conditions);
            $requiresEntry = $requiresEntry || $pair->requiresEntry();
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
            $pairConditions = array_map(static fn (PairConditions $p): PairConditions => new PairConditions($p->front, $p->rear, array_values(array_filter($p->conditions, static fn (Condition $c): bool => $c->code !== Condition::NO_ENTRY_REQUIRED))), $pairConditions);
        }

        // Step 5's failure mode: the document covers the car but nothing is legally mountable.
        if (! $front->hasPermittedSizes() && ! $rear->hasPermittedSizes()) {
            // A covering row with no tyre size on record says nothing of the tyres: the release door refuses such a row
            // („Bei einem Fahrzeug fehlen noch die Reifen“), only data written past it holds one. Then the document has not ruled
            // the car out, our record of it is short — „Noch nicht bestätigt“, never „nicht freigegeben“ (M-6, the
            // operator's answer of 31.10.2026). Sizes on record that the car's kW band, its axles or a second document
            // leave none of stay refused below: there the documents spoke.
            if (array_filter($covering, static fn (FitmentRow $row): bool => $row->tyreSizes === []) !== []) {
                return $this->negative(
                    VerdictStatus::Unknown,
                    $vehicle,
                    $wheel,
                    VerdictReason::of(VerdictReason::TYRE_SIZES_NOT_RECORDED),
                    $covering[0]->document,
                );
            }

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

        // ── The tyre half, and the answer: the weaker of the two, never PERMITTED while the tyres are open.
        $tyre = $this->tyreCheck($vehicle, $wheel, $covering, $conditions, $front, $rear, $document);

        $status = VerdictStatus::weaker($wheelStatus, $tyre->status);

        // Since D-481 the tyres wait for nothing of the car: the rim is never sold alone for their sake (D-289 had it so).
        $sellsAlone = false;

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
            sellsAlone: $sellsAlone,
            pairConditions: $pairConditions,
        );
    }

    /**
     * The combinations of the car's lists with Auflagen of their own for this wheel (D-451) whose front size the front axle permits, or
     * whose rear size the rear: as many as when those Auflagen stood on the combination's sizes, never fewer — a set of two versions
     * asks its front wheel and its rear wheel apart. One per combination, the documents' read together.
     *
     * @param  list<FitmentRow>  $covering
     * @return list<PairConditions>
     */
    private static function pairConditions(array $covering, AxleRequirement $front, AxleRequirement $rear): array
    {
        $on = static fn (AxleRequirement $axle): array => array_fill_keys(array_map(static fn (TyreSize $s): string => $s->key(), $axle->sizes), true);
        $onFront = $on($front);
        $onRear = $on($rear);
        $byKey = [];
        $read = [];

        foreach ($covering as $row) {
            $table = $row->document->tyreCombinations;

            if ($table === null || isset($read[$row->document->id])) {
                continue;
            }

            $read[$row->document->id] = true;

            foreach ($table->pairs as $pairing) {
                if ($pairing->conditions === [] || (! isset($onFront[$pairing->front->key()]) && ! isset($onRear[$pairing->rear->key()]))) {
                    continue;
                }

                $pair = new PairConditions($pairing->front, $pairing->rear, Condition::sorted($pairing->conditions));
                $byKey[$pair->key()] = isset($byKey[$pair->key()]) ? $byKey[$pair->key()]->joinedWith($pair) : $pair;
            }
        }

        ksort($byKey);

        return array_values($byKey);
    }

    /**
     * The fields of the papers the wheel's own approval waits for (D-289): none, unless a covering document limits by
     * axle load — declared at release (`axleLimitKg`, „nur für Fahrzeuge mit maximaler Achslast 1160 kg“), or an Auflage
     * that names a load and no index — and the car's axle load on an axle the wheel may go on is not known. Never the top
     * speed: it decides the tyres' symbol, not the wheel.
     *
     * @param  list<FitmentRow>  $covering
     * @param  list<Condition>  $conditions
     * @return list<string>
     */
    private static function wheelOwed(VehicleRecord $vehicle, array $covering, array $conditions, AxleRequirement $front, AxleRequirement $rear): array
    {
        $limited = false;

        foreach ($covering as $row) {
            $limited = $limited || $row->document->axleLimitKg !== null;
        }

        foreach ($conditions as $condition) {
            $limited = $limited || ($condition->kind === ConditionKind::ReifenTragfaehigkeit && $condition->maxAxleLoadKg !== null && LoadIndexCode::indexNamedBy($condition->code) === null);
        }

        if (! $limited) {
            return [];
        }

        $known = static fn (?int $kg): bool => ! $vehicle->isDeleted && $kg !== null && $kg > 0;

        return [
            ...($front->hasPermittedSizes() && ! $known($vehicle->axleLoadFrontKg) ? ['8.1'] : []),
            ...($rear->hasPermittedSizes() && ! $known($vehicle->axleLoadRearKg) ? ['8.2'] : []),
        ];
    }

    /**
     * The tested wheel load against each axle the wheel may go on (the operator's review of C9, §4): null
     * when it holds, or when either figure is not known — the document's listing of the car governs then —
     * else why not, naming the axle that binds, with the sum.
     */
    private function wheelOverload(VehicleRecord $vehicle, ?WheelConfigRecord $wheel, AxleRequirement $front, AxleRequirement $rear): ?VerdictReason
    {
        $radlast = $wheel?->maxLoadKg;

        // The axle loads are all this needs: a car whose top speed is open is still checked (D-277) — the check only refuses.
        if ($radlast === null || $radlast <= 0 || ! $vehicle->hasAxleLoads()) {
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

        // The binding figure with its source, as the papers form names them (R-17): the customer's own, where it governs —
        // a mistyped 1.610 kg is then theirs to correct, not a fact about the wheel (the interaction review of D-291) —,
        // else ours. 8.1 and 8.2 are the permitted axle loads, never what the axle carries.
        $before = $vehicle->beforePapers;
        $dataLoad = $before === null ? null : ($name === 'Vorderachse' ? $before->axleLoadFrontKg : $before->axleLoadRearKg);
        $theirs = $before !== null && ($dataLoad === null || $load > $dataLoad);

        return new VerdictReason(VerdictReason::WHEEL_LOAD_EXCEEDED, sprintf(
            'Die Felge ist für %s je Rad geprüft. Maßgeblich ist die zulässige Achslast der %s: %s %s, also %s je Rad – mehr, als die Felge tragen darf.',
            GermanFormat::kilograms($radlast),
            $name,
            GermanFormat::kilograms($load),
            $theirs ? 'nach deiner Angabe aus Feld '.($name === 'Vorderachse' ? '8.1' : '8.2') : 'aus unseren Fahrzeugdaten',
            self::halfKg($load),
        ));
    }

    /**
     * The tyre half of the verdict (D-481: the client's message of 19.11.2026, „remove all validation logic for load and speed
     * indices … we will manually ensure that the combinations are valid“; R-03 and R-06 as amended on 21.11.2026).
     *
     * Nothing is derived from the car any more — not from its axle loads, not from its top speed, not from ETRTO's table —,
     * and nothing waits for its papers on the tyres' account. What stays is the documents' own word: the sizes they permit
     * (matched exactly), the figures they print beside a size — a tyre offered meets them (TyreEligibility) —, and their
     * Auflagen about tyres, which keep the answer CONDITIONAL. Two things still keep it „Noch nicht bestätigt“, both about
     * the wheel's approval itself, never about an index: a combination the documents list for no type of this car (D-358),
     * and a document that limits the wheel by axle load where the car's axle load is not known (D-289).
     *
     * @param  list<FitmentRow>  $covering
     * @param  list<Condition>  $conditions
     */
    private function tyreCheck(VehicleRecord $vehicle, ?WheelConfigRecord $wheel, array $covering, array $conditions, AxleRequirement $front, AxleRequirement $rear, DocumentRecord $document): TyreCheck
    {
        $thresholds = [];

        foreach ($conditions as $condition) {
            if ($condition->kind === ConditionKind::ReifenTragfaehigkeit && $condition->maxAxleLoadKg !== null) {
                $thresholds[] = ['textDe' => $condition->sentenceDe(), 'maxAxleLoadKg' => $condition->maxAxleLoadKg];
            }
        }

        // The document lists its combinations per vehicle type, and none takes in this car's EG number (his admin item 19,
        // D-358): what is not on record with us is the combination itself, so the tyres are „Noch nicht bestätigt“ — and
        // the car's papers cannot change that, so they are not asked for. The wheel's own verdict stands.
        if ($document->tyreCombinations?->unmatched === true) {
            return new TyreCheck(VerdictStatus::Unknown, [self::NO_COMBINATION_ENTRY], $thresholds, summary: self::NO_COMBINATION_ENTRY);
        }

        // The wheel's approval waits for an axle load where a document limits it by one (D-289) — the one figure of the car
        // still asked for, and only there.
        $owed = self::wheelOwed($vehicle, $covering, $conditions, $front, $rear);

        if ($owed !== []) {
            return new TyreCheck(VerdictStatus::Unknown, self::papersOwedLines($owed, $thresholds, $wheel), $thresholds, papersOwed: $owed);
        }

        $summary = self::printedSummary($front, $rear);
        $basis = 'Grundlage: Gutachten '.($document->number ?? '').'.';
        $restricting = array_filter($conditions, static fn (Condition $c): bool => $c->affectsTyreChoice);

        if ($restricting !== []) {
            $lines = ['Das Gutachten schreibt außerdem vor, welche Reifen du fahren darfst – die Auflagen unter „Reifen“ gelten zusätzlich.'];

            return new TyreCheck(VerdictStatus::Conditional, $lines, $thresholds, false, $summary, $basis, figuresPermitted: true);
        }

        return new TyreCheck(VerdictStatus::Permitted, [], $thresholds, false, $summary, $basis, figuresPermitted: true);
    }

    /**
     * What the documents print beside the sizes of the axles, as one line (D-481): `Laut Gutachten mindestens
     * Tragfähigkeitsindex 88, Geschwindigkeitsindex W.` — per axle where the axles differ; null where nothing is printed.
     */
    public static function printedSummary(AxleRequirement $front, AxleRequirement $rear, bool $perAxle = false): ?string
    {
        $says = static function (AxleRequirement $axle): ?string {
            $parts = array_filter([
                $axle->minLoadIndex === null ? null : 'Tragfähigkeitsindex '.$axle->minLoadIndex,
                $axle->minSpeedSymbol === null ? null : 'Geschwindigkeitsindex '.$axle->minSpeedSymbol,
            ]);

            return $parts === [] ? null : 'mindestens '.implode(', ', $parts);
        };

        $f = $front->hasPermittedSizes() ? $says($front) : null;
        $r = $rear->hasPermittedSizes() ? $says($rear) : null;

        return match (true) {
            $f === null && $r === null => null,
            ! $perAxle && ($f === $r || $r === null) => 'Laut Gutachten '.$f.'.',
            $f === null => 'Laut Gutachten an der Hinterachse '.$r.'.',
            $r === null => 'Laut Gutachten an der Vorderachse '.$f.'.',
            default => 'Laut Gutachten an der Vorderachse '.$f.'; an der Hinterachse '.$r.'.',
        };
    }

    /**
     * The answer where the car's axle loads are missing and a covering document limits the wheel by axle load (D-289), in
     * reading order: what is not on record with us; the document's own axle limits and the wheel's tested load, each with
     * the fields to compare (R-03); then the way on. Never the top speed: since D-481 nothing about the tyres asks for it.
     *
     * @param  list<string>  $owed  `8.1`, `8.2`
     * @param  list<array{textDe: string, maxAxleLoadKg: int}>  $thresholds
     * @return list<string>
     */
    private static function papersOwedLines(array $owed, array $thresholds, ?WheelConfigRecord $wheel): array
    {
        $front = in_array('8.1', $owed, true);
        $rear = in_array('8.2', $owed, true);
        // Each axle on its own where the data knows the other (D-291).
        [$axleWords, $axleFields] = match (true) {
            $front && $rear => ['die zulässigen Achslasten', 'Felder 8.1 und 8.2'],
            $front => ['die zulässige Achslast vorn', 'Feld 8.1'],
            default => ['die zulässige Achslast hinten', 'Feld 8.2'],
        };

        $lines = ['Für die Reifen '.($front && $rear ? 'fehlen' : 'fehlt')." uns {$axleWords} deines Fahrzeugs ({$axleFields})."];

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

        // One way on whatever is missing: the papers' form, which asks for what is missing and shows what is known (D-291).
        $lines[] = 'Trag die Werte aus deiner Zulassungsbescheinigung Teil I ein, dann zeigen wir dir, welche Reifen du fahren darfst.';

        return $lines;
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

    /** Half an axle load, as read: `550 kg`, `617,5 kg` — display only, never a decision. */
    private static function halfKg(int $axleLoadKg): string
    {
        return $axleLoadKg % 2 === 0
            ? GermanFormat::kilograms(intdiv($axleLoadKg, 2))
            : GermanFormat::integer(intdiv($axleLoadKg, 2)).',5'.GermanFormat::NBSP.'kg';
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
     * What one axle may carry (D-481): the sizes the covering documents permit on it — scoped to the axle, inside the car's kW
     * band where one is printed, merged where a document prints one size twice, and only those every document permits —, and
     * as its minimum only what the documents print beside those sizes: the highest load index, the strictest speed symbol.
     * Nothing is derived from the car. Where a document prints nothing beside a size, the size has no minimum; a symbol the
     * shop cannot rank is kept as printed, and a tyre must then carry exactly it (TyreEligibility).
     *
     * @param  list<FitmentRow>  $covering
     * @param  TyreSize|null  $only  this size alone: what the documents print beside it (D-431), never beside another size
     * @return array{0: AxleRequirement, 1: array<string, mixed>}
     */
    private function axleRequirement(array $covering, string $axle, ?int $powerKw = null, ?TyreSize $only = null): array
    {
        $sizes = null;
        $printedLoadIndex = null;
        $printedSpeedSymbol = null;

        foreach ($covering as $row) {
            if (! $this->rowCoversAxle($row, $axle)) {
                continue;
            }

            // Only the sizes the document permits on THIS axle, inside the car's kW band (Block D; power unknown: kept, and the
            // verdict says which band to compare with field P.2), one size printed twice merged into one (mergeSameSizes()).
            $rowSizes = $this->mergeSameSizes(array_values(array_filter($row->tyreSizesForAxle($axle), static fn (TyreSize $size): bool => $size->allowsPower($powerKw))));

            if ($only !== null) {
                $rowSizes = array_values(array_filter($rowSizes, static fn (TyreSize $size): bool => $size->matches($only)));
            }

            // Intersection across documents: a size only one of them permits is not offered.
            $sizes = $sizes === null ? $rowSizes : TyreSize::intersect($sizes, $rowSizes);

            foreach ($rowSizes as $size) {
                if ($size->documentMinLoadIndex !== null) {
                    $printedLoadIndex = max($printedLoadIndex ?? 0, $size->documentMinLoadIndex);
                }

                // The strictest symbol any offered size prints is the axle's: one the shop cannot rank never wins over one it
                // can, and stands alone where it is the only one printed.
                $printedSpeedSymbol = $this->stricterPrinted($printedSpeedSymbol, $size->documentMinSpeedSymbol);
            }
        }

        // Each size's own printed figures beside the axle's strictest (D-431): never where the axle has one size.
        $bySize = [];

        if ($only === null && $sizes !== null && count($sizes) > 1) {
            foreach ($sizes as $size) {
                [$own] = $this->axleRequirement($covering, $axle, $powerKw, $size);
                $bySize[] = [
                    'key' => $size->key(),
                    'minLoadIndex' => $own->minLoadIndex,
                    'minSpeedSymbol' => $own->minSpeedSymbol,
                    'minLoadSource' => MinSource::Document->value,
                    'minSpeedSource' => MinSource::Document->value,
                ];
            }
        }

        return [
            new AxleRequirement(
                sizes: $sizes ?? [],
                minLoadIndex: $printedLoadIndex,
                minSpeedSymbol: $printedSpeedSymbol,
                minSource: MinSource::Document,
                minLoadSource: MinSource::Document,
                minSpeedSource: MinSource::Document,
                bySize: $bySize,
            ),
            ['axle' => $axle, 'documentLoadIndex' => $printedLoadIndex, 'symbol' => $printedSpeedSymbol],
        ];
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
