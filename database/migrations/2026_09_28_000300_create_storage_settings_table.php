<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Einstellungen › Medien und Speicher: the bucket's settings as the operator entered them.
 *
 * Two rows at most. `active` is the set the disks are built from — it passed the connection test
 * when it was saved. `pending` is a set saved but not (yet) working: kept so the operator can
 * correct it, never used. The access key and the secret are stored encrypted (the model's cast), so
 * a database dump never shows them; their last four characters are kept apart for the masked field
 * and the audit entry.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('storage_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('state', 8)->unique();
            $table->string('provider', 16)->default('s3');
            $table->string('region', 32)->default('eu-north-1');
            $table->string('bucket', 63)->nullable();
            $table->string('endpoint', 255)->nullable();
            $table->boolean('path_style')->default(false);
            $table->string('public_url', 255)->nullable();
            $table->text('access_key')->nullable();
            $table->text('secret')->nullable();
            $table->char('key_last4', 4)->nullable();
            $table->char('secret_last4', 4)->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->json('last_test')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();
        });

        DB::statement("ALTER TABLE storage_settings ADD CONSTRAINT chk_storage_state CHECK (state IN ('active', 'pending'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('storage_settings');
    }
};
