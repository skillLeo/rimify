<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The printable RIMIFY-Check (the operator's decision of 29.09.2026): the answer the shop gave for one car and
 * one wheel, frozen whole — the two halves, the Auflagen, and every line of the tyre sum, whatever the page
 * folded away — under a token the customer can send to a workshop, print, and read the same next week.
 *
 * Written once, never changed: a trigger refuses every UPDATE, as on the order-line snapshots. No foreign key:
 * a result says what we said, whatever happens to the catalogue since, and it never stands in the way of
 * tidying one.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('check_results', function (Blueprint $t): void {
            $t->id();
            $t->char('token', 32)->unique();
            $t->unsignedBigInteger('vehicle_id')->index();
            $t->unsignedBigInteger('wheel_config_id')->index();
            $t->unsignedBigInteger('approval_document_id')->nullable()->index();
            $t->unsignedInteger('document_revision')->nullable();
            $t->string('verdict_status', 16);
            $t->json('verdict')->comment('FitmentVerdict::toArray() as the page showed it, with the whole tyre sum');
            $t->json('papers')->nullable()->comment('the figures from the customer\'s papers the answer used, when any');
            $t->string('engine_version', 16);
            $t->timestamp('computed_at');
            $t->timestamp('created_at')->nullable();
        });

        Constraints::enum('check_results', 'verdict_status', array_map(static fn (VerdictStatus $s): string => $s->value, VerdictStatus::cases()));
        Constraints::add('check_results', 'chk_check_results_token', "REGEXP_LIKE(`token`, '^[A-Za-z0-9]{32}$', 'c')");

        DB::unprepared(<<<'SQL'
            CREATE TRIGGER trg_check_results_no_update
            BEFORE UPDATE ON check_results
            FOR EACH ROW
            BEGIN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'check_results is append-only';
            END
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS trg_check_results_no_update');
        Schema::dropIfExists('check_results');
    }
};
