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

describe('the value object', function (): void {
    it('holds integer minor units and a currency, and gives them back unchanged', function (): void {
        $price = Money::fromMinor(142_500);

        expect($price->toMinor())->toBe(142_500)
            ->and($price->currency())->toBe('EUR')
            ->and(Money::fromMinor(1_250, 'CHF')->currency())->toBe('CHF')
            ->and(Money::zero()->isZero())->toBeTrue();
    });

    it('does not multiply: a quantity is LinePrice\'s (D-102)', function (): void {
        expect(method_exists(Money::class, 'multiply'))->toBeFalse();
    });

    it('adds VAT to a net amount and finds the VAT inside a gross one, in integers', function (): void {
        expect(Money::fromMinor(10_000)->withVat(Money::VAT_STANDARD_BP)->toMinor())->toBe(11_900)
            ->and(Money::fromMinor(11_900)->vatIncluded(Money::VAT_STANDARD_BP)->toMinor())->toBe(1_900)
            ->and(Money::fromMinor(11_900)->withoutVat(Money::VAT_STANDARD_BP)->toMinor())->toBe(10_000)
            // 1.425,00 € gross: 227,52 € VAT (22 752,1 cents, rounded), as the float version said.
            ->and(Money::fromMinor(142_500)->vatIncluded(1900)->toMinor())->toBe(22_752)
            // 7 %: 10,70 € gross holds 0,70 €.
            ->and(Money::fromMinor(1_070)->vatIncluded(700)->toMinor())->toBe(70);
    });

    it('rounds half away from zero, as an invoice does, for refunds too', function (): void {
        // 0,05 € net at 10 % is 0,005 € VAT: half a cent goes up, and down for a refund.
        expect(Money::fromMinor(5)->withVat(1000)->toMinor())->toBe(6)
            ->and(Money::fromMinor(-5)->withVat(1000)->toMinor())->toBe(-6)
            ->and(Money::fromMinor(4)->withVat(1000)->toMinor())->toBe(4);
    });

    it('agrees with the float formula it replaces on every gross total up to 10.000,00 €', function (): void {
        // The basket extracted VAT as round(total - total / 1.19). The integer version must give the
        // same cents on every amount a customer could plausibly pay, or old orders would disagree.
        for ($total = 0; $total <= 1_000_000; $total += 7) {
            expect(Money::fromMinor($total)->vatIncluded(1900)->toMinor())->toBe((int) round($total - ($total / 1.19)));
        }
    });

    it('never adds two currencies, and refuses what is not a currency or a rate', function (): void {
        expect(fn () => Money::fromMinor(100)->plus(Money::fromMinor(100, 'CHF')))->toThrow(InvalidArgumentException::class)
            ->and(fn () => Money::fromMinor(100, 'euro'))->toThrow(InvalidArgumentException::class)
            ->and(fn () => Money::fromMinor(100)->withVat(-1))->toThrow(InvalidArgumentException::class)
            ->and(Money::fromMinor(100)->plus(Money::fromMinor(50))->minus(Money::fromMinor(25))->toMinor())->toBe(125);
    });

    it('writes its digits for a machine and for a German field, from integers only', function (): void {
        expect(Money::fromMinor(142_550)->toDecimal())->toBe('1425.50')
            ->and(Money::fromMinor(5)->toDecimal())->toBe('0.05')
            ->and(Money::fromMinor(-1_250)->toDecimal())->toBe('-12.50')
            ->and(Money::fromMinor(142_500)->toGerman())->toBe('1.425,00')
            ->and(Money::fromMinor(29)->toGerman())->toBe('0,29')
            ->and(Money::fromMinor(142_500)->format())->toBe("1.425,00\u{202F}€");
    });
});

it('keeps float arithmetic away from money everywhere in app/', function (): void {
    // The launch release §4: two of the six golden-record bugs were prices converted in a second
    // place. Cents divided into euros, or VAT through a float rate, is how that starts again.
    $patterns = [
        '/(_cents|Cents)\)?\s*\/\s*100\b/' => 'cents divided by 100',
        '/\b1\.19\b/' => 'VAT as a float rate',
        '/\bVAT_RATE\s*=\s*1\./' => 'VAT as a float rate',
    ];
    $found = [];

    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator(dirname(__DIR__, 3).'/app', FilesystemIterator::SKIP_DOTS)) as $file) {
        if (! $file instanceof SplFileInfo || $file->getExtension() !== 'php') {
            continue;
        }

        foreach (file($file->getPathname()) ?: [] as $number => $line) {
            if (preg_match('/^\s*(\*|\/\/)/', $line) === 1) {
                continue;
            }

            foreach ($patterns as $pattern => $what) {
                if (preg_match($pattern, $line) === 1) {
                    $found[] = basename($file->getPathname()).':'.($number + 1).' — '.$what;
                }
            }
        }
    }

    expect($found)->toBe([]);
});
