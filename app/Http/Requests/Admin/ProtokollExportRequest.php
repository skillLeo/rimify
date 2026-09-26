<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;

/**
 * The CSV export of the Protokoll: the same filters as the page, and its own right.
 *
 * Exporting is `audit_log` × `export`, not merely `view` — a file leaves the panel, and with it every
 * name, address and IP in it — so a role that may read the log on screen is still refused here
 * (R-11). Reading it on screen is not required on top: whoever may export may take it away anyway.
 */
class ProtokollExportRequest extends ProtokollFilterRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->may(PermissionModule::AuditLog, PermissionAction::Export);
    }
}
