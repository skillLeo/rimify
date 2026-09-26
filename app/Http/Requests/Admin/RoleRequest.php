<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;

/**
 * What every write on a role shares: one cell of the matrix — `roles` × something — asked on the
 * server for this very request (R-11), and the signed-in admin handed to the controller.
 *
 * A role has no Eloquent model of ours to hang a Policy on, so the question is asked here, the same
 * one a Policy would ask.
 */
abstract class RoleRequest extends FormRequest
{
    /** The action on `roles` this request needs. */
    abstract protected function needs(): PermissionAction;

    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->may(PermissionModule::Roles, $this->needs());
    }

    /** The signed-in admin; authorize() has already refused anyone else. */
    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /** The role in the URL, as the route's number constraint already guarantees it. */
    public function roleId(): int
    {
        return (int) $this->route('role');
    }
}
