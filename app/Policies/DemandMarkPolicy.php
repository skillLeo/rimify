<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * The team's marks on the Nachfrage-Lücken, by the Rollen & Rechte grid's `approvals` row (R-11):
 * whoever may read the gaps sees the marks; only who may change the Gutachten area sets them.
 */
class DemandMarkPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::View);
    }

    public function mark(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::View)
            && $user->may(PermissionModule::Approvals, PermissionAction::Edit);
    }
}
