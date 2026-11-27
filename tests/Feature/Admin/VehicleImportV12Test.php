<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\VehicleImport;
use App\Services\Admin\Vehicles\Import\VehicleImportWork;
use App\Services\Admin\Vehicles\VehicleImporter;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Http\UploadedFile;

/*
 * The client's vehicle list v12 and his five points of 26.11.2026 (D-516 to D-520), in his own format with made-up
 * values — his file is third-party data and never in the repository:
 *
 *   - the build period's null rules, row by row as he wrote them; a month the file leaves empty stays unknown;
 *   - the dataset's own number is the key of a car: the same number is the same car — unchanged, or changed and shown
 *     from what to what —, and only a number that now names a clearly different car is refused (the error of his runs
 *     #35/#36: a spreadsheet had saved `002` as `2` and `040` as `40`);
 *   - HSN, TSN and even VSN repeat: every row with its own number is its own car;
 *   - field K is text.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

const V12_HEADER = ['id', 'hersteller_name', 'modell_name', 'fahrzeug_id', 'fahrzeug_name', 'fahrzeug_typ', 'fahrzeug_form', 'fahrzeug_eg_nummer', 'fahrzeug_antriebsachse', 'fahrzeug_achslast_va', 'fahrzeug_achslast_ha', 'fahrzeug_max_kmh', 'fahrzeug_kw', 'fahrzeug_prod_monat_von', 'fahrzeug_prod_monat_bis', 'fahrzeug_prod_jahr_von', 'fahrzeug_prod_jahr_bis', 'fahrzeug_hsn', 'fahrzeug_tsn', 'fahrzeug_vsn'];

/** @param  array<string, string|null>  $v */
function v12Row(int $number, array $v = []): string
{
    $row = [
        ...array_fill_keys(V12_HEADER, null),
        'id' => (string) $number, 'hersteller_name' => 'Prüfmarke', 'modell_name' => 'Kompakt', 'fahrzeug_id' => (string) $number,
        'fahrzeug_name' => 'Kompakt 1.6', 'fahrzeug_typ' => 'K1', 'fahrzeug_form' => 'Limousine', 'fahrzeug_eg_nummer' => 'e3*98/14*0070*',
        'fahrzeug_antriebsachse' => 'Frontantrieb', 'fahrzeug_achslast_va' => '980', 'fahrzeug_achslast_ha' => '980', 'fahrzeug_max_kmh' => '195',
        'fahrzeug_kw' => '88', 'fahrzeug_prod_monat_von' => '1', 'fahrzeug_prod_jahr_von' => '2001', 'fahrzeug_prod_monat_bis' => '11',
        'fahrzeug_prod_jahr_bis' => '2004', 'fahrzeug_hsn' => '9136', 'fahrzeug_tsn' => '439', 'fahrzeug_vsn' => '002',
        ...$v,
    ];

    return implode(',', array_map(static fn (?string $x): string => $x === null ? 'NULL' : '"'.str_replace('"', '""', $x).'"', $row));
}

/** @param  list<string>  $rows */
function v12Csv(array $rows): string
{
    return implode("\r\n", ['"'.implode('","', V12_HEADER).'"', ...$rows])."\r\n";
}

function v12Run(object $test, string $bytes): VehicleImport
{
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $id = (int) $test->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/hochladen', ['name' => 'pkwliste.csv', 'size' => strlen($bytes), 'quelle' => 'import_kba'])->assertCreated()->json('id');
    $test->actingAs($admin, 'admin')->post('/admin/fahrzeuge/import/'.$id.'/teil', ['offset' => 0, 'part' => UploadedFile::fake()->createWithContent('teil', $bytes)], ['Accept' => 'application/json'])->assertOk();
    $test->actingAs($admin, 'admin')->postJson('/admin/fahrzeuge/import/'.$id.'/fertig')->assertOk();

    return v12Drain($id);
}

function v12Apply(object $test, VehicleImport $import): VehicleImport
{
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $test->actingAs($admin, 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => $import->plan_hash])->assertSessionHasNoErrors();

    return v12Drain($import->id);
}

function v12Drain(int $id): VehicleImport
{
    for ($i = 0; $i < 1_000; $i++) {
        $import = VehicleImport::query()->findOrFail($id);

        if (! $import->working()) {
            return $import;
        }

        app(VehicleImportWork::class)->advance($id, 60);
    }

    throw new RuntimeException('The run never stopped working.');
}

/** @return array<string, array<string, mixed>> line → entry */
function v12Plan(VehicleImport $import): array
{
    return collect($import->planEntries())->keyBy('line')->all();
}

describe('the build period, as the client ruled it', function (): void {
    it('decides every combination of year and month, start and end, as his table says', function (?string $yFrom, ?string $mFrom, ?string $yTo, ?string $mTo, ?string $reason, ?array $stored, ?string $label): void {
        $import = v12Run($this, v12Csv([v12Row(91838, ['fahrzeug_prod_jahr_von' => $yFrom, 'fahrzeug_prod_monat_von' => $mFrom, 'fahrzeug_prod_jahr_bis' => $yTo, 'fahrzeug_prod_monat_bis' => $mTo])]));
        $entry = v12Plan($import)['2'];

        if ($reason !== null) {
            // Refused rows never stop the import: the run is decided, the row says why.
            expect($import->status)->toBe(VehicleImport::PREVIEWED)
                ->and($entry['status'])->toBe(VehicleImporter::REFUSED)
                ->and($entry['reason'])->toBe($reason);

            return;
        }

        expect($entry['status'])->toBe(VehicleImporter::CREATE);
        v12Apply($this, $import);
        $car = Vehicle::query()->where('source_vehicle_id', 91838)->sole();

        expect([$car->build_from_year, $car->build_from_month, $car->build_to_year, $car->build_to_month])->toBe($stored)
            ->and($car->periodLabel())->toBe($label);
    })->with([
        // Start: year and month.
        'start: neither' => [null, null, '2004', '11', 'Baubeginn ohne Jahr.', null, null],
        'start: month without year' => [null, '3', '2004', '11', 'Baubeginn ohne Jahr.', null, null],
        'start: year without month' => ['2001', null, '2004', '11', null, [2001, null, 2004, 11], "2001\u{00A0}– 11/2004"],
        'start: both' => ['2001', '1', '2004', '11', null, [2001, 1, 2004, 11], "01/2001\u{00A0}– 11/2004"],
        // End: year and month.
        'end: neither — still built' => ['2001', '1', null, null, null, [2001, 1, null, null], 'seit 01/2001'],
        'end: year without month' => ['2001', '1', '2004', null, null, [2001, 1, 2004, null], "01/2001\u{00A0}– 2004"],
        'end: month without year' => ['2001', '1', null, '11', 'Bauende ohne Jahr.', null, null],
        // Combinations.
        'no months at all' => ['2001', null, '2004', null, null, [2001, null, 2004, null], "2001\u{00A0}– 2004"],
        'still built, start month unknown' => ['2020', null, null, null, null, [2020, null, null, null], 'seit 2020'],
        'one year, months unknown — refused until 26.11.2026' => ['2004', null, '2004', null, null, [2004, null, 2004, null], "2004\u{00A0}– 2004"],
        'end year that does not read' => ['2001', '1', '20194', null, 'Das Bauende ist nicht lesbar: „20194“. Erwartet wird ein Jahr, etwa 2019, gern mit Monat – oder leer, wenn es noch gebaut wird.', null, null],
        'end certainly before start' => ['2005', null, '2004', null, 'Das Bauende liegt vor dem Baubeginn.', null, null],
        'end before start in one year, months known' => ['2004', '9', '2004', '3', 'Das Bauende liegt vor dem Baubeginn.', null, null],
    ]);

    it('keeps a month that does not read as unknown and says so — the row is not refused', function (): void {
        $import = v12Run($this, v12Csv([v12Row(91838, ['fahrzeug_prod_monat_von' => '13'])]));
        $entry = v12Plan($import)['2'];

        expect($entry['status'])->toBe(VehicleImporter::CREATE)
            ->and($entry['notes'])->toContain('Gebaut ab: Monat nicht lesbar: „13“ – der Monat bleibt unbekannt');
    });
});

describe('the dataset number is the key of a car', function (): void {
    it('reads his own file saved again by a spreadsheet — `002` as `2`, `040` as `40` — as the same car, unchanged', function (): void {
        v12Apply($this, v12Run($this, v12Csv([v12Row(91838), v12Row(91839, ['fahrzeug_tsn' => '040', 'fahrzeug_vsn' => '00005'])])));

        $again = v12Run($this, v12Csv([v12Row(91838, ['fahrzeug_vsn' => '2']), v12Row(91839, ['fahrzeug_tsn' => '40', 'fahrzeug_vsn' => '5'])]));

        expect($again->summary)->toMatchArray([VehicleImporter::UNCHANGED => 2, VehicleImporter::REFUSED => 0, VehicleImporter::CREATE => 0])
            ->and(Vehicle::query()->where('source_vehicle_id', 91838)->sole()->vsn)->toBe('002');
    });

    it('changes the car under its number where the file says otherwise, and shows from what to what', function (): void {
        v12Apply($this, v12Run($this, v12Csv([v12Row(91838)])));

        $import = v12Run($this, v12Csv([v12Row(91838, ['fahrzeug_name' => 'Kompakt 1.6 TS', 'fahrzeug_prod_monat_von' => null])]));
        $entry = v12Plan($import)['2'];

        expect($entry['status'])->toBe(VehicleImporter::UPDATE)
            ->and($entry['reason'])->toContain("Bauzeitraum: 01/2001\u{00A0}– 11/2004 → 2001\u{00A0}– 11/2004")
            ->and($entry['reason'])->toContain('Name: Kompakt 1.6 → Kompakt 1.6 TS');

        v12Apply($this, $import);

        expect(Vehicle::query()->where('source_vehicle_id', 91838)->sole())
            ->variant->toBe('Kompakt 1.6 TS')
            ->build_from_month->toBeNull();
    });

    it('refuses a number that now names another maker or other key numbers, with both versions', function (): void {
        v12Apply($this, v12Run($this, v12Csv([v12Row(91838)])));

        $import = v12Run($this, v12Csv([v12Row(91838, ['hersteller_name' => 'Fremdmarke', 'fahrzeug_hsn' => '0005', 'fahrzeug_tsn' => '582'])]));

        expect(v12Plan($import)['2']['status'])->toBe(VehicleImporter::REFUSED)
            ->and(v12Plan($import)['2']['reason'])->toBe('Die Nummer 91838 aus dem Datensatz gehört im Shop zu Prüfmarke Kompakt Kompakt 1.6 (HSN 9136 · TSN 439), in der Datei aber zu Fremdmarke Kompakt Kompakt 1.6 (HSN 0005 · TSN 582). Die Zeile wird nicht importiert. Prüf, ob die Datei aus demselben Datensatz stammt – ist es dieselbe Quelle, schreib uns.');
    });

    it('says where a released Gutachten names the car it changes — and orders keep what was sold', function (): void {
        v12Apply($this, v12Run($this, v12Csv([v12Row(91838)])));
        Fitment::factory()->create(['vehicle_id' => Vehicle::query()->where('source_vehicle_id', 91838)->value('id'), 'status' => 'published']);

        $import = v12Run($this, v12Csv([v12Row(91838, ['fahrzeug_kw' => '90'])]));

        expect(v12Plan($import)['2']['reason'])->toStartWith('Ein freigegebenes Gutachten nennt dieses Fahrzeug – seine Antworten folgen der Änderung.')
            ->and(v12Plan($import)['2']['reason'])->toContain('Leistung in kW: 88 → 90');
    });
});

describe('every car with its own number is its own car', function (): void {
    it('imports two rows of one HSN, TSN and VSN as two cars when their numbers differ', function (): void {
        $import = v12Run($this, v12Csv([
            v12Row(25001, ['fahrzeug_name' => 'Giulia 2.9 V6', 'fahrzeug_hsn' => '1742', 'fahrzeug_tsn' => 'AAZ', 'fahrzeug_vsn' => '00001', 'fahrzeug_prod_jahr_von' => '2016', 'fahrzeug_prod_jahr_bis' => '2023']),
            v12Row(25002, ['fahrzeug_name' => 'Giulia 2.9 V6', 'fahrzeug_hsn' => '1742', 'fahrzeug_tsn' => 'AAZ', 'fahrzeug_vsn' => '00001', 'fahrzeug_prod_jahr_von' => '2016', 'fahrzeug_prod_jahr_bis' => null, 'fahrzeug_prod_monat_bis' => null]),
        ]));

        expect($import->summary)->toMatchArray([VehicleImporter::CREATE => 2, VehicleImporter::REFUSED => 0]);
        v12Apply($this, $import);

        expect(Vehicle::query()->where('hsn', '1742')->where('tsn', 'AAZ')->pluck('source_vehicle_id')->sort()->values()->all())->toBe([25001, 25002]);
    });

    it('refuses the same number twice in one file, naming the earlier line', function (): void {
        $import = v12Run($this, v12Csv([v12Row(91838), v12Row(91838, ['fahrzeug_vsn' => '003'])]));

        expect(v12Plan($import)['3']['reason'])->toBe('Die Nummer 91838 aus dem Datensatz steht zweimal in der Datei, auch in Zeile 2.');
    });
});

it('keeps field K as the file writes it — an old national number too — and refuses no row for it', function (): void {
    $import = v12Run($this, v12Csv([v12Row(91838, ['fahrzeug_eg_nummer' => 'G731*'])]));

    expect(v12Plan($import)['2']['status'])->toBe(VehicleImporter::CREATE);
    v12Apply($this, $import);

    expect(Vehicle::query()->where('source_vehicle_id', 91838)->sole())
        ->eg_nummer_raw->toBe('G731*')
        ->abe_nummer_raw->toBe('G731*')
        ->body_form_raw->toBe('Limousine');
});
