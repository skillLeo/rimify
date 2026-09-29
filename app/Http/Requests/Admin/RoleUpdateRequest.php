<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use Illuminate\Validation\Rule;

/**
 * A role's name and description. The name is `label_de`, what a human reads; the identifier
 * (`name`) never changes, so no permission check anywhere depends on what a role is called.
 *
 * Whether this role may be renamed at all — the Super-Admin and the standard roles may not — is the
 * controller's question, asked about the stored row.
 */
class RoleUpdateRequest extends RoleRequest
{
    protected function needs(): PermissionAction
    {
        return PermissionAction::Edit;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'label' => [
                'required', 'string', 'max:'.RoleStoreRequest::LABEL_MAX,
                Rule::unique('roles', 'label_de')->where('guard_name', 'admin')->ignore($this->roleId()),
            ],
            'description' => ['nullable', 'string', 'max:'.RoleStoreRequest::DESCRIPTION_MAX],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return RoleStoreRequest::labelMessages();
    }

    public function label(): string
    {
        return (string) $this->validated('label');
    }

    public function description(): ?string
    {
        $value = $this->validated('description');

        return is_string($value) && $value !== '' ? $value : null;
    }
}
