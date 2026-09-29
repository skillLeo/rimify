<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * A role that was once named in an invitation could never be deleted: `role_id` was RESTRICT, and
 * invitation rows are never deleted — so even a withdrawn or long-accepted invitation pinned its role
 * forever, and "Löschen" failed with a reason that was no longer true.
 *
 * The guard that matters is an OPEN invitation, and the controller refuses that one in German
 * (RollenController::destroy). A closed invitation keeps its history in the Protokoll, which names
 * the role in words; its row simply lets go of the role (NULL) when the role is deleted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_invitations', function (Blueprint $table): void {
            $table->dropForeign(['role_id']);
        });

        Schema::table('admin_invitations', function (Blueprint $table): void {
            $table->unsignedBigInteger('role_id')->nullable()->change();
            $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete()->restrictOnUpdate();
        });
    }

    public function down(): void
    {
        // Rows that already let go of a deleted role cannot point at it again; they are the only ones
        // a NOT NULL column could not hold, and they are closed invitations by construction.
        DB::table('admin_invitations')->whereNull('role_id')->delete();

        Schema::table('admin_invitations', function (Blueprint $table): void {
            $table->dropForeign(['role_id']);
        });

        Schema::table('admin_invitations', function (Blueprint $table): void {
            $table->unsignedBigInteger('role_id')->nullable(false)->change();
            $table->foreign('role_id')->references('id')->on('roles')->restrictOnDelete()->restrictOnUpdate();
        });
    }
};
