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
     * The figures are those printed in Annex IV „Load-capacity indices“ of UN/ECE Regulation No 30 (passenger-car
     * tyres; Official Journal of the European Union L 201, 30.7.2008, p. 90), index by index — never extrapolated,
     * interpolated or computed from a neighbour (D-310, the operator's brief of 19.10.2026 §1). The table ends where
     * that annex ends, at 120: an index it does not print has no capacity here, and a tyre or a document row naming one
     * is refused rather than estimated. Annex IV of Regulation No 54 (OJ L 183, 11.7.2008, pp. 57–60) prints the same
     * values; LoadIndexSourceTest holds every entry to both, from their text as extracted (tests/Fixtures/reference).
     *
     * A capacity here grants no permission: a Gutachten still has to name the size for the car. The table only states
     * what a tyre of an index carries, so that a heavy car is not refused for a limit of our own (D-310).
     *
     * @var array<int, int>
     */
    public const LOAD_INDEX_CAPACITY_KG = [
        70 => 335, 71 => 345, 72 => 355, 73 => 365, 74 => 375, 75 => 387, 76 => 400, 77 => 412,
        78 => 425, 79 => 437, 80 => 450, 81 => 462, 82 => 475, 83 => 487, 84 => 500, 85 => 515,
        86 => 530, 87 => 545, 88 => 560, 89 => 580, 90 => 600, 91 => 615, 92 => 630, 93 => 650,
        94 => 670, 95 => 690, 96 => 710, 97 => 730, 98 => 750, 99 => 775, 100 => 800, 101 => 825,
        102 => 850, 103 => 875, 104 => 900, 105 => 925, 106 => 950, 107 => 975, 108 => 1000, 109 => 1030,
        110 => 1060, 111 => 1090, 112 => 1120, 113 => 1150, 114 => 1180, 115 => 1215, 116 => 1250, 117 => 1285,
        118 => 1320, 119 => 1360, 120 => 1400,
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
        // J and K below L (the client's round of 08.11.2026, §4, D-442): every rank above moved up by two, in one migration.
        ['symbol' => 'J', 'rank' => 1, 'max_kmh' => 100],
        ['symbol' => 'K', 'rank' => 2, 'max_kmh' => 110],
        ['symbol' => 'L', 'rank' => 3, 'max_kmh' => 120],
        ['symbol' => 'M', 'rank' => 4, 'max_kmh' => 130],
        ['symbol' => 'N', 'rank' => 5, 'max_kmh' => 140],
        ['symbol' => 'P', 'rank' => 6, 'max_kmh' => 150],
        ['symbol' => 'Q', 'rank' => 7, 'max_kmh' => 160],
        ['symbol' => 'R', 'rank' => 8, 'max_kmh' => 170],
        ['symbol' => 'S', 'rank' => 9, 'max_kmh' => 180],
        ['symbol' => 'T', 'rank' => 10, 'max_kmh' => 190],
        ['symbol' => 'U', 'rank' => 11, 'max_kmh' => 200],
        ['symbol' => 'H', 'rank' => 12, 'max_kmh' => 210],
        ['symbol' => 'V', 'rank' => 13, 'max_kmh' => 240],
        ['symbol' => 'W', 'rank' => 14, 'max_kmh' => 270],
        // (W): above 270 km/h, to a limit only the tyre's maker states (the client's review of 11.11, D; D-453). Between W and Y — a Y
        // guarantees 300, a (W) no more than W's 270 —, so its 270 is the floor it is read at: never derived as a minimum, and a tyre
        // with (W) never passes where Y is asked. Ranks above moved up by one, in one migration.
        ['symbol' => '(W)', 'rank' => 15, 'max_kmh' => 270],
        ['symbol' => 'Y', 'rank' => 16, 'max_kmh' => 300],
        ['symbol' => '(Y)', 'rank' => 17, 'max_kmh' => null],
    ];

    /**
     * The load a tyre carries at speed, in percent of its load index's capacity: ETRTO's table for passenger-car tyres of
     * speed symbol V, W and Y, as German Gutachten print it — ABE 55255 on its page 6, cell for cell (SpeedLoadTableTest).
     * One table for every Gutachten, nothing typed or kept per paper (the client's review of 11.11.2026, C; the operator's
     * answer b, D-459): it replaced the tables typed into each document by hand.
     *
     * Speed (km/h) → symbol → percent; null is the table's „–“: a tyre of that symbol may not be used at that speed. Up to
     * 210 km/h no tyre loses load (SpeedLoadTable::FULL_LOAD_UP_TO_KMH), and a speed is read at the next row up, never
     * interpolated (the operator's review of C9, §2).
     *
     * Only the cells a printed table holds, never one of our own: a symbol in brackets — (W), (Y), a ZR tyre rated beyond 270 or
     * 300 km/h (D-453) — has no column, so where its load at speed decides, it is not on record: „Noch nicht bestätigt“, as
     * under every document's own table before.
     *
     * @var array<int, array<string, int|null>>
     */
    public const SPEED_LOAD_PERCENT = [
        210 => ['V' => 100, 'W' => 100, 'Y' => 100],
        220 => ['V' => 97, 'W' => 100, 'Y' => 100],
        230 => ['V' => 94, 'W' => 100, 'Y' => 100],
        240 => ['V' => 91, 'W' => 100, 'Y' => 100],
        250 => ['V' => null, 'W' => 95, 'Y' => 100],
        260 => ['V' => null, 'W' => 90, 'Y' => 100],
        270 => ['V' => null, 'W' => 85, 'Y' => 100],
        280 => ['V' => null, 'W' => null, 'Y' => 95],
        290 => ['V' => null, 'W' => null, 'Y' => 90],
        300 => ['V' => null, 'W' => null, 'Y' => 85],
    ];

    /** @codeCoverageIgnore Constants only: the constructor exists so the class cannot be built, and never runs (D-433). */
    private function __construct() {}
}
