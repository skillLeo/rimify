<?php

declare(strict_types=1);

use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Services\Admin\Approvals\Entry\DocumentEntryReader;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Every Gutachten on file, carried into the tables staff type in (the Gutachten rework §6). The rows the shop reads are not
 * touched: no answer can change through this, and EntryRoundTripTest holds it to that, every verdict before and after. What it
 * proves paper by paper is the way back: writing what it built gives exactly the rows it read (DocumentEntryProof), so the next
 * Fassung of a paper changes nothing nobody meant to change.
 *
 * Where one paper does not prove it, nothing is carried over and the migration stops, the release with it (D-358's rule).
 * Released papers are carried as they are, behind the release door.
 */
return new class extends Migration
{
    public function up(): void
    {
        $reader = new DocumentEntryReader;

        DB::transaction(static function () use ($reader): void {
            foreach (ApprovalDocument::query()->orderBy('id')->cursor() as $document) {
                $reader->ensure($document);
            }
        });

        Log::info('Gutachten in die Erfassung übernommen, keine Zeile geändert.', ['documents' => ApprovalDocument::query()->count(), 'cars' => DocumentCarEntry::query()->count()]);
    }

    /** The tables go with the migration before this one; the rows the shop reads were never changed. */
    public function down(): void
    {
        foreach (['document_kept_combinations', 'document_wheel_sizes'] as $table) {
            DB::table($table)->delete();
        }
    }
};
