<?php

declare(strict_types=1);

namespace App\Support\Auth;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

/**
 * Time-based one-time codes as every authenticator app makes them (RFC 6238 over RFC 4226): HMAC-SHA1, six digits,
 * a new code every 30 seconds. Written here rather than pulled in — it is forty lines, and the sign-in should depend
 * on nothing it cannot read. The QR code is drawn by bacon/bacon-qr-code, as SVG (no image extension needed).
 */
final class Totp
{
    public const DIGITS = 6;

    public const PERIOD = 30;

    /** How many steps either side of now a code is still taken: a phone clock half a minute off still signs in. */
    public const WINDOW = 1;

    private const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /** A new secret: 160 random bits, as RFC 4226 recommends, in base32 as the apps take it. */
    public static function newSecret(): string
    {
        return self::base32(random_bytes(20));
    }

    /** The 30-second step a moment falls in. */
    public static function stepAt(int $timestamp): int
    {
        return intdiv($timestamp, self::PERIOD);
    }

    /** The code for one step. */
    public static function codeAt(string $secret, int $step): string
    {
        $hash = hash_hmac('sha1', pack('J', $step), self::unbase32($secret), true);
        $offset = ord($hash[19]) & 0x0F;
        $number = ((ord($hash[$offset]) & 0x7F) << 24) | (ord($hash[$offset + 1]) << 16) | (ord($hash[$offset + 2]) << 8) | ord($hash[$offset + 3]);

        return str_pad((string) ($number % 10 ** self::DIGITS), self::DIGITS, '0', STR_PAD_LEFT);
    }

    /**
     * The step a code belongs to, when it is one of now's (± WINDOW) and later than `$after` — else null. Every step of
     * the window is compared, in constant time, so the answer takes as long for a wrong code as for a right one.
     */
    public static function match(string $secret, string $code, int $now, ?int $after = null): ?int
    {
        $code = preg_replace('/\s+/', '', $code) ?? '';

        if (preg_match('/^\d{'.self::DIGITS.'}$/', $code) !== 1) {
            return null;
        }

        $found = null;
        $current = self::stepAt($now);

        for ($step = $current - self::WINDOW; $step <= $current + self::WINDOW; $step++) {
            if (hash_equals(self::codeAt($secret, $step), $code) && ($after === null || $step > $after)) {
                $found ??= $step;
            }
        }

        return $found;
    }

    /** The address an app reads from the QR code (Key Uri Format): the shop's name, then the account. */
    public static function uri(string $secret, string $account, string $issuer = 'RIMIFY'): string
    {
        return 'otpauth://totp/'.rawurlencode($issuer.':'.$account)
            .'?secret='.$secret.'&issuer='.rawurlencode($issuer).'&algorithm=SHA1&digits='.self::DIGITS.'&period='.self::PERIOD;
    }

    /** That address as a QR code, an SVG of `$size` pixels. */
    public static function qrSvg(string $uri, int $size = 200): string
    {
        $svg = (new Writer(new ImageRenderer(new RendererStyle($size, 1), new SvgImageBackEnd)))->writeString($uri);

        // Without the XML prolog: the SVG is placed inside the page.
        return trim((string) preg_replace('/^<\?xml[^>]*\?>/', '', $svg));
    }

    /** The secret in groups of four, for typing it into an app by hand. */
    public static function grouped(string $secret): string
    {
        return trim(chunk_split($secret, 4, ' '));
    }

    private static function base32(string $bytes): string
    {
        $bits = '';

        foreach (str_split($bytes) as $byte) {
            $bits .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        }

        $out = '';

        foreach (str_split($bits, 5) as $chunk) {
            $out .= self::ALPHABET[bindec(str_pad($chunk, 5, '0'))];
        }

        return $out;
    }

    private static function unbase32(string $secret): string
    {
        $bits = '';

        foreach (str_split(strtoupper((string) preg_replace('/[\s=]/', '', $secret))) as $char) {
            $value = strpos(self::ALPHABET, $char);
            $bits .= $value === false ? '' : str_pad(decbin($value), 5, '0', STR_PAD_LEFT);
        }

        $out = '';

        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) === 8) {
                $out .= chr((int) bindec($byte));
            }
        }

        return $out;
    }
}
