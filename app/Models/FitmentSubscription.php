<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * An e-mail address waiting for a document that names its vehicle (F2).
 *
 * @property int $id
 * @property string $email
 * @property int $vehicle_id
 * @property string $confirm_token
 * @property string $unsubscribe_token
 * @property Carbon|null $confirmed_at
 * @property Carbon|null $unsubscribed_at
 * @property Carbon|null $notified_at
 * @property int|null $notified_document_id
 * @property string $source
 * @property-read Vehicle $vehicle
 */
class FitmentSubscription extends Model
{
    protected $fillable = ['email', 'vehicle_id', 'source'];

    protected function casts(): array
    {
        return [
            'confirmed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
            'notified_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        // Both tokens are minted on creation and never change: the links in a mail sent a year
        // ago must still work, and must not be guessable from anything printed on the page.
        static::creating(function (self $subscription): void {
            $subscription->confirm_token ??= Str::random(64);
            $subscription->unsubscribe_token ??= Str::random(64);
        });
    }

    /** @return BelongsTo<Vehicle, $this> */
    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    /**
     * Confirmed, not unsubscribed: the only rows that are ever mailed a match.
     *
     * @param  Builder<FitmentSubscription>  $query
     * @return Builder<FitmentSubscription>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotNull('confirmed_at')->whereNull('unsubscribed_at');
    }

    public function isActive(): bool
    {
        return $this->confirmed_at !== null && $this->unsubscribed_at === null;
    }

    public function confirmUrl(): string
    {
        return route('benachrichtigung.bestaetigen', ['token' => $this->confirm_token]);
    }

    public function unsubscribeUrl(): string
    {
        return route('benachrichtigung.abmelden', ['token' => $this->unsubscribe_token]);
    }
}
