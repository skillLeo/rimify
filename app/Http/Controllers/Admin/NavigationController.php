<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\NavItemRequest;
use App\Http\Requests\Admin\NavOrderRequest;
use App\Http\Requests\Admin\VisibilityRequest;
use App\Models\AdminUser;
use App\Models\NavItem;
use App\Services\Admin\AuditTrail;
use App\Services\Content\NavigationSchema;
use App\Services\Storefront\Chrome;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Inhalte › Navigation — the shop's menus (docs/admin/inhalte-build-plan.md, "Navigation").
 *
 * Every change is live on every page at once: it clears the storefront's menu cache, stamps the
 * whole menu as the team's (ContentSeeder then leaves it alone) and leaves one Protokoll entry. A
 * menu keeps at least one entry, and Impressum and Datenschutz stay reachable (NavigationSchema).
 */
class NavigationController extends Controller
{
    public const SAVED = 'Gespeichert. Das Menü ist im Shop geändert.';

    public const CREATED = 'Eintrag angelegt.';

    public const DELETED = 'Eintrag gelöscht.';

    public const REORDERED = 'Reihenfolge gespeichert.';

    public const LAST_ITEM = 'Ein Menü braucht mindestens einen Eintrag. Leg zuerst einen anderen an.';

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', NavItem::class);

        $items = NavItem::query()->orderBy('sort_order')->orderBy('id')->get()->groupBy('menu');
        $menus = [];

        foreach (NavigationSchema::MENUS as $key => $menu) {
            $rows = [];

            foreach ($items->get($key, collect()) as $item) {
                /** @var NavItem $item */
                $rows[] = [
                    'id' => (int) $item->id,
                    'label' => $item->label,
                    'target' => $item->targetKey(),
                    'targetLabel' => NavigationSchema::targetLabel($item),
                    'icon' => $item->icon,
                    'visible' => $item->visible,
                    'locked' => NavigationSchema::isLocked($item),
                ];
            }

            $menus[] = ['key' => $key] + $menu + ['items' => $rows];
        }

        $options = [];

        foreach (NavigationSchema::targets() as $value => $label) {
            $options[] = ['value' => $value, 'label' => $label];
        }

        $icons = [];

        foreach (NavigationSchema::ICONS as $value => $label) {
            $icons[] = ['value' => $value, 'label' => $label];
        }

        $admin = self::admin($request);
        $publish = $admin->may(PermissionModule::Content, PermissionAction::Publish);

        return Inertia::render('Admin/Navigation/Index', [
            'menus' => $menus,
            'targets' => $options,
            'icons' => $icons,
            'can' => [
                'create' => $publish && $admin->may(PermissionModule::Content, PermissionAction::Create),
                'edit' => $publish && $admin->may(PermissionModule::Content, PermissionAction::Edit),
                'delete' => $publish && $admin->may(PermissionModule::Content, PermissionAction::Delete),
            ],
        ]);
    }

    public function store(NavItemRequest $request): RedirectResponse
    {
        $attributes = $request->itemAttributes();
        $admin = $request->admin();

        DB::transaction(function () use ($attributes, $admin): void {
            $last = (int) NavItem::query()->where('menu', $attributes['menu'])->max('sort_order');
            $item = NavItem::query()->create($attributes + ['sort_order' => $last + 10, 'team_edited_at' => now()]);

            self::touched($item->menu);
            AuditTrail::record($admin, 'nav.created', ['menu' => $item->menu, 'label' => $item->label], $item);
        });

        return back()->with('toast', self::CREATED);
    }

    public function update(NavItemRequest $request, NavItem $item): RedirectResponse
    {
        $attributes = $request->itemAttributes();
        $admin = $request->admin();

        DB::transaction(function () use ($attributes, $admin, $item): void {
            $before = ['label' => $item->label, 'target' => NavigationSchema::targetLabel($item), 'icon' => $item->icon, 'visible' => $item->visible];

            $item->fill($attributes)->save();

            $after = ['label' => $item->label, 'target' => NavigationSchema::targetLabel($item), 'icon' => $item->icon, 'visible' => $item->visible];

            self::touched($item->menu);
            AuditTrail::record($admin, 'nav.updated', ['menu' => $item->menu, 'label' => $before['label'], 'old' => $before, 'new' => $after], $item);
        });

        return back()->with('toast', self::SAVED);
    }

    public function destroy(Request $request, NavItem $item): RedirectResponse
    {
        $this->authorize('delete', $item);

        if (NavigationSchema::isLocked($item)) {
            return back()->withErrors(['item' => NavItemRequest::LOCKED_REFUSAL]);
        }

        if (NavItem::query()->where('menu', $item->menu)->count() <= 1) {
            return back()->withErrors(['item' => self::LAST_ITEM]);
        }

        $admin = self::admin($request);

        DB::transaction(function () use ($admin, $item): void {
            AuditTrail::record($admin, 'nav.deleted', [
                'menu' => $item->menu,
                'label' => $item->label,
                'target' => NavigationSchema::targetLabel($item),
            ]);

            $item->delete();
            self::touched($item->menu);
        });

        return back()->with('toast', self::DELETED);
    }

    public function reorder(NavOrderRequest $request): RedirectResponse
    {
        $ids = $request->ids();
        $menu = $request->menu();
        $admin = $request->admin();

        DB::transaction(function () use ($ids, $menu, $admin): void {
            foreach ($ids as $index => $id) {
                NavItem::query()->whereKey($id)->update(['sort_order' => ($index + 1) * 10]);
            }

            self::touched($menu);
            AuditTrail::record($admin, 'nav.reordered', ['menu' => $menu, 'count' => count($ids)]);
        });

        return back()->with('toast', self::REORDERED);
    }

    /**
     * Shows or hides one entry — its visibility and nothing else (VisibilityRequest), so a list that
     * is out of date cannot write a colleague's renamed entry back. Impressum and Datenschutz stay
     * visible; a menu never shows more entries than it has room for.
     */
    public function visibility(VisibilityRequest $request, NavItem $item): RedirectResponse
    {
        $visible = $request->visible();

        if (NavigationSchema::isLocked($item) && ! $visible) {
            return back()->withErrors(['item' => NavItemRequest::LOCKED_REFUSAL]);
        }

        $cap = NavigationSchema::MENUS[$item->menu]['maxVisible'] ?? null;

        if ($visible && ! $item->visible && $cap !== null && NavItem::query()->where('menu', $item->menu)->where('visible', true)->count() >= $cap) {
            return back()->withErrors(['item' => 'In der '.NavigationSchema::MENUS[$item->menu]['label'].' ist Platz für höchstens '.$cap.' sichtbare Einträge. Blende zuerst einen anderen aus.']);
        }

        $admin = $request->admin();

        DB::transaction(function () use ($visible, $admin, $item): void {
            $before = $item->visible;
            $item->forceFill(['visible' => $visible])->save();

            self::touched($item->menu);
            AuditTrail::record($admin, 'nav.updated', [
                'menu' => $item->menu,
                'label' => $item->label,
                'old' => ['visible' => $before],
                'new' => ['visible' => $visible],
            ], $item);
        });

        return back()->with('toast', self::SAVED);
    }

    /**
     * After any change: the whole menu is the team's from now on (a release leaves it alone), and
     * the storefront's cached menus are dropped — once the change is committed, or a page rendered
     * in between would put the old menu back in the cache for five minutes.
     */
    private static function touched(string $menu): void
    {
        NavItem::query()->where('menu', $menu)->whereNull('team_edited_at')->update(['team_edited_at' => now()]);
        DB::afterCommit(static fn () => Chrome::forgetMenus());
    }

    private static function admin(Request $request): AdminUser
    {
        $user = $request->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
