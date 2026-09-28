<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Where a table of tyre load at speed came from when it did not come from its document's own pages: the
 * example documents carry ABE 55255's table from the demo seed, and the record and the shop say so, never
 * as if that document printed it (the operator's second review of C9, §4). NULL: typed from the document.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_speed_deratings', function (Blueprint $t): void {
            $t->string('seeded_from', 120)->nullable()->after('source_page')->comment('NULL = typed from this document');
        });

        // The rows the demo seed wrote before the column existed: example documents only.
        DB::table('document_speed_deratings')
            ->whereIn('approval_document_id', DB::table('approval_documents')->where('issuer', 'Prüfstelle (Demodaten)')->select('id'))
            ->update(['seeded_from' => 'Demo-Seed: Tabelle der ABE 55255, Seite 6']);
    }

    public function down(): void
    {
        Schema::table('document_speed_deratings', function (Blueprint $t): void {
            $t->dropColumn('seeded_from');
        });
    }
};
