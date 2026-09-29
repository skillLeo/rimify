<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * Einstellungen › Medien und Speicher holds the keys to the shop's files: the Super-Admin alone —
 * the role, not a right another role could be given in the grid — and, for a change, only after the
 * password was asked again (EnsureSudo, on the routes). R-11: refused on the server, whatever the UI.
 */
class StorageSettingPolicy
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
