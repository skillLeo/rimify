<?php

declare(strict_types=1);

namespace App\Support;

use SensitiveParameter;

/**
 * The preview's password: one shared user, asked for by HTTP basic auth before any page, the admin or a file under
 * /storage is served (the preview gate). A publicly reachable German shop front owes an Impressum (§ 5 DDG); the
 * preview has placeholder legal texts, so it is shown to the client behind a password until those arrive — and kept
 * out of search engines (`X-Robots-Tag`, robots.txt) either way.
 *
 * Two layers, one password: the middleware (App\Http\Middleware\PreviewGate) for everything Laravel answers, and a
 * basic-auth `.htaccess` in `storage/app/public` for the files the web server hands out itself — the Gutachten PDFs and
 * the pictures (`rimify:preview-gate`, run by the deploy). Both answer under the same realm, so a browser asks once.
 *
 * Off unless both values are set in `.env` (`rimify.preview`): the live shop and a developer's machine have none.
 */
final class PreviewGate
{
    public const REALM = 'RIMIFY Vorschau';

    /** Paths that answer without the password: Stripe's signed webhook, the health check, and robots.txt saying „no". */
    public const OPEN = ['webhooks/*', 'up', 'robots.txt'];

    /** The ribbon's „Ausblenden", kept by the browser; the server reads it so the next page's first frame has none. */
    public const RIBBON_COOKIE = 'rmf_vorschau';

    public static function enabled(): bool
    {
        return self::user() !== null && self::password() !== null;
    }

    public static function user(): ?string
    {
        $user = config('rimify.preview.user');

        return is_string($user) && $user !== '' ? $user : null;
    }

    public static function password(): ?string
    {
        $password = config('rimify.preview.password');

        return is_string($password) && $password !== '' ? $password : null;
    }

    /** Whether the credentials a request carries are the preview's — compared in constant time. */
    public static function accepts(?string $user, #[SensitiveParameter] ?string $password): bool
    {
        $expectedUser = self::user();
        $expectedPassword = self::password();

        if ($expectedUser === null || $expectedPassword === null || $user === null || $password === null) {
            return false;
        }

        // Both compared, always: a wrong user must take as long as a wrong password.
        $userMatches = hash_equals($expectedUser, $user);
        $passwordMatches = hash_equals($expectedPassword, $password);

        return $userMatches && $passwordMatches;
    }
}
