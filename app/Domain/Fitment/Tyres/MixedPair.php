<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Tyres;

use App\Domain\Fitment\Data\TyreRecord;
use App\Domain\Fitment\Data\TyreSize;
use App\Support\GermanFormat;

/**
 * One front/rear pair the document permits for this car on this wheel (#20, D-105): the two sizes as the car's row
 * lists them, what each axle asks of its tyres — worked out from that axle's own load — and the tyre sets that meet
 * it, one maker and one profile front and rear.
 *
 * @phpstan-type AxleMinimum array{loadIndex: int, speedSymbol: string, axleLoadKg: int|null}
 */
final readonly class MixedPair
{
    /**
     * @param  AxleMinimum  $frontMinimum
     * @param  AxleMinimum  $rearMinimum
     * @param  list<array{front: TyreRecord, rear: TyreRecord}>  $sets
     */
    public function __construct(
        public TyrePairing $pairing,
        /** The size as the car's row lists it on the front axle — with the Auflagen it carries itself. */
        public TyreSize $front,
        public TyreSize $rear,
        public array $frontMinimum,
        public array $rearMinimum,
        public array $sets,
    ) {}

    /** The axle that asks for more: the higher load index; where both ask the same, the heavier axle (as C-09 names it). */
    public function bindingAxle(): string
    {
        if ($this->frontMinimum['loadIndex'] !== $this->rearMinimum['loadIndex']) {
            return $this->frontMinimum['loadIndex'] > $this->rearMinimum['loadIndex'] ? 'FRONT' : 'REAR';
        }

        return ($this->frontMinimum['axleLoadKg'] ?? 0) > ($this->rearMinimum['axleLoadKg'] ?? 0) ? 'FRONT' : 'REAR';
    }

    /**
     * `Bei Mischbereifung prüfen wir jede Achse mit ihrer eigenen Achslast: vorne (1.210 kg) mindestens
     * Tragfähigkeitsindex 93 und Geschwindigkeitsindex Y, hinten (1.235 kg) mindestens Tragfähigkeitsindex 95 und
     * Geschwindigkeitsindex Y. Mehr verlangt die Hinterachse.`
     */
    public function minimumSentenceDe(): string
    {
        $axle = static fn (string $name, array $min): string => sprintf(
            '%s%s mindestens Tragfähigkeitsindex %d und Geschwindigkeitsindex %s',
            $name,
            $min['axleLoadKg'] === null ? '' : ' ('.GermanFormat::kilograms($min['axleLoadKg']).')',
            $min['loadIndex'],
            $min['speedSymbol'],
        );

        $sentence = 'Bei Mischbereifung prüfen wir jede Achse mit ihrer eigenen Achslast: '
            .$axle('vorne', $this->frontMinimum).', '.$axle('hinten', $this->rearMinimum).'.';

        if ($this->frontMinimum['loadIndex'] === $this->rearMinimum['loadIndex']) {
            return $sentence.' Beide Achsen verlangen denselben Tragfähigkeitsindex.';
        }

        return $sentence.' Mehr verlangt die '.($this->bindingAxle() === 'FRONT' ? 'Vorderachse' : 'Hinterachse').'.';
    }
}
