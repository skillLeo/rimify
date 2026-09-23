<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\TpmsSensorPrice;

/**
 * Who may read and change the RDKS sensor price per car make.
 *
 * A cell of the module × action matrix under the existing `catalogue` module
 * (docs/specs/komplettrad.md §6.1, D-038), never a role name; `update` maps to
 * PermissionAction::Edit because the matrix has no `Update` action. A price ends up on a customer's
 * bill, so every write is authorised here on the server (R-11).
 */
final class TpmsSensorPricePolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function view(AdminUser $user, TpmsSensorPrice $price): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Create);
    }

    public function update(AdminUser $user, TpmsSensorPrice $price): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Edit);
    }

    public function delete(AdminUser $user, TpmsSensorPrice $price): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Delete);
    }

    /**
     * The default price every make without a row of its own is charged (D-030, §13). It is not a
     * row, so it has no model to pass — but it ends up on the same bills, so it is the same cell.
     */
    public function updateDefaultPrice(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Edit);
    }
}
