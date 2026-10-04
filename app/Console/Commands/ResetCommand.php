<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetRefused;
use App\Services\Reset\TestReset;
use Illuminate\Console\Command;

/**
 * `rimify:reset --level=demo|shop|all`: the test environment back to an empty shop, as Einstellungen › System ›
 * Testumgebung zurücksetzen does it (TestReset) — never in production. `--undo` takes the last reset back (seven days),
 * `--recover` finishes or puts back an interrupted one (the scheduler runs it every minute), `--prune` removes the
 * safety copies older than seven days (daily).
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

    public function handle(TestReset $reset): int
    {
        if (! TestReset::available()) {
            $this->error('Das Zurücksetzen gibt es nur in der Testumgebung, nie im Live-Shop.');

            return self::FAILURE;
        }

        if ($this->option('recover')) {
            $done = $reset->recover();
            $this->line($done === null ? 'Nichts unterbrochen.' : "Unterbrochenes Zurücksetzen: {$done}.");

            return self::SUCCESS;
        }

        if ($this->option('prune')) {
            $this->line(sprintf('%d alte Sicherung(en) entfernt.', $reset->prune()));

            return self::SUCCESS;
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
                $result = $reset->undo('Konsole (rimify:reset)');
                $this->info("Rückgängig gemacht: das Zurücksetzen „{$result['level']->label()}“. {$result['files']['restored']} Dateien zurückgeholt.");

                return self::SUCCESS;
            }

            /** @var ResetLevel $level */
            $result = $reset->reset($level, 'Konsole (rimify:reset)');
        } catch (ResetRefused $refused) {
            $this->error($refused->getMessage());

            return self::FAILURE;
        }

        $what = array_map(static fn (array $c): string => $c['count'].' '.$c['label'], $result['counts']);
        $this->info('Zurückgesetzt ('.$level->label().'): '.($what === [] ? 'es war nichts zu entfernen' : implode(', ', $what)).'.');
        $this->line('Rückgängig machen bis zu '.TestReset::KEEP_DAYS.' Tage lang: php artisan rimify:reset --undo');

        return self::SUCCESS;
    }

    private function confirmed(?ResetLevel $level): bool
    {
        if (! $this->input->isInteractive()) {
            $this->error('Ohne Rückfrage nur mit --force.');

            return false;
        }

        $this->line($level === null ? 'Das letzte Zurücksetzen wird rückgängig gemacht.' : 'Stufe '.$level->label().': '.$level->removes());

        return trim((string) $this->ask('Zum Bestätigen '.TestReset::WORD.' tippen')) === TestReset::WORD;
    }
}
