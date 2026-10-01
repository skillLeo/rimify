<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

/**
 * Search engines kept away from the files the web server hands out itself — everything under /storage: the Gutachten
 * PDFs, the pictures. Every page Laravel answers carries `X-Robots-Tag: noindex, nofollow` outside the live shop
 * (SecurityHeaders); these files never reach Laravel, so a small `.htaccess` in `storage/app/public` (served as
 * /storage) sets the same header there. Nothing else: no password, no prompt of any kind (D-088).
 *
 * It lives in `storage/`, which the deploy's `git reset --hard` never touches; the deploy runs this after the caches
 * (deploy/remote.sh). In the live shop it takes its file away again. It also removes what the old preview password left
 * behind — its basic-auth `.htaccess` and password file — and never touches an `.htaccess` it did not write.
 */
final class StorageHeaders extends Command
{
    /** The first line of the `.htaccess` this command writes: what it may replace or remove. */
    public const MARKER = '# RIMIFY storage headers — written by `php artisan rimify:storage-headers`; the next deploy writes it again.';

    /** The first line the old preview password's `.htaccess` carried (removed 01.10.2026, D-088). */
    public const OLD_GATE_MARKER = '# RIMIFY preview gate';

    protected $signature = 'rimify:storage-headers';

    protected $description = 'Keep search engines away from /storage outside the live shop, and remove the old preview password files';

    public static function htaccessPath(): string
    {
        return storage_path('app/public/.htaccess');
    }

    /** The old preview password's file, beside the public folder. */
    public static function oldPasswordPath(): string
    {
        return storage_path('app/.preview-htpasswd');
    }

    /** Whether this command's `.htaccess` is in place. */
    public static function written(): bool
    {
        $file = self::htaccessPath();

        return is_file($file) && str_starts_with((string) file_get_contents($file), self::MARKER);
    }

    public function handle(): int
    {
        $htaccess = self::htaccessPath();
        $current = is_file($htaccess) ? (string) file_get_contents($htaccess) : null;

        if ($current !== null && ! str_starts_with($current, self::MARKER) && ! str_starts_with($current, self::OLD_GATE_MARKER)) {
            $this->error('storage/app/public/.htaccess wurde nicht von RIMIFY geschrieben – nichts geändert.');

            return self::FAILURE;
        }

        if (is_file(self::oldPasswordPath())) {
            unlink(self::oldPasswordPath());
            $this->info('Altes Vorschau-Passwort entfernt.');
        }

        if (app()->environment('production')) {
            if ($current !== null) {
                unlink($htaccess);
            }

            $this->info('Live-Shop: /storage ist für Suchmaschinen offen.');

            return self::SUCCESS;
        }

        file_put_contents($htaccess, implode("\n", [
            self::MARKER,
            '# Outside the live shop, the files under /storage stay out of search like every page (SecurityHeaders).',
            '<IfModule mod_headers.c>',
            '    Header set X-Robots-Tag "noindex, nofollow"',
            '</IfModule>',
            '',
        ]));

        $this->info('/storage trägt noindex.');

        return self::SUCCESS;
    }
}
