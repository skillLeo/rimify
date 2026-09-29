<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One webhook from the payment provider, exactly as it arrived (its signature verified first). The provider's
 * event id is UNIQUE, so a repeated delivery finds its row and does nothing; the raw body is frozen by trigger.
 * Processing writes only when it was handled and with what outcome — every order transition names the event
 * that caused it, so an order reconciles with the provider's dashboard line by line.
 *
 * @property int $id
 * @property string $provider
 * @property string $event_id
 * @property string $type
 * @property bool $livemode
 * @property string $payload
 * @property int|null $order_id
 * @property CarbonImmutable $received_at
 * @property CarbonImmutable|null $processed_at
 * @property string|null $outcome
 * @property string|null $note
 */
class PaymentEvent extends Model
{
    protected $fillable = ['provider', 'event_id', 'type', 'livemode', 'payload', 'order_id', 'received_at', 'processed_at', 'outcome', 'note'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'livemode' => 'boolean',
            'received_at' => 'immutable_datetime',
            'processed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return array<string, mixed> */
    public function data(): array
    {
        $decoded = json_decode($this->payload, true);

        return is_array($decoded) ? $decoded : [];
    }
}
