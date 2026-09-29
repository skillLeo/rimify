<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A load-index Auflage whose kilograms are not exactly twice the capacity of the index its code names is
 * kept as the document states it — the document always wins — and a person confirms it with a written
 * reason before the document can be released (the operator's second review of C9, §3). The reason is shown
 * on the record and audited; changing the code or the kilograms asks again.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_conditions', function (Blueprint $t): void {
            $t->text('limit_confirmed_reason')->nullable()->after('axle');
            $t->foreignId('limit_confirmed_by')->nullable()->after('limit_confirmed_reason')->constrained('admin_users')->nullOnDelete();
            $t->timestamp('limit_confirmed_at')->nullable()->after('limit_confirmed_by');
        });
    }

    public function down(): void
    {
        Schema::table('document_conditions', function (Blueprint $t): void {
            $t->dropConstrainedForeignId('limit_confirmed_by');
            $t->dropColumn(['limit_confirmed_reason', 'limit_confirmed_at']);
        });
    }
};
