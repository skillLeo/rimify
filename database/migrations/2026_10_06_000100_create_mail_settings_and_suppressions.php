<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Einstellungen › E-Mail (Amazon SES, eu-north-1 — the brief „AFTER CI“, §3), and the addresses SES reported as
 * undeliverable or complaining.
 *
 * `mail_settings` mirrors storage_settings: two rows at most — `active`, the set the shop sends with (it passed the
 * connection test when it was saved), and `pending`, a set saved but not working, kept for correcting and never used.
 * The access key and the secret are encrypted by the model's cast; their last four characters are kept apart.
 *
 * `mail_suppressions` holds one row per address and SNS message: a hard bounce or a complaint, as SES reported it. The
 * shop sends nothing more to an address with a row that is not released; the SNS message id makes a repeated delivery
 * of the same notification a no-op.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mail_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('state', 8)->unique();
            $table->string('region', 32)->default('eu-north-1');
            $table->string('from_address', 254)->nullable();
            $table->string('from_name', 120)->nullable();
            $table->text('access_key')->nullable();
            $table->text('secret')->nullable();
            $table->char('key_last4', 4)->nullable();
            $table->char('secret_last4', 4)->nullable();
            // The SNS topic SES reports bounces and complaints to: a notification from any other topic is refused.
            $table->string('topic_arn', 256)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('last_test')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE mail_settings ADD CONSTRAINT chk_mail_state CHECK (state IN ('active', 'pending'))");

        Schema::create('mail_suppressions', function (Blueprint $table): void {
            $table->id();
            $table->string('email', 254)->index();
            $table->string('reason', 16);
            // SES's own words for it: the bounce's type and subtype, or the complaint's feedback type.
            $table->string('detail', 255)->nullable();
            $table->string('sns_message_id', 100);
            $table->timestamp('occurred_at');
            $table->timestamp('released_at')->nullable();
            $table->foreignId('released_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['sns_message_id', 'email']);
        });

        DB::statement("ALTER TABLE mail_suppressions ADD CONSTRAINT chk_mail_suppression_reason CHECK (reason IN ('bounce', 'complaint'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('mail_suppressions');
        Schema::dropIfExists('mail_settings');
    }
};
