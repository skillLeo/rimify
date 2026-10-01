<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One buyer's word on one rim they bought (the client's #19, D-103): written through the order's own signed link, after
 * delivery, once per order line. The team may hide one with a reason, or answer it; it never writes one. What a page
 * shows as the wheel's rating is computed from the visible rows (ReviewSummary), never typed.
 *
 * @property int $id
 * @property int $order_id
 * @property int $order_line_id
 * @property int $wheel_model_id
 * @property int $rating
 * @property string|null $body
 * @property bool $verified
 * @property CarbonImmutable|null $hidden_at
 * @property string|null $hidden_reason
 * @property int|null $hidden_by
 * @property string|null $reply
 * @property CarbonImmutable|null $replied_at
 * @property int|null $replied_by
 * @property CarbonImmutable|null $created_at
 */
class Review extends Model
{
    /** What the customer's form writes. Hiding and answering go through ReviewModeration, never mass assignment. */
    protected $fillable = ['order_id', 'order_line_id', 'wheel_model_id', 'rating', 'body'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'verified' => 'boolean',
            'hidden_at' => 'immutable_datetime',
            'replied_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /**
     * @param  Builder<Review>  $query
     * @return Builder<Review>
     */
    public function scopeVisible(Builder $query): Builder
    {
        return $query->whereNull('hidden_at');
    }

    public function isHidden(): bool
    {
        return $this->hidden_at !== null;
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<OrderLine, $this> */
    public function orderLine(): BelongsTo
    {
        return $this->belongsTo(OrderLine::class);
    }

    /** @return BelongsTo<WheelModel, $this> */
    public function wheelModel(): BelongsTo
    {
        return $this->belongsTo(WheelModel::class);
    }
}
