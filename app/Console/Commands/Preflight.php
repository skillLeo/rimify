<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoTables;
use App\Services\Storage\S3Audit;
use App\Services\Storage\StorageSettings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

/**
 * `rimify:preflight`: launch day is this command and a green board. One row per thing that must be
 * right before the shop takes orders; go when none fails. Grows with the launch ledger (M8): today
 * the application, the database, the demo data (R-12) and the media storage — the full S3 audit as
 * one row, with `--skip-s3` for a quick look.
 */
final class Preflight extends Command
{
    protected $signature = 'rimify:preflight {--skip-s3 : Leave out the bucket audit (it writes and reads probe files)}';

    protected $description = 'Go / no-go: application, database, demo data and media storage';

    public function handle(StorageSettings $settings, S3Audit $audit): int
    {
        $rows = [];

        $rows[] = ['Anwendungsschlüssel', filled(config('app.key')) ? 'ok' : 'fail', filled(config('app.key')) ? 'gesetzt' : 'APP_KEY fehlt'];

        $debug = (bool) config('app.debug');
        $production = app()->environment('production');
        $rows[] = ['Umgebung', $production && $debug ? 'fail' : 'ok', app()->environment().($debug ? ', Debug an' : ', Debug aus')];

        try {
            DB::connection()->getPdo();
            $rows[] = ['Datenbank', 'ok', DB::connection()->getDatabaseName()];
        } catch (Throwable $e) {
            $rows[] = ['Datenbank', 'fail', $e->getMessage()];
        }

        try {
            Artisan::call('migrate:status', ['--pending' => true]);
            $pending = substr_count(Artisan::output(), 'Pending');
            $rows[] = ['Migrationen', $pending === 0 ? 'ok' : 'fail', $pending === 0 ? 'alle ausgeführt' : "{$pending} ausstehend"];
        } catch (Throwable $e) {
            $rows[] = ['Migrationen', 'fail', $e->getMessage()];
        }

        $demo = DemoTables::total();
        $rows[] = ['Demodaten', $demo === 0 ? 'ok' : ($production ? 'fail' : 'warn'), $demo === 0 ? 'keine' : "{$demo} Datensätze – vor dem Start demo:purge"];

        $current = $settings->current();
        $rows[] = ['Speicher: Quelle', $current->isBucket() ? 'ok' : ($production ? 'fail' : 'warn'), match ($current->source) {
            'database' => 'Einstellungen im Admin',
            'env' => 'Werte aus der .env-Datei',
            default => 'lokaler Speicher, kein Bucket',
        }];

        if ($this->option('skip-s3') || ! $current->isBucket()) {
            $rows[] = ['Speicher: S3-Audit', 'skip', $current->isBucket() ? 'mit --skip-s3 ausgelassen' : 'kein Bucket'];
        } else {
            $result = $audit->run($current);
            $failed = array_filter($result['rows'], static fn (array $r): bool => $r['status'] === 'fail');
            $warned = array_filter($result['rows'], static fn (array $r): bool => $r['status'] === 'warn');
            $rows[] = ['Speicher: S3-Audit', $failed === [] ? ($warned === [] ? 'ok' : 'warn') : 'fail', $failed === []
                ? '10 Prüfungen, '.count($warned).' Warnungen (rimify:s3-audit für die Einzelheiten)'
                : implode(' · ', array_map(static fn (array $r): string => "{$r['n']} {$r['check']}", $failed))];
        }

        $rows[] = ['Speicher-Tabelle', Schema::hasTable('storage_settings') ? 'ok' : 'fail', Schema::hasTable('storage_settings') ? 'vorhanden' : 'Migration fehlt'];

        $marks = ['ok' => 'GO', 'warn' => 'Warnung', 'fail' => 'NO-GO', 'skip' => '–'];
        $this->table(['Prüfung', 'Ergebnis', 'Befund'], array_map(static fn (array $r): array => [$r[0], $marks[$r[1]], $r[2]], $rows));

        $noGo = array_filter($rows, static fn (array $r): bool => $r[1] === 'fail');

        if ($noGo !== []) {
            $this->error('NO-GO: '.count($noGo).' Prüfung(en) fehlgeschlagen.');

            return self::FAILURE;
        }

        $this->info('GO.');

        return self::SUCCESS;
    }
}
