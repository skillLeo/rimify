<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/*
 * Fahrzeuge › Import (his admin item 2, D-297): one row per Probelauf of a vehicle dataset and the import it became —
 * the file's cells as read, the mapping, the plan per row and its counts. The cars themselves stay in `vehicles`; what
 * they came from is the source each carries (`import_kba`, `import_tecdoc`, `import_dat`) and their own `raw` row.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_imports', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admin_user_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->string('file_name', 200);
            $table->string('file_format', 8)->comment('csv | xlsx');
            $table->char('file_sha256', 64);
            $table->string('source', 24)->comment('import_kba | import_tecdoc | import_dat: what every car it creates is stamped with');
            $table->string('status', 16)->default('previewed')->comment('previewed | applied');
            $table->json('file')->comment('the headers and the cells as read');
            $table->json('mapping')->comment('field => column header');
            $table->json('rows')->comment('the rows after mapping, the contract fields as typed');
            $table->json('plan')->comment('per row: create | update | unchanged | merge | kept | refused, and why');
            $table->json('summary')->comment('counts per outcome');
            $table->timestamp('applied_at')->nullable();
            $table->foreignId('applied_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'idx_vehicle_import_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_imports');
    }
};
