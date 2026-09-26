<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\ConflictStatus;
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
     * `module` is the permission module the group needs at `View`; null means every signed-in admin.
     * `count` names a live figure the row carries; only a queue of work whose goal is zero earns one
     * (admin-shell.md §5.6). A group with exactly one visible page IS that page in the rail.
     *
     * @var list<array{key: string, label: string, icon: string, module: string|null, pages: list<array{label: string, href: string, count?: string}>}>
     */
    private const GROUPS = [
        [
            'key' => 'uebersicht',
            'label' => 'Übersicht',
            'icon' => 'grid',
            'module' => null,
            'pages' => [
                ['label' => 'Übersicht', 'href' => '/admin'],
            ],
        ],
        [
            'key' => 'verkauf',
            'label' => 'Verkauf',
            'icon' => 'cart',
            'module' => PermissionModule::Orders->value,
            'pages' => [
                ['label' => 'Bestellungen', 'href' => '/admin/bestellungen', 'count' => 'orders_open'],
                ['label' => 'Kunden', 'href' => '/admin/kunden'],
                ['label' => 'Anfragen', 'href' => '/admin/anfragen'],
            ],
        ],
        [
            'key' => 'katalog',
            'label' => 'Katalog',
            'icon' => 'box',
            'module' => PermissionModule::Catalogue->value,
            'pages' => [
                ['label' => 'Felgen', 'href' => '/admin/felgen'],
                ['label' => 'Reifen', 'href' => '/admin/reifen'],
                ['label' => 'Marken', 'href' => '/admin/marken'],
                ['label' => 'Bestände', 'href' => '/admin/bestaende'],
                ['label' => 'Wuchtgewichte-Farben', 'href' => '/admin/wuchtgewichte'],
                ['label' => 'RDKS-Sensorpreise', 'href' => '/admin/rdks-preise'],
            ],
        ],
        [
            'key' => 'gutachten',
            'label' => 'Gutachten',
            'icon' => 'document',
            'module' => PermissionModule::Approvals->value,
            'pages' => [
                ['label' => 'Dokumente', 'href' => '/admin/gutachten'],
                ['label' => 'Auflagen-Katalog', 'href' => '/admin/auflagen'],
                ['label' => 'Abdeckung', 'href' => '/admin/abdeckung'],
                ['label' => 'Konflikte', 'href' => '/admin/konflikte', 'count' => 'conflicts_open'],
                // Customers asking to be told when a document for their car arrives. The goal of
                // the team's work is to have told all of them, so it is a queue and earns a count.
                // Not "Benachrichtigungen": that word belongs to the team's own notifications.
                ['label' => 'Benachrichtigungswünsche', 'href' => '/admin/benachrichtigungen', 'count' => 'notify_open'],
            ],
        ],
        [
            'key' => 'fahrzeuge',
            'label' => 'Fahrzeuge',
            'icon' => 'car',
            'module' => PermissionModule::Vehicles->value,
            'pages' => [
                ['label' => 'Fahrzeuge', 'href' => '/admin/fahrzeuge'],
                ['label' => 'Zur Prüfung', 'href' => '/admin/fahrzeuge/pruefung', 'count' => 'vehicles_review'],
            ],
        ],
        [
            'key' => 'inhalte',
            'label' => 'Inhalte',
            'icon' => 'text',
            'module' => PermissionModule::Content->value,
            'pages' => [
                ['label' => 'Seiten', 'href' => '/admin/seiten'],
                ['label' => 'FAQ', 'href' => '/admin/faq'],
                ['label' => 'Navigation', 'href' => '/admin/navigation'],
                ['label' => 'Medien', 'href' => '/admin/medien'],
            ],
        ],
        [
            'key' => 'auswertungen',
            'label' => 'Auswertungen',
            'icon' => 'chart',
            'module' => PermissionModule::Reports->value,
            'pages' => [
                ['label' => 'Verkäufe', 'href' => '/admin/verkaeufe'],
                ['label' => 'Suchen ohne Treffer', 'href' => '/admin/suchen-ohne-treffer'],
                ['label' => 'Fahrzeuge ohne Felgen', 'href' => '/admin/fahrzeuge-ohne-felgen'],
                ['label' => 'Gutachten-Lücken', 'href' => '/admin/gutachten-luecken'],
            ],
        ],
        [
            'key' => 'einstellungen',
            'label' => 'Einstellungen',
            'icon' => 'settings',
            'module' => PermissionModule::Settings->value,
            'pages' => [
                ['label' => 'Allgemein', 'href' => '/admin/einstellungen'],
            ],
        ],
        [
            'key' => 'team',
            'label' => 'Team',
            'icon' => 'user',
            'module' => PermissionModule::Roles->value,
            'pages' => [
                ['label' => 'Benutzer', 'href' => '/admin/benutzer'],
                ['label' => 'Rollen & Rechte', 'href' => '/admin/rollen'],
                ['label' => 'Protokoll', 'href' => '/admin/protokoll'],
            ],
        ],
        [
            'key' => 'system',
            'label' => 'System',
            'icon' => 'wrench',
            'module' => PermissionModule::Settings->value,
            'pages' => [
                ['label' => 'Warteschlange', 'href' => '/admin/warteschlange', 'count' => 'jobs_failed'],
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
        '/admin/benachrichtigungen',
        '/admin/wuchtgewichte',
        '/admin/rdks-preise',
        '/admin/rollen',
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
    ];

    /**
     * The tree for one admin: groups they may see, holding pages that exist, with their counts.
     *
     * A group whose every page is unbuilt or unpermitted is dropped rather than drawn empty. A count
     * is only queried when the page carrying it is actually in the tree.
     *
     * @return list<array{key: string, label: string, icon: string, pages: list<array{label: string, href: string, count: int|null, countTone: string}>}>
     */
    public function for(AdminUser $user): array
    {
        $tree = [];

        foreach (self::GROUPS as $group) {
            if ($group['module'] !== null && ! $this->mayView($user, $group['module'])) {
                continue;
            }

            $pages = [];

            foreach ($group['pages'] as $page) {
                if (! in_array($page['href'], $this->built(), true)) {
                    continue;
                }

                $key = $page['count'] ?? null;
                $count = $key === null ? null : $this->count($key);

                $pages[] = [
                    'label' => $page['label'],
                    'href' => $page['href'],
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
     * Where the reader is, as the topbar shows it: the group, then the page.
     *
     * The group is a label, not a link — it is not a page, and a crumb that goes nowhere is a dead
     * link. The current page is never a link either. A single-page group is just its page, so the
     * rail's Übersicht does not read "Übersicht › Übersicht".
     *
     * @param  list<array<string, mixed>>  $tree
     * @return list<array{label: string, href: string|null}>
     */
    public function breadcrumbs(array $tree, string $path): array
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
