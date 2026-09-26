<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Services\Admin\PermissionMatrix;
use Carbon\CarbonImmutable;
use Database\Factories\AdminUserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Traits\HasRoles;

/**
 * The only account type in the application. There are no customer accounts — checkout is guest
 * only, per the PRD.
 *
 * @property string $name
 * @property string $email
 * @property AdminUserStatus $status
 * @property string|null $totp_secret
 * @property CarbonImmutable|null $totp_confirmed_at
 * @property CarbonImmutable|null $locked_until
 * @property CarbonImmutable|null $last_login_at
 * @property int $failed_login_count
 * @property array<string, mixed>|null $preferences
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
            'preferences' => 'array',
        ];
    }

    /**
     * Whether this person has collapsed the admin rail. Absent, malformed or never set reads as
     * open — the default the panel is designed around.
     */
    public function railCollapsed(): bool
    {
        return ($this->preferences['rail'] ?? null) === 'collapsed';
    }

    /** The rail's width as this person dragged it (232–400 px); the default until they do. */
    public const RAIL_WIDTH_DEFAULT = 260;

    public const RAIL_WIDTH_MIN = 232;

    public const RAIL_WIDTH_MAX = 400;

    public function railWidth(): int
    {
        $width = $this->preferences['railWidth'] ?? null;

        return is_int($width) && $width >= self::RAIL_WIDTH_MIN && $width <= self::RAIL_WIDTH_MAX ? $width : self::RAIL_WIDTH_DEFAULT;
    }

    /**
     * The German label of the first role this account holds — the hat the panel says this person is
     * wearing. Its bare name when the role has no label; null when the account holds no role at all,
     * in which case the caller shows the e-mail address rather than inventing a role.
     */
    public function roleLabel(): ?string
    {
        $name = $this->getRoleNames()->first();

        if (! is_string($name)) {
            return null;
        }

        $label = DB::table('roles')->where('name', $name)->where('guard_name', 'admin')->value('label_de');

        return is_string($label) && $label !== '' ? $label : $name;
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

    /**
     * Whether any role this account holds allows the action on the module. Policies ask this and
     * never a role name (R-11): what a role may do is data, and the panel edits it.
     */
    public function may(PermissionModule $module, PermissionAction $action): bool
    {
        return app(PermissionMatrix::class)->allows($this, $module, $action);
    }
}
