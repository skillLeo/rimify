<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\NavItem;

/**
 * Who may change the shop's menus. A menu is on every page and has no draft, so every change is a
 * change visitors see: each one takes the right to publish besides its own (R-11, never a role name).
 */
final class NavItemPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Create) && self::publishes($user);
    }

    public function update(AdminUser $user, NavItem $item): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Edit) && self::publishes($user);
    }

    public function delete(AdminUser $user, NavItem $item): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Delete) && self::publishes($user);
    }

    /** Anything in a menu is live on every page: this is the cell every change needs besides its own. */
    public function publish(AdminUser $user): bool
    {
        return self::publishes($user);
    }

    /** Reordering a menu: an edit of what every visitor sees. */
    public function reorder(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Edit) && self::publishes($user);
    }

    private static function publishes(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Content, PermissionAction::Publish);
    }
}
