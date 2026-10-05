<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetOrigin;
use App\Services\Reset\ResetRefused;
use App\Services\Reset\TestEnvironment;
use App\Services\Reset\TestReset;
use App\Support\GermanFormat;
use Illuminate\Console\Command;

/**
 * `rimify:reset --level=demo|shop|all`: the test environment back to an empty shop, as Einstellungen › System ›
 * Testumgebung zurücksetzen does it (TestReset) — only where the four conditions of CLAUDE.md R-04.1 hold, and never in
 * production, where it refuses before it reads or writes anything. `--undo` takes the last reset back (seven days),
 * `--recover` finishes or puts back an interrupted one (the scheduler runs it every minute, and with nothing
 * interrupted it touches nothing), `--prune` removes the safety copies older than seven days (hourly) and records
 * each, and makes the ones still kept private: sealed, folders 0700, files 0600.
 */
final class ResetCommand extends Command
{
    protected $signature = 'rimify:reset
        {--level= : demo, shop or all}
        {--undo : Undo the last reset}
        {--recover : Finish or put back an interrupted reset}
        {--prune : Remove safety copies older than seven days}
        {--force : Do not ask for the word first}';

    protected $description = 'Reset the test environment to an empty shop (never in production)';

    /** While handle() runs: what ResetOrigin::console() asks before it names this command as a reset's origin. */
    private bool $running = false;

    public function handle(TestReset $reset): int
    {
        $this->running = true;

        try {
            return $this->perform($reset);
        } finally {
            $this->running = false;
        }
    }

    public function running(): bool
    {
        return $this->running;
    }

    private function perform(TestReset $reset): int
    {
        // Production first, before anything is read or written.
        if (! TestEnvironment::environmentAllows()) {
            $this->error('Das Zurücksetzen gibt es nur in der Testumgebung, nie im Live-Shop.');

            return self::FAILURE;
        }

        if ($this->option('prune')) {
            $removed = $reset->prune();
            $sealed = $reset->protectCopies();
            $this->line(sprintf('%d alte Sicherung(en) entfernt, %d verschlüsselt.', $removed, $sealed));

            return self::SUCCESS;
        }

        if ($this->option('recover')) {
            try {
                $done = $reset->recover(ResetOrigin::console($this));
            } catch (ResetRefused $refused) {
                $this->error($refused->getMessage());

                return self::FAILURE;
            }

            $this->line($done === null ? 'Nichts unterbrochen.' : "Unterbrochenes Zurücksetzen: {$done}.");

            return self::SUCCESS;
        }

        $refusal = TestEnvironment::refusal();

        if ($refusal !== null) {
            $this->error($refusal);

            return self::FAILURE;
        }

        $level = ResetLevel::tryFrom((string) $this->option('level'));

        if (! $this->option('undo') && $level === null) {
            $this->error('--level=demo, --level=shop oder --level=all angeben (oder --undo).');

            return self::INVALID;
        }

        if (! $this->option('force') && ! $this->confirmed($level)) {
            $this->warn('Abgebrochen. Es wurde nichts verändert.');

            return self::FAILURE;
        }

        try {
            if ($this->option('undo')) {
                $result = $reset->undo('Konsole (rimify:reset)', ResetOrigin::console($this));
                $this->info("Rückgängig gemacht: das Zurücksetzen „{$result['level']->label()}“. {$result['files']['restored']} Dateien zurückgeholt.");
                $this->backupLine($result['backup']);

                return self::SUCCESS;
            }

            /** @var ResetLevel $level */
            $result = $reset->reset($level, 'Konsole (rimify:reset)', ResetOrigin::console($this));
        } catch (ResetRefused $refused) {
            $this->error($refused->getMessage());

            return self::FAILURE;
        }

        $what = array_map(static fn (array $c): string => $c['count'].' '.$c['label'], $result['counts']);
        $this->info('Zurückgesetzt ('.$level->label().'): '.($what === [] ? 'es war nichts zu entfernen' : implode(', ', $what)).'.');
        $this->backupLine($result['backup']);
        $this->line('Rückgängig machen bis zu '.TestEnvironment::KEEP_DAYS.' Tage lang: php artisan rimify:reset --undo');

        return self::SUCCESS;
    }

    /**
     * The safety copy as it was read back — its own size, never the host's free-space figure, which on a shared host is
     * the whole volume's (the operator's brief of 05.10.2026, §2.2).
     *
     * @param  array{bytes: int, tables: int, rows: int, triggers: int}|null  $backup
     */
    private function backupLine(?array $backup): void
    {
        if ($backup === null) {
            return;
        }

        $this->line(sprintf(
            'Sicherung: %s, verschlüsselt, gelesen und geprüft (%s Tabellen, %s Zeilen, %s Trigger).',
            GermanFormat::decimal($backup['bytes'] / 1_048_576, 1).GermanFormat::NBSP.'MB',
            GermanFormat::integer($backup['tables']),
            GermanFormat::integer($backup['rows']),
            GermanFormat::integer($backup['triggers']),
        ));
    }

    private function confirmed(?ResetLevel $level): bool
    {
        if (! $this->input->isInteractive()) {
            $this->error('Ohne Rückfrage nur mit --force.');

            return false;
        }

        $this->line($level === null ? 'Das letzte Zurücksetzen wird rückgängig gemacht.' : 'Stufe '.$level->label().': '.$level->removes());

        return trim((string) $this->ask('Zum Bestätigen '.TestEnvironment::WORD.' tippen')) === TestEnvironment::WORD;
    }
}
