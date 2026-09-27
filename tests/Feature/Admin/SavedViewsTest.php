<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\SavedView;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * Gespeicherte Ansichten and the Spaltenwahl (docs/admin/rest-build-plan.md, step 2.2): a list's
 * filters under a name, the owner's alone or shared with a role that may open the list; the columns
 * a person wants, remembered on their account. Every write is refused on the server where the
 * policy says no (R-11).
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function viewsAdmin(string $role = 'order-manager'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function viewRoleId(string $name): int
{
    return (int) DB::table('roles')->where('name', $name)->where('guard_name', 'admin')->value('id');
}

/**
 * The Bestellungen page's views and columns for one person and query.
 *
 * @return array{views: array<string, mixed>, columns: array<string, mixed>}
 */
function listViews(string $query = '', string $role = 'order-manager'): array
{
    $props = [];

    test()->actingAs(viewsAdmin($role), 'admin')->get('/admin/bestellungen'.$query)
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$props): void {
            $props = $page->toArray()['props'];
        });

    return ['views' => $props['views'], 'columns' => $props['columns']];
}

/** @param  array<string, string>  $query */
function aView(string $role, string $name, array $query = ['status' => 'bezahlt'], ?string $sharedWith = null): SavedView
{
    return SavedView::query()->create([
        'admin_user_id' => viewsAdmin($role)->id,
        'list' => 'bestellungen',
        'name' => $name,
        'query' => $query,
        'role_id' => $sharedWith === null ? null : viewRoleId($sharedWith),
    ]);
}

describe('saving a view', function (): void {
    it('keeps the filters on screen under a name and opens them, marked as the view', function (): void {
        $this->actingAs(viewsAdmin(), 'admin')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Bezahlt, ohne Versand', 'query' => ['status' => 'bezahlt', 'sort' => 'summe', 'richtung' => 'ab']])
            ->assertRedirect()
            ->assertSessionHas('toast', 'Ansicht „Bezahlt, ohne Versand“ gespeichert.');

        $view = SavedView::query()->sole();

        expect($view->query)->toEqual(['richtung' => 'ab', 'sort' => 'summe', 'status' => 'bezahlt'])
            ->and($view->role_id)->toBeNull();

        $props = listViews("?status=bezahlt&sort=summe&richtung=ab&ansicht={$view->id}");

        expect($props['views']['active'])->toBe($view->id)
            ->and($props['views']['modified'])->toBeFalse()
            ->and($props['views']['items'][0])->toMatchArray(['name' => 'Bezahlt, ohne Versand', 'mine' => true, 'sharedWith' => null])
            ->and($props['views']['items'][0]['href'])->toBe("/admin/bestellungen?richtung=ab&sort=summe&status=bezahlt&ansicht={$view->id}");
    });

    it('says the view has changed once the filters on screen are no longer its own', function (): void {
        $view = aView('order-manager', 'Bezahlt');

        expect(listViews("?status=offen&ansicht={$view->id}")['views'])->toMatchArray(['active' => $view->id, 'modified' => true]);
    });

    it('keeps nothing but the list\'s own filters, and refuses a name used twice or none at all', function (): void {
        aView('order-manager', 'Bezahlt');

        $this->actingAs(viewsAdmin(), 'admin')->from('/admin/bestellungen')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Bezahlt', 'query' => []])
            ->assertSessionHasErrors(['name' => 'Eine Ansicht mit diesem Namen hast du schon. Wähl bitte einen anderen.']);

        $this->actingAs(viewsAdmin(), 'admin')->from('/admin/bestellungen')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => '', 'query' => []])
            ->assertSessionHasErrors('name');

        $this->actingAs(viewsAdmin(), 'admin')->from('/admin/bestellungen')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Fremd', 'query' => ['admin_user_id' => '1']])
            ->assertSessionHasErrors('query');

        expect(SavedView::query()->count())->toBe(1);
    });

    it('keeps only filters the list itself takes — in the list\'s own words where it would not', function (): void {
        $this->actingAs(viewsAdmin(), 'admin')->from('/admin/bestellungen')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Kaputt', 'query' => ['status' => 'gibt-es-nicht']])
            ->assertSessionHasErrors(['query' => 'Diese Filter lassen sich nicht speichern. Diesen Status gibt es nicht. Wähl bitte einen aus der Liste.']);

        $this->actingAs(viewsAdmin(), 'admin')->from('/admin/bestellungen')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Kaputt', 'query' => ['min' => 'zwölf']])
            ->assertSessionHasErrors('query');

        expect(SavedView::query()->count())->toBe(0);
    });

    it('tells names apart letter for letter — „Zählung“ is not „Zahlung“', function (): void {
        aView('order-manager', 'Zahlung');

        $this->actingAs(viewsAdmin(), 'admin')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Zählung', 'query' => []])
            ->assertSessionHasNoErrors();

        expect(SavedView::query()->count())->toBe(2);
    });

    it('stops at 30 views per person and list', function (): void {
        foreach (range(1, SavedView::MAX_PER_LIST) as $n) {
            aView('order-manager', "Ansicht {$n}");
        }

        $this->actingAs(viewsAdmin(), 'admin')->from('/admin/bestellungen')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Eine zu viel', 'query' => []])
            ->assertSessionHasErrors('name');

        expect(listViews()['views']['canSave'])->toBeFalse();
    });

    it('is refused for a role that may not open the list, and for a list that has no views', function (): void {
        $this->actingAs(viewsAdmin('content-editor'), 'admin')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Heimlich', 'query' => []])
            ->assertForbidden();

        $this->actingAs(viewsAdmin(), 'admin')
            ->post('/admin/ansichten', ['list' => 'kunden', 'name' => 'Noch nicht', 'query' => []])
            ->assertForbidden();

        expect(SavedView::query()->count())->toBe(0);
    });
});

describe('sharing a view', function (): void {
    it('shares with a role that may open the list, and the role sees it — never who does not hold it', function (): void {
        $view = aView('order-manager', 'Große Bestellungen', ['min' => '1.000'], sharedWith: 'support-agent');

        $support = listViews('', 'support-agent')['views']['items'];

        expect($support)->toHaveCount(1)
            ->and($support[0])->toMatchArray(['id' => $view->id, 'mine' => false, 'owner' => viewsAdmin()->name]);

        expect(listViews('', 'accountant')['views']['items'])->toBe([]);
    });

    it('offers only the roles that may open the list', function (): void {
        $labels = array_column(listViews()['views']['shareOptions'], 'id');

        expect($labels)->toContain(viewRoleId('support-agent'))
            ->and($labels)->not->toContain(viewRoleId('content-editor'));

        $this->actingAs(viewsAdmin(), 'admin')->from('/admin/bestellungen')
            ->post('/admin/ansichten', ['list' => 'bestellungen', 'name' => 'Für Redaktion', 'query' => [], 'role_id' => viewRoleId('content-editor')])
            ->assertSessionHasErrors('role_id');
    });

    it('keeps the view its owner\'s when the role it was shared with is deleted', function (): void {
        $view = aView('order-manager', 'Geteilt', sharedWith: 'support-agent');

        DB::table('roles')->where('id', viewRoleId('support-agent'))->delete();

        expect($view->fresh()?->role_id)->toBeNull()
            ->and($view->fresh()?->trashed())->toBeFalse();
    });
});

describe('changing and deleting a view', function (): void {
    it('lets its owner rename it, share it and save the filters on screen into it', function (): void {
        $view = aView('order-manager', 'Alt');

        $this->actingAs(viewsAdmin(), 'admin')->patch("/admin/ansichten/{$view->id}", ['name' => 'Neu'])
            ->assertSessionHas('toast', 'Ansicht in „Neu“ umbenannt.');
        $label = (string) DB::table('roles')->where('id', viewRoleId('accountant'))->value('label_de');
        $this->actingAs(viewsAdmin(), 'admin')->patch("/admin/ansichten/{$view->id}", ['role_id' => viewRoleId('accountant')])
            ->assertSessionHas('toast', "Ansicht „Neu“ mit der Rolle „{$label}“ geteilt.");
        $this->actingAs(viewsAdmin(), 'admin')->patch("/admin/ansichten/{$view->id}", ['role_id' => null])
            ->assertSessionHas('toast', 'Ansicht „Neu“ ist nicht mehr geteilt.');
        $this->actingAs(viewsAdmin(), 'admin')->patch("/admin/ansichten/{$view->id}", ['role_id' => viewRoleId('accountant')]);
        $this->actingAs(viewsAdmin(), 'admin')->patch("/admin/ansichten/{$view->id}", ['query' => ['status' => 'offen']])
            ->assertRedirect("/admin/bestellungen?status=offen&ansicht={$view->id}");

        expect($view->fresh()?->only(['name', 'query', 'role_id']))->toEqual(['name' => 'Neu', 'query' => ['status' => 'offen'], 'role_id' => viewRoleId('accountant')]);
    });

    it('lets nobody else change or delete it — not even the role it is shared with', function (): void {
        $view = aView('order-manager', 'Meins', sharedWith: 'support-agent');

        $this->actingAs(viewsAdmin('support-agent'), 'admin')->patch("/admin/ansichten/{$view->id}", ['name' => 'Übernommen'])->assertForbidden();
        $this->actingAs(viewsAdmin('support-agent'), 'admin')->delete("/admin/ansichten/{$view->id}")->assertForbidden();
        $this->actingAs(viewsAdmin('super-admin'), 'admin')->delete("/admin/ansichten/{$view->id}")->assertForbidden();

        expect($view->fresh()?->name)->toBe('Meins')
            ->and($view->fresh()?->trashed())->toBeFalse();
    });

    it('deletes it so it can be brought back, and brings it back', function (): void {
        $view = aView('order-manager', 'Weg');

        $this->actingAs(viewsAdmin(), 'admin')->delete("/admin/ansichten/{$view->id}")->assertRedirect();
        expect(SavedView::query()->count())->toBe(0)
            ->and(listViews()['views']['items'])->toBe([]);

        $this->actingAs(viewsAdmin(), 'admin')->post("/admin/ansichten/{$view->id}/wiederherstellen")
            ->assertSessionHas('toast', 'Ansicht „Weg“ ist wieder da.');
        expect(SavedView::query()->count())->toBe(1);
    });

    it('brings a view back under a free name when its own was taken meanwhile', function (): void {
        $old = aView('order-manager', 'Doppelt');
        $old->delete();
        aView('order-manager', 'Doppelt');

        $this->actingAs(viewsAdmin(), 'admin')->post("/admin/ansichten/{$old->id}/wiederherstellen")
            ->assertSessionHas('toast', 'Ansicht „Doppelt“ ist wieder da, jetzt als „Doppelt (2)“.');

        expect(SavedView::query()->orderBy('id')->pluck('name')->all())->toBe(['Doppelt (2)', 'Doppelt']);
    });

    it('says so when the link names a view that is gone, and applies its filters all the same', function (): void {
        $view = aView('order-manager', 'Weg');
        $view->delete();

        expect(listViews("?status=bezahlt&ansicht={$view->id}")['views'])->toMatchArray(['active' => null, 'missing' => true]);
        expect(listViews('?status=bezahlt')['views']['missing'])->toBeFalse();
    });

    it('does not let another person bring back a view they deleted nothing of', function (): void {
        $view = aView('order-manager', 'Weg');
        $view->delete();

        $this->actingAs(viewsAdmin('accountant'), 'admin')->post("/admin/ansichten/{$view->id}/wiederherstellen")->assertForbidden();

        expect(SavedView::withTrashed()->find($view->id)?->trashed())->toBeTrue();
    });
});

describe('a view over time', function (): void {
    it('keeps „die letzten 7 Tage“ as that, not as the dates it meant the day it was saved', function (): void {
        $this->travelTo(now()->setTimezone('UTC')->setDate(2026, 9, 26)->setTime(10, 0));
        $view = aView('order-manager', 'Letzte Woche', ['zeitraum' => '7']);

        $filters = function () use ($view): array {
            $props = [];
            test()->actingAs(viewsAdmin(), 'admin')->get("/admin/bestellungen?zeitraum=7&ansicht={$view->id}")
                ->assertInertia(function (AssertableInertia $page) use (&$props): void {
                    $props = $page->toArray()['props'];
                });

            return ['filters' => $props['filters'], 'modified' => $props['views']['modified']];
        };

        expect($filters())->toMatchArray(['modified' => false])
            ->and($filters()['filters'])->toMatchArray(['zeitraum' => '7', 'von' => '', 'bis' => '']);

        // A month on, the same view: still the last seven days, still the view unchanged.
        $this->travelTo(now()->addMonth());
        expect($filters())->toMatchArray(['modified' => false]);
    });

    it('stays open when the list refuses its filters, so its owner can still save over or delete it', function (): void {
        $view = aView('order-manager', 'Alt');

        $this->actingAs(viewsAdmin(), 'admin')
            ->get("/admin/bestellungen?status=gibt-es-nicht&ansicht={$view->id}")
            ->assertRedirect("/admin/bestellungen?ansicht={$view->id}");
    });
});

describe('the Spaltenwahl', function (): void {
    it('shows the list\'s default columns until a person chooses, then theirs, on any machine', function (): void {
        expect(listViews()['columns']['shown'])->toBe(['nummer', 'datum', 'kunde', 'summe', 'zahlung', 'versand']);

        $this->actingAs(viewsAdmin(), 'admin')
            ->patchJson('/admin/ansicht', ['list' => 'bestellungen', 'columns' => ['datum', 'fahrzeug', 'summe']])
            ->assertNoContent();

        // The number cannot be hidden; the columns keep the list's order, not the order sent.
        expect(listViews()['columns']['shown'])->toBe(['nummer', 'datum', 'fahrzeug', 'summe']);
        // Another person's choice is theirs alone.
        expect(listViews('', 'accountant')['columns']['shown'])->toBe(['nummer', 'datum', 'kunde', 'summe', 'zahlung', 'versand']);
    });

    it('takes only the list\'s own columns, and only from who may open the list', function (): void {
        $this->actingAs(viewsAdmin(), 'admin')
            ->patchJson('/admin/ansicht', ['list' => 'bestellungen', 'columns' => ['passwort']])
            ->assertUnprocessable();

        $this->actingAs(viewsAdmin('content-editor'), 'admin')
            ->patchJson('/admin/ansicht', ['list' => 'bestellungen', 'columns' => ['datum']])
            ->assertUnprocessable();

        expect(viewsAdmin('content-editor')->fresh()?->preferences['columns'] ?? null)->toBeNull();
    });

    it('keeps the rail\'s width when the columns are saved, and the columns when the rail is', function (): void {
        $admin = viewsAdmin();

        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['rail' => 'open', 'width' => 320])->assertNoContent();
        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['list' => 'bestellungen', 'columns' => ['datum']])->assertNoContent();
        $this->actingAs($admin, 'admin')->patchJson('/admin/ansicht', ['rail' => 'collapsed'])->assertNoContent();

        expect($admin->fresh()?->railWidth())->toBe(320)
            ->and($admin->fresh()?->preferences['columns']['bestellungen'] ?? null)->toBe(['nummer', 'datum']);
    });
});
