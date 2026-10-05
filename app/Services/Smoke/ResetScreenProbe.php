<?php

declare(strict_types=1);

namespace App\Services\Smoke;

use App\Enums\AdminUserStatus;
use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Services\Reset\TestEnvironment;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * System › Zurücksetzen as every role meets it, for `rimify:smoke` (the operator's brief of 05.10.2026, §0; GO-LIVE.md
 * §4.4): through the app's own HTTP stack, since who may see the page is the app's decision, not the web server's. One
 * throw-away account per role — signed in and past the password prompt, as a person would be — made inside a database
 * transaction that is always rolled back, so nothing it makes stays.
 *
 * What the server must answer: where the reset is available, 200 to a Super-Admin and 404 to every other role;
 * everywhere else — production first of all — 404 to everyone, the Super-Admin included.
 */
final class ResetScreenProbe
{
    public const URL = '/admin/system/zuruecksetzen';

    public const SUPER_ADMIN = 'super-admin';

    /**
     * The status each role gets, by role name.
     *
     * @return array<string, int>
     */
    public function statuses(): array
    {
        $roles = DB::table('roles')->where('guard_name', 'admin')->orderBy('id')->pluck('name')->map(static fn (mixed $r): string => (string) $r)->all();
        $driver = config('session.driver');
        $statuses = [];

        // A session in memory: the probe leaves no session file or row behind either.
        config(['session.driver' => 'array']);
        DB::beginTransaction();

        try {
            foreach ($roles as $role) {
                $statuses[$role] = $this->statusAs($this->account($role));
            }
        } finally {
            DB::rollBack();
            config(['session.driver' => $driver]);
            app('session')->forgetDrivers();
            Auth::forgetGuards();
        }

        return $statuses;
    }

    /**
     * What is wrong with the answers, one German sentence each — none when the server answers as it must.
     *
     * @param  array<string, int>  $statuses
     * @return list<string>
     */
    public static function faults(array $statuses, bool $available): array
    {
        $faults = [];

        if ($statuses === []) {
            return ['keine Rolle in der Datenbank – die Seite lässt sich nicht prüfen'];
        }

        foreach ($statuses as $role => $status) {
            $expected = $available && $role === self::SUPER_ADMIN ? 200 : 404;

            if ($status !== $expected) {
                $faults[] = "Rolle „{$role}“ bekommt HTTP {$status} statt {$expected}";
            }
        }

        if ($available && ! array_key_exists(self::SUPER_ADMIN, $statuses)) {
            $faults[] = 'die Rolle Super-Admin fehlt';
        }

        return $faults;
    }

    /** A signed-in, confirmed account with exactly this role, inside the probe's transaction. */
    private function account(string $role): AdminUser
    {
        $user = AdminUser::query()->forceCreate([
            'name' => 'Smoke-Test ('.$role.')',
            'email' => 'smoke-'.Str::lower((string) Str::ulid()).'@rimify.invalid',
            'password' => Str::random(48),
            'status' => AdminUserStatus::Active,
        ]);
        $user->assignRole($role);

        return $user;
    }

    private function statusAs(AdminUser $user): int
    {
        // A fresh guard and a fresh session for every account: nothing of the one before carries over.
        Auth::forgetGuards();
        app('session')->forgetDrivers();
        app('session')->driver()->put(EnsureSudo::SESSION_KEY, now()->getTimestamp());
        Auth::guard('admin')->setUser($user);

        return app(HttpKernel::class)->handle(Request::create(self::URL, 'GET'))->getStatusCode();
    }

    /** Whether the reset is available on this server — what the answers are measured against. */
    public static function available(): bool
    {
        return TestEnvironment::available();
    }
}
