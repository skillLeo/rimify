<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelModel;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Opening one Felge, or the empty form for a new one (WheelModelPolicy): reading needs the catalogue's
 * view right, the new form the right to create. What the page then offers to change is its `can`.
 */
class WheelModelViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        return $this->route('model') instanceof WheelModel
            ? $user->can('viewAny', WheelModel::class)
            : $user->can('create', WheelModel::class);
    }

    /** @return array<string, list<mixed>> */
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
