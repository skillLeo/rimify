<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AdminUserStatus;
use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Services\Admin\PermissionMatrix;
use App\Services\Admin\PermissionProbe;
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

    /**
     * Sets some of this person's preferences and keeps the rest as they are in the database now — not
     * as this request read them. The rail, the Übersicht's period and the alert choices are saved by
     * separate requests that can overlap (a rail save beside a `?zeitraum=` visit), and a write from a
     * stale copy of the whole column would quietly undo the other. The row is locked while merging.
     *
     * @param  array<string, mixed>  $changes
     */
    public function rememberPreferences(array $changes): void
    {
        $this->changePreferences(fn (array $current): array => array_merge($current, $changes));
    }

    /**
     * The rail as a save from the browser left it — unless a later save got here first. Every save
     * carries a revision that only ever grows (the browser's clock, never below its last one); an
     * older one arriving after a newer one — two requests overtaking each other, a second tab — is
     * dropped rather than written over it. A save without one (a plain form) is always taken.
     *
     * @return bool whether it was taken
     */
    public function rememberRail(?string $rail, ?int $width, ?int $rev): bool
    {
        $taken = false;

        $this->changePreferences(function (array $current) use ($rail, $width, $rev, &$taken): array {
            if ($rev !== null && $rev <= self::revOf($current)) {
                return $current;
            }

            $taken = true;

            return array_merge(
                $current,
                $rail !== null ? ['rail' => $rail] : [],
                $width !== null ? ['railWidth' => $width] : [],
                $rev !== null ? ['railRev' => $rev] : [],
            );
        });

        return $taken;
    }

    /**
     * The columns this person wants in one list (AdminLists), kept beside their choice for the others
     * — unless a later save of that list's columns got here first (the revision, as for the rail).
     *
     * @param  list<string>  $columns
     * @return bool whether it was taken
     */
    public function rememberColumns(string $list, array $columns, ?int $rev = null): bool
    {
        $taken = false;

        $this->changePreferences(static function (array $current) use ($list, $columns, $rev, &$taken): array {
            $revs = is_array($current['columnsRev'] ?? null) ? $current['columnsRev'] : [];
            $last = is_int($revs[$list] ?? null) ? $revs[$list] : 0;

            if ($rev !== null && $rev <= $last) {
                return $current;
            }

            $taken = true;
            $all = is_array($current['columns'] ?? null) ? $current['columns'] : [];
            $all[$list] = $columns;

            if ($rev !== null) {
                $revs[$list] = $rev;
            }

            return [...$current, 'columns' => $all, 'columnsRev' => $revs];
        });

        return $taken;
    }

    /** The revision of the rail's last save; 0 before the first. */
    public function railRev(): int
    {
        return self::revOf(is_array($this->preferences) ? $this->preferences : []);
    }

    /** @param  array<string, mixed>  $preferences */
    private static function revOf(array $preferences): int
    {
        return is_int($preferences['railRev'] ?? null) && $preferences['railRev'] > 0 ? $preferences['railRev'] : 0;
    }

    /**
     * The one way preferences are written: the row locked, the change applied to what it holds now.
     *
     * @param  callable(array<string, mixed>): array<string, mixed>  $change
     */
    private function changePreferences(callable $change): void
    {
        $merged = DB::transaction(function () use ($change): array {
            $fresh = static::query()->whereKey($this->getKey())->lockForUpdate()->firstOrFail();
            $merged = $change(is_array($fresh->preferences) ? $fresh->preferences : []);

            $fresh->forceFill(['preferences' => $merged])->save();

            return $merged;
        });

        $this->preferences = $merged;
        $this->syncOriginalAttribute('preferences');
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

    /**
     * Whether a second factor is set up: asked of the stored value, never by decrypting it. A secret written under
     * another APP_KEY (the preview's key was renewed on 23.09.2026) cannot be read — and must not take down every page
     * that lists the team with „The MAC is invalid“. It is still a second factor that was set up.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return $this->getRawOriginal('totp_secret') !== null && $this->totp_confirmed_at !== null;
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

    /**
     * Whether a screen should offer the action: the same Policy as `can()`, asked as a question — a „no“ is a button not
     * drawn, never a refusal in the Protokoll (ADMIN-GEFUNDEN 509). The attempt itself still asks `can()` in its Form
     * Request, where a refusal is written.
     *
     * @param  iterable<mixed>|string  $abilities
     */
    public function canQuietly(iterable|string $abilities, mixed $arguments = []): bool
    {
        return PermissionProbe::quietly(fn (): bool => $this->can($abilities, $arguments));
    }

    /**
     * The Super-Admin role — for the few screens no other role may ever get, whatever the grid says
     * (the shop's storage keys). Everything else asks `may()`.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super-admin', 'admin');
    }
}
