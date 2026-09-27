<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Vehicle;

/**
 * Fahrzeuge — the `vehicles` row (R-11). Editing is the legal data a verdict needs (axle loads, top
 * speed): a vehicle without them can never be told it fits (R-03), and entering them is the review.
 * Vehicles are never deleted here (R-04).
 */
final class VehiclePolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Vehicles, PermissionAction::View);
    }

    public function update(AdminUser $user, Vehicle $vehicle): bool
    {
        return $user->may(PermissionModule::Vehicles, PermissionAction::Edit);
    }

    /** Choosing vehicles for a Gutachten's rows: the Gutachten team reads the vehicles it enters. */
    public function search(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Vehicles, PermissionAction::View)
            || $user->may(PermissionModule::Approvals, PermissionAction::Create);
    }
}
