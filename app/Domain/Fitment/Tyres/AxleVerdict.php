<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Verdict\Condition;
use App\Domain\Fitment\Verdict\VerdictStatus;

/**
 * One axle of a Komplettrad sold as a combination (D-335): the size the combination names for it, as the car's row lists
 * it there; the tyre on it; what that axle asks of a tyre at its own permitted load — 8.1 at the front, 8.2 at the rear —
 * and the car's top speed (R-03); the Auflagen that hold on it; and the answer for it, never stronger than the answer for
 * the wheel on the car.
 *
 * @phpstan-import-type AxleMinimum from MixedPair
 */
final readonly class AxleVerdict
{
    /**
     * @param  'FRONT'|'REAR'  $axle
     * @param  AxleMinimum|null  $minimum  null where the axle's minimum cannot be stated — never „no minimum“
     * @param  list<Condition>  $conditions  the combination's Auflagen and the size's own, as the customer reads them
     */
    public function __construct(
        public string $axle,
        public TyreSize $size,
        public TyreRecord $tyre,
        public VerdictStatus $status,
        /** Why the tyre does not stand on this axle; null where it does. A code, never rendered (R-15). */
        public ?KomplettradRefusal $refusal,
        public ?array $minimum,
        public array $conditions,
        public bool $requiresEntry,
    ) {}

    /** `Vorderachse`, `Hinterachse` — the scope the customer reads the axle's Auflagen under. */
    public function labelDe(): string
    {
        return self::label($this->axle);
    }

    /** @param  'FRONT'|'REAR'|string  $axle */
    public static function label(string $axle): string
    {
        return $axle === 'FRONT' ? 'Vorderachse' : 'Hinterachse';
    }

    /**
     * As the order line freezes it (R-12): the axle, its size, the tyre as fitted, the answer with what it was measured
     * against, and the Auflagen in full sentences (R-15).
     *
     * @return array{
     *     axle: string, axleLabel: string, size: string, sizeKey: string,
     *     tyre: array{id: int, brandName: string|null, name: string|null, season: string|null, label: string, loadIndex: int, speedSymbol: string},
     *     status: string, refusal: string|null, minLoadIndex: int|null, minSpeedSymbol: string|null, axleLoadKg: int|null,
     *     conditions: list<string>, requiresEntry: bool
     * }
     */
    public function toArray(): array
    {
        return [
            'axle' => $this->axle,
            'axleLabel' => $this->labelDe(),
            'size' => $this->size->labelDe(),
            'sizeKey' => $this->size->key(),
            'tyre' => [
                'id' => $this->tyre->id,
                'brandName' => $this->tyre->brandName,
                'name' => $this->tyre->name,
                'season' => $this->tyre->season,
                'label' => $this->tyre->label(),
                'loadIndex' => $this->tyre->loadIndex,
                'speedSymbol' => $this->tyre->speedSymbol,
            ],
            'status' => $this->status->value,
            'refusal' => $this->refusal?->value,
            'minLoadIndex' => $this->minimum['loadIndex'] ?? null,
            'minSpeedSymbol' => $this->minimum['speedSymbol'] ?? null,
            'axleLoadKg' => $this->minimum['axleLoadKg'] ?? null,
            'conditions' => array_map(static fn (Condition $c): string => $c->sentenceDe(), $this->conditions),
            'requiresEntry' => $this->requiresEntry,
        ];
    }
}
