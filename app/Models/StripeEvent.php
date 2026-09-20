<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A processed Stripe webhook, keyed by Stripe's OWN event id.
 *
 * That primary key is the idempotency guarantee: a replayed webhook collides on insert, so it
 * cannot create a second order, decrement stock twice or send a second email.
 *
 * @property string $id
 * @property array<string, mixed> $payload
 */
class StripeEvent extends Model
{
    protected $primaryKey = 'id';

    protected $keyType = 'string';

    public $incrementing = false;

    public const UPDATED_AT = null;

    protected $fillable = ['id', 'type', 'payload', 'processed_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed_at' => 'immutable_datetime',
        ];
    }
}
