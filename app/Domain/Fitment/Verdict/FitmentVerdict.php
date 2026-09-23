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
    ) {}

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
            ],
            'wheel' => $this->wheel === null ? null : [
                'configId' => (string) $this->wheel->id,
                'label' => $this->wheelLabel ?? $this->wheel->label(),
                'diameterIn' => $this->wheel->diameterIn,
                'widthIn' => $this->wheel->widthIn,
                'etMm' => $this->wheel->etMm,
            ],
            'document' => $this->document?->toArray(),
            'requiresEntry' => $this->requiresEntry,
            'entryNoteDe' => $this->entryNoteDe,
            // Additive, like the tyre-size keys before them: a snapshot written without these two
            // still reads, and one written now evidences which bore the customer was shown.
            'documentCentreBoreMm' => $this->documentCentreBoreMm,
            'centreBoreSource' => $this->centreBoreSource->value,
            'conditions' => array_map(static fn (Condition $c): array => $c->toArray(), $this->conditions),
            'tyres' => [
                'perAxle' => $this->tyreLayout(),
                'front' => $this->front->toArray(),
                'rear' => $this->rear->toArray(),
            ],
            'reason' => $this->reason?->toArray(),
            'snapshot' => $this->snapshot->toArray(),
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
            hsn: (string) $vehicleData['hsn'],
            tsn: (string) $vehicleData['tsn'],
            vsn: $vehicleData['vsn'] === null ? null : (string) $vehicleData['vsn'],
            make: '',
            model: '',
            variant: (string) $vehicleData['label'],
            typeDesignation: null,
            buildWindow: BuildWindow::unbounded(),
            axleLoadFrontKg: $vehicleData['axleLoadFrontKg'] === null ? null : (int) $vehicleData['axleLoadFrontKg'],
            axleLoadRearKg: $vehicleData['axleLoadRearKg'] === null ? null : (int) $vehicleData['axleLoadRearKg'],
            maxSpeedKmh: $vehicleData['maxSpeedKmh'] === null ? null : (int) $vehicleData['maxSpeedKmh'],
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
        );
    }

    /**
     * The shape every negative answer takes. Kept as one constructor so a new failure path cannot
     * accidentally produce a verdict that looks positive because a field was forgotten.
     */
    public static function negative(
        VerdictStatus $status,
        VehicleRecord $vehicle,
        ?WheelConfigRecord $wheel,
        VerdictReason $reason,
        DateTimeImmutable $computedAt,
        string $engineVersion,
        ?DocumentRecord $document = null,
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
        );
    }
}
