<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Content\ContentChanges;
use App\Support\GermanFormat;
use App\Support\ReleaseStamp;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Throwable;

/**
 * `php artisan rimify:review-ready` — before anybody is invited to look: what the shop's own words say now and what
 * changed in them since the last release, trials marked (ContentChanges; the operator's brief „THE HERO SAYS
 * „(VIELLEICHT)““ §2). Read-only. Exit 1 while anything reads as a trial — settled first, then the invitation.
 */
class ReviewReady extends Command
{
    protected $signature = 'rimify:review-ready {--since= : From when, instead of the release stamp (YYYY-MM-DD HH:MM, Europe/Berlin)}';

    protected $description = 'Say what changed in the shop\'s words since the last release, trials marked (read-only)';

    public function handle(ContentChanges $changes): int
    {
        $since = $this->since();

        if ($since === null) {
            return self::FAILURE;
        }

        $this->line('== Startseite, wie sie jetzt im Shop steht');

        foreach ($changes->promises() as $line) {
            $this->line("   {$line['label']}: {$line['text']}");
        }

        $published = $changes->published($since['at']);
        $drafts = $changes->drafts(now());
        $trials = 0;

        $this->newLine();
        $this->line('== Veröffentlicht seit '.$since['label'].': '.(count($published) === 0 ? 'nichts' : count($published).' Fassung'.(count($published) === 1 ? '' : 'en')));

        foreach ($published as $version) {
            $this->line('-- '.$version['page'].' ('.$version['slug'].') · '.GermanFormat::dateTime($version['at']).' · '.($version['author'] ?? 'ohne Konto').' · Notiz: '.($version['note'] === null || trim($version['note']) === '' ? '–' : '„'.trim($version['note']).'“'));
            $this->changes($version['changes']);
            $trials += $this->trials($version['trial']);
        }

        $this->newLine();
        $this->line('== Entwürfe, noch nicht veröffentlicht: '.(count($drafts) === 0 ? 'keine' : count($drafts)));

        foreach ($drafts as $draft) {
            $this->line('-- '.$draft['page'].' ('.$draft['slug'].') · zuletzt '.(GermanFormat::dateTime($draft['at']) ?? 'ohne Zeit').' · '.($draft['author'] ?? 'ohne Konto'));
            $this->changes($draft['changes']);
            $trials += $this->trials($draft['trial']);
        }

        $this->newLine();

        if ($trials > 0) {
            $this->warn("{$trials} Stelle".($trials === 1 ? '' : 'n').' sieht nach einem Versuch aus. Erst klären, dann einladen.');

            return self::FAILURE;
        }

        $this->info('Nichts sieht nach einem Versuch aus.');

        return self::SUCCESS;
    }

    /** @return array{at: CarbonImmutable, label: string}|null */
    private function since(): ?array
    {
        $given = $this->option('since');

        if (is_string($given) && trim($given) !== '') {
            try {
                $at = CarbonImmutable::parse(trim($given), 'Europe/Berlin')->utc();
            } catch (Throwable) {
                $this->error('--since bitte als 2026-10-16 18:30 (Berliner Zeit).');

                return null;
            }

            return ['at' => $at, 'label' => GermanFormat::dateTime($at).' (--since)'];
        }

        $release = ReleaseStamp::read();

        if ($release === null) {
            $this->error('Kein Release-Stempel (public/'.ReleaseStamp::FILE.'): sag mit --since, ab wann.');

            return null;
        }

        return ['at' => $release['built'], 'label' => 'Release '.$release['commit'].' vom '.GermanFormat::dateTime($release['built'])];
    }

    /** @param list<array{label: string, before: string, after: string}> $changes */
    private function changes(array $changes): void
    {
        if ($changes === []) {
            $this->line('   (keine Änderung an den Texten)');
        }

        foreach ($changes as $change) {
            $this->line('   '.$change['label'].': „'.self::flat($change['before']).'“ → „'.self::flat($change['after']).'“');
        }
    }

    /** @param list<string> $trial */
    private function trials(array $trial): int
    {
        foreach ($trial as $reason) {
            $this->line('   ! Versuch? '.$reason);
        }

        return $trial === [] ? 0 : 1;
    }

    private static function flat(string $text): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', $text));
    }
}
