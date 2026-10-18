<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Vehicle;
use Illuminate\Contracts\Auth\Authenticatable;

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

    /** A car typed by hand from its papers (his admin items 1 and 3, D-296). */
    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Vehicles, PermissionAction::Create);
    }

    /**
     * A customer's own papers for this car (Block C, item 10): anyone may type them — a guest too, there
     * are no customer accounts yet — for a car the shop still offers. They are kept in the customer's
     * browser, never on the vehicle row, so no one changes the vehicle data this way (R-11).
     */
    public function enterPapers(?Authenticatable $user, Vehicle $vehicle): bool
    {
        return ! $vehicle->trashed();
    }

    /** Choosing vehicles for a Gutachten's rows: the Gutachten team reads the vehicles it enters. */
    public function search(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Vehicles, PermissionAction::View)
            || $user->may(PermissionModule::Approvals, PermissionAction::Create);
    }
}
