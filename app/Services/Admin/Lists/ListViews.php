<?php

declare(strict_types=1);

namespace App\Services\Admin\Lists;

use App\Enums\PermissionAction;
use App\Models\AdminUser;
use App\Models\SavedView;
use Illuminate\Support\Facades\DB;

/**
 * What a list page needs for its Gespeicherte Ansichten and its Spaltenwahl, in one prop.
 *
 * A view is active while the URL names it (`?ansicht=12`) and the person may see it; it reads as
 * changed once the filters on screen are no longer the ones it keeps — then it can be saved over or
 * set back. The columns are the person's own choice for this list, stored with their preferences
 * and drawn by the server, so the first frame already has them.
 *
 * @phpstan-import-type Column from AdminLists
 *
 * @phpstan-type ViewItem array{id: int, name: string, href: string, mine: bool, sharedWith: string|null, roleId: int|null, owner: string|null}
 * @phpstan-type ViewProps array{items: list<ViewItem>, active: int|null, missing: bool, modified: bool, shareOptions: list<array{id: int, label: string}>, canSave: bool, limit: int}
 * @phpstan-type ColumnProps array{all: list<array{key: string, label: string, required: bool}>, shown: list<string>, defaults: list<string>}
 */
final class ListViews
{
    /**
     * @param  array<string, string>  $canonical  the list's canonical query in force
     * @return array{views: ViewProps, columns: ColumnProps}
     */
    public function for(AdminUser $user, string $list, array $canonical, ?int $activeId): array
    {
        $spec = AdminLists::get($list);

        if ($spec === null) {
            return ['views' => ['items' => [], 'active' => null, 'missing' => false, 'modified' => false, 'shareOptions' => [], 'canSave' => false, 'limit' => SavedView::MAX_PER_LIST], 'columns' => ['all' => [], 'shown' => [], 'defaults' => []]];
        }

        $views = SavedView::query()
            ->visibleTo($user, $list)
            ->with(['owner:id,name', 'role:id,name,label_de'])
            // Own views first, in the order they were made; then those shared with the person, by name.
            ->orderByRaw('CASE WHEN admin_user_id = ? THEN 0 ELSE 1 END', [$user->id])
            ->orderBy('id')
            ->get();

        $active = $activeId === null ? null : $views->firstWhere('id', $activeId);
        $mine = $views->where('admin_user_id', $user->id)->count();

        $items = $views->map(fn (SavedView $view): array => [
            'id' => $view->id,
            'name' => $view->name,
            'href' => self::href($spec['path'], $view->query, $view->id),
            'mine' => $view->admin_user_id === $user->id,
            'sharedWith' => $view->role_id === null ? null : self::roleLabel($view->role),
            // For the owner's „Umbenennen und teilen“: the role it is shared with now.
            'roleId' => $view->admin_user_id === $user->id ? $view->role_id : null,
            'owner' => $view->admin_user_id === $user->id ? null : $view->owner?->name,
        ])->values()->all();

        $preferences = is_array($user->preferences) ? $user->preferences : [];
        $chosen = is_array($preferences['columns'] ?? null) ? ($preferences['columns'][$list] ?? null) : null;

        return [
            'views' => [
                'items' => $items,
                'active' => $active?->id,
                // A link to a view that is gone (deleted, no longer shared): the page says so.
                'missing' => $activeId !== null && $active === null,
                'modified' => $active !== null && self::normalise($active->query) !== self::normalise($canonical),
                'shareOptions' => $this->shareOptions($spec['module']->value),
                'canSave' => $mine < SavedView::MAX_PER_LIST,
                'limit' => SavedView::MAX_PER_LIST,
            ],
            'columns' => [
                'all' => array_map(static fn (array $c): array => ['key' => $c['key'], 'label' => $c['label'], 'required' => $c['required']], $spec['columns']),
                'shown' => AdminLists::columns($list, $chosen),
                // „Standard wiederherstellen“ in the chooser.
                'defaults' => AdminLists::columns($list, null),
            ],
        ];
    }

    /**
     * The roles a view of this list may be shared with: those that may open it. Sharing a view with
     * a role that cannot see the list would hand out a link that is refused.
     *
     * @return list<array{id: int, label: string}>
     */
    public function shareOptions(string $module): array
    {
        return DB::table('roles')
            ->join('role_permissions as rp', 'rp.role_id', '=', 'roles.id')
            ->where('roles.guard_name', 'admin')
            ->where('rp.module', $module)
            ->where('rp.action', PermissionAction::View->value)
            ->where('rp.allowed', true)
            ->orderBy('roles.label_de')
            ->orderBy('roles.name')
            ->get(['roles.id', 'roles.name', 'roles.label_de'])
            ->map(static fn (object $role): array => [
                'id' => (int) $role->id,
                'label' => is_string($role->label_de) && $role->label_de !== '' ? $role->label_de : (string) $role->name,
            ])
            ->values()
            ->all();
    }

    /**
     * A view's link: its list with its query, and the view named so the page marks it.
     *
     * @param  array<string, string>  $query
     */
    public static function href(string $path, array $query, int $id): string
    {
        return $path.'?'.http_build_query([...self::normalise($query), 'ansicht' => (string) $id]);
    }

    /**
     * A query as a view keeps it: the list's keys only (the page and the view itself left out),
     * sorted, so two orders of the same filters compare equal.
     *
     * @param  array<array-key, mixed>  $query
     * @return array<string, string>
     */
    public static function normalise(array $query): array
    {
        $clean = [];

        foreach ($query as $key => $value) {
            if (is_string($key) && is_scalar($value) && ! in_array($key, ['seite', 'ansicht'], true)) {
                $clean[$key] = (string) $value;
            }
        }

        ksort($clean);

        return $clean;
    }

    private static function roleLabel(mixed $role): ?string
    {
        if (! is_object($role)) {
            return null;
        }

        $label = $role->label_de ?? null;

        return is_string($label) && $label !== '' ? $label : (is_string($role->name ?? null) ? $role->name : null);
    }
}
