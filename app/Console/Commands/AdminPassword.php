<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AdminUser;
use App\Services\Admin\AuditTrail;
use App\Support\Security\KnownPasswords;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

/**
 * `rimify:admin-passwort <email>`: sets an admin account's password from the operator's side and ends every session
 * of that account (D-141). The password is asked for, never an argument: piped in, it is on no command line and in no
 * shell history —
 *
 *   printf '%s\n' "$NEW" | php artisan rimify:admin-passwort admin@rimify.test
 *
 * Refused: a password shorter than 16 characters, and one that has stood in the repository (KnownPasswords). What
 * the Protokoll keeps is that it happened and why, never the password.
 */
final class AdminPassword extends Command
{
    public const MIN_LENGTH = 16;

    protected $signature = 'rimify:admin-passwort
        {email : The account’s address}
        {--grund= : Why, for the Protokoll}';

    protected $description = 'Set an admin account’s password (asked for, never an argument) and end all its sessions';

    public function handle(): int
    {
        $email = mb_strtolower(trim((string) $this->argument('email')));
        $user = AdminUser::query()->where('email', $email)->first();

        if ($user === null) {
            $this->error("Kein Konto mit der Adresse {$email}.");

            return self::FAILURE;
        }

        $password = rtrim((string) $this->secret('Neues Passwort'), "\r\n");

        if (mb_strlen($password) < self::MIN_LENGTH) {
            $this->error('Das Passwort braucht mindestens '.self::MIN_LENGTH.' Zeichen. Nichts geändert.');

            return self::FAILURE;
        }

        if (KnownPasswords::contains($password) || mb_strtolower($password) === $email) {
            $this->error('Dieses Passwort stand im Repository oder ist die Adresse selbst. Nichts geändert.');

            return self::FAILURE;
        }

        // The `hashed` cast hashes it; the plain value never reaches the table. Every session ends on its next request
        // (EnsureAdminSessionValid), and no "Angemeldet bleiben" cookie brings one back.
        $user->forceFill(['password' => $password, 'sessions_revoked_at' => Date::now()]);
        $user->setRememberToken(Str::random(60));
        $user->save();

        $reason = trim((string) $this->option('grund'));

        AuditTrail::system('System', 'admin.password_reset', array_filter([
            'user_id' => (int) $user->getKey(),
            'email' => $user->email,
            'reason' => $reason === '' ? null : $reason,
        ], static fn (mixed $value): bool => $value !== null), $user);

        $this->info("Neues Passwort gesetzt für {$user->email}; alle Sitzungen des Kontos sind beendet.");

        return self::SUCCESS;
    }
}
