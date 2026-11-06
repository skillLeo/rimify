<?php

declare(strict_types=1);

use App\Enums\Axle;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What staff type in the five steps of a Gutachten's entry (the Gutachten rework, Phase 2; the client's approval of
 * 05.11.2026): the paper's wheel size, the cars they tick, and for each car its lines — vorne, hinten, codes. The tables
 * the shop reads stay as they are: DocumentEntryWriter writes them from these on every save of a draft, and the verdict
 * logic never reads what is here.
 *
 * - `document_wheel_sizes`: one dimension per paper — colours inherit it — and what the paper prints for it, so staff
 *   are warned when the size they chose is not the one in the paper.
 * - `document_car_entries`: one car on that size, with everything a row of `fitments` holds. `wheel_config_id` and
 *   `axle` come only from rows entered before this flow: one colour alone, one axle alone.
 * - `document_tyre_lines`: vorne + hinten, each size with what the paper prints beside it. A line with one side comes
 *   only from those older rows: a size scoped to one axle.
 * - `document_kept_combinations`: a row of the old list of combinations no car on the paper carries — never entered
 *   again, never lost: dropping it could turn a closed list into no list at all, and change an answer.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_wheel_sizes', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->foreignId('wheel_model_id')->constrained('wheel_models')->cascadeOnDelete();
            $t->decimal('diameter_in', 4, 1);
            $t->decimal('width_in', 4, 2);
            $t->smallInteger('et_mm');
            $t->unsignedTinyInteger('bolt_holes');
            $t->decimal('bolt_circle_mm', 5, 1);
            $t->decimal('centre_bore_mm', 5, 2);
            // As the paper prints them, typed by staff; only ever compared, for a warning.
            $t->string('printed_type', 64)->nullable()->comment('Radtyp as printed: RC200 8,5x20');
            $t->decimal('printed_width_in', 4, 2)->nullable();
            $t->decimal('printed_diameter_in', 4, 1)->nullable();
            $t->smallInteger('printed_et_mm')->nullable();
            $t->unsignedTinyInteger('printed_bolt_holes')->nullable();
            $t->decimal('printed_bolt_circle_mm', 5, 1)->nullable();
            $t->timestamps();

            $t->unique(['approval_document_id', 'wheel_model_id', 'diameter_in', 'width_in', 'et_mm', 'bolt_holes', 'bolt_circle_mm', 'centre_bore_mm'], 'uq_document_wheel_size');
        });

        Schema::create('document_car_entries', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->foreignId('document_wheel_size_id')->constrained('document_wheel_sizes')->cascadeOnDelete();
            $t->foreignId('vehicle_id')->constrained('vehicles')->restrictOnDelete();
            // Only rows entered before this flow: this colour alone (null: every colour of the size) and this axle alone.
            $t->foreignId('wheel_config_id')->nullable()->constrained('wheel_configs')->restrictOnDelete();
            $t->string('axle', 8)->default(Axle::All->value);
            $t->unsignedInteger('scope_key')->storedAs('IFNULL(`wheel_config_id`, 0)')->comment('the colour in the key: a UNIQUE over the nullable column would let two in');
            // What a row of `fitments` says beside its tyres, written to it as it stands here.
            $t->unsignedSmallInteger('source_page')->nullable();
            $t->date('build_from')->nullable();
            $t->date('build_to')->nullable();
            $t->decimal('permitted_width_min', 4, 2)->nullable();
            $t->decimal('permitted_width_max', 4, 2)->nullable();
            $t->smallInteger('permitted_et_min')->nullable();
            $t->smallInteger('permitted_et_max')->nullable();
            $t->decimal('centre_bore_mm', 5, 2)->nullable();
            $t->text('entry_note_de')->nullable();
            $t->string('entry_override', 16)->nullable();
            $t->text('entry_override_reason')->nullable();
            $t->foreignId('entry_override_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $t->timestamp('entry_override_at')->nullable();
            // „Kopieren nach …“: the car this one's lines came from, until someone edits them.
            $t->foreignId('copied_from_id')->nullable()->constrained('document_car_entries')->nullOnDelete();
            $t->unsignedInteger('position')->default(0);
            $t->timestamps();

            $t->unique(['document_wheel_size_id', 'vehicle_id', 'axle', 'scope_key'], 'uq_document_car_entry');
            $t->index(['approval_document_id', 'position'], 'idx_document_car_entry_order');
        });

        Constraints::enum('document_car_entries', 'axle', Axle::values());
        Constraints::range('document_car_entries', 'build_from', 'build_to', 'chk_car_entry_build_window');
        Constraints::range('document_car_entries', 'permitted_width_min', 'permitted_width_max', 'chk_car_entry_width_range');
        Constraints::range('document_car_entries', 'permitted_et_min', 'permitted_et_max', 'chk_car_entry_et_range');

        Schema::create('document_car_entry_codes', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('document_car_entry_id')->constrained('document_car_entries')->cascadeOnDelete();
            $t->string('code', 32)->collation('utf8mb4_bin')->comment('as printed');
            $t->text('note_de')->nullable();
            $t->timestamps();

            $t->unique(['document_car_entry_id', 'code'], 'uq_document_car_entry_code');
        });

        Schema::create('document_tyre_lines', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('document_car_entry_id')->constrained('document_car_entries')->cascadeOnDelete();
            $t->unsignedInteger('position')->default(0);

            foreach (['front', 'rear'] as $side) {
                $t->unsignedSmallInteger("{$side}_width_mm")->nullable();
                $t->unsignedSmallInteger("{$side}_aspect")->nullable();
                $t->decimal("{$side}_diameter_in", 4, 1)->nullable();
                // NULL: the paper is silent. Nothing is ever guessed (R-06).
                $t->unsignedSmallInteger("{$side}_load_index")->nullable();
                $t->string("{$side}_speed_symbol", 3)->nullable();
                // `HL`, `XL`: as the paper prints it before the size. Kept; it names the tyre's build, not a minimum.
                $t->string("{$side}_marker", 4)->nullable();
                // What was typed where it does not read (yet): kept, so nothing typed is lost; the release waits for it.
                $t->string("{$side}_unread", 64)->nullable();
                // A pair only: the paper lists this size for this wheel, though only in this combination. Without it, a size with
                // no line of its own is on another wheel size, and the pair is not offered on this one.
                $t->boolean("{$side}_on_rim")->default(false);
            }

            $t->unsignedSmallInteger('kw_min')->nullable();
            $t->unsignedSmallInteger('kw_max')->nullable();
            // Built from a row entered before this flow: written back as that row stood, until someone edits it.
            $t->boolean('from_rows')->default(false);
            // Null: decided by the paper — every line stands in the list once any line pairs two sizes. 1/0 only on a list
            // entered before this flow, which said for itself which sizes it holds.
            $t->boolean('in_list')->nullable();
            // The list row this line carries, where one stood before this flow: the EG number as printed, its number, page.
            $t->string('list_entry', 64)->nullable();
            $t->unsignedSmallInteger('list_number')->nullable();
            $t->unsignedSmallInteger('list_page')->nullable();
            $t->boolean('list_carried_over')->default(false);
            $t->timestamps();

            $t->index(['document_car_entry_id', 'position'], 'idx_document_tyre_line_order');
        });

        Constraints::range('document_tyre_lines', 'kw_min', 'kw_max', 'chk_tyre_line_kw');
        Constraints::add('document_tyre_lines', 'chk_tyre_line_side', '`front_width_mm` IS NOT NULL OR `rear_width_mm` IS NOT NULL OR `front_unread` IS NOT NULL OR `rear_unread` IS NOT NULL');

        Schema::create('document_tyre_line_codes', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('document_tyre_line_id')->constrained('document_tyre_lines')->cascadeOnDelete();
            $t->string('code', 32)->collation('utf8mb4_bin')->comment('as printed');
            $t->timestamps();

            $t->unique(['document_tyre_line_id', 'code'], 'uq_document_tyre_line_code');
        });

        Schema::create('document_kept_combinations', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->string('eg_number', 64)->nullable();
            $t->string('eg_number_norm', 64)->nullable();
            $t->unsignedSmallInteger('number');
            $t->unsignedSmallInteger('front_width_mm');
            $t->unsignedTinyInteger('front_aspect');
            $t->decimal('front_diameter_in', 4, 1);
            $t->unsignedSmallInteger('rear_width_mm');
            $t->unsignedTinyInteger('rear_aspect');
            $t->decimal('rear_diameter_in', 4, 1);
            $t->unsignedSmallInteger('source_page')->nullable();
            $t->boolean('carried_over')->default(false);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_kept_combinations');
        Schema::dropIfExists('document_tyre_line_codes');
        Schema::dropIfExists('document_tyre_lines');
        Schema::dropIfExists('document_car_entry_codes');
        Schema::dropIfExists('document_car_entries');
        Schema::dropIfExists('document_wheel_sizes');
    }
};
