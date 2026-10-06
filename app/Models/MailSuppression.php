<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * An address SES reported as undeliverable (a hard bounce) or as complaining (marked as spam): the shop sends it
 * nothing more until an admin releases it (MailSuppressions, DropSuppressedRecipients).
 *
 * @property int $id
 * @property string $email
 * @property 'bounce'|'complaint' $reason
 * @property string|null $detail
 * @property string $sns_message_id
 * @property CarbonImmutable $occurred_at
 * @property CarbonImmutable|null $released_at
 * @property int|null $released_by
 */
class MailSuppression extends Model
{
    public const BOUNCE = 'bounce';

    public const COMPLAINT = 'complaint';

    protected $fillable = ['email', 'reason', 'detail', 'sns_message_id', 'occurred_at', 'released_at', 'released_by'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'occurred_at' => 'immutable_datetime',
            'released_at' => 'immutable_datetime',
        ];
    }

    /**
     * Rows still in force.
     *
     * @param  Builder<MailSuppression>  $query
     * @return Builder<MailSuppression>
     */
    public function scopeInForce(Builder $query): Builder
    {
        return $query->whereNull('released_at');
    }
}
