<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\Request;

/**
 * The test environment's one slim line above the header (PreviewRibbon.vue): on the staging copy only, until the
 * visitor puts it away. „Ausblenden" is kept by the browser in `rmf_vorschau`; the server reads it, so the next page's
 * first frame has no ribbon either (R-08). The live shop never shows it.
 *
 * Nothing stands in front of the staging copy: no password, no entry page — the admin has its own sign-in (D-088).
 * It stays out of search instead (`X-Robots-Tag`, robots.txt) and names its operator in the Impressum.
 */
final class PreviewRibbon
{
    public const COOKIE = 'rmf_vorschau';

    public static function shown(Request $request): bool
    {
        return app()->environment('staging') && $request->cookie(self::COOKIE) !== 'aus';
    }
}
