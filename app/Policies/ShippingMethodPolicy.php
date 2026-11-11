<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\ShippingMethod;

/**
 * Einstellungen › Versand (D-449): what delivery costs and takes, said before the order button. The Super-Admin alone, as the
 * shipping terms were on Einstellungen › Verkäufer & Versand (SellerSettingsPolicy), and after the password was asked again
 * (EnsureSudo, on the routes). R-11: refused on the server, whatever the UI.
 */
class ShippingMethodPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::Edit);
    }

    public function update(AdminUser $user, ShippingMethod $method): bool
    {
        return $this->create($user);
    }
}
