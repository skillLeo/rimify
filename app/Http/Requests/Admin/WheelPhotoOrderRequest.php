<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Services\Admin\Catalogue\FinishImages;

/**
 * A finish's photographs in a new order: every one of its photos, each once. Whether the list is exactly
 * the finish's own is FinishImages::reorder's to say — a page that has not seen the latest photo is refused.
 */
class WheelPhotoOrderRequest extends WheelFinishRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:'.FinishImages::MAX_PER_FINISH],
            'ids.*' => ['required', 'integer', 'distinct'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'ids.*' => FinishImages::STALE,
            'ids.required' => FinishImages::STALE,
            'ids.array' => FinishImages::STALE,
            'ids.min' => FinishImages::STALE,
            'ids.max' => FinishImages::STALE,
        ];
    }

    /** @return list<int> */
    public function ids(): array
    {
        $ids = $this->validated('ids');

        return array_values(array_map(static fn (mixed $id): int => (int) $id, is_array($ids) ? $ids : []));
    }
}
