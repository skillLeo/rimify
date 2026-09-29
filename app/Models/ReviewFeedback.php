<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One point of the client's review of the admin (the review release §3), and our answer to it.
 *
 * @property int $id
 * @property int|null $admin_user_id
 * @property string $type
 * @property string $sentence
 * @property string $url
 * @property string $screen
 * @property string $viewport
 * @property string $browser
 * @property string|null $role
 * @property string|null $screenshot_path
 * @property string $status
 * @property string|null $answer
 * @property int|null $assignee_id
 * @property Carbon|null $closed_at
 * @property Carbon|null $created_at
 */
class ReviewFeedback extends Model
{
    public const TYPES = ['fehler' => 'Fehler', 'design' => 'Design', 'text' => 'Text', 'wunsch' => 'Wunsch'];

    public const STATUSES = ['neu' => 'Neu', 'angenommen' => 'Angenommen', 'erledigt' => 'Erledigt', 'abgelehnt' => 'Abgelehnt'];

    /** The disk a screenshot lives on: private, since a screenshot of the panel can show customers. */
    public const DISK = 'local';

    protected $table = 'review_feedback';

    protected $guarded = ['id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['closed_at' => 'datetime'];
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function reporter(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'admin_user_id');
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'assignee_id');
    }

    public function isOpen(): bool
    {
        return in_array($this->status, ['neu', 'angenommen'], true);
    }
}
