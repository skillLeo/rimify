<?php

declare(strict_types=1);

namespace App\Services\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * What „Neu“ offers — in the rail's foot and as the palette's first actions, one list for both.
 *
 * An action is offered when the reader's role may create the thing AND the page that creates it
 * exists: Produkt and Gutachten join the day Felgen and the document editor are built, never as a
 * menu entry that opens nothing. The target page opens its own create dialog on arrival (`?neu=1`,
 * `?einladen=1`), so the action is one click from anywhere.
 *
 * @phpstan-type QuickAction array{key: string, label: string, href: string, icon: string}
 */
final class QuickActions
{
    /** @return list<QuickAction> */
    public function for(AdminUser $user): array
    {
        $actions = [];

        if ($this->built('/admin/seiten') && $user->may(PermissionModule::Content, PermissionAction::View) && $user->may(PermissionModule::Content, PermissionAction::Create)) {
            $actions[] = ['key' => 'ratgeber', 'label' => 'Ratgeber-Artikel anlegen', 'href' => '/admin/seiten?neu=1', 'icon' => 'guides'];
        }

        if ($this->built('/admin/benutzer') && $user->may(PermissionModule::Roles, PermissionAction::View) && $user->may(PermissionModule::Roles, PermissionAction::Create)) {
            $actions[] = ['key' => 'person', 'label' => 'Person einladen', 'href' => '/admin/benutzer?einladen=1', 'icon' => 'users'];
        }

        return $actions;
    }

    private function built(string $href): bool
    {
        return in_array($href, AdminNavigation::BUILT, true);
    }
}
