<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;

/**
 * A code typed beside one combination of step 4 stays with that combination (D-437): the rows written before it were put right once
 * here — that code off the size it reached another combination through. Superseded by D-451 (the client's review of 11.11, A): such a
 * code now stands on the combination itself, and 2026_11_12_000100 moves every one there, from one side or from both. Run now, the
 * repair would read the rows against a writer that puts the code on no size at all and take it off without a combination to land on;
 * so it does nothing. Where it ran, its work stands.
 */
return new class extends Migration
{
    public function up(): void
    {
        // D-451 moves the codes (CombinationCodesToSets).
    }

    public function down(): void
    {
        // The codes that came off belonged to another combination: putting them back would say it again.
    }
};
