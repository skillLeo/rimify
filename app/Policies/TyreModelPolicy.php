<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\TyreModel;
use Illuminate\Auth\Access\Response;

/**
 * Who may change a tyre model — the same cells of the `catalogue` row as its sizes (TyreVariantPolicy, R-11). A demonstration model
 * is shown and never changed, as its tyres.
 */
final class TyreModelPolicy
{
    public function view(AdminUser $user, TyreModel $model): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function update(AdminUser $user, TyreModel $model): Response
    {
        if (! $user->may(PermissionModule::Catalogue, PermissionAction::Edit)) {
            return Response::deny();
        }

        return $model->isDemo() ? Response::deny(TyreVariantPolicy::DEMO_REFUSED) : Response::allow();
    }
}
