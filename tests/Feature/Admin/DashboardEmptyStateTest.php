<?php

declare(strict_types=1);

use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * The Übersicht on a fresh database — a shop's first day, and every future quiet week: no card holds
 * space for what it does not have, every figure is a figure (zero included) with its one line, and
 * each chart and list says in a sentence what will appear (DashboardEmptyState.test.ts renders it).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

it('opens a fresh shop with zeros that are figures, one line under each, and nothing to draw', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $this->actingAs($admin, 'admin')->get('/admin?zeitraum=30')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Uebersicht/Index')
            ->where('demo', false)
            ->where('kpis.0.key', 'umsatz')
            ->where('kpis.0.value', 0)
            ->where('kpis.0.sub.text', 'Vorzeitraum ohne bezahlte Bestellung')
            ->where('kpis.1.value', 0)
            // An average of nothing is no figure: a dash, and why.
            ->where('kpis.2.value', null)
            ->where('kpis.2.sub', ['text' => 'noch keine bezahlte Bestellung', 'kind' => 'reason', 'direction' => null])
            ->where('kpis.3.value', 0)
            ->where('kpis.3.sub.text', 'alles versendet')
            ->where('recentOrders', [])
            ->where('todo', [])
            ->where('today', [])
            ->where('activity', [])
            ->loadDeferredProps(fn (AssertableInertia $charts) => $charts
                ->where('charts.revenue', null)
                ->where('charts.verdicts', null)
                ->where('charts.topWheels', [])
                ->where('charts.demand.rows', [])
                ->where('charts.failed', [])));
});
