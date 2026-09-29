<?php

declare(strict_types=1);

namespace App\Policies;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * Uploading a Gutachten PDF straight into the bucket (PdfUpload): who may edit the Gutachten may
 * upload one. Not a model: the upload as such, before any row exists (R-11, on the server).
 */
class DocumentUploadPolicy
{
    public function create(AdminUser $user): bool
    {
        return $user->may(PermissionModule::Approvals, PermissionAction::Edit);
    }
}
