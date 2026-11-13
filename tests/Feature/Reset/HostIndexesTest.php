<?php

declare(strict_types=1);

use App\Models\AuditLog;
use App\Services\Reset\BaselineState;
use App\Services\Reset\HostIndexes;
use App\Services\Reset\SchemaFingerprint;
use App\Services\Reset\TestEnvironment;
use Illuminate\Support\Facades\DB;
use Tests\Support\ResetFixture;

/*
 * D-476, D-477: the preview's host adds a plain index named `wdbi_<columns>_<hash>` after a slow query. The reset's check
 * of the schema looks past exactly those — that check alone, that prefix alone, never a unique one — and every release
 * removes them before its migrations (`rimify:host-indizes --entfernen`, deploy/remote.sh). In a database of its own.
 */

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('lets the reset check look past a host index — that check alone; every other caller still sees it', function (): void {
    $before = SchemaFingerprint::of(DB::connection());
    DB::statement('ALTER TABLE vehicles ADD INDEX wdbi_make_source_hsn_4794d48378d7 (make, source, hsn)');

    expect(BaselineState::mismatch(TestEnvironment::baseline(), DB::connection()))->toBeNull()
        ->and(SchemaFingerprint::of(DB::connection(), withoutHostIndexes: true))->toBe($before)
        ->and(SchemaFingerprint::of(DB::connection()))->not->toBe($before);
});

it('still refuses another name, a unique host-named index, and a prefix that only looks alike', function (string $sql): void {
    DB::statement($sql);

    expect(BaselineState::mismatch(TestEnvironment::baseline(), DB::connection()))->toContain('außerhalb einer Migration geändert')
        ->and(HostIndexes::in(DB::connection()))->toBe([]);
})->with([
    'another name' => 'ALTER TABLE vehicles ADD INDEX idx_by_hand (make, source)',
    'unique, host-named' => 'ALTER TABLE vehicles ADD UNIQUE INDEX wdbi_demo_ref_ab12cd34ef56 (demo_ref)',
    'prefix without its underscore' => 'ALTER TABLE vehicles ADD INDEX wdbix_make_ab12cd34ef56 (make)',
]);

it('names host indexes, removes them with --entfernen, writes the Protokoll, and leaves every other index alone', function (): void {
    $before = SchemaFingerprint::of(DB::connection());
    DB::statement('ALTER TABLE vehicles ADD INDEX wdbi_source_source_vehicle_id_make_deleted_at_82bdb0705ac6 (source, source_vehicle_id, make, deleted_at)');
    DB::statement('ALTER TABLE vehicle_import_rows ADD INDEX wdbi_vehicle_import_id_status_number_9482939ca9d0 (vehicle_import_id, status, number)');
    DB::statement('ALTER TABLE vehicles ADD UNIQUE INDEX wdbi_demo_ref_ab12cd34ef56 (demo_ref)');

    $this->artisan('rimify:host-indizes')
        ->expectsOutputToContain('vehicles.wdbi_source_source_vehicle_id_make_deleted_at_82bdb0705ac6 (source, source_vehicle_id, make, deleted_at)')
        ->expectsOutputToContain('2 Indexe des Hosts. Mit --entfernen werden sie entfernt.')
        ->assertSuccessful();
    expect(HostIndexes::in(DB::connection()))->toHaveCount(2);

    $this->artisan('rimify:host-indizes', ['--entfernen' => true])
        ->expectsOutputToContain('vehicle_import_rows.wdbi_vehicle_import_id_status_number_9482939ca9d0 (vehicle_import_id, status, number)')
        ->expectsOutputToContain('2 Indexe des Hosts entfernt.')
        ->assertSuccessful();

    $entry = AuditLog::query()->where('description', 'schema.host_indexes_removed')->sole();

    expect(HostIndexes::in(DB::connection()))->toBe([])
        ->and($entry->properties['count'] ?? null)->toBe(2)
        ->and(array_column($entry->properties['indexes'] ?? [], 'name'))->toBe(['wdbi_vehicle_import_id_status_number_9482939ca9d0', 'wdbi_source_source_vehicle_id_make_deleted_at_82bdb0705ac6'])
        // The unique one stays — and the reset check keeps refusing it.
        ->and(DB::select("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND INDEX_NAME = 'wdbi_demo_ref_ab12cd34ef56'"))->not->toBe([]);

    DB::statement('ALTER TABLE vehicles DROP INDEX wdbi_demo_ref_ab12cd34ef56');
    expect(SchemaFingerprint::of(DB::connection()))->toBe($before);

    $this->artisan('rimify:host-indizes', ['--entfernen' => true])->expectsOutputToContain('Keine Indizes des Hosts')->assertSuccessful();
    expect(AuditLog::query()->where('description', 'schema.host_indexes_removed')->count())->toBe(1);
});

it('runs in every release before its migrations', function (): void {
    $script = (string) file_get_contents(base_path('deploy/remote.sh'));

    expect(strpos($script, 'artisan rimify:host-indizes --entfernen'))->toBeInt()
        ->toBeLessThan(strpos($script, 'artisan migrate --force'));
});
