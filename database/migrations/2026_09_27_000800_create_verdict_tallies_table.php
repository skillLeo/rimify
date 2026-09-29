<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * How many verdicts the shop showed, per Berlin day, per surface and per state — the Übersicht's
 * „Verdikte der Prüfungen“ (docs/admin/rest-build-plan.md, „Übersicht und Shell“ step D).
 *
 * A counter, not a log: one row per day, surface and state, incremented in place, so a busy product
 * page costs one upsert per view and no customer, car or wheel is stored. It counts from the day it
 * was created; the chart says so until it has a week to show.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verdict_tallies', function (Blueprint $table): void {
            $table->id();
            $table->date('day');
            $table->string('surface', 16);
            $table->string('status', 16);
            $table->unsignedInteger('n')->default(0);

            $table->unique(['day', 'surface', 'status'], 'uq_verdict_tally');
        });

        Constraints::enum('verdict_tallies', 'status', array_column(VerdictStatus::cases(), 'value'));
    }

    public function down(): void
    {
        Schema::dropIfExists('verdict_tallies');
    }
};
