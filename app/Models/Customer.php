<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\CustomerFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A guest purchaser. No password, no account, no login — checkout collects only what is needed to
 * fulfil and invoice (PRD §2, and the GDPR posture in spec §12).
 */
class Customer extends Model
{
    /** @use HasFactory<CustomerFactory> */
    use HasFactory;

    protected $fillable = ['email', 'firstname', 'lastname', 'phone'];

    /** @return HasMany<Order, $this> */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /** @return HasMany<Address, $this> */
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }
}
