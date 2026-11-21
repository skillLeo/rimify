<?php

declare(strict_types=1);

use App\Support\Schema\Constraints;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * A catalogue tyre may carry a speed symbol the shop's table does not rank (D-481, D-484): `F`, `A8`, `Z` — the form is
 * checked, not the figure. Such a tyre keeps `speed_rank` 0 and is matched by its symbol exactly, never by rank
 * (TyreEligibility::meets()): against a ranked minimum a rank of 0 never meets, so it fails closed.
 *
 * Down refuses while a tyre with rank 0 exists — the old check would not hold it, and nothing is changed silently.
 */
return new class extends Migration
{
    public function up(): void
    {
        Constraints::drop('tyre_variants', 'chk_tyre_speed_rank');
        Constraints::add('tyre_variants', 'chk_tyre_speed_rank', '`speed_rank` >= 0');
    }

    public function down(): void
    {
        $unranked = DB::table('tyre_variants')->where('speed_rank', 0)->count();

        if ($unranked > 0) {
            throw new RuntimeException("{$unranked} tyre(s) carry a speed symbol the shop does not rank (speed_rank 0); the old check cannot hold them. Change or remove them first.");
        }

        Constraints::drop('tyre_variants', 'chk_tyre_speed_rank');
        Constraints::add('tyre_variants', 'chk_tyre_speed_rank', '`speed_rank` > 0');
    }
};
