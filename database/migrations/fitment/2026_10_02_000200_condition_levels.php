<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The client's #23, as the operator answered it (D-104): every Auflage of a document gets a level — Hinweis, Auflage
 * or nicht zulässig — that decides how loud it is in the shop, never the verdict. Every existing Auflage gets the
 * operator's default (ConditionLevel::defaultFor). The floor is the database's as well as the form's: an Abnahme or
 * work on the body can never be a mere Hinweis (chk_condition_level_floor).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('document_conditions', function (Blueprint $t): void {
            $t->string('level', 16)->nullable()->after('kind');
        });

        foreach (DB::table('document_conditions')->orderBy('id')->get(['id', 'code', 'kind', 'text_de']) as $row) {
            $kind = ConditionKind::tryFrom((string) $row->kind);

            DB::table('document_conditions')->where('id', $row->id)->update([
                'level' => ConditionLevel::defaultFor((string) $row->code, $kind, (string) $row->text_de)->value,
            ]);
        }

        Schema::table('document_conditions', function (Blueprint $t): void {
            $t->string('level', 16)->nullable(false)->default(ConditionLevel::Auflage->value)->change();
        });

        Constraints::enum('document_conditions', 'level', ConditionLevel::values());
        Constraints::add('document_conditions', 'chk_condition_level_floor', "NOT (`kind` IN ('abnahme', 'karosseriearbeit') AND `level` = 'hinweis')");
    }

    public function down(): void
    {
        Constraints::drop('document_conditions', 'chk_condition_level_floor');
        Constraints::drop('document_conditions', 'chk_document_conditions_level');

        Schema::table('document_conditions', function (Blueprint $t): void {
            $t->dropColumn('level');
        });
    }
};
