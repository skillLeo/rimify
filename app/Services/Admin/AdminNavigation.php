<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\ConflictStatus;
use App\Enums\OrderStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * The admin rail's tree, built on the server and shipped in the first Inertia response.
 *
 * Two rules decide whether a reader sees an item, and both must hold:
 *
 *   1. **The role may open it.** An item a role cannot reach is not rendered — never disabled,
 *      never a dead link, never a 403 after a click (docs/admin/BRIEF.md §1). A disabled row still
 *      tells somebody a capability exists; absence tells them nothing, which is the point.
 *   2. **The page exists.** docs/admin/INVENTORY.md checked every page in the brief against the
 *      schema. A navigation entry that opens an empty shell is the same dead link, only slower to
 *      discover — so the tree below is written ahead of the build and BUILT is the gate.
 *
 * Adding a page later is one line in BUILT, not a redesign: that is why the tree is data here and
 * not markup in the layout.
 */
final class AdminNavigation
{
    /**
     * Every group, in the order the client's team works: the day's business first, the system last.
     *
     * `module` is the permission module the group's pages need at `View`; null means every signed-in
     * admin. A page may name its own `module` where it belongs to another area than its neighbours
     * (the Protokoll sits with the team but is the audit log's). `count` names a live figure the row
     * carries; only a queue of work whose goal is zero earns one (admin-shell.md §5.6). A group with
     * exactly one visible page IS that page in the rail.
     *
     * Every page has its own glyph, so the collapsed rail — icons only — never shows two rows alike.
     *
     * @var list<array{key: string, label: string, icon: string, module: string|null, pages: list<array{label: string, href: string, icon: string, count?: string, module?: string}>}>
     */
    private const GROUPS = [
        [
            'key' => 'uebersicht',
            'label' => 'Übersicht',
            'icon' => 'grid',
            'module' => null,
            'pages' => [
                ['label' => 'Übersicht', 'href' => '/admin', 'icon' => 'grid'],
            ],
        ],
        [
            'key' => 'verkauf',
            'label' => 'Verkauf',
            'icon' => 'cart',
            'module' => PermissionModule::Orders->value,
            'pages' => [
                ['label' => 'Bestellungen', 'href' => '/admin/bestellungen', 'icon' => 'cart', 'count' => 'orders_open'],
                ['label' => 'Kunden', 'href' => '/admin/kunden', 'icon' => 'home'],
                // Customers asking to be told when a document for their car arrives. The goal of the
                // team's work is to have told all of them, so it is a queue and earns a count. Not
                // "Benachrichtigungen": that word belongs to the team's own bell. The list is
                // Gutachten work, so it asks for the Gutachten right, not the orders one.
                ['label' => 'Anfragen', 'href' => '/admin/anfragen', 'icon' => 'mail', 'count' => 'notify_open', 'module' => PermissionModule::Approvals->value],
            ],
        ],
        [
            'key' => 'katalog',
            'label' => 'Katalog',
            'icon' => 'box',
            'module' => PermissionModule::Catalogue->value,
            'pages' => [
                ['label' => 'Felgen', 'href' => '/admin/felgen', 'icon' => 'wheel'],
                ['label' => 'Reifen', 'href' => '/admin/reifen', 'icon' => 'ruler'],
                ['label' => 'Marken', 'href' => '/admin/marken', 'icon' => 'box'],
                ['label' => 'Bestände', 'href' => '/admin/bestaende', 'icon' => 'truck'],
            ],
        ],
        [
            'key' => 'gutachten',
            'label' => 'Gutachten',
            'icon' => 'document',
            'module' => PermissionModule::Approvals->value,
            'pages' => [
                ['label' => 'Dokumente', 'href' => '/admin/gutachten', 'icon' => 'document'],
                ['label' => 'Auflagen-Katalog', 'href' => '/admin/auflagen', 'icon' => 'check'],
                ['label' => 'Abdeckung', 'href' => '/admin/abdeckung', 'icon' => 'check-circle'],
                ['label' => 'Konflikte', 'href' => '/admin/konflikte', 'icon' => 'warning', 'count' => 'conflicts_open'],
            ],
        ],
        [
            'key' => 'fahrzeuge',
            'label' => 'Fahrzeuge',
            'icon' => 'car',
            'module' => PermissionModule::Vehicles->value,
            'pages' => [
                ['label' => 'Fahrzeuge', 'href' => '/admin/fahrzeuge', 'icon' => 'car'],
                ['label' => 'Zur Prüfung', 'href' => '/admin/fahrzeuge/pruefung', 'icon' => 'eye', 'count' => 'vehicles_review'],
            ],
        ],
        [
            'key' => 'inhalte',
            'label' => 'Inhalte',
            'icon' => 'text',
            'module' => PermissionModule::Content->value,
            'pages' => [
                ['label' => 'Seiten', 'href' => '/admin/seiten', 'icon' => 'text'],
                ['label' => 'FAQ', 'href' => '/admin/faq', 'icon' => 'info'],
                ['label' => 'Navigation', 'href' => '/admin/navigation', 'icon' => 'menu'],
                ['label' => 'Medien', 'href' => '/admin/medien', 'icon' => 'camera'],
            ],
        ],
        [
            'key' => 'auswertungen',
            'label' => 'Auswertungen',
            'icon' => 'chart',
            'module' => PermissionModule::Reports->value,
            'pages' => [
                ['label' => 'Verkäufe', 'href' => '/admin/verkaeufe', 'icon' => 'chart'],
                ['label' => 'Suchen ohne Treffer', 'href' => '/admin/suchen-ohne-treffer', 'icon' => 'search'],
                ['label' => 'Fahrzeuge ohne Felgen', 'href' => '/admin/fahrzeuge-ohne-felgen', 'icon' => 'compare'],
                ['label' => 'Gutachten-Lücken', 'href' => '/admin/gutachten-luecken', 'icon' => 'filter'],
            ],
        ],
        [
            'key' => 'einstellungen',
            'label' => 'Einstellungen',
            'icon' => 'settings',
            'module' => PermissionModule::Settings->value,
            'pages' => [
                ['label' => 'Allgemein', 'href' => '/admin/einstellungen', 'icon' => 'settings'],
                // What the extras on a Komplettrad cost: Wuchtgewicht colours and RDKS sensors, two
                // pages behind one item. Prices of the catalogue, so the catalogue's right.
                ['label' => 'Zubehörpreise', 'href' => '/admin/zubehoerpreise', 'icon' => 'wrench', 'module' => PermissionModule::Catalogue->value],
            ],
        ],
        [
            'key' => 'team',
            'label' => 'Team',
            'icon' => 'user',
            'module' => PermissionModule::Roles->value,
            'pages' => [
                ['label' => 'Benutzer', 'href' => '/admin/benutzer', 'icon' => 'user'],
                ['label' => 'Rollen & Rechte', 'href' => '/admin/rollen', 'icon' => 'lock'],
                ['label' => 'Protokoll', 'href' => '/admin/protokoll', 'icon' => 'clock', 'module' => PermissionModule::AuditLog->value],
            ],
        ],
        [
            'key' => 'system',
            'label' => 'System',
            'icon' => 'settings',
            'module' => PermissionModule::Settings->value,
            'pages' => [
                ['label' => 'Warteschlange', 'href' => '/admin/warteschlange', 'icon' => 'sort', 'count' => 'jobs_failed'],
            ],
        ],
    ];

    /**
     * The routes that are built. A page above whose href is not here is not rendered yet.
     *
     * @var list<string>
     */
    public const BUILT = [
        '/admin',
        '/admin/gutachten',
        '/admin/bestellungen',
        '/admin/anfragen',
        '/admin/zubehoerpreise',
        '/admin/benutzer',
        '/admin/rollen',
        '/admin/protokoll',
        '/admin/seiten',
        '/admin/faq',
        '/admin/navigation',
    ];

    /**
     * Counts that mean something broke rather than work waiting. Only these wear `--c-bad`: a
     * number that is merely large is not an alarm, and a rail that cries wolf is one nobody reads.
     *
     * @var list<string>
     */
    private const FAILURES = ['jobs_failed'];

    /**
     * Pages that belong to the panel but not to the rail, so a breadcrumb can still name them.
     *
     * @var array<string, string>
     */
    private const OFF_RAIL = [
        '/admin/profil' => 'Profil',
        '/admin/benachrichtigungen' => 'Benachrichtigungen',
    ];

    /**
     * Rail items that are a row of tabs (AdminSectionTabs) rather than a page: their address leads
     * to the first tab.
     *
     * @var list<string>
     */
    private const TABBED = ['/admin/zubehoerpreise'];

    /**
     * The request attribute a controller sets to name the record it shows — the last breadcrumb on
     * a page beneath the rail (/admin/seiten/7 → Inhalte › Seiten › Impressum).
     */
    public const RECORD = 'admin.record_crumb';

    /**
     * The tree for one admin: groups they may see, holding pages that exist, with their counts.
     *
     * A group whose every page is unbuilt or unpermitted is dropped rather than drawn empty. A count
     * is only queried when the page carrying it is actually in the tree.
     *
     * @return list<array{key: string, label: string, icon: string, pages: list<array{label: string, href: string, icon: string, count: int|null, countTone: string}>}>
     */
    public function for(AdminUser $user): array
    {
        $tree = [];

        foreach (self::GROUPS as $group) {
            $pages = [];

            foreach ($group['pages'] as $page) {
                if (! in_array($page['href'], $this->built(), true)) {
                    continue;
                }

                $module = $page['module'] ?? $group['module'];

                if ($module !== null && ! $this->mayView($user, $module)) {
                    continue;
                }

                $key = $page['count'] ?? null;
                $count = $key === null ? null : $this->count($key);

                $pages[] = [
                    'label' => $page['label'],
                    'href' => $page['href'],
                    // Every item carries its own icon: the collapsed rail is icons with tooltips, one
                    // per page, so a page without one could not be reached with the rail collapsed.
                    'icon' => $page['icon'],
                    // Zero is not a count: a rail that shows `0` is asking to be read as a problem.
                    'count' => $count !== null && $count > 0 ? $count : null,
                    'countTone' => $key !== null && in_array($key, self::FAILURES, true) ? 'bad' : 'neutral',
                ];
            }

            if ($pages === []) {
                continue;
            }

            $tree[] = [
                'key' => $group['key'],
                'label' => $group['label'],
                'icon' => $group['icon'],
                'pages' => $pages,
            ];
        }

        return $tree;
    }

    /**
     * The tree one role would see — "Ansicht als Rolle" on the Rollen & Rechte page — by exactly the
     * rules of for(): only built pages, only modules the role may view. No counts: they are the
     * reader's live queue, not part of what a role is.
     *
     * Read from the role's own cells rather than from an account, so the answer is about the role
     * alone and not about whatever other roles some account happens to hold beside it.
     *
     * @return list<array{key: string, label: string, icon: string, pages: list<array{label: string, href: string, icon: string, count: null, countTone: string}>}>
     */
    public function forRole(int $roleId): array
    {
        $viewable = DB::table('role_permissions')
            ->where('role_id', $roleId)
            ->where('action', PermissionAction::View->value)
            ->where('allowed', true)
            ->pluck('module')
            ->map(static fn (mixed $module): string => (string) $module)
            ->all();

        $tree = [];

        foreach (self::GROUPS as $group) {
            $pages = [];

            foreach ($group['pages'] as $page) {
                if (! in_array($page['href'], $this->built(), true)) {
                    continue;
                }

                $module = $page['module'] ?? $group['module'];

                if ($module !== null && ! in_array($module, $viewable, true)) {
                    continue;
                }

                $pages[] = [
                    'label' => $page['label'],
                    'href' => $page['href'],
                    'icon' => $page['icon'],
                    'count' => null,
                    'countTone' => 'neutral',
                ];
            }

            if ($pages === []) {
                continue;
            }

            $tree[] = [
                'key' => $group['key'],
                'label' => $group['label'],
                'icon' => $group['icon'],
                'pages' => $pages,
            ];
        }

        return $tree;
    }

    /**
     * Where the reader is, as the topbar shows it: the group, then the page.
     *
     * The group is a label, not a link — it is not a page, and a crumb that goes nowhere is a dead
     * link. The current page is never a link either. A single-page group is just its page, so the
     * rail's Übersicht does not read "Übersicht › Übersicht".
     *
     * @param  list<array<string, mixed>>  $tree
     * @return list<array{label: string, href: string|null}>
     */
    public function breadcrumbs(array $tree, string $path, ?string $record = null): array
    {
        $path = rtrim($path, '/') === '' ? '/' : rtrim($path, '/');

        foreach ($tree as $group) {
            /** @var list<array{label: string, href: string}> $pages */
            $pages = $group['pages'];

            foreach ($pages as $page) {
                if ($page['href'] !== $path) {
                    continue;
                }

                if (count($pages) === 1 && $page['label'] === $group['label']) {
                    return [['label' => $page['label'], 'href' => null]];
                }

                return [
                    ['label' => (string) $group['label'], 'href' => null],
                    ['label' => $page['label'], 'href' => null],
                ];
            }
        }

        // One record beneath a rail page (/admin/seiten/7): the page becomes the way back, and the
        // record — named by its controller (RECORD) — is where the reader is.
        foreach ($tree as $group) {
            /** @var list<array{label: string, href: string}> $pages */
            $pages = $group['pages'];

            foreach ($pages as $page) {
                if ($page['href'] === '/admin' || ! str_starts_with($path, $page['href'].'/')) {
                    continue;
                }

                $crumbs = [
                    ['label' => (string) $group['label'], 'href' => null],
                    // An item whose pages are tabs has no page of its own — its address only leads to
                    // the first tab — so its crumb is a label, like the group's.
                    ['label' => $page['label'], 'href' => in_array($page['href'], self::TABBED, true) ? null : $page['href']],
                ];

                if ($record !== null && $record !== '') {
                    $crumbs[] = ['label' => $record, 'href' => null];
                }

                return $crumbs;
            }
        }

        if (isset(self::OFF_RAIL[$path])) {
            return [['label' => self::OFF_RAIL[$path], 'href' => null]];
        }

        return [];
    }

    /**
     * One figure, or null when it cannot be computed. Failing closed applies to counts too: a
     * number that could not be worked out is not rendered, never shown as a guess or a zero.
     */
    private function count(string $key): ?int
    {
        try {
            return match ($key) {
                // Paid and not yet sent: work whose goal is zero.
                'orders_open' => DB::table('orders')
                    ->whereIn('status', array_map(static fn (OrderStatus $s): string => $s->value, OrderStatus::open()))
                    ->count(),
                'conflicts_open' => DB::table('fitment_conflicts')
                    ->where('status', ConflictStatus::Open->value)
                    ->count(),
                // Confirmed, still subscribed, not yet told: customers waiting on a document.
                'notify_open' => DB::table('fitment_subscriptions')
                    ->whereNotNull('confirmed_at')
                    ->whereNull('unsubscribed_at')
                    ->whereNull('notified_at')
                    ->count(),
                'jobs_failed' => DB::table('failed_jobs')->count(),
                default => null,
            };
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * The built routes, as a list that grows rather than a fixed fact: every step of the rebuild
     * adds to it, and the rail's rules — counts, tones — are written for the pages to come as well
     * as for the ones already here.
     *
     * @return list<string>
     */
    private function built(): array
    {
        return self::BUILT;
    }

    private function mayView(AdminUser $user, string $module): bool
    {
        $case = PermissionModule::tryFrom($module);

        return $case !== null && $user->may($case, PermissionAction::View);
    }
}
