<?php

declare(strict_types=1);

use App\Services\Reset\SchemaFingerprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Tests\Support\ResetFixture;

/*
 * D-484: a catalogue tyre may carry a speed symbol the shop's table does not rank (`F`, `A8`, `Z`), kept with `speed_rank` 0.
 * The migration loosens the column's check from `> 0` to `>= 0`; its down refuses while such a tyre exists, so nothing is
 * changed silently. The round trip runs in a database of its own (ResetFixture): down, its checks, up again, and the schema
 * after is the schema before.
 */

function speedRankMigration(): Migration
{
    return require database_path('migrations/2026_11_21_000100_tyre_speed_rank_unranked.php');
}

/** @param array<string, mixed> $over */
function rankedTyre(array $over = []): int
{
    $brand = (int) DB::table('brands')->insertGetId(['name' => 'Rangprobe '.uniqid(), 'slug' => 'rangprobe-'.uniqid(), 'created_at' => now(), 'updated_at' => now()]);

    return (int) DB::table('tyre_variants')->insertGetId([
        'brand_id' => $brand, 'name' => 'Probe', 'season' => 'sommer', 'width_mm' => 305, 'aspect' => 70, 'diameter_in' => 22.5,
        'load_index' => 160, 'speed_symbol' => 'F', 'speed_rank' => 0, 'price_cents' => 10_000, 'currency' => 'EUR',
        'available' => true, 'is_demo' => false, 'created_at' => now(), 'updated_at' => now(), ...$over,
    ]);
}

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('keeps a tyre whose symbol the table does not rank with rank 0, and still refuses a negative rank', function (): void {
    $id = rankedTyre();

    expect(DB::table('tyre_variants')->where('id', $id)->value('speed_rank'))->toBe(0)
        ->and(DB::table('migrations')->where('migration', '2026_11_21_000100_tyre_speed_rank_unranked')->exists())->toBeTrue()
        ->and(static fn () => rankedTyre(['speed_rank' => -1]))->toThrow(QueryException::class);
});

it('refuses to go down while a rank-0 tyre exists, and goes down and up again without one: the schema as before', function (): void {
    $before = SchemaFingerprint::of(DB::connection());
    $migration = speedRankMigration();
    $id = rankedTyre();

    // The old check could not hold this tyre: down says so and changes nothing.
    expect(static fn () => $migration->down())->toThrow(RuntimeException::class)
        ->and(DB::table('tyre_variants')->where('id', $id)->exists())->toBeTrue()
        ->and(SchemaFingerprint::of(DB::connection()))->toBe($before);

    DB::table('tyre_variants')->where('id', $id)->delete();
    $migration->down();

    // The old check is back: rank 0 is refused, a ranked tyre is not.
    expect(static fn () => rankedTyre())->toThrow(QueryException::class)
        ->and(rankedTyre(['speed_symbol' => 'V', 'speed_rank' => 14]))->toBeGreaterThan(0);

    DB::table('tyre_variants')->delete();
    $migration->up();

    expect(SchemaFingerprint::of(DB::connection()))->toBe($before);
});
