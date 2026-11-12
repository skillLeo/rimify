<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Tyres\TyrePairing;

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
 * An Auflage typed beside a tyre combination of the list (the client's review of 11.11, A; D-451) is that combination's: said with
 * it, for both its axles, and with no other combination — not even one that shares a size with it.
 *
 * @phpstan-type SizeGroup array{size: TyreSize, axle: string, own: list<Condition>, entry: bool}
 * @phpstan-type PairGroup array{pair: PairConditions, own: list<Condition>, entry: bool}
 */
final readonly class ConditionGroups
{
    /**
     * @param  list<Condition>  $combination
     * @param  list<SizeGroup>  $sizes  every permitted size once, in the order the verdict names them
     * @param  list<PairGroup>  $pairs  every tyre combination of the list with Auflagen of its own
     */
    public function __construct(
        public array $combination,
        public array $sizes,
        public array $pairs = [],
    ) {}

    /**
     * @param  list<Condition>  $combination
     * @param  list<PairConditions>  $pairs
     */
    public static function of(array $combination, AxleRequirement $front, AxleRequirement $rear, array $pairs = []): self
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

        // A combination's own, with it: what the wheel's Auflagen say already is not said twice.
        $groups = [];

        foreach ($pairs as $pair) {
            $entry = $pair->requiresEntry();
            $own = array_values(array_filter($pair->conditions, static fn (Condition $c): bool => ! isset($said[$key($c)])
                && ! ($entry && $c->code === Condition::NO_ENTRY_REQUIRED)));

            if ($own !== []) {
                $groups[] = ['pair' => $pair, 'own' => Condition::sorted($own), 'entry' => $entry];
                $anyEntry = $anyEntry || $entry;
            }
        }

        // Where any size or combination needs the Eintragung, the combination does not say none is needed.
        if ($anyEntry) {
            $combination = array_values(array_filter($combination, static fn (Condition $c): bool => $c->code !== Condition::NO_ENTRY_REQUIRED));
        }

        return new self(Condition::sorted($combination), $sizes, $groups);
    }

    /** Some size or tyre combination carries an Auflage the others do not: the answer is said per size, per combination. */
    public function differBySize(): bool
    {
        return $this->sizesDiffer() || $this->pairs !== [];
    }

    private function sizesDiffer(): bool
    {
        foreach ($this->sizes as $size) {
            if ($size['own'] !== []) {
                return true;
            }
        }

        return false;
    }

    /**
     * What this combination of the list carries itself (D-451): its own Auflagen, beyond the wheel's.
     *
     * @return list<Condition>
     */
    public function pairOwn(string $frontKey, string $rearKey): array
    {
        $key = TyrePairing::keyOf($frontKey, $rearKey);

        foreach ($this->pairs as $pair) {
            if ($pair['pair']->key() === $key) {
                return $pair['own'];
            }
        }

        return [];
    }

    private function pairEntry(string $frontKey, string $rearKey): bool
    {
        $key = TyrePairing::keyOf($frontKey, $rearKey);

        foreach ($this->pairs as $pair) {
            if ($pair['pair']->key() === $key) {
                return $pair['entry'];
            }
        }

        return false;
    }

    /**
     * Everything that applies once this combination is fitted, front and rear (D-451): the wheel's, each size's own and the
     * combination's own.
     *
     * @return list<Condition>
     */
    public function forPair(string $frontKey, string $rearKey): array
    {
        return Condition::union(Condition::union($this->forSize($frontKey), $this->ownFor($rearKey)), $this->pairOwn($frontKey, $rearKey));
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
                // Four of a kind: the combination of that size on both axles brings its own too (D-451).
                return Condition::union(Condition::union($this->combination, $size['own']), $this->pairOwn($key, $key));
            }
        }

        return $this->all();
    }

    /**
     * What this size carries beyond the combination's — said under the size, or on a set per axle under the axle's name
     * (D-335). A size the answer does not name gets every size's own: the cautious reading, never fewer.
     *
     * @return list<Condition>
     */
    public function ownFor(string $key): array
    {
        $all = [];

        foreach ($this->sizes as $size) {
            if ($size['size']->key() === $key) {
                return $size['own'];
            }

            $all = Condition::union($all, $size['own']);
        }

        return $all;
    }

    /**
     * Whether the Abnahme or Eintragung is needed once this size is fitted. No size given, or one the answer does not
     * name: `$otherwise` — the verdict's own flag, which is true if any size needs it (the cautious reading).
     */
    public function entryFor(?string $key, bool $otherwise): bool
    {
        foreach ($this->sizes as $size) {
            if ($key !== null && $size['size']->key() === $key) {
                return $size['entry'] || $this->pairEntry($key, $key);
            }
        }

        return $otherwise;
    }

    /**
     * Whether a set per axle needs the Abnahme or Eintragung (D-335): the car carries both sizes at once, so the set
     * needs it where either size does — on the axle that does not as much as on the one that does. A size the answer does
     * not name: needed, the cautious reading.
     */
    public function entryForSet(string $key, string $partnerKey): bool
    {
        return $this->entryFor($key, true) || $this->entryFor($partnerKey, true)
            // The combination's own Abnahme (D-451), whichever axle `$key` stands on.
            || $this->pairEntry($key, $partnerKey) || $this->pairEntry($partnerKey, $key);
    }

    /**
     * What holds once this size is fitted — on a set per axle beside `$partnerKey` on the other axle (D-335), with the Auflagen of
     * that combination (D-451), and without „Keine Eintragung erforderlich.“ where the set needs the Eintragung for the other axle's
     * size. `$axle`, `Vorderachse` or `Hinterachse`, says which way round the combination is; not given, both ways (the cautious
     * reading).
     *
     * @return list<Condition>
     */
    public function forSet(string $key, ?string $partnerKey, ?string $axle = null): array
    {
        $conditions = $this->forSize($key);

        if ($partnerKey === null) {
            return $conditions;
        }

        $own = match ($axle) {
            'Vorderachse' => $this->pairOwn($key, $partnerKey),
            'Hinterachse' => $this->pairOwn($partnerKey, $key),
            default => Condition::union($this->pairOwn($key, $partnerKey), $this->pairOwn($partnerKey, $key)),
        };
        $conditions = Condition::sorted(Condition::union($conditions, $own));

        if (! $this->entryForSet($key, $partnerKey)) {
            return $conditions;
        }

        return array_values(array_filter($conditions, static fn (Condition $c): bool => $c->code !== Condition::NO_ENTRY_REQUIRED));
    }

    /** @return list<Condition> every Auflage of the answer, once — for counting, never for showing */
    public function all(): array
    {
        $all = $this->combination;

        foreach ($this->sizes as $size) {
            $all = Condition::union($all, $size['own']);
        }

        foreach ($this->pairs as $pair) {
            $all = Condition::union($all, $pair['own']);
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
     * `$axle`: on a set sold per axle (D-335), the axle the chosen size stands on — `Vorderachse`, `Hinterachse` — said
     * beside it, so the customer reads each axle's Auflagen under its name, as each size's are under its own (D-199).
     * `$partnerKey`: the other axle's size on that set — the Abnahme or Eintragung is the set's, never one axle's
     * (entryForSet()): a front line never says „Keine Eintragung erforderlich.“ beside a rear that needs one.
     *
     * `pairs`: with no size chosen, each tyre combination of the list that carries Auflagen of its own (D-451) — „225/35 R18 vorn,
     * 255/35 R18 hinten“ with them, for both its axles.
     *
     * @return array{combination: list<string>, sizes: list<array{size: string, axle: string, conditions: list<string>, entry: bool}>, pairs: list<array{pair: string, conditions: list<string>, entry: bool}>, chosen: string|null, entry: bool|null, axle?: string}
     */
    public function toArray(?string $chosenKey = null, ?string $axle = null, ?string $partnerKey = null): array
    {
        $sentences = static fn (array $list): array => array_values(array_map(static fn (Condition $c): string => $c->sentenceDe(), $list));

        foreach ($this->sizes as $size) {
            if ($chosenKey !== null && $size['size']->key() === $chosenKey) {
                return [
                    'combination' => $sentences($this->forSet($chosenKey, $partnerKey, $axle)),
                    'sizes' => [],
                    'pairs' => [],
                    'chosen' => $size['size']->labelDe(),
                    'entry' => $partnerKey === null ? $this->entryFor($chosenKey, $size['entry']) : $this->entryForSet($chosenKey, $partnerKey),
                    ...($axle === null ? [] : ['axle' => $axle]),
                ];
            }
        }

        return [
            'combination' => $sentences($this->combination),
            'sizes' => $this->sizesDiffer() || $this->entryDiffers()
                ? array_map(static fn (array $s): array => [
                    'size' => $s['size']->labelDe(),
                    'axle' => $s['axle'],
                    'conditions' => $sentences($s['own']),
                    'entry' => $s['entry'],
                ], $this->sizes)
                : [],
            'pairs' => array_map(static fn (array $p): array => [
                'pair' => $p['pair']->labelDe(),
                'conditions' => $sentences($p['own']),
                'entry' => $p['entry'],
            ], $this->pairs),
            'chosen' => null,
            'entry' => null,
        ];
    }
}
