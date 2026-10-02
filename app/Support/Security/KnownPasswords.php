<?php

declare(strict_types=1);

namespace App\Support\Security;

use App\Models\AdminUser;
use Database\Seeders\ReviewAccountsSeeder;
use Illuminate\Support\Facades\Hash;

/**
 * The passwords that have stood in the repository (D-141): the development accounts', the review accounts', and the
 * factories'. A database may carry them only where a known password is harmless — a developer's machine and the test
 * suite. Anywhere else an account that opens with one is open to whoever read the repository while it was public.
 */
final class KnownPasswords
{
    /** @var list<string> */
    public const LIST = ['rimify-dev-2026', ReviewAccountsSeeder::PASSWORD, 'password'];

    public static function contains(string $password): bool
    {
        return in_array($password, self::LIST, true);
    }

    /**
     * The addresses of the accounts that may sign in and open with one of them.
     *
     * @return list<string>
     */
    public static function openAccounts(): array
    {
        $open = [];

        foreach (AdminUser::query()->orderBy('id')->get() as $user) {
            // The status, not canSignIn(): a lock after wrong guesses runs out, and the password is still known after it.
            if (! $user->status->canSignIn() || $user->password === '') {
                continue;
            }

            foreach (self::LIST as $known) {
                if (Hash::check($known, $user->password)) {
                    $open[] = $user->email;

                    break;
                }
            }
        }

        return $open;
    }
}
