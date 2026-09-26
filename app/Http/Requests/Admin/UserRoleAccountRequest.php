<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;

/**
 * *Sperren*, *Entsperren* and *Überall abmelden* for one account.
 *
 * The same right as changing a role — `roles × edit` — and the same refusal for acting on your own
 * account: nobody suspends or force-logs-out themselves from this screen. There are no fields; the
 * account is the route's.
 */
class UserRoleAccountRequest extends FormRequest
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
        return [];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
