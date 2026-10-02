<?php

declare(strict_types=1);

namespace App\Http\RateLimits;

use App\Domain\Storefront\VisitorKey;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\IpUtils;

/**
 * The shop's rate limits (the operator's last prompt §2). German mobile carriers put thousands of customers
 * behind one address (carrier-grade NAT): a limit per address would lock real buyers out on a Saturday
 * afternoon with no explanation. So every limit counts:
 *
 * 1. per visitor, by the key in their `rmf_geraet` cookie (VisitorKey), first;
 * 2. per address at ADDRESS_FACTOR times the ceiling, over every request — a key costs nothing to get, so the
 *    address is what bounds a client that keeps collecting new ones (G-06) — and a warning is logged when that
 *    fires, so a shared address being turned away is seen, not guessed;
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
        // Mein Konto (Block G §2): signing in, a new password link, „Konto anlegen“ share it — few, as a login deserves,
        // but room for a mistyped password and a forgotten one in the same minute (PAY-10).
        'shop-konto' => [10, false],
        // A buyer's review through the order's signed link (#19, D-103): one form, a handful of lines at most.
        'shop-bewertung' => [10, false],
        // The contact form (#12, D-123): a row and two mails per message — a typo corrected and sent again fits.
        'shop-kontakt' => [5, false],
    ];

    public static function register(): void
    {
        foreach (self::LIMITS as $name => [$perMinute, $checkout]) {
            RateLimiter::for($name, static fn (Request $request): Limit|array => self::limit($request, $name, $perMinute, $checkout));
        }
    }

    /**
     * A key is free — the shop hands one to every request that comes without — so a key alone bounds nothing: a
     * client that never sends the cookie back collects a fresh allowance with every page load (G-06). The address
     * ceiling therefore stands over every request, keyed or not, at ADDRESS_FACTOR times one visitor's; the key
     * only keeps visitors behind one address from sharing ONE visitor's allowance. Checkout: the key alone.
     *
     * @return Limit|list<Limit>
     */
    public static function limit(Request $request, string $name, int $perMinute, bool $checkout): Limit|array
    {
        $visitor = VisitorKey::of($request);
        $byVisitor = $visitor === null ? null : Limit::perMinute($perMinute)->by('visitor|'.$visitor);

        if ($checkout) {
            return $byVisitor ?? Limit::none();
        }

        $byAddress = Limit::perMinute($perMinute * self::ADDRESS_FACTOR)
            ->by('address|'.$request->ip())
            ->response(static function (Request $request, array $headers) use ($name): never {
                // The address anonymised (the last byte of IPv4, the last 80 bits of IPv6): enough to see a
                // carrier's shared address being turned away, not enough to follow a person. Once a minute per
                // address and limiter: a flood must not write the log at the flood's rate (G-09).
                $address = IpUtils::anonymize((string) $request->ip());

                if (Cache::add('shop-limit-warned|'.$name.'|'.$address, true, 60)) {
                    Log::warning('Shop rate limit reached by an address', [
                        'limiter' => $name,
                        'address' => $address,
                        'path' => '/'.$request->path(),
                    ]);
                }

                throw new ThrottleRequestsException('Too Many Attempts.', null, $headers);
            });

        return $byVisitor === null ? $byAddress : [$byVisitor, $byAddress];
    }
}
