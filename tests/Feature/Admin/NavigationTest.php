<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\NavigationController;
use App\Http\Requests\Admin\NavItemRequest;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\NavItem;
use App\Services\Admin\AuditDescriber;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/**
 * Inhalte › Navigation. A menu is on every page and has no draft, so what matters: a change shows
 * on the next page (the menu cache is cleared), no target can leave the shop, the menus never show
 * more than they hold, Impressum and Datenschutz stay reachable, every change takes the right to
 * publish, and a release never writes the seeded menus over the team's.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

function navAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

function navItem(string $menu, string $label): NavItem
{
    return NavItem::query()->where('menu', $menu)->where('label', $label)->firstOrFail();
}

/** @return array<string, mixed> */
function navPayload(NavItem $item, array $overrides = []): array
{
    // The overrides on the left: `+` keeps the left-hand value of a key both sides have.
    return $overrides + [
        'label' => $item->label,
        'target' => $item->targetKey(),
        'icon' => $item->icon,
        'visible' => $item->visible,
    ];
}

/** @return list<string> */
function shopMenu(string $menu): array
{
    $page = test()->get('/faq')->viewData('page');

    return array_column($page['props']['menus'][$menu] ?? [], 'label');
}

it('lists the five menus with their entries, limits and the targets on offer', function (): void {
    $this->actingAs(navAdmin(), 'admin')->get('/admin/navigation')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Navigation/Index')
            ->has('menus', 5)
            ->where('menus.0.key', 'header')
            ->where('menus.4.key', 'mobile_bottom')
            ->where('menus.4.icon', true)
            ->where('menus.4.maxVisible', 5)
            ->where('menus.3.items.0.label', 'Impressum')
            ->where('menus.3.items.0.locked', true)
            ->where('can.edit', true));
});

it('renames an entry and the shop shows it on the very next page, despite the menu cache', function (): void {
    expect(shopMenu('header'))->toContain('Kontakt');

    $item = navItem('header', 'Kontakt');
    $this->actingAs(navAdmin(), 'admin')->put('/admin/navigation/'.$item->id, navPayload($item, ['label' => 'Hilfe']))
        ->assertRedirect()->assertSessionHasNoErrors();

    expect(shopMenu('header'))->toContain('Hilfe')->not->toContain('Kontakt');

    $entry = AuditLog::query()->where('description', 'nav.updated')->sole();
    expect((new AuditDescriber)->describe($entry)['sentence'])->toBe('Im Menü „Kopfzeile“ wurde der Eintrag „Kontakt“ geändert.');
});

it('never stores a target that is not one of the shop\'s own pages', function (string $target): void {
    $item = navItem('header', 'Häufige Fragen');

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->put('/admin/navigation/'.$item->id, navPayload($item, ['target' => $target]))
        ->assertSessionHasErrors(['target']);

    expect($item->refresh()->route_name)->toBe('faq');
})->with([
    'another site' => 'page:https://example.test/',
    'a script' => 'page:javascript:alert(1)',
    'a route not on the list' => 'route:admin.uebersicht',
    'a path not on the list' => 'page:/admin',
]);

it('points an entry at a Ratgeber article from Inhalte › Seiten', function (): void {
    $item = navItem('footer_service', 'Versand');

    $this->actingAs(navAdmin(), 'admin')
        ->put('/admin/navigation/'.$item->id, navPayload($item, ['label' => 'HSN und TSN', 'target' => 'page:/ratgeber/hsn-und-tsn-finden']))
        ->assertSessionHasNoErrors();

    expect($item->refresh()->href)->toBe('/ratgeber/hsn-und-tsn-finden')->and($item->route_name)->toBeNull();
});

it('keeps Impressum and Datenschutz reachable: they can move, but not hide, change or go', function (): void {
    $impressum = navItem('footer_legal', 'Impressum');

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->put('/admin/navigation/'.$impressum->id, navPayload($impressum, ['visible' => false]))
        ->assertSessionHasErrors(['target' => NavItemRequest::LOCKED_REFUSAL]);

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->put('/admin/navigation/'.$impressum->id, navPayload($impressum, ['target' => 'page:/rechtliches/agb']))
        ->assertSessionHasErrors(['target']);

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->delete('/admin/navigation/'.navItem('footer_legal', 'Datenschutz')->id)
        ->assertSessionHasErrors(['item' => NavItemRequest::LOCKED_REFUSAL]);

    // Moving is fine.
    $ids = NavItem::query()->where('menu', 'footer_legal')->orderByDesc('sort_order')->pluck('id')->all();
    $this->actingAs(navAdmin(), 'admin')->put('/admin/navigation/reihenfolge', ['menu' => 'footer_legal', 'ids' => $ids])->assertSessionHasNoErrors();

    expect($impressum->refresh()->visible)->toBeTrue()
        ->and(shopMenu('footer_legal'))->toContain('Impressum')->toContain('Datenschutz');
});

it('never shows more entries than a menu has room for, and the phone bar needs a glyph', function (): void {
    // The phone bar already shows its five.
    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')->post('/admin/navigation', [
        'menu' => 'mobile_bottom', 'label' => 'Ratgeber', 'target' => 'route:faq', 'icon' => 'info', 'visible' => true,
    ])->assertSessionHasErrors(['visible']);

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')->post('/admin/navigation', [
        'menu' => 'mobile_bottom', 'label' => 'Ratgeber', 'target' => 'route:faq', 'icon' => null, 'visible' => false,
    ])->assertSessionHasErrors(['icon']);

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')->post('/admin/navigation', [
        'menu' => 'mobile_bottom', 'label' => 'Zu langer Name', 'target' => 'route:faq', 'icon' => 'info', 'visible' => false,
    ])->assertSessionHasErrors(['label']);

    // Hidden, with a glyph and a short name: fine.
    $this->actingAs(navAdmin(), 'admin')->post('/admin/navigation', [
        'menu' => 'mobile_bottom', 'label' => 'Fragen', 'target' => 'route:faq', 'icon' => 'info', 'visible' => false,
    ])->assertSessionHasNoErrors();

    expect(NavItem::query()->where('menu', 'mobile_bottom')->count())->toBe(6)
        ->and(NavItem::query()->where('menu', 'mobile_bottom')->where('visible', true)->count())->toBe(5);
});

it('shows or hides an entry by its visibility alone, within the legal floor and the menu\'s room', function (): void {
    $check = navItem('mobile_bottom', 'Check');

    // Meanwhile a colleague renamed it; this list still holds the old name.
    $check->forceFill(['label' => 'Prüfen'])->save();

    $this->actingAs(navAdmin(), 'admin')->patch('/admin/navigation/'.$check->id.'/sichtbarkeit', ['visible' => false])->assertSessionHasNoErrors();
    expect($check->refresh()->visible)->toBeFalse()->and($check->label)->toBe('Prüfen');

    // The bar holds five: a sixth visible entry is refused.
    NavItem::query()->create(['menu' => 'mobile_bottom', 'label' => 'Fragen', 'route_name' => 'faq', 'icon' => 'info', 'sort_order' => 90, 'visible' => true]);
    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->patch('/admin/navigation/'.$check->id.'/sichtbarkeit', ['visible' => true])
        ->assertSessionHasErrors(['item']);

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->patch('/admin/navigation/'.navItem('footer_legal', 'Impressum')->id.'/sichtbarkeit', ['visible' => false])
        ->assertSessionHasErrors(['item' => NavItemRequest::LOCKED_REFUSAL]);
});

it('offers no article that is not on the shop as a target', function (): void {
    $this->actingAs(navAdmin(), 'admin')->post('/admin/seiten', ['title' => 'Noch nicht fertig']);
    $item = navItem('footer_service', 'Versand');

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->put('/admin/navigation/'.$item->id, navPayload($item, ['target' => 'page:/ratgeber/noch-nicht-fertig']))
        ->assertSessionHasErrors(['target']);

    $this->actingAs(navAdmin(), 'admin')->get('/admin/navigation')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('targets', fn ($targets) => collect($targets)->pluck('value')->doesntContain('page:/ratgeber/noch-nicht-fertig')));
});

it('keeps at least one entry in a menu', function (): void {
    $items = NavItem::query()->where('menu', 'footer_shop')->get();

    foreach ($items->slice(1) as $item) {
        $this->actingAs(navAdmin(), 'admin')->delete('/admin/navigation/'.$item->id)->assertSessionHasNoErrors();
    }

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->delete('/admin/navigation/'.$items->first()?->id)
        ->assertSessionHasErrors(['item' => NavigationController::LAST_ITEM]);
});

it('takes the right to publish for every change, because every change is live', function (): void {
    $role = (int) DB::table('roles')->where('name', 'content-editor')->value('id');
    DB::table('role_permissions')->where('role_id', $role)->where('module', 'content')->where('action', 'publish')->update(['allowed' => false]);
    $editor = navAdmin('content-editor');
    $item = navItem('header', 'Häufige Fragen');

    $this->actingAs($editor, 'admin')->put('/admin/navigation/'.$item->id, navPayload($item, ['label' => 'Fragen']))->assertForbidden();
    $this->actingAs($editor, 'admin')->delete('/admin/navigation/'.$item->id)->assertForbidden();
    $this->actingAs($editor, 'admin')->put('/admin/navigation/reihenfolge', [
        'menu' => 'header', 'ids' => NavItem::query()->where('menu', 'header')->pluck('id')->all(),
    ])->assertForbidden();

    $this->actingAs($editor, 'admin')->get('/admin/navigation')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('can.edit', false)->where('can.create', false));

    $this->actingAs(navAdmin('support-agent'), 'admin')->get('/admin/navigation')->assertForbidden();
});

it('refuses an order that is out of date rather than half applying it', function (): void {
    $ids = NavItem::query()->where('menu', 'header')->pluck('id')->all();

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->put('/admin/navigation/reihenfolge', ['menu' => 'header', 'ids' => array_slice($ids, 1)])
        ->assertSessionHasErrors(['ids']);

    $this->actingAs(navAdmin(), 'admin')->from('/admin/navigation')
        ->put('/admin/navigation/reihenfolge', ['menu' => 'footer_shop', 'ids' => $ids])
        ->assertSessionHasErrors(['ids']);
});

it('never lets a release write the seeded menus over the team\'s', function (): void {
    $item = navItem('header', 'Kontakt');
    $this->actingAs(navAdmin(), 'admin')->put('/admin/navigation/'.$item->id, navPayload($item, ['label' => 'Hilfe']));
    $this->actingAs(navAdmin(), 'admin')->delete('/admin/navigation/'.navItem('header', 'Häufige Fragen')->id);

    $this->seed(ContentSeeder::class);

    expect(NavItem::query()->where('menu', 'header')->pluck('label')->all())->toBe(['Felgen', 'RIMIFY-Check', 'Hilfe'])
        // A menu nobody touched still follows the seed.
        ->and(NavItem::query()->where('menu', 'footer_legal')->count())->toBe(4);
});
