<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A chargeback, as the provider's webhook reports it (charge.dispute.created / .closed): the reason, the amount,
 * the day the evidence is due — and the evidence given. Verkauf › Rückbuchungen counts the days down, because a
 * dispute nobody answers before its deadline is money gone.
 *
 * @property int $id
 * @property int|null $order_id
 * @property string $provider
 * @property string $provider_dispute_id
 * @property string|null $charge_id
 * @property string $reason
 * @property int $amount_cents
 * @property string $currency
 * @property string $status
 * @property CarbonImmutable|null $evidence_due_by
 * @property array<string, mixed>|null $evidence
 * @property CarbonImmutable|null $evidence_submitted_at
 * @property CarbonImmutable|null $closed_at
 * @property 'won'|'lost'|'accepted'|null $outcome
 */
class Dispute extends Model
{
    protected $fillable = ['order_id', 'provider', 'provider_dispute_id', 'charge_id', 'reason', 'amount_cents', 'currency', 'status', 'evidence_due_by', 'evidence', 'evidence_submitted_at', 'closed_at', 'outcome'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'amount_cents' => 'integer',
            'evidence_due_by' => 'immutable_datetime',
            'evidence' => 'array',
            'evidence_submitted_at' => 'immutable_datetime',
            'closed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function isOpen(): bool
    {
        return $this->closed_at === null;
    }
}
