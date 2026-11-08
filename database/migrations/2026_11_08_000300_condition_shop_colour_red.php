<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\HintColour;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * „Rot“ beside Grün and Gelb (the client's round of 08.11.2026, §6, D-439). Presentation only: no verdict reads it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Constraints::drop('document_conditions', 'chk_document_conditions_shop_colour');
        Constraints::enum('document_conditions', 'shop_colour', array_column(HintColour::cases(), 'value'));
    }

    public function down(): void
    {
        DB::table('document_conditions')->where('shop_colour', HintColour::Red->value)->update(['shop_colour' => HintColour::Yellow->value]);
        Constraints::drop('document_conditions', 'chk_document_conditions_shop_colour');
        Constraints::enum('document_conditions', 'shop_colour', [HintColour::Green->value, HintColour::Yellow->value]);
    }
};
