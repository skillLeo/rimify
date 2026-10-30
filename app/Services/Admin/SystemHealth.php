<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Console\Commands\InvoicesExportS3Command;
use App\Models\InvoiceExport;
use App\Services\Commerce\OrderPayments;
use App\Services\Storage\StorageProbe;
use App\Support\GermanFormat;
use App\Support\MailDelivery;
use App\Support\ScheduleBeat;
use App\Support\Ssr\BoundedSsrGateway;
use App\Support\Ssr\SsrFallbacks;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
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
 * a queue dead for over an hour, or a scheduler silent for an hour. Only then does the panel show a
 * banner as well.
 *
 * @phpstan-type Check array{key: string, label: string, state: 'ok'|'warn'|'bad', sentence: string, short: string, count: string|null}
 * @phpstan-type Urgent array{key: 'maintenance'|'queue'|'schedule', sentence: string}
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

    /** The scheduler's silence, said with its consequence, for the banner; null while it runs. */
    private ?string $scheduleSilent = null;

    /** @return Report */
    public function report(): array
    {
        $checks = [
            $this->maintenance(),
            $this->failedJobs(),
            $this->queue(),
            $this->schedule(),
            $this->mail(),
            $this->storage(),
            $this->invoiceCopy(),
            $this->rendering(),
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

        if ($this->scheduleSilent !== null) {
            return ['key' => 'schedule', 'sentence' => $this->scheduleSilent];
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
                'sentence' => $count === 1 ? '1 Hintergrundaufgabe fehlgeschlagen' : GermanFormat::integer($count).' Hintergrundaufgaben fehlgeschlagen',
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

    /**
     * The cron line's `schedule:run` (ScheduleBeat): without it, orders left unpaid are never expired and the
     * stock they hold is never released. Amber after an hour's silence — and at once where it has never run —
     * on the live shop and the preview; elsewhere nobody runs a scheduler, and saying so every day is noise.
     *
     * @return Check
     */
    private function schedule(): array
    {
        return $this->guard('schedule', 'Zeitplan', function (): array {
            $seconds = ScheduleBeat::secondsAgo();
            $minutes = $seconds === null ? null : intdiv($seconds, 60);

            if ($minutes !== null && $minutes < ScheduleBeat::LATE_MINUTES) {
                return ['state' => 'ok', 'sentence' => 'Der Zeitplan läuft. Unbezahlte Bestellungen verfallen nach '.OrderPayments::HOURS_TO_PAY.' Stunden.', 'short' => '', 'count' => null];
            }

            if (! ScheduleBeat::expected()) {
                return ['state' => 'ok', 'sentence' => 'In dieser Umgebung läuft kein Zeitplan.', 'short' => '', 'count' => null];
            }

            $this->scheduleSilent = ($minutes === null ? 'Der Zeitplan ist noch nie gelaufen' : 'Der Zeitplan ist seit '.self::duration($minutes).' nicht mehr gelaufen')
                .': Unbezahlte Bestellungen verfallen nicht, und ihre Ware bleibt reserviert.';

            return ['state' => 'warn', 'sentence' => $this->scheduleSilent, 'short' => 'Zeitplan läuft nicht', 'count' => $minutes === null ? null : self::brief($minutes)];
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
     * Whether mail leaves the shop, as MailDelivery decides it for every page. On the live shop a mailer that keeps mail
     * to itself means no customer gets an e-mail — a warning. Elsewhere that is the point, and no warning, but the
     * sentence still says it: the preview said „E-Mails werden verschickt.“ while its mailer wrote to the log (D-364).
     *
     * @return Check
     */
    private function mail(): array
    {
        if (MailDelivery::real()) {
            return ['key' => 'mail', 'label' => 'E-Mail', 'state' => 'ok', 'sentence' => 'E-Mails werden verschickt.', 'short' => '', 'count' => null];
        }

        return app()->environment('production')
            ? ['key' => 'mail', 'label' => 'E-Mail', 'state' => 'warn', 'sentence' => 'E-Mails werden nicht verschickt', 'short' => 'Kein E-Mail-Versand', 'count' => null]
            : ['key' => 'mail', 'label' => 'E-Mail', 'state' => 'ok', 'sentence' => 'In dieser Umgebung werden keine E-Mails verschickt.', 'short' => '', 'count' => null];
    }

    /**
     * The server's own folder, and — where the files live in a bucket — whether the bucket answers
     * (StorageProbe). A bucket that does not is amber: pictures fall back to their placeholder and
     * uploads are refused with a sentence, but the shop still sells.
     *
     * @return Check
     */
    private function storage(): array
    {
        if (! is_writable(storage_path('app'))) {
            return ['key' => 'storage', 'label' => 'Speicher', 'state' => 'bad', 'sentence' => 'Speicher nicht beschreibbar', 'short' => 'Speicher schreibgeschützt', 'count' => null];
        }

        return $this->guard('storage', 'Speicher', static function (): array {
            $status = app(StorageProbe::class)->status();

            return $status === null || $status['reachable']
                ? ['state' => 'ok', 'sentence' => 'Dateien können gespeichert werden.', 'short' => '', 'count' => null]
                : ['state' => 'warn', 'sentence' => 'Speicher nicht erreichbar', 'short' => 'Speicher nicht erreichbar', 'count' => null];
        });
    }

    /**
     * The daily copy of Stripe's invoices to S3 (his admin item 17, D-361): amber while an invoice is not stored after its
     * tries — the next run tries it again — or where a set-up copy has not run for two days; said plainly where the shop
     * has no bucket for it yet.
     *
     * @return Check
     */
    private function invoiceCopy(): array
    {
        return $this->guard('invoices', 'Rechnungskopie', static function (): array {
            if (! InvoicesExportS3Command::configured()) {
                return ['state' => 'ok', 'sentence' => 'Für die tägliche Kopie der Stripe-Rechnungen ist noch kein S3-Speicher eingerichtet.', 'short' => '', 'count' => null];
            }

            $failed = InvoiceExport::query()->where('status', InvoiceExport::FAILED)->count();

            if ($failed > 0) {
                return ['state' => 'warn', 'sentence' => ($failed === 1 ? 'Eine Stripe-Rechnung wurde' : "{$failed} Stripe-Rechnungen wurden").' nicht nach S3 kopiert; die nächste Kopie versucht es wieder.', 'short' => 'Rechnungskopie unvollständig', 'count' => (string) $failed];
            }

            $last = Cache::get(InvoicesExportS3Command::LAST_RUN);
            $at = is_array($last) && is_string($last['at'] ?? null) ? CarbonImmutable::parse($last['at']) : null;

            if ($at === null || $at->lt(CarbonImmutable::now()->subDays(2))) {
                return [
                    'state' => 'warn',
                    'sentence' => $at === null ? 'Die tägliche Kopie der Stripe-Rechnungen ist noch nie gelaufen.' : 'Die tägliche Kopie der Stripe-Rechnungen ist seit dem '.GermanFormat::dateTime($at).' nicht mehr gelaufen.',
                    'short' => 'Rechnungskopie läuft nicht',
                    'count' => null,
                ];
            }

            return ['state' => 'ok', 'sentence' => 'Die Stripe-Rechnungen werden täglich nach S3 kopiert, zuletzt am '.GermanFormat::dateTime($at).'.', 'short' => '', 'count' => null];
        });
    }

    /**
     * Server rendering, counted (SsrFallbacks): a page the browser had to draw is empty for a search
     * engine. Amber while it keeps happening — a fallback in the last hour, or the renderer resting
     * after a failure — with today's count and the last address in the sentence. Switched off on
     * purpose it is only worth a word in production.
     *
     * @return Check
     */
    private function rendering(): array
    {
        return $this->guard('ssr', 'Server-Rendering', static function (): array {
            $today = SsrFallbacks::today();

            if (config('inertia.ssr.enabled', true) !== true) {
                return app()->environment('production')
                    ? ['state' => 'warn', 'sentence' => 'Server-Rendering ist ausgeschaltet – Suchmaschinen sehen leere Seiten', 'short' => 'Server-Rendering aus', 'count' => null]
                    : ['state' => 'ok', 'sentence' => 'Server-Rendering ist in dieser Umgebung ausgeschaltet.', 'short' => '', 'count' => null];
            }

            if (BoundedSsrGateway::paused() || SsrFallbacks::recent()) {
                $last = SsrFallbacks::last();
                $where = $last === null ? '.' : ', zuletzt '.(parse_url($last['url'], PHP_URL_PATH) ?: '/').'. Grund: '.$last['reason'];

                return [
                    'state' => 'warn',
                    'sentence' => ($today === 1 ? 'Heute 1 Seite' : 'Heute '.GermanFormat::integer($today).' Seiten').' ohne Server-Rendering'.$where,
                    'short' => 'Server-Rendering fällt aus',
                    'count' => GermanFormat::integer($today),
                ];
            }

            return [
                'state' => 'ok',
                'sentence' => 'Seiten werden auf dem Server gerendert'.($today === 0 ? '.' : ' (heute '.GermanFormat::integer($today).' ohne, zuletzt vor über einer Stunde).'),
                'short' => '',
                'count' => null,
            ];
        });
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
