<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\TyreVariant;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Opening one tyre in Katalog › Reifen, or the empty form for a new one (TyreVariantPolicy): reading needs the catalogue's
 * view right, the new form the right to create. `wie` names a tyre whose brand, profile and season the new one starts
 * from — „Weitere Größe“. What the page then offers to change is its `can`.
 */
class TyreViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        $tyre = $this->route('tyre');

        return $tyre instanceof TyreVariant
            ? $user->can('view', $tyre)
            : $user->can('create', TyreVariant::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'wie' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /** The tyre a new one starts from, where one was named and still exists. */
    public function template(): ?TyreVariant
    {
        $id = $this->validated('wie');

        return $id === null ? null : TyreVariant::query()->with('brand')->find((int) $id);
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
