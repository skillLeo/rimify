<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\PreviewGate;
use Illuminate\Console\Command;

/**
 * The preview's password in front of the files the web server hands out itself — everything under /storage: the
 * Gutachten PDFs, the pictures (App\Support\PreviewGate). The middleware covers every page; these files never reach
 * Laravel, so a basic-auth `.htaccess` sits in `storage/app/public` (served as /storage), with its password file beside
 * it, outside the public folder, hashed with bcrypt. Same realm and password as the middleware: a browser asks once.
 *
 * Both files live in `storage/`, which the deploy's `git reset --hard` never touches; the deploy runs this after the
 * caches (deploy/remote.sh), so a changed password in `.env` reaches the files with the next release. Where no preview
 * password is set — the live shop — it takes its own files away again, and never touches an `.htaccess` it did not write.
 */
final class PreviewGateFiles extends Command
{
    /** The first line of the `.htaccess` this command writes: what it may replace or remove. */
    public const MARKER = '# RIMIFY preview gate — written by `php artisan rimify:preview-gate`; the next deploy writes it again.';

    protected $signature = 'rimify:preview-gate';

    protected $description = 'Put the preview password in front of the files under /storage, or take it away where no preview password is set';

    public static function htaccessPath(): string
    {
        return storage_path('app/public/.htaccess');
    }

    public static function passwordPath(): string
    {
        return storage_path('app/.preview-htpasswd');
    }

    public function handle(): int
    {
        $htaccess = self::htaccessPath();
        $current = is_file($htaccess) ? (string) file_get_contents($htaccess) : null;

        if ($current !== null && ! str_starts_with($current, self::MARKER)) {
            $this->error('storage/app/public/.htaccess wurde nicht von diesem Befehl geschrieben – nichts geändert.');

            return self::FAILURE;
        }

        if (! PreviewGate::enabled()) {
            foreach ([$htaccess, self::passwordPath()] as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }

            $this->info('Kein Vorschau-Passwort gesetzt: /storage ist ohne Passwort erreichbar.');

            return self::SUCCESS;
        }

        file_put_contents(self::passwordPath(), PreviewGate::user().':'.password_hash((string) PreviewGate::password(), PASSWORD_BCRYPT)."\n");
        chmod(self::passwordPath(), 0640);

        file_put_contents($htaccess, implode("\n", [
            self::MARKER,
            '# The same password as every page (App\Support\PreviewGate), for the files the web server serves itself.',
            'AuthType Basic',
            'AuthName "'.PreviewGate::REALM.'"',
            'AuthUserFile '.self::passwordPath(),
            'Require valid-user',
            '<IfModule mod_headers.c>',
            '    Header set X-Robots-Tag "noindex, nofollow"',
            '</IfModule>',
            '',
        ]));

        $this->info('Vorschau-Passwort vor /storage gesetzt.');

        return self::SUCCESS;
    }
}
