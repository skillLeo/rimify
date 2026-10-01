<?php

declare(strict_types=1);

namespace App\Support\Ssr;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Every page that went out without server rendering, counted — never silent.
 *
 * A page the browser has to draw is correct for a person and empty for a search engine: on a shop
 * that lives on search traffic, a fallback is a fault. Each one writes a log line with its URL and
 * why, raises today's counter and remembers the last one; System › Zustand shows the count and turns
 * the row amber while it keeps happening (SystemHealth).
 */
final class SsrFallbacks
{
    private const DAY_KEY = 'ssr.fallbacks.day.';

    private const LAST_KEY = 'ssr.fallbacks.last';

    /** A fallback this recent keeps the health row amber. */
    public const RECENT_MINUTES = 60;

    /** `$reason` is one German sentence for System › Zustand; `$detail` (an exception's text) goes to the log only. */
    public static function record(string $url, string $reason, ?string $detail = null): void
    {
        Log::warning('SSR-Fallback: Seite ohne Server-Rendering ausgeliefert', array_filter(['url' => $url, 'reason' => $reason, 'detail' => $detail]));

        try {
            $key = self::DAY_KEY.self::day();
            Cache::add($key, 0, now()->addDays(8));
            Cache::increment($key);
            Cache::put(self::LAST_KEY, ['url' => $url, 'reason' => $reason, 'at' => now()->toIso8601String()], now()->addDays(8));
        } catch (Throwable) {
            // Without a cache the log line above still says it.
        }
    }

    /** Pages sent without server rendering today (Berlin). */
    public static function today(): int
    {
        try {
            return (int) Cache::get(self::DAY_KEY.self::day(), 0);
        } catch (Throwable) {
            return 0;
        }
    }

    /** @return array{url: string, reason: string, at: string}|null */
    public static function last(): ?array
    {
        try {
            $last = Cache::get(self::LAST_KEY);
        } catch (Throwable) {
            return null;
        }

        return is_array($last) && is_string($last['url'] ?? null) && is_string($last['reason'] ?? null) && is_string($last['at'] ?? null)
            ? ['url' => $last['url'], 'reason' => $last['reason'], 'at' => $last['at']]
            : null;
    }

    /** Whether the last fallback was within the last hour. */
    public static function recent(): bool
    {
        $last = self::last();

        return $last !== null && CarbonImmutable::parse($last['at'])->greaterThan(now()->subMinutes(self::RECENT_MINUTES));
    }

    private static function day(): string
    {
        return CarbonImmutable::now('Europe/Berlin')->toDateString();
    }
}
