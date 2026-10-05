<?php

declare(strict_types=1);

use App\Services\Reset\TestEnvironment;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The database names the environment it was made in (CLAUDE.md R-04.1, condition 2): one settings row, written here
 * once — by the first migrate that reaches it, on the server whose environment it records — and never again, by
 * anything. The live shop's database therefore reads „production“ for good, and a test server pointed at it by mistake
 * finds that row and refuses to reset it (TestEnvironment::databaseRefusal). rimify:preflight fails a production
 * whose database does not say „production“.
 *
 * insertOrIgnore: a database that already names itself keeps its name, whatever environment migrates it later.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('settings')->insertOrIgnore([
            'key' => TestEnvironment::MARKER,
            'value' => json_encode((string) app()->environment(), JSON_THROW_ON_ERROR),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('settings')->where('key', TestEnvironment::MARKER)->delete();
    }
};
