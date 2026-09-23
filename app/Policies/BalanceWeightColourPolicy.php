<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\BalanceWeightColour;

/**
 * Who may read and change the Wuchtgewicht colours.
 *
 * Every answer is a cell of the module × action matrix under the existing `catalogue` module
 * (docs/specs/komplettrad.md §6.1, D-038) — never a role name. `update` maps to
 * PermissionAction::Edit because the matrix has no `Update` action. The server asks this on every
 * mutation; the page only hides what it is told it may not do (R-11).
 */
final class BalanceWeightColourPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function view(AdminUser $user, BalanceWeightColour $colour): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Create);
    }

    public function update(AdminUser $user, BalanceWeightColour $colour): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Edit);
    }

    public function delete(AdminUser $user, BalanceWeightColour $colour): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Delete);
    }

    /**
     * *Montage und Auswuchten je Rad* — a shop-wide fee, not a colour, but it is edited on this
     * page and it is the same catalogue money, so it is the same cell (D-032, §13).
     */
    public function updateMountingFee(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Edit);
    }
}
