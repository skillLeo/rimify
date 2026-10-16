<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A Gutachten's own list of tyre combinations, front against rear, as it prints them — the client's item 8 and the
 * admin round's „combinations model“ (Group A, the operator's briefs of 15. and 16.10.2026).
 *
 * BBS's Teilegutachten (Anlage BMW15) prints no table sentence an Auflage could carry (ABE 55255's V19 does): it lists
 * „Bereifungskombinationen“ — Kombination 1: vorn 225/40 R18, hinten 225/40 R18; Kombination 2: vorn 225/40 R18,
 * hinten 245/35 R18; … — with Auflagen per axle, which the rows already hold on their sizes. One row per pair as
 * printed, with its number and page; the engine reads them as the document's pairing table (TyrePairingTable), and
 * where an Auflage prints a table too, only the pairs both permit are offered.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_tyre_combinations', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->unsignedSmallInteger('number')->comment('the document\'s own „Kombination N“');
            $t->unsignedSmallInteger('front_width_mm');
            $t->unsignedTinyInteger('front_aspect');
            $t->decimal('front_diameter_in', 4, 1);
            $t->unsignedSmallInteger('rear_width_mm');
            $t->unsignedTinyInteger('rear_aspect');
            $t->decimal('rear_diameter_in', 4, 1);
            $t->unsignedSmallInteger('source_page')->nullable();
            $t->timestamps();

            $t->unique(['approval_document_id', 'front_width_mm', 'front_aspect', 'front_diameter_in', 'rear_width_mm', 'rear_aspect', 'rear_diameter_in'], 'uq_document_tyre_combination');
            $t->index(['approval_document_id', 'number'], 'idx_document_tyre_combination_number');
        });

        Constraints::add('document_tyre_combinations', 'chk_combination_number', '`number` >= 1');
        Constraints::add('document_tyre_combinations', 'chk_combination_sizes', '`front_width_mm` BETWEEN 100 AND 400 AND `rear_width_mm` BETWEEN 100 AND 400 AND `front_aspect` BETWEEN 20 AND 90 AND `rear_aspect` BETWEEN 20 AND 90 AND `front_diameter_in` BETWEEN 10 AND 30 AND `rear_diameter_in` BETWEEN 10 AND 30');
    }

    public function down(): void
    {
        Schema::dropIfExists('document_tyre_combinations');
    }
};
