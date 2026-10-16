<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The count of a Gutachten's Verwendungsbereich, taken before its rows are entered (ADMIN-GEFUNDEN 511, the operator's
 * brief of 16.10.2026, Group A).
 *
 * Until now the release asked for the counts — Auflagen codes and tyre sizes for the entered vehicles, the axle-load
 * limit, the Abnahme — on the same screen that shows what was entered, so a count copied off the entry passed and an
 * honest one stopped the release (the client's 10.10.2026: `HisReleaseTodayTest`). Now the count is asked first, from the
 * PDF, each figure with the page it was read on („6 Auflagen-Codes, Seite 3“), and the release compares the entry with
 * it in the same four sentences as before.
 *
 *   - `counted_axle_limit_kg` NULL with `counted_at` set: the Verwendungsbereich names no limit;
 *   - `counted_before_entry`: true where the document had no row when it was counted — a count taken afterwards (a
 *     draft from before this change, or one corrected later) says so on the page and in the Protokoll;
 *   - who counted and when stand beside it, as for any assertion; every change is in the Protokoll with before and after.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->unsignedSmallInteger('counted_codes')->nullable()->after('completeness_revision')->comment('Auflagen codes its Verwendungsbereich prints for the vehicles to be entered');
            $t->unsignedSmallInteger('counted_codes_page')->nullable()->after('counted_codes');
            $t->unsignedSmallInteger('counted_sizes')->nullable()->after('counted_codes_page')->comment('tyre sizes it names for them');
            $t->unsignedSmallInteger('counted_sizes_page')->nullable()->after('counted_sizes');
            $t->unsignedSmallInteger('counted_axle_limit_kg')->nullable()->after('counted_sizes_page')->comment('the axle-load limit it names; NULL once counted = none');
            $t->unsignedSmallInteger('counted_axle_limit_page')->nullable()->after('counted_axle_limit_kg');
            $t->string('counted_abnahme', 8)->nullable()->after('counted_axle_limit_page')->comment('all | some | none');
            $t->unsignedSmallInteger('counted_abnahme_page')->nullable()->after('counted_abnahme');
            $t->boolean('counted_before_entry')->default(false)->after('counted_abnahme_page');
            $t->foreignId('counted_by')->nullable()->after('counted_before_entry')->constrained('admin_users')->restrictOnDelete();
            $t->timestamp('counted_at')->nullable()->after('counted_by');
        });

        Constraints::enum('approval_documents', 'counted_abnahme', ['all', 'some', 'none']);
        // A count is whole: the codes, the sizes and the Abnahme, each with its page, and when — or nothing at all.
        Constraints::add('approval_documents', 'chk_document_count_whole', '(`counted_at` IS NULL) = (`counted_codes` IS NULL) AND (`counted_at` IS NULL) = (`counted_sizes` IS NULL) AND (`counted_at` IS NULL) = (`counted_abnahme` IS NULL) AND (`counted_codes` IS NULL) = (`counted_codes_page` IS NULL) AND (`counted_sizes` IS NULL) = (`counted_sizes_page` IS NULL) AND (`counted_axle_limit_kg` IS NULL) = (`counted_axle_limit_page` IS NULL)');
        // The page of an Abnahme the Verwendungsbereich asks for; „none“ is read across it and has no one page.
        Constraints::add('approval_documents', 'chk_document_count_abnahme_page', '`counted_abnahme` IS NULL OR `counted_abnahme` = \'none\' OR `counted_abnahme_page` IS NOT NULL');
    }

    public function down(): void
    {
        Constraints::drop('approval_documents', 'chk_document_count_abnahme_page');
        Constraints::drop('approval_documents', 'chk_document_count_whole');
        Constraints::drop('approval_documents', 'chk_approval_documents_counted_abnahme');

        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->dropConstrainedForeignId('counted_by');
            $t->dropColumn([
                'counted_codes', 'counted_codes_page', 'counted_sizes', 'counted_sizes_page', 'counted_axle_limit_kg',
                'counted_axle_limit_page', 'counted_abnahme', 'counted_abnahme_page', 'counted_before_entry', 'counted_at',
            ]);
        });
    }
};
