<?php

declare(strict_types=1);

use App\Support\Auth\Totp;

/*
 * The codes the admin's second step takes (D-514) are the ones every authenticator app makes: RFC 6238's own test
 * values (SHA-1, its 20-byte key "12345678901234567890"), cut to six digits as the apps show them.
 */

const RFC_6238_KEY = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

it('makes the codes RFC 6238 lists', function (int $time, string $code): void {
    expect(Totp::codeAt(RFC_6238_KEY, Totp::stepAt($time)))->toBe($code);
})->with([
    [59, '287082'],
    [1111111109, '081804'],
    [1111111111, '050471'],
    [1234567890, '005924'],
    [2000000000, '279037'],
    [20000000000, '353130'],
]);

it('takes a code half a minute either side of now, never older, and each step only once', function (): void {
    $now = 1234567890;
    $step = Totp::stepAt($now);

    expect(Totp::match(RFC_6238_KEY, Totp::codeAt(RFC_6238_KEY, $step), $now))->toBe($step)
        ->and(Totp::match(RFC_6238_KEY, Totp::codeAt(RFC_6238_KEY, $step - 1), $now))->toBe($step - 1)
        ->and(Totp::match(RFC_6238_KEY, Totp::codeAt(RFC_6238_KEY, $step + 1), $now))->toBe($step + 1)
        ->and(Totp::match(RFC_6238_KEY, Totp::codeAt(RFC_6238_KEY, $step - 2), $now))->toBeNull()
        // Taken once: the same step, or an earlier one, is refused after it.
        ->and(Totp::match(RFC_6238_KEY, Totp::codeAt(RFC_6238_KEY, $step), $now, $step))->toBeNull()
        ->and(Totp::match(RFC_6238_KEY, Totp::codeAt(RFC_6238_KEY, $step + 1), $now, $step))->toBe($step + 1)
        // Spaces as an app groups them are fine; letters and short codes are not codes.
        ->and(Totp::match(RFC_6238_KEY, '005 924', $now))->toBe($step)
        ->and(Totp::match(RFC_6238_KEY, '00592', $now))->toBeNull()
        ->and(Totp::match(RFC_6238_KEY, 'abcdef', $now))->toBeNull();
});

it('makes a key of 160 bits in base32 and an address and QR code an app reads', function (): void {
    $key = Totp::newSecret();

    expect($key)->toMatch('/^[A-Z2-7]{32}$/')
        ->and(Totp::newSecret())->not->toBe($key)
        ->and(Totp::uri($key, 'chef@rimify.test'))->toBe('otpauth://totp/RIMIFY%3Achef%40rimify.test?secret='.$key.'&issuer=RIMIFY&algorithm=SHA1&digits=6&period=30')
        ->and(Totp::qrSvg(Totp::uri($key, 'chef@rimify.test')))->toStartWith('<svg')
        ->and(Totp::grouped('ABCDEFGHIJKL'))->toBe('ABCD EFGH IJKL');
});
