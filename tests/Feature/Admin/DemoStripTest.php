<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Services\Demo\DemoTables;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * The rail's demo strip (the density brief §5): every admin page says so while demo rows exist —
 * „Demodaten aktiv · N Datensätze“ — and offers „entfernen“ only to who may (DemoDataPolicy, R-11);
 * the purge behind it takes exactly the demo rows and names who ran it in the Protokoll.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    DemoTables::forget();
});

function stripAdmin(string $role): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return array<string, mixed>|null */
function stripProp(string $role): ?array
{
    $demo = null;

    test()->actingAs(stripAdmin($role), 'admin')->get('/admin/bestellungen')
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$demo): void {
            $demo = $page->toArray()['props']['admin']['demo'] ?? null;
        });

    return $demo;
}

function stripPlant(int $n): void
{
    foreach (range(1, $n) as $i) {
        DB::table('customers')->insert(['email' => "demo{$i}@example.com", 'is_demo' => true, 'demo_ref' => "demo:customer:strip-{$i}", 'created_at' => now(), 'updated_at' => now()]);
    }

    DemoTables::forget();
}

it('says nothing while there are no demo rows', function (): void {
    expect(stripProp('super-admin'))->toBeNull();
});

it('tells everyone how many demo rows there are, and offers the purge only to who may', function (): void {
    stripPlant(3);

    expect(stripProp('super-admin'))->toBe(['rows' => 3, 'canPurge' => true])
        ->and(stripProp('order-manager'))->toBe(['rows' => 3, 'canPurge' => false]);

    // Not offered is not attempted: no denial is written for a strip nobody pressed.
    expect(AuditLog::query()->where('description', 'permission.denied')->count())->toBe(0);
});

it('refuses the purge to who may not, on the server — the rows stay', function (): void {
    stripPlant(2);

    $this->actingAs(stripAdmin('order-manager'), 'admin')->post('/admin/demodaten/entfernen')->assertForbidden();

    expect(DemoTables::total())->toBe(2);
});

it('takes the demo rows away for who may, says how many, and names them in the Protokoll', function (): void {
    stripPlant(2);
    $admin = stripAdmin('super-admin');

    $this->actingAs($admin, 'admin')->from('/admin')->post('/admin/demodaten/entfernen')
        ->assertRedirect('/admin')
        ->assertSessionHas('toast', 'Demodaten entfernt: 2 Datensätze.');

    $entry = AuditLog::query()->where('description', 'demo.purged')->sole();

    expect(DemoTables::total())->toBe(0)
        ->and(stripProp('super-admin'))->toBeNull()
        ->and($entry->causer_id)->toBe($admin->id)
        ->and($entry->actor_email)->toBe($admin->email)
        ->and($entry->properties['tables'])->toBe(['customers' => 2]);
});

it('keeps the page when the demo rows cannot be counted', function (): void {
    // Only the strip's counts fail (select count(*) as aggregate … where is_demo = ?).
    DB::connection()->beforeExecuting(function (string $sql): void {
        if (str_contains($sql, 'aggregate') && str_contains($sql, '`is_demo`')) {
            throw new RuntimeException('Lock wait timeout exceeded');
        }
    });

    expect(stripProp('super-admin'))->toBeNull();
});
