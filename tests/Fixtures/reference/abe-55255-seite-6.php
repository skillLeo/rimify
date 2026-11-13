<?php

declare(strict_types=1);

// The table of tyre load at speed as printed on page 6 of ABE 55255 (Borbet DB8GT2, 8,5J × 19), from the operator's brief of
// 28.09.2026 — transcribed, not derived, not extended. Speed → symbol → percent of the load index a tyre may carry; null is the
// table's „–“ (a tyre of that symbol is not permitted at that speed). ETRTO's table as a real Gutachten prints it: the oracle
// SpeedLoadTableTest holds ReferenceTables::SPEED_LOAD_PERCENT to (D-459). Until then it was seeded into every demo document;
// a document carries no table of its own any more.
return [
    'source_page' => 6,
    'rows' => [
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
    ],
];
