<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AdminUserStatus;
use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;
use Spatie\Permission\Models\Role;

/**
 * The client's review accounts (the review release §3): one per role he is asked to try — Verkauf,
 * Lager, Admin. Their passwords are in docs/review/ACCOUNTS.md, which lives on the operator's machine only.
 *
 * Local and staging only: it refuses wherever the review is off (`rimify.review.enabled`), which the
 * live shop always is.
 *
 * A password is set when an account is made and never again (D-141). Every staging deploy runs this
 * seeder, and until 02.10.2026 every deploy put back one obvious password — which stood in the
 * repository while the repository was public. Locally and in the tests a new account gets that known
 * development password, so the suites can sign in; anywhere else it gets a random one nobody knows,
 * and the operator sets the real one (`rimify:admin-passwort`).
 */
class ReviewAccountsSeeder extends Seeder
{
    /** The development password: set on local and testing databases only, never anywhere else. */
    public const PASSWORD = 'rimify-review-2026';

    /** email => [name, role] — German names: the rail's foot shows them on every page. */
    public const ACCOUNTS = [
        'verkauf@rimify.test' => ['Testzugang Verkauf', 'order-manager'],
        'lager@rimify.test' => ['Testzugang Lager', 'catalogue-manager'],
        'admin@rimify.test' => ['Testzugang Admin', 'super-admin'],
    ];

    public function run(): void
    {
        if (! (bool) config('rimify.review.enabled', false)) {
            throw new RuntimeException('Review accounts are made only where the review is on (RIMIFY_REVIEW), never on the live shop.');
        }

        foreach (self::ACCOUNTS as $email => [$name, $role]) {
            $user = AdminUser::query()->firstOrNew(['email' => $email]);
            $made = ! $user->exists;

            $user->forceFill(['name' => $name, 'status' => AdminUserStatus::Active->value]);

            if ($made) {
                $user->forceFill(['password' => self::firstPassword()]);
            }

            $user->save();
            $user->syncRoles([Role::query()->where('name', $role)->where('guard_name', 'admin')->firstOrFail()]);

            // db:seed (remote.sh, the tests' seed()) always hands the seeder its console.
            if ($made && ! self::knownPasswordAllowed()) {
                $this->command->warn("{$email}: angelegt mit einem Zufallspasswort, das niemand kennt – setze es mit rimify:admin-passwort.");
            }
        }
    }

    /** Only a development database may carry a password anyone has read. */
    public static function knownPasswordAllowed(): bool
    {
        return app()->environment(['local', 'testing']);
    }

    private static function firstPassword(): string
    {
        return self::knownPasswordAllowed() ? self::PASSWORD : Str::password(32);
    }
}
