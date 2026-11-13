<?php

declare(strict_types=1);

use App\Services\Reset\SchemaFingerprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\ResetFixture;

/*
 * D-459 (the client's review of 11.11.2026, C): no Gutachten keeps a table of tyre load at speed of its own; every one reads
 * ETRTO's. The migration drops the table, and its down brings it back empty, as the two migrations of 28.09.2026 built it.
 * The round trip runs in a database of its own (ResetFixture) — a table dropped and made again must never change the suite's:
 * down, a row and its checks, up again, and the schema after is the schema before.
 */

function speedTableMigration(): Migration
{
    return require database_path('migrations/2026_11_12_000400_drop_document_speed_deratings.php');
}

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('leaves a migrated database without the table, the migration recorded', function (): void {
    expect(Schema::hasTable('document_speed_deratings'))->toBeFalse()
        ->and(DB::table('migrations')->where('migration', '2026_11_12_000400_drop_document_speed_deratings')->exists())->toBeTrue();
});

it('brings the table back empty with its columns and checks, and drops it again with its rows: the schema as before', function (): void {
    $before = SchemaFingerprint::of(DB::connection());
    $migration = speedTableMigration();

    $migration->down();

    expect(Schema::getColumnListing('document_speed_deratings'))->toEqualCanonicalizing([
        'id', 'approval_document_id', 'speed_kmh', 'symbol', 'percent', 'source_page', 'seeded_from', 'created_at', 'updated_at',
    ])->and(DB::table('document_speed_deratings')->count())->toBe(0);

    $document = (int) DB::table('approval_documents')->orderBy('id')->value('id');
    $cell = static fn (array $over): array => [
        'approval_document_id' => $document, 'speed_kmh' => 250, 'symbol' => 'W', 'percent' => 95, 'created_at' => now(), 'updated_at' => now(), ...$over,
    ];

    DB::table('document_speed_deratings')->insert($cell([]));

    // Its checks came back with it: a share above 100 and a second cell for the same speed and symbol are refused.
    expect(static fn () => DB::table('document_speed_deratings')->insert($cell(['speed_kmh' => 260, 'percent' => 101])))->toThrow(QueryException::class)
        ->and(static fn () => DB::table('document_speed_deratings')->insert($cell([])))->toThrow(QueryException::class)
        ->and($document)->toBeGreaterThan(0);

    $migration->up();

    expect(Schema::hasTable('document_speed_deratings'))->toBeFalse()
        ->and(SchemaFingerprint::of(DB::connection()))->toBe($before);
});
