<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Derivation;

/**
 * The canonical reference data the derivations run against (spec, Appendices B and C).
 *
 * This is the ONE place these figures are written down in code. The database tables
 * `load_index_table` and `speed_symbol_table` are seeded from here, so the client's compliance
 * owner can verify them against a printed reference without a deployment, and a test asserts the
 * seeded rows equal these constants. At runtime the engine reads the tables through
 * `Contracts\IndexTableRepository`; these constants are the seed and the test oracle, never a
 * silent fallback that could mask an empty table.
 */
final class ReferenceTables
{
    /**
     * Load index => capacity per tyre in kilograms. Passenger-car range, ascending.
     *
     * @var array<int, int>
     */
    public const LOAD_INDEX_CAPACITY_KG = [
        70 => 335, 71 => 345, 72 => 355, 73 => 365, 74 => 375, 75 => 387, 76 => 400, 77 => 412,
        78 => 425, 79 => 437, 80 => 450, 81 => 462, 82 => 475, 83 => 487, 84 => 500, 85 => 515,
        86 => 530, 87 => 545, 88 => 560, 89 => 580, 90 => 600, 91 => 615, 92 => 630, 93 => 650,
        94 => 670, 95 => 690, 96 => 710, 97 => 730, 98 => 750, 99 => 775, 100 => 800, 101 => 825,
        102 => 850, 103 => 875, 104 => 900, 105 => 925, 106 => 950, 107 => 975, 108 => 1000, 109 => 1030,
    ];

    /**
     * Speed symbols in ascending order of rank. `max_kmh` null means "above 300 km/h".
     *
     * H sits between U and V. Speed symbols are compared by `rank`, never as letters: comparing
     * the characters is code that reads correct and is wrong, in the permissive direction.
     *
     * **The table must stay complete.** A truncated set does not fail loudly — it silently
     * returns the first symbol that happens to be present, which is over-strict (and, with a
     * different omission, could be over-permissive). That is exactly how the spec's worked
     * example came to print `T` for a 148 km/h car whose legal minimum is `P`
     * (docs/decisions.md D-018). `L` and `M` are rarely seen on passenger cars but they are part
     * of the scale, so they are here.
     *
     * @var list<array{symbol: string, rank: int, max_kmh: int|null}>
     */
    public const SPEED_SYMBOLS = [
        ['symbol' => 'L', 'rank' => 1, 'max_kmh' => 120],
        ['symbol' => 'M', 'rank' => 2, 'max_kmh' => 130],
        ['symbol' => 'N', 'rank' => 3, 'max_kmh' => 140],
        ['symbol' => 'P', 'rank' => 4, 'max_kmh' => 150],
        ['symbol' => 'Q', 'rank' => 5, 'max_kmh' => 160],
        ['symbol' => 'R', 'rank' => 6, 'max_kmh' => 170],
        ['symbol' => 'S', 'rank' => 7, 'max_kmh' => 180],
        ['symbol' => 'T', 'rank' => 8, 'max_kmh' => 190],
        ['symbol' => 'U', 'rank' => 9, 'max_kmh' => 200],
        ['symbol' => 'H', 'rank' => 10, 'max_kmh' => 210],
        ['symbol' => 'V', 'rank' => 11, 'max_kmh' => 240],
        ['symbol' => 'W', 'rank' => 12, 'max_kmh' => 270],
        ['symbol' => 'Y', 'rank' => 13, 'max_kmh' => 300],
        ['symbol' => '(Y)', 'rank' => 14, 'max_kmh' => null],
    ];

    private function __construct() {}
}
