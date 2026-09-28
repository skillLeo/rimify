<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which supplier a file came from (COMPLIANCE row 25). Each supplier names its columns its own way, so
 * the column mapping is remembered per supplier (CatalogueImporter), and a run says whether it started
 * from that supplier's last mapping or from the column names.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalogue_imports', function (Blueprint $t): void {
            $t->string('supplier', 80)->nullable()->after('file_name')->index();
            $t->boolean('mapping_remembered')->default(false)->after('mapping');
        });
    }

    public function down(): void
    {
        Schema::table('catalogue_imports', function (Blueprint $t): void {
            $t->dropIndex(['supplier']);
            $t->dropColumn(['supplier', 'mapping_remembered']);
        });
    }
};
