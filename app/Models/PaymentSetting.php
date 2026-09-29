<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * Einstellungen › Zahlung: the Stripe keys as the operator entered them (PaymentConfig reads them first, `.env`
 * second). The three keys are encrypted at rest and hidden from every array and JSON form of the model: they
 * leave this class only to build the Stripe client, never for a page, a log or an API. The page gets the
 * last four characters.
 *
 * @property int $id
 * @property 'test'|'live' $mode
 * @property string|null $publishable_key
 * @property string|null $secret_key
 * @property string|null $webhook_secret
 * @property string|null $publishable_last4
 * @property string|null $secret_last4
 * @property string|null $webhook_last4
 * @property array<string, mixed>|null $last_test
 * @property CarbonImmutable|null $tested_at
 * @property int|null $updated_by
 */
class PaymentSetting extends Model
{
    protected $fillable = ['mode', 'publishable_key', 'secret_key', 'webhook_secret', 'publishable_last4', 'secret_last4', 'webhook_last4', 'last_test', 'tested_at', 'updated_by'];

    /** Never in an array, a JSON answer or a dump of the model. */
    protected $hidden = ['publishable_key', 'secret_key', 'webhook_secret'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'publishable_key' => 'encrypted',
            'secret_key' => 'encrypted',
            'webhook_secret' => 'encrypted',
            'last_test' => 'array',
            'tested_at' => 'immutable_datetime',
        ];
    }

    /** The one row the screen edits: there is one set of keys for the shop. */
    public static function current(): ?self
    {
        return self::query()->orderBy('id')->first();
    }
}
