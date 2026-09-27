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
 * A view is active while the URL names it (`?ansicht=12`) and the person may see it. Each view goes
 * out with the query it keeps, so the page itself tells when the filters on screen are no longer
 * the view's (normalizeViewState on both sides — SV-13: `1000` and `1.000` are one amount).
 *
 * The columns are the person's own choice for this list, stored with their preferences and drawn by
 * the server, so the first frame already has them. A view saved with „Spalten mitspeichern“ carries
 * its own set, which the page shows while the view is open — the same for everyone it is shared with.
 *
 * @phpstan-import-type Column from AdminLists
 *
 * @phpstan-type ViewItem array{id: int, name: string, href: string, query: array<string, string>, storesColumns: bool, columns: list<string>|null, mine: bool, sharedWith: string|null, roleId: int|null, owner: string|null}
 * @phpstan-type ViewProps array{items: list<ViewItem>, active: int|null, missing: bool, shareOptions: list<array{id: int, label: string}>, canSave: bool, limit: int}
 * @phpstan-type ColumnProps array{all: list<array{key: string, label: string, required: bool}>, shown: list<string>, defaults: list<string>}
 */
final class ListViews
{
    /** @return array{views: ViewProps, columns: ColumnProps} */
    public function for(AdminUser $user, string $list, ?int $activeId): array
    {
        $spec = AdminLists::get($list);

        if ($spec === null) {
            return ['views' => ['items' => [], 'active' => null, 'missing' => false, 'shareOptions' => [], 'canSave' => false, 'limit' => SavedView::MAX_PER_LIST], 'columns' => ['all' => [], 'shown' => [], 'defaults' => []]];
        }

        $views = SavedView::query()
            ->visibleTo($user, $list)
            ->with(['owner:id,name', 'role:id,name,label_de'])
            // Own views first, in the order they were made; then those shared with the person, by name.
            ->orderByRaw('CASE WHEN admin_user_id = ? THEN 0 ELSE 1 END', [$user->id])
            ->orderByRaw('CASE WHEN admin_user_id = ? THEN id END', [$user->id])
            ->orderBy('name')
            ->orderBy('id')
            ->get();

        $active = $activeId === null ? null : $views->firstWhere('id', $activeId);
        $mine = $views->where('admin_user_id', $user->id)->count();

        $items = $views->map(fn (SavedView $view): array => [
            'id' => $view->id,
            'name' => $view->name,
            'href' => self::href($spec['path'], $view->query, $view->id),
            // What the page compares the filters on screen with, to say „geändert“.
            'query' => self::normalise($view->query),
            'storesColumns' => $view->stores_columns,
            // Through the list's own columns: a column the list no longer has drops out, the required stays.
            'columns' => $view->stores_columns ? AdminLists::columns($list, $view->columns) : null,
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
