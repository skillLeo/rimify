<?php

declare(strict_types=1);

use App\Enums\ConditionSeverity;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Auflagen und Hinweise as first-class rows (gap G1).
 *
 * Conditions are the part of an approval that costs the customer money and time — a rolled wheel
 * arch is a workshop visit — so burying them in a notes field is both a conversion problem and a
 * trust problem. A customer is never shown a bare code such as `A02`: `text_de` is a full German
 * sentence, and it is editable in the panel because the wording is content, not code (R-15).
 *
 * `condition_code_aliases` maps each document's own printed code onto a stable internal key,
 * because two manufacturers number the same obligation differently.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('condition_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 64)->unique()->comment('stable internal key, e.g. ARCH_ROLLING');
            $table->string('severity', 16);
            $table->text('text_de')->comment('full German sentence, editable by the Compliance Editor');
            $table->text('text_en')->nullable();

            // Drives the tyre list itself rather than a warning after the choice is made.
            $table->boolean('affects_tyre_choice')->default(false);
            // Makes a verdict CONDITIONAL rather than PERMITTED.
            $table->boolean('affects_purchase')->default(false);
            // WORKSHOP conditions must be acknowledged before the item can enter the basket.
            $table->boolean('requires_acknowledgement')->default(false);

            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index('severity', 'idx_condition_severity');
        });

        Constraints::enum('condition_codes', 'severity', ConditionSeverity::values());
        // R-15 as a database constraint: a condition without a sentence cannot exist.
        Constraints::add('condition_codes', 'chk_condition_text_present', "TRIM(`text_de`) <> ''");

        Schema::create('condition_code_aliases', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('condition_code_id')->constrained('condition_codes')->cascadeOnDelete();
            $table->foreignId('approval_document_id')->nullable()
                ->constrained('approval_documents')->cascadeOnDelete()
                ->comment('NULL = applies to any document from this issuer');
            $table->string('printed_code', 64)->comment('the code as this document prints it');
            $table->string('issuer')->nullable();
            $table->timestamps();

            $table->unique(['approval_document_id', 'printed_code'], 'uq_alias_document_code');
            $table->index('printed_code', 'idx_alias_printed');
        });

        Schema::create('fitment_conditions', function (Blueprint $table): void {
            $table->foreignId('fitment_id')->constrained('fitments')->cascadeOnDelete();
            $table->foreignId('condition_code_id')->constrained('condition_codes')->restrictOnDelete();
            $table->text('note_de')->nullable()->comment('document-specific qualifier');
            $table->timestamps();

            $table->primary(['fitment_id', 'condition_code_id']);
            $table->index('condition_code_id', 'idx_fitment_condition_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fitment_conditions');
        Schema::dropIfExists('condition_code_aliases');
        Schema::dropIfExists('condition_codes');
    }
};
