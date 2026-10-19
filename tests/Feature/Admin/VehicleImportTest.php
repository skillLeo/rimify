<?php

declare(strict_types=1);

use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Vehicle;
use App\Models\VehicleImport;
use App\Services\Admin\Vehicles\VehicleImporter;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia;

/*
 * His admin item 2 (D-297): Fahrzeuge › Import — a vehicle dataset into the shop, keyed on HSN, TSN and variant, a
 * Probelauf with counts before anything is written, never a car a person checked or typed from a Gutachten overwritten,
 * never a source changed, every new car stamped with the import's source.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function vehicleImportAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @param  list<list<string>>  $rows */
function vehicleFile(array $rows, string $name = 'fahrzeuge.csv'): UploadedFile
{
    $header = ['HSN', 'TSN', 'Hersteller', 'Handelsname', 'Variante', 'Fahrzeugtyp', 'EG-Nummer', 'Leistung kW', 'Baubeginn', 'Bauende', 'Achslast vorn kg', 'Achslast hinten kg', 'Höchstgeschwindigkeit km/h'];
    $lines = array_map(static fn (array $cells): string => implode(';', $cells), [$header, ...$rows]);

    return UploadedFile::fake()->createWithContent($name, implode("\n", $lines)."\n");
}

/** @return list<string> */
function datasetLine(array $overrides = []): array
{
    $row = [
        'hsn' => '0005', 'tsn' => 'ZA1', 'make' => 'Testmarke', 'model' => 'Modell', 'variant' => '2.0 Limousine', 'type' => 'T1',
        'eg' => 'e1*2007/46*0316*12', 'kw' => '110', 'from' => '03.2015', 'to' => '12.2019', 'front' => '1.050', 'rear' => '1.120', 'speed' => '225',
        ...$overrides,
    ];

    return array_values($row);
}

function vehicleProbelauf(object $test, UploadedFile $file, string $source = 'import_kba'): VehicleImport
{
    $test->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/probelauf', ['file' => $file, 'quelle' => $source])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    return VehicleImport::query()->latest('id')->firstOrFail();
}

it('makes a Probelauf that writes no car, and counts what the import would do @admin-202', function (): void {
    $import = vehicleProbelauf($this, vehicleFile([datasetLine(), datasetLine(['tsn' => 'ZA2', 'variant' => '2.0 Touring']), datasetLine(['hsn' => '', 'tsn' => ''])]));

    expect(Vehicle::query()->count())->toBe(0)
        ->and($import->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->summary)->toMatchArray([VehicleImporter::CREATE => 2, VehicleImporter::REFUSED => 1])
        ->and(collect($import->plan)->firstWhere('status', VehicleImporter::REFUSED)['reason'])->toBe('HSN oder TSN fehlt oder ist nicht lesbar. Die HSN hat vier Ziffern, die TSN drei Zeichen.')
        // Without both key numbers the row shows none: its reason says what is missing.
        ->and(collect($import->plan)->firstWhere('status', VehicleImporter::REFUSED)['keys'])->toBeNull();

    $this->actingAs(vehicleImportAdmin(), 'admin')->get('/admin/fahrzeuge/import/'.$import->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Fahrzeuge/ImportRun')->where('missing', [])->has('rows', 3)
            // Beneath Import, the nearer of the two rail pages its address lies under.
            ->where('admin.breadcrumbs', [
                ['label' => 'Fahrzeuge', 'href' => null],
                ['label' => 'Import', 'href' => '/admin/fahrzeuge/import'],
                ['label' => 'fahrzeuge.csv', 'href' => null],
            ]));
});

it('imports what the Probelauf showed, stamped with its source, never development data — and again changes nothing @admin-202', function (): void {
    $import = vehicleProbelauf($this, vehicleFile([datasetLine(), datasetLine(['tsn' => 'ZA2', 'variant' => '2.0 Touring', 'front' => '', 'speed' => ''])]));

    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren')->assertSessionHasNoErrors();

    $complete = Vehicle::query()->where('tsn', 'ZA1')->sole();
    $partial = Vehicle::query()->where('tsn', 'ZA2')->sole();

    expect($complete->source)->toBe(VehicleSource::ImportKba->value)
        ->and($complete->is_demo)->toBeFalse()
        ->and($complete->axle_load_front_kg)->toBe(1050)
        ->and($complete->max_speed_kmh)->toBe(225)
        ->and($complete->build_to?->toDateString())->toBe('2019-12-31')
        ->and($complete->needs_review)->toBeFalse()
        // Without an axle load or the top speed: „zur Prüfung“ (R-03), never a guess.
        ->and($partial->axle_load_front_kg)->toBeNull()
        ->and($partial->needs_review)->toBeTrue()
        ->and(AuditLog::query()->where('description', 'vehicle.import_applied')->exists())->toBeTrue();

    // The same file again: idempotent on HSN, TSN and variant.
    $again = vehicleProbelauf($this, vehicleFile([datasetLine(), datasetLine(['tsn' => 'ZA2', 'variant' => '2.0 Touring', 'front' => '', 'speed' => ''])]));

    expect($again->summary)->toMatchArray([VehicleImporter::CREATE => 0, VehicleImporter::UPDATE => 0, VehicleImporter::UNCHANGED => 2])
        ->and(Vehicle::query()->count())->toBe(2);
});

it('changes a car of its own source where the file says otherwise, and never empties a figure the file leaves out @admin-202', function (): void {
    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.vehicleProbelauf($this, vehicleFile([datasetLine()]))->id.'/importieren');

    $import = vehicleProbelauf($this, vehicleFile([datasetLine(['speed' => '230', 'front' => ''])]));

    expect($import->summary)->toMatchArray([VehicleImporter::UPDATE => 1])
        ->and($import->plan[0]['changes'])->toBe(['max_speed_kmh']);

    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren')->assertSessionHasNoErrors();

    expect(Vehicle::query()->sole())->max_speed_kmh->toBe(230)->axle_load_front_kg->toBe(1050);
});

it('never overwrites a car a person checked, nor changes a source @admin-202', function (): void {
    Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'ZA1', 'variant' => '2.0 Limousine', 'source' => VehicleSource::ManuellGeprueft->value, 'max_speed_kmh' => 210]);
    Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'ZA3', 'variant' => '2.0 Coupé', 'source' => VehicleSource::ImportDat->value]);

    $import = vehicleProbelauf($this, vehicleFile([datasetLine(), datasetLine(['tsn' => 'ZA3', 'variant' => '2.0 Coupé'])]));
    $reasons = collect($import->plan)->pluck('reason', 'line');

    expect($import->summary)->toMatchArray([VehicleImporter::KEPT => 2, VehicleImporter::CREATE => 0])
        ->and($reasons->first())->toBe('Von Hand angelegt und geprüft – bleibt, wie es ist.')
        ->and($reasons->last())->toBe('Kommt aus einer anderen Quelle (DAT) – bleibt, wie es ist.');
});

it('fills a car typed from a Gutachten instead of making a second one without its rows @admin-202', function (): void {
    $gutachten = Vehicle::factory()->create([
        'hsn' => null, 'tsn' => null, 'make' => 'Testmarke', 'model' => 'Modell', 'variant' => 'T1', 'type_designation' => 'T1',
        'eg_nummer_raw' => 'e1*2007/46*0316*..', 'source' => VehicleSource::Gutachten->value,
        'source_document_id' => ApprovalDocument::factory()->create()->id, 'source_page' => 4, 'source_vehicle_id' => null,
        'axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null, 'needs_review' => true,
    ]);

    $import = vehicleProbelauf($this, vehicleFile([datasetLine()]));

    expect($import->summary)->toMatchArray([VehicleImporter::MERGE => 1, VehicleImporter::CREATE => 0]);

    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren')->assertSessionHasNoErrors();

    expect(Vehicle::query()->count())->toBe(1)
        ->and($gutachten->refresh()->hsn)->toBe('0005')
        ->and($gutachten->tsn)->toBe('ZA1')
        ->and($gutachten->source)->toBe(VehicleSource::Gutachten->value)
        ->and($gutachten->axle_load_front_kg)->toBe(1050);
});

it('never fills a car that carries other key numbers: another HSN or TSN is another car @admin-202', function (): void {
    // Same approval and Fahrzeugtyp, but typed from its own papers under TSN ZB9: the file's ZA1 is not this car.
    $typed = Vehicle::factory()->create([
        'hsn' => '0005', 'tsn' => 'ZB9', 'make' => 'Testmarke', 'model' => 'Modell', 'variant' => '2.0 Limousine', 'type_designation' => 'T1',
        'eg_nummer_raw' => 'e1*2007/46*0316*12', 'source' => VehicleSource::ManuellGeprueft->value,
        'axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null, 'needs_review' => true,
    ]);

    $import = vehicleProbelauf($this, vehicleFile([datasetLine()]));

    expect($import->summary)->toMatchArray([VehicleImporter::CREATE => 1, VehicleImporter::MERGE => 0]);

    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren')->assertSessionHasNoErrors();

    expect($typed->refresh()->axle_load_front_kg)->toBeNull()
        ->and($typed->needs_review)->toBeTrue()
        ->and(Vehicle::query()->count())->toBe(2);
});

it('refuses a row whose build window does not read — never an open window, a car built at any time (R-02) @admin-202', function (): void {
    $import = vehicleProbelauf($this, vehicleFile([
        datasetLine(['from' => '201503']),
        datasetLine(['tsn' => 'ZA2', 'variant' => '2.0 Touring', 'from' => '']),
        datasetLine(['tsn' => 'ZA3', 'variant' => '2.0 Coupé', 'to' => 'Dez 19']),
        datasetLine(['tsn' => 'ZA4', 'variant' => '2.0 Cabrio', 'from' => '06.2016', 'to' => '03.2015']),
    ]));
    $reasons = collect($import->plan)->pluck('reason', 'line');

    expect($import->summary)->toMatchArray([VehicleImporter::REFUSED => 4, VehicleImporter::CREATE => 0])
        ->and($reasons['2'])->toBe('Der Baubeginn ist nicht lesbar: „201503“. Bitte Monat und Jahr, etwa 03.2015.')
        ->and($reasons['3'])->toBe('Der Baubeginn fehlt. Bitte Monat und Jahr, etwa 03.2015.')
        ->and($reasons['4'])->toBe('Das Bauende ist nicht lesbar: „Dez 19“. Bitte Monat und Jahr, etwa 12.2019 – oder leer, wenn es noch gebaut wird.')
        ->and($reasons['5'])->toBe('Das Bauende liegt vor dem Baubeginn.');
});

it('imports a run once: a page another tab has checked since is told to reload, a second click that it is done @admin-202', function (): void {
    $import = vehicleProbelauf($this, vehicleFile([datasetLine()]));
    $shown = VehicleImporter::fingerprint($import->plan);

    // Another tab checks the run again under another mapping: the Probelauf on this page is no longer the run's.
    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/zuordnung', ['mapping' => array_diff_key($import->mapping, ['fahrzeugtyp' => true])])
        ->assertSessionHasNoErrors();
    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => $shown])
        ->assertSessionHasErrors(['import' => 'Der Probelauf wurde geändert, seit du diese Seite geöffnet hast. Lad die Seite neu und prüf ihn, bevor du importierst.']);

    expect(Vehicle::query()->count())->toBe(0);

    $fresh = VehicleImporter::fingerprint($import->refresh()->plan);
    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => $fresh])->assertSessionHasNoErrors();

    // The second click, or the second tab: told the file is imported — never that a right is missing —, nothing twice.
    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => $fresh])
        ->assertSessionHasErrors(['import' => 'Diese Datei ist schon importiert.']);
    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/zuordnung', ['mapping' => $import->mapping])
        ->assertSessionHasErrors(['import' => 'Diese Datei ist schon importiert. Ihre Zuordnung bleibt, wie sie war.']);

    expect(Vehicle::query()->count())->toBe(1);
});

it('counts a dataset’s car numbers within its source, and never hands out one the file brings itself @admin-202', function (): void {
    // A KBA car numbered 7001: a TecDoc file counts its own cars, and its 7001 is another car.
    Vehicle::factory()->create(['source' => VehicleSource::ImportKba->value, 'source_vehicle_id' => 7001, 'hsn' => '0005', 'tsn' => 'ZZ1', 'variant' => 'aus dem KBA-Datensatz']);

    $file = UploadedFile::fake()->createWithContent('tecdoc.csv', implode("\n", [
        'ID;HSN;TSN;Hersteller;Handelsname;Variante;Baubeginn',
        '7001;0005;ZT1;Testmarke;Modell;2.0 TecDoc;03.2015',
        ';0005;ZT2;Testmarke;Modell;2.0 ohne Nummer;03.2015',
        '7002;0005;ZT3;Testmarke;Modell;2.0 mit Nummer;03.2015',
    ])."\n");
    $import = vehicleProbelauf($this, $file, VehicleSource::ImportTecdoc->value);

    expect($import->summary)->toMatchArray([VehicleImporter::CREATE => 3, VehicleImporter::REFUSED => 0]);

    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => VehicleImporter::fingerprint($import->plan)])
        ->assertSessionHasNoErrors();

    // The row without a number gets one past the file's own (7002), not the 7002 another row of the file brings.
    expect(Vehicle::query()->where('source', VehicleSource::ImportTecdoc->value)->orderBy('source_vehicle_id')->pluck('source_vehicle_id')->all())->toBe([7001, 7002, 7003]);
});

it('reads a file saved as Unicode text — UTF-16 with its byte order mark, tab-separated @admin-202', function (): void {
    $text = implode("\r\n", ["HSN\tTSN\tHersteller\tHandelsname\tVariante\tBaubeginn", "0005\tZU1\tTestmarke\tModell\t2.0 Unicode\t03.2015"])."\r\n";
    $import = vehicleProbelauf($this, UploadedFile::fake()->createWithContent('unicode.txt', "\xFF\xFE".mb_convert_encoding($text, 'UTF-16LE', 'UTF-8')));

    expect($import->summary)->toMatchArray([VehicleImporter::CREATE => 1, VehicleImporter::REFUSED => 0])
        ->and($import->plan[0]['keys'])->toBe('HSN 0005 · TSN ZU1');
});

it('refuses a row twice in the file and says which figures it could not read @admin-202', function (): void {
    $import = vehicleProbelauf($this, vehicleFile([datasetLine(), datasetLine(), datasetLine(['tsn' => 'ZA2', 'variant' => '2.0 Touring', 'front' => 'viel'])]));
    $plan = collect($import->plan);

    expect($plan->firstWhere('line', '3')['reason'])->toBe('Doppelt in der Datei – gleiche HSN, TSN und Variante wie Zeile 2.')
        ->and($plan->firstWhere('line', '4')['notes'])->toBe(['Achslast vorn in kg (8.1) nicht lesbar: „viel“']);
});

it('reads his demo data’s `fahrzeug_max_kmh` as field T, and never a zero, a blank or an implausible speed as a number (D-287, R-03) @admin-202', function (): void {
    // His dataset's own column name for T (his message of 19.10.2026): found without being told.
    $header = ['HSN', 'TSN', 'Hersteller', 'Handelsname', 'Variante', 'Baubeginn', 'Achslast vorn kg', 'Achslast hinten kg', 'fahrzeug_max_kmh'];
    $rows = [['0005', 'ZM1', 'Testmarke', 'Modell', '2.0 A', '03.2015', '1.050', '1.120', '250'], ['0005', 'ZM2', 'Testmarke', 'Modell', '2.0 B', '03.2015', '1.050', '1.120', '0'], ['0005', 'ZM3', 'Testmarke', 'Modell', '2.0 C', '03.2015', '1.050', '1.120', ''], ['0005', 'ZM4', 'Testmarke', 'Modell', '2.0 D', '03.2015', '1.050', '1.120', '999'], ['0005', 'ZM5', 'Testmarke', 'Modell', '2.0 E', '03.2015', '1.050', '1.120', '250 km/h']];
    $file = UploadedFile::fake()->createWithContent('demo.csv', implode("\n", array_map(static fn (array $cells): string => implode(';', $cells), [$header, ...$rows]))."\n");

    $import = vehicleProbelauf($this, $file);
    $notes = collect($import->plan)->pluck('notes', 'line');

    expect($import->mapping['hoechstgeschwindigkeit_kmh'] ?? null)->toBe('fahrzeug_max_kmh')
        ->and($import->summary)->toMatchArray([VehicleImporter::CREATE => 5, VehicleImporter::REFUSED => 0])
        ->and($notes['2'])->toBe([])
        // Given and not a plausible top speed: said, and stored as nothing.
        ->and($notes['3'])->toBe(['Höchstgeschwindigkeit in km/h (T) nicht lesbar: „0“'])
        ->and($notes['4'])->toBe([])
        ->and($notes['5'])->toBe(['Höchstgeschwindigkeit in km/h (T) nicht lesbar: „999“'])
        ->and($notes['6'])->toBe(['Höchstgeschwindigkeit in km/h (T) nicht lesbar: „250 km/h“']);

    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren')->assertSessionHasNoErrors();

    $speeds = Vehicle::query()->orderBy('tsn')->get()->mapWithKeys(fn (Vehicle $v): array => [$v->tsn => [$v->max_speed_kmh, $v->needs_review]]);

    // The car without a readable top speed is kept with none and waits under „Zur Prüfung“ (R-03): never 0, never 999.
    expect($speeds->all())->toBe([
        'ZM1' => [250, false],
        'ZM2' => [null, true],
        'ZM3' => [null, true],
        'ZM4' => [null, true],
        'ZM5' => [null, true],
    ]);
});

it('applies nothing when the cars changed since the Probelauf @admin-202', function (): void {
    $import = vehicleProbelauf($this, vehicleFile([datasetLine()]));
    Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'ZA1', 'variant' => '2.0 Limousine', 'source' => VehicleSource::ManuellGeprueft->value]);

    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren')
        ->assertSessionHasErrors(['import' => 'Die Fahrzeuge haben sich seit dem Probelauf geändert. Wähl „Neu prüfen“, bevor du importierst.']);

    expect(Vehicle::query()->count())->toBe(1);
});

it('lets only who may import and create vehicles bring a file in (R-11)', function (): void {
    $this->actingAs(vehicleImportAdmin('catalogue-manager'), 'admin')->post('/admin/fahrzeuge/import/probelauf', ['file' => vehicleFile([datasetLine()]), 'quelle' => 'import_kba'])->assertForbidden();

    $import = vehicleProbelauf($this, vehicleFile([datasetLine()]));
    $this->actingAs(vehicleImportAdmin('catalogue-manager'), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren')->assertForbidden();

    expect(Vehicle::query()->count())->toBe(0);
});
