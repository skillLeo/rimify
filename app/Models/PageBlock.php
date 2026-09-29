<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One printed block of a page — the hero, a guide section, a legal section. `data` is validated
 * against PageSchema before it is written and never stored free-form.
 *
 * @property int $id
 * @property int $page_id
 * @property string $type
 * @property int $sort_order
 * @property array<string, mixed> $data
 */
class PageBlock extends Model
{
    protected $fillable = ['page_id', 'type', 'sort_order', 'data'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'data' => 'array',
        ];
    }

    /** @return BelongsTo<Page, $this> */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
