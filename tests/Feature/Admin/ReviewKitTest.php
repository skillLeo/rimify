<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ReviewFeedback;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReviewAccountsSeeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/**
 * The review kit (the review release §3): the board, the feedback button's point with its context and
 * screenshot, the list the team answers from, `review:report`, and the review accounts — only where
 * the review is on, never on the live shop.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['rimify.review.enabled' => true]);
    Storage::fake(ReviewFeedback::DISK);
});

function reviewer(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** The smallest real PNG: one transparent pixel. */
function onePixelPng(): string
{
    $image = imagecreatetruecolor(1, 1);
    ob_start();
    imagepng($image);

    return 'data:image/png;base64,'.base64_encode((string) ob_get_clean());
}

it('shows every screen with its state, and the review group in the rail', function (): void {
    $this->actingAs(reviewer('support-agent'), 'admin')->get('/admin/review')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Review/Board')
            ->where('areas.0.label', 'Übersicht')
            ->where('areas', fn ($areas) => collect($areas)->pluck('label')->all() === ['Übersicht', 'Verkauf', 'Katalog', 'Gutachten', 'Fahrzeuge', 'Inhalte', 'Einstellungen', 'System', 'Auswertungen'])
            ->where('admin.review', true)
            ->where('admin.nav', fn ($nav) => collect($nav)->contains('key', 'review')));
});

it('takes a point with where it was made, and its screenshot, checked by its bytes', function (): void {
    $this->actingAs(reviewer('order-manager'), 'admin')->post('/admin/review/rueckmeldungen', [
        'type' => 'text',
        'sentence' => 'Hier fehlt das Wort „inklusive“ vor MwSt.',
        'url' => '/admin/felgen/12?seite=2',
        'viewport' => '1440×900',
        'browser' => 'Chrome 128',
        'screenshot' => onePixelPng(),
    ])->assertSessionHasNoErrors()->assertSessionHas('toast', 'Danke – deine Rückmeldung ist angekommen.');

    $point = ReviewFeedback::query()->firstOrFail();

    expect($point->screen)->toBe('Felgen')
        ->and($point->status)->toBe('neu')
        ->and($point->role)->not->toBeNull()
        ->and($point->screenshot_path)->toStartWith('feedback/');
    Storage::disk(ReviewFeedback::DISK)->assertExists((string) $point->screenshot_path);

    $this->actingAs(reviewer(), 'admin')->get("/admin/review/rueckmeldungen/{$point->id}/bild")->assertOk()->assertHeader('Content-Type', 'image/png');
});

it('refuses a screenshot that is not a PNG, in a sentence', function (): void {
    $this->actingAs(reviewer(), 'admin')->post('/admin/review/rueckmeldungen', [
        'type' => 'fehler', 'sentence' => 'Etwas stimmt nicht.', 'url' => '/admin', 'viewport' => '390×844', 'browser' => 'Safari 18',
        'screenshot' => 'data:image/png;base64,'.base64_encode('<svg/>'),
    ])->assertSessionHasErrors(['screenshot' => 'Das Bildschirmfoto ließ sich nicht lesen. Schick die Rückmeldung bitte ohne.']);
});

it('lets the lead answer, and asks for a reason when a point is refused', function (): void {
    $point = ReviewFeedback::query()->create(['type' => 'wunsch', 'sentence' => 'Dunkler Modus.', 'url' => '/admin', 'screen' => 'Übersicht', 'viewport' => '1440×900', 'browser' => 'Chrome 128', 'status' => 'neu']);

    $this->actingAs(reviewer('support-agent'), 'admin')->patch("/admin/review/rueckmeldungen/{$point->id}", ['status' => 'erledigt'])->assertForbidden();

    $this->actingAs(reviewer(), 'admin')->patch("/admin/review/rueckmeldungen/{$point->id}", ['status' => 'abgelehnt', 'answer' => ''])
        ->assertSessionHasErrors(['answer' => 'Wer ablehnt, sagt warum: Bitte schreib die Begründung.']);

    $this->actingAs(reviewer(), 'admin')->patch("/admin/review/rueckmeldungen/{$point->id}", ['status' => 'abgelehnt', 'answer' => 'Nicht vor dem Start.', 'assignee_id' => reviewer()->id])
        ->assertSessionHasNoErrors();

    expect($point->refresh()->closed_at)->not->toBeNull()->and($point->assignee_id)->toBe(reviewer()->id);
});

it('refuses an answer saved from a list opened before the last answer to that point, and keeps that one (the admin audit\'s F-25)', function (): void {
    $point = ReviewFeedback::query()->create(['type' => 'wunsch', 'sentence' => 'Dunkler Modus.', 'url' => '/admin', 'screen' => 'Übersicht', 'viewport' => '1440×900', 'browser' => 'Chrome 128', 'status' => 'neu']);
    $stale = collect($this->actingAs(reviewer(), 'admin')->get('/admin/review/rueckmeldungen')->viewData('page')['props']['items'])->firstWhere('id', $point->id)['stamp'] ?? null;
    expect($stale)->toBeString()->not->toBe('');

    $this->actingAs(reviewer(), 'admin')->from('/admin/review/rueckmeldungen')
        ->patch("/admin/review/rueckmeldungen/{$point->id}", ['status' => 'angenommen', 'answer' => 'Kommt nach dem Start.'])->assertSessionHasNoErrors();
    $this->actingAs(reviewer(), 'admin')->from('/admin/review/rueckmeldungen')->withHeader(EditStamp::HEADER, $stale)
        ->patch("/admin/review/rueckmeldungen/{$point->id}", ['status' => 'erledigt', 'answer' => ''])
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect($point->refresh()->only(['status', 'answer']))->toBe(['status' => 'angenommen', 'answer' => 'Kommt nach dem Start.']);
});

it('filters the list by kind, screen and state', function (): void {
    foreach ([['fehler', 'Felgen', 'neu'], ['text', 'Felgen', 'erledigt'], ['fehler', 'Übersicht', 'angenommen']] as [$type, $screen, $status]) {
        ReviewFeedback::query()->create(['type' => $type, 'sentence' => 'Punkt.', 'url' => '/admin', 'screen' => $screen, 'viewport' => '1440×900', 'browser' => 'Chrome 128', 'status' => $status]);
    }

    $this->actingAs(reviewer(), 'admin')->get('/admin/review/rueckmeldungen?typ=fehler')
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Review/Feedback')->has('items', 2));
    $this->actingAs(reviewer(), 'admin')->get('/admin/review/rueckmeldungen?seite=Felgen&status=alle')
        ->assertInertia(fn (AssertableInertia $page) => $page->has('items', 2));
});

it('writes the points out with review:report', function (): void {
    $point = ReviewFeedback::query()->create(['type' => 'design', 'sentence' => 'Die Tabelle ist zu eng | sehr eng.', 'url' => '/admin/felgen', 'screen' => 'Felgen', 'viewport' => '1440×900', 'browser' => 'Chrome 128', 'status' => 'erledigt', 'answer' => 'Breiter gemacht.', 'closed_at' => now()]);
    $path = storage_path('framework/testing/OPEN-POINTS.md');

    $this->artisan('review:report', ['--path' => $path])->assertSuccessful();

    expect((string) file_get_contents($path))->toContain("| #{$point->id} | Felgen | Design: Die Tabelle ist zu eng \\| sehr eng. | Breiter gemacht. | Erledigt |");
});

it('is gone where the review is off: no board, no point, no group, no accounts', function (): void {
    config(['rimify.review.enabled' => false]);

    $this->actingAs(reviewer(), 'admin')->get('/admin/review')->assertForbidden();
    $this->actingAs(reviewer(), 'admin')->post('/admin/review/rueckmeldungen', ['type' => 'fehler', 'sentence' => 'x y z', 'url' => '/admin', 'viewport' => '1×1', 'browser' => 'x'])->assertForbidden();
    $this->actingAs(reviewer(), 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('admin.review', false)->where('admin.nav', fn ($nav) => ! collect($nav)->contains('key', 'review')));

    expect(fn () => $this->seed(ReviewAccountsSeeder::class))->toThrow(RuntimeException::class);
});

it('makes the three review accounts with their roles and the obvious password', function (): void {
    $this->seed(ReviewAccountsSeeder::class);

    foreach (ReviewAccountsSeeder::ACCOUNTS as $email => [, $role]) {
        $user = AdminUser::query()->where('email', $email)->firstOrFail();

        expect($user->hasRole($role))->toBeTrue()
            ->and(Hash::check(ReviewAccountsSeeder::PASSWORD, $user->password))->toBeTrue()
            // The rail's foot names them on every page: German, never „Review Verkauf“.
            ->and($user->name)->toStartWith('Testzugang ')->not->toContain('Review');
    }
});

it('links on the board only what the reader may open, and says so for the rest', function (): void {
    $areas = fn (string $role): array => $this->actingAs(reviewer($role), 'admin')->get('/admin/review')->assertOk()->viewData('page')['props']['areas'];
    $screens = static fn (array $areas): Collection => collect($areas)->flatMap(static fn (array $a): array => $a['screens'])->keyBy('label');

    $sales = $screens($areas('order-manager'));
    $admin = $screens($areas('super-admin'));

    // Verkauf may open orders, not Gutachten or Benutzer: listed, not linked, and the line says why.
    expect($sales['Bestellungen']['href'])->toBe('/admin/bestellungen')
        ->and($sales['Bestellungen']['locked'])->toBeFalse()
        ->and($sales['Dokumente']['href'])->toBeNull()
        ->and($sales['Dokumente']['locked'])->toBeTrue()
        ->and($sales['Benutzer']['href'])->toBeNull()
        // The Super-Admin opens every built screen.
        ->and($admin->filter(static fn (array $s): bool => $s['locked'])->keys()->all())->toBe([])
        ->and($admin['Dokumente']['href'])->toBe('/admin/gutachten');
});

it('gives the three review accounts three different admins: another sidebar and another Übersicht', function (): void {
    $this->seed(ReviewAccountsSeeder::class);
    $seen = [];

    foreach (array_keys(ReviewAccountsSeeder::ACCOUNTS) as $email) {
        $page = $this->actingAs(AdminUser::query()->where('email', $email)->firstOrFail(), 'admin')
            ->get('/admin')->assertOk()->viewData('page');
        $props = is_array($page) ? $page['props'] : [];
        $nav = collect($props['admin']['nav'] ?? [])->flatMap(static fn (array $group): array => [
            $group['key'] ?? '',
            ...collect($group['pages'] ?? [])->pluck('key')->filter()->all(),
        ])->filter()->values()->all();

        $seen[$email] = [
            'nav' => $nav,
            // What the page is made of: its figures, its charts and which lists it has.
            'page' => [
                'variant' => $props['variant'] ?? null,
                'tiles' => collect($props['kpis'] ?? [])->pluck('key')->filter()->values()->all(),
                'charts' => $props['chartKeys'] ?? [],
                'lists' => array_keys(array_filter([
                    'recentOrders' => $props['recentOrders'] ?? null,
                    'activity' => $props['activity'] ?? null,
                    'quality' => $props['quality'] ?? null,
                ], static fn (mixed $list): bool => $list !== null)),
            ],
        ];
    }

    [$verkauf, $lager, $admin] = array_values($seen);

    // Three different sidebars …
    expect($verkauf['nav'])->not->toBe($lager['nav'])
        ->and($lager['nav'])->not->toBe($admin['nav'])
        ->and($verkauf['nav'])->not->toBe($admin['nav'])
        // … the Admin has pages neither of the others has (Rollen & Rechte, Speicher, System) …
        ->and(array_diff($admin['nav'], $verkauf['nav']))->not->toBeEmpty()
        ->and(array_diff($admin['nav'], $lager['nav']))->not->toBeEmpty()
        // … and the Übersicht is not the same page three times.
        ->and($verkauf['page'])->not->toBe($lager['page'])
        ->and($lager['page'])->not->toBe($admin['page'])
        ->and($verkauf['page'])->not->toBe($admin['page']);
});
