<?php

declare(strict_types=1);

use App\Support\LinePrice;
use App\Support\Money;

/*
 * D-102: a stored price is one item; a quantity multiplies it in LinePrice and nowhere else. The client's #14 was the
 * third price bug of one family — a second place that knew „four“.
 */

it('multiplies one item\'s price by a quantity: 229,00 € once, 916,00 € for four, never a fraction', function (): void {
    $rim = Money::fromMinor(22_900);

    expect(LinePrice::total($rim, 1)->format())->toBe("229,00\u{202F}€")
        ->and(LinePrice::total($rim, 4)->toMinor())->toBe(91_600)
        ->and(LinePrice::total($rim, 4)->format())->toBe("916,00\u{202F}€")
        ->and(LinePrice::total($rim, 1)->equals($rim))->toBeTrue()
        ->and(LinePrice::total($rim, 0)->isZero())->toBeTrue()
        ->and(LinePrice::total(Money::fromMinor(1_250, 'CHF'), 2)->currency())->toBe('CHF');
});

it('refuses a negative quantity', function (): void {
    LinePrice::total(Money::fromMinor(22_900), -1);
})->throws(InvalidArgumentException::class);

it('gives the figure for each amount a page offers, from the one function', function (): void {
    expect(LinePrice::byQuantity(Money::fromMinor(22_900), [1, 4]))->toBe([
        ['quantity' => 1, 'cents' => 22_900, 'text' => "229,00\u{202F}€"],
        ['quantity' => 4, 'cents' => 91_600, 'text' => "916,00\u{202F}€"],
    ]);
});

/*
 * The guard: no other multiplier of money anywhere in the application or the browser code. A price times a quantity
 * written anywhere but LinePrice is how the tile at a quarter of the price, the one rim labelled as four and #14 came
 * about. A new one fails here, naming the file and the line.
 */
it('finds no other place that multiplies money, in app/ or in resources/js/', function (): void {
    $root = dirname(__DIR__, 3);
    $patterns = [
        // A Money multiplied (the method is gone; a revival is a second multiplier).
        '/->multiply\(/',
        // Cents times something, or something times cents: `$config->price_cents * $quantity`, `4 * $unitCents`.
        '/[cC]ents\)?\s*\*(?!\*)/',
        '/(?<!\*)\*\s*\(?\s*(?:\(int\)\s*)?[\$\w.>\-]*[cC]ents\b/',
        // A quantity times something: `$quantity * $unit`, `qty * price`.
        '/\b(?:quantity|qty|SET_OF)\b\s*\*(?!\*)/',
        '/(?<!\*)\*\s*\$?(?:this->|self::)?(?:quantity|qty|SET_OF)\b/',
    ];
    $found = [];
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/app', FilesystemIterator::SKIP_DOTS));
    $js = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root.'/resources/js', FilesystemIterator::SKIP_DOTS));

    foreach ([$files, $js] as $tree) {
        foreach ($tree as $file) {
            $path = str_replace('\\', '/', (string) $file);

            if (! preg_match('/\.(php|ts|vue)$/', $path) || str_ends_with($path, '.test.ts') || str_ends_with($path, 'Support/LinePrice.php')) {
                continue;
            }

            foreach (file($path) ?: [] as $number => $line) {
                // A comment that explains the rule is not a multiplier.
                if (preg_match('#^\s*(\*|//|/\*)#', $line) === 1) {
                    continue;
                }

                foreach ($patterns as $pattern) {
                    if (preg_match($pattern, $line) === 1) {
                        $found[] = str_replace($root.'/', '', $path).':'.($number + 1).'  '.trim($line);
                        break;
                    }
                }
            }
        }
    }

    expect($found)->toBe([]);
});
