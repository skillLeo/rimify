<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;

/**
 * Deleting a role. Who may is `roles` × `delete`; whether this role may go at all — nobody holds it,
 * it is not a standard role — is the controller's question, asked about the stored row.
 */
class RoleDestroyRequest extends RoleRequest
{
    protected function needs(): PermissionAction
    {
        return PermissionAction::Delete;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
    }
}
