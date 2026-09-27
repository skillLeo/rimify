<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\WheelModel;
use Illuminate\Auth\Access\Response;

/**
 * Who may change a Felge — cells of the `catalogue` row, never a role name (R-11).
 *
 * The line runs through what a customer sees: preparing a model, its sizes and its photographs is
 * editing; putting it into the shop or taking it out is publishing; archiving takes the right to
 * delete. A demo model is never published, whoever asks (the review release §2, and the table's own
 * CHECK behind this).
 */
final class WheelModelPolicy
{
    public const DEMO_REFUSED = 'Demodaten kommen nie in den Shop. Leg die Felge als echte Felge an oder importiere sie.';

    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Create);
    }

    public function update(AdminUser $user, WheelModel $model): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Edit);
    }

    /** Into the shop, or out of it: the change a customer sees. */
    public function publish(AdminUser $user, ?WheelModel $model = null): Response
    {
        if (! $user->may(PermissionModule::Catalogue, PermissionAction::Publish)) {
            return Response::deny();
        }

        return $model !== null && $model->is_demo ? Response::deny(self::DEMO_REFUSED) : Response::allow();
    }

    public function archive(AdminUser $user, ?WheelModel $model = null): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Delete);
    }
}
