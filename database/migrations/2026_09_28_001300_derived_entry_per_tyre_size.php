<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The Eintragung is derived, per tyre size (the corrections memo §2).
 *
 * Both real documents hang their Auflagen off the (vehicle × tyre size) pair as well as off the vehicle
 * row: one size can require an Abnahme where another does not. So a tyre size carries its own codes, as
 * printed (`fitment_tyre_size_conditions`, resolved against the row's own document like the row's), and
 * „Eintragung / Abnahme erforderlich“ for a size is computed from them: an Auflage of kind `abnahme` among
 * the size's codes and the row's. Nobody ticks it any more — a typed flag drifts from the codes the day
 * someone edits one and forgets the other, and it is the one line a customer decides on.
 *
 * A person may still override the derived value, but only with a written reason, and who and when are
 * kept with it (and in the Protokoll). `fitments.requires_entry` is no longer typed: it holds the derived
 * (or overridden) value, written whenever a row or its document's Auflagen change, for the lists and the
 * conflict check. The engine derives it itself from the codes and reads the column only as a floor: a
 * stale value can make an answer stricter, never looser.
 *
 * A row entered before this change with the box ticked but no Abnahme among its codes keeps its
 * Eintragung through that floor — never lost silently (fails closed).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fitment_tyre_size_conditions', function (Blueprint $t): void {
            $t->foreignId('fitment_tyre_size_id')->constrained('fitment_tyre_sizes')->cascadeOnDelete();
            $t->string('code', 32)->collation('utf8mb4_bin')->comment('as printed; resolved against the row\'s own document');
            $t->timestamps();

            $t->primary(['fitment_tyre_size_id', 'code']);
        });

        Schema::table('fitments', function (Blueprint $t): void {
            $t->string('entry_override', 16)->nullable()->after('entry_note_de')->comment('required | not_required — against the derived value');
            $t->text('entry_override_reason')->nullable()->after('entry_override');
            $t->foreignId('entry_override_by')->nullable()->after('entry_override_reason')->constrained('admin_users')->restrictOnDelete();
            $t->timestamp('entry_override_at')->nullable()->after('entry_override_by');
        });

        Constraints::enum('fitments', 'entry_override', ['required', 'not_required']);
        // An override without its reason cannot exist.
        Constraints::add('fitments', 'chk_fitment_entry_override_reason', "`entry_override` IS NULL OR (`entry_override_reason` IS NOT NULL AND TRIM(`entry_override_reason`) <> '')");
    }

    public function down(): void
    {
        Constraints::drop('fitments', 'chk_fitment_entry_override_reason');
        Constraints::drop('fitments', 'chk_fitments_entry_override');

        Schema::table('fitments', function (Blueprint $t): void {
            $t->dropConstrainedForeignId('entry_override_by');
            $t->dropColumn(['entry_override', 'entry_override_reason', 'entry_override_at']);
        });

        Schema::dropIfExists('fitment_tyre_size_conditions');
    }
};
