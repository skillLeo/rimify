<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * The demo set (DemoTables): everyone in the admin is told it is there (the rail's strip); taking it
 * away is the Einstellungen row's edit right (R-11; the row has no delete cell) — the people who may
 * change how the shop is set up.
 */
class DemoDataPolicy
{
    public function purge(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Settings, PermissionAction::View)
            && $user->may(PermissionModule::Settings, PermissionAction::Edit);
    }
}
