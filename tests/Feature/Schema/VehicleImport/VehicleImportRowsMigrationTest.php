<?php

declare(strict_types=1);

use App\Services\Reset\SchemaFingerprint;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\Support\ResetFixture;

/*
 * D-462 (the client's request H): a run's rows move out of its JSON cells into rows of their own. A run made before keeps
 * everything its page showed — down puts the rows back into the cells, up takes them out again —, and the round trip
 * runs in a database of its own (ResetFixture): the schema after is the schema before.
 */

function vehicleImportRowsMigration(): Migration
{
    return require database_path('migrations/vehicle_import/2026_11_13_000100_vehicle_import_rows.php');
}

beforeEach(function (): void {
    $this->scratch = ResetFixture::scratch();
});

afterEach(function (): void {
    DB::setDefaultConnection('mysql');
    $this->scratch->drop();
});

it('keeps a run made before through down and up: its rows, its plan and its counts, and the schema as before', function (): void {
    $before = SchemaFingerprint::of(DB::connection());
    $migration = vehicleImportRowsMigration();

    $migration->down();

    expect(Schema::hasTable('vehicle_import_rows'))->toBeFalse()
        ->and(Schema::hasColumns('vehicle_imports', ['rows', 'plan']))->toBeTrue();

    // A run as the importer kept it before D-462: the cells in `file`, the mapped rows, the plan per row.
    $row = static fn (string $line, string $tsn): array => ['_line' => $line, 'hsn' => '0005', 'tsn' => $tsn, 'hersteller' => 'Testmarke', 'handelsname' => 'Modell', 'variante' => '2.0 '.$tsn,
        'fahrzeugtyp' => '', 'eg_nummer' => '', 'leistung_kw' => '', 'baubeginn' => '03.2015', 'bauende' => '', 'karosserie' => '', 'antrieb' => '', 'achslast_vorn_kg' => 'viel',
        'achslast_hinten_kg' => '', 'hoechstgeschwindigkeit_kmh' => '', 'gesamtmasse_kg' => '', 'fahrzeug_id' => ''];
    $plan = [
        ['line' => '2', 'label' => 'Testmarke Modell 2.0 ZA1', 'keys' => 'HSN 0005 · TSN ZA1', 'status' => 'create', 'vehicle' => null, 'changes' => [], 'notes' => ['Achslast vorn in kg (8.1) nicht lesbar: „viel“'], 'reason' => null],
        ['line' => '3', 'label' => 'Testmarke Modell 2.0 ZA1', 'keys' => 'HSN 0005 · TSN ZA1', 'status' => 'refused', 'vehicle' => null, 'changes' => [], 'notes' => [], 'reason' => 'Doppelt in der Datei – gleiche HSN, TSN und Variante wie Zeile 2.'],
    ];
    $id = DB::table('vehicle_imports')->insertGetId([
        'file_name' => 'alt.csv', 'file_format' => 'csv', 'file_sha256' => str_repeat('a', 64), 'source' => 'import_kba', 'status' => 'applied',
        'file' => json_encode(['headers' => ['HSN', 'TSN'], 'rows' => [['HSN' => '0005', 'TSN' => 'ZA1', '_line' => '2']]]),
        'mapping' => json_encode(['hsn' => 'HSN', 'tsn' => 'TSN']), 'rows' => json_encode([$row('2', 'ZA1'), $row('3', 'ZA1')]), 'plan' => json_encode($plan),
        'summary' => json_encode(['create' => 1, 'refused' => 1, 'rows' => 2]), 'applied_at' => now(), 'created_at' => now(), 'updated_at' => now(),
    ]);

    $migration->up();

    $kept = DB::table('vehicle_import_rows')->where('vehicle_import_id', $id)->orderBy('line')->get();

    expect(SchemaFingerprint::of(DB::connection()))->toBe($before)
        ->and($kept->pluck('status')->all())->toBe(['create', 'refused'])
        ->and($kept->pluck('reason')->all())->toBe([null, 'Doppelt in der Datei – gleiche HSN, TSN und Variante wie Zeile 2.'])
        ->and(json_decode((string) $kept[0]->notes, true))->toBe(['Achslast vorn in kg (8.1) nicht lesbar: „viel“'])
        ->and(json_decode((string) $kept[0]->cells, true)[2])->toBe('Testmarke')
        ->and(json_decode((string) DB::table('vehicle_imports')->where('id', $id)->value('file'), true))->toBe(['headers' => ['HSN', 'TSN']]);

    // And back once more: the cells and the plan as they were — key for key; MySQL keeps an object's keys in its own
    // order, MariaDB in the order written (VehicleImporter::fingerprint), so the order is not compared.
    $migration->down();
    $run = DB::table('vehicle_imports')->where('id', $id)->first();

    expect(json_decode((string) $run->plan, true))->toEqual($plan)
        ->and(json_decode((string) $run->rows, true))->toEqual([$row('2', 'ZA1'), $row('3', 'ZA1')]);

    $migration->up();

    expect(SchemaFingerprint::of(DB::connection()))->toBe($before);
});
