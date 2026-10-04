<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Services\Admin\AdminNavigation;
use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetRefused;
use App\Services\Reset\TestReset;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;
use Mockery\MockInterface;
use Tests\TestCase;

/*
 * System › Testumgebung zurücksetzen as a page: the Super-Admin alone, behind the password once more; the word typed
 * before anything happens, checked on the server too; the reset and the undo handed to TestReset (whose own work is
 * TestResetTest's), and its refusals said in its words. Never in production: there the page is not even a route.
 */

const RESET_URL = '/admin/system/zuruecksetzen';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function resetAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function asResetAdmin(string $role = 'super-admin'): TestCase
{
    return test()->actingAs(resetAdmin($role), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()]);
}

/** TestReset as the page sees it — its own work is TestResetTest's, against a database of its own. */
function fakeReset(): MockInterface
{
    $mock = Mockery::mock(TestReset::class);
    $mock->shouldReceive('preview')->andReturn([
        ['key' => 'demo', 'label' => 'Demodaten', 'removes' => 'x', 'keeps' => 'y', 'counts' => [], 'blocked' => 'Zwanzig Bestellungen halten sie fest.'],
        ['key' => 'shop', 'label' => 'Shopdaten', 'removes' => 'x', 'keeps' => 'y', 'counts' => [['label' => 'Felgen', 'count' => 12], ['label' => 'Gutachten', 'count' => 3]], 'blocked' => null],
        ['key' => 'all', 'label' => 'Alles', 'removes' => 'x', 'keeps' => 'y', 'counts' => [['label' => 'Seiten', 'count' => 11]], 'blocked' => null],
    ])->byDefault();
    $mock->shouldReceive('last')->andReturn(null)->byDefault();
    app()->instance(TestReset::class, $mock);

    return $mock;
}

it('is the Super-Admin\'s alone, asks for the password first, and counts what each level would take', function (): void {
    fakeReset();

    foreach (['catalogue-manager', 'accountant', 'order-manager'] as $role) {
        asResetAdmin($role)->get(RESET_URL)->assertForbidden();
        asResetAdmin($role)->post(RESET_URL, ['level' => 'shop', 'confirmation' => TestReset::WORD])->assertForbidden();
    }

    $this->flushSession();
    $this->actingAs(resetAdmin(), 'admin')->get(RESET_URL)->assertRedirect('/admin/bestaetigen?weiter='.rawurlencode(RESET_URL));

    asResetAdmin()->get(RESET_URL)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/System/Zuruecksetzen')
            ->where('word', 'ZURÜCKSETZEN')
            ->where('keepDays', 7)
            ->where('levels.1.counts.0', ['label' => 'Felgen', 'count' => 12])
            ->where('levels.0.blocked', 'Zwanzig Bestellungen halten sie fest.'));
});

it('resets nothing without the word, and hands the level and the person to the reset with it', function (): void {
    $mock = fakeReset();
    $mock->shouldNotReceive('reset');

    asResetAdmin()->from(RESET_URL)->post(RESET_URL, ['level' => 'shop', 'confirmation' => 'zurücksetzen bitte'])
        ->assertRedirect(RESET_URL)
        ->assertSessionHasErrors(['confirmation' => 'Tippe genau „ZURÜCKSETZEN“, um zu bestätigen.']);
    asResetAdmin()->from(RESET_URL)->post(RESET_URL, ['level' => 'everything', 'confirmation' => TestReset::WORD])
        ->assertSessionHasErrors('level');

    $fresh = fakeReset();
    $fresh->shouldReceive('reset')->once()
        ->withArgs(fn (ResetLevel $level, AdminUser $by): bool => $level === ResetLevel::Shop && $by->email === 'super-admin@rimify.test')
        ->andReturn(['id' => 'x', 'level' => ResetLevel::Shop, 'counts' => [['label' => 'Felgen', 'count' => 12], ['label' => 'Gutachten', 'count' => 3]], 'files' => ['images' => 61, 'pdfs' => 3, 'failed' => 0]]);

    asResetAdmin()->from(RESET_URL)->post(RESET_URL, ['level' => 'shop', 'confirmation' => ' ZURÜCKSETZEN '])
        ->assertRedirect(RESET_URL)
        ->assertSessionHas('toast', "Testumgebung zurückgesetzt („Shopdaten“). Entfernt: 12\u{00A0}Felgen, 3\u{00A0}Gutachten.");
});

it('says a refusal in the reset\'s own words, and undoes the last reset on request', function (): void {
    $mock = fakeReset();
    $mock->shouldReceive('reset')->andThrow(new ResetRefused('In dieser Datenbank stehen echte Zahlungen. Sie wird nicht zurückgesetzt.'));
    $mock->shouldReceive('undo')->once()->andReturn(['id' => 'x', 'level' => ResetLevel::Shop, 'files' => ['restored' => 64, 'failed' => 0]]);

    asResetAdmin()->from(RESET_URL)->post(RESET_URL, ['level' => 'shop', 'confirmation' => TestReset::WORD])
        ->assertRedirect(RESET_URL)
        ->assertSessionHas('toast', 'In dieser Datenbank stehen echte Zahlungen. Sie wird nicht zurückgesetzt.');

    asResetAdmin()->from(RESET_URL)->post(RESET_URL.'/rueckgaengig')
        ->assertRedirect(RESET_URL)
        ->assertSessionHas('toast', 'Rückgängig gemacht: Der Stand vor dem Zurücksetzen („Shopdaten“) ist wieder da.');

    asResetAdmin('accountant')->post(RESET_URL.'/rueckgaengig')->assertForbidden();
});

it('is on the rail for the Super-Admin in a test environment only', function (): void {
    $hrefs = static fn (AdminUser $user): array => collect(app(AdminNavigation::class)->for($user))->flatMap(fn (array $g) => array_column($g['pages'], 'href'))->all();

    expect($hrefs(resetAdmin()))->toContain(RESET_URL)
        ->and($hrefs(resetAdmin('catalogue-manager')))->not->toContain(RESET_URL)
        ->and(app(AdminNavigation::class)->breadcrumbs(app(AdminNavigation::class)->for(resetAdmin()), RESET_URL))
        ->toBe([['label' => 'System', 'href' => null], ['label' => 'Zurücksetzen', 'href' => null]]);

    app()->detectEnvironment(static fn (): string => 'production');

    expect($hrefs(resetAdmin()))->not->toContain(RESET_URL)
        ->and(resetAdmin()->can('view', TestReset::class))->toBeFalse();

    app()->detectEnvironment(static fn (): string => 'testing');
});

it('fails the preflight in production while the page is a route', function (): void {
    expect(Route::has('admin.zuruecksetzen.show'))->toBeTrue();

    app()->detectEnvironment(static fn (): string => 'production');

    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('im Live-Shop erreichbar')
        ->assertFailed();

    app()->detectEnvironment(static fn (): string => 'testing');
});
