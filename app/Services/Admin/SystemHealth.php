<?php

declare(strict_types=1);

namespace App\Services\Admin;

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
 * @phpstan-type Check array{key: string, label: string, state: 'ok'|'warn'|'bad', sentence: string}
 * @phpstan-type Report array{state: 'ok'|'warn'|'bad', sentence: string, checks: list<Check>, checkedAt: string}
 */
final class SystemHealth
{
    /** A job older than this in the queue means nobody is working it. */
    public const STUCK_MINUTES = 15;

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
        $headline = 'Alles in Ordnung';

        foreach ($checks as $check) {
            if ($check['state'] === $state && $state !== 'ok') {
                $headline = $check['sentence'];

                break;
            }
        }

        return [
            'state' => $state,
            'sentence' => $headline,
            'checks' => $checks,
            'checkedAt' => CarbonImmutable::now()->toIso8601String(),
        ];
    }

    /** @return Check */
    private function maintenance(): array
    {
        return app()->isDownForMaintenance()
            ? ['key' => 'maintenance', 'label' => 'Shop', 'state' => 'bad', 'sentence' => 'Shop im Wartungsmodus']
            : ['key' => 'maintenance', 'label' => 'Shop', 'state' => 'ok', 'sentence' => 'Der Shop ist für Kundinnen und Kunden erreichbar.'];
    }

    /** @return Check */
    private function failedJobs(): array
    {
        return $this->guard('failed_jobs', 'Hintergrundaufgaben', function (): array {
            $count = DB::table('failed_jobs')->count();

            if ($count === 0) {
                return ['state' => 'ok', 'sentence' => 'Keine Hintergrundaufgabe ist fehlgeschlagen.'];
            }

            return ['state' => 'warn', 'sentence' => $count === 1 ? '1 Job fehlgeschlagen' : "{$count} Jobs fehlgeschlagen"];
        });
    }

    /** @return Check */
    private function queue(): array
    {
        return $this->guard('queue', 'Warteschlange', function (): array {
            $oldest = DB::table('jobs')->whereNull('reserved_at')->min('created_at');

            if ($oldest === null) {
                return ['state' => 'ok', 'sentence' => 'Die Warteschlange ist leer.'];
            }

            $minutes = (int) floor((CarbonImmutable::now()->getTimestamp() - (int) $oldest) / 60);

            if ($minutes < self::STUCK_MINUTES) {
                return ['state' => 'ok', 'sentence' => 'Die Warteschlange wird abgearbeitet.'];
            }

            return ['state' => 'warn', 'sentence' => 'Warteschlange steht seit '.self::duration($minutes)];
        });
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
            return ['key' => 'mail', 'label' => 'E-Mail', 'state' => 'warn', 'sentence' => 'E-Mails werden nicht verschickt'];
        }

        return ['key' => 'mail', 'label' => 'E-Mail', 'state' => 'ok', 'sentence' => 'E-Mails werden verschickt.'];
    }

    /** @return Check */
    private function storage(): array
    {
        return is_writable(storage_path('app'))
            ? ['key' => 'storage', 'label' => 'Speicher', 'state' => 'ok', 'sentence' => 'Dateien können gespeichert werden.']
            : ['key' => 'storage', 'label' => 'Speicher', 'state' => 'bad', 'sentence' => 'Speicher nicht beschreibbar'];
    }

    /**
     * @param  callable(): array{state: 'ok'|'warn'|'bad', sentence: string}  $check
     * @return Check
     */
    private function guard(string $key, string $label, callable $check): array
    {
        try {
            return ['key' => $key, 'label' => $label, ...$check()];
        } catch (Throwable) {
            return ['key' => $key, 'label' => $label, 'state' => 'warn', 'sentence' => "{$label}: Zustand unbekannt"];
        }
    }
}
