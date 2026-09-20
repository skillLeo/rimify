<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Resolver;

use App\Domain\Fitment\Data\VehicleRecord;

/**
 * The result of asking "what actually separates these candidates?".
 *
 * `attributes` holds only the attributes whose value differs across the candidate set, in the
 * order an owner can recognise them. `indistinguishable` means nothing displayable differs, in
 * which case the UI shows both candidates with their VSN and the reading help rather than
 * guessing — guessing here is exactly the confident wrong answer the governing rule forbids.
 *
 * @phpstan-type Row array{id: int, label: string, vsn: string|null, values: array<string, string>}
 */
final readonly class VehicleDistinction
{
    /**
     * @param  list<string>  $attributes  attribute keys, in display order
     * @param  list<array{id: int, label: string, vsn: string|null, values: array<string, string>}>  $rows
     */
    public function __construct(
        public array $attributes,
        public array $rows,
        public bool $indistinguishable,
    ) {}

    public function candidateCount(): int
    {
        return count($this->rows);
    }

    public function isRequired(): bool
    {
        return $this->candidateCount() > 1;
    }

    /**
     * @return array{
     *     required: bool,
     *     indistinguishable: bool,
     *     attributes: list<string>,
     *     labels: array<string, string>,
     *     rows: list<array{id: int, label: string, vsn: string|null, values: array<string, string>}>
     * }
     */
    public function toArray(): array
    {
        $labels = [];

        foreach ($this->attributes as $attribute) {
            $labels[$attribute] = VehicleDisambiguator::labelDe($attribute);
        }

        return [
            'required' => $this->isRequired(),
            'indistinguishable' => $this->indistinguishable,
            'attributes' => $this->attributes,
            'labels' => $labels,
            'rows' => $this->rows,
        ];
    }

    /** @param list<VehicleRecord> $candidates */
    public static function none(array $candidates = []): self
    {
        return new self([], array_map(
            static fn (VehicleRecord $v): array => [
                'id' => $v->id,
                'label' => $v->labelWithPeriod(),
                'vsn' => $v->vsn,
                'values' => [],
            ],
            $candidates,
        ), false);
    }
}
