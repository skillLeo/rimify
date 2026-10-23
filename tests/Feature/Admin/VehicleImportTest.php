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
        // A number, but not a top speed: said as what was read and what was expected (D-318), and stored as nothing.
        ->and($notes['3'])->toBe(["Höchstgeschwindigkeit in km/h (T): Gelesen: 0\u{00A0}km/h. Erwartet für eine Höchstgeschwindigkeit: 60 bis 420\u{00A0}km/h."])
        ->and($notes['4'])->toBe([])
        ->and($notes['5'])->toBe(["Höchstgeschwindigkeit in km/h (T): Gelesen: 999\u{00A0}km/h. Erwartet für eine Höchstgeschwindigkeit: 60 bis 420\u{00A0}km/h."])
        // No number at all: not read.
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

it('counts what the file lacks over all its rows, as counts and as shares of the file — the figures a purchase is decided on (D-317) @admin-202', function (): void {
    $import = vehicleProbelauf($this, vehicleFile([
        datasetLine(),
        datasetLine(['tsn' => 'ZB2', 'variant' => '2.0 B', 'speed' => '']),
        // An axle load that does not read is as missing as one left out.
        datasetLine(['tsn' => 'ZB3', 'variant' => '2.0 C', 'rear' => 'viel']),
        // Refused for want of key numbers, and counted all the same: the file lacks what it lacks.
        datasetLine(['hsn' => '', 'tsn' => '', 'variant' => '2.0 D', 'eg' => '']),
        // A top speed of 0 is a number, just not a top speed: implausible, the third state, not counted as missing (D-318).
        datasetLine(['tsn' => 'ZB5', 'variant' => '2.0 E', 'eg' => 'e1-falsch', 'speed' => '0']),
    ]));

    expect($import->summary)->toMatchArray(['rows' => 5, 'refused' => 1, 'without_speed' => 1, 'without_axle' => 1, 'without_keys' => 1, 'without_eg' => 2]);

    $percent = static fn (string $figure): string => $figure."\u{00A0}%";

    $this->actingAs(vehicleImportAdmin(), 'admin')->get('/admin/fahrzeuge/import/'.$import->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('gaps', [
            // Over all five rows, the refused one included: a half-refused file must not show flattering shares.
            ['key' => 'without_speed', 'label' => 'Höchstgeschwindigkeit (T)', 'count' => 1, 'share' => $percent('20'), 'unmapped' => null],
            ['key' => 'without_axle', 'label' => 'Achslast vorn oder hinten (8.1 oder 8.2)', 'count' => 1, 'share' => $percent('20'), 'unmapped' => null],
            ['key' => 'without_keys', 'label' => 'HSN oder TSN (2.1 oder 2.2)', 'count' => 1, 'share' => $percent('20'), 'unmapped' => null],
            ['key' => 'without_eg', 'label' => 'EG-Typgenehmigungsnummer (K)', 'count' => 2, 'share' => $percent('40'), 'unmapped' => null],
        ]));

    $mapped = ['hoechstgeschwindigkeit_kmh' => 'T', 'achslast_vorn_kg' => 'V', 'achslast_hinten_kg' => 'H', 'hsn' => 'HSN', 'tsn' => 'TSN', 'eg_nummer' => 'K'];
    $headers = ['T', 'V', 'H', 'HSN', 'TSN', 'K'];

    // A third, as the brief has it: one decimal place where the share is not whole.
    // Four gaps, counted first: a sequence over an empty list would pass and prove nothing (docs/dev/TEST-SMELLS.md, 2).
    expect(VehicleImporter::gaps(['rows' => 3, 'without_speed' => 1, 'without_axle' => 2, 'without_keys' => 0, 'without_eg' => 3], $mapped, $headers))
        ->toHaveCount(4)
        ->sequence(
            fn ($gap) => $gap->share->toBe($percent('33,3')),
            fn ($gap) => $gap->share->toBe($percent('66,7')),
            fn ($gap) => $gap->share->toBe($percent('0')),
            fn ($gap) => $gap->share->toBe($percent('100')),
        )
        // A run checked before the gaps were counted has none to show.
        ->and(VehicleImporter::gaps(['create' => 2, 'refused' => 0], $mapped, $headers))->toBe([]);
});

it('names a field without a column „Keine Spalte zugeordnet“ and counts nothing for it — never „missing“ for what was not read (R-17) @admin-202', function (): void {
    // No column for T and none for 8.2: the file may well hold both in a column nobody mapped.
    $header = ['HSN', 'TSN', 'Hersteller', 'Handelsname', 'Variante', 'Baubeginn', 'Achslast vorn kg', 'EG-Nummer'];
    $rows = [['0005', 'ZN1', 'Testmarke', 'Modell', '2.0 A', '03.2015', '1.050', 'e1*2007/46*0316*12'], ['0005', 'ZN2', 'Testmarke', 'Modell', '2.0 B', '03.2015', '', '']];
    $file = UploadedFile::fake()->createWithContent('ohne-t.csv', implode("\n", array_map(static fn (array $cells): string => implode(';', $cells), [$header, ...$rows]))."\n");

    $import = vehicleProbelauf($this, $file);

    $this->actingAs(vehicleImportAdmin(), 'admin')->get('/admin/fahrzeuge/import/'.$import->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('gaps', [
            ['key' => 'without_speed', 'label' => 'Höchstgeschwindigkeit (T)', 'count' => null, 'share' => null, 'unmapped' => 'Keine Spalte zugeordnet'],
            ['key' => 'without_axle', 'label' => 'Achslast vorn oder hinten (8.1 oder 8.2)', 'count' => null, 'share' => null, 'unmapped' => 'Keine Spalte für Feld 8.2 zugeordnet'],
            ['key' => 'without_keys', 'label' => 'HSN oder TSN (2.1 oder 2.2)', 'count' => 0, 'share' => "0\u{00A0}%", 'unmapped' => null],
            ['key' => 'without_eg', 'label' => 'EG-Typgenehmigungsnummer (K)', 'count' => 1, 'share' => "50\u{00A0}%", 'unmapped' => null],
        ]));
});

it('shows what reads but cannot be — said as read and expected, stored as nothing, every row imported all the same (D-318) @admin-202', function (): void {
    $header = ['HSN', 'TSN', 'Hersteller', 'Handelsname', 'Variante', 'Baubeginn', 'Achslast vorn kg', 'Achslast hinten kg', 'Höchstgeschwindigkeit km/h', 'Gesamtmasse kg'];
    $rows = [
        ['0005', 'ZP1', 'Testmarke', 'Modell', '2.0 A', '03.2015', '1.050', '1.120', '225', '2.000'],
        // An axle load beyond any car's: read, not believed.
        ['0005', 'ZP2', 'Testmarke', 'Modell', '2.0 B', '03.2015', '2.600', '1.120', '225', '2.000'],
        // 8.1 on the total mass: each figure believable alone, the sum is not — and a top speed no car has.
        ['0005', 'ZP3', 'Testmarke', 'Modell', '2.0 C', '03.2015', '1.840', '940', '999', '1.840'],
        ['0005', 'ZP4', 'Testmarke', 'Modell', '2.0 D', '03.2015', '350', '900', '210', '1.300'],
    ];
    $file = UploadedFile::fake()->createWithContent('unplausibel.csv', implode("\n", array_map(static fn (array $cells): string => implode(';', $cells), [$header, ...$rows]))."\n");
    $kg = static fn (string $n): string => $n."\u{00A0}kg";

    $import = vehicleProbelauf($this, $file);

    $this->actingAs(vehicleImportAdmin(), 'admin')->get('/admin/fahrzeuge/import/'.$import->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('implausible', [
            [
                'key' => 'axle_range', 'label' => 'Achslast vorn oder hinten (8.1 oder 8.2)', 'expected' => 'Erwartet für eine Achslast: 400 bis '.$kg('2.500').'.',
                'count' => 2, 'checked' => 4, 'examples' => ['Zeile 3: Gelesen: '.$kg('2.600').' (8.1)', 'Zeile 5: Gelesen: '.$kg('350').' (8.1)'], 'unmapped' => null, 'unchecked' => null,
            ],
            [
                'key' => 'axle_same', 'label' => 'Achslast vorn gleich hinten (8.1 = 8.2) in jeder geprüften Zeile', 'expected' => 'Erwartet: mindestens eine Zeile mit verschiedenen Werten vorn und hinten.',
                'count' => 0, 'checked' => 4, 'examples' => [], 'unmapped' => null, 'unchecked' => null,
            ],
            [
                // Two rows carry both axle loads in the band and a mass; one sum is half again the mass.
                'key' => 'axle_sum', 'label' => 'Achslast vorn plus hinten (8.1 + 8.2) im Verhältnis zur zulässigen Gesamtmasse (F.2)', 'expected' => "Erwartet: 95 bis 140\u{00A0}% der zulässigen Gesamtmasse.",
                'count' => 1, 'checked' => 2, 'examples' => ['Zeile 4: Gelesen: '.$kg('1.840').' + '.$kg('940').' = '.$kg('2.780').' bei '.$kg('1.840')." Gesamtmasse (151,1\u{00A0}%)"], 'unmapped' => null, 'unchecked' => null,
            ],
            [
                'key' => 'speed_range', 'label' => 'Höchstgeschwindigkeit (T)', 'expected' => "Erwartet für eine Höchstgeschwindigkeit: 60 bis 420\u{00A0}km/h.",
                'count' => 1, 'checked' => 4, 'examples' => ["Zeile 4: Gelesen: 999\u{00A0}km/h"], 'unmapped' => null, 'unchecked' => null,
            ],
        ])->where('fields', fn ($fields): bool => collect($fields)->firstWhere('key', 'gesamtmasse_kg')['hint'] === 'Wird nur zum Abgleich mit 8.1 und 8.2 gelesen und nicht gespeichert.'));

    // A warning, never a stop: every row imports.
    $this->actingAs(vehicleImportAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren')->assertSessionHasNoErrors();

    $cars = Vehicle::query()->orderBy('tsn')->get()->mapWithKeys(fn (Vehicle $v): array => [$v->tsn => [$v->axle_load_front_kg, $v->max_speed_kmh, $v->needs_review]]);

    expect($cars->all())->toBe([
        'ZP1' => [1050, 225, false],
        // What cannot be an axle load or a top speed is stored as nothing: the car waits under „Zur Prüfung“.
        'ZP2' => [null, 225, true],
        // Each figure believable alone: kept as read — the sum check warns, the person importing decides.
        'ZP3' => [1840, null, true],
        'ZP4' => [null, 210, true],
    ]);
});

it('flags 8.1 equal to 8.2 in every row only from three rows on, names one column mapped twice, and says when a check could not run (D-318) @admin-202', function (): void {
    $row = static fn (string $line, string $front, string $rear): array => ['_line' => $line, 'achslast_vorn_kg' => $front, 'achslast_hinten_kg' => $rear, 'hoechstgeschwindigkeit_kmh' => '', 'gesamtmasse_kg' => ''];
    $same = ['achslast_vorn_kg' => 'Achslast', 'achslast_hinten_kg' => 'Achslast', 'hoechstgeschwindigkeit_kmh' => 'Vmax', 'gesamtmasse_kg' => 'Masse'];
    $headers = ['Achslast', 'Vmax', 'Masse'];
    $check = static fn (array $checks, string $key): array => collect($checks)->firstWhere('key', $key);

    $three = VehicleImporter::implausible([$row('2', '1.050', '1.050'), $row('3', '980', '980'), $row('4', '1.200', '1.200')], $same, $headers);

    expect($check($three, 'axle_same'))->toMatchArray([
        'count' => 3,
        'checked' => 3,
        'examples' => ['Die Spalte „Achslast“ ist sowohl 8.1 als auch 8.2 zugeordnet.', "Zeile 2: Gelesen: 1.050\u{00A0}kg und 1.050\u{00A0}kg", "Zeile 3: Gelesen: 980\u{00A0}kg und 980\u{00A0}kg"],
    ])
        // The mass is mapped and read in no row: not checked, said why — never a nought over zero rows.
        ->and($check($three, 'axle_sum'))->toMatchArray(['count' => null, 'unchecked' => 'Nicht geprüft: keine Zeile, in der eine Gesamtmasse gelesen wurde und beide Achslasten im erwarteten Bereich liegen.'])
        // T is mapped but no row gives one: „in keiner Zeile“ would be a pass over zero rows — it says so instead.
        ->and($check($three, 'speed_range'))->toMatchArray(['count' => null, 'checked' => 0, 'unchecked' => 'Nicht geprüft: keine Zeile, in der eine Höchstgeschwindigkeit gelesen wurde.']);

    // The same for the axle loads: mapped, and empty in every row.
    $empty = VehicleImporter::implausible([$row('2', '', ''), $row('3', '', '')], ['achslast_vorn_kg' => 'V', 'achslast_hinten_kg' => 'H'], ['V', 'H']);

    expect($check($empty, 'axle_range'))->toMatchArray(['count' => null, 'checked' => 0, 'unchecked' => 'Nicht geprüft: keine Zeile, in der eine Achslast gelesen wurde.']);

    // Just above the band: shown with its decimal, never rounded down to the 140 % the band allows.
    $edge = VehicleImporter::implausible(
        [['_line' => '2', 'achslast_vorn_kg' => '1.200', 'achslast_hinten_kg' => '1.187', 'hoechstgeschwindigkeit_kmh' => '', 'gesamtmasse_kg' => '1.700']],
        ['achslast_vorn_kg' => 'V', 'achslast_hinten_kg' => 'H', 'gesamtmasse_kg' => 'M'],
        ['V', 'H', 'M'],
    );

    expect($check($edge, 'axle_sum'))->toMatchArray(['count' => 1, 'checked' => 1])
        ->and($check($edge, 'axle_sum')['examples'][0])->toEndWith("Gesamtmasse (140,4\u{00A0}%)");

    // Two equal rows prove nothing: one or two such cars exist.
    $two = VehicleImporter::implausible([$row('2', '1.050', '1.050'), $row('3', '980', '980')], $same, $headers);

    expect($check($two, 'axle_same'))->toMatchArray(['count' => null, 'examples' => [], 'unchecked' => 'Nicht geprüft: Dafür sind mindestens 3 Zeilen nötig, in denen beide Achslasten gelesen wurden.']);

    // No column for the mass: the sum is not checked, and the page says which field has none (D-318).
    $noMass = VehicleImporter::implausible([$row('2', '1.050', '1.120')], ['achslast_vorn_kg' => 'V', 'achslast_hinten_kg' => 'H'], ['V', 'H']);

    expect($check($noMass, 'axle_sum'))->toMatchArray(['count' => null, 'checked' => 0, 'unmapped' => 'Keine Spalte für Feld F.2 zugeordnet', 'unchecked' => null])
        ->and($check($noMass, 'speed_range'))->toMatchArray(['count' => null, 'unmapped' => 'Keine Spalte zugeordnet']);
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
