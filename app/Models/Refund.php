<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A refund asked of the payment provider from the order page (RefundOrder): written when the provider took it,
 * never marked by hand, with the credit note that documents it.
 *
 * @property int $id
 * @property int $order_id
 * @property string $provider
 * @property string|null $provider_refund_id
 * @property int $amount_cents
 * @property string $currency
 * @property string $reason
 * @property 'pending'|'succeeded'|'failed'|'canceled'|'requires_action' $status
 * @property int|null $requested_by
 * @property string|null $event_id
 * @property int|null $credit_note_id
 */
class Refund extends Model
{
    protected $fillable = ['order_id', 'provider', 'provider_refund_id', 'amount_cents', 'currency', 'reason', 'status', 'requested_by', 'event_id', 'credit_note_id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['amount_cents' => 'integer'];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Invoice, $this> */
    public function creditNote(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'credit_note_id');
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'requested_by');
    }
}
