<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Support\Carbon;

/**
 * A message sent through the contact form (the client's #12, D-123): kept as well as mailed, read in Verkauf ›
 * Nachrichten, and pruned after twelve months — a question answered long ago is no reason to keep someone's address.
 *
 * @property int $id
 * @property string $name
 * @property string $email
 * @property string $subject
 * @property string $message
 * @property string|null $vehicle_label
 * @property string|null $from_path
 * @property Carbon|null $read_at
 * @property int|null $read_by
 * @property Carbon $created_at
 */
class ContactMessage extends Model
{
    use Prunable;

    /** How long a message is kept, in months. */
    public const KEEP_MONTHS = 12;

    protected $fillable = ['name', 'email', 'subject', 'message', 'vehicle_label', 'from_path'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    /** @return Builder<static> */
    public function prunable(): Builder
    {
        return static::query()->where('created_at', '<', now()->subMonths(self::KEEP_MONTHS));
    }
}
