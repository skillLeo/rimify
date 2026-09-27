<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\ConditionCode;
use Illuminate\Support\Facades\DB;

/**
 * The Auflagen-Katalog: each Auflage written once as a full German sentence (R-15) and reused by every
 * Gutachten. Part of the `approvals` row (R-11). An Auflage a row still carries cannot be deleted —
 * its sentence is what a customer was shown.
 */
final class ConditionCodePolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::Create);
    }

    public function update(AdminUser $user, ConditionCode $code): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::Edit);
    }

    public function delete(AdminUser $user, ConditionCode $code): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::Delete)
            && ! DB::table('fitment_conditions')->where('condition_code_id', $code->id)->exists();
    }
}
