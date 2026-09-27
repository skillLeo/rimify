<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;

/**
 * The bucket's settings from Einstellungen › Medien und Speicher (StorageSettings reads them).
 *
 * The access key and the secret are encrypted at rest and hidden from every array and JSON form of
 * the model: they leave this class only for building a disk, never for a page, a log or an API.
 *
 * @property int $id
 * @property 'active'|'pending' $state
 * @property string $provider
 * @property string $region
 * @property string|null $bucket
 * @property string|null $endpoint
 * @property bool $path_style
 * @property string|null $public_url
 * @property string|null $access_key
 * @property string|null $secret
 * @property string|null $key_last4
 * @property string|null $secret_last4
 * @property CarbonImmutable|null $verified_at
 * @property array<string, mixed>|null $last_test
 * @property int|null $updated_by
 */
class StorageSetting extends Model
{
    public const ACTIVE = 'active';

    public const PENDING = 'pending';

    protected $fillable = ['state', 'provider', 'region', 'bucket', 'endpoint', 'path_style', 'public_url', 'access_key', 'secret', 'key_last4', 'secret_last4', 'verified_at', 'last_test', 'updated_by'];

    /** Never in an array, a JSON answer or a dump of the model. */
    protected $hidden = ['access_key', 'secret'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'access_key' => 'encrypted',
            'secret' => 'encrypted',
            'path_style' => 'boolean',
            'verified_at' => 'immutable_datetime',
            'last_test' => 'array',
        ];
    }

    /** Whether the set is whole: a bucket and both halves of the credential. */
    public function complete(): bool
    {
        return filled($this->bucket) && filled($this->access_key) && filled($this->secret);
    }
}
