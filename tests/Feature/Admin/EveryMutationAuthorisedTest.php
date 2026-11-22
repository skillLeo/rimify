<?php

declare(strict_types=1);

use App\Models\AdminUser;
use Database\Seeders\AccessSeeder;
use Illuminate\Routing\Route as RoutingRoute;
use Illuminate\Support\Facades\Route;

/*
 * R-11, as a sweep (the operator's brief of 22.11.2026, B2 line 3, D-508): every admin route that changes something, sent by an
 * account that holds no role, is refused on the server — whatever the UI hides. A new route without its Policy check fails here
 * by name. The other tests prove each screen's matrix; this one proves none was forgotten.
 *
 * Refused means: 403, 404 (the thing or the screen is not there for this account), 405, 409, 410 or 422 — or a redirect to the
 * sign-in or the password confirmation, which comes before any write. A redirect back with validation errors fails too: the
 * request was let through to its input, so its authorisation is missing or comes after it (on 22.11.2026 no route did that).
 */

/**
 * Routes an account without a role may send by design, each about itself alone: its session, its invitation, its password, the
 * password confirmation, its own notifications (marked read, one or all) and its own view and alert preferences.
 */
const OWN_ACCOUNT = [
    'admin.anmelden.store', 'admin.abmelden', 'admin.einladung.annehmen', 'admin.bestaetigen.store', 'admin.profil.passwort',
    'admin.benachrichtigungen.alle-gelesen', 'admin.benachrichtigungen.gelesen', 'admin.benachrichtigungen.einstellungen', 'admin.ansicht',
];

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

/** @return list<RoutingRoute> */
function adminMutations(): array
{
    return array_values(array_filter(
        Route::getRoutes()->getRoutes(),
        static fn (RoutingRoute $r): bool => str_starts_with($r->uri(), 'admin')
            && array_diff($r->methods(), ['GET', 'HEAD']) !== []
            && ! in_array($r->getName(), OWN_ACCOUNT, true)
            // An old address kept as a redirect (Route::redirect) answers every method and writes nothing.
            && $r->getActionName() !== '\\Illuminate\\Routing\\RedirectController',
    ));
}

it('finds the admin routes that change something', function (): void {
    expect(count(adminMutations()))->toBeGreaterThan(100);
});

it('refuses every admin mutation to an account that holds no role (R-11)', function (): void {
    $nobody = AdminUser::factory()->create();
    $unrefused = [];

    foreach (adminMutations() as $route) {
        $method = array_values(array_diff($route->methods(), ['GET', 'HEAD']))[0];
        $uri = '/'.preg_replace('/\{[^}]+\}/', '1', $route->uri());

        $this->flushSession();
        $response = $this->actingAs($nobody, 'admin')->call($method, $uri, [], [], [], ['HTTP_ACCEPT' => 'text/html']);
        $status = $response->getStatusCode();
        $location = (string) $response->headers->get('Location');

        if (in_array($status, [403, 404, 405, 409, 410, 422], true)) {
            continue;
        }

        if ($status === 302 && preg_match('#/admin/(anmelden|bestaetigen)(\?|$)#', $location) === 1) {
            continue;
        }

        $unrefused[] = "{$method} {$uri} ({$route->getName()}) → {$status} {$location}";
    }

    expect($unrefused)->toBe([], "These admin routes did not refuse an account without a role:\n  ".implode("\n  ", $unrefused));
});
