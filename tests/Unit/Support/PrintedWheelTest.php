<?php

declare(strict_types=1);

use App\Support\PrintedWheel;

/*
 * The wheel data a Gutachten prints, read only to warn staff when the size they chose is not the paper's (the operator's note
 * of 06.11.2026) — the two real papers' notations among them.
 */

it('reads a wheel size as the papers print it', function (string $text, float $width, float $diameter): void {
    expect(PrintedWheel::size($text))->toBe(['width' => $width, 'diameter' => $diameter]);
})->with([
    ['8 1/2 J X 18 H2', 8.5, 18.0],
    ['8 1/2 J X 20 H2', 8.5, 20.0],
    ['8½ × 18', 8.5, 18.0],
    ['8,5x20', 8.5, 20.0],
    ['8.5 x 18', 8.5, 18.0],
    ['9 J x 19', 9.0, 19.0],
    ['8J × 18', 8.0, 18.0],
    ['8 × 18', 8.0, 18.0],
]);

it('reads a bolt pattern in either order, the small number the holes', function (string $text, int $holes, float $circle): void {
    expect(PrintedWheel::bolts($text))->toBe(['holes' => $holes, 'circle' => $circle]);
})->with([
    ['120/5', 5, 120.0],
    ['5 × 120', 5, 120.0],
    ['5/112', 5, 112.0],
    ['5x114,3', 5, 114.3],
]);

it('says nothing it cannot read', function (string $text): void {
    expect(PrintedWheel::size($text))->toBeNull();
})->with(['', '18', 'groß', '8,5', '8 1/2 J']);

it('says nothing about a bolt pattern it cannot read', function (string $text): void {
    expect(PrintedWheel::bolts($text))->toBeNull();
})->with(['', '120', '5/5', 'fünf', '120/5.5']);
