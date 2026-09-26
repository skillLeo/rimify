<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Whether the shop is all right, in one German sentence (BRIEF-2 §2.12, the rail's foot).
 *
 * A handful of checks, each answering in words — never a dot alone, never a code. The worst one
 * decides the sentence: a shop in maintenance mode is `bad` whatever else holds; failed or stuck
 * jobs are `warn`; otherwise „Alles in Ordnung“. A check that cannot be run says so and counts as
 * `warn`: a health line that turns green because it could not look is the one lie it must not tell.
 *
 * Each check also has a short form for the rail's one line — `short` („Warteschlange stockt“) and a
 * `count` („12 Std“) — and the report says when a problem is `urgent`: the shop in maintenance mode,
 * or a queue dead for over an hour. Only then does the panel show a banner as well.
 *
 * @phpstan-type Check array{key: string, label: string, state: 'ok'|'warn'|'bad', sentence: string, short: string, count: string|null}
 * @phpstan-type Urgent array{key: 'maintenance'|'queue', sentence: string}
 * @phpstan-type Report array{state: 'ok'|'warn'|'bad', sentence: string, label: string, count: string|null, urgent: Urgent|null, checks: list<Check>, checkedAt: string}
 */
final class SystemHealth
{
    /** A job older than this in the queue means nobody is working it. */
    public const STUCK_MINUTES = 15;

    /** A queue stuck this long is not a hiccup: the panel says so above every page (the banner). */
    public const DEAD_MINUTES = 60;

    /** Minutes the oldest waiting job has waited, for the banner; null when nothing waits. */
    private ?int $stuckFor = null;

    /** @return Report */
    public function report(): array
    {
        $checks = [
            $this->maintenance(),
            $this->failedJobs(),
            $this->queue(),
            $this->mail(),
            $this->storage(),
        ];

        $state = 'ok';

        foreach ($checks as $check) {
            if ($check['state'] === 'bad') {
                $state = 'bad';
            } elseif ($check['state'] === 'warn' && $state === 'ok') {
                $state = 'warn';
            }
        }

        // The headline is the first check in the worst state, in the order above: maintenance before
        // failed jobs before a stuck queue.
        $headline = ['sentence' => 'Alles in Ordnung', 'short' => '', 'count' => null];

        foreach ($checks as $check) {
            if ($check['state'] === $state && $state !== 'ok') {
                $headline = $check;

                break;
            }
        }

        return [
            'state' => $state,
            'sentence' => $headline['sentence'],
            'label' => $headline['short'],
            'count' => $headline['count'],
            'urgent' => $this->urgent($checks),
            'checks' => $checks,
            'checkedAt' => CarbonImmutable::now()->toIso8601String(),
        ];
    }

    /**
     * What is worth a banner across the page, not only the rail's line: the shop closed to customers,
     * or a queue that has not moved for an hour — e-mails that will never go out on their own.
     *
     * @param  list<Check>  $checks
     * @return Urgent|null
     */
    private function urgent(array $checks): ?array
    {
        foreach ($checks as $check) {
            if ($check['key'] === 'maintenance' && $check['state'] === 'bad') {
                return ['key' => 'maintenance', 'sentence' => 'Der Shop ist im Wartungsmodus: Kundinnen und Kunden erreichen ihn gerade nicht.'];
            }
        }

        if ($this->stuckFor !== null && $this->stuckFor >= self::DEAD_MINUTES) {
            return [
                'key' => 'queue',
                'sentence' => 'Die Warteschlange steht seit '.self::duration($this->stuckFor).' still: E-Mails und andere Hintergrundaufgaben bleiben liegen.',
            ];
        }

        return null;
    }

    /** @return Check */
    private function maintenance(): array
    {
        return app()->isDownForMaintenance()
            ? ['key' => 'maintenance', 'label' => 'Shop', 'state' => 'bad', 'sentence' => 'Shop im Wartungsmodus', 'short' => 'Wartungsmodus', 'count' => null]
            : ['key' => 'maintenance', 'label' => 'Shop', 'state' => 'ok', 'sentence' => 'Der Shop ist für Kundinnen und Kunden erreichbar.', 'short' => '', 'count' => null];
    }

    /** @return Check */
    private function failedJobs(): array
    {
        return $this->guard('failed_jobs', 'Hintergrundaufgaben', function (): array {
            $count = DB::table('failed_jobs')->count();

            if ($count === 0) {
                return ['state' => 'ok', 'sentence' => 'Keine Hintergrundaufgabe ist fehlgeschlagen.', 'short' => '', 'count' => null];
            }

            return [
                'state' => 'warn',
                'sentence' => $count === 1 ? '1 Job fehlgeschlagen' : "{$count} Jobs fehlgeschlagen",
                'short' => 'Aufgaben fehlgeschlagen',
                'count' => GermanFormat::integer($count),
            ];
        });
    }

    /** @return Check */
    private function queue(): array
    {
        return $this->guard('queue', 'Warteschlange', function (): array {
            $oldest = DB::table('jobs')->whereNull('reserved_at')->min('created_at');

            if ($oldest === null) {
                return ['state' => 'ok', 'sentence' => 'Die Warteschlange ist leer.', 'short' => '', 'count' => null];
            }

            $minutes = (int) floor((CarbonImmutable::now()->getTimestamp() - (int) $oldest) / 60);

            if ($minutes < self::STUCK_MINUTES) {
                return ['state' => 'ok', 'sentence' => 'Die Warteschlange wird abgearbeitet.', 'short' => '', 'count' => null];
            }

            $this->stuckFor = $minutes;

            return ['state' => 'warn', 'sentence' => 'Warteschlange steht seit '.self::duration($minutes), 'short' => 'Warteschlange stockt', 'count' => self::brief($minutes)];
        });
    }

    /** `40 Min`, `12 Std`, `3 Tage` — the same, short enough for the rail's one line. */
    private static function brief(int $minutes): string
    {
        return match (true) {
            $minutes < 120 => "{$minutes} Min",
            $minutes < 48 * 60 => intdiv($minutes, 60).' Std',
            default => intdiv($minutes, 24 * 60).' Tage',
        };
    }

    /** `40 Minuten`, `9 Stunden`, `3 Tagen` — the unit a person would say. */
    private static function duration(int $minutes): string
    {
        return match (true) {
            $minutes < 120 => "{$minutes} Minuten",
            $minutes < 48 * 60 => intdiv($minutes, 60).' Stunden',
            default => intdiv($minutes, 24 * 60).' Tagen',
        };
    }

    /**
     * On the live shop, a mailer that only writes to the log means no customer gets an e-mail. Locally
     * that is the point, and not worth a warning.
     *
     * @return Check
     */
    private function mail(): array
    {
        $mailer = config('mail.default');

        if (app()->environment('production') && in_array($mailer, ['log', 'array'], true)) {
            return ['key' => 'mail', 'label' => 'E-Mail', 'state' => 'warn', 'sentence' => 'E-Mails werden nicht verschickt', 'short' => 'Kein E-Mail-Versand', 'count' => null];
        }

        return ['key' => 'mail', 'label' => 'E-Mail', 'state' => 'ok', 'sentence' => 'E-Mails werden verschickt.', 'short' => '', 'count' => null];
    }

    /** @return Check */
    private function storage(): array
    {
        return is_writable(storage_path('app'))
            ? ['key' => 'storage', 'label' => 'Speicher', 'state' => 'ok', 'sentence' => 'Dateien können gespeichert werden.', 'short' => '', 'count' => null]
            : ['key' => 'storage', 'label' => 'Speicher', 'state' => 'bad', 'sentence' => 'Speicher nicht beschreibbar', 'short' => 'Speicher schreibgeschützt', 'count' => null];
    }

    /**
     * @param  callable(): array{state: 'ok'|'warn'|'bad', sentence: string, short: string, count: string|null}  $check
     * @return Check
     */
    private function guard(string $key, string $label, callable $check): array
    {
        try {
            return ['key' => $key, 'label' => $label, ...$check()];
        } catch (Throwable) {
            return ['key' => $key, 'label' => $label, 'state' => 'warn', 'sentence' => "{$label}: Zustand unbekannt", 'short' => "{$label} unklar", 'count' => null];
        }
    }
}
