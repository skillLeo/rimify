<?php

declare(strict_types=1);

use Illuminate\Support\Facades\File;

/*
 * `rimify:go-live-check` (the operator's brief of 05.10.2026, §7): the count line first, every check with who closes it,
 * fails while anything that is ours is missing, `--json` for a machine, `--markdown=` writes the page the client reads.
 * Fails here: a fresh test database has no Gutachten released and no cron beat — among them checks that are ours.
 */

it('prints the count line first and fails while something that is ours is missing', function (): void {
    $this->artisan('rimify:go-live-check')
        ->expectsOutputToContain(' von ')
        ->expectsOutputToContain('Recht und Pflichtangaben')
        ->expectsOutputToContain('Recht am Rad')
        ->expectsOutputToContain('Betrieb und Sicherheit')
        ->assertExitCode(1);
});

it('answers in JSON with the count line and every check', function (): void {
    expect(Artisan::call('rimify:go-live-check', ['--json' => true]))->toBe(1);
    $json = json_decode(Artisan::output(), true);

    expect($json)->toHaveKeys(['summary', 'checks'])
        ->and($json['summary'])->toMatch('/^\d+ von \d+ erfüllt · \d+ bei uns · \d+ beim Kunden/')
        ->and($json['checks'][0])->toHaveKeys(['id', 'group', 'title', 'owner', 'state', 'sentence', 'place'])
        ->and(array_column($json['checks'], 'id'))->toContain('impressum', 'agb', 'anlagen', 'schluessel', 'regelwerk', 'demodaten');
});

it('writes the report as Markdown: each side’s open items first, then every check by group', function (): void {
    $path = storage_path('framework/testing/WAS-FEHLT-'.uniqid().'.md');
    File::ensureDirectoryExists(dirname($path));

    try {
        $this->artisan('rimify:go-live-check', ['--markdown' => $path])->assertExitCode(1);
        $markdown = (string) file_get_contents($path);

        expect($markdown)->toStartWith('# Was dem Live-Shop noch fehlt')
            ->toContain('## Offen beim Kunden (')
            ->toContain('## Offen bei uns (RIMIFY) (')
            ->toContain('## Alle Prüfungen')
            ->toContain('### Recht und Pflichtangaben')
            ->toContain('| Prüfung | Zuständig | Stand | Befund | Wo |')
            ->toMatch('/\*\*\d+ von \d+ erfüllt · /');
    } finally {
        @unlink($path);
    }
});
