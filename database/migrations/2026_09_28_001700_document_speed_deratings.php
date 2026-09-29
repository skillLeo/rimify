<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The load a V, W or Y tyre may carry at speed, as the document prints it (ABE 55255, p. 6) — scoped to its
 * document like its Auflagen, never a global table (the operator's review of C9, 28.09.2026 §5). One row per
 * speed and symbol: a percentage, or NULL for the table's „–“ (a tyre of that symbol is not permitted at that
 * speed). A symbol with no row at all is not in the table. A document without rows has no table: above
 * 210 km/h its tyre answer is UNKNOWN, never borrowed from another document.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_speed_deratings', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->unsignedSmallInteger('speed_kmh')->comment('the table row, km/h');
            $t->string('symbol', 4)->comment('the speed symbol column: V, W, Y');
            $t->unsignedTinyInteger('percent')->nullable()->comment('share of the load index; NULL = „–“, not permitted');
            $t->unsignedSmallInteger('source_page')->nullable();
            $t->timestamps();

            $t->unique(['approval_document_id', 'speed_kmh', 'symbol'], 'uq_doc_derating_cell');
        });

        Constraints::add('document_speed_deratings', 'chk_derating_percent', '`percent` IS NULL OR (`percent` BETWEEN 1 AND 100)');
        Constraints::add('document_speed_deratings', 'chk_derating_speed', '`speed_kmh` BETWEEN 100 AND 400');
        Constraints::add('document_speed_deratings', 'chk_derating_symbol', "`symbol` REGEXP '^[A-Z()]{1,4}$'");
    }

    public function down(): void
    {
        Schema::dropIfExists('document_speed_deratings');
    }
};
