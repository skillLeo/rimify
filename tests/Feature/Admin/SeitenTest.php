<?php

declare(strict_types=1);

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Admin\SeitenController;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\NavItem;
use App\Models\Page;
use App\Models\PageRevision;
use App\Services\Admin\AuditDescriber;
use App\Services\Content\PageChangedMeanwhile;
use App\Services\Content\PageContent;
use App\Services\Content\PagePublisher;
use App\Services\Content\PageSchema;
use App\Support\HeroPhotos;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;

/**
 * Inhalte › Seiten — the client's team changes the shop's words without us
 * (docs/admin/inhalte-build-plan.md). What matters: a draft never reaches a visitor, nothing goes
 * live that the layout cannot hold, the words that were replaced can always be brought back, the
 * rights to draft and to publish are separate and enforced on the server, two people on one page
 * never silently undo each other, and a release never writes the seeded copy over the team's.
 */
beforeEach(function (): void {
    // Not a reset-ready test environment: there the Impressum names its operator first (the look-back, D-232).
    config(['rimify.reset.allowed' => false]);
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

function seitenAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function seite(string $slug): Page
{
    return Page::query()->where('slug', $slug)->firstOrFail();
}

/** The page's version as it stands now — what an editor opened a moment ago would send. */
function stand(Page $page): int
{
    return (int) Page::query()->whereKey($page->id)->value('content_version');
}

/**
 * The page's live words in the editor's shape — what the form starts from.
 *
 * @return array{title: string, metaDescription: string, blocks: list<array{type: string, data: array<string, mixed>}>}
 */
function seitenInhalt(Page $page): array
{
    $live = PageContent::live($page);

    return PageSchema::normalise(PageSchema::for($page) ?? [], $live, $live);
}

/** @param  array<string, mixed>  $content */
function entwurf(Page $page, array $content, string $role = 'super-admin', ?int $version = null): TestResponse
{
    return test()->actingAs(seitenAdmin($role), 'admin')
        ->from('/admin/seiten/'.$page->id)
        ->put('/admin/seiten/'.$page->id.'/entwurf', $content + ['baseVersion' => $version ?? stand($page)]);
}

/** @param  array<string, mixed>  $content */
function veroeffentlichen(Page $page, array $content, bool $reviewed = false, string $role = 'super-admin', ?int $version = null): TestResponse
{
    return test()->actingAs(seitenAdmin($role), 'admin')
        ->from('/admin/seiten/'.$page->id)
        ->post('/admin/seiten/'.$page->id.'/veroeffentlichen', $content + [
            'note' => '',
            'lawyerReviewed' => $reviewed,
            'baseVersion' => $version ?? stand($page),
        ]);
}

/** Restore, discard or withdraw: a write with nothing but the version. */
function seitenAktion(string $method, string $url, Page $page, string $role = 'super-admin', ?int $version = null): TestResponse
{
    return test()->actingAs(seitenAdmin($role), 'admin')
        ->from('/admin/seiten/'.$page->id)
        ->json($method, $url, ['baseVersion' => $version ?? stand($page)], ['X-Requested-With' => 'XMLHttpRequest', 'Accept' => 'text/html']);
}

it('lists the pages whose words the shop prints, and no others', function (): void {
    $response = $this->actingAs(seitenAdmin(), 'admin')->get('/admin/seiten')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Seiten/Index')
            ->has('groups', 3)
            ->where('groups.0.label', 'Startseite')
            ->has('groups.0.pages', 1)
            ->where('groups.1.label', 'Ratgeber')
            ->where('groups.2.label', 'Rechtliches')
            ->has('groups.2.pages', 5)
            ->where('groups.2.pages.0.placeholder', true)
            ->where('can.create', true));

    // The FAQ and Kontakt pages print none of their block fields; offering them would be a promise.
    $titles = collect($response->viewData('page')['props']['groups'])->flatMap(fn (array $g) => array_column($g['pages'], 'title'))->all();
    expect($titles)->not->toContain('Häufige Fragen')->not->toContain('Kontakt');
});

it('answers a page the panel does not edit as absent, not forbidden, and logs no refusal', function (): void {
    $kontakt = seite('kontakt');

    $this->actingAs(seitenAdmin(), 'admin')->get('/admin/seiten/'.$kontakt->id)->assertNotFound();
    entwurf($kontakt, ['title' => 'x', 'metaDescription' => '', 'blocks' => []])->assertNotFound();
    veroeffentlichen($kontakt, ['title' => 'x', 'metaDescription' => '', 'blocks' => []])->assertNotFound();

    expect(AuditLog::query()->where('description', 'permission.denied')->exists())->toBeFalse();
});

it('opens a page in the editor with its schema, its words, its version and what this admin may do', function (): void {
    $home = seite('startseite');

    $this->actingAs(seitenAdmin(), 'admin')->get('/admin/seiten/'.$home->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Seiten/Bearbeiten')
            ->where('page.version', 0)
            ->where('schema.blocks.0.type', 'hero')
            ->where('schema.blocks.0.fields.0.max', 60)
            ->where('content.blocks.0.data.headline', 'Felgen, die an dein Auto dürfen.')
            ->where('draft', null)
            ->where('can.edit', true)
            ->where('can.publish', true)
            ->where('can.withdraw', false)
            // One record beneath the rail page: the list is the way back, the page is where you are.
            ->where('admin.breadcrumbs', [
                ['label' => 'Inhalte', 'href' => null],
                ['label' => 'Seiten', 'href' => '/admin/seiten'],
                ['label' => 'Startseite', 'href' => null],
            ]));
});

it('saves a draft that no visitor sees', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Neue Überschrift im Entwurf';

    entwurf($home, $content)->assertRedirect()->assertSessionHasNoErrors();

    expect($home->refresh()->draft['blocks'][0]['data']['headline'] ?? null)->toBe('Neue Überschrift im Entwurf')
        ->and($home->content_version)->toBe(1);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.title', 'Felgen, die an dein Auto dürfen.'));

    expect(AuditLog::query()->where('description', 'page.draft_saved')->exists())->toBeTrue();
});

it('refuses a write made against an older version, and keeps the newer words', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);

    // A colleague saves first; this editor still has version 0 on screen.
    $content['blocks'][0]['data']['headline'] = 'Die Überschrift der Kollegin';
    entwurf($home, $content)->assertSessionHasNoErrors();

    $mine = seitenInhalt($home);
    $mine['blocks'][0]['data']['headline'] = 'Meine ältere Fassung';

    entwurf($home, $mine, version: 0)->assertSessionHasErrors(['page' => PageChangedMeanwhile::MESSAGE]);
    veroeffentlichen($home, $mine, version: 0)->assertSessionHasErrors(['page' => PageChangedMeanwhile::MESSAGE]);
    seitenAktion('DELETE', '/admin/seiten/'.$home->id.'/entwurf', $home, version: 0)->assertSessionHasErrors(['page']);

    expect($home->refresh()->draft['blocks'][0]['data']['headline'] ?? null)->toBe('Die Überschrift der Kollegin');
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.title', 'Felgen, die an dein Auto dürfen.'));
});

it('keeps only what the schema knows: no stray keys, no unknown blocks', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['onclick'] = 'alert(1)';
    $content['blocks'][] = ['type' => 'script', 'data' => ['src' => 'https://example.test/x.js']];

    entwurf($home, $content)->assertRedirect();

    $draft = $home->refresh()->draft;

    // MySQL keeps a JSON object's keys in its own order, so the set is what is compared.
    expect(array_keys($draft['blocks'][0]['data']))->toEqualCanonicalizing(['headline', 'sub', 'sub_mobile', 'foto'])
        ->and(array_column($draft['blocks'], 'type'))->toBe(['hero', 'promise_row']);
});

it('offers the Einstieg\'s photograph as a choice among the shipped ones, with the default for older content', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);

    // Content from before the field existed reads as the default photograph, never as none.
    unset($content['blocks'][0]['data']['foto']);
    entwurf($home, $content)->assertRedirect();
    expect($home->refresh()->draft['blocks'][0]['data']['foto'])->toBe(HeroPhotos::DEFAULT);

    // A photograph the release does not ship is refused by name.
    $content['blocks'][0]['data']['foto'] = 'irgendein-bild';
    entwurf($home, $content);
    expect(PageSchema::errors(PageSchema::for($home->refresh()) ?? [], $home->draft))->toHaveKey('blocks.0.data.foto');
});

it('refuses to publish a missing or over-long text, names the place, and changes nothing', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = '';
    $content['blocks'][0]['data']['sub'] = str_repeat('a', 221);
    $content['blocks'][0]['data']['sub_mobile'] = '';

    // Said under the field, whose label stands above it; the editor's summary adds the place.
    veroeffentlichen($home, $content)->assertSessionHasErrors([
        'blocks.0.data.headline' => 'Bitte ausfüllen.',
        'blocks.0.data.sub' => 'Höchstens 220 Zeichen, jetzt sind es 221.',
        // The phone has room for one sentence and never falls back to the long one.
        'blocks.0.data.sub_mobile' => 'Bitte ausfüllen.',
    ]);

    expect(PageRevision::query()->count())->toBe(0);
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.title', 'Felgen, die an dein Auto dürfen.'));
});

it('refuses a page whose shape the layout cannot hold', function (string $slug, Closure $break, string $key): void {
    $page = seite($slug);
    $content = $break(seitenInhalt($page));

    veroeffentlichen($page, $content)->assertSessionHasErrors([$key]);

    expect(PageRevision::query()->count())->toBe(0)
        ->and($page->refresh()->content_version)->toBe(0);
})->with([
    'five promises in a row of four' => ['startseite', function (array $c): array {
        $c['blocks'][1]['data']['items'][] = ['icon' => 'check', 'title' => 'Fünf', 'text' => 'Zu viel.'];

        return $c;
    }, 'blocks.1.data.items'],
    'no hero' => ['startseite', function (array $c): array {
        array_shift($c['blocks']);

        return $c;
    }, 'blocks'],
    'a section before the lead' => ['hsn-und-tsn-finden', function (array $c): array {
        $c['blocks'] = [$c['blocks'][1], $c['blocks'][0], ...array_slice($c['blocks'], 2)];

        return $c;
    }, 'blocks'],
    'a reading time of 0' => ['hsn-und-tsn-finden', function (array $c): array {
        $c['blocks'][0]['data']['minutes'] = 0;

        return $c;
    }, 'blocks.0.data.minutes'],
    'a reading time of 61' => ['hsn-und-tsn-finden', function (array $c): array {
        $c['blocks'][0]['data']['minutes'] = 61;

        return $c;
    }, 'blocks.0.data.minutes'],
    'a legal page with no section' => ['impressum', function (array $c): array {
        $c['blocks'] = [];

        return $c;
    }, 'blocks'],
]);

it('publishes the page whole, keeps the words it replaced, and says what changed', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Felgen mit Gutachten für dein Auto.';
    $content['blocks'][1]['data']['items'][1]['title'] = 'Das Gutachten zu jeder Felge';

    veroeffentlichen($home, $content)->assertRedirect('/admin/seiten/'.$home->id)->assertSessionHasNoErrors();

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('hero.title', 'Felgen mit Gutachten für dein Auto.')
        ->where('promises.1.title', 'Das Gutachten zu jeder Felge'));

    $revisions = PageRevision::query()->where('page_id', $home->id)->orderBy('id')->get();

    expect($revisions)->toHaveCount(2)
        ->and($revisions[0]->note)->toBe(PagePublisher::FIRST_REVISION_NOTE)
        ->and($revisions[0]->snapshot['blocks'][0]['data']['headline'])->toBe('Felgen, die an dein Auto dürfen.')
        ->and($revisions[1]->author_email)->toBe('super-admin@rimify.test')
        ->and($home->refresh()->draft)->toBeNull();

    $entry = AuditLog::query()->where('description', 'page.published')->sole();

    expect((new AuditDescriber)->describe($entry)['sentence'])
        ->toBe('Die Seite „Startseite“ wurde veröffentlicht. Geändert: Einstieg · Überschrift, Versprechen 2 · Titel.');
});

it('names more changed places than it lists in words, one place as one', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Eins';
    $content['blocks'][0]['data']['sub'] = 'Zwei';
    $content['blocks'][0]['data']['sub_mobile'] = 'Drei';

    foreach ([0, 1, 2, 3] as $i) {
        $content['blocks'][1]['data']['items'][$i]['title'] = 'Titel '.$i;
    }

    veroeffentlichen($home, $content)->assertSessionHasNoErrors();

    $sentence = (new AuditDescriber)->describe(AuditLog::query()->where('description', 'page.published')->sole())['sentence'];

    expect($sentence)->toEndWith('und eine weitere Stelle.');
});

it('shows the phone its own sentence, trimmed, and never the desktop one', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['sub_mobile'] = '  Ein Satz fürs Handy.  ';

    veroeffentlichen($home, $content)->assertSessionHasNoErrors();

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.sublineMobile', 'Ein Satz fürs Handy.'));
});

it('writes no new version when the shop already shows exactly these words', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Einmal geändert';
    veroeffentlichen($home, $content);

    expect(PageRevision::query()->where('page_id', $home->id)->count())->toBe(2);

    veroeffentlichen($home, $content)->assertSessionHas('toast', SeitenController::UNCHANGED);

    expect(PageRevision::query()->where('page_id', $home->id)->count())->toBe(2)
        ->and(AuditLog::query()->where('description', 'page.published')->count())->toBe(1);
});

it('names the people who wrote a version, not their addresses', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Von Sabine';
    veroeffentlichen($home, $content);

    $this->actingAs(seitenAdmin(), 'admin')->get('/admin/seiten/'.$home->id)
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('revisions.0.by', seitenAdmin()->name)
            // The wording the admin first replaced was written by nobody here.
            ->where('revisions.1.by', null));
});

it('compares a version with the shop, place by place and word for word', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Jetzt im Shop';
    veroeffentlichen($home, $content);

    $first = PageRevision::query()->where('page_id', $home->id)->orderBy('id')->firstOrFail();

    $this->actingAs(seitenAdmin(), 'admin')->getJson('/admin/seiten/'.$home->id.'/versionen/'.$first->id.'/vergleich')
        ->assertOk()
        ->assertExactJson(['changes' => [[
            'label' => 'Einstieg · Überschrift',
            'before' => 'Jetzt im Shop',
            'after' => 'Felgen, die an dein Auto dürfen.',
        ]]]);

    $this->actingAs(seitenAdmin(), 'admin')->getJson('/admin/seiten/'.seite('impressum')->id.'/versionen/'.$first->id.'/vergleich')->assertNotFound();
    $this->actingAs(seitenAdmin('support-agent'), 'admin')->getJson('/admin/seiten/'.$home->id.'/versionen/'.$first->id.'/vergleich')->assertForbidden();
});

it('publishes a guide whose sections were moved, added and removed, in that order', function (): void {
    $guide = seite('hsn-und-tsn-finden');
    $content = seitenInhalt($guide);
    $sections = array_slice($content['blocks'], 1);
    $sections = [$sections[1], $sections[0], ...array_slice($sections, 2, 3), ['type' => 'prose', 'data' => ['heading' => 'Neu am Ende', 'text' => 'Ein neuer Absatz.']]];
    $content['blocks'] = [$content['blocks'][0], ...$sections];

    veroeffentlichen($guide, $content)->assertSessionHasNoErrors();

    $this->get('/ratgeber/hsn-und-tsn-finden')->assertInertia(fn (AssertableInertia $page) => $page
        ->has('guide.blocks', 6)
        ->where('guide.blocks.0.data.heading', $sections[0]['data']['heading'])
        ->where('guide.blocks.5.data.heading', 'Neu am Ende'));
});

it('keeps the placeholder mark only on the placeholder text, and the lawyer mark only when confirmed', function (): void {
    $impressum = seite('impressum');
    $content = seitenInhalt($impressum);

    // The seeded placeholder stays, and a real second section joins it: the publish runs for real.
    $content['blocks'][] = ['type' => 'legal_body', 'data' => ['heading' => 'Haftung', 'text' => 'Neu.']];
    veroeffentlichen($impressum, $content)->assertSessionHas('toast', SeitenController::PUBLISHED);

    $blocks = $impressum->refresh()->blocks()->get();
    expect($blocks[0]->data['placeholder'] ?? null)->toBeTrue()
        ->and($blocks[1]->data)->not->toHaveKey('placeholder');

    $content['blocks'][0]['data']['text'] = 'Der Text, den die Kanzlei geliefert hat.';
    veroeffentlichen($impressum, $content, reviewed: true)->assertSessionHasNoErrors();

    $impressum->refresh();
    expect($impressum->blocks()->first()?->data)->not->toHaveKey('placeholder')
        ->and($impressum->lawyer_reviewed)->toBeTrue();

    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('blocks.0.data.text', 'Der Text, den die Kanzlei geliefert hat.'));

    $content['blocks'][0]['data']['text'] = 'Eine geänderte Fassung.';
    veroeffentlichen($impressum, $content, reviewed: false)->assertSessionHasNoErrors();
    expect($impressum->refresh()->lawyer_reviewed)->toBeFalse();
});

it('marks the seeded placeholder again when its Ausgangsstand is restored and published', function (): void {
    $impressum = seite('impressum');
    $content = seitenInhalt($impressum);
    $content['blocks'][0]['data']['text'] = 'Der Text der Kanzlei.';
    veroeffentlichen($impressum, $content)->assertSessionHasNoErrors();

    $first = PageRevision::query()->where('page_id', $impressum->id)->orderBy('id')->firstOrFail();
    seitenAktion('POST', '/admin/seiten/'.$impressum->id.'/versionen/'.$first->id, $impressum)->assertSessionHasNoErrors();

    $draft = PageSchema::normalise(PageSchema::for($impressum) ?? [], $impressum->refresh()->draft ?? [], PageContent::live($impressum));
    veroeffentlichen($impressum, $draft)->assertSessionHasNoErrors();

    expect($impressum->refresh()->blocks()->first()?->data['placeholder'] ?? null)->toBeTrue();
});

it('separates drafting from publishing: a role may prepare words without putting them live', function (): void {
    $role = (int) DB::table('roles')->where('name', 'content-editor')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'content')->where('action', 'publish')->update(['allowed' => false]);

    $editor = seitenAdmin('content-editor');
    expect($editor->may(PermissionModule::Content, PermissionAction::Publish))->toBeFalse();

    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Nur ein Entwurf';

    entwurf($home, $content, role: 'content-editor')->assertRedirect()->assertSessionHasNoErrors();
    veroeffentlichen($home, $content, role: 'content-editor')->assertForbidden();
    seitenAktion('POST', '/admin/seiten/'.seite('hsn-und-tsn-finden')->id.'/zurueckziehen', seite('hsn-und-tsn-finden'), role: 'content-editor')->assertForbidden();

    expect(seite('hsn-und-tsn-finden')->isPublished())->toBeTrue();
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.title', 'Felgen, die an dein Auto dürfen.'));
});

it('lets a role that may publish but not edit put the team\'s draft live, never words of its own', function (): void {
    $home = seite('startseite');
    $draft = seitenInhalt($home);
    $draft['blocks'][0]['data']['headline'] = 'Vom Team geschrieben';
    entwurf($home, $draft)->assertSessionHasNoErrors();

    // A reviewer: may look and publish, may not write.
    $role = (int) DB::table('roles')->where('name', 'content-editor')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'content')->where('action', 'edit')->update(['allowed' => false]);

    $own = seitenInhalt($home);
    $own['blocks'][0]['data']['headline'] = 'Eigene Worte des Prüfers';

    veroeffentlichen($home, $own, role: 'content-editor')->assertSessionHasNoErrors();

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.title', 'Vom Team geschrieben'));
});

it('refuses every write and the editor to a role without content rights', function (): void {
    $home = seite('startseite');

    $this->actingAs(seitenAdmin('support-agent'), 'admin')->get('/admin/seiten/'.$home->id)->assertForbidden();
    entwurf($home, seitenInhalt($home), role: 'support-agent')->assertForbidden();
    veroeffentlichen($home, seitenInhalt($home), role: 'support-agent')->assertForbidden();

    expect($home->refresh()->draft)->toBeNull();
});

it('discards a draft back to what is live, for those who may edit, and says so in the Protokoll', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Wird verworfen';
    entwurf($home, $content);

    seitenAktion('DELETE', '/admin/seiten/'.$home->id.'/entwurf', $home, role: 'support-agent')->assertForbidden();
    expect($home->refresh()->draft)->not->toBeNull();

    seitenAktion('DELETE', '/admin/seiten/'.$home->id.'/entwurf', $home)->assertSessionHas('toast', SeitenController::DRAFT_DISCARDED);

    expect($home->refresh()->draft)->toBeNull()
        ->and(AuditLog::query()->where('description', 'page.draft_discarded')->exists())->toBeTrue();
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.title', 'Felgen, die an dein Auto dürfen.'));
});

it('discards a never-published article back to an empty form it can still be published from', function (): void {
    $this->actingAs(seitenAdmin(), 'admin')->post('/admin/seiten', ['title' => 'Neu im Ratgeber']);
    $guide = seite('neu-im-ratgeber');
    $written = PageSchema::normalise(PageSchema::for($guide) ?? [], $guide->draft ?? [], PageContent::live($guide));
    $written['blocks'][0]['data']['teaser'] = 'Angefangen.';
    entwurf($guide, $written);

    seitenAktion('DELETE', '/admin/seiten/'.$guide->id.'/entwurf', $guide)->assertSessionHas('toast', SeitenController::DRAFT_DISCARDED_UNPUBLISHED);

    $draft = $guide->refresh()->draft;
    expect(array_column($draft['blocks'] ?? [], 'type'))->toBe(['guide_lead', 'prose'])
        ->and($draft['blocks'][0]['data']['teaser'] ?? null)->toBe('');

    $filled = $draft;
    $filled['blocks'][0]['data']['teaser'] = 'Worum es geht.';
    $filled['blocks'][1]['data'] = ['heading' => 'Abschnitt', 'text' => 'Text.'];
    veroeffentlichen($guide, $filled)->assertSessionHasNoErrors();

    // Born in the admin: there was no earlier wording, so no „Ausgangsstand".
    expect(PageRevision::query()->where('page_id', $guide->id)->pluck('note')->all())->toBe([null]);
});

it('loads an old version into the draft, never straight into the shop', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'Zweite Fassung';
    veroeffentlichen($home, $content);

    $first = PageRevision::query()->where('page_id', $home->id)->orderBy('id')->firstOrFail();

    seitenAktion('POST', '/admin/seiten/'.$home->id.'/versionen/'.$first->id, $home)->assertRedirect();

    expect($home->refresh()->draft['blocks'][0]['data']['headline'] ?? null)->toBe('Felgen, die an dein Auto dürfen.');
    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page->where('hero.title', 'Zweite Fassung'));

    // A version of another page is not this page's to load.
    $impressum = seite('impressum');
    seitenAktion('POST', '/admin/seiten/'.$impressum->id.'/versionen/'.$first->id, $impressum)->assertNotFound();
});

it('withdraws a Ratgeber article from the shop, and nothing else', function (): void {
    $guide = seite('hsn-und-tsn-finden');

    seitenAktion('POST', '/admin/seiten/'.$guide->id.'/zurueckziehen', $guide)->assertRedirect();
    $this->get('/ratgeber/hsn-und-tsn-finden')->assertNotFound();

    $impressum = seite('impressum');
    seitenAktion('POST', '/admin/seiten/'.$impressum->id.'/zurueckziehen', $impressum)->assertSessionHasErrors(['page']);
    expect(seite('impressum')->isPublished())->toBeTrue();
});

it('will not withdraw an article a menu still leads to', function (): void {
    $guide = seite('hsn-und-tsn-finden');
    NavItem::query()->where('menu', 'footer_service')->where('label', 'Versand')->update(['href' => '/ratgeber/hsn-und-tsn-finden', 'route_name' => null]);

    seitenAktion('POST', '/admin/seiten/'.$guide->id.'/zurueckziehen', $guide)
        ->assertSessionHasErrors(['page' => 'Der Artikel steht noch im Menü „Fußzeile · Service“. Nimm ihn dort unter Navigation zuerst heraus, sonst führt der Eintrag ins Leere.']);

    expect($guide->refresh()->isPublished())->toBeTrue();
});

it('creates a Ratgeber article from a title, unpublished until it is published', function (): void {
    $response = $this->actingAs(seitenAdmin(), 'admin')->post('/admin/seiten', ['title' => 'ET richtig lesen']);

    $guide = seite('et-richtig-lesen');
    $response->assertRedirect('/admin/seiten/'.$guide->id);

    expect($guide->kind)->toBe(Page::KIND_GUIDE)->and($guide->isPublished())->toBeFalse();
    $this->get('/ratgeber/et-richtig-lesen')->assertNotFound();

    // The same title again would be the same address.
    $this->actingAs(seitenAdmin(), 'admin')->from('/admin/seiten')->post('/admin/seiten', ['title' => 'ET richtig lesen'])
        ->assertSessionHasErrors(['slug']);

    // An empty lead and section wait in the draft; the publish check names them.
    veroeffentlichen($guide, PageSchema::normalise(PageSchema::for($guide) ?? [], $guide->draft ?? [], PageContent::live($guide)))
        ->assertSessionHasErrors(['blocks.0.data.teaser', 'blocks.1.data.heading', 'blocks.1.data.text']);
});

it('shows the draft in the real shop behind a signed link that expires, framable by us alone', function (): void {
    $home = seite('startseite');
    $content = seitenInhalt($home);
    $content['blocks'][0]['data']['headline'] = 'So sieht der Entwurf aus';
    entwurf($home, $content);
    auth('admin')->logout();

    $this->get('/vorschau/seite/'.$home->id.'?geraet=desktop')->assertForbidden();

    $signed = URL::temporarySignedRoute('vorschau.seite', now()->addHour(), ['page' => $home->id, 'geraet' => 'desktop']);

    $this->get($signed)
        ->assertOk()
        ->assertHeader('X-Frame-Options', 'SAMEORIGIN')
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Startseite/Desktop')
            ->where('hero.title', 'So sieht der Entwurf aus')
            // No cookie sheet over the words, and nothing optional allowed in its place.
            ->where('consent.statistics', false));

    expect((string) $this->get($signed)->headers->get('Content-Security-Policy'))->toContain("frame-ancestors 'self'");

    $handy = URL::temporarySignedRoute('vorschau.seite', now()->addHour(), ['page' => $home->id, 'geraet' => 'handy']);
    $this->get($handy)->assertInertia(fn (AssertableInertia $page) => $page->component('Startseite/Mobile')->where('isMobile', true));

    // Everything else still refuses every frame, and the shop still shows the live words.
    $this->get('/')->assertHeader('X-Frame-Options', 'DENY')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('hero.title', 'Felgen, die an dein Auto dürfen.'));

    $this->travel(2)->hours();
    $this->get($signed)->assertForbidden();
});

it('previews an article that is not published yet', function (): void {
    $this->actingAs(seitenAdmin(), 'admin')->post('/admin/seiten', ['title' => 'Reifendruck nach dem Wechsel']);
    $guide = seite('reifendruck-nach-dem-wechsel');

    $signed = URL::temporarySignedRoute('vorschau.seite', now()->addHour(), ['page' => $guide->id, 'geraet' => 'desktop']);

    $this->get($signed)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Ratgeber/Desktop')
        ->where('guide.title', 'Reifendruck nach dem Wechsel'));
});

it('never lets a release write the seeded copy over a page the team has taken over', function (): void {
    $impressum = seite('impressum');
    $content = seitenInhalt($impressum);
    $content['blocks'][0]['data']['text'] = 'Der Text der Kanzlei.';
    $content['blocks'][] = ['type' => 'legal_body', 'data' => ['heading' => 'Haftung', 'text' => 'Ein zweiter Abschnitt.']];
    veroeffentlichen($impressum, $content)->assertSessionHasNoErrors();

    $guide = seite('hsn-und-tsn-finden');
    seitenAktion('POST', '/admin/seiten/'.$guide->id.'/zurueckziehen', $guide)->assertSessionHasNoErrors();

    // A page nobody touched, changed by hand: the seed must bring it back.
    $datenschutz = seite('datenschutz');
    DB::table('page_blocks')->where('page_id', $datenschutz->id)->update(['data' => json_encode(['text' => 'x'])]);

    $this->seed(ContentSeeder::class);

    expect(array_column(array_column(PageContent::live($impressum->refresh())['blocks'], 'data'), 'text'))
        ->toBe(['Der Text der Kanzlei.', 'Ein zweiter Abschnitt.'])
        ->and(seite('hsn-und-tsn-finden')->isPublished())->toBeFalse()
        ->and($datenschutz->refresh()->blocks()->first()?->data['placeholder'] ?? null)->toBeTrue();
});
