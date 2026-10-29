<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\RatgeberController;
use App\Http\Controllers\Admin\SeitenController;
use App\Http\Requests\Admin\GuideStoreRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\NavItem;
use App\Models\Page;
use App\Models\PageRevision;
use App\Services\Admin\AdminNavigation;
use App\Services\Content\PageChangedMeanwhile;
use App\Services\Content\PageContent;
use App\Services\Content\PageSchema;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;

/*
 * His admin item 12, answered (29.10.2026, D-351): „Ratgeber management page in the admin panel should be a separate
 * page instead of a section in the „Seiten“ page.“ Inhalte › Ratgeber lists, searches and sorts the articles, makes
 * them, publishes and withdraws them, deletes them, and opens each in the page editor; „Seiten“ no longer lists them,
 * and an article's old address there leads here. The same rights as before. The shop is unchanged.
 */

beforeEach(function (): void {
    config(['rimify.reset.allowed' => false]);
    $this->seed([CommerceSeeder::class, AccessSeeder::class, ContentSeeder::class]);
});

function ratgeberAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function artikel(string $slug): Page
{
    return Page::withTrashed()->where('slug', $slug)->firstOrFail();
}

/** A write from the list, against the version the list showed. */
function ratgeberAktion(string $method, string $url, Page $page, string $role = 'super-admin', ?int $version = null): TestResponse
{
    return test()->actingAs(ratgeberAdmin($role), 'admin')
        ->from('/admin/ratgeber')
        ->json($method, $url, ['baseVersion' => $version ?? (int) Page::withTrashed()->whereKey($page->id)->value('content_version')], ['X-Requested-With' => 'XMLHttpRequest', 'Accept' => 'text/html']);
}

/** @return list<string> */
function ratgeberTitel(TestResponse $response): array
{
    return array_column($response->viewData('page')['props']['articles'], 'title');
}

it('has its own entry under Inhalte, and lists the articles only — the homepage and the legal texts stay under Seiten', function (): void {
    $guides = Page::query()->where('kind', Page::KIND_GUIDE)->pluck('title')->all();
    $response = $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber')->assertOk();

    $response->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Admin/Ratgeber/Index')
        ->where('total', count($guides))
        ->where('filters', ['q' => '', 'sort' => 'geaendert', 'richtung' => 'ab'])
        ->where('can', ['create' => true, 'publish' => true, 'delete' => true]));

    expect(ratgeberTitel($response))->toEqualCanonicalizing($guides)->not->toContain('Impressum')->not->toContain('Startseite');

    // The rail: Inhalte › Seiten, Ratgeber, FAQ … — its own entry, right after Seiten.
    $inhalte = collect(app(AdminNavigation::class)->for(ratgeberAdmin()))->firstWhere('key', 'inhalte');
    expect(array_slice(array_column($inhalte['pages'], 'href'), 0, 3))->toBe(['/admin/seiten', '/admin/ratgeber', '/admin/faq'])
        ->and(array_column($inhalte['pages'], 'label')[1] ?? null)->toBe('Ratgeber');
});

it('searches title and address, and sorts by a column heading, either way', function (): void {
    $this->actingAs(ratgeberAdmin(), 'admin')->post('/admin/ratgeber', ['title' => 'Aaa zuerst im Alphabet']);
    $this->actingAs(ratgeberAdmin(), 'admin')->post('/admin/ratgeber', ['title' => 'Zzz zuletzt im Alphabet']);

    $found = $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber?q=alphabet')->assertOk();
    expect(ratgeberTitel($found))->toEqualCanonicalizing(['Aaa zuerst im Alphabet', 'Zzz zuletzt im Alphabet']);

    // The address too: hsn-und-tsn-finden is found by a word of its address.
    expect(ratgeberTitel($this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber?q=tsn-finden')))->toBe([artikel('hsn-und-tsn-finden')->title]);

    $up = ratgeberTitel($this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber?sort=titel&richtung=auf'));
    $down = ratgeberTitel($this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber?sort=titel&richtung=ab'));
    expect($up[0])->toBe('Aaa zuerst im Alphabet')->and($down[0])->toBe('Zzz zuletzt im Alphabet')->and($down)->toBe(array_reverse($up));

    // In the shop first, by the day they went live; a new article is not in the shop and stands after them.
    $live = ratgeberTitel($this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber?sort=veroeffentlicht'));
    expect(array_slice($live, -2))->toEqualCanonicalizing(['Aaa zuerst im Alphabet', 'Zzz zuletzt im Alphabet']);

    // The last changed on top by default; an order the list does not know is the default, never an error.
    $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber?sort=drop%20table&richtung=quer')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('filters.sort', 'geaendert')->where('filters.richtung', 'ab'));
    $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber?q='.str_repeat('x', 300))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('filters.q', ''));
});

it('leads an article’s old address under Seiten to its own, and keeps every other page there', function (): void {
    $guide = artikel('hsn-und-tsn-finden');
    $impressum = Page::query()->where('slug', 'impressum')->firstOrFail();

    $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/seiten/'.$guide->id)->assertRedirect('/admin/ratgeber/'.$guide->id)->assertStatus(301);
    $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/seiten?neu=1')->assertRedirect('/admin/ratgeber?neu=1');

    $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber/'.$guide->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Seiten/Bearbeiten')
            ->where('page.group', 'Ratgeber')
            ->where('can.delete', true)
            ->where('admin.breadcrumbs', [
                ['label' => 'Inhalte', 'href' => null],
                ['label' => 'Ratgeber', 'href' => '/admin/ratgeber'],
                ['label' => $guide->title, 'href' => null],
            ]));

    // A legal text is no article: not here, and still under Seiten.
    $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber/'.$impressum->id)->assertNotFound();
    $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/seiten/'.$impressum->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('can.delete', false));
});

it('makes an article from a title and opens it at its own address, unpublished', function (): void {
    $response = $this->actingAs(ratgeberAdmin(), 'admin')->post('/admin/ratgeber', ['title' => 'Felgen richtig lagern']);
    $guide = artikel('felgen-richtig-lagern');

    $response->assertRedirect('/admin/ratgeber/'.$guide->id)->assertSessionHas('toast', SeitenController::CREATED);
    expect($guide->kind)->toBe(Page::KIND_GUIDE)->and($guide->isPublished())->toBeFalse();
    $this->get('/ratgeber/felgen-richtig-lagern')->assertNotFound();
});

it('publishes from the list only what passes the editor’s check, and withdraws it again', function (): void {
    $this->actingAs(ratgeberAdmin(), 'admin')->post('/admin/ratgeber', ['title' => 'Noch leer']);
    $empty = artikel('noch-leer');

    ratgeberAktion('POST', '/admin/ratgeber/'.$empty->id.'/veroeffentlichen', $empty)
        ->assertSessionHasErrors(['article' => '„Noch leer“ '.RatgeberController::INCOMPLETE]);
    expect($empty->refresh()->isPublished())->toBeFalse();

    // A complete article taken off the shop goes live again from the list, with the words it had.
    $guide = artikel('hsn-und-tsn-finden');
    ratgeberAktion('POST', '/admin/seiten/'.$guide->id.'/zurueckziehen', $guide)->assertSessionHasNoErrors();
    $this->get('/ratgeber/hsn-und-tsn-finden')->assertNotFound();

    ratgeberAktion('POST', '/admin/ratgeber/'.$guide->id.'/veroeffentlichen', $guide)
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', SeitenController::PUBLISHED);
    $this->get('/ratgeber/hsn-und-tsn-finden')->assertOk();
});

it('deletes an article: out of the list, the editor and the shop — its published versions kept, its address kept, one Protokoll entry', function (): void {
    $guide = artikel('hsn-und-tsn-finden');
    $versions = PageRevision::query()->where('page_id', $guide->id)->count();

    ratgeberAktion('DELETE', '/admin/ratgeber/'.$guide->id, $guide)
        ->assertRedirect('/admin/ratgeber')
        ->assertSessionHas('toast', RatgeberController::DELETED);

    expect(artikel('hsn-und-tsn-finden')->trashed())->toBeTrue()
        ->and(artikel('hsn-und-tsn-finden')->isPublished())->toBeFalse()
        ->and(PageRevision::query()->where('page_id', $guide->id)->count())->toBe($versions);

    $this->get('/ratgeber/hsn-und-tsn-finden')->assertNotFound();
    $this->get('/blog')->assertInertia(fn (AssertableInertia $page) => $page->where('articles', fn ($articles) => ! collect($articles)->contains('slug', 'hsn-und-tsn-finden')));
    expect((string) $this->get('/sitemap.xml')->getContent())->not->toContain('/ratgeber/hsn-und-tsn-finden');
    expect(ratgeberTitel($this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber')))->not->toContain($guide->title);
    $this->actingAs(ratgeberAdmin(), 'admin')->get('/admin/ratgeber/'.$guide->id)->assertNotFound();

    $entry = AuditLog::query()->where('description', 'page.deleted')->sole();
    expect($entry->properties['slug'] ?? null)->toBe('hsn-und-tsn-finden')->and($entry->properties['was_published'] ?? null)->toBeTrue();

    // A release re-runs the seeder: the deleted article stays deleted, and its address is not handed to a new one.
    $this->seed(ContentSeeder::class);
    expect(artikel('hsn-und-tsn-finden')->trashed())->toBeTrue();
    $this->get('/ratgeber/hsn-und-tsn-finden')->assertNotFound();

    $this->actingAs(ratgeberAdmin(), 'admin')->from('/admin/ratgeber')->post('/admin/ratgeber', ['title' => 'HSN und TSN finden'])
        ->assertSessionHasErrors(['slug' => GuideStoreRequest::DELETED_ADDRESS]);
});

it('refuses to delete an article a menu still leads to, or one changed meanwhile', function (): void {
    $guide = artikel('hsn-und-tsn-finden');
    NavItem::query()->where('menu', 'footer_service')->where('label', 'Versand')->update(['href' => '/ratgeber/hsn-und-tsn-finden', 'route_name' => null]);

    ratgeberAktion('DELETE', '/admin/ratgeber/'.$guide->id, $guide)
        ->assertSessionHasErrors(['article' => 'Der Artikel steht noch im Menü „Fußzeile · Service“. Nimm ihn dort unter Navigation zuerst heraus, sonst führt der Eintrag ins Leere.']);

    // Out of the menu, but asked against a version the article has moved on from: refused as every such write is.
    NavItem::query()->where('href', '/ratgeber/hsn-und-tsn-finden')->update(['visible' => false]);
    ratgeberAktion('DELETE', '/admin/ratgeber/'.$guide->id, $guide, version: (int) $guide->content_version + 5)
        ->assertSessionHasErrors(['article' => PageChangedMeanwhile::MESSAGE]);

    expect(artikel('hsn-und-tsn-finden')->trashed())->toBeFalse()->and(artikel('hsn-und-tsn-finden')->isPublished())->toBeTrue();

    // Against the version it stands at, it goes.
    ratgeberAktion('DELETE', '/admin/ratgeber/'.$guide->id, $guide)->assertRedirect('/admin/ratgeber');
    expect(artikel('hsn-und-tsn-finden')->trashed())->toBeTrue();
});

it('keeps the rights as they were: no content, no Ratgeber; deleting a live article takes the right to publish too', function (): void {
    $guide = artikel('hsn-und-tsn-finden');

    $this->actingAs(ratgeberAdmin('support-agent'), 'admin')->get('/admin/ratgeber')->assertForbidden();
    $this->actingAs(ratgeberAdmin('support-agent'), 'admin')->post('/admin/ratgeber', ['title' => 'Darf nicht'])->assertForbidden();
    ratgeberAktion('DELETE', '/admin/ratgeber/'.$guide->id, $guide, role: 'support-agent')->assertForbidden();
    ratgeberAktion('POST', '/admin/ratgeber/'.$guide->id.'/veroeffentlichen', $guide, role: 'support-agent')->assertForbidden();

    // The content team without the right to publish: a draft it may delete, a live article it may not.
    $role = (int) DB::table('roles')->where('name', 'content-editor')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'content')->where('action', 'publish')->update(['allowed' => false]);

    ratgeberAktion('DELETE', '/admin/ratgeber/'.$guide->id, $guide, role: 'content-editor')->assertForbidden();

    $this->actingAs(ratgeberAdmin('content-editor'), 'admin')->post('/admin/ratgeber', ['title' => 'Nur ein Entwurf']);
    $draft = artikel('nur-ein-entwurf');
    ratgeberAktion('DELETE', '/admin/ratgeber/'.$draft->id, $draft, role: 'content-editor')->assertRedirect('/admin/ratgeber');

    // And without the right to delete: nothing. (The matrix is read once per request; a test's requests share the container.)
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'content')->where('action', 'delete')->update(['allowed' => false]);
    app()->forgetScopedInstances();
    $this->actingAs(ratgeberAdmin('content-editor'), 'admin')->post('/admin/ratgeber', ['title' => 'Bleibt stehen']);
    $kept = artikel('bleibt-stehen');
    ratgeberAktion('DELETE', '/admin/ratgeber/'.$kept->id, $kept, role: 'content-editor')->assertForbidden();
    expect(artikel('bleibt-stehen')->trashed())->toBeFalse()->and(artikel('hsn-und-tsn-finden')->trashed())->toBeFalse();
});

it('leaves the shop as it was: the Blog, an article and the sitemap', function (): void {
    $this->get('/blog')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('articles', fn ($articles) => collect($articles)->contains('slug', 'hsn-und-tsn-finden')));
    $this->get('/ratgeber/hsn-und-tsn-finden')->assertOk();
    expect(PageSchema::for(artikel('hsn-und-tsn-finden')))->not->toBeNull()
        ->and(PageContent::live(artikel('hsn-und-tsn-finden'))['title'] ?? null)->toBe(artikel('hsn-und-tsn-finden')->title);
});
