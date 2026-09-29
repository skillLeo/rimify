<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;

/**
 * A copy of a role, rights and description included, under a new name. Making a role is what
 * `roles` × `create` allows, whichever role it starts from.
 */
class RoleDuplicateRequest extends RoleRequest
{
    protected function needs(): PermissionAction
    {
        return PermissionAction::Create;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [];
    }
}
