<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One published state of a page, whole: what visitors read from `created_at` until the next one.
 * Written once, never changed — restoring copies it into the draft rather than editing it.
 *
 * @property int $id
 * @property int $page_id
 * @property array{title: string, metaDescription: string, blocks: list<array{type: string, data: array<string, mixed>}>} $snapshot
 * @property string|null $note
 * @property int|null $author_id
 * @property string|null $author_email
 * @property Carbon $created_at
 */
class PageRevision extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['page_id', 'snapshot', 'note', 'author_id', 'author_email'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Page, $this> */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
