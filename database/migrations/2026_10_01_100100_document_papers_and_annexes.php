<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two facts a document states about itself, read off ABE 53841 (the operator's brief of 01.10.2026):
 *
 * - `papers_correction_required`: the KBA's point 10 — „Für diese nach §22 StVZO freigegebenen Rad/Reifenkombinationen
 *   ist die Berichtigung der Zulassungsbescheinigung Teil I gemäß §15 FZV nicht erforderlich.“ False where a document
 *   says so, true where it says the papers must be corrected, null where it says nothing — then nothing is claimed. A
 *   Nachtrag reads its base's (ApprovalDocument::papersCorrectionRequired). It is not the Änderungsabnahme: point 11
 *   leaves that to the Prüfbericht, so it still comes from the Auflagen codes.
 * - `missing_annexes`: which of the document's own Anlagen we do not hold („1–15“). While any is missing, a car the
 *   pages we hold do not name is not „nicht freigegeben“ but UNKNOWN — the Anlage that names it may be one of those.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->boolean('papers_correction_required')->nullable()->after('valid_from_production')
                ->comment('§ 15 FZV: false = the document frees the papers from correction; null = it says nothing');
            $t->string('missing_annexes', 64)->nullable()->after('papers_correction_required')
                ->comment('the Anlagen of its Verwendungsbereich we do not hold, as printed („1–15“)');
        });
    }

    public function down(): void
    {
        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->dropColumn(['papers_correction_required', 'missing_annexes']);
        });
    }
};
