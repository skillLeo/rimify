<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\CatalogueImport;

/**
 * Who may bring a supplier feed into the catalogue (R-11).
 *
 * Two rows of the matrix: the `imports` right to run the importer at all, and the catalogue's own
 * rights for what an import does to it — it creates Felgen and changes prices and stock. A Probelauf
 * changes nothing, so reading the importer and checking a file needs only the first. An import never
 * publishes: every model it creates is a draft.
 */
final class CatalogueImportPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Imports, PermissionAction::View);
    }

    /** A Probelauf: the file read and compared, nothing written to the catalogue. */
    public function preview(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Imports, PermissionAction::Create);
    }

    public function apply(AdminUser $user, CatalogueImport $import): bool
    {
        return $import->status === CatalogueImport::PREVIEWED
            && $user->may(PermissionModule::Imports, PermissionAction::Create)
            && $user->may(PermissionModule::Catalogue, PermissionAction::Create)
            && $user->may(PermissionModule::Catalogue, PermissionAction::Edit);
    }

    public function rollback(AdminUser $user, CatalogueImport $import): bool
    {
        return $import->status === CatalogueImport::APPLIED
            && $user->may(PermissionModule::Imports, PermissionAction::Create)
            && $user->may(PermissionModule::Catalogue, PermissionAction::Edit);
    }
}
