<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\TyreVariant;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Taking a tyre out of Katalog › Reifen (TyreVariantPolicy): the catalogue's right to delete, never a demonstration tyre.
 * Kept on disk — an order that sold it still names it.
 */
class TyreDeleteRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $tyre = $this->route('tyre');

        return $user instanceof AdminUser && $tyre instanceof TyreVariant && $user->can('delete', $tyre);
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
