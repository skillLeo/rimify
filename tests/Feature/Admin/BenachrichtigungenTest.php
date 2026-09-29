<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\BenachrichtigungenController;
use App\Models\AdminUser;
use App\Notifications\AdminAlert;
use Database\Seeders\AccessSeeder;
use Illuminate\Notifications\DatabaseNotification;
use Inertia\Testing\AssertableInertia;

/**
 * The bell and the page behind it: a person's own alerts and their own choices, nobody else's.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function bellAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @param  array{route: string, params: array<string, int|string>}|null  $target */
function alertFor(AdminUser $user, string $title = 'Bestellung RMF-1 ist bezahlt.', ?array $target = null): DatabaseNotification
{
    $user->notifyNow(new AdminAlert('order_paid', $title, '1.425,00 €', $target));

    /** @var DatabaseNotification */
    return $user->notifications()->latest()->firstOrFail();
}

it('sends somebody who is not signed in to the sign-in', function (): void {
    $this->get('/admin/benachrichtigungen')->assertRedirect('/admin/anmelden');
    $this->get('/admin/benachrichtigungen/neueste')->assertRedirect('/admin/anmelden');
    $this->post('/admin/benachrichtigungen/gelesen')->assertRedirect('/admin/anmelden');
    $this->put('/admin/benachrichtigungen/einstellungen', ['kinds' => []])->assertRedirect('/admin/anmelden');
});

it('shows the reader their own alerts, newest first, and no one else\'s', function (): void {
    $me = bellAdmin();
    alertFor($me, 'Erste.');
    $this->travel(1)->minutes();
    alertFor($me, 'Zweite.');
    alertFor(bellAdmin('order-manager'), 'Nicht meine.');

    $this->actingAs($me, 'admin')->get('/admin/benachrichtigungen')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Benachrichtigungen/Index')
            ->where('counts', ['unread' => 2, 'all' => 2])
            ->where('items.0.title', 'Zweite.')
            ->where('items.1.title', 'Erste.')
            ->where('items.0.dayLabel', 'Heute')
            ->where('items.0.read', false)
            ->where('items.0.kindLabel', 'Bestellung bezahlt'));
});

it('shows only the unread ones when asked', function (): void {
    $me = bellAdmin();
    alertFor($me, 'Gelesen.')->markAsRead();
    alertFor($me, 'Offen.');

    $this->actingAs($me, 'admin')->get('/admin/benachrichtigungen?filter=ungelesen')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('filter', 'ungelesen')
            ->has('items', 1)
            ->where('items.0.title', 'Offen.'));
});

it('carries the unread count on every admin page, for the bell', function (): void {
    $me = bellAdmin();
    alertFor($me);
    alertFor($me);

    $this->actingAs($me, 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('admin.notifications.unread', 2)
            ->where('admin.notifications.offered', true));
});

it('tells the shell when a role can receive no alert at all, so no silent bell is drawn', function (): void {
    $this->actingAs(bellAdmin('content-editor'), 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('admin.notifications.unread', 0)
            ->where('admin.notifications.offered', false));
});

it('gives the bell the newest eight and the unread count', function (): void {
    $me = bellAdmin();

    foreach (range(1, 10) as $n) {
        alertFor($me, "Nummer {$n}.");
        $this->travel(1)->seconds();
    }

    $this->actingAs($me, 'admin')->getJson('/admin/benachrichtigungen/neueste')
        ->assertOk()
        ->assertJsonPath('unread', 10)
        ->assertJsonCount(BenachrichtigungenController::LATEST, 'items')
        ->assertJsonPath('items.0.title', 'Nummer 10.');
});

it('marks an alert read and stays, when it has no page', function (): void {
    $me = bellAdmin();
    $alert = alertFor($me);

    $this->actingAs($me, 'admin')->from('/admin/benachrichtigungen')
        ->post("/admin/benachrichtigungen/{$alert->id}/gelesen")
        ->assertRedirect('/admin/benachrichtigungen');

    expect($alert->fresh()?->read_at)->not->toBeNull();
});

it('marks an alert read and opens its page, when it has one', function (): void {
    $me = bellAdmin();
    $alert = alertFor($me, target: ['route' => 'admin.gutachten.index', 'params' => []]);

    $this->actingAs($me, 'admin')->from('/admin')
        ->post("/admin/benachrichtigungen/{$alert->id}/gelesen")
        ->assertRedirect('/admin/gutachten');

    expect($alert->fresh()?->read_at)->not->toBeNull();
});

it('only marks it read when asked to stay', function (): void {
    $me = bellAdmin();
    $alert = alertFor($me, target: ['route' => 'admin.gutachten.index', 'params' => []]);

    $this->actingAs($me, 'admin')->from('/admin/benachrichtigungen')
        ->post("/admin/benachrichtigungen/{$alert->id}/gelesen", ['bleiben' => true])
        ->assertRedirect('/admin/benachrichtigungen');
});

it('refuses to mark somebody else\'s alert read — not even for the Super-Admin', function (): void {
    $theirs = alertFor(bellAdmin('order-manager'));

    $this->actingAs(bellAdmin(), 'admin')
        ->post("/admin/benachrichtigungen/{$theirs->id}/gelesen")
        ->assertForbidden();

    expect($theirs->fresh()?->read_at)->toBeNull();
});

it('marks all of one\'s own read, and only one\'s own', function (): void {
    $me = bellAdmin();
    alertFor($me);
    alertFor($me);
    $theirs = alertFor(bellAdmin('order-manager'));

    $this->actingAs($me, 'admin')->from('/admin/benachrichtigungen')
        ->post('/admin/benachrichtigungen/gelesen')
        ->assertRedirect('/admin/benachrichtigungen')
        ->assertSessionHas('toast', BenachrichtigungenController::ALL_READ);

    expect($me->unreadNotifications()->count())->toBe(0)
        ->and($theirs->fresh()?->read_at)->toBeNull();
});

it('links an alert only to a page that exists', function (): void {
    $me = bellAdmin();
    // Kunden is not built yet: an alert pointing there links nowhere rather than to a 404.
    alertFor($me, target: ['route' => 'admin.kunden.show', 'params' => ['customer' => 1]]);

    $this->actingAs($me, 'admin')->get('/admin/benachrichtigungen')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('items.0.href', null));
});

describe('Was du bekommst', function (): void {
    it('offers the kinds of the areas this person may open, e-mail off by default', function (): void {
        $this->actingAs(bellAdmin('order-manager'), 'admin')->get('/admin/benachrichtigungen')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('kinds', 1)
                ->where('kinds.0.kind', 'order_paid')
                ->where('kinds.0.inApp', true)
                ->where('kinds.0.email', false));
    });

    it('keeps a person\'s choice beside their other preferences', function (): void {
        $me = bellAdmin('order-manager');
        $me->forceFill(['preferences' => ['rail' => 'collapsed']])->save();

        $this->actingAs($me, 'admin')->from('/admin/benachrichtigungen')
            ->put('/admin/benachrichtigungen/einstellungen', ['kinds' => [['kind' => 'order_paid', 'inApp' => false, 'email' => true]]])
            ->assertRedirect('/admin/benachrichtigungen')
            ->assertSessionHas('toast', BenachrichtigungenController::SAVED);

        $fresh = $me->fresh();

        // MySQL keeps JSON keys in its own order, so the pair is compared, not the order.
        expect($fresh?->preferences['alerts']['order_paid'] ?? null)->toEqualCanonicalizing(['in_app' => false, 'email' => true])
            ->and($fresh?->railCollapsed())->toBeTrue();
    });

    it('never stores a kind that was not offered to this person', function (): void {
        $me = bellAdmin('content-editor');

        $this->actingAs($me, 'admin')
            ->put('/admin/benachrichtigungen/einstellungen', ['kinds' => [['kind' => 'order_paid', 'inApp' => true, 'email' => true]]])
            ->assertRedirect();

        expect($me->fresh()?->preferences['alerts'] ?? [])->toBe([]);
    });

    it('refuses a kind that does not exist, in German', function (): void {
        $this->actingAs(bellAdmin(), 'admin')->from('/admin/benachrichtigungen')
            ->put('/admin/benachrichtigungen/einstellungen', ['kinds' => [['kind' => 'alles', 'inApp' => true, 'email' => true]]])
            ->assertRedirect('/admin/benachrichtigungen')
            ->assertSessionHasErrors(['kinds.0.kind' => 'Diese Auswahl können wir nicht speichern. Lade die Seite neu und versuch es noch einmal.']);
    });
});
