<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\Brand;
use Illuminate\Auth\Access\Response;

/**
 * Who may change a Marke — cells of the `catalogue` row, like the Felgen they carry (R-11). A brand
 * that still carries a wheel or a tyre is never removed: its products would lose their maker.
 */
final class BrandPolicy
{
    public const IN_USE = 'Diese Marke führt noch Felgen oder Reifen. Entferne sie dort zuerst oder benenne die Marke um.';

    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Create);
    }

    public function update(AdminUser $user, Brand $brand): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Edit);
    }

    public function delete(AdminUser $user, Brand $brand): Response
    {
        if (! $user->may(PermissionModule::Catalogue, PermissionAction::Delete)) {
            return Response::deny();
        }

        return $brand->wheelModels()->withTrashed()->exists() || $brand->tyreVariants()->exists()
            ? Response::deny(self::IN_USE)
            : Response::allow();
    }
}
