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
     * exactly one visible page IS that page in the rail. `short` is the group's label for a rail
     * dragged narrower than 248 px — a word of its own, never a label cut mid-word. `super` marks a
     * page for the Super-Admin role alone, on top of the module right.
     *
     * Every page has its own glyph, so the collapsed rail — icons only — never shows two rows alike.
     *
     * @var list<array{key: string, label: string, short: string, icon: string, module: string|null, review?: bool, pages: list<array{label: string, href: string, icon: string, count?: string, module?: string, super?: bool}>}>
     */
    private const GROUPS = [
        [
            'key' => 'uebersicht',
            'label' => 'Übersicht',
            'short' => 'Übersicht',
            'icon' => 'overview',
            'module' => null,
            'pages' => [
                ['label' => 'Übersicht', 'href' => '/admin', 'icon' => 'overview'],
            ],
        ],
        // The client's review of the admin (the review release §3): only where the review is on.
        [
            'key' => 'review',
            'label' => 'Review',
            'short' => 'Review',
            'icon' => 'check-circle',
            'module' => null,
            'review' => true,
            'pages' => [
                ['label' => 'Stand der Seiten', 'href' => '/admin/review', 'icon' => 'check-circle'],
                ['label' => 'Rückmeldungen', 'href' => '/admin/review/rueckmeldungen', 'icon' => 'feedback', 'count' => 'review_open'],
            ],
        ],
        [
            'key' => 'verkauf',
            'label' => 'Verkauf',
            'short' => 'Verkauf',
            'icon' => 'orders',
            'module' => PermissionModule::Orders->value,
            'pages' => [
                ['label' => 'Bestellungen', 'href' => '/admin/bestellungen', 'icon' => 'orders', 'count' => 'orders_open'],
                ['label' => 'Kunden', 'href' => '/admin/kunden', 'icon' => 'customers'],
                // Customers asking to be told when a document for their car arrives. The goal of the
                // team's work is to have told all of them, so it is a queue and earns a count. Not
                // "Benachrichtigungen": that word belongs to the team's own bell. The list is
                // Gutachten work, so it asks for the Gutachten right, not the orders one.
                ['label' => 'Anfragen', 'href' => '/admin/anfragen', 'icon' => 'inquiries', 'count' => 'notify_open', 'module' => PermissionModule::Approvals->value],
            ],
        ],
        [
            'key' => 'katalog',
            'label' => 'Katalog',
            'short' => 'Katalog',
            'icon' => 'wheels',
            'module' => PermissionModule::Catalogue->value,
            'pages' => [
                ['label' => 'Felgen', 'href' => '/admin/felgen', 'icon' => 'wheels'],
                ['label' => 'Reifen', 'href' => '/admin/reifen', 'icon' => 'tyres'],
                ['label' => 'Marken', 'href' => '/admin/marken', 'icon' => 'brands'],
                ['label' => 'Bestände', 'href' => '/admin/bestaende', 'icon' => 'stock'],
                // A supplier feed into the catalogue: the importer's own right, not the catalogue's.
                ['label' => 'Import', 'href' => '/admin/katalog/import', 'icon' => 'imports', 'module' => PermissionModule::Imports->value],
            ],
        ],
        [
            'key' => 'gutachten',
            'label' => 'Gutachten',
            'short' => 'Gutachten',
            'icon' => 'documents',
            'module' => PermissionModule::Approvals->value,
            'pages' => [
                ['label' => 'Dokumente', 'href' => '/admin/gutachten', 'icon' => 'documents'],
                ['label' => 'Auflagen', 'href' => '/admin/auflagen', 'icon' => 'conditions'],
                ['label' => 'Abdeckung', 'href' => '/admin/abdeckung', 'icon' => 'coverage'],
                ['label' => 'Konflikte', 'href' => '/admin/konflikte', 'icon' => 'conflicts', 'count' => 'conflicts_open'],
            ],
        ],
        [
            'key' => 'fahrzeuge',
            'label' => 'Fahrzeuge',
            'short' => 'Fahrzeuge',
            'icon' => 'vehicles',
            'module' => PermissionModule::Vehicles->value,
            'pages' => [
                ['label' => 'Fahrzeuge', 'href' => '/admin/fahrzeuge', 'icon' => 'vehicles'],
                ['label' => 'Zur Prüfung', 'href' => '/admin/fahrzeuge/pruefung', 'icon' => 'review', 'count' => 'vehicles_review'],
            ],
        ],
        [
            'key' => 'inhalte',
            'label' => 'Inhalte',
            'short' => 'Inhalte',
            'icon' => 'pages',
            'module' => PermissionModule::Content->value,
            'pages' => [
                ['label' => 'Seiten', 'href' => '/admin/seiten', 'icon' => 'pages'],
                ['label' => 'FAQ', 'href' => '/admin/faq', 'icon' => 'faq'],
                ['label' => 'Navigation', 'href' => '/admin/navigation', 'icon' => 'navigation'],
                ['label' => 'Medien', 'href' => '/admin/medien', 'icon' => 'media'],
            ],
        ],
        [
            'key' => 'auswertungen',
            'label' => 'Auswertungen',
            'short' => 'Berichte',
            'icon' => 'reports',
            'module' => PermissionModule::Reports->value,
            'pages' => [
                ['label' => 'Verkäufe', 'href' => '/admin/verkaeufe', 'icon' => 'reports'],
                ['label' => 'Suchen ohne Treffer', 'href' => '/admin/suchen-ohne-treffer', 'icon' => 'search'],
                ['label' => 'Fahrzeuge ohne Felgen', 'href' => '/admin/fahrzeuge-ohne-felgen', 'icon' => 'gap'],
                ['label' => 'Gutachten-Lücken', 'href' => '/admin/gutachten-luecken', 'icon' => 'filter'],
            ],
        ],
        [
            'key' => 'einstellungen',
            'label' => 'Einstellungen',
            'short' => 'Vorgaben',
            'icon' => 'settings',
            'module' => PermissionModule::Settings->value,
            'pages' => [
                ['label' => 'Allgemein', 'href' => '/admin/einstellungen', 'icon' => 'settings'],
                // What the extras on a Komplettrad cost: Wuchtgewicht colours and RDKS sensors, two
                // pages behind one item. Prices of the catalogue, so the catalogue's right.
                ['label' => 'Zubehörpreise', 'href' => '/admin/zubehoerpreise', 'icon' => 'prices', 'module' => PermissionModule::Catalogue->value],
                // The bucket's keys: the Super-Admin alone, whatever the matrix says (StorageSettingPolicy).
                ['label' => 'Medien und Speicher', 'href' => '/admin/einstellungen/speicher', 'icon' => 'storage', 'super' => true],
            ],
        ],
        [
            'key' => 'team',
            'label' => 'Team',
            'short' => 'Team',
            'icon' => 'users',
            'module' => PermissionModule::Roles->value,
            'pages' => [
                ['label' => 'Benutzer', 'href' => '/admin/benutzer', 'icon' => 'users'],
                ['label' => 'Rollen & Rechte', 'href' => '/admin/rollen', 'icon' => 'roles'],
                ['label' => 'Protokoll', 'href' => '/admin/protokoll', 'icon' => 'audit-log', 'module' => PermissionModule::AuditLog->value],
            ],
        ],
        [
            'key' => 'system',
            'label' => 'System',
            'short' => 'System',
            'icon' => 'system',
            'module' => PermissionModule::Settings->value,
            'pages' => [
                ['label' => 'Zustand', 'href' => '/admin/system', 'icon' => 'system'],
                ['label' => 'Warteschlange', 'href' => '/admin/warteschlange', 'icon' => 'queue', 'count' => 'jobs_failed'],
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
        '/admin/review',
        '/admin/review/rueckmeldungen',
        '/admin/felgen',
        '/admin/marken',
        '/admin/katalog/import',
        '/admin/gutachten',
        '/admin/auflagen',
        '/admin/konflikte',
        '/admin/fahrzeuge',
        '/admin/fahrzeuge/pruefung',
        '/admin/abdeckung',
        '/admin/bestellungen',
        '/admin/anfragen',
        '/admin/zubehoerpreise',
        '/admin/benutzer',
        '/admin/rollen',
        '/admin/protokoll',
        '/admin/seiten',
        '/admin/faq',
        '/admin/navigation',
        '/admin/system',
        '/admin/einstellungen/speicher',
    ];

    /** The role `super` pages ask for (AdminUser::isSuperAdmin). */
    private const SUPER_ROLE = 'super-admin';

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
        '/admin/bestaetigen' => 'Passwort bestätigen',
    ];

    /**
     * Pages beneath the Übersicht rather than on the rail — reached from its widgets — whose crumb
     * leads back to it: Übersicht › Nachfrage.
     *
     * @var array<string, string>
     */
    private const BENEATH_UEBERSICHT = [
        '/admin/nachfrage' => 'Nachfrage',
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
     * @return list<array{key: string, label: string, short: string, icon: string, pages: list<array{label: string, href: string, icon: string, count: int|null, countTone: string}>}>
     */
    public function for(AdminUser $user): array
    {
        $tree = [];

        foreach (self::GROUPS as $group) {
            // The review's group exists only where the review is on (local and staging).
            if (($group['review'] ?? false) && ! (bool) config('rimify.review.enabled', false)) {
                continue;
            }

            $pages = [];

            foreach ($group['pages'] as $page) {
                if (! in_array($page['href'], $this->built(), true)) {
                    continue;
                }

                $module = $page['module'] ?? $group['module'];

                if ($module !== null && ! $this->mayView($user, $module)) {
                    continue;
                }

                if (($page['super'] ?? false) && ! $user->isSuperAdmin()) {
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
                'short' => $group['short'],
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
     * @return list<array{key: string, label: string, short: string, icon: string, pages: list<array{label: string, href: string, icon: string, count: null, countTone: string}>}>
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

        $super = DB::table('roles')->where('id', $roleId)->value('name') === self::SUPER_ROLE;
        $tree = [];

        foreach (self::GROUPS as $group) {
            // The review's group exists only where the review is on (local and staging).
            if (($group['review'] ?? false) && ! (bool) config('rimify.review.enabled', false)) {
                continue;
            }

            $pages = [];

            foreach ($group['pages'] as $page) {
                if (! in_array($page['href'], $this->built(), true)) {
                    continue;
                }

                $module = $page['module'] ?? $group['module'];

                if ($module !== null && ! in_array($module, $viewable, true)) {
                    continue;
                }

                if (($page['super'] ?? false) && ! $super) {
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
                'short' => $group['short'],
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

                // A page named like its group is that group: „Fahrzeuge“, never „Fahrzeuge › Fahrzeuge“.
                if ($page['label'] === $group['label']) {
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

                if ($page['label'] === $group['label']) {
                    array_shift($crumbs);
                }

                if ($record !== null && $record !== '') {
                    $crumbs[] = ['label' => $record, 'href' => null];
                }

                return $crumbs;
            }
        }

        if (isset(self::OFF_RAIL[$path])) {
            return [['label' => self::OFF_RAIL[$path], 'href' => null]];
        }

        if (isset(self::BENEATH_UEBERSICHT[$path])) {
            return [['label' => 'Übersicht', 'href' => '/admin'], ['label' => self::BENEATH_UEBERSICHT[$path], 'href' => null]];
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
                // The review's points still to answer.
                'review_open' => DB::table('review_feedback')->whereIn('status', ['neu', 'angenommen'])->count(),
                // Vehicles without the legal data a verdict needs: never shown as fitting (R-03).
                'vehicles_review' => DB::table('vehicles')->whereNull('deleted_at')->where('needs_review', true)->count(),
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
