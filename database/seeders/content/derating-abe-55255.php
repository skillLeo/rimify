<?php

declare(strict_types=1);

// The table of tyre load at speed as printed on page 6 of ABE 55255 (Borbet DB8GT2, 8,5J × 19), from the
// operator's brief of 28.09.2026 — transcribed, not derived, not extended. Speed → symbol → percent of the
// load index a tyre may carry; null is the table's „–“ (a tyre of that symbol is not permitted at that
// speed). Data of that one document (document_speed_deratings): a document without its own table borrows
// none of this.
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
