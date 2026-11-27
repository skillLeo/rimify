<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\Vehicle;
use App\Models\VehicleImport;
use App\Services\Admin\Vehicles\Import\ImportUpload;
use App\Services\Admin\Vehicles\Import\VehicleImportWork;
use App\Services\Admin\Vehicles\VehicleImporter;
use App\Support\EgNumber;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/*
 * The client's own vehicle list, in his own format (19.11.2026, D-478). Our earlier tests used files we made ourselves, so
 * they proved our format works and not his: 46 columns named hersteller_name, modell_name, fahrzeug_hsn …, every value in
 * double quotes except an unquoted NULL, CRLF line ends, the build window as four columns (month and year, from and to — a
 * month may be NULL), the drive as Allrad-, Front- or Heckantrieb, a VSN beside the name. The values here are made up; his
 * file is third-party data and stays out of the repository.
 */

const CLIENT_HEADER = ['id', 'hersteller_id', 'hersteller_name', 'modell_id', 'modell_name', 'fahrzeug_id', 'fahrzeug_name', 'fahrzeug_typ', 'fahrzeug_form', 'fahrzeug_eg_nummer', 'fahrzeug_antriebsachse', 'fahrzeug_achslast_va', 'fahrzeug_achslast_ha', 'fahrzeug_zul_gesamtgewicht', 'fahrzeug_laenge', 'fahrzeug_breite', 'fahrzeug_hoehe', 'fahrzeug_stuetzlast', 'fahrzeug_anhaengelast_gebremst', 'fahrzeug_anhaengelast_ungebremst', 'fahrzeug_treibstoff', 'fahrzeug_motor', 'fahrzeug_motorcode', 'fahrzeug_motor_oelmenge', 'fahrzeug_schaltgetriebecode', 'fahrzeug_schaltgetriebe_menge', 'fahrzeug_automatikgetriebecode', 'fahrzeug_automatikgetriebe_menge', 'fahrzeug_bremsfluessigkeits_menge', 'fahrzeug_kuehlfluessigkeits_menge', 'fahrzeug_ps', 'fahrzeug_kw', 'fahrzeug_leistung_bei_umdrehungen', 'fahrzeug_hubraum', 'fahrzeug_co2_emissions_wert', 'fahrzeug_leergewicht', 'fahrzeug_max_kmh', 'fahrzeug_sitzanzahl', 'fahrzeug_tueranzahl', 'fahrzeug_prod_monat_von', 'fahrzeug_prod_monat_bis', 'fahrzeug_prod_jahr_von', 'fahrzeug_prod_jahr_bis', 'fahrzeug_hsn', 'fahrzeug_tsn', 'fahrzeug_vsn'];

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

/**
 * One row of the client's format. `$v` overrides columns by name; everything else is a made-up value or NULL.
 *
 * @param  array<string, string|null>  $v
 */
function clientRow(int $id, array $v): string
{
    $base = array_fill_keys(CLIENT_HEADER, null);
    $row = [...$base, 'id' => (string) $id, 'hersteller_id' => '1', 'modell_id' => '1', 'fahrzeug_id' => (string) $id, 'fahrzeug_zul_gesamtgewicht' => '2000', 'fahrzeug_max_kmh' => '210', 'fahrzeug_kw' => '110', ...$v];

    // His writer: every value quoted, NULL bare.
    return implode(',', array_map(static fn (?string $x): string => $x === null ? 'NULL' : '"'.str_replace('"', '""', $x).'"', $row));
}

/** A list in his format: CRLF line ends, a header and eight cars that cover every shape his own list has. */
function clientCsv(): string
{
    $lines = ['"'.implode('","', CLIENT_HEADER).'"'];
    $cars = [
        // The same HSN, TSN and name twice, told apart by the VSN and the EG number.
        ['hersteller_name' => 'Testmarke', 'modell_name' => 'Alpha', 'fahrzeug_name' => 'Alpha Avant Quattro', 'fahrzeug_typ' => 'B9', 'fahrzeug_form' => 'Kombi', 'fahrzeug_eg_nummer' => 'e1*2001/116*0447*11', 'fahrzeug_antriebsachse' => 'Allradantrieb', 'fahrzeug_achslast_va' => '1210', 'fahrzeug_achslast_ha' => '1235', 'fahrzeug_prod_monat_von' => '3', 'fahrzeug_prod_jahr_von' => '2018', 'fahrzeug_prod_monat_bis' => '11', 'fahrzeug_prod_jahr_bis' => '2019', 'fahrzeug_hsn' => '1860', 'fahrzeug_tsn' => 'AAS', 'fahrzeug_vsn' => '00001'],
        ['hersteller_name' => 'Testmarke', 'modell_name' => 'Alpha', 'fahrzeug_name' => 'Alpha Avant Quattro', 'fahrzeug_typ' => 'B9', 'fahrzeug_form' => 'Kombi', 'fahrzeug_eg_nummer' => 'e1*2001/116*0447*15', 'fahrzeug_antriebsachse' => 'Allradantrieb', 'fahrzeug_achslast_va' => '1225', 'fahrzeug_achslast_ha' => '1235', 'fahrzeug_prod_monat_von' => '12', 'fahrzeug_prod_jahr_von' => '2019', 'fahrzeug_hsn' => '1860', 'fahrzeug_tsn' => 'AAS', 'fahrzeug_vsn' => '00017'],
        // Months NULL on both ends; an old German number that is no EG number.
        ['hersteller_name' => 'Testmarke', 'modell_name' => 'Beta', 'fahrzeug_name' => 'Beta 1.6', 'fahrzeug_typ' => 'T1', 'fahrzeug_form' => 'Limousine', 'fahrzeug_eg_nummer' => 'C640*', 'fahrzeug_antriebsachse' => 'Heckantrieb', 'fahrzeug_achslast_va' => '900', 'fahrzeug_achslast_ha' => '950', 'fahrzeug_prod_jahr_von' => '1982', 'fahrzeug_prod_jahr_bis' => '1987', 'fahrzeug_hsn' => '7118', 'fahrzeug_tsn' => '311', 'fahrzeug_vsn' => '002'],
        // An EG number with no extension; a start month and an end year only.
        ['hersteller_name' => 'Zweitmarke', 'modell_name' => 'Gamma', 'fahrzeug_name' => 'Gamma 1.2', 'fahrzeug_typ' => '5Z', 'fahrzeug_form' => 'Schrägheck', 'fahrzeug_eg_nummer' => 'E1*98/14*0105*', 'fahrzeug_antriebsachse' => 'Frontantrieb', 'fahrzeug_achslast_va' => '765', 'fahrzeug_achslast_ha' => '750', 'fahrzeug_prod_monat_von' => '10', 'fahrzeug_prod_jahr_von' => '2010', 'fahrzeug_prod_jahr_bis' => '2011', 'fahrzeug_hsn' => '0603', 'fahrzeug_tsn' => 'AZB', 'fahrzeug_vsn' => '00001'],
        ['hersteller_name' => 'Zweitmarke', 'modell_name' => 'Gamma', 'fahrzeug_name' => 'Gamma Cabrio', 'fahrzeug_typ' => '5Z', 'fahrzeug_form' => 'Cabrio', 'fahrzeug_eg_nummer' => 'e4*98/14*0056*', 'fahrzeug_antriebsachse' => 'Frontantrieb', 'fahrzeug_achslast_va' => '800', 'fahrzeug_achslast_ha' => '760', 'fahrzeug_prod_monat_von' => '4', 'fahrzeug_prod_jahr_von' => '2005', 'fahrzeug_prod_monat_bis' => '8', 'fahrzeug_prod_jahr_bis' => '2008', 'fahrzeug_hsn' => '0603', 'fahrzeug_tsn' => 'AAT', 'fahrzeug_vsn' => '001'],
        ['hersteller_name' => 'Zweitmarke', 'modell_name' => 'Delta', 'fahrzeug_name' => 'Delta Coupe', 'fahrzeug_typ' => 'D2', 'fahrzeug_form' => 'Coupe', 'fahrzeug_eg_nummer' => 'e13*98/14*0054*', 'fahrzeug_antriebsachse' => 'Heckantrieb', 'fahrzeug_achslast_va' => '1000', 'fahrzeug_achslast_ha' => '1100', 'fahrzeug_prod_monat_von' => '2', 'fahrzeug_prod_jahr_von' => '2000', 'fahrzeug_prod_monat_bis' => '6', 'fahrzeug_prod_jahr_bis' => '2001', 'fahrzeug_hsn' => '7967', 'fahrzeug_tsn' => '307', 'fahrzeug_vsn' => '001'],
        // Umlaut in a name; no top speed.
        ['hersteller_name' => 'Drittmarke', 'modell_name' => 'Ä-Modell', 'fahrzeug_name' => 'Ä-Modell 2.0 Größe', 'fahrzeug_typ' => 'K1', 'fahrzeug_form' => 'Kombi', 'fahrzeug_eg_nummer' => 'e1*2007/46*0233*00', 'fahrzeug_antriebsachse' => 'Frontantrieb', 'fahrzeug_achslast_va' => '1100', 'fahrzeug_achslast_ha' => '1050', 'fahrzeug_max_kmh' => null, 'fahrzeug_prod_jahr_von' => '2010', 'fahrzeug_prod_jahr_bis' => '2014', 'fahrzeug_hsn' => '1414', 'fahrzeug_tsn' => 'AAA', 'fahrzeug_vsn' => '00001'],
        ['hersteller_name' => 'Drittmarke', 'modell_name' => 'Ä-Modell', 'fahrzeug_name' => 'Ä-Modell 2.0 Größe', 'fahrzeug_typ' => 'K1', 'fahrzeug_form' => 'Kombi', 'fahrzeug_eg_nummer' => 'e1*2007/46*0233*04', 'fahrzeug_antriebsachse' => 'Frontantrieb', 'fahrzeug_achslast_va' => '1100', 'fahrzeug_achslast_ha' => '1050', 'fahrzeug_prod_monat_von' => '3', 'fahrzeug_prod_jahr_von' => '2013', 'fahrzeug_prod_jahr_bis' => '2014', 'fahrzeug_hsn' => '1414', 'fahrzeug_tsn' => 'AAE', 'fahrzeug_vsn' => '00001'],
    ];

    foreach ($cars as $i => $car) {
        $lines[] = clientRow($i + 1, $car);
    }

    return implode("\r\n", $lines)."\r\n";
}

/** A zip as his dataset comes: the CSV, the workbook and the SQL dump, each in a folder of its own, and a demo site. */
function clientZip(string $csv): string
{
    $path = tempnam(sys_get_temp_dir(), 'pkw');
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::OVERWRITE);
    $zip->addFromString('pkwliste_demo/CSV/pkwliste_demo.csv', $csv);
    $zip->addFromString('pkwliste_demo/XLSX/pkwliste_demo.xlsx', 'PK-not-read');
    $zip->addFromString('pkwliste_demo/SQL/pkwliste_demo.sql', "CREATE TABLE `fahrzeuge` (id int);\nINSERT INTO `fahrzeuge` VALUES (1);\n");
    $zip->addFromString('pkwliste_demo/PHP DEMO/index.php', '<?php echo 1;');
    $zip->close();
    $bytes = (string) file_get_contents($path);
    unlink($path);

    return $bytes;
}

/** Sends a file as the page does and drains the server's work: the run as it stands when it waits for a person. */
function clientRun(object $test, string $bytes, string $name): VehicleImport
{
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $id = (int) $test->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/hochladen', ['name' => $name, 'size' => strlen($bytes), 'quelle' => 'import_kba'])->assertCreated()->json('id');
    $test->actingAs($admin, 'admin')->post('/admin/fahrzeuge/import/'.$id.'/teil', ['offset' => 0, 'part' => UploadedFile::fake()->createWithContent('teil', $bytes)], ['Accept' => 'application/json'])->assertOk();
    $test->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/'.$id.'/fertig')->assertOk();

    for ($i = 0; $i < 1_000; $i++) {
        $import = VehicleImport::query()->findOrFail($id);

        if (! $import->working()) {
            return $import;
        }

        app(VehicleImportWork::class)->advance($id, 60);
    }

    throw new RuntimeException('The run never stopped working.');
}

function clientApply(object $test, VehicleImport $import): VehicleImport
{
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $test->actingAs($admin, 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => $import->plan_hash])->assertSessionHasNoErrors();

    for ($i = 0; $i < 1_000; $i++) {
        $import = VehicleImport::query()->findOrFail($import->id);

        if (! $import->working()) {
            return $import;
        }

        app(VehicleImportWork::class)->advance($import->id, 60);
    }

    throw new RuntimeException('The run never stopped working.');
}

it('maps his 46 columns by their names, with no mapping by hand', function (): void {
    $headers = CLIENT_HEADER;
    $map = VehicleImporter::guessMapping($headers);

    expect($map)->toMatchArray([
        'hersteller' => 'hersteller_name', 'handelsname' => 'modell_name', 'variante' => 'fahrzeug_name', 'fahrzeugtyp' => 'fahrzeug_typ',
        'eg_nummer' => 'fahrzeug_eg_nummer', 'karosserie' => 'fahrzeug_form', 'antrieb' => 'fahrzeug_antriebsachse',
        'achslast_vorn_kg' => 'fahrzeug_achslast_va', 'achslast_hinten_kg' => 'fahrzeug_achslast_ha', 'leistung_kw' => 'fahrzeug_kw',
        'hoechstgeschwindigkeit_kmh' => 'fahrzeug_max_kmh', 'gesamtmasse_kg' => 'fahrzeug_zul_gesamtgewicht', 'fahrzeug_id' => 'fahrzeug_id',
        'hsn' => 'fahrzeug_hsn', 'tsn' => 'fahrzeug_tsn', 'vsn' => 'fahrzeug_vsn',
        'bauvon_monat' => 'fahrzeug_prod_monat_von', 'bauvon_jahr' => 'fahrzeug_prod_jahr_von', 'bauende_monat' => 'fahrzeug_prod_monat_bis', 'bauende_jahr' => 'fahrzeug_prod_jahr_bis',
    ])->and(VehicleImporter::missing($map, $headers))->toBe([]);
});

it('imports every car of his CSV as he writes it — CRLF, bare NULL, split build window, VSN — and says „unverändert“ the second time', function (): void {
    $import = clientRun($this, clientCsv(), 'pkwliste_demo.csv');

    expect($import->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->summary)->toMatchArray(['rows' => 8, VehicleImporter::CREATE => 8, VehicleImporter::REFUSED => 0]);

    $import = clientApply($this, $import);

    expect($import->status)->toBe(VehicleImport::APPLIED)
        ->and(Vehicle::query()->where('source', 'import_kba')->count())->toBe(8);

    $a = Vehicle::query()->where('hsn', '1860')->where('tsn', 'AAS')->orderBy('id')->get();
    expect($a)->toHaveCount(2)
        ->and([$a[0]->make, $a[0]->model, $a[0]->variant, $a[0]->eg_nummer_raw, $a[0]->axle_load_front_kg, $a[0]->axle_load_rear_kg, $a[0]->max_speed_kmh, $a[0]->drive_axle, $a[0]->body_form])
        ->toBe(['Testmarke', 'Alpha', 'Alpha Avant Quattro', 'e1*2001/116*0447*11', 1210, 1235, 210, 'Allrad', 'Kombi'])
        // The second of the pair is told apart by its VSN, its own column (D-517) — the name stays the dataset's.
        ->and([$a[1]->variant, $a[1]->vsn])->toBe(['Alpha Avant Quattro', '00017'])
        ->and($a[1]->build_to)->toBeNull();

    // Month NULL (D-516): stored as unknown, never a month put in its place. The certain window, which every comparison
    // reads, is still never wider than the file says — from the latest start (December) to the earliest end (January).
    $beta = Vehicle::query()->where('hsn', '7118')->sole();
    expect([$beta->build_from?->toDateString(), $beta->build_to?->toDateString(), $beta->variant, $beta->vsn, $beta->drive_axle, $beta->eg_nummer_raw])
        ->toBe(['1982-12-01', '1987-01-31', 'Beta 1.6', '002', 'Hinterachse', 'C640*'])
        ->and([$beta->build_from_year, $beta->build_from_month, $beta->build_to_year, $beta->build_to_month])->toBe([1982, null, 1987, null])
        ->and($beta->periodLabel())->toBe("1982\u{00A0}– 1987");
    // March 2018 to November 2019, whole months.
    expect([$a[0]->build_from?->toDateString(), $a[0]->build_to?->toDateString()])->toBe(['2018-03-01', '2019-11-30']);

    $again = clientRun($this, clientCsv(), 'pkwliste_demo.csv');

    expect($again->summary)->toMatchArray(['rows' => 8, VehicleImporter::CREATE => 0, VehicleImporter::UNCHANGED => 8, VehicleImporter::REFUSED => 0]);
    expect(Vehicle::query()->where('source', 'import_kba')->count())->toBe(8);
});

it('reads a year alone in the one date column as he mapped it on 14.11 — the later start, the earlier end', function (): void {
    $csv = "HSN;TSN;Hersteller;Modell;Variante;Baubeginn;Bauende\n1234;ABC;Testmarke;Eins;Eins 1.0;2020;2022\n1234;ABD;Testmarke;Eins;Eins 1.2;03.2019;\n";
    $import = clientRun($this, $csv, 'jahr.csv');

    expect($import->summary)->toMatchArray(['rows' => 2, VehicleImporter::CREATE => 2, VehicleImporter::REFUSED => 0]);
    clientApply($this, $import);

    expect([Vehicle::query()->where('tsn', 'ABC')->sole()->build_from?->toDateString(), Vehicle::query()->where('tsn', 'ABC')->sole()->build_to?->toDateString()])->toBe(['2020-12-01', '2022-01-31']);
});

it('takes his zip and reads the CSV in it', function (): void {
    $import = clientRun($this, clientZip(clientCsv()), 'pkwliste_demo.zip');

    expect($import->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->file_format)->toBe('csv')
        ->and($import->summary)->toMatchArray(['rows' => 8, VehicleImporter::CREATE => 8, VehicleImporter::REFUSED => 0]);

    expect(clientApply($this, $import)->status)->toBe(VehicleImport::APPLIED)
        ->and(Vehicle::query()->where('make', 'Testmarke')->count())->toBe(3);
});

it('says in German what it will not read: a SQL file, a zip with only SQL, a zip with no table, a zip with two', function (string $name, string $bytes, string $sentence): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $id = (int) $this->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/hochladen', ['name' => $name, 'size' => strlen($bytes), 'quelle' => 'import_kba'])->assertCreated()->json('id');
    $this->actingAs($admin, 'admin')->post('/admin/fahrzeuge/import/'.$id.'/teil', ['offset' => 0, 'part' => UploadedFile::fake()->createWithContent('teil', $bytes)], ['Accept' => 'application/json'])->assertOk();

    $this->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/'.$id.'/fertig')->assertStatus(422)->assertJsonValidationErrors(['file'])->assertJsonPath('errors.file.0', $sentence);

    expect(Vehicle::query()->count())->toBe(0);
})->with([
    'a SQL dump' => ['pkwliste_demo.sql', "-- MySQL dump\nCREATE TABLE `fahrzeuge` (`id` int);\nINSERT INTO `fahrzeuge` VALUES (1);\n", 'Das ist eine SQL-Datei. SQL-Dateien lesen wir nicht. Nimm die Tabelle als CSV- oder Excel-Datei (.csv, .xlsx) – im Datensatz liegt sie im Ordner „CSV“ oder „XLSX“.'],
]);

it('says which tables a zip holds when it holds none, or several', function (): void {
    $sqlOnly = new ZipArchive;
    $path = tempnam(sys_get_temp_dir(), 'pkw');
    $sqlOnly->open($path, ZipArchive::OVERWRITE);
    $sqlOnly->addFromString('x/a.sql', 'CREATE TABLE t (id int);');
    $sqlOnly->close();
    $none = (string) file_get_contents($path);

    $two = new ZipArchive;
    $two->open($path, ZipArchive::OVERWRITE);
    $two->addFromString('a/eins.csv', "HSN;TSN\n");
    $two->addFromString('b/zwei.csv', "HSN;TSN\n");
    $two->close();
    $several = (string) file_get_contents($path);

    $nothing = new ZipArchive;
    $nothing->open($path, ZipArchive::OVERWRITE);
    $nothing->addFromString('readme.txt', 'nichts');
    $nothing->close();
    $empty = (string) file_get_contents($path);
    unlink($path);

    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    foreach ([
        [$none, 'In diesem Archiv liegt nur eine SQL-Datei. SQL-Dateien lesen wir nicht. Nimm die CSV- oder die Excel-Datei aus dem Datensatz.'],
        [$several, 'In diesem Archiv liegen mehrere Tabellen (eins.csv, zwei.csv). Entpack es und lad die eine hoch, die du importieren willst.'],
        [$empty, 'In diesem Archiv liegt keine CSV- und keine Excel-Datei. Lad bitte die Tabelle selbst hoch (.csv oder .xlsx).'],
    ] as [$bytes, $sentence]) {
        $id = (int) $this->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/hochladen', ['name' => 'x.zip', 'size' => strlen($bytes), 'quelle' => 'import_kba'])->assertCreated()->json('id');
        $this->actingAs($admin, 'admin')->post('/admin/fahrzeuge/import/'.$id.'/teil', ['offset' => 0, 'part' => UploadedFile::fake()->createWithContent('teil', $bytes)], ['Accept' => 'application/json'])->assertOk();
        $this->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/'.$id.'/fertig')->assertStatus(422)->assertJsonPath('errors.file.0', $sentence);
    }

});

/*
 * D-498, from the deep check of 21.11.2026 on the preview: a refused file stood „uploading“ for a day; a picture was read as
 * one line of CSV; a cut-off line was refused for the field it left empty, not for being cut off.
 */

/** Sends a file as the page does, up to „fertig“: the answer to „fertig“, and the run as it stands then. @return array{0: Illuminate\Testing\TestResponse<Symfony\Component\HttpFoundation\Response>, 1: VehicleImport} */
function clientFinish(object $test, string $bytes, string $name): array
{
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $id = (int) $test->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/hochladen', ['name' => $name, 'size' => strlen($bytes), 'quelle' => 'import_kba'])->assertCreated()->json('id');
    $test->actingAs($admin, 'admin')->post('/admin/fahrzeuge/import/'.$id.'/teil', ['offset' => 0, 'part' => UploadedFile::fake()->createWithContent('teil', $bytes)], ['Accept' => 'application/json'])->assertOk();

    // The part stands on the disk before „fertig“: what the run's end must take away.
    expect(Storage::disk('local')->exists((string) VehicleImport::query()->findOrFail($id)->stored_as))->toBeTrue();

    return [$test->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/'.$id.'/fertig'), VehicleImport::query()->findOrFail($id)];
}

it('ends a refused file\'s run at once, with its own reason, and keeps no part of the file (D-498)', function (string $bytes, string $name, string $reason): void {
    [$response, $import] = clientFinish($this, $bytes, $name);

    $response->assertStatus(422)->assertJsonPath('errors.file.0', $reason);

    expect($import->status)->toBe(VehicleImport::FAILED)
        ->and($import->error)->toBe($reason)
        ->and($import->stored_as)->toBeNull()
        ->and(array_values(array_filter(Storage::disk('local')->files(ImportUploadPath()), static fn (string $f): bool => str_starts_with(basename($f), $import->id.'.'))))->toBe([]);
})->with([
    'a picture named .csv' => ["\x89PNG\r\n\x1a\n".str_repeat("\0", 64), 'fahrzeuge.csv', 'Das ist keine Tabelle, sondern ein Bild oder eine andere Datei, die sich nicht als Text lesen lässt. Lad bitte die Fahrzeugliste als CSV- oder Excel-Datei hoch (.csv, .xlsx) oder das ZIP-Archiv des Datensatzes.'],
    'a PDF' => ["%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", 'liste.pdf', 'Das ist keine Tabelle, sondern ein Bild oder eine andere Datei, die sich nicht als Text lesen lässt. Lad bitte die Fahrzeugliste als CSV- oder Excel-Datei hoch (.csv, .xlsx) oder das ZIP-Archiv des Datensatzes.'],
    'his SQL dump' => ["-- MySQL dump\nCREATE TABLE `fahrzeuge` (id int);\n", 'pkwliste_demo.sql', 'Das ist eine SQL-Datei. SQL-Dateien lesen wir nicht. Nimm die Tabelle als CSV- oder Excel-Datei (.csv, .xlsx) – im Datensatz liegt sie im Ordner „CSV“ oder „XLSX“.'],
]);

/** Where ImportUpload keeps its parts, as the disk names it. */
function ImportUploadPath(): string
{
    return ImportUpload::directory();
}

it('still reads UTF-16 text, NUL bytes and all, as Excel\'s „Unicode-Text“ writes it', function (): void {
    $csv = clientCsv();
    $import = clientRun($this, "\xFF\xFE".mb_convert_encoding($csv, 'UTF-16LE', 'UTF-8'), 'unicode.txt');

    expect($import->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->lines()->where('status', 'refused')->count())->toBe(0);
});

it('says a cut-off line is cut off, and refuses a line with more filled cells than the header — never a value a column away (D-498)', function (): void {
    $lines = explode("\r\n", trim(clientCsv()));
    $cut = implode(',', array_slice(explode(',', $lines[1]), 0, 7));
    $over = $lines[2].',"überzählig"';
    $import = clientRun($this, implode("\r\n", [$lines[0], $cut, $over, $lines[3]])."\r\n", 'kaputt.csv');

    $reasons = $import->lines()->orderBy('line')->pluck('reason', 'line')->all();

    expect($reasons[2])->toStartWith('Die Zeile hat nur 7 von 46 Spalten – sie ist abgeschnitten, oder ein Anführungszeichen fehlt.')
        ->and($reasons[3])->toBe('Die Zeile hat 47 Spalten, die erste Zeile der Datei 46. Wahrscheinlich steht ein Komma oder Semikolon im Text ohne Anführungszeichen – die Werte stünden sonst unter der falschen Spalte.')
        ->and($reasons[4])->toBeNull();
});

it('reads a file whose lines all end in a delimiter: an empty cell after the last column is none', function (): void {
    $lines = explode("\r\n", trim(clientCsv()));
    $import = clientRun($this, implode("\r\n", array_map(static fn (string $l): string => $l.',', $lines))."\r\n", 'mit-komma.csv');

    expect($import->lines()->where('status', 'refused')->count())->toBe(0);
});

// D-502, the operator's answer of 21.11.2026: field K's national ABE number is kept on the car, information only.
it('keeps field K\'s national ABE number on the car, and no EG number is made of it', function (): void {
    $import = clientRun($this, clientCsv(), 'pkwliste.csv');
    clientApply($this, $import);

    $beta = Vehicle::query()->where('variant', 'like', 'Beta 1.6%')->firstOrFail();
    $alpha = Vehicle::query()->where('variant', 'Alpha Avant Quattro')->where('hsn', '1860')->orderBy('id')->firstOrFail();

    // Field K is kept as the file writes it (D-520); it matches no Gutachten, being no EG number in the EU form.
    expect($beta->abe_nummer_raw)->toBe('C640*')
        ->and($beta->eg_nummer_raw)->toBe('C640*')
        ->and(EgNumber::parse($beta->eg_nummer_norm))->toBeNull()
        ->and($alpha->abe_nummer_raw)->toBeNull()
        ->and($alpha->eg_nummer_raw)->toBe('e1*2001/116*0447*11');
});
