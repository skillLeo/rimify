<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Storage\S3Audit;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

/**
 * The bucket, audited by us: ten rows on screen and in docs/launch/s3-audit-<date>.md, ready to send
 * as it is. Fails (exit 1) on any failed row; a warning does not fail it. Never leaves a probe file.
 */
final class S3AuditCommand extends Command
{
    protected $signature = 'rimify:s3-audit {--no-report : Do not write the report file}';

    protected $description = 'Audit the media bucket: access, region, the four prefixes, public reading, versioning, CORS, lifecycle, encryption';

    public function handle(S3Audit $audit): int
    {
        ['config' => $config, 'rows' => $rows] = $audit->run();

        $marks = ['ok' => 'OK', 'warn' => 'Warnung', 'fail' => 'FEHLER', 'info' => 'Info', 'skip' => '–'];
        $this->table(['#', 'Prüfung', 'Ergebnis', 'Befund'], array_map(static fn (array $r): array => [$r['n'], $r['check'], $marks[$r['status']], $r['detail']], $rows));

        foreach ($rows as $row) {
            // A readable invoices/ is the one line nobody may miss.
            if ($row['n'] === 5 && $row['status'] === 'fail') {
                $this->error($row['detail']);
            }
        }

        $failed = array_filter($rows, static fn (array $r): bool => $r['status'] === 'fail');

        if (! $this->option('no-report')) {
            $path = $this->report($rows, (string) $config->bucket, $config->region, $config->source);
            $this->line("Bericht: {$path}");
        }

        if ($failed !== []) {
            $this->error(count($failed).' von 10 Prüfungen fehlgeschlagen.');

            return self::FAILURE;
        }

        $this->info('Alle Prüfungen bestanden.');

        return self::SUCCESS;
    }

    /** @param  list<array{n: int, check: string, status: string, detail: string}>  $rows */
    private function report(array $rows, string $bucket, string $region, string $source): string
    {
        $now = CarbonImmutable::now(GermanFormat::TIMEZONE);
        $path = 'docs/launch/s3-audit-'.$now->format('Y-m-d').'.md';
        $marks = ['ok' => '✅ OK', 'warn' => '⚠️ Warnung', 'fail' => '❌ Fehler', 'info' => 'ℹ️ Info', 'skip' => '– übersprungen'];
        $lines = [
            '# RIMIFY — Prüfung des Speichers (S3)',
            '',
            "Bucket `{$bucket}` · Region `{$region}` · Einstellungen aus: {$source} · geprüft am ".GermanFormat::dateTime($now),
            '',
            '| # | Prüfung | Ergebnis | Befund |',
            '|---|---|---|---|',
        ];

        foreach ($rows as $row) {
            $lines[] = "| {$row['n']} | {$row['check']} | {$marks[$row['status']]} | ".str_replace('|', '\|', $row['detail']).' |';
        }

        $lines[] = '';
        $lines[] = 'Alle Prüfdateien wurden wieder gelöscht. Zugangsschlüssel stehen in diesem Bericht nicht.';

        file_put_contents(base_path($path), implode("\n", $lines)."\n");

        return $path;
    }
}
