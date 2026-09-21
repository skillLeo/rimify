<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The audit trail.
 *
 * Published from spatie/laravel-activitylog and edited: this version of the package hard-codes
 * `activity_log` and no longer exposes a `table_name` config key, and the build specifies
 * `audit_logs`. The table is renamed here and `config/activitylog.php` points `activity_model` at
 * App\Models\AuditLog, which carries the matching `$table`.
 *
 * Extra columns beyond the package's own: `ip_address` and `correlation_id` for tracing a request
 * end to end, and `actor_email` so an entry stays readable after the admin user is removed.
 *
 * Append-only triggers are added in the commerce slice, once every table they protect exists.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('log_name')->nullable()->index();
            $table->text('description');
            $table->nullableMorphs('subject', 'subject');
            $table->string('event')->nullable();
            $table->nullableMorphs('causer', 'causer');
            $table->json('attribute_changes')->nullable();
            $table->json('properties')->nullable();

            $table->string('actor_email')->nullable()->comment('kept even if the user is later removed');
            $table->string('ip_address', 45)->nullable();
            $table->char('correlation_id', 36)->nullable();

            $table->timestamps();

            $table->index('event', 'idx_audit_event');
            $table->index('correlation_id', 'idx_audit_correlation');
            $table->index('created_at', 'idx_audit_created');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
