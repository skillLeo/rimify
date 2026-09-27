<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\DocumentStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;

/**
 * Who may enter and release a Gutachten — cells of the `approvals` row (R-11).
 *
 * Entering (the document, its rows) is creating and editing, and only while the document is a draft:
 * a released Gutachten is what customers were told, and it changes only by a new revision that
 * supersedes it. Freigeben is its own right.
 */
final class ApprovalDocumentPolicy
{
    public function viewAny(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::View);
    }

    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::Create);
    }

    public function update(AdminUser $user, ApprovalDocument $document): bool
    {
        return $document->status === DocumentStatus::Draft && $user->may(PermissionModule::Approvals, PermissionAction::Edit);
    }

    public function publish(AdminUser $user, ApprovalDocument $document): bool
    {
        return $document->status === DocumentStatus::Draft && $user->may(PermissionModule::Approvals, PermissionAction::Publish);
    }
}
