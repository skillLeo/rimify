<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\AdminUserStatus;
use App\Models\AdminUser;
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
            'totp_secret' => Str::random(32),
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
