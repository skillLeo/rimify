<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\VehicleImport;

/**
 * Who may bring a vehicle dataset into the shop (his admin item 2, R-11).
 *
 * Two rows of the matrix, as the catalogue's import: the `imports` right to run the importer at all, and the vehicles'
 * own rights for what an import does to them — it creates cars and changes those of an earlier import. A Probelauf
 * changes nothing, so reading the importer and checking a file needs only the first.
 */
final class VehicleImportPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Imports, PermissionAction::View);
    }

    /** A Probelauf: the file read and compared, nothing written to the cars. */
    public function preview(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Imports, PermissionAction::Create);
    }

    /**
     * The rights alone: whether the run is still a Probelauf is the importer's question, asked under the run's lock — a
     * second tab is told the file is imported, never that a right is missing (VehicleImporter::apply).
     */
    public function apply(AdminUser $user, VehicleImport $import): bool
    {
        return $user->may(PermissionModule::Imports, PermissionAction::Create)
            && $user->may(PermissionModule::Vehicles, PermissionAction::Create)
            && $user->may(PermissionModule::Vehicles, PermissionAction::Edit);
    }
}
