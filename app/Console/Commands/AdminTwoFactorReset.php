<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\AdminUser;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Auth\TwoFactor;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Str;

/**
 * `rimify:zwei-faktor-zuruecksetzen <email>`: the way back for an admin who lost both the phone and the recovery codes
 * (D-514) — from the operator's side, on the host, never from the panel. The second factor is removed and every session
 * of the account ends; at the next sign-in a Super-Admin is asked to set it up again, anyone else may. The Protokoll
 * keeps that it happened and why.
 */
final class AdminTwoFactorReset extends Command
{
    protected $signature = 'rimify:zwei-faktor-zuruecksetzen
        {email : The account’s address}
        {--grund= : Why, for the Protokoll}';

    protected $description = 'Remove an admin account’s second factor (lost phone and recovery codes) and end all its sessions';

    public function handle(TwoFactor $twoFactor): int
    {
        $email = mb_strtolower(trim((string) $this->argument('email')));
        $user = AdminUser::query()->where('email', $email)->first();

        if ($user === null) {
            $this->error("Kein Konto mit der Adresse {$email}.");

            return self::FAILURE;
        }

        $reason = trim((string) $this->option('grund'));

        if ($reason === '') {
            $this->error('Bitte nenn mit --grund= den Anlass, für das Protokoll. Nichts geändert.');

            return self::FAILURE;
        }

        $twoFactor->disable($user);
        $user->forceFill(['sessions_revoked_at' => Date::now()]);
        $user->setRememberToken(Str::random(60));
        $user->save();

        AuditTrail::system('System', 'admin.two_factor_reset', ['user_id' => (int) $user->getKey(), 'email' => $user->email, 'reason' => $reason], $user);

        $this->info("Bestätigung in zwei Schritten entfernt für {$user->email}; alle Sitzungen des Kontos sind beendet.");

        return self::SUCCESS;
    }
}
