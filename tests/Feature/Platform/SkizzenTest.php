<?php

declare(strict_types=1);

use App\Console\Commands\Preflight;
use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * The sketches of the Gutachten rework (the operator's brief of 01.11.2026, Phase 1): three pages of example data to click
 * through before anything is built. They open where they should, under the permission of the area they sketch; they read
 * the address and nothing else; they write nothing; and they exist in a test environment only — the preflight says NO-GO
 * on a live shop where one answers.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function sketchAdmin(string $role): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * Every statement run while the callback runs, and those of them that would change a row. The count of all comes back
 * too, so „no write" is never read off a listener that heard nothing (TEST-SMELLS §2).
 *
 * @return array{0: int, 1: list<string>}
 */
function sketchWrites(Closure $run): array
{
    $all = 0;
    $writes = [];

    DB::listen(static function ($query) use (&$all, &$writes): void {
        $all++;

        if (preg_match('/^\s*(insert|update|delete|replace)\b/i', $query->sql) === 1) {
            $writes[] = $query->sql;
        }
    });

    $run();

    return [$all, $writes];
}

it('has no Gutachten sketch any more: the five steps themselves took its place', function (): void {
    $this->actingAs(sketchAdmin('compliance-editor'), 'admin')->get('/admin/skizze/gutachten')->assertNotFound();
    expect(Route::has('admin.skizze.gutachten'))->toBeFalse();
});

it('opens a sketch at its start when the address names nothing it knows', function (): void {
    $this->get('/skizze/komplettraeder?schritt=0&ausfuehrung=..%2Fx')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('schritt', null)->where('ausfuehrung', null));
});

it('opens a sketch at its start for a value too long or shaped as a list, never sending the visitor away', function (): void {
    $this->actingAs(sketchAdmin('super-admin'), 'admin')
        ->get('/admin/skizze/reifen?modell[]=x')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('modell', null));

    $this->get('/skizze/komplettraeder?ausfuehrung='.str_repeat('a', 60))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->where('ausfuehrung', null));
});

it('keeps each admin sketch to the roles that may view the area it sketches', function (): void {
    $this->actingAs(sketchAdmin('content-editor'), 'admin')->get('/admin/skizze/reifen')->assertForbidden();

    $this->actingAs(sketchAdmin('catalogue-manager'), 'admin')
        ->get('/admin/skizze/reifen?modell=laufwerk-s1')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Admin/Skizze/Reifen')->where('modell', 'laufwerk-s1'));
});

it('sends somebody who is not signed in to the admin sign-in, not to a sketch', function (): void {
    $this->get('/admin/skizze/reifen')->assertRedirect('/admin/anmelden');
});

it('opens the shop sketches for anyone, with or without the example car', function (): void {
    // The product page's versions are built: its sketch is gone (the Gutachten rework, Phase 3).
    $this->get('/skizze/felge')->assertNotFound();
    expect(Route::has('skizze.felge'))->toBeFalse();

    $this->get('/skizze/komplettraeder?schritt=2&ausfuehrung=blue-18a')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('Skizze/Komplettraeder')->where('schritt', 2));
});

it('writes nothing, whichever sketch is opened', function (): void {
    $admin = sketchAdmin('super-admin');
    $this->actingAs($admin, 'admin');

    [$all, $writes] = sketchWrites(function (): void {
        $this->get('/admin/skizze/reifen')->assertOk();
        $this->get('/skizze/komplettraeder')->assertOk();
    });

    // The requests were heard — the signed-in admin is read on each — and none of them wrote.
    expect($all)->toBeGreaterThan(0)
        ->and($writes)->toBe([]);
});

it('registers the sketches in a test environment, and the preflight refuses a live shop that has them', function (): void {
    foreach (Preflight::SKETCH_ROUTES as $name) {
        expect(Route::has($name))->toBeTrue();
    }

    app()->detectEnvironment(static fn (): string => 'production');

    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('im Live-Shop erreichbar (skizze.komplettraeder, admin.skizze.reifen)')
        ->assertFailed();
});
