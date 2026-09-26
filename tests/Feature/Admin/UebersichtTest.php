<?php

declare(strict_types=1);

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Services\Admin\AdminNavigation;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * Übersicht: real figures, and only the figures of the areas a role may open. A number a role may
 * not see is not on the page at all, and a number that links goes to a list that opens.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

/**
 * @return array<string, mixed>
 */
function uebersichtProps(AdminUser $admin): array
{
    $props = [];

    test()->actingAs($admin, 'admin')->get('/admin')
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$props): void {
            $page->component('Admin/Uebersicht/Index');
            $props = $page->toArray()['props'];
        });

    return $props;
}

it('shows each role exactly the figures of the areas it may open', function (string $role): void {
    $admin = AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();

    $expected = [];

    if ($admin->may(PermissionModule::Reports, PermissionAction::View)) {
        $expected[] = 'revenue';
    }

    if ($admin->may(PermissionModule::Orders, PermissionAction::View)) {
        $expected[] = 'orders';
    }

    if ($admin->may(PermissionModule::Approvals, PermissionAction::View)) {
        array_push($expected, 'documents', 'fitments', 'conflicts');
    }

    if ($admin->may(PermissionModule::Vehicles, PermissionAction::View)) {
        $expected[] = 'review';
    }

    expect(array_column(uebersichtProps($admin)['tiles'], 'key'))->toBe($expected);
})->with(['super-admin', 'catalogue-manager', 'compliance-editor', 'order-manager', 'content-editor', 'support-agent', 'accountant']);

it('links a figure only to a list that opens, for every role', function (string $role): void {
    $admin = AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();

    foreach (uebersichtProps($admin)['tiles'] as $tile) {
        if ($tile['href'] !== null) {
            $this->actingAs($admin, 'admin')->get($tile['href'])->assertOk();
        }
    }
})->with(['super-admin', 'catalogue-manager', 'compliance-editor', 'order-manager', 'content-editor', 'support-agent', 'accountant']);

it('links every figure whose list is built, and says in one line what each counts', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    // The lists each figure comes from. A figure whose list is built must link to it; the rest wait.
    $lists = [
        'revenue' => '/admin/verkaeufe',
        'orders' => '/admin/bestellungen',
        'documents' => '/admin/gutachten',
        'fitments' => '/admin/abdeckung',
        'conflicts' => '/admin/konflikte',
        'review' => '/admin/fahrzeuge/pruefung',
    ];

    // A figure that counts part of its list opens the list filtered to exactly that part.
    $filters = ['orders' => '?status=offen'];

    foreach (uebersichtProps($admin)['tiles'] as $tile) {
        $built = in_array($lists[$tile['key']], AdminNavigation::BUILT, true);

        expect($tile['href'])->toBe($built ? $lists[$tile['key']].($filters[$tile['key']] ?? '') : null)
            ->and($tile['hint'])->toBeString()->not->toBe('')
            ->and($tile['hint'])->toEndWith('.');
    }
});

it('says when the figures were counted, in German and in Berlin time', function (): void {
    $this->travelTo(now()->setTimezone('UTC')->setDate(2026, 9, 26)->setTime(11, 40));

    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    expect(uebersichtProps($admin)['asOf'])->toBe("26.09.2026, 13:40\u{00A0}Uhr");
});
