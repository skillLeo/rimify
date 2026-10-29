<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Services\Admin\QuickActions;
use App\Services\Admin\SystemHealth;
use App\Support\ScheduleBeat;
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

/** A job waiting in the queue for `$minutes`, nobody working it. */
function stuckJob(int $minutes): void
{
    DB::table('jobs')->insert([
        'queue' => 'default',
        'payload' => '{}',
        'attempts' => 0,
        'available_at' => now()->subMinutes($minutes)->getTimestamp(),
        'created_at' => now()->subMinutes($minutes)->getTimestamp(),
    ]);
}

describe('the health sentence', function (): void {
    it('says all is well when it is', function (): void {
        $report = app(SystemHealth::class)->report();

        expect($report['state'])->toBe('ok')
            ->and($report['sentence'])->toBe('Alles in Ordnung')
            ->and(array_column($report['checks'], 'key'))->toBe(['maintenance', 'failed_jobs', 'queue', 'schedule', 'mail', 'storage', 'invoices', 'ssr']);
    });

    it('turns amber once the scheduler has been silent for an hour, naming what that costs', function (): void {
        app()['env'] = 'staging';

        try {
            ScheduleBeat::record();
            $this->travel(59)->minutes();
            expect(app(SystemHealth::class)->report())->toMatchArray(['state' => 'ok', 'urgent' => null]);

            $this->travel(71)->minutes();
            $report = app(SystemHealth::class)->report();
            $sentence = 'Der Zeitplan ist seit 2 Stunden nicht mehr gelaufen: Unbezahlte Bestellungen verfallen nicht, und ihre Ware bleibt reserviert.';

            expect($report)->toMatchArray(['state' => 'warn', 'sentence' => $sentence, 'label' => 'Zeitplan läuft nicht', 'count' => '2 Std'])
                ->and(collect($report['checks'])->firstWhere('key', 'schedule'))->toMatchArray(['state' => 'warn', 'sentence' => $sentence])
                ->and($report['urgent'])->toBe(['key' => 'schedule', 'sentence' => $sentence]);

            Cache::flush();
            $this->actingAs(systemAdmin('content-editor'), 'admin')->get('/admin')
                ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.health.banner.key', 'schedule'));
        } finally {
            app()['env'] = 'testing';
        }
    });

    it('says at once on the live shop and the preview when the scheduler has never run, and stays quiet elsewhere', function (): void {
        expect(collect(app(SystemHealth::class)->report()['checks'])->firstWhere('key', 'schedule'))
            ->toMatchArray(['state' => 'ok', 'sentence' => 'In dieser Umgebung läuft kein Zeitplan.']);

        app()['env'] = 'production';

        try {
            expect(app(SystemHealth::class)->report()['urgent'])->toBe([
                'key' => 'schedule',
                'sentence' => 'Der Zeitplan ist noch nie gelaufen: Unbezahlte Bestellungen verfallen nicht, und ihre Ware bleibt reserviert.',
            ]);
        } finally {
            app()['env'] = 'testing';
        }
    });

    it('names failed jobs, counted, as a warning', function (): void {
        failJobRow();
        failJobRow();
        failJobRow();

        expect(app(SystemHealth::class)->report())->toMatchArray(['state' => 'warn', 'sentence' => '3 Hintergrundaufgaben fehlgeschlagen']);
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

    it('puts maintenance mode above everything else, and calls it urgent', function (): void {
        failJobRow();
        // In this process's memory, never the shared `storage/framework/down` file: under the parallel run that file put
        // every other process's requests in maintenance for as long as this test held it (a 503 in an unrelated test).
        config(['app.maintenance.driver' => 'cache', 'app.maintenance.store' => 'array']);
        $this->app->maintenanceMode()->activate([]);

        try {
            $report = app(SystemHealth::class)->report();

            expect($report)->toMatchArray(['state' => 'bad', 'sentence' => 'Shop im Wartungsmodus', 'label' => 'Wartungsmodus', 'count' => null])
                ->and($report['urgent']['key'] ?? null)->toBe('maintenance');
        } finally {
            $this->app->maintenanceMode()->deactivate();
        }
    });

    it('gives the rail a short line: the label, and the count beside it', function (): void {
        expect(app(SystemHealth::class)->report())->toMatchArray(['label' => '', 'count' => null, 'urgent' => null]);

        failJobRow();
        failJobRow();
        Cache::flush();
        expect(app(SystemHealth::class)->report())->toMatchArray(['label' => 'Aufgaben fehlgeschlagen', 'count' => '2', 'urgent' => null]);
    });

    it('calls a queue urgent once it has stood for an hour, not before', function (): void {
        stuckJob(40);
        $report = app(SystemHealth::class)->report();

        expect($report)->toMatchArray(['label' => 'Warteschlange stockt', 'count' => '40 Min', 'urgent' => null]);

        DB::table('jobs')->update(['created_at' => now()->subHours(12)->getTimestamp()]);
        $report = app(SystemHealth::class)->report();

        expect($report['count'])->toBe('12 Std')
            ->and($report['urgent'])->toBe([
                'key' => 'queue',
                'sentence' => 'Die Warteschlange steht seit 12 Stunden still: E-Mails und andere Hintergrundaufgaben bleiben liegen.',
            ]);
    });
});

describe('the banner', function (): void {
    it('rides on every page while the queue is dead, until this person asks to be reminded later', function (): void {
        stuckJob(120);
        $admin = systemAdmin();

        $this->actingAs($admin, 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.health.banner.key', 'queue'));

        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['snooze' => 'queue'])->assertNoContent();

        Cache::flush();
        $this->actingAs($admin->refresh(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('admin.health.banner', null)
                // The rail's line keeps saying it all the while: a reminder, not a dismissal.
                ->where('admin.health.label', 'Warteschlange stockt'));

        // Eight hours on, it is back.
        $this->travel(8)->hours();
        $this->travel(1)->minutes();
        Cache::flush();
        $this->actingAs($admin->refresh(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.health.banner.key', 'queue'));
    });

    it('keeps another person\'s reminder, and a reminder for another problem, from hiding it', function (): void {
        stuckJob(120);

        $this->actingAs(systemAdmin('compliance-editor'), 'admin')->patchJson('/admin/ansicht', ['snooze' => 'queue'])->assertNoContent();
        $this->actingAs(systemAdmin(), 'admin')->patchJson('/admin/ansicht', ['snooze' => 'maintenance'])->assertNoContent();

        Cache::flush();
        $this->actingAs(systemAdmin()->refresh(), 'admin')->get('/admin')
            ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.health.banner.key', 'queue'));
    });

    it('takes only the three problems a banner is shown for, and still saves the rail alone', function (): void {
        $admin = systemAdmin();

        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['snooze' => 'everything'])->assertUnprocessable();
        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['snooze' => 'schedule'])->assertNoContent();
        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', [])->assertUnprocessable();
        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['rail' => 'collapsed'])->assertNoContent();

        expect($admin->refresh()->preferences['rail'] ?? null)->toBe('collapsed')
            ->and($admin->preferences['healthSnooze']['key'] ?? null)->toBe('schedule');
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
            ->assertExactJson(['state' => 'warn', 'sentence' => '1 Hintergrundaufgabe fehlgeschlagen', 'label' => 'Aufgaben fehlgeschlagen', 'count' => '1']);
    });

    it('opens System › Zustand with every check for the settings role and refuses the others', function (): void {
        $this->actingAs(systemAdmin(), 'admin')->get('/admin/system')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/System/Index')
                ->has('report.checks', 8)
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
                // Inhalte › Ratgeber makes the articles since his admin item 12 (D-351).
                ->where('admin.quickActions.0.href', '/admin/ratgeber?neu=1')
                ->where('admin.quickActions.0.label', 'Ratgeber-Artikel anlegen')
                ->has('admin.quickActions', 1));
    });

    it('lands on a page that opens', function (): void {
        foreach (app(QuickActions::class)->for(systemAdmin()) as $action) {
            $this->actingAs(systemAdmin(), 'admin')->get($action['href'])->assertOk();
        }
    });
});
