<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * System › Was fehlt (GoLiveChecks): what the live shop still needs. Read only, and the settings right like the rest of
 * System — the client's team sees what it owes, nobody can change anything there. R-11: refused on the server.
 */
class GoLivePolicy
{
    public function view(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Settings, PermissionAction::View);
    }
}
