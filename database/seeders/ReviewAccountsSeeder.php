<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AdminUserStatus;
use App\Models\AdminUser;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use RuntimeException;
use Spatie\Permission\Models\Role;

/**
 * The client's review accounts (the review release §3): one per role he is asked to try — Verkauf,
 * Lager, Admin — each with the same obvious password, written in docs/review/ACCOUNTS.md.
 *
 * Local and staging only: it refuses wherever the review is off (`rimify.review.enabled`), which the
 * live shop always is — an obvious password must never open the real admin.
 */
class ReviewAccountsSeeder extends Seeder
{
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
            $user = AdminUser::query()->updateOrCreate(['email' => $email], [
                'name' => $name,
                'password' => Hash::make(self::PASSWORD),
                'status' => AdminUserStatus::Active->value,
            ]);

            $user->syncRoles([Role::query()->where('name', $role)->where('guard_name', 'admin')->firstOrFail()]);
        }
    }
}
