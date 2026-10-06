<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * Einstellungen › E-Mail: the Amazon SES set the shop sends with (MailSettings reads it).
 *
 * The access key and the secret are encrypted at rest and hidden from every array and JSON form of the model: they
 * leave this class only for building an SES client, never for a page, a log or an API.
 *
 * @property int $id
 * @property 'active'|'pending' $state
 * @property string $region
 * @property string|null $from_address
 * @property string|null $from_name
 * @property string|null $access_key
 * @property string|null $secret
 * @property string|null $key_last4
 * @property string|null $secret_last4
 * @property string|null $topic_arn
 * @property CarbonImmutable|null $verified_at
 * @property array<string, mixed>|null $last_test
 * @property int|null $updated_by
 */
class MailSetting extends Model
{
    public const ACTIVE = 'active';

    public const PENDING = 'pending';

    /** SES runs in the bucket's account and region (the brief „AFTER CI“, §3): the one region the screen offers. */
    public const REGION = 'eu-north-1';

    protected $fillable = ['state', 'region', 'from_address', 'from_name', 'access_key', 'secret', 'key_last4', 'secret_last4', 'topic_arn', 'verified_at', 'last_test', 'updated_by'];

    /** Never in an array, a JSON answer or a dump of the model. */
    protected $hidden = ['access_key', 'secret'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'access_key' => 'encrypted',
            'secret' => 'encrypted',
            'verified_at' => 'immutable_datetime',
            'last_test' => 'array',
        ];
    }

    /** Whether the set is whole: a sender and both halves of the credential. */
    public function complete(): bool
    {
        return filled($this->from_address) && filled($this->access_key) && filled($this->secret);
    }

    /** The domain the shop sends from — the part after the @ of the sender. */
    public function domain(): ?string
    {
        return self::domainOf($this->from_address);
    }

    public static function domainOf(?string $address): ?string
    {
        if ($address === null || ! str_contains($address, '@')) {
            return null;
        }

        $domain = strtolower(trim(substr($address, (int) strrpos($address, '@') + 1)));

        return $domain === '' ? null : $domain;
    }
}
