<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;

/**
 * *Rolle ändern* for one account.
 *
 * Refused outright (403) for anybody without `roles × edit`, and for the account's own holder:
 * nobody re-roles themselves, so no screen offers it and no request may do it. Which roles this
 * person may hand out, and whether the change would lock the panel, are the controller's questions.
 */
class UserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $target = $this->route('user');

        return $user instanceof AdminUser
            && $target instanceof AdminUser
            && ! $target->is($user)
            && $user->may(PermissionModule::Roles, PermissionAction::Edit);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'role_id' => ['required', 'integer'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'role_id.required' => 'Bitte wähle eine Rolle.',
            'role_id.integer' => 'Bitte wähle eine Rolle aus der Liste.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    public function roleId(): int
    {
        return (int) $this->validated('role_id');
    }
}
