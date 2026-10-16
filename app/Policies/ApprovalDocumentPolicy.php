<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\DocumentStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Contracts\Auth\Authenticatable;

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

    /**
     * How loud each Auflage is in the shop (#23, D-104) — on a released document too: a level changes the words and
     * the colour, never what the document says or the verdict. Who may edit Gutachten.
     */
    public function setLevels(AdminUser $user, ApprovalDocument $document): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::Edit);
    }

    public function publish(AdminUser $user, ApprovalDocument $document): bool
    {
        return $document->status === DocumentStatus::Draft && $user->may(PermissionModule::Approvals, PermissionAction::Publish);
    }

    /**
     * The page an example document opens through (decision 6, D-239), for anyone — a visitor included — and only for a
     * document born demo that the shop shows. A real document has no such page: it opens as itself.
     */
    public function viewExample(?Authenticatable $user, ApprovalDocument $document): bool
    {
        return (bool) $document->getAttribute('is_demo') && $document->status === DocumentStatus::Published;
    }
}
