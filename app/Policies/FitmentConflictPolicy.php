<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * Who may read the Konflikte and decide one — cells of the `approvals` row (R-11). Deciding which document
 * stands is a Freigabe in all but name: what the shop tells customers changes with it, so it asks the
 * Freigeben right.
 */
final class FitmentConflictPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::View);
    }

    public function decide(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::Publish);
    }
}
