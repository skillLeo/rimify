<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * *Überall abmelden*: the moment before which every session of this account stops counting.
 *
 * One timestamp rather than a sessions table: every signed-in session carries the second it was
 * started in (`admin_authenticated_at`), and EnsureAdminSessionValid ends any session that began
 * before this. Null means nothing was ever revoked. Suspending an account writes it too.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_users', function (Blueprint $table): void {
            $table->timestamp('sessions_revoked_at')->nullable()->after('last_login_ip');
        });
    }

    public function down(): void
    {
        Schema::table('admin_users', function (Blueprint $table): void {
            $table->dropColumn('sessions_revoked_at');
        });
    }
};
