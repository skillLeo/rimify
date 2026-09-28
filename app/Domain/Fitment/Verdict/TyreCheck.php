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
 * `lines` are full German sentences in reading order (R-15). `thresholds` are the document's own axle
 * limits (the `reifen_tragfaehigkeit` Auflagen), so a surface can set them beside the customer's figures
 * without parsing a sentence.
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
    ) {}

    /**
     * @return array{status: string, lines: list<string>, thresholds: list<array{textDe: string, maxAxleLoadKg: int}>, fromVehicleData: bool}
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status->value,
            'lines' => $this->lines,
            'thresholds' => $this->thresholds,
            'fromVehicleData' => $this->fromVehicleData,
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

        return new self(
            status: VerdictStatus::from((string) ($data['status'] ?? VerdictStatus::Unknown->value)),
            lines: array_values(array_map('strval', is_array($data['lines'] ?? null) ? $data['lines'] : [])),
            thresholds: $thresholds,
            fromVehicleData: (bool) ($data['fromVehicleData'] ?? false),
        );
    }
}
