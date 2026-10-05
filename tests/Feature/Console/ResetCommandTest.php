<?php

declare(strict_types=1);

use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetOrigin;
use App\Services\Reset\ResetRefused;
use App\Services\Reset\TestReset;
use Mockery\MockInterface;

/*
 * `rimify:reset` — the page's reset from the console (TestReset does the work; TestResetTest proves it): never in
 * production, never without the server's yes, never without the word or --force, and every refusal in the reset's own
 * words. The command names itself as the origin, from inside its own run (ResetOrigin::console).
 */

beforeEach(function (): void {
    config(['rimify.reset.allowed' => true]);
});

function fakeConsoleReset(): MockInterface
{
    $mock = Mockery::mock(TestReset::class);
    app()->instance(TestReset::class, $mock);

    return $mock;
}

it('resets after the word, names the level and what went, and says how to undo it', function (): void {
    fakeConsoleReset()->shouldReceive('reset')->once()
        ->withArgs(fn (ResetLevel $level, string $by, ResetOrigin $origin): bool => $level === ResetLevel::Shop && $by === 'Konsole (rimify:reset)'
            && $origin->via === 'rimify:reset' && $origin->refusal() === null)
        ->andReturn(['id' => 'x', 'level' => ResetLevel::Shop, 'counts' => [['label' => 'Felgen', 'count' => 12]], 'files' => ['images' => 0, 'pdfs' => 0, 'failed' => 0],
            'backup' => ['bytes' => 3_145_728, 'tables' => 80, 'rows' => 1_234, 'triggers' => 6]]);

    $this->artisan('rimify:reset', ['--level' => 'shop'])
        ->expectsQuestion('Zum Bestätigen ZURÜCKSETZEN tippen', 'ZURÜCKSETZEN')
        ->expectsOutputToContain('Zurückgesetzt (Shopdaten): 12 Felgen.')
        // The copy's own size as read back — never the host's free-space figure (the brief of 05.10.2026, §2.2).
        ->expectsOutputToContain("Sicherung: 3,0\u{00A0}MB, verschlüsselt, gelesen und geprüft (80 Tabellen, 1.234 Zeilen, 6 Trigger).")
        ->expectsOutputToContain('rimify:reset --undo')
        ->assertSuccessful();
});

it('changes nothing without the word, without a level, or without --force where nobody can answer', function (): void {
    fakeConsoleReset()->shouldNotReceive('reset');

    $this->artisan('rimify:reset', ['--level' => 'shop'])
        ->expectsQuestion('Zum Bestätigen ZURÜCKSETZEN tippen', 'ja')
        ->expectsOutputToContain('Es wurde nichts verändert.')
        ->assertFailed();

    $this->artisan('rimify:reset')->assertExitCode(2);
    $this->artisan('rimify:reset', ['--level' => 'everything', '--force' => true])->assertExitCode(2);
    $this->artisan('rimify:reset', ['--level' => 'shop', '--no-interaction' => true])->expectsOutputToContain('nur mit --force')->assertFailed();
});

it('undoes, recovers and prunes, and says a refusal in the reset\'s words', function (): void {
    $mock = fakeConsoleReset();
    $mock->shouldReceive('undo')->once()->withArgs(fn (string $by, ResetOrigin $origin): bool => $origin->refusal() === null)
        ->andReturn(['id' => 'x', 'level' => ResetLevel::All, 'files' => ['restored' => 5, 'failed' => 0], 'backup' => null]);
    $mock->shouldReceive('recover')->once()->withArgs(fn (ResetOrigin $origin): bool => $origin->refusal() === null)->andReturn(null);
    $mock->shouldReceive('prune')->once()->andReturn(2);
    $mock->shouldReceive('protectCopies')->once()->andReturn(1);
    $mock->shouldReceive('reset')->once()->andThrow(new ResetRefused('In dieser Datenbank stehen echte Zahlungen. Sie wird nicht zurückgesetzt.'));

    $this->artisan('rimify:reset', ['--undo' => true, '--force' => true])->expectsOutputToContain('Rückgängig gemacht: das Zurücksetzen „Alles“. 5 Dateien zurückgeholt.')->assertSuccessful();
    $this->artisan('rimify:reset', ['--recover' => true])->expectsOutputToContain('Nichts unterbrochen.')->assertSuccessful();
    $this->artisan('rimify:reset', ['--prune' => true])->expectsOutputToContain('2 alte Sicherung(en) entfernt, 1 verschlüsselt.')->assertSuccessful();
    $this->artisan('rimify:reset', ['--level' => 'all', '--force' => true])->expectsOutputToContain('echte Zahlungen')->assertFailed();
});

it('refuses without the server\'s yes, and in production whatever it is asked', function (): void {
    fakeConsoleReset()->shouldNotReceive('reset', 'undo', 'recover', 'prune');

    config(['rimify.reset.allowed' => false]);
    $this->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain('RIMIFY_RESET_ERLAUBT')->assertFailed();

    config(['rimify.reset.allowed' => true]);
    app()->detectEnvironment(static fn (): string => 'production');

    $this->artisan('rimify:reset', ['--level' => 'shop', '--force' => true])->expectsOutputToContain('nie im Live-Shop')->assertFailed();
    $this->artisan('rimify:reset', ['--recover' => true])->assertFailed();
    $this->artisan('rimify:reset', ['--prune' => true])->assertFailed();

    app()->detectEnvironment(static fn (): string => 'testing');
});
