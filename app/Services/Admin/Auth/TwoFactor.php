<?php

declare(strict_types=1);

namespace App\Services\Admin\Auth;

use App\Models\AdminUser;
use App\Support\Auth\Totp;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Bestätigung in zwei Schritten for the admin (D-514): required for the Super-Admin, offered to everyone else.
 *
 * The secret is the one in `admin_users.totp_secret` (encrypted at rest). A secret that cannot be read — written under
 * an APP_KEY since replaced — is no second factor: the account counts as not set up, so its owner is asked to set it up
 * again instead of being locked out by a check nobody can pass.
 *
 * A code is taken once (`totp_last_step`, rimify.admin.totp_single_use); a recovery code once, and then it is gone.
 * Codes are judged by the wall clock (`time()`), never by the application's: the phone knows only the real time, and the
 * browser suite may answer a request as on another day (E2eToday).
 */
final class TwoFactor
{
    public const RECOVERY_CODES = 8;

    /** The secret, or null when none is set up or it cannot be read. */
    public function secretOf(AdminUser $admin): ?string
    {
        $raw = $admin->getRawOriginal('totp_secret');

        if (! is_string($raw) || $raw === '' || $admin->totp_confirmed_at === null) {
            return null;
        }

        try {
            return Crypt::decryptString($raw);
        } catch (DecryptException) {
            return null;
        }
    }

    /** Whether the sign-in asks this account for a code. */
    public function isActive(AdminUser $admin): bool
    {
        return $this->secretOf($admin) !== null;
    }

    /** A secret is stored but cannot be read: set up once, to be set up again. */
    public function isUnreadable(AdminUser $admin): bool
    {
        return $admin->hasTwoFactorEnabled() && ! $this->isActive($admin);
    }

    /** The Super-Admin may do nothing in the panel until it is set up. */
    public function mustSetUp(AdminUser $admin): bool
    {
        return $admin->isSuperAdmin() && ! $this->isActive($admin);
    }

    /**
     * A code from the app, or a recovery code: `code` or `recovery` when it is taken, null when not. Under a row lock, so
     * two requests carrying the same code cannot both pass.
     */
    public function verify(AdminUser $admin, string $input): ?string
    {
        return DB::transaction(function () use ($admin, $input): ?string {
            $row = AdminUser::query()->whereKey($admin->getKey())->lockForUpdate()->first();
            $secret = $row instanceof AdminUser ? $this->secretOf($row) : null;

            if (! $row instanceof AdminUser || $secret === null) {
                return null;
            }

            $singleUse = (bool) config('rimify.admin.totp_single_use', true);
            $last = $row->getAttribute('totp_last_step');
            $step = Totp::match($secret, $input, time(), $singleUse && is_numeric($last) ? (int) $last : null);

            if ($step !== null) {
                $row->forceFill(['totp_last_step' => $step])->save();
                $admin->setRawAttributes($row->getAttributes(), true);

                return 'code';
            }

            $hashes = $this->recoveryHashes($row);
            $given = hash('sha256', self::normalise($input));
            $left = array_values(array_filter($hashes, static fn (string $hash): bool => ! hash_equals($hash, $given)));

            if (self::normalise($input) === '' || count($left) === count($hashes)) {
                return null;
            }

            $row->forceFill(['totp_recovery_codes' => json_encode($left)])->save();
            $admin->setRawAttributes($row->getAttributes(), true);

            return 'recovery';
        });
    }

    /**
     * The secret shown during setup, confirmed by a code it makes: stored, with eight new recovery codes — returned once,
     * in plain, and never again. Null when the code does not belong to the secret.
     *
     * @return list<string>|null
     */
    public function confirm(AdminUser $admin, string $secret, string $code): ?array
    {
        $step = Totp::match($secret, $code, time());

        if ($step === null) {
            return null;
        }

        $codes = self::newRecoveryCodes();

        $admin->forceFill([
            'totp_secret' => $secret,
            'totp_confirmed_at' => now(),
            'totp_last_step' => $step,
            'totp_recovery_codes' => json_encode(array_map(static fn (string $c): string => hash('sha256', self::normalise($c)), $codes)),
        ])->save();

        return $codes;
    }

    /**
     * Eight new recovery codes in place of the old ones.
     *
     * @return list<string>
     */
    public function renewRecoveryCodes(AdminUser $admin): array
    {
        $codes = self::newRecoveryCodes();
        $admin->forceFill(['totp_recovery_codes' => json_encode(array_map(static fn (string $c): string => hash('sha256', self::normalise($c)), $codes))])->save();

        return $codes;
    }

    public function recoveryCodesLeft(AdminUser $admin): int
    {
        return count($this->recoveryHashes($admin));
    }

    public function disable(AdminUser $admin): void
    {
        $admin->forceFill(['totp_secret' => null, 'totp_confirmed_at' => null, 'totp_recovery_codes' => null, 'totp_last_step' => null])->save();
    }

    /** @return list<string> */
    private function recoveryHashes(AdminUser $admin): array
    {
        $raw = $admin->getRawOriginal('totp_recovery_codes');
        $list = is_string($raw) ? json_decode($raw, true) : null;

        return is_array($list) ? array_values(array_filter($list, 'is_string')) : [];
    }

    /** @return list<string> */
    private static function newRecoveryCodes(): array
    {
        $codes = [];

        // No 0/o, 1/l/i: a code read off paper is typed right the first time.
        $alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
        $pick = static fn (): string => implode('', array_map(static fn (): string => $alphabet[random_int(0, strlen($alphabet) - 1)], range(1, 5)));

        while (count($codes) < self::RECOVERY_CODES) {
            $code = $pick().'-'.$pick();
            $codes[$code] = $code;
        }

        return array_values($codes);
    }

    /** A recovery code as typed: case, spaces and the hyphen do not matter. */
    private static function normalise(string $input): string
    {
        return Str::lower((string) preg_replace('/[^A-Za-z0-9]/', '', $input));
    }
}
