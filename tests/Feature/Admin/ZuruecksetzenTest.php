<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Services\Admin\AdminNavigation;
use App\Services\Reset\ResetLevel;
use App\Services\Reset\ResetOrigin;
use App\Services\Reset\ResetRefused;
use App\Services\Reset\TestEnvironment;
use App\Services\Reset\TestReset;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;
use Mockery\MockInterface;
use Tests\TestCase;

/*
 * System › Testumgebung zurücksetzen as a page: the Super-Admin alone, behind the password once more; the word typed
 * before anything happens, checked on the server too; the reset and the undo handed to TestReset (whose own work is
 * TestResetTest's) with the screen as their origin, and its refusals said in its words. Wherever the reset is not
 * available — production, a server without RIMIFY_RESET_ERLAUBT=true, the live shop's database — the address answers
 * 404, never a 403: it does not say there is something behind it (the reset brief of 05.10.2026, §3.2).
 */

const RESET_URL = '/admin/system/zuruecksetzen';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['rimify.reset.allowed' => true]);
});

afterEach(function (): void {
    app()->detectEnvironment(static fn (): string => 'testing');
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

/** Every way to ask the page: a guest, a role that may not, the Super-Admin — each GET and both POSTs. */
function resetRequests(): array
{
    return [
        fn () => test()->get(RESET_URL),
        fn () => test()->post(RESET_URL, ['level' => 'shop', 'confirmation' => TestEnvironment::WORD]),
        fn () => asResetAdmin('accountant')->get(RESET_URL),
        fn () => asResetAdmin()->get(RESET_URL),
        fn () => asResetAdmin()->post(RESET_URL, ['level' => 'shop', 'confirmation' => TestEnvironment::WORD]),
        fn () => asResetAdmin()->post(RESET_URL.'/rueckgaengig'),
    ];
}

it('is the Super-Admin\'s alone, asks for the password first, and counts what each level would take', function (): void {
    $mock = fakeReset();
    $mock->shouldNotReceive('reset', 'undo');

    // Every other role: the 404 an unknown address gets, never a 403 — and never asked for the password first (the
    // operator's brief of 05.10.2026, §0).
    foreach (DB::table('roles')->where('name', '<>', 'super-admin')->pluck('name') as $role) {
        $user = AdminUser::factory()->create();
        $user->assignRole($role);

        $this->actingAs($user, 'admin')->get(RESET_URL)->assertNotFound();
        $this->actingAs($user, 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get(RESET_URL)->assertNotFound();
        $this->actingAs($user, 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
            ->post(RESET_URL, ['level' => 'shop', 'confirmation' => TestEnvironment::WORD])->assertNotFound();
        $this->actingAs($user, 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
            ->post(RESET_URL.'/rueckgaengig')->assertNotFound();
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

it('answers 404, never 403, wherever the reset is not available — in production first of all', function (): void {
    $mock = fakeReset();
    $mock->shouldNotReceive('reset', 'undo');

    $notFound = static function (): void {
        foreach (resetRequests() as $request) {
            $request()->assertNotFound();
        }
    };

    // Production: for everyone, the Super-Admin in sudo mode included — and with the server's flag set.
    app()->detectEnvironment(static fn (): string => 'production');
    $notFound();
    expect(TestEnvironment::environmentAllows())->toBeFalse();
    app()->detectEnvironment(static fn (): string => 'testing');

    // A test environment without the server's yes.
    config(['rimify.reset.allowed' => false]);
    $notFound();
    config(['rimify.reset.allowed' => true]);

    // A test server pointed at the live shop's database.
    DB::table('settings')->where('key', TestEnvironment::MARKER)->update(['value' => json_encode('production')]);
    $notFound();
    DB::table('settings')->where('key', TestEnvironment::MARKER)->update(['value' => json_encode('testing')]);

    // Where it is available the Super-Admin sees it — the 404s above are the reset's — and every other role still gets
    // a 404 of its own.
    asResetAdmin()->get(RESET_URL)->assertOk();
    asResetAdmin('accountant')->get(RESET_URL)->assertNotFound();
});

it('resets nothing without the word, and hands the level, the person and the screen as origin to the reset with it', function (): void {
    $mock = fakeReset();
    $mock->shouldNotReceive('reset');

    asResetAdmin()->from(RESET_URL)->post(RESET_URL, ['level' => 'shop', 'confirmation' => 'zurücksetzen bitte'])
        ->assertRedirect(RESET_URL)
        ->assertSessionHasErrors(['confirmation' => 'Tippe genau „ZURÜCKSETZEN“, um zu bestätigen.']);
    asResetAdmin()->from(RESET_URL)->post(RESET_URL, ['level' => 'everything', 'confirmation' => TestEnvironment::WORD])
        ->assertSessionHasErrors('level');

    $fresh = fakeReset();
    $fresh->shouldReceive('reset')->once()
        ->withArgs(fn (ResetLevel $level, AdminUser $by, ResetOrigin $origin): bool => $level === ResetLevel::Shop && $by->email === 'super-admin@rimify.test'
            && $origin->via === 'System › Zurücksetzen' && $origin->refusal() === null)
        ->andReturn(['id' => 'x', 'level' => ResetLevel::Shop, 'counts' => [['label' => 'Felgen', 'count' => 12], ['label' => 'Gutachten', 'count' => 3]], 'files' => ['images' => 61, 'pdfs' => 3, 'failed' => 0]]);

    asResetAdmin()->from(RESET_URL)->post(RESET_URL, ['level' => 'shop', 'confirmation' => ' ZURÜCKSETZEN '])
        ->assertRedirect(RESET_URL)
        ->assertSessionHas('toast', "Testumgebung zurückgesetzt („Shopdaten“). Entfernt: 12\u{00A0}Felgen, 3\u{00A0}Gutachten.");
});

it('says a refusal in the reset\'s own words, and undoes the last reset on request', function (): void {
    $mock = fakeReset();
    $mock->shouldReceive('reset')->andThrow(new ResetRefused('In dieser Datenbank stehen echte Zahlungen. Sie wird nicht zurückgesetzt.'));
    $mock->shouldReceive('undo')->once()->withArgs(fn (AdminUser $by, ResetOrigin $origin): bool => $origin->refusal() === null)
        ->andReturn(['id' => 'x', 'level' => ResetLevel::Shop, 'files' => ['restored' => 64, 'failed' => 0]]);

    asResetAdmin()->from(RESET_URL)->post(RESET_URL, ['level' => 'shop', 'confirmation' => TestEnvironment::WORD])
        ->assertRedirect(RESET_URL)
        ->assertSessionHas('toast', 'In dieser Datenbank stehen echte Zahlungen. Sie wird nicht zurückgesetzt.');

    asResetAdmin()->from(RESET_URL)->post(RESET_URL.'/rueckgaengig')
        ->assertRedirect(RESET_URL)
        ->assertSessionHas('toast', 'Rückgängig gemacht: Der Stand vor dem Zurücksetzen („Shopdaten“) ist wieder da.');

    asResetAdmin('accountant')->post(RESET_URL.'/rueckgaengig')->assertNotFound();
});

it('shows how long the last reset can still be undone, and once it cannot, says why and offers no button', function (): void {
    $mock = fakeReset();
    $mock->shouldReceive('last')->andReturn([
        'id' => '20261004-175904-shop', 'level' => 'shop', 'label' => 'Shopdaten', 'at' => '2026-10-04T17:59:04+00:00',
        'atText' => '04.10.2026, 19:59 Uhr', 'by' => 'Konsole (rimify:reset)', 'until' => '11.10.2026, 19:59 Uhr',
        'remaining' => null, 'undone' => false, 'undoneText' => null, 'undoable' => false,
        'reason' => 'Die 7 Tage sind vorbei: Dieses Zurücksetzen lässt sich nicht mehr rückgängig machen.',
    ]);

    asResetAdmin()->get(RESET_URL)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('last.undoable', false)
            ->where('last.remaining', null)
            ->where('last.reason', 'Die 7 Tage sind vorbei: Dieses Zurücksetzen lässt sich nicht mehr rückgängig machen.'));
});

it('is on the rail for the Super-Admin only where the reset is available', function (): void {
    $hrefs = static fn (AdminUser $user): array => collect(app(AdminNavigation::class)->for($user))->flatMap(fn (array $g) => array_column($g['pages'], 'href'))->all();

    expect($hrefs(resetAdmin()))->toContain(RESET_URL)
        ->and($hrefs(resetAdmin('catalogue-manager')))->not->toContain(RESET_URL)
        ->and(app(AdminNavigation::class)->breadcrumbs(app(AdminNavigation::class)->for(resetAdmin()), RESET_URL))
        ->toBe([['label' => 'System', 'href' => null], ['label' => 'Zurücksetzen', 'href' => null]]);

    config(['rimify.reset.allowed' => false]);
    expect($hrefs(resetAdmin()))->not->toContain(RESET_URL);
    config(['rimify.reset.allowed' => true]);

    app()->detectEnvironment(static fn (): string => 'production');

    expect($hrefs(resetAdmin()))->not->toContain(RESET_URL)
        ->and(resetAdmin()->can('view', TestEnvironment::class))->toBeFalse();
});

it('fails the preflight in production while the page is a route, the flag is on, or the database is not marked live', function (): void {
    expect(Route::has('admin.zuruecksetzen.show'))->toBeTrue();

    app()->detectEnvironment(static fn (): string => 'production');

    // The suite's database was migrated as a test database, and the flag is on: three faults, named together on the
    // row (one expected text per line of output).
    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('im Live-Shop erreichbar – die Routen dürfen hier nicht registriert sein (Routen-Cache neu bauen: php artisan optimize); '
            .'RIMIFY_RESET_ERLAUBT=true steht in der Umgebung des Live-Shops – herausnehmen; '
            .'die Datenbank nennt sich nicht die des Live-Shops (datenbank_umgebung: testing)')
        ->assertFailed();
});
