<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Facades\URL;

/**
 * A customer's account (the `customer` guard): an e-mail address and, once set, a password. Opened with one click
 * after an order (BestellungKontoController); it finds every order placed under its address.
 *
 * The link that sets or resets the password is a signed address carrying a fingerprint of the password it replaces,
 * so it works once: as soon as a password is set, the link it was sent in no longer matches.
 *
 * @property int $id
 * @property string $email
 * @property string|null $password
 * @property CarbonImmutable|null $email_verified_at
 * @property CarbonImmutable|null $last_login_at
 */
class CustomerAccount extends Authenticatable
{
    /** Hours the password link stays valid. */
    public const LINK_HOURS = 24;

    protected $fillable = ['email'];

    protected $hidden = ['password', 'remember_token'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'email_verified_at' => 'immutable_datetime',
            'last_login_at' => 'immutable_datetime',
        ];
    }

    /** The address this account's link to set a password goes to — valid a day, and only until a password is set. */
    public function passwordLink(): string
    {
        return URL::temporarySignedRoute('konto.passwort', now()->addHours(self::LINK_HOURS), ['account' => $this->id, 'v' => $this->fingerprint()]);
    }

    /** A short mark of the password as it is now (or of none): part of every link, so a used link is dead. */
    public function fingerprint(): string
    {
        return substr(hash('sha256', $this->id.'|'.($this->password ?? 'none')), 0, 12);
    }

    /**
     * Every real order placed under this account's address, newest first.
     *
     * @return Builder<Order>
     */
    public function orders(): Builder
    {
        return Order::query()
            ->whereHas('customer', fn (Builder $q) => $q->where('email', $this->email))
            ->where('is_demo', false)
            ->whereNotNull('placed_at')
            ->orderByDesc('placed_at');
    }
}
