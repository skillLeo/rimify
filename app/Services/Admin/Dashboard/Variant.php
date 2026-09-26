<?php

declare(strict_types=1);

namespace App\Services\Admin\Dashboard;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * Which Übersicht a person gets — one layout, different figures — decided by what their role may do,
 * never by the role's name (docs/admin/rest-build-plan.md, „Übersicht und Shell“ step H):
 *
 *   - Verkauf: who changes orders, or reads orders and money — revenue, orders, the order tables.
 *   - Katalog: who changes the catalogue — stock and data quality instead of revenue.
 *   - Gutachten: who changes the Gutachten — documents, conflicts and demand, coverage first.
 *   - Support: who reads orders or customers — the customers waiting and asking, the open orders.
 *
 * The first that fits wins, in that order; a role that only reads Gutachten gets their figures, one
 * that only reads reports the money. A role that fits none (Inhalte) gets the page without figures
 * and a sentence pointing to its areas.
 */
enum Variant: string
{
    case Verkauf = 'verkauf';
    case Katalog = 'katalog';
    case Gutachten = 'gutachten';
    case Support = 'support';
    case Keine = 'keine';

    public static function for(AdminUser $admin): self
    {
        $may = static fn (PermissionModule $module, PermissionAction $action): bool => $admin->may($module, $action);

        return match (true) {
            $may(PermissionModule::Orders, PermissionAction::Edit),
            $may(PermissionModule::Orders, PermissionAction::View) && $may(PermissionModule::Reports, PermissionAction::View) => self::Verkauf,
            $may(PermissionModule::Catalogue, PermissionAction::Edit) => self::Katalog,
            $may(PermissionModule::Approvals, PermissionAction::Edit) => self::Gutachten,
            $may(PermissionModule::Orders, PermissionAction::View), $may(PermissionModule::Customers, PermissionAction::View) => self::Support,
            $may(PermissionModule::Approvals, PermissionAction::View) => self::Gutachten,
            // Reading the figures and nothing else (a controller): the money, without the order lists.
            $may(PermissionModule::Reports, PermissionAction::View) => self::Verkauf,
            default => self::Keine,
        };
    }
}
