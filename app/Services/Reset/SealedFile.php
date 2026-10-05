<?php

declare(strict_types=1);

namespace App\Services\Reset;

use RuntimeException;

/**
 * A reset's safety copy at rest: encrypted (the operator's brief of 05.10.2026, §2.2). The copy holds the shop's
 * customers — names, addresses, e-mail addresses — and on the host it lies in a folder under the domain, where one
 * rewrite is what keeps the web server from it. Encrypted, a copy that ever got out says nothing.
 *
 * AES-256-GCM in chunks of at most 1 MiB, under a key of its own per copy: HKDF-SHA256 of APP_KEY with the copy's
 * random salt. The file is the format's line, the salt, then per chunk its length, whether it is the last, its nonce,
 * its tag and its ciphertext — each chunk authenticated together with its index and that last-flag, so a chunk dropped,
 * moved or cut off makes the copy unreadable rather than shorter. openssl, not sodium: the host's PHP 8.4 has no
 * sodium (read there on 05.10.2026). A copy is readable only with the APP_KEY it was written under.
 */
final class SealedFile
{
    public const MAGIC = "RIMIFY-SEALED/1\n";

    private const CIPHER = 'aes-256-gcm';

    private const CHUNK = 1_048_576;

    private const SALT_BYTES = 16;

    private const NONCE_BYTES = 12;

    private const TAG_BYTES = 16;

    /** Whether the file at `$path` is a sealed copy (by its first line; a plain or gzip file is not). */
    public static function isSealed(string $path): bool
    {
        $in = @fopen($path, 'rb');

        if ($in === false) {
            return false;
        }

        try {
            return fread($in, strlen(self::MAGIC)) === self::MAGIC;
        } finally {
            fclose($in);
        }
    }

    /**
     * Encrypts `$plain` into `$sealed`: written to `.sealing` and renamed, so `$sealed` is whole or not there at all.
     * (Not `.part`: that is where SqlSnapshot writes the plain text being sealed.)
     *
     * @throws RuntimeException
     */
    public static function seal(string $plain, string $sealed): void
    {
        $in = @fopen($plain, 'rb');

        if ($in === false) {
            throw new RuntimeException("{$plain} lässt sich zum Verschlüsseln nicht öffnen.");
        }

        $part = $sealed.'.sealing';
        $out = @fopen($part, 'wb');

        if ($out === false) {
            fclose($in);

            throw new RuntimeException("{$sealed} lässt sich nicht schreiben.");
        }

        try {
            @chmod($part, 0600);
            $salt = random_bytes(self::SALT_BYTES);
            $key = self::key($salt);
            self::put($out, self::MAGIC.$salt, $sealed);

            $index = 0;
            $chunk = self::read($in);

            do {
                // One chunk ahead: the last one is known before it is written, and says so.
                $next = self::read($in);
                $final = $next === '';
                $nonce = random_bytes(self::NONCE_BYTES);
                $tag = '';
                $cipher = openssl_encrypt($chunk, self::CIPHER, $key, OPENSSL_RAW_DATA, $nonce, $tag, self::aad($index, $final), self::TAG_BYTES);

                if ($cipher === false) {
                    throw new RuntimeException('Die Sicherung ließ sich nicht verschlüsseln.');
                }

                self::put($out, pack('N', strlen($cipher)).($final ? "\1" : "\0").$nonce.$tag.$cipher, $sealed);
                $chunk = $next;
                $index++;
            } while (! $final);
        } catch (\Throwable $e) {
            fclose($in);
            fclose($out);
            @unlink($part);

            throw $e;
        }

        fclose($in);

        if (! fclose($out) || ! rename($part, $sealed)) {
            @unlink($part);

            throw new RuntimeException("{$sealed} konnte nicht abgeschlossen werden.");
        }

        @chmod($sealed, 0600);
    }

    /**
     * Decrypts `$sealed` into a new file beside it (0600) and returns that file's path: the caller removes it as soon as
     * it has read it.
     *
     * @throws RuntimeException when the copy is not whole, was altered, or was written under another APP_KEY
     */
    public static function open(string $sealed): string
    {
        $in = @fopen($sealed, 'rb');

        if ($in === false) {
            throw new RuntimeException("Die Sicherung {$sealed} lässt sich nicht öffnen.");
        }

        $plain = $sealed.'.'.bin2hex(random_bytes(6)).'.open';
        $out = @fopen($plain, 'wb');

        if ($out === false) {
            fclose($in);

            throw new RuntimeException("Die Sicherung {$sealed} lässt sich nicht entschlüsseln: kein Platz für die Klartext-Datei.");
        }

        try {
            @chmod($plain, 0600);

            if (self::exactly($in, strlen(self::MAGIC)) !== self::MAGIC) {
                throw new RuntimeException("{$sealed} ist keine verschlüsselte Sicherung.");
            }

            $key = self::key(self::exactly($in, self::SALT_BYTES));
            $index = 0;

            do {
                $head = self::exactly($in, 5 + self::NONCE_BYTES + self::TAG_BYTES);
                $length = (int) unpack('N', substr($head, 0, 4))[1];
                $final = $head[4] === "\1";

                if ($length > self::CHUNK) {
                    throw new RuntimeException("Die Sicherung {$sealed} ist beschädigt.");
                }

                $chunk = openssl_decrypt(
                    self::exactly($in, $length),
                    self::CIPHER,
                    $key,
                    OPENSSL_RAW_DATA,
                    substr($head, 5, self::NONCE_BYTES),
                    substr($head, 5 + self::NONCE_BYTES, self::TAG_BYTES),
                    self::aad($index, $final),
                );

                if ($chunk === false) {
                    throw new RuntimeException("Die Sicherung {$sealed} lässt sich nicht entschlüsseln: verändert, unvollständig oder unter einem anderen APP_KEY geschrieben.");
                }

                self::put($out, $chunk, $plain);
                $index++;
            } while (! $final);

            if (fread($in, 1) !== '') {
                throw new RuntimeException("Die Sicherung {$sealed} hat Daten hinter ihrem Ende.");
            }
        } catch (\Throwable $e) {
            fclose($in);
            fclose($out);
            @unlink($plain);

            throw $e;
        }

        fclose($in);

        if (! fclose($out)) {
            @unlink($plain);

            throw new RuntimeException("Die Sicherung {$sealed} ließ sich nicht vollständig entschlüsseln (Speicherplatz?).");
        }

        return $plain;
    }

    /** The copy's own key: HKDF-SHA256 of APP_KEY with its salt. */
    private static function key(string $salt): string
    {
        $configured = (string) config('app.key');
        $raw = str_starts_with($configured, 'base64:') ? (string) base64_decode(substr($configured, 7), true) : $configured;

        if ($raw === '') {
            throw new RuntimeException('Ohne APP_KEY wird keine Sicherung verschlüsselt oder gelesen.');
        }

        return hash_hkdf('sha256', $raw, 32, 'rimify-reset-snapshot', $salt);
    }

    private static function aad(int $index, bool $final): string
    {
        return 'rimify-sealed/1|'.$index.'|'.($final ? 'last' : 'more');
    }

    /** @param  resource  $in */
    private static function read($in): string
    {
        $data = '';

        while (strlen($data) < self::CHUNK && ! feof($in)) {
            $piece = fread($in, self::CHUNK - strlen($data));

            if ($piece === false) {
                throw new RuntimeException('Die Datei ließ sich nicht lesen.');
            }

            if ($piece === '') {
                break;
            }

            $data .= $piece;
        }

        return $data;
    }

    /**
     * @param  resource  $in
     *
     * @throws RuntimeException when the file ends first
     */
    private static function exactly($in, int $bytes): string
    {
        $data = '';

        while (strlen($data) < $bytes) {
            $piece = fread($in, $bytes - strlen($data));

            if ($piece === false || $piece === '') {
                throw new RuntimeException('Die verschlüsselte Sicherung endet vor ihrem Schluss.');
            }

            $data .= $piece;
        }

        return $data;
    }

    /** @param  resource  $out */
    private static function put($out, string $data, string $path): void
    {
        if ($data !== '' && fwrite($out, $data) !== strlen($data)) {
            throw new RuntimeException("{$path} ließ sich nicht zu Ende schreiben (Speicherplatz?).");
        }
    }
}
