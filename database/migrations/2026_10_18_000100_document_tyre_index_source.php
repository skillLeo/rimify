<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How a document gives the tyre index its combinations need (the operator's brief of 17.10.2026, „Do not remove the top
 * speed. Make it conditional.“, D-277) — one of three, read off the document, asked before it is released:
 *
 * - `document`: it states the index for the combination itself („mindestens 94Y“ beside the size);
 * - `papers`:   it delegates to the vehicle's papers — the BBS Teilegutachten: „Der erforderliche
 *               Geschwindigkeits-/Lastindex ist den Fahrzeugpapieren zu entnehmen.“;
 * - `table`:    it prints a load table indexed by speed — ABE 55255, 210 to 300 km/h against V, W and Y.
 *
 * The document decides whether the vehicle's top speed is needed, not the dataset and not a setting. Null: not yet
 * answered — read as needing it, the safe side.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->string('tyre_index_source', 16)->nullable()->after('missing_annexes')
                ->comment('document | papers | table: how the document gives the required tyre index; null = not answered');
        });

        Constraints::enum('approval_documents', 'tyre_index_source', ['document', 'papers', 'table']);
    }

    public function down(): void
    {
        Constraints::drop('approval_documents', 'chk_approval_documents_tyre_index_source');

        Schema::table('approval_documents', function (Blueprint $t): void {
            $t->dropColumn('tyre_index_source');
        });
    }
};
