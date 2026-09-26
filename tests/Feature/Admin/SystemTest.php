<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Services\Admin\QuickActions;
use App\Services\Admin\SystemHealth;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * The rail's foot, server half: the health sentence and the page behind it, and what „Neu“ offers.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    Cache::flush();
});

function systemAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function failJobRow(): void
{
    DB::table('failed_jobs')->insert([
        'uuid' => (string) str()->uuid(),
        'connection' => 'database',
        'queue' => 'default',
        'payload' => '{}',
        'exception' => 'x',
        'failed_at' => now(),
    ]);
}

describe('the health sentence', function (): void {
    it('says all is well when it is', function (): void {
        $report = app(SystemHealth::class)->report();

        expect($report['state'])->toBe('ok')
            ->and($report['sentence'])->toBe('Alles in Ordnung')
            ->and(array_column($report['checks'], 'key'))->toBe(['maintenance', 'failed_jobs', 'queue', 'mail', 'storage']);
    });

    it('names failed jobs, counted, as a warning', function (): void {
        failJobRow();
        failJobRow();
        failJobRow();

        expect(app(SystemHealth::class)->report())->toMatchArray(['state' => 'warn', 'sentence' => '3 Jobs fehlgeschlagen']);
    });

    it('says the queue stands when its oldest job has waited past the limit', function (): void {
        DB::table('jobs')->insert([
            'queue' => 'default',
            'payload' => '{}',
            'attempts' => 0,
            'available_at' => now()->subMinutes(40)->getTimestamp(),
            'created_at' => now()->subMinutes(40)->getTimestamp(),
        ]);

        expect(app(SystemHealth::class)->report()['sentence'])->toBe('Warteschlange steht seit 40 Minuten');

        DB::table('jobs')->update(['created_at' => now()->subHours(9)->getTimestamp()]);
        expect(app(SystemHealth::class)->report()['sentence'])->toBe('Warteschlange steht seit 9 Stunden');

        DB::table('jobs')->update(['created_at' => now()->subDays(3)->getTimestamp()]);
        expect(app(SystemHealth::class)->report()['sentence'])->toBe('Warteschlange steht seit 3 Tagen');
    });

    it('puts maintenance mode above everything else', function (): void {
        failJobRow();
        $this->app->maintenanceMode()->activate([]);

        try {
            expect(app(SystemHealth::class)->report())->toMatchArray(['state' => 'bad', 'sentence' => 'Shop im Wartungsmodus']);
        } finally {
            $this->app->maintenanceMode()->deactivate();
        }
    });
});

describe('where it is shown', function (): void {
    it('rides in every admin page, linked to System only for a role that may open it', function (): void {
        $this->actingAs(systemAdmin(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('admin.health.sentence', 'Alles in Ordnung')
                ->where('admin.health.href', '/admin/system'));

        $this->actingAs(systemAdmin('content-editor'), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('admin.health.state', 'ok')
                ->where('admin.health.href', null));
    });

    it('answers the rail\'s poll for every signed-in person, with the sentence and nothing more', function (): void {
        failJobRow();

        // Checked before signing in: the session persists across requests in one test.
        $this->getJson('/admin/system/puls')->assertUnauthorized();

        $this->actingAs(systemAdmin('content-editor'), 'admin')->getJson('/admin/system/puls')
            ->assertOk()
            ->assertExactJson(['state' => 'warn', 'sentence' => '1 Job fehlgeschlagen']);
    });

    it('opens System › Zustand with every check for the settings role and refuses the others', function (): void {
        $this->actingAs(systemAdmin(), 'admin')->get('/admin/system')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/System/Index')
                ->has('report.checks', 5)
                ->where('report.sentence', 'Alles in Ordnung'));

        $this->actingAs(systemAdmin('content-editor'), 'admin')->get('/admin/system')->assertForbidden();
    });
});

describe('Neu', function (): void {
    it('offers each role what it may create, where the creating page exists', function (string $role, array $keys): void {
        expect(array_column(app(QuickActions::class)->for(systemAdmin($role)), 'key'))->toBe($keys);
    })->with([
        ['super-admin', ['ratgeber', 'person']],
        ['content-editor', ['ratgeber']],
        ['order-manager', []],
    ]);

    it('rides in every admin page', function (): void {
        $this->actingAs(systemAdmin('content-editor'), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('admin.quickActions.0.href', '/admin/seiten?neu=1')
                ->has('admin.quickActions', 1));
    });

    it('lands on a page that opens', function (): void {
        foreach (app(QuickActions::class)->for(systemAdmin()) as $action) {
            $this->actingAs(systemAdmin(), 'admin')->get($action['href'])->assertOk();
        }
    });
});
