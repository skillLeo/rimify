<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * Einstellungen › Verkäufer & Versand holds what the shop says it is in law — the name on every invoice, the
 * Impressum — and what delivery costs: the Super-Admin alone, as the keys (PaymentSettingPolicy), and after the
 * password was asked again (EnsureSudo, on the routes). R-11: refused on the server, whatever the UI.
 */
class SellerSettingsPolicy
{
    public function view(AdminUser $user): bool
    {
        return $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::View);
    }

    public function update(AdminUser $user): bool
    {
        return $user->isSuperAdmin() && $user->may(PermissionModule::Settings, PermissionAction::Edit);
    }
}
