<?php

declare(strict_types=1);

use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The approval document — the parent record that makes a fitment defensible.
 *
 * `pdf_sha256` is what proves in a dispute that the PDF the customer downloaded is the PDF RIMIFY
 * still holds. Revisions SUPERSEDE via `supersedes_id`; they never overwrite, because overwriting
 * destroys the record of what was true on the day an order was placed (gap G4).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_documents', function (Blueprint $table): void {
            $table->id();
            $table->string('kind', 24);

            $table->string('kba_number', 64)->nullable()->comment('ABE');
            $table->string('approval_mark', 64)->nullable()->comment('ECE-R124');
            $table->string('report_number', 64)->nullable()->comment('Teilegutachten');
            $table->string('issuer')->nullable();
            $table->date('issued_on')->nullable();

            $table->unsignedInteger('revision')->default(1);
            // RESTRICT, with no referential action: a superseded revision must stay readable for
            // every order placed against it, and MySQL refuses a CHECK on a column that carries
            // an ON DELETE action.
            $table->foreignId('supersedes_id')->nullable()->constrained('approval_documents');

            $table->date('valid_from')->nullable();
            $table->date('valid_to')->nullable()->comment('NULL = current revision');

            $table->string('pdf_key')->nullable()->comment('object storage; served by signed URL');
            $table->string('pdf_sha256', 64)->nullable()->comment('proves the file was never swapped');
            $table->unsignedSmallInteger('page_count')->nullable();

            $table->string('status', 16)->default(DocumentStatus::Draft->value);
            $table->foreignId('created_by')->nullable()->constrained('admin_users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'valid_to'], 'idx_document_current');
            $table->index('kba_number', 'idx_document_kba');
            $table->index('supersedes_id', 'idx_document_supersedes');
        });

        Constraints::enum('approval_documents', 'kind', ApprovalKind::values());
        Constraints::enum('approval_documents', 'status', DocumentStatus::values());
        Constraints::range('approval_documents', 'valid_from', 'valid_to', 'chk_document_validity');
        Constraints::add('approval_documents', 'chk_document_revision', '`revision` >= 1');

        // A published document must carry the evidence a customer can be shown. Draft rows are
        // still being typed, so the requirement applies only once the row goes live.
        Constraints::add(
            'approval_documents',
            'chk_document_published_has_pdf',
            "`status` <> 'published' OR (`pdf_key` IS NOT NULL AND `pdf_sha256` IS NOT NULL)",
        );

        Constraints::add(
            'approval_documents',
            'chk_document_sha_shape',
            "`pdf_sha256` IS NULL OR REGEXP_LIKE(`pdf_sha256`, '^[0-9a-f]{64}$', 'c')",
        );

        // "A document cannot supersede itself" cannot be a CHECK here: MySQL refuses a constraint
        // that refers to an auto-increment column (error 3818). ApprovalDocument enforces it on
        // save instead, and a feature test proves the guard.
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_documents');
    }
};
