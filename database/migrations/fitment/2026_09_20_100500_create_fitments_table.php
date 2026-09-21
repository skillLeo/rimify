<?php

declare(strict_types=1);

use App\Enums\Axle;
use App\Enums\FitmentStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * THE fitment table — one row per legally distinct combination, and the primary object in this
 * database.
 *
 * A fitment row is not "this wheel fits this car". It is "this document permits this wheel
 * configuration on this vehicle variant, within this build window, in these width and offset
 * ranges, subject to these conditions, requiring entry: yes or no". Every clause in that sentence
 * is a column, and dropping any one of them produces a system that is usually right.
 *
 * Every foreign key out of this table is RESTRICT, deliberately (R-05): compliance data must never
 * disappear as a side effect of tidying a catalogue. Removing a wheel means retiring its fitment
 * rows explicitly, which is an auditable act with a name attached to it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fitments', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('approval_document_id')->constrained('approval_documents')->restrictOnDelete();
            $table->foreignId('vehicle_id')->constrained('vehicles')->restrictOnDelete();
            $table->foreignId('wheel_config_id')->constrained('wheel_configs')->restrictOnDelete();

            $table->string('axle', 8)->default(Axle::All->value);

            // The document's OWN build-window scope. Both NULL means the document does not scope
            // it; a NULL end means the scope is open, never "until today" (R-02).
            $table->date('build_from')->nullable();
            $table->date('build_to')->nullable();

            // What the document permits, as open-ended pairs. A document permits a RANGE of widths
            // and offsets per vehicle, not the wheel's nominal value (gap G3).
            $table->decimal('permitted_width_min', 4, 2)->nullable();
            $table->decimal('permitted_width_max', 4, 2)->nullable();
            $table->smallInteger('permitted_et_min')->nullable();
            $table->smallInteger('permitted_et_max')->nullable();

            // Eintragungspflicht — shown BEFORE the basket, never after. Not nullable: "we do not
            // know whether this needs entry" is not a state a customer may be shown.
            $table->boolean('requires_entry');
            $table->text('entry_note_de')->nullable();

            $table->unsignedSmallInteger('source_page')->nullable()->comment('which page of the PDF');

            $table->string('status', 16)->default(FitmentStatus::Draft->value);
            $table->foreignId('created_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['approval_document_id', 'vehicle_id', 'wheel_config_id', 'axle'],
                'uq_fitment_identity',
            );

            // MySQL has neither partial nor GiST indexes, so `status` goes INTO the key.
            $table->index(['vehicle_id', 'status', 'wheel_config_id'], 'idx_fitment_lookup');
            $table->index(['vehicle_id', 'status', 'build_from', 'build_to'], 'idx_fitment_vehicle');
            $table->index(['wheel_config_id', 'status'], 'idx_fitment_config');
            $table->index('approval_document_id', 'idx_fitment_document');
        });

        Constraints::enum('fitments', 'axle', Axle::values());
        Constraints::enum('fitments', 'status', FitmentStatus::values());
        Constraints::range('fitments', 'build_from', 'build_to', 'chk_fitment_build_window');
        Constraints::range('fitments', 'permitted_width_min', 'permitted_width_max', 'chk_fitment_width_range');
        Constraints::range('fitments', 'permitted_et_min', 'permitted_et_max', 'chk_fitment_et_range');
        Constraints::add('fitments', 'chk_fitment_width_positive',
            '(`permitted_width_min` IS NULL OR `permitted_width_min` > 0) AND (`permitted_width_max` IS NULL OR `permitted_width_max` > 0)');

        Schema::create('fitment_tyre_sizes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('fitment_id')->constrained('fitments')->cascadeOnDelete();

            $table->unsignedSmallInteger('width_mm');
            $table->unsignedSmallInteger('aspect');
            $table->decimal('diameter_in', 4, 1);

            // Where the document states its own minimum, the document wins and the derivation is
            // the floor; the stricter of the two governs (R-06). NULL means the document is silent.
            $table->unsignedSmallInteger('min_load_index')->nullable();
            $table->string('min_speed_symbol', 3)->nullable();

            $table->string('axle', 8)->default(Axle::All->value);
            $table->timestamps();

            $table->unique(['fitment_id', 'width_mm', 'aspect', 'diameter_in', 'axle'], 'uq_fitment_tyre_size');
            $table->index(['width_mm', 'aspect', 'diameter_in'], 'idx_fitment_tyre_size_lookup');
        });

        Constraints::enum('fitment_tyre_sizes', 'axle', Axle::values());
        Constraints::add('fitment_tyre_sizes', 'chk_fts_width', '`width_mm` > 0');
        Constraints::add('fitment_tyre_sizes', 'chk_fts_aspect', '`aspect` > 0');
        Constraints::add('fitment_tyre_sizes', 'chk_fts_diameter', '`diameter_in` > 0');
        Constraints::add('fitment_tyre_sizes', 'chk_fts_load_index',
            '`min_load_index` IS NULL OR `min_load_index` > 0');
    }

    public function down(): void
    {
        Schema::dropIfExists('fitment_tyre_sizes');
        Schema::dropIfExists('fitments');
    }
};
