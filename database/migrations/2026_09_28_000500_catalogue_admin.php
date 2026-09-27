<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What Katalog › Felgen and the importer need (the review release §4.2).
 *
 *  - `wheel_models.seo_title` / `seo_description`: the search result's two lines, written by the team.
 *    NULL means the page builds its own from the name and the sizes.
 *  - `wheel_finishes.image_alt_de`: the sentence a screen reader hears for an uploaded photograph. A
 *    photograph cannot be saved without one (WheelImageRequest).
 *  - `catalogue_imports`: one row per Probelauf and import — the rows exactly as they were checked, what
 *    the run changed, and what it takes to undo it. The import applies what was previewed, never a
 *    second reading of the file.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wheel_models', function (Blueprint $table): void {
            $table->string('seo_title', 70)->nullable()->after('description_de');
            $table->string('seo_description', 170)->nullable()->after('seo_title');
        });

        Schema::table('wheel_finishes', function (Blueprint $table): void {
            $table->string('image_alt_de', 200)->nullable()->after('image_manifest');
        });

        Schema::create('catalogue_imports', function (Blueprint $table): void {
            $table->id();
            // The person, kept by id; their account may go, the record of what they imported stays.
            $table->foreignId('admin_user_id')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->string('file_name', 200);
            $table->string('file_format', 8)->comment('csv | xlsx');
            $table->char('file_sha256', 64);
            // previewed → applied → rolled_back; a Probelauf never applied stays `previewed`.
            $table->string('status', 16)->default('previewed');
            $table->json('mapping')->comment('field => column header');
            $table->string('decimal', 8)->default('komma')->comment('komma | punkt: how the file writes 8,5');
            // The file as read — headers and cells — so the mapping can change without a new upload.
            $table->json('source');
            $table->json('rows')->comment('the rows as read, after mapping');
            $table->json('plan')->comment('per row: create | update | unchanged | refused, and why');
            $table->json('summary')->comment('counts per action');
            $table->json('undo')->nullable()->comment('created ids and the values updates replaced');
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('rolled_back_at')->nullable();
            $table->foreignId('rolled_back_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'created_at'], 'idx_catalogue_import_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalogue_imports');

        Schema::table('wheel_finishes', function (Blueprint $table): void {
            $table->dropColumn('image_alt_de');
        });

        Schema::table('wheel_models', function (Blueprint $table): void {
            $table->dropColumn(['seo_title', 'seo_description']);
        });
    }
};
