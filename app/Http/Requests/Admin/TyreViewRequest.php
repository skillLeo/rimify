<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\TyreModel;
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
            'modell' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /** The tyre a new one starts from, where one was named and still exists. */
    public function template(): ?TyreVariant
    {
        $id = $this->validated('wie');

        if ($id !== null) {
            return TyreVariant::query()->with('brand')->find((int) $id);
        }

        // A model left without a size: its brand, name and season, so its photographs find their way back.
        $model = TyreModel::query()->find((int) ($this->validated('modell') ?? 0));

        return $model === null ? null : new TyreVariant(['brand_id' => $model->brand_id, 'name' => $model->name, 'season' => $model->season]);
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
