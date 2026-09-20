<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AdminUserStatus;
use Carbon\CarbonImmutable;
use Database\Factories\AdminUserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

/**
 * The only account type in the application. There are no customer accounts — checkout is guest
 * only, per the PRD.
 *
 * @property AdminUserStatus $status
 * @property string|null $totp_secret
 * @property CarbonImmutable|null $totp_confirmed_at
 * @property CarbonImmutable|null $locked_until
 * @property CarbonImmutable|null $last_login_at
 * @property int $failed_login_count
 */
class AdminUser extends Authenticatable
{
    /** @use HasFactory<AdminUserFactory> */
    use HasFactory;

    use HasRoles;
    use Notifiable;

    /** Spatie's roles and permissions for this model live under the `admin` guard. */
    protected string $guard_name = 'admin';

    protected $fillable = [
        'name', 'email', 'password', 'totp_secret', 'totp_confirmed_at', 'status',
    ];

    /** @var list<string> */
    protected $hidden = ['password', 'remember_token', 'totp_secret'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            // Encrypted at rest: a leaked database row must not hand over a second factor.
            'totp_secret' => 'encrypted',
            'totp_confirmed_at' => 'immutable_datetime',
            'last_login_at' => 'immutable_datetime',
            'locked_until' => 'immutable_datetime',
            'failed_login_count' => 'integer',
            'status' => AdminUserStatus::class,
        ];
    }

    public function hasTwoFactorEnabled(): bool
    {
        return $this->totp_secret !== null && $this->totp_confirmed_at !== null;
    }

    public function isLockedOut(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    public function canSignIn(): bool
    {
        return $this->status->canSignIn() && ! $this->isLockedOut();
    }
}
