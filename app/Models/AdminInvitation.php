<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Models\Role;

/**
 * An invitation into the admin: an address, the role it will hold, and a single-use link.
 *
 * The link's token is 32 random bytes, written into the e-mail once and kept here only as its
 * SHA-256 — so the table can recognise a link but never produce one. A new token (resend) replaces
 * the hash, which kills the old link at the same moment. Nothing here is ever deleted: withdrawing
 * sets `revoked_at`, accepting sets `accepted_at`.
 *
 * @property int $id
 * @property string $email
 * @property string|null $name
 * @property int|null $role_id null once a closed invitation's role has been deleted
 * @property string $token_hash
 * @property int|null $invited_by
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $accepted_at
 * @property CarbonImmutable|null $revoked_at
 * @property CarbonImmutable|null $created_at
 * @property CarbonImmutable|null $updated_at
 * @property-read Role|null $role
 * @property-read AdminUser|null $inviter
 */
class AdminInvitation extends Model
{
    /** How long a link stays valid. */
    public const VALID_DAYS = 7;

    /** Random bytes in a token, before encoding. */
    private const TOKEN_BYTES = 32;

    protected $fillable = ['email', 'name', 'role_id', 'token_hash', 'invited_by', 'expires_at'];

    /** @var list<string> */
    protected $hidden = ['token_hash'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'role_id' => 'integer',
            'invited_by' => 'integer',
            'expires_at' => 'immutable_datetime',
            'accepted_at' => 'immutable_datetime',
            'revoked_at' => 'immutable_datetime',
            'created_at' => 'immutable_datetime',
            'updated_at' => 'immutable_datetime',
        ];
    }

    /** A fresh token for a link: 32 random bytes, base64url without padding (43 characters). */
    public static function newToken(): string
    {
        return rtrim(strtr(base64_encode(random_bytes(self::TOKEN_BYTES)), '+/', '-_'), '=');
    }

    /** What the table keeps of a token. */
    public static function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    /** The invitation a link belongs to, whatever its state, or null for a link we never issued. */
    public static function findByToken(string $token): ?self
    {
        return self::query()->where('token_hash', self::hashToken($token))->first();
    }

    /** @return BelongsTo<Role, $this> */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'invited_by');
    }

    /** Neither accepted nor withdrawn — still waiting for an answer, whether or not it has run out. */
    public function isPending(): bool
    {
        return $this->accepted_at === null && $this->revoked_at === null;
    }

    public function isExpired(): bool
    {
        return ! $this->expires_at->isFuture();
    }

    /** The link works right now: waiting for an answer, and not run out. */
    public function isOpen(): bool
    {
        return $this->isPending() && ! $this->isExpired();
    }

    /**
     * What the link says when it is opened. `used` is an accepted invitation; an address that has
     * an account by now reads the same, because the answer to both is "sign in".
     *
     * @return 'open'|'expired'|'revoked'|'used'
     */
    public function state(): string
    {
        return match (true) {
            $this->accepted_at !== null => 'used',
            $this->revoked_at !== null => 'revoked',
            $this->isExpired() => 'expired',
            default => 'open',
        };
    }

    /** The role's German label, its bare name without one, or null when the role is gone. */
    public function roleLabel(): ?string
    {
        $role = $this->role;

        if (! $role instanceof Role) {
            return null;
        }

        $label = $role->getAttribute('label_de');

        return is_string($label) && $label !== '' ? $label : (string) $role->getAttribute('name');
    }

    /**
     * Neither accepted nor withdrawn.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->whereNull('accepted_at')->whereNull('revoked_at');
    }

    /**
     * Waiting for an answer and not yet run out: the links that would work if clicked now.
     *
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNull('accepted_at')->whereNull('revoked_at')->where('expires_at', '>', now());
    }
}
