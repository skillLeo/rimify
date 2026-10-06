<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * Einstellungen › E-Mail holds the key the shop sends its mail with: the Super-Admin alone — the role, not a right
 * another role could be given in the grid — and, for a change, only after the password was asked again (EnsureSudo, on
 * the routes). Lifting a block on an address is a change of the same screen. R-11: refused on the server, whatever the UI.
 */
class MailSettingPolicy
{
    public function view(AdminUser $user): bool
    {
        return $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::View);
    }

    public function update(AdminUser $user): bool
    {
        return $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::Edit);
    }
}
