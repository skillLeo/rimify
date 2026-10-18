<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

use App\Domain\Fitment\Data\DocumentRecord;
use App\Domain\Fitment\Data\VehicleRecord;
use App\Domain\Fitment\Data\WheelConfigRecord;
use App\Domain\Fitment\Support\BuildWindow;
use DateTimeImmutable;

/**
 * One shape, returned by one function, consumed by the listing, the product page, the tyre
 * selector, Rimify Check, the basket, the order and the confirmation email.
 *
 * If a surface needs a compatibility fact that is not here, this object grows — a surface never
 * computes its own. That is what makes it structurally impossible for four consumers to disagree
 * about whether a wheel is legal on a car.
 *
 * Immutable, because a verdict that can be edited after it is computed is not evidence.
 */
final readonly class FitmentVerdict
{
    /** @param list<Condition> $conditions */
    public function __construct(
        public VerdictStatus $status,
        public VehicleRecord $vehicle,
        public ?WheelConfigRecord $wheel,
        public ?DocumentRecord $document,
        public bool $requiresEntry,
        public ?string $entryNoteDe,
        public array $conditions,
        public AxleRequirement $front,
        public AxleRequirement $rear,
        public ?VerdictReason $reason,
        public VerdictSnapshot $snapshot,
        /**
         * The Mittenlochbohrung the covering documents state FOR THIS VEHICLE, in millimetres.
         *
         * Not `$wheel->centreBoreMm`, which is the rim's own figure: the same casting is measured
         * against the car it was tested on, so a customer with a chosen vehicle must be shown the
         * document's number for that car (R-06 — where the document states a value, it wins).
         *
         * Null whenever the engine cannot state one, and `$centreBoreSource` says why. The engine
         * never substitutes the rim's figure here; falling back to it is a presentation decision,
         * and one that must be labelled as the rim's own.
         */
        public ?float $documentCentreBoreMm = null,
        public CentreBoreSource $centreBoreSource = CentreBoreSource::Unstated,
        /**
         * The presentation strings AS SHOWN, carried rather than recomputed.
         *
         * A frozen verdict is evidence of what the customer read, so its labels are data. Left
         * null they are derived from the records; restored from a snapshot they are whatever was
         * rendered that day — which is what makes the round trip lossless even though the stored
         * record is necessarily thinner than the live one.
         */
        public ?string $vehicleLabel = null,
        public ?string $buildWindowLabel = null,
        public ?string $wheelLabel = null,
        /**
         * True only when this object was rebuilt from a frozen snapshot by `fromArray()`.
         *
         * It describes how the object was built, not what the document said, so `toArray()`
         * never emits it. A restored verdict is evidence of what was decided; it is never the
         * input to a fresh decision, and `TyreEligibility` refuses it outright.
         */
        public bool $restored = false,
        /**
         * Every document the answer rests on, the newest first (the corrections memo §3). One document
         * alone: just `$document`. Several that agree, or that a person decided both stand: each named.
         * Empty means `$document` alone.
         *
         * @var list<DocumentRecord>
         */
        public array $documents = [],
        /**
         * The two halves `status` is the weaker of (R-03 as amended on 28.09.2026): the wheel, from the
         * document alone, and the tyres, from the car's axle loads and top speed. Null on a negative
         * verdict and on a snapshot frozen before the split.
         */
        public ?VerdictStatus $wheelStatus = null,
        public ?TyreCheck $tyre = null,
        /**
         * What of the car the answer waits for (the operator's last prompt §1.1): `bodyForm`, `driveAxle` — the
         * document narrows by it and the car does not have it. Only on UNKNOWN, so the customer is asked for
         * exactly that: „Für dieses Fahrzeug fehlt die Karosserieform. Trag sie ein und wir prüfen sofort.“
         *
         * @var list<string>
         */
        public array $missingFacts = [],
        /**
         * The Auflagen for the whole combination — the rows' own (a Gutachten line's second column) and the kW-band
         * sentences — as opposed to those a tyre size carries itself (`TyreSize::$conditions`). `$conditions` holds
         * both, for the decision; what a customer reads comes from conditionGroups(), never from that blend. Null on
         * a snapshot frozen before the split, which conditionGroups() then reads from its sizes.
         *
         * @var list<Condition>|null
         */
        public ?array $combinationConditions = null,
    ) {}

    /**
     * The Auflagen as the document hangs them: the combination's once, each size's with that size (ConditionGroups).
     * Every surface that shows Auflagen shows these — never `$conditions`, which blends the sizes into one list.
     */
    public function conditionGroups(): ConditionGroups
    {
        $combination = $this->combinationConditions;

        if ($combination === null) {
            // Frozen before the split: what no size carries is the combination's.
            $bySizes = [];

            foreach ([...$this->front->sizes, ...$this->rear->sizes] as $size) {
                foreach ($size->conditions as $condition) {
                    $bySizes[$condition->code."\u{0}".$condition->sentenceDe()] = true;
                }
            }

            $combination = array_values(array_filter($this->conditions, static fn (Condition $c): bool => ! isset($bySizes[$c->code."\u{0}".$c->sentenceDe()])));
        }

        return ConditionGroups::of($combination, $this->front, $this->rear);
    }

    /**
     * This verdict, naming every document it rests on — newest first, the first being `$document`.
     *
     * @param  list<DocumentRecord>  $documents
     */
    public function withDocuments(array $documents): self
    {
        return new self(
            status: $this->status,
            vehicle: $this->vehicle,
            wheel: $this->wheel,
            document: $documents[0] ?? $this->document,
            requiresEntry: $this->requiresEntry,
            entryNoteDe: $this->entryNoteDe,
            conditions: $this->conditions,
            front: $this->front,
            rear: $this->rear,
            reason: $this->reason,
            snapshot: $this->snapshot,
            documentCentreBoreMm: $this->documentCentreBoreMm,
            centreBoreSource: $this->centreBoreSource,
            vehicleLabel: $this->vehicleLabel,
            buildWindowLabel: $this->buildWindowLabel,
            wheelLabel: $this->wheelLabel,
            restored: $this->restored,
            documents: count($documents) > 1 ? $documents : [],
            wheelStatus: $this->wheelStatus,
            tyre: $this->tyre,
            missingFacts: $this->missingFacts,
            combinationConditions: $this->combinationConditions,
        );
    }

    /** `SAME` unless the permitted sizes actually differ between the axles. */
    public function tyreLayout(): string
    {
        $front = array_map(static fn ($s): string => $s->key(), $this->front->sizes);
        $rear = array_map(static fn ($s): string => $s->key(), $this->rear->sizes);

        sort($front);
        sort($rear);

        return $front === $rear ? 'SAME' : 'MIXED';
    }

    public function isSellable(): bool
    {
        return $this->status->isSellable();
    }

    /**
     * „Felge freigegeben · Reifengröße noch nicht bestätigt“ (finding 103, D-214): the document approves the wheel for
     * the car, and the tyres' half is open — for want of something on record, a table or an index, or for want of the
     * car's figures, which the customer holds in the papers (`tyre->papersOwed`, D-286). Not for want of a fact the
     * customer is asked for in place (`missingFacts`). The product page words this state (useConfigurator's
     * `tyreUnconfirmed`); the go-live check counts the first kind.
     */
    public function tyreUnconfirmed(): bool
    {
        return $this->status === VerdictStatus::Unknown
            && ($this->wheelStatus === VerdictStatus::Permitted || $this->wheelStatus === VerdictStatus::Conditional)
            && $this->tyre?->status === VerdictStatus::Unknown
            && $this->missingFacts === [];
    }

    /** Any condition the customer must tick before the item can enter the basket. */
    public function requiresAcknowledgement(): bool
    {
        foreach ($this->conditions as $condition) {
            if ($condition->requiresAcknowledgement || $condition->severity->requiresAcknowledgement()) {
                return true;
            }
        }

        return false;
    }

    /**
     * A CONDITIONAL answer whose Auflagen are all Hinweise (#23, D-104): shown as „Freigegeben“ with a quiet line, not
     * „Mit Auflagen“. Only where nothing else makes it conditional — no Eintragung, the tyres' half not waiting on the
     * papers (R-03), no fact missing — and every Auflage, of every size, is a Hinweis (the blended list, D-094: the
     * louder reading wins). The status itself is untouched; this decides the words and the colour.
     */
    public function notesOnly(): bool
    {
        if ($this->status !== VerdictStatus::Conditional || $this->requiresEntry || $this->missingFacts !== [] || $this->conditions === []) {
            return false;
        }

        if ($this->tyre !== null && $this->tyre->status !== VerdictStatus::Permitted) {
            return false;
        }

        foreach ($this->conditions as $condition) {
            if ($condition->level() !== ConditionLevel::Hinweis) {
                return false;
            }
        }

        return true;
    }

    /** The badge's words: „Freigegeben“ for an answer whose Auflagen are all Hinweise (D-104), else the status's own. */
    public function displayLabelDe(): string
    {
        return $this->notesOnly() ? VerdictStatus::Permitted->labelDe() : $this->status->labelDe();
    }

    /**
     * The papers need no correction (§ 15 FZV): said only where the wheel may go on the car, and only where every
     * document the answer rests on frees them (PapersWording). A document that says nothing claims nothing.
     */
    public function papersExempt(): bool
    {
        // A wheel approved with its tyres unconfirmed may go on the car: its verdict is said in full (D-286).
        if (! ($this->isSellable() || $this->tyreUnconfirmed()) || $this->document === null || ! $this->document->papersExempt()) {
            return false;
        }

        foreach ($this->documents as $document) {
            if (! $document->papersExempt()) {
                return false;
            }
        }

        return true;
    }

    /**
     * The wire and storage shape, matching the spec's worked example key for key. This is
     * what `order_line_fitments.verdict` holds, so its stability is a compliance concern, not a
     * formatting preference.
     *
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status->value,
            'vehicle' => [
                'id' => (string) $this->vehicle->id,
                'label' => $this->vehicleLabel ?? $this->vehicle->labelWithPeriod(),
                'hsn' => $this->vehicle->hsn,
                'tsn' => $this->vehicle->tsn,
                'vsn' => $this->vehicle->vsn,
                'buildWindow' => $this->buildWindowLabel ?? $this->vehicle->buildWindow->labelDe(),
                'maxSpeedKmh' => $this->vehicle->maxSpeedKmh,
                'axleLoadFrontKg' => $this->vehicle->axleLoadFrontKg,
                'axleLoadRearKg' => $this->vehicle->axleLoadRearKg,
                // Additive: the body style and drive the answer was given for, and where each came from — the
                // vehicle data (null), the owner (`customer`) or a word of the name (`name`). A wrong answer
                // can always be traced to the assumption that produced it.
                'bodyForm' => $this->vehicle->bodyForm,
                'bodyFormSource' => $this->vehicle->bodyForm === null ? null : $this->vehicle->bodyFormSource,
                'driveAxle' => $this->vehicle->driveAxle,
                'driveAxleSource' => $this->vehicle->driveAxle === null ? null : $this->vehicle->driveAxleSource,
            ],
            'wheel' => $this->wheel === null ? null : [
                'configId' => (string) $this->wheel->id,
                'label' => $this->wheelLabel ?? $this->wheel->label(),
                'diameterIn' => $this->wheel->diameterIn,
                'widthIn' => $this->wheel->widthIn,
                'etMm' => $this->wheel->etMm,
            ],
            'document' => $this->document?->toArray(),
            // Additive: several documents the answer rests on, the newest first; absent for one.
            ...($this->documents === [] ? [] : ['documents' => array_map(static fn (DocumentRecord $d): array => $d->toArray(), $this->documents)]),
            'requiresEntry' => $this->requiresEntry,
            'entryNoteDe' => $this->entryNoteDe,
            // Additive, like the tyre-size keys before them: a snapshot written without these two
            // still reads, and one written now evidences which bore the customer was shown.
            'documentCentreBoreMm' => $this->documentCentreBoreMm,
            'centreBoreSource' => $this->centreBoreSource->value,
            'conditions' => array_map(static fn (Condition $c): array => $c->toArray(), $this->conditions),
            // Additive: the Auflagen for the whole combination, apart from those its sizes carry (under `tyres`), so the
            // order says each size's Auflagen with that size as the customer read them.
            ...($this->combinationConditions === null ? [] : ['combinationConditions' => array_map(static fn (Condition $c): array => $c->toArray(), $this->combinationConditions)]),
            'tyres' => [
                'perAxle' => $this->tyreLayout(),
                'front' => $this->front->toArray(),
                'rear' => $this->rear->toArray(),
            ],
            'reason' => $this->reason?->toArray(),
            'snapshot' => $this->snapshot->toArray(),
            // Additive: the two halves; a snapshot written before the split has neither.
            ...($this->wheelStatus === null ? [] : ['wheelStatus' => $this->wheelStatus->value]),
            ...($this->tyre === null ? [] : ['tyreCheck' => $this->tyre->toArray()]),
            // Additive: what of the car an UNKNOWN answer waits for.
            ...($this->missingFacts === [] ? [] : ['missingFacts' => $this->missingFacts]),
        ];
    }

    /**
     * Read a frozen snapshot back.
     *
     * The vehicle and wheel are reconstructed from what the snapshot recorded, NOT re-fetched:
     * the whole value of the record is that it says what was true on the day, even after the
     * catalogue has moved on.
     *
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        /** @var array<string, mixed> $vehicleData */
        $vehicleData = $data['vehicle'];
        /** @var array<string, mixed>|null $wheelData */
        $wheelData = $data['wheel'] ?? null;

        $vehicle = new VehicleRecord(
            id: (int) $vehicleData['id'],
            // A car from a Gutachten has no key numbers yet: its snapshot reads back without them, never as ''.
            hsn: isset($vehicleData['hsn']) ? (string) $vehicleData['hsn'] : null,
            tsn: isset($vehicleData['tsn']) ? (string) $vehicleData['tsn'] : null,
            vsn: $vehicleData['vsn'] === null ? null : (string) $vehicleData['vsn'],
            make: '',
            model: '',
            variant: (string) $vehicleData['label'],
            typeDesignation: null,
            buildWindow: BuildWindow::unbounded(),
            axleLoadFrontKg: $vehicleData['axleLoadFrontKg'] === null ? null : (int) $vehicleData['axleLoadFrontKg'],
            axleLoadRearKg: $vehicleData['axleLoadRearKg'] === null ? null : (int) $vehicleData['axleLoadRearKg'],
            maxSpeedKmh: $vehicleData['maxSpeedKmh'] === null ? null : (int) $vehicleData['maxSpeedKmh'],
            // A snapshot written before these were carried reads back without them.
            bodyForm: is_string($vehicleData['bodyForm'] ?? null) ? $vehicleData['bodyForm'] : null,
            driveAxle: is_string($vehicleData['driveAxle'] ?? null) ? $vehicleData['driveAxle'] : null,
            bodyFormSource: is_string($vehicleData['bodyFormSource'] ?? null) ? $vehicleData['bodyFormSource'] : null,
            driveAxleSource: is_string($vehicleData['driveAxleSource'] ?? null) ? $vehicleData['driveAxleSource'] : null,
        );

        $wheel = $wheelData === null ? null : new WheelConfigRecord(
            id: (int) $wheelData['configId'],
            wheelModelId: 0,
            wheelFinishId: 0,
            diameterIn: (float) $wheelData['diameterIn'],
            widthIn: (float) $wheelData['widthIn'],
            etMm: (int) $wheelData['etMm'],
            boltHoles: 0,
            boltCircleMm: 0.0,
            centreBoreMm: 0.0,
            priceCents: 0,
            stockQty: 0,
        );

        /**
         * @var list<array{
         *     code: string, severity: string, textDe: string, textEn?: string|null,
         *     affectsTyreChoice?: bool, affectsPurchase?: bool, requiresAcknowledgement?: bool
         * }> $conditions
         */
        $conditions = $data['conditions'] ?? [];

        return new self(
            status: VerdictStatus::from((string) $data['status']),
            vehicle: $vehicle,
            wheel: $wheel,
            document: isset($data['document']) && is_array($data['document'])
                ? DocumentRecord::fromArray($data['document'])
                : null,
            requiresEntry: (bool) $data['requiresEntry'],
            entryNoteDe: $data['entryNoteDe'] ?? null,
            conditions: array_map(static fn (array $c): Condition => Condition::fromArray($c), $conditions),
            front: AxleRequirement::fromArray($data['tyres']['front']),
            rear: AxleRequirement::fromArray($data['tyres']['rear']),
            reason: isset($data['reason']) && is_array($data['reason'])
                ? VerdictReason::fromArray($data['reason'])
                : null,
            snapshot: VerdictSnapshot::fromArray($data['snapshot']),
            // A snapshot written before the bore was carried says nothing about it, and nothing is
            // what it reads back as — never the rim's figure, which that order never showed.
            documentCentreBoreMm: isset($data['documentCentreBoreMm']) ? (float) $data['documentCentreBoreMm'] : null,
            centreBoreSource: CentreBoreSource::from((string) ($data['centreBoreSource'] ?? CentreBoreSource::Unstated->value)),
            // Carried, not recomputed: the stored record is thinner than the live one, so
            // re-deriving these would silently change what the order says it showed.
            vehicleLabel: (string) $vehicleData['label'],
            buildWindowLabel: (string) $vehicleData['buildWindow'],
            wheelLabel: $wheelData === null ? null : (string) $wheelData['label'],
            // The only construction site that passes true.
            restored: true,
            documents: array_values(array_map(
                static fn (mixed $d): DocumentRecord => DocumentRecord::fromArray((array) $d),
                is_array($data['documents'] ?? null) ? $data['documents'] : [],
            )),
            wheelStatus: isset($data['wheelStatus']) ? VerdictStatus::tryFrom((string) $data['wheelStatus']) : null,
            tyre: is_array($data['tyreCheck'] ?? null) ? TyreCheck::fromArray($data['tyreCheck']) : null,
            missingFacts: array_values(array_filter(
                is_array($data['missingFacts'] ?? null) ? $data['missingFacts'] : [],
                static fn (mixed $fact): bool => is_string($fact),
            )),
            // A snapshot frozen before the split has none; conditionGroups() reads it from the sizes.
            combinationConditions: is_array($data['combinationConditions'] ?? null)
                ? array_values(array_map(static fn (array $c): Condition => Condition::fromArray($c), $data['combinationConditions']))
                : null,
        );
    }

    /**
     * The shape every negative answer takes. Kept as one constructor so a new failure path cannot
     * accidentally produce a verdict that looks positive because a field was forgotten.
     *
     * @param  list<string>  $missingFacts
     */
    public static function negative(
        VerdictStatus $status,
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        VerdictReason $reason,
        DateTimeImmutable $computedAt,
        string $engineVersion,
        ?DocumentRecord $document = null,
        array $missingFacts = [],
    ): self {
        return new self(
            status: $status,
            vehicle: $vehicle,
            wheel: $wheel,
            document: $document,
            // A negative verdict never claims to know whether entry would be required — nor what
            // bore a document states for this car, which is why the two new fields stay defaulted.
            requiresEntry: false,
            entryNoteDe: null,
            conditions: [],
            front: AxleRequirement::none(),
            rear: AxleRequirement::none(),
            reason: $reason,
            snapshot: new VerdictSnapshot(null, $document?->revision, $computedAt, $engineVersion),
            missingFacts: $missingFacts,
        );
    }
}
