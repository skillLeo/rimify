<?php

declare(strict_types=1);

use App\Enums\AdminUserStatus;
use App\Http\Middleware\EnsureAdminSessionValid;
use App\Models\AdminUser;
use App\Models\Page;
use App\Models\ReviewFeedback;
use App\Services\Admin\Review\ReviewBoard;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia;

/**
 * D-142: the review's feedback button on the shop's own pages — where the client spends his review — for a signed-in
 * admin while the review is on, and absent for everyone else. The point it sends is the admin's own: the page's
 * address, the window, the browser, the role and a screenshot, kept with the shop page it was made on.
 */
beforeEach(function (): void {
    config(['rimify.review.enabled' => true]);
    $this->seed(ReferenceDataSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

function shopReviewer(): AdminUser
{
    return AdminUser::query()->where('email', 'order-manager@rimify.test')->firstOrFail();
}

it('carries no button for a visitor — not null, not hidden: absent', function (string $path): void {
    $this->get($path)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->missing('reviewer'));
})->with(['/', '/felgenrechner', '/kontakt']);

it('carries it on the shop’s pages for a signed-in admin, with that person’s role and nothing else of the admin', function (string $path): void {
    $this->actingAs(shopReviewer(), 'admin')
        ->get($path)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('reviewer.role', shopReviewer()->roleLabel())
            ->missing('admin'));
})->with(['/', '/felgenrechner', '/kontakt']);

it('carries none where the review is off, for a suspended account, or once the account’s sessions were ended', function (): void {
    $admin = shopReviewer();

    config(['rimify.review.enabled' => false]);
    $this->actingAs($admin, 'admin')->get('/kontakt')->assertInertia(fn (AssertableInertia $page) => $page->missing('reviewer'));

    config(['rimify.review.enabled' => true]);
    $admin->forceFill(['sessions_revoked_at' => Date::now()])->save();
    $this->actingAs($admin, 'admin')
        ->withSession([EnsureAdminSessionValid::SESSION_KEY => Date::now()->subMinute()->getTimestamp()])
        ->get('/kontakt')
        ->assertInertia(fn (AssertableInertia $page) => $page->missing('reviewer'));

    $admin->forceFill(['sessions_revoked_at' => null, 'status' => AdminUserStatus::Suspended->value])->save();
    $this->actingAs($admin->refresh(), 'admin')->get('/kontakt')->assertInertia(fn (AssertableInertia $page) => $page->missing('reviewer'));
});

it('carries none inside the admin’s page preview, which shows the page and not the shop', function (): void {
    $home = Page::query()->where('slug', 'startseite')->firstOrFail();
    $signed = URL::temporarySignedRoute('vorschau.seite', now()->addHour(), ['page' => $home->id, 'geraet' => 'desktop']);

    $this->actingAs(shopReviewer(), 'admin')
        ->get($signed)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->missing('reviewer'));
});

it('keeps a point sent from a shop page with its address and the page it was made on', function (): void {
    $this->actingAs(shopReviewer(), 'admin')
        ->from('/felgen/borbet-db8gt2?groesse=19')
        ->post('/admin/review/rueckmeldungen', [
            'type' => 'design',
            'sentence' => 'Die Mengenauswahl sitzt zu weit unten.',
            'url' => '/felgen/borbet-db8gt2?groesse=19',
            'viewport' => '390×844',
            'browser' => 'Safari 18 (mobil)',
        ])
        ->assertRedirect('/felgen/borbet-db8gt2?groesse=19')
        ->assertSessionHas('toast', 'Danke – deine Rückmeldung ist angekommen.');

    $point = ReviewFeedback::query()->latest('id')->firstOrFail();

    expect($point->url)->toBe('/felgen/borbet-db8gt2?groesse=19')
        ->and($point->screen)->toBe('Shop · Produktseite')
        ->and($point->role)->toBe(shopReviewer()->roleLabel());
});

it('refuses an address that is not a page of this site', function (string $url): void {
    $this->actingAs(shopReviewer(), 'admin')
        ->post('/admin/review/rueckmeldungen', ['type' => 'fehler', 'sentence' => 'Etwas stimmt nicht.', 'url' => $url, 'viewport' => '1440×900', 'browser' => 'Chrome 128'])
        ->assertSessionHasErrors('url');

    expect(ReviewFeedback::query()->count())->toBe(0);
})->with(['https://example.com/felgen', '//example.com/felgen', '/\\example.com', 'felgen']);

it('names the shop’s pages for the list and its filter', function (): void {
    expect(ReviewBoard::screenFor('/'))->toBe('Shop · Startseite')
        ->and(ReviewBoard::screenFor('/felgen?zoll=19'))->toBe('Shop · Felgenliste')
        ->and(ReviewBoard::screenFor('/felgen/borbet-db8gt2'))->toBe('Shop · Produktseite')
        ->and(ReviewBoard::screenFor('/felgen-suchen?marke=BMW'))->toBe('Shop · Fahrzeug wählen')
        ->and(ReviewBoard::screenFor('/rimify-check/ergebnis'))->toBe('Shop · RIMIFY-Check')
        ->and(ReviewBoard::screenFor('/kasse/testzahlung/RMF-1'))->toBe('Shop · Kasse')
        ->and(ReviewBoard::screenFor('/impressum'))->toBe('Shop · andere Seite')
        ->and(ReviewBoard::screenFor('/admin/felgen/12'))->toBe('Felgen')
        ->and(ReviewBoard::screens())->toContain('Shop · Produktseite')
        ->and(ReviewBoard::screens())->toContain('Shop · andere Seite');
});
