<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Tyres\TyrePairing;

/**
 * The Auflagen typed beside one tyre combination of a Gutachten's list (the client's review of 11.11, A; D-451): „225/35 R18 vorn,
 * 255/35 R18 hinten · 11A“. They apply to that combination — both its axles at once — and to no other combination, even one that
 * shares a size with it. A verdict carries one of these per combination of the car's list that names any, frozen with it, so the
 * order says them as the customer read them.
 */
final readonly class PairConditions
{
    /** @param list<Condition> $conditions */
    public function __construct(
        public TyreSize $front,
        public TyreSize $rear,
        public array $conditions,
    ) {}

    /** `235/45/19|255/40/19` — front first, as TyrePairing::key(). */
    public function key(): string
    {
        return TyrePairing::keyOf($this->front->key(), $this->rear->key());
    }

    /** Whether one of its Auflagen is an Abnahme: the set needs the Eintragung. */
    public function requiresEntry(): bool
    {
        foreach ($this->conditions as $condition) {
            if ($condition->kind === ConditionKind::Abnahme || ($condition->kind === null && $condition->requiresEntry())) {
                return true;
            }
        }

        return false;
    }

    /** `225/35 R18 vorn, 255/35 R18 hinten`; one size on both axles: `225/40 R18 vorn und hinten`. */
    public function labelDe(): string
    {
        return $this->front->matches($this->rear)
            ? $this->front->labelDe().' vorn und hinten'
            : $this->front->labelDe().' vorn, '.$this->rear->labelDe().' hinten';
    }

    /** The same combination, its Auflagen joined with another document's for it: read together, toward caution. */
    public function joinedWith(self $other): self
    {
        return new self($this->front, $this->rear, Condition::sorted(Condition::union($this->conditions, $other->conditions)));
    }

    /** @return array{front: array{width: int, aspect: int, diameter: float}, rear: array{width: int, aspect: int, diameter: float}, conditions: list<array<string, mixed>>} */
    public function toArray(): array
    {
        $size = static fn (TyreSize $s): array => ['width' => $s->widthMm, 'aspect' => $s->aspect, 'diameter' => $s->diameterIn];

        return [
            'front' => $size($this->front),
            'rear' => $size($this->rear),
            'conditions' => array_map(static fn (Condition $c): array => $c->toArray(), $this->conditions),
        ];
    }

    /** @param array<string, mixed> $data */
    public static function fromArray(array $data): self
    {
        /** @var array{width: int, aspect: int, diameter: float|int|string} $front */
        $front = $data['front'];
        /** @var array{width: int, aspect: int, diameter: float|int|string} $rear */
        $rear = $data['rear'];
        /** @var list<array{code: string, severity: string, textDe: string}> $conditions */
        $conditions = is_array($data['conditions'] ?? null) ? $data['conditions'] : [];

        return new self(
            new TyreSize((int) $front['width'], (int) $front['aspect'], (float) $front['diameter']),
            new TyreSize((int) $rear['width'], (int) $rear['aspect'], (float) $rear['diameter']),
            array_map(static fn (array $c): Condition => Condition::fromArray($c), $conditions),
        );
    }
}
