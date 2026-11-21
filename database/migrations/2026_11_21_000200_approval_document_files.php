<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Several PDFs per Gutachten (D-494, the operator's brief of 19.11.2026, item C): the main certificate and its Nachträge,
 * Anlagen or older versions, each with the label the customer reads, an optional date and a position. A file is hidden or shown,
 * never deleted: an order snapshot may refer to it.
 *
 * The paper's own PDF stays where it always was (`approval_documents.pdf_key`, its hash in `pdf_sha256`): the rows cite its
 * pages, the release checks it, orders froze its hash. Its entry here is `is_main` and names no file of its own; it is created
 * for every paper that has one, labelled „Gutachten“, so nothing is lost and the list starts with it. Further entries carry
 * their own key and hash. This table is no part of the released data: adding or hiding a file changes no verdict.
 *
 * Down drops the table; every paper keeps its own PDF, as before. A further file uploaded meanwhile stays on the disk.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_document_files', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('approval_document_id')->constrained('approval_documents')->restrictOnDelete();
            $t->string('label', 80)->comment('what the customer reads: Gutachten, Nachtrag, Anlage, Ältere Fassung, …');
            $t->date('dated_on')->nullable();
            $t->unsignedSmallInteger('position');
            $t->boolean('is_main')->default(false)->comment('the paper\'s own PDF (approval_documents.pdf_key); never hidden');
            $t->string('file_key', 255)->nullable()->comment('null for the main entry: it is the paper\'s own file');
            $t->char('sha256', 64)->nullable();
            $t->unsignedBigInteger('bytes')->nullable();
            $t->timestamp('hidden_at')->nullable();
            $t->foreignId('hidden_by')->nullable()->constrained('admin_users')->restrictOnDelete();
            $t->foreignId('created_by')->nullable()->constrained('admin_users')->restrictOnDelete();
            $t->timestamps();

            $t->index(['approval_document_id', 'position']);
        });

        $now = now();

        DB::table('approval_documents')->whereNotNull('pdf_key')->orderBy('id')->select(['id', 'issued_on'])
            ->chunkById(500, function ($documents) use ($now): void {
                DB::table('approval_document_files')->insert($documents->map(static fn (object $d): array => [
                    'approval_document_id' => $d->id,
                    'label' => 'Gutachten',
                    'dated_on' => $d->issued_on,
                    'position' => 1,
                    'is_main' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->all());
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_document_files');
    }
};
