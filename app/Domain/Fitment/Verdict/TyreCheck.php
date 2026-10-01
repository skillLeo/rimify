<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * The tyre half of a verdict (R-03 as amended on 28.09.2026, docs/specs/vehicles-and-tyres.md C9).
 *
 * A wheel verdict rests on the vehicle type and kW band a released Gutachten names; the tyres rest on
 * the car's permitted axle loads (8.1, 8.2) and top speed (T). Without those the tyre half is
 * CONDITIONAL — never positive — and says which threshold the document sets and which field of the
 * papers it is compared with. With them it is a definite answer, and the sum is shown.
 *
 * `lines` are full German sentences in reading order (R-15): with the car's figures, the whole sum —
 * frozen whole into the order snapshot and the printable RIMIFY-Check, whatever a surface folds away.
 * `summary` and `basis` are what a surface always shows of it (the operator's decision of 29.09.2026):
 * the binding axle and what it requires, and the document it came from. `stricterByPapers` says the
 * customer's own figures made the answer stricter than the vehicle data alone — the sum is then owed
 * at once, not behind a click. `thresholds` are the document's own axle limits (the
 * `reifen_tragfaehigkeit` Auflagen), so a surface can set them beside the customer's figures without
 * parsing a sentence.
 */
final readonly class TyreCheck
{
    /**
     * @param  list<string>  $lines
     * @param  list<array{textDe: string, maxAxleLoadKg: int}>  $thresholds
     */
    public function __construct(
        public VerdictStatus $status,
        public array $lines,
        public array $thresholds = [],
        /** Whether the answer rests on the car's own axle loads and top speed. */
        public bool $fromVehicleData = false,
        /** `Hinterachse mit 1.235 kg: mindestens Tragfähigkeitsindex 93, Geschwindigkeitsindex Y.` — or why not. */
        public ?string $summary = null,
        /** `Grundlage: Tabelle auf Seite 6 im Gutachten 55255.` */
        public ?string $basis = null,
        public bool $stricterByPapers = false,
        /**
         * Whether the car's own axle loads and top speed settled every axle on the figures — the document's load
         * table and its `reifen_tragfaehigkeit` limits included — so that only the document's written tyre rules
         * (which pairs, which axle) keep it CONDITIONAL. Those the eligibility reads itself (D-105); without this,
         * no tyre is sold against them.
         */
        public bool $figuresPermitted = false,
    ) {}

    public function withStricterByPapers(bool $stricter): self
    {
        return new self($this->status, $this->lines, $this->thresholds, $this->fromVehicleData, $this->summary, $this->basis, $stricter, $this->figuresPermitted);
    }

    /**
     * @return array{status: string, lines: list<string>, thresholds: list<array{textDe: string, maxAxleLoadKg: int}>, fromVehicleData: bool, summary: string|null, basis: string|null, stricterByPapers: bool, figuresPermitted: bool}
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status->value,
            'lines' => $this->lines,
            'thresholds' => $this->thresholds,
            'fromVehicleData' => $this->fromVehicleData,
            'summary' => $this->summary,
            'basis' => $this->basis,
            'stricterByPapers' => $this->stricterByPapers,
            'figuresPermitted' => $this->figuresPermitted,
        ];
    }

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        $thresholds = [];

        foreach (is_array($data['thresholds'] ?? null) ? $data['thresholds'] : [] as $row) {
            if (is_array($row) && isset($row['textDe'], $row['maxAxleLoadKg'])) {
                $thresholds[] = ['textDe' => (string) $row['textDe'], 'maxAxleLoadKg' => (int) $row['maxAxleLoadKg']];
            }
        }

        // A snapshot frozen before the summary existed reads back without one: the lines are all there.
        return new self(
            status: VerdictStatus::from((string) ($data['status'] ?? VerdictStatus::Unknown->value)),
            lines: array_values(array_map('strval', is_array($data['lines'] ?? null) ? $data['lines'] : [])),
            thresholds: $thresholds,
            fromVehicleData: (bool) ($data['fromVehicleData'] ?? false),
            summary: is_string($data['summary'] ?? null) ? $data['summary'] : null,
            basis: is_string($data['basis'] ?? null) ? $data['basis'] : null,
            stricterByPapers: (bool) ($data['stricterByPapers'] ?? false),
            // Additive (D-105): a snapshot frozen before reads false — it is never the input to a sale anyway.
            figuresPermitted: (bool) ($data['figuresPermitted'] ?? false),
        );
    }
}
