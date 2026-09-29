<?php

declare(strict_types=1);

namespace App\Domain\Storefront;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * The key a shop visitor's rate limits are counted against (the operator's last prompt §2): a random id in the
 * `rmf_geraet` cookie, encrypted like every cookie the shop sets, so it cannot be made up or borrowed. German
 * mobile carriers put thousands of customers behind one address; a limit per address would lock real buyers
 * out on a Saturday afternoon with no explanation. The address is only the fallback, with a far higher ceiling,
 * for a request that carries no key yet — and never at the checkout (ShopRateLimits).
 *
 * It holds nothing but the random id: no name, no vehicle, no history. It is minted on the first shop request
 * (AssignVisitorKey) and never read for anything but counting.
 */
final class VisitorKey
{
    public const COOKIE = 'rmf_geraet';

    /** One year. */
    public const LIFETIME_MINUTES = 60 * 24 * 365;

    private const PATTERN = '/^[A-Za-z0-9]{40}$/';

    /** The request's key, or null when it carries none (or one that is not ours). */
    public static function of(Request $request): ?string
    {
        $value = $request->cookie(self::COOKIE);

        return is_string($value) && preg_match(self::PATTERN, $value) === 1 ? $value : null;
    }

    public static function mint(): string
    {
        return Str::random(40);
    }
}
