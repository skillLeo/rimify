<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Setting;
use App\Services\Demo\DemoDashboard;
use App\Services\Demo\DemoGuard;
use App\Services\Demo\DemoTables;
use App\Services\Reset\TestReset;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use RuntimeException;

/**
 * Writes the admin's demonstration data (DemoDashboard): 210 days ending on the anchor day. Refused
 * outside local, staging and testing, and without DEMO_DATA=1 — in production always.
 */
final class DemoSeed extends Command
{
    public const SCALES = ['0.25', '1', '3'];

    protected $signature = 'demo:seed
        {--scale=1 : How busy the shop is: 0.25, 1 or 3}
        {--anchor= : The story\'s last day, YYYY-MM-DD (Berlin); today by default}
        {--unless-removed : Write nothing where a person took the demo data away (the deploy\'s call)}';

    protected $description = 'Write the admin\'s demonstration data (local, staging and testing only)';

    public function handle(): int
    {
        // The fence first: nothing of the generator is even built where it may not run.
        $refusal = DemoGuard::refusal();

        if ($refusal !== null) {
            $this->error($refusal);

            return self::FAILURE;
        }

        // A deploy writes the demo set only where nobody took it away: the strip, `demo:purge` or a reset of the test
        // environment would otherwise be undone by the next release (and fail it, the example catalogue being gone).
        if ($this->option('unless-removed') && (DemoTables::removed() || TestReset::shopEmptied())) {
            $this->line('Demodaten wurden entfernt und werden nicht wieder geschrieben.');

            return self::SUCCESS;
        }

        $scale = (string) $this->option('scale');

        if (! in_array($scale, self::SCALES, true)) {
            $this->error('The scale is 0.25, 1 or 3.');

            return self::INVALID;
        }

        $anchor = self::anchor($this->option('anchor'));

        if ($anchor === null) {
            $this->error('The anchor is a date written YYYY-MM-DD.');

            return self::INVALID;
        }

        $started = microtime(true);

        try {
            $counts = app(DemoDashboard::class)->seed($anchor, (float) $scale);
        } catch (RuntimeException $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        // Written on purpose: the demo set is there again, and a later deploy keeps it as it keeps any.
        Setting::query()->whereKey(DemoTables::REMOVED)->delete();

        $this->table(['Table', 'Demo rows'], array_map(static fn (string $t, int $n): array => [$t, $n], array_keys($counts), $counts));
        $this->info(sprintf('Demo data up to %s at scale %s, in %.1f s.', $anchor->toDateString(), $scale, microtime(true) - $started));

        return self::SUCCESS;
    }

    /** The anchor asked for, or today in Berlin; null for anything that is not a date. */
    public static function anchor(mixed $option): ?CarbonImmutable
    {
        if ($option === null || $option === '') {
            return CarbonImmutable::now(GermanFormat::TIMEZONE)->startOfDay();
        }

        if (! is_string($option) || preg_match('/^\d{4}-\d{2}-\d{2}$/', $option) !== 1) {
            return null;
        }

        $day = CarbonImmutable::createFromFormat('!Y-m-d', $option, GermanFormat::TIMEZONE);

        return $day instanceof CarbonImmutable && $day->toDateString() === $option ? $day : null;
    }

    /** What `demo:reanchor` keeps: the scale in place. */
    public static function scaleInPlace(): string
    {
        $set = DemoTables::set();

        return $set === null ? '1' : rtrim(rtrim(number_format($set['scale'], 2, '.', ''), '0'), '.');
    }
}
