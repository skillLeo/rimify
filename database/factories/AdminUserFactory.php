<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AdminUserStatus;
use App\Models\AdminUser;
use App\Support\Auth\Totp;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AdminUser>
 */
class AdminUserFactory extends Factory
{
    protected $model = AdminUser::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'password' => 'password',
            'status' => AdminUserStatus::Active->value,
            'failed_login_count' => 0,
            'remember_token' => Str::random(10),
        ];
    }

    public function withTwoFactor(): static
    {
        return $this->state(fn (): array => [
            // A key an app could hold (base32), so a test can make its codes (Totp::codeAt).
            'totp_secret' => Totp::newSecret(),
            'totp_confirmed_at' => now(),
        ]);
    }

    public function suspended(): static
    {
        return $this->state(fn (): array => ['status' => AdminUserStatus::Suspended->value]);
    }

    public function lockedOut(): static
    {
        return $this->state(fn (): array => [
            'failed_login_count' => 5,
            'locked_until' => now()->addMinutes(15),
        ]);
    }
}
