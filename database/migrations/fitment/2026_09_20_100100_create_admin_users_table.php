<?php

declare(strict_types=1);

use App\Enums\AdminUserStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Admin-only authentication. There are no customer accounts — checkout is guest-only per the PRD,
 * so this is the only table in the application with a password in it.
 *
 * First migration of the fitment slice: `created_by` on approval documents and fitments points
 * here, so every compliance row has a name attached to it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');

            // TOTP is mandatory for Super Admin (spec §12); the secret is encrypted at rest.
            $table->text('totp_secret')->nullable();
            $table->timestamp('totp_confirmed_at')->nullable();

            $table->string('status', 16)->default(AdminUserStatus::Invited->value);

            // The login shows an error after the first failure and the lockout warning only after
            // the second (spec §9), which needs the count, not just a boolean.
            $table->unsignedSmallInteger('failed_login_count')->default(0);
            $table->timestamp('locked_until')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();

            $table->rememberToken();
            $table->timestamps();

            $table->index('status');
        });

        Constraints::enum('admin_users', 'status', AdminUserStatus::values());
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_users');
    }
};
