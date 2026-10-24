<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\GermanFormat;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The browser suite's frozen day (D-337): a request that names a day in `X-E2E-Today` is answered as on that day at noon,
 * Berlin — so a spec that reads figures by the day („the last 30 days“) answers the same whatever the calendar says, and
 * never breaks because the demo data grew old (UEB-02, 24.10.2026).
 *
 * Never on a server that is not a developer's or the test run's: only with RIMIFY_E2E_CLOCK=on — which the browser suite
 * sets for the servers it starts (playwright.config.ts) and nothing else does — and only where APP_ENV is local or
 * testing. A malformed day is no day.
 *
 * It sits at the end of the web group, inside the session and the CSRF token: they write their cookies after the clock is
 * set back, so a frozen day never dates a sign-in's cookie into the past.
 */
final class E2eToday
{
    public const HEADER = 'X-E2E-Today';

    public function handle(Request $request, Closure $next): Response
    {
        $day = self::day($request->header(self::HEADER));

        if ($day === null || ! self::allowed()) {
            return $next($request);
        }

        Carbon::setTestNow($day);
        CarbonImmutable::setTestNow($day);

        try {
            return $next($request);
        } finally {
            Carbon::setTestNow();
            CarbonImmutable::setTestNow();
        }
    }

    public static function allowed(): bool
    {
        return config('rimify.e2e_clock') === true && app()->environment(['local', 'testing']);
    }

    private static function day(mixed $value): ?CarbonImmutable
    {
        if (! is_string($value) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) !== 1) {
            return null;
        }

        $day = CarbonImmutable::createFromFormat('!Y-m-d', $value, GermanFormat::TIMEZONE);

        return $day instanceof CarbonImmutable && $day->toDateString() === $value ? $day->setTime(12, 0) : null;
    }
}
