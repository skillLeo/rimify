<?php

declare(strict_types=1);

namespace App\Http\RateLimits;

use App\Domain\Storefront\VisitorKey;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\IpUtils;

/**
 * The shop's rate limits (the operator's last prompt §2). German mobile carriers put thousands of customers
 * behind one address (carrier-grade NAT): a limit per address would lock real buyers out on a Saturday
 * afternoon with no explanation. So every limit counts:
 *
 * 1. per visitor, by the key in their `rmf_geraet` cookie (VisitorKey), first;
 * 2. per address only for a request that carries no key yet, at ADDRESS_FACTOR times the ceiling — and a
 *    warning is logged each time that fires, so a shared address being turned away is seen, not guessed;
 * 3. never per address on the way to paying: the checkout limits count visitors only.
 *
 * Each limiter counts on its own (a named limiter's key carries its name), so searching never costs the
 * checkout. The admin keeps its own limits, per signed-in account and per route (routes/web.php).
 */
final class ShopRateLimits
{
    public const ADDRESS_FACTOR = 10;

    /** Name → [requests a minute per visitor, whether it is the checkout]. */
    public const LIMITS = [
        'shop-fahrzeug' => [60, false],
        'shop-api' => [60, false],
        'shop-suche' => [120, false],
        'shop-benachrichtigung' => [10, false],
        'shop-check' => [20, false],
        'shop-kasse' => [10, true],
        'shop-kasse-rdks' => [30, true],
        'shop-testzahlung' => [10, true],
    ];

    public static function register(): void
    {
        foreach (self::LIMITS as $name => [$perMinute, $checkout]) {
            RateLimiter::for($name, static fn (Request $request): Limit => self::limit($request, $name, $perMinute, $checkout));
        }
    }

    public static function limit(Request $request, string $name, int $perMinute, bool $checkout): Limit
    {
        $visitor = VisitorKey::of($request);

        if ($visitor !== null) {
            return Limit::perMinute($perMinute)->by('visitor|'.$visitor);
        }

        if ($checkout) {
            return Limit::none();
        }

        return Limit::perMinute($perMinute * self::ADDRESS_FACTOR)
            ->by('address|'.$request->ip())
            ->response(static function (Request $request, array $headers) use ($name): never {
                // The address anonymised (the last byte of IPv4, the last 80 bits of IPv6): enough to see a
                // carrier's shared address being turned away, not enough to follow a person.
                Log::warning('Shop rate limit reached by an address without a visitor key', [
                    'limiter' => $name,
                    'address' => IpUtils::anonymize((string) $request->ip()),
                    'path' => '/'.$request->path(),
                ]);

                throw new ThrottleRequestsException('Too Many Attempts.', null, $headers);
            });
    }
}
