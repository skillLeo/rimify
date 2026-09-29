<?php

declare(strict_types=1);

namespace App\Services\Demo;

use Random\Engine\Mt19937;
use Random\Randomizer;

/**
 * A seeded randomiser of its own: the same seed gives the same numbers on every machine and every
 * run, and nothing else in the process can move it on. One per day of the story, so a day's orders
 * never depend on how many numbers another day drew.
 */
final class DemoRandom
{
    private Randomizer $random;

    public function __construct(int $seed)
    {
        $this->random = new Randomizer(new Mt19937($seed));
    }

    /** A stream of its own for one key: the story's seed and, say, the day. */
    public static function for(int $seed, string $key): self
    {
        return new self((int) (crc32("{$seed}:{$key}") & 0x7FFFFFFF));
    }

    /** In [0, 1). */
    public function float(): float
    {
        return $this->random->nextFloat();
    }

    /** @return list<float> n numbers in [0, 1), drawn at once so a branch never shifts the stream */
    public function floats(int $n): array
    {
        $out = [];

        for ($i = 0; $i < $n; $i++) {
            $out[] = $this->random->nextFloat();
        }

        return $out;
    }

    public function int(int $min, int $max): int
    {
        return $this->random->getInt($min, $max);
    }

    /** How many of something happen, around `mean` (Poisson, Knuth's way: means stay small here). */
    public function count(float $mean): int
    {
        if ($mean <= 0) {
            return 0;
        }

        $limit = exp(-$mean);
        $n = 0;
        $p = $this->float();

        while ($p > $limit) {
            $n++;
            $p *= $this->float();
        }

        return $n;
    }

    /**
     * One key of a weighted list, by a number in [0, 1).
     *
     * @template K of array-key
     *
     * @param  array<K, float|int>  $weights
     * @return K
     */
    public static function weighted(array $weights, float $u): int|string
    {
        $total = array_sum($weights);
        $at = $u * $total;

        foreach ($weights as $key => $weight) {
            $at -= $weight;

            if ($at < 0) {
                return $key;
            }
        }

        return array_key_last($weights);
    }
}
