<?php

declare(strict_types=1);

use App\Support\Money;

/*
 * German money input. The vector list in docs/specs/komplettrad.md §2.6 is the authority: a
 * figure typed on an admin screen is frozen onto a real bill, so anything ambiguous is refused,
 * never guessed (CLAUDE.md §2).
 */

it('parses German money input into integer cents', function (string $input, int $cents): void {
    expect(Money::fromGerman($input))->toBe($cents);
})->with([
    'thousands point, decimal comma, euro sign' => ['1.425,00 €', 142_500],
    'thousands point, decimal comma' => ['1.425,00', 142_500],
    'two groups' => ['12.500,50', 1_250_050],
    'one decimal digit' => ['1425,5', 142_550],
    'whole euros' => ['1425', 142_500],
    'cents only' => ['0,99', 99],
    'no-break space U+00A0 before the euro sign' => ["49,00\u{00A0}€", 4_900],
    'narrow no-break space U+202F before the euro sign' => ["49,00\u{202F}€", 4_900],
    'EUR as the currency marker' => ['49,00 EUR', 4_900],
    'thousands point only' => ['1.425', 142_500],
    'two thousands points only' => ['1.250.000', 125_000_000],
    'surrounding whitespace' => ['  7,50  ', 750],
]);

it('refuses anything it cannot read unambiguously', function (string $input): void {
    expect(Money::fromGerman($input))->toBeNull();
})->with([
    'decimal point is ambiguous' => ['49.00'],
    'three decimals' => ['1,234'],
    'true minus sign U+2212' => ['−5,00'],
    'hyphen-minus' => ['-5,00'],
    'letters' => ['abc'],
    'empty' => [''],
    'whitespace only' => ['   '],
    'euro sign alone' => ['€'],
    'broken grouping' => ['1.42,00'],
    'over-long group' => ['1.2345,00'],
    'stray point inside a group' => ['1.4.25,00'],
    'two commas' => ['1,2,3'],
    'trailing comma' => ['1425,'],
    'leading comma' => [',50'],
    'trailing point' => ['1425.'],
    'plus sign' => ['+5,00'],
    'exponent' => ['1e3'],
]);

it('validates the grouping before it strips the thousands points', function (): void {
    // Stripping first and checking only the decimal part would accept `1.42,00` as 142,00 €.
    expect(Money::fromGerman('12.500,50'))->toBe(1_250_050)
        ->and(Money::fromGerman('1.42,00'))->toBeNull()
        ->and(Money::fromGerman('1.2345,00'))->toBeNull()
        ->and(Money::fromGerman('1.4.25,00'))->toBeNull();
});

it('never goes through a float', function (): void {
    // 0,29 is the classic float trap: 0.29 * 100 is 28.999999999999996.
    expect(Money::fromGerman('0,29'))->toBe(29)
        ->and(Money::fromGerman('1,10'))->toBe(110)
        ->and(Money::fromGerman('19,99'))->toBe(1_999);
});

it('refuses an amount too long to hold as integer cents', function (): void {
    expect(Money::fromGerman(str_repeat('9', 16).',00'))->toBeNull()
        ->and(Money::fromGerman(str_repeat('9', 15).',00'))->toBe((int) str_repeat('9', 15) * 100);
});
