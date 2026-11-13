<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * No Gutachten keeps a table of tyre load at speed of its own any more (the client's review of 11.11.2026, C; the operator's
 * answer b, D-459): every one reads ETRTO's, in code (ReferenceTables::SPEED_LOAD_PERCENT). The table goes with its rows.
 * Nothing points at it; what was saved in it and removed from it stays in the Protokoll, as every change does (R-12).
 *
 * Down brings the table back empty, as 2026_09_28_001700 and 001900 built it. Its rows come back only with the database
 * backup the release takes before it migrates — the release's rollback point.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('document_speed_deratings');
    }

    public function down(): void
    {
        Schema::create('document_speed_deratings', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->cascadeOnDelete();
            $t->unsignedSmallInteger('speed_kmh')->comment('the table row, km/h');
            $t->string('symbol', 4)->comment('the speed symbol column: V, W, Y');
            $t->unsignedTinyInteger('percent')->nullable()->comment('share of the load index; NULL = „–“, not permitted');
            $t->unsignedSmallInteger('source_page')->nullable();
            $t->string('seeded_from', 120)->nullable()->comment('NULL = typed from this document');
            $t->timestamps();

            $t->unique(['approval_document_id', 'speed_kmh', 'symbol'], 'uq_doc_derating_cell');
        });

        Constraints::add('document_speed_deratings', 'chk_derating_percent', '`percent` IS NULL OR (`percent` BETWEEN 1 AND 100)');
        Constraints::add('document_speed_deratings', 'chk_derating_speed', '`speed_kmh` BETWEEN 100 AND 400');
        Constraints::add('document_speed_deratings', 'chk_derating_symbol', "`symbol` REGEXP '^[A-Z()]{1,4}$'");
    }
};
