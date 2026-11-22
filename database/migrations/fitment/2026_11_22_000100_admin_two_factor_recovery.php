<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bestätigung in zwei Schritten (D-514): the secret and its confirmation were in the table from the start
 * (`totp_secret`, `totp_confirmed_at`); what the sign-in now needs beside them.
 *
 *   - `totp_recovery_codes`: the eight one-time codes for a lost phone, each kept only as its SHA-256 — a
 *     leaked row names none of them. Used codes leave the list.
 *   - `totp_last_step`: the 30-second step of the last code taken, so the same code is never taken twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admin_users', function (Blueprint $table): void {
            $table->text('totp_recovery_codes')->nullable()->after('totp_confirmed_at');
            $table->unsignedBigInteger('totp_last_step')->nullable()->after('totp_recovery_codes');
        });
    }

    public function down(): void
    {
        Schema::table('admin_users', function (Blueprint $table): void {
            $table->dropColumn(['totp_recovery_codes', 'totp_last_step']);
        });
    }
};
