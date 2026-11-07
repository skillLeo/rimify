<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\TyreModel;
use App\Services\Admin\Catalogue\TyreModels;
use Illuminate\Foundation\Http\FormRequest;

/** A tyre model's photos in a new order; the first is the cover in the shop. As a rim's (WheelPhotoOrderRequest). */
class TyreModelPhotoOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $model = $this->route('model');

        return $user instanceof AdminUser && $model instanceof TyreModel && $user->can('update', $model);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:'.TyreModels::MAX_PHOTOS],
            'ids.*' => ['required', 'integer', 'distinct'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'ids.*' => TyreModels::STALE,
            'ids.required' => TyreModels::STALE,
            'ids.array' => TyreModels::STALE,
            'ids.min' => TyreModels::STALE,
            'ids.max' => TyreModels::STALE,
        ];
    }

    /** @return list<int> */
    public function ids(): array
    {
        $ids = $this->validated('ids');

        return array_values(array_map(static fn (mixed $id): int => (int) $id, is_array($ids) ? $ids : []));
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
