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
 * Where the document lists its combinations (D-256), every combination it names is such a pair, the same size on both
 * axles included — the Komplettrad is the combination, never four of one size (D-335). An axle the shop has no tyre for
 * in its size is named (`missing`): the combination then has no set, and nothing fills the gap.
 *
 * @phpstan-type AxleMinimum array{loadIndex: int, speedSymbol: string, axleLoadKg: int|null}
 */
final readonly class MixedPair
{
    /**
     * @param  AxleMinimum  $frontMinimum
     * @param  AxleMinimum  $rearMinimum
     * @param  list<array{front: TyreRecord, rear: TyreRecord}>  $sets
     * @param  list<'FRONT'|'REAR'>  $missing  the axles no tyre the shop sells meets, in the size the pair names for them
     */
    public function __construct(
        public TyrePairing $pairing,
        /** The size as the car's row lists it on the front axle — with the Auflagen it carries itself. */
        public TyreSize $front,
        public TyreSize $rear,
        public array $frontMinimum,
        public array $rearMinimum,
        public array $sets,
        public array $missing = [],
        /** A combination of the document's own list (D-256), the same size on both axles included — not a printed table's pair. */
        public bool $listed = false,
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
     * Geschwindigkeitsindex Y. Mehr verlangt die Hinterachse.` — for a combination of the document's list, which may name
     * one size on both axles and gets each axle's tyre on its own (D-335), each axle as the tyre verdict says it
     * (FitmentResolver::bindingSummary): `Wir prüfen jede Achse mit ihrer eigenen Achslast. Vorderachse mit 1.210 kg:
     * mindestens Tragfähigkeitsindex 93, Geschwindigkeitsindex Y; Hinterachse mit 1.235 kg: …` — no axle „asks for more“
     * where each has its own tyre.
     */
    public function minimumSentenceDe(): string
    {
        if ($this->listed) {
            $says = static fn (string $name, array $min): string => sprintf(
                '%s%s: mindestens Tragfähigkeitsindex %d, Geschwindigkeitsindex %s',
                $name,
                $min['axleLoadKg'] === null ? '' : ' mit '.GermanFormat::kilograms($min['axleLoadKg']),
                $min['loadIndex'],
                $min['speedSymbol'],
            );

            return 'Wir prüfen jede Achse mit ihrer eigenen Achslast. '.$says('Vorderachse', $this->frontMinimum).'; '.$says('Hinterachse', $this->rearMinimum).'.';
        }

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

    /**
     * Why this pair has no set, in one sentence — the axle the shop has no tyre for, by name and size; null where it has
     * one. Ours, not the document's: it says what we can offer, never what the Gutachten permits (R-17).
     */
    public function noSetSentenceDe(): ?string
    {
        if ($this->sets !== []) {
            return null;
        }

        $front = in_array('FRONT', $this->missing, true);
        $rear = in_array('REAR', $this->missing, true);

        $why = match (true) {
            $front && $rear && $this->pairing->sameSize() => sprintf('Für %s können wir dir gerade keinen passenden Reifen anbieten', $this->front->labelDe()),
            $front && $rear => sprintf('Für die Vorderachse (%s) und die Hinterachse (%s) können wir dir gerade keine passenden Reifen anbieten', $this->front->labelDe(), $this->rear->labelDe()),
            $front => sprintf('Für die Vorderachse (%s) können wir dir gerade keinen passenden Reifen anbieten', $this->front->labelDe()),
            $rear => sprintf('Für die Hinterachse (%s) können wir dir gerade keinen passenden Reifen anbieten', $this->rear->labelDe()),
            default => 'In diesen Größen können wir dir vorne und hinten gerade keine Reifen desselben Herstellers und derselben Profilreihe anbieten',
        };

        return $why.' – ein Komplettrad gibt es in dieser Kombination deshalb nicht. Die Felge allein kannst du bestellen.';
    }
}
