<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Domain\Fitment\Derivation\SpeedLoadTable;

/*
 * D-459: ETRTO's table of tyre load at speed, fixed in code for every Gutachten (the client's review of 11.11.2026, C; the
 * operator's answer b). Held three ways, so a slip in the constant cannot pass: cell for cell to the table ABE 55255 prints on
 * its page 6, as the operator transcribed it (tests/Fixtures/reference) — a real Gutachten printing ETRTO's figures —; to the
 * speed symbols' own limits, typed a second time where they bind; and in how it is read. The load-index capacities it applies
 * to are held to UN/ECE Regulation No 30 by LoadIndexSourceTest (D-310).
 */

/** @return array{source_page: int, rows: array<int, array<string, int|null>>} */
function printedOnPage6(): array
{
    return require dirname(__DIR__, 2).'/Fixtures/reference/abe-55255-seite-6.php';
}

it('is the table ABE 55255 prints on its page 6, cell for cell — no row, no symbol and no figure of our own', function (): void {
    expect(ReferenceTables::SPEED_LOAD_PERCENT)->toBe(printedOnPage6()['rows']);
});

it('lets each symbol carry its full load to 30 km/h below its top speed, less as the speed rises, and nothing above it', function (): void {
    $top = array_column(ReferenceTables::SPEED_SYMBOLS, 'max_kmh', 'symbol');

    foreach (['V' => 91, 'W' => 85, 'Y' => 85] as $symbol => $atTop) {
        $last = 100;

        foreach (ReferenceTables::SPEED_LOAD_PERCENT as $speed => $row) {
            if ($speed > $top[$symbol]) {
                expect($row[$symbol])->toBeNull();

                continue;
            }

            expect($row[$symbol])->toBeInt()->toBeLessThanOrEqual($last)
                ->and($speed > $top[$symbol] - 30 || $row[$symbol] === 100)->toBeTrue();
            $last = (int) $row[$symbol];
        }

        expect(ReferenceTables::SPEED_LOAD_PERCENT[$top[$symbol]][$symbol])->toBe($atTop);
    }
});

it('holds no column for a symbol in brackets: (W) and (Y) are not on record at any speed above 210 km/h', function (): void {
    foreach (ReferenceTables::SPEED_LOAD_PERCENT as $row) {
        expect(array_keys($row))->toBe(['V', 'W', 'Y']);
    }

    expect(SpeedLoadTable::etrto()->lookup(250, '(W)')->isAbsent())->toBeTrue()
        ->and(SpeedLoadTable::etrto()->lookup(280, '(Y)')->isAbsent())->toBeTrue()
        ->and(SpeedLoadTable::etrto()->lookup(210, '(Y)')->percent)->toBe(100);
});

it('reads the next row up and never between two rows; up to 210 km/h every tyre carries its full load', function (): void {
    $etrto = SpeedLoadTable::etrto();

    expect($etrto->lookup(210, 'V')->percent)->toBe(100)
        ->and($etrto->lookup(180, 'H')->percent)->toBe(100)
        ->and($etrto->lookup(211, 'V')->percent)->toBe(97)
        ->and($etrto->lookup(211, 'V')->rowKmh)->toBe(220)
        ->and($etrto->lookup(235, 'V')->percent)->toBe(91)
        ->and($etrto->lookup(250, 'w')->percent)->toBe(95)
        ->and($etrto->lookup(300, 'Y')->percent)->toBe(85);
});

it('answers a „–“ with the symbol its row asks for, and a speed or symbol it does not hold with nothing', function (): void {
    $etrto = SpeedLoadTable::etrto();
    $dash = $etrto->lookup(250, 'V');

    expect($dash->isNotPermitted())->toBeTrue()
        ->and($dash->required)->toBe('W')
        ->and($dash->rowKmh)->toBe(250)
        ->and($etrto->lookup(280, 'W')->required)->toBe('Y')
        ->and($etrto->lookup(301, 'Y')->isAbsent())->toBeTrue()
        ->and($etrto->lookup(301, 'Y')->rowKmh)->toBeNull()
        ->and($etrto->lookup(280, '(W)')->rowKmh)->toBe(280)
        ->and($etrto->lookup(250, 'H')->isAbsent())->toBeTrue();
});
