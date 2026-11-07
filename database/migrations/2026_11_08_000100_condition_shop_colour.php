<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\HintColour;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The shop colour of a paper's code (the client's item 23, the operator's brief of 07.11.2026, §6): green by default, the Bördeln
 * code yellow, as he asked. Presentation only: no verdict reads it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_conditions', function (Blueprint $t): void {
            $t->string('shop_colour', 8)->default(HintColour::Green->value);
        });

        Constraints::enum('document_conditions', 'shop_colour', array_column(HintColour::cases(), 'value'));

        DB::table('document_conditions')->where('text_de', 'like', '%Bördel%')->update(['shop_colour' => HintColour::Yellow->value]);
    }

    public function down(): void
    {
        Schema::table('document_conditions', function (Blueprint $t): void {
            $t->dropColumn('shop_colour');
        });
    }
};
