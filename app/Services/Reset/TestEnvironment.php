<?php

declare(strict_types=1);

namespace App\Services\Reset;

use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Where Testumgebung zurücksetzen may run, and the facts its parts share (CLAUDE.md R-04.1). A reset may take the
 * orders and their frozen snapshots only while four conditions hold at once — asked here, in this order, on every
 * call, and never cached:
 *
 *  1. the environment is a test environment (`local`, `testing`, `staging`), never `production`;
 *  2. the database is not the live shop's: it names its own environment in the row `datenbank_umgebung` — written once,
 *     by the migration that made it, so an app pointed at the live database reads „production“ there — and it holds
 *     no real payment;
 *  3. the server says yes: `RIMIFY_RESET_ERLAUBT=true`, and nothing else counts as yes;
 *  4. the call comes from `rimify:reset` or from the screen System › Zurücksetzen — the ResetOrigin only those two can
 *     make, and the engine (TestReset) only they may use (tests/Feature/Reset/ResetReachTest).
 *
 * The first three decide whether the page, its place on the rail and the command answer at all (available()); the
 * engine asks all four. Each refusal says in German what is missing, and none of them writes anything.
 */
final class TestEnvironment
{
    /** Where a reset is possible at all. Production never. */
    public const ENVIRONMENTS = ['local', 'testing', 'staging'];

    /** The server's own yes: this variable, set to exactly `true`. */
    public const FLAG = 'RIMIFY_RESET_ERLAUBT';

    /**
     * The settings row in which a database names the environment it was made in (the migration
     * record_database_environment); never written by anything else, never changed.
     */
    public const MARKER = 'datenbank_umgebung';

    /** How long a reset's safety copy and files are kept, and so how long it can be undone. */
    public const KEEP_DAYS = 7;

    /** What has to be typed before a reset (AdminConfirm's confirmWord). */
    public const WORD = 'ZURÜCKSETZEN';

    /**
     * The last reset: {id, level, at, by, undone_at, previous}. A kept table, so it survives the reset it describes;
     * `previous` is the reset before it, still undoable, so undoing one after another steps back in order.
     */
    public const SETTING = 'testumgebung_reset';

    /**
     * Whether the code may offer a reset here at all — the environment alone, as the routes are registered and the
     * scheduler's jobs are planned. Whether it may run is available().
     */
    public static function environmentAllows(): bool
    {
        return ! app()->environment('production') && app()->environment(self::ENVIRONMENTS);
    }

    /** Conditions 1 to 3: the page, its place on the rail and the command answer. */
    public static function available(): bool
    {
        return self::refusal() === null;
    }

    /**
     * Why a reset may not run here, or null. Without an origin, conditions 1 to 3; the engine passes the origin it was
     * handed, so all four are asked.
     */
    public static function refusal(?ResetOrigin $origin = null): ?string
    {
        if (! self::environmentAllows()) {
            return 'Das Zurücksetzen gibt es nur in der Testumgebung, nie im Live-Shop.';
        }

        if (config('rimify.reset.allowed') !== true) {
            return 'Das Zurücksetzen ist auf diesem Server nicht freigegeben ('.self::FLAG.' ist nicht auf true gesetzt). Es wurde nichts verändert.';
        }

        return self::databaseRefusal() ?? $origin?->refusal();
    }

    /**
     * Condition 2: the database names itself a test database, and holds no real payment. Read straight from the
     * tables, past any cache — a stale answer is exactly what an app pointed at the wrong database would get.
     */
    public static function databaseRefusal(): ?string
    {
        try {
            $raw = DB::table('settings')->where('key', self::MARKER)->value('value');
            $live = DB::table('payment_events')->where('livemode', true)->exists();
        } catch (Throwable) {
            return 'Die Datenbank lässt sich nicht lesen. Deshalb ist unklar, ob sie zur Testumgebung gehört. Es wurde nichts verändert.';
        }

        $environment = is_string($raw) ? json_decode($raw, true) : null;

        return match (true) {
            ! is_string($environment) || $environment === '' => 'In der Datenbank ist nicht vermerkt, zu welcher Umgebung sie gehört (Eintrag '.self::MARKER.'). Sie wird nicht zurückgesetzt.',
            $environment === 'production' => 'Das ist die Datenbank des Live-Shops. Sie wird nicht zurückgesetzt.',
            $live => 'In dieser Datenbank stehen echte Zahlungen. Sie wird nicht zurückgesetzt.',
            default => null,
        };
    }

    /**
     * The values of every RIMIFY_RESET_ERLAUBT line in a .env file — read from the file itself, since a cached
     * configuration no longer says whether the line is there at all (deploy/check-env.php reads it the same way). The
     * live shop's list must be empty: a line there is a defect even with false (GO-LIVE.md §4.4).
     *
     * @return list<string>
     */
    public static function flagLines(?string $file = null): array
    {
        $file ??= base_path('.env');
        $values = [];

        foreach (is_file($file) ? (preg_split('/\R/', (string) file_get_contents($file)) ?: []) : [] as $line) {
            if (preg_match('/^\s*(?:export\s+)?'.self::FLAG.'\s*=\s*(.*?)\s*$/', $line, $m) === 1) {
                $values[] = trim($m[1], "\"' \t");
            }
        }

        return $values;
    }

    /** The environment this database was made in, as its marker row says, or null. */
    public static function databaseEnvironment(): ?string
    {
        try {
            $raw = DB::table('settings')->where('key', self::MARKER)->value('value');
        } catch (Throwable) {
            return null;
        }

        $environment = is_string($raw) ? json_decode($raw, true) : null;

        return is_string($environment) && $environment !== '' ? $environment : null;
    }

    public static function dir(): string
    {
        $dir = (string) config('rimify.reset.dir', 'storage/app/private/resets');

        return preg_match('~^([a-zA-Z]:[\\\\/]|/)~', $dir) === 1 ? $dir : base_path($dir);
    }

    public static function baseline(): string
    {
        $path = (string) config('rimify.reset.baseline', 'database/baseline/testumgebung.sql');

        return preg_match('~^([a-zA-Z]:[\\\\/]|/)~', $path) === 1 ? $path : base_path($path);
    }

    /**
     * Whether a reset that emptied the shop is in force (not undone): the deploy then writes no demo data and no
     * example catalogue again, and the smoke test expects no wheel.
     */
    public static function shopEmptied(): bool
    {
        try {
            $last = Setting::get(self::SETTING);
        } catch (Throwable) {
            return false;
        }

        return is_array($last) && in_array($last['level'] ?? null, [ResetLevel::Shop->value, ResetLevel::All->value], true)
            && ($last['undone_at'] ?? null) === null;
    }
}
