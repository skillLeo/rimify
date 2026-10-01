<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

use App\Domain\Fitment\Data\TyreSize;

/**
 * The Auflagen of an answer as the document hangs them: those for the whole combination — the row's own, the second
 * column of a Gutachten line, said once — and those a tyre size carries itself, said with that size and nowhere else.
 *
 * ABE 55255, page 5, BMW X3 X83: fine-link snow chains on the rear axle with 235/45R19 and 245/40R19 (A10), no chains
 * at all with 255/40R19 (A12) — the widest leaves no clearance. Blended into one list, the customer reads that chains
 * are allowed and that they are forbidden, and believes neither. So on every surface a size's Auflagen stay with it.
 *
 * An Auflage every permitted size carries is said once, with the combination: it applies whichever size is fitted.
 * With one permitted size there is nothing to choose, and everything is the combination's.
 *
 * @phpstan-type SizeGroup array{size: TyreSize, axle: string, own: list<Condition>, entry: bool}
 */
final readonly class ConditionGroups
{
    /**
     * @param  list<Condition>  $combination
     * @param  list<SizeGroup>  $sizes  every permitted size once, in the order the verdict names them
     */
    public function __construct(
        public array $combination,
        public array $sizes,
    ) {}

    /** @param list<Condition> $combination */
    public static function of(array $combination, AxleRequirement $front, AxleRequirement $rear): self
    {
        /** @var array<string, array{size: TyreSize, axles: array<string, true>, own: list<Condition>, entry: bool}> $bySize */
        $bySize = [];

        foreach ([['FRONT', $front->sizes], ['REAR', $rear->sizes]] as [$axle, $list]) {
            foreach ($list as $size) {
                $entry = $bySize[$size->key()] ?? ['size' => $size, 'axles' => [], 'own' => [], 'entry' => false];
                $entry['axles'][$axle] = true;
                $entry['own'] = Condition::union($entry['own'], $size->conditions);
                $entry['entry'] = $entry['entry'] || $size->requiresEntry;
                $bySize[$size->key()] = $entry;
            }
        }

        $key = static fn (Condition $c): string => $c->code."\u{0}".$c->sentenceDe();
        $said = array_flip(array_map($key, $combination));

        // What every size carries belongs to the combination; what the combination says, no size repeats.
        $common = null;

        foreach ($bySize as $entry) {
            $own = array_map($key, $entry['own']);
            $common = $common === null ? $own : array_values(array_intersect($common, $own));
        }

        foreach ($bySize as $entry) {
            foreach ($entry['own'] as $condition) {
                if (in_array($key($condition), $common, true) && ! isset($said[$key($condition)])) {
                    $combination[] = $condition;
                    $said[$key($condition)] = true;
                }
            }
        }

        $anyEntry = array_filter($bySize, static fn (array $e): bool => $e['entry']) !== [];
        $sizes = [];

        foreach ($bySize as $entry) {
            $own = array_values(array_filter($entry['own'], static fn (Condition $c): bool => ! isset($said[$key($c)])
                // „Keine Eintragung erforderlich.“ never stands beside a size that needs one.
                && ! ($entry['entry'] && $c->code === Condition::NO_ENTRY_REQUIRED)));

            $sizes[] = [
                'size' => $entry['size'],
                'axle' => match (true) {
                    isset($entry['axles']['FRONT'], $entry['axles']['REAR']) => 'Vorder- und Hinterachse',
                    isset($entry['axles']['FRONT']) => 'nur Vorderachse',
                    default => 'nur Hinterachse',
                },
                'own' => Condition::sorted($own),
                'entry' => $entry['entry'],
            ];
        }

        // Where any size needs the Eintragung, the combination does not say none is needed.
        if ($anyEntry) {
            $combination = array_values(array_filter($combination, static fn (Condition $c): bool => $c->code !== Condition::NO_ENTRY_REQUIRED));
        }

        return new self(Condition::sorted($combination), $sizes);
    }

    /** Some size carries an Auflage the others do not: the answer is said per size. */
    public function differBySize(): bool
    {
        foreach ($this->sizes as $size) {
            if ($size['own'] !== []) {
                return true;
            }
        }

        return false;
    }

    /** One size needs the Abnahme or Eintragung, another does not. */
    public function entryDiffers(): bool
    {
        $entries = array_unique(array_map(static fn (array $s): bool => $s['entry'], $this->sizes));

        return count($entries) > 1;
    }

    /**
     * Everything that applies once this size is fitted: the combination's and the size's own. A size the answer does
     * not name gets every Auflage there is — the cautious reading, never fewer.
     *
     * @return list<Condition>
     */
    public function forSize(string $key): array
    {
        foreach ($this->sizes as $size) {
            if ($size['size']->key() === $key) {
                return Condition::union($this->combination, $size['own']);
            }
        }

        return $this->all();
    }

    /**
     * Whether the Abnahme or Eintragung is needed once this size is fitted. No size given, or one the answer does not
     * name: `$otherwise` — the verdict's own flag, which is true if any size needs it (the cautious reading).
     */
    public function entryFor(?string $key, bool $otherwise): bool
    {
        foreach ($this->sizes as $size) {
            if ($key !== null && $size['size']->key() === $key) {
                return $size['entry'];
            }
        }

        return $otherwise;
    }

    /** @return list<Condition> every Auflage of the answer, once — for counting, never for showing */
    public function all(): array
    {
        $all = $this->combination;

        foreach ($this->sizes as $size) {
            $all = Condition::union($all, $size['own']);
        }

        return $all;
    }

    /**
     * The shape every surface renders (ConditionGroups.vue, the order mail): the combination's sentences once, then —
     * only where the sizes differ — each permitted size with its own. With a size chosen (a Komplettrad), just what
     * applies to that size.
     *
     * `entry`: with a size chosen, whether that size needs the Abnahme or Eintragung; otherwise null — the verdict's
     * own line stands, or (where `sizes` is filled and they differ) each size says it.
     *
     * @return array{combination: list<string>, sizes: list<array{size: string, axle: string, conditions: list<string>, entry: bool}>, chosen: string|null, entry: bool|null}
     */
    public function toArray(?string $chosenKey = null): array
    {
        $sentences = static fn (array $list): array => array_values(array_map(static fn (Condition $c): string => $c->sentenceDe(), $list));

        foreach ($this->sizes as $size) {
            if ($chosenKey !== null && $size['size']->key() === $chosenKey) {
                return ['combination' => $sentences($this->forSize($chosenKey)), 'sizes' => [], 'chosen' => $size['size']->labelDe(), 'entry' => $size['entry']];
            }
        }

        return [
            'combination' => $sentences($this->combination),
            'sizes' => $this->differBySize() || $this->entryDiffers()
                ? array_map(static fn (array $s): array => [
                    'size' => $s['size']->labelDe(),
                    'axle' => $s['axle'],
                    'conditions' => $sentences($s['own']),
                    'entry' => $s['entry'],
                ], $this->sizes)
                : [],
            'chosen' => null,
            'entry' => null,
        ];
    }
}
