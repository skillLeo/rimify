<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Reset\ResetProbe;
use Illuminate\Console\Command;

/**
 * `rimify:append-only-check`: asks the database itself whether the Protokoll and the Prüfnachweise are still
 * append-only (R-12) — the four triggers there by name, an UPDATE and a DELETE of each refused with SQLSTATE 45000, the
 * order line under a Prüfnachweis refused with error 1451. The same check a reset runs after its restore (ResetProbe,
 * R-12.3), on its own: the acceptance test after any database restore that is not a reset — a move to another data
 * centre (docs/ops/UMZUG-DE.md), a rollback (GO-LIVE §7.2). Counting triggers does not see a trigger that refuses
 * nothing; this does. Every statement runs in a transaction that is rolled back: nothing it does is kept.
 */
final class AppendOnlyCheck extends Command
{
    protected $signature = 'rimify:append-only-check';

    protected $description = 'Prove that the audit log and the fitment snapshots still refuse every change (R-12)';

    public function handle(ResetProbe $probe): int
    {
        $failures = $probe->failures();
        $failed = array_column($failures, null, 'check');

        $this->table(['Prüfung', 'Ergebnis'], array_map(
            static fn (string $check, string $text): array => [
                $text,
                isset($failed[$check]) ? 'FEHLT · '.$failed[$check]['detail'] : 'ok',
            ],
            array_keys(ResetProbe::CHECKS),
            array_map(self::expected(...), ResetProbe::CHECKS),
        ));

        if ($failures !== []) {
            $this->error('Der Schutz von Protokoll und Prüfnachweisen hält nicht: '.count($failures).' von '.count(ResetProbe::CHECKS).' Prüfungen fehlgeschlagen.');

            return self::FAILURE;
        }

        $this->info('Protokoll und Prüfnachweise lehnen jede Änderung ab.');

        return self::SUCCESS;
    }

    /** The check as what it expects, from the sentence that says it did not hold. */
    private static function expected(string $failure): string
    {
        return match (true) {
            str_starts_with($failure, 'Nicht alle Trigger') => 'Alle Trigger, die das Protokoll und die Prüfnachweise schützen, sind vorhanden',
            default => (string) preg_replace('/ wurde nicht abgelehnt/', ' wird abgelehnt', $failure),
        };
    }
}
