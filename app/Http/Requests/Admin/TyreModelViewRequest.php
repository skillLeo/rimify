<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\TyreModel;
use Illuminate\Foundation\Http\FormRequest;

/** Opening one tyre model in Katalog › Reifen (TyreModelPolicy). What the page then offers to change is its `can`. */
class TyreModelViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');

        return $user instanceof AdminUser && $model instanceof TyreModel && $user->can('view', $model);
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
