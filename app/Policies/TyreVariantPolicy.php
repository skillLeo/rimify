<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\TyreVariant;
use Illuminate\Auth\Access\Response;

/**
 * Who may change a tyre in Katalog › Reifen — cells of the `catalogue` row, never a role name (R-11), as for a Felge.
 *
 * A seeded demonstration tyre is shown and never changed: its label is not on record by design (ACCURACY D7), and a value
 * typed into one would be a label invented for a tyre that does not exist. It goes with the demo data.
 */
final class TyreVariantPolicy
{
    public const DEMO_REFUSED = 'Reifen aus den Demodaten lassen sich nicht ändern oder entfernen. Sie werden mit den Demodaten entfernt.';

    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function view(AdminUser $user, TyreVariant $tyre): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Catalogue, PermissionAction::Create);
    }

    public function update(AdminUser $user, TyreVariant $tyre): Response
    {
        if (! $user->may(PermissionModule::Catalogue, PermissionAction::Edit)) {
            return Response::deny();
        }

        return $tyre->is_demo ? Response::deny(self::DEMO_REFUSED) : Response::allow();
    }

    /** Taking a tyre out of the catalogue: the right to delete, as archiving a Felge. Kept on disk (soft delete). */
    public function delete(AdminUser $user, TyreVariant $tyre): Response
    {
        if (! $user->may(PermissionModule::Catalogue, PermissionAction::Delete)) {
            return Response::deny();
        }

        return $tyre->is_demo ? Response::deny(self::DEMO_REFUSED) : Response::allow();
    }
}
