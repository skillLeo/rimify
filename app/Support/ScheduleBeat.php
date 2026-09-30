<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;
use Throwable;

/**
 * The scheduler's pulse: written every minute by the cron line's `schedule:run` (routes/console.php), read by
 * rimify:preflight and by the admin's health line (SystemHealth).
 *
 * It lives in the database, not the cache: every deploy clears the cache (`optimize:clear`), and a pulse that
 * vanished with it would report a scheduler that never ran right after each release.
 *
 * The scheduler is load-bearing: `orders:expire` releases the stock of orders left unpaid for 24 hours. Without
 * it that stock stays reserved for good — so its silence is said out loud, never assumed away.
 */
final class ScheduleBeat
{
    public const SETTING = 'schedule_beat';

    /** A scheduler silent this long is a problem: the health line turns amber and the panel shows a banner. */
    public const LATE_MINUTES = 60;

    public static function record(): void
    {
        Setting::set(self::SETTING, now()->getTimestamp());
    }

    /** Seconds since the last beat; null when the scheduler has never run here (or the table cannot be read). */
    public static function secondsAgo(): ?int
    {
        try {
            $beat = Setting::get(self::SETTING);
        } catch (Throwable) {
            return null;
        }

        return is_int($beat) ? max(0, now()->getTimestamp() - $beat) : null;
    }

    /** Whether this copy of the shop is expected to run the scheduler: the live shop and the review preview. */
    public static function expected(): bool
    {
        return app()->environment(['production', 'staging']);
    }
}
