<?php

declare(strict_types=1);

use App\Enums\ConflictKind;
use App\Enums\ConflictStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The two index tables and the conflict register.
 *
 * `load_index_table` and `speed_symbol_table` are real rows, not hard-coded arrays, so the
 * client's compliance owner can verify them against a printed reference without a deployment.
 * They are seeded from App\Domain\Fitment\Derivation\ReferenceTables, and a test asserts the two
 * agree — one source, so the seed and the oracle cannot drift.
 *
 * `fitment_conflicts` exists because an unresolved conflict must be a row with a status that
 * appears on the dashboard until someone deals with it, never a toast that scrolls away.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('load_index_table', function (Blueprint $table): void {
            $table->unsignedSmallInteger('load_index')->primary();
            $table->unsignedSmallInteger('capacity_kg');
        });

        Constraints::add('load_index_table', 'chk_load_index_capacity', '`capacity_kg` > 0');

        Schema::create('speed_symbol_table', function (Blueprint $table): void {
            $table->string('symbol', 3)->primary();
            $table->unsignedSmallInteger('speed_rank')->unique();
            // NULL means "above 300 km/h" — the (Y) case. It is not "unknown".
            $table->unsignedSmallInteger('max_kmh')->nullable();
        });

        Constraints::add('speed_symbol_table', 'chk_speed_rank', '`speed_rank` > 0');
        Constraints::add('speed_symbol_table', 'chk_speed_max', '`max_kmh` IS NULL OR `max_kmh` > 0');

        Schema::create('fitment_conflicts', function (Blueprint $table): void {
            $table->id();
            $table->string('kind', 32);
            $table->string('status', 32)->default(ConflictStatus::Open->value);

            $table->foreignId('vehicle_id')->constrained('vehicles')->restrictOnDelete();
            $table->foreignId('wheel_config_id')->constrained('wheel_configs')->restrictOnDelete();

            // The candidate row is nullable because a BLOCKING conflict is detected before the
            // row can be saved: there is nothing to point at yet, only the payload that was refused.
            $table->foreignId('candidate_fitment_id')->nullable()->constrained('fitments')->nullOnDelete();
            $table->foreignId('existing_fitment_id')->constrained('fitments')->restrictOnDelete();

            $table->json('detail')->comment('both sides of the disagreement, as shown side by side');
            $table->boolean('blocking')->default(false);

            $table->foreignId('detected_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->foreignId('resolved_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_note')->nullable();
            $table->timestamps();

            $table->index(['status', 'kind'], 'idx_conflict_open');
            $table->index(['vehicle_id', 'wheel_config_id'], 'idx_conflict_pair');
        });

        Constraints::enum('fitment_conflicts', 'kind', ConflictKind::values());
        Constraints::enum('fitment_conflicts', 'status', ConflictStatus::values());
    }

    public function down(): void
    {
        Schema::dropIfExists('fitment_conflicts');
        Schema::dropIfExists('speed_symbol_table');
        Schema::dropIfExists('load_index_table');
    }
};
