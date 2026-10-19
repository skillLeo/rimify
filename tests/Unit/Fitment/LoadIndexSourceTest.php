<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\ReferenceTables;

/*
 * The load-index table against its published source (D-310, the operator's brief of 19.10.2026 §1): every capacity is
 * the one printed in Annex IV of UN/ECE Regulation No 30 — the passenger-car tyres' regulation — and the same in Annex
 * IV of Regulation No 54, a second, independent publication. Both are read from their text as pdf.js extracted it from
 * the Official Journal (tests/Fixtures/reference), never from figures typed a second time, so a typo in the constant
 * cannot agree with them by accident. The table ends where Regulation No 30's annex ends.
 */

/**
 * The index → mass pairs a fixture prints: pairs stand two spaces apart, a thousand is set off by one space („1 000“),
 * a decimal by a comma („46,2“). Lines that are not pairs — headings, page headers — are passed over.
 *
 * @return array<int, string> the mass as printed, spaces removed, a comma as a point
 */
function printedLoadIndices(string $file): array
{
    $printed = [];

    foreach (file(dirname(__DIR__, 2).'/Fixtures/reference/'.$file, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (str_starts_with($line, '#')) {
            continue;
        }

        $tokens = preg_split('/\s{2,}/', trim($line)) ?: [];

        if ($tokens === [] || count($tokens) % 2 !== 0) {
            continue;
        }

        $pairs = [];

        foreach (array_chunk($tokens, 2) as [$index, $mass]) {
            if (! ctype_digit($index) || preg_match('/^\d{1,3}( \d{3})*(,\d+)?$/', $mass) !== 1) {
                continue 2;
            }

            $pairs[(int) $index] = str_replace([' ', ','], ['', '.'], $mass);
        }

        $printed = $pairs + $printed;
    }

    ksort($printed);

    return $printed;
}

it('holds every capacity to Annex IV of Regulation No 30, index by index, 70 to 120', function (): void {
    $r30 = printedLoadIndices('un-r30-annex-iv.txt');

    // The annex as extracted: 0 to 120, every index once.
    expect(array_keys($r30))->toBe(range(0, 120));

    $agree = 0;

    foreach (ReferenceTables::LOAD_INDEX_CAPACITY_KG as $index => $capacity) {
        expect($r30[$index] ?? null)->toBe((string) $capacity, "LI {$index}");
        $agree++;
    }

    expect($agree)->toBe(51);
});

it('ends where Regulation No 30 ends: no index above 120, and none below the passenger-car range', function (): void {
    expect(array_keys(ReferenceTables::LOAD_INDEX_CAPACITY_KG))->toBe(range(70, 120))
        ->and(max(array_keys(printedLoadIndices('un-r30-annex-iv.txt'))))->toBe(120);
});

it('agrees with Annex IV of Regulation No 54, a second publication, at every index of the table', function (): void {
    $r54 = printedLoadIndices('un-r54-annex-iv.txt');

    expect(array_key_first($r54))->toBe(60)
        ->and(array_key_last($r54))->toBe(200);

    foreach (ReferenceTables::LOAD_INDEX_CAPACITY_KG as $index => $capacity) {
        expect($r54[$index] ?? null)->toBe((string) $capacity, "LI {$index}");
    }
});
