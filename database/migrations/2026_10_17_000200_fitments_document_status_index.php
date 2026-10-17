<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every Gutachten's rows counted from the index alone (D-271, the operator's brief of 17.10.2026 §4).
 *
 * Gutachten › Übersicht shows each document with its count of Verwendungsbereich rows and how many are published. With
 * the document's own index (`approval_document_id`) each row's status was read from the table: 21 ms for 4 000 rows on
 * the development database, growing with every row entered. With the status in the index the count reads the index
 * only: 9 ms. The old one-column index is a prefix of the new one and goes; the foreign key keeps an index with the
 * document first (this one, and `uq_fitment_identity`).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('fitments', function (Blueprint $t): void {
            $t->index(['approval_document_id', 'status'], 'idx_fitment_document_status');
            $t->dropIndex('idx_fitment_document');
        });
    }

    public function down(): void
    {
        Schema::table('fitments', function (Blueprint $t): void {
            $t->index('approval_document_id', 'idx_fitment_document');
            $t->dropIndex('idx_fitment_document_status');
        });
    }
};
