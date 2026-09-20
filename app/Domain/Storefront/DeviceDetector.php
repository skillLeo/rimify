<?php

declare(strict_types=1);

namespace App\Domain\Storefront;

/**
 * Decides desktop vs. mobile ON THE SERVER, so the SSR output already contains the right layout.
 * Desktop.vue and Mobile.vue are genuinely different documents, not one responsive page; deciding
 * from `window` after hydration would render one and then swap to the other.
 *
 * Precedence: explicit override (client demos) > Sec-CH-UA-Mobile client hint > User-Agent.
 */
final class DeviceDetector
{
    public const OVERRIDE_DESKTOP = 'desktop';

    public const OVERRIDE_MOBILE = 'mobile';

    /** Tablets get the desktop layout: it is built for a pointer-or-touch viewport of 768px and up. */
    private const MOBILE_UA = '/(iPhone|iPod|Android.+Mobile|Windows Phone|IEMobile|BlackBerry|BB10|Opera Mini|Mobile.+Firefox|webOS)/i';

    public function isMobile(?string $userAgent, ?string $secChUaMobile, ?string $override = null): bool
    {
        if ($override === self::OVERRIDE_MOBILE) {
            return true;
        }

        if ($override === self::OVERRIDE_DESKTOP) {
            return false;
        }

        // Structured-header boolean: "?1" is true, "?0" is false.
        $hint = $secChUaMobile === null ? null : trim($secChUaMobile);

        if ($hint === '?1') {
            return true;
        }

        if ($hint === '?0') {
            // Android tablets send ?0 together with a UA that has no "Mobile" token — consistent.
            return false;
        }

        if ($userAgent === null || $userAgent === '') {
            return false;
        }

        return preg_match(self::MOBILE_UA, $userAgent) === 1;
    }

    public static function normaliseOverride(mixed $value): ?string
    {
        return is_string($value) && in_array($value, [self::OVERRIDE_DESKTOP, self::OVERRIDE_MOBILE], true)
            ? $value
            : null;
    }
}
