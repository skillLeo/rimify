<?php

declare(strict_types=1);

use App\Services\Reset\TestEnvironment;
use App\Services\Smoke\ResetScreenProbe;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;

/*
 * What rimify:smoke asserts about System › Zurücksetzen (the operator's brief of 05.10.2026, §0; GO-LIVE.md §4.4): the
 * page as every role meets it, through the app's own HTTP stack — 200 to a Super-Admin and 404 to every other role
 * where the reset is available, 404 to everyone elsewhere — and nothing of the probe's own accounts stays behind.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['rimify.reset.allowed' => true]);
});

afterEach(function (): void {
    app()->detectEnvironment(static fn (): string => 'testing');
});

/** @return array<string, int> */
function probeCounts(): array
{
    return [
        'admin_users' => DB::table('admin_users')->count(),
        'model_has_roles' => DB::table('model_has_roles')->count(),
        'audit_logs' => DB::table('audit_logs')->count(),
    ];
}

it('answers 200 to a Super-Admin and 404 to every other role where the reset is available — and leaves nothing', function (): void {
    $before = probeCounts();
    $statuses = app(ResetScreenProbe::class)->statuses();
    $roles = DB::table('roles')->where('guard_name', 'admin')->pluck('name')->all();

    expect(array_keys($statuses))->toEqualCanonicalizing($roles)
        ->and($statuses[ResetScreenProbe::SUPER_ADMIN])->toBe(200)
        ->and(array_unique(array_values(array_diff_key($statuses, [ResetScreenProbe::SUPER_ADMIN => true]))))->toBe([404])
        ->and(ResetScreenProbe::faults($statuses, true))->toBe([])
        ->and(probeCounts())->toBe($before);
});

it('answers 404 to everyone, the Super-Admin included, where the reset is not available', function (string $where): void {
    match ($where) {
        'production' => app()->detectEnvironment(static fn (): string => 'production'),
        'flag false' => config(['rimify.reset.allowed' => false]),
        'live database' => DB::table('settings')->where('key', TestEnvironment::MARKER)->update(['value' => json_encode('production')]),
    };

    $statuses = app(ResetScreenProbe::class)->statuses();

    expect(ResetScreenProbe::available())->toBeFalse()
        ->and(array_unique(array_values($statuses)))->toBe([404])
        ->and(ResetScreenProbe::faults($statuses, false))->toBe([]);
})->with(['production', 'flag false', 'live database']);

it('names every answer that is not the one the server must give', function (): void {
    expect(ResetScreenProbe::faults(['super-admin' => 302, 'warehouse' => 403, 'accountant' => 404], true))
        ->toBe(['Rolle „super-admin“ bekommt HTTP 302 statt 200', 'Rolle „warehouse“ bekommt HTTP 403 statt 404'])
        ->and(ResetScreenProbe::faults(['super-admin' => 200], false))->toBe(['Rolle „super-admin“ bekommt HTTP 200 statt 404'])
        ->and(ResetScreenProbe::faults([], true))->toBe(['keine Rolle in der Datenbank – die Seite lässt sich nicht prüfen']);
});
