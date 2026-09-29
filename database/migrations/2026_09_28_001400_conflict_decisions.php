<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * No document wins by itself (the corrections memo §3). Where two current documents cover the same car and
 * wheel and say different things, the shop answers UNKNOWN until a person decides on the Konflikte page:
 * „beide gelten jeweils für sich“ (`resolved_intersection`) or „nur Dokument X gilt“
 * (`resolved_supersede`, naming X here), with a reason (`resolution_note`), who and when.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fitment_conflicts', function (Blueprint $t): void {
            $t->foreignId('prevailing_document_id')->nullable()->after('resolution_note')
                ->constrained('approval_documents')->restrictOnDelete()
                ->comment('„nur Dokument X gilt“: X');
        });

        // „Only X applies“ names X; nothing else does.
        Constraints::add('fitment_conflicts', 'chk_conflict_prevailing', "(`status` = 'resolved_supersede') = (`prevailing_document_id` IS NOT NULL)");
    }

    public function down(): void
    {
        Constraints::drop('fitment_conflicts', 'chk_conflict_prevailing');

        Schema::table('fitment_conflicts', function (Blueprint $t): void {
            $t->dropConstrainedForeignId('prevailing_document_id');
        });
    }
};
