<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A document is incomplete until someone asserts it is complete (EIGENE-FUNDE 119, the operator's brief of 14.10.2026
 * §2, D-227).
 *
 * Until now a document counted as complete unless someone remembered the optional field `missing_annexes`, and a car its
 * rows did not name was answered „nicht zulässig“ — wrong in the direction that costs most, and the go-live check read the
 * same empty field as an all-clear. Now the answer is asked at release, with three values and no default:
 *
 *   - `complete` — every Anlage and every vehicle is entered: only then is an unnamed car refused;
 *   - `partial`  — these Anlagen or ranges are missing (`missing_annexes`, now long enough to say which);
 *   - `unknown`  — nobody can say.
 *
 * NULL is „not answered“ and reads as partial — every document released before this change, until a person answers.
 * Who answered, when, and against which revision stand beside it, as for any assertion, and in the Protokoll.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->string('missing_annexes', 255)->nullable()->comment('the Anlagen or ranges of its Verwendungsbereich we do not hold, as printed („1–15“)')->change();
            $t->string('completeness', 16)->nullable()->after('missing_annexes')
                ->comment('complete | partial | unknown, asserted at release; NULL = not answered, read as partial');
            $t->foreignId('completeness_by')->nullable()->after('completeness')->constrained('admin_users')->restrictOnDelete();
            $t->timestamp('completeness_at')->nullable()->after('completeness_by');
            $t->unsignedInteger('completeness_revision')->nullable()->after('completeness_at')->comment('the revision the answer was given for');
        });

        Constraints::enum('approval_documents', 'completeness', ['complete', 'partial', 'unknown']);
        // An answer always says who gave it and when.
        Constraints::add('approval_documents', 'chk_document_completeness_who', '`completeness` IS NULL OR (`completeness_at` IS NOT NULL AND `completeness_revision` IS NOT NULL)');
    }

    public function down(): void
    {
        Constraints::drop('approval_documents', 'chk_document_completeness_who');
        Constraints::drop('approval_documents', 'chk_approval_documents_completeness');

        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->dropConstrainedForeignId('completeness_by');
            $t->dropColumn(['completeness', 'completeness_at', 'completeness_revision']);
            $t->string('missing_annexes', 64)->nullable()->comment('the Anlagen of its Verwendungsbereich we do not hold, as printed („1–15“)')->change();
        });
    }
};
