<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Vehicle;
use App\Models\VehicleImport;
use App\Services\Admin\Vehicles\Import\DatasetFile;
use App\Services\Admin\Vehicles\Import\ImportUpload;
use App\Services\Admin\Vehicles\Import\VehicleImportWork;
use App\Services\Admin\Vehicles\VehicleImporter;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;

/*
 * The client's request H (the operator's brief of 12.11.2026; D-462): a vehicle list of any size. No ceiling on the file —
 * it arrives in parts the host takes in one request each —, it is read as a stream and never whole, and the server reads,
 * checks and imports it in parts of its own, after the answer of each request that asks how far it is. The Probelauf,
 * its rows and the import in one transaction stay what they were (VehicleImportTest).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function largeAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * A vehicle list of `$rows` cars, each with a note column of `$pad` characters the importer does not read.
 */
function largeCsv(int $rows, int $pad = 0, string $prefix = 'L'): string
{
    $lines = ['HSN;TSN;Hersteller;Handelsname;Variante;Baubeginn;Achslast vorn kg;Achslast hinten kg;Höchstgeschwindigkeit km/h;Bemerkung'];

    for ($i = 0; $i < $rows; $i++) {
        $lines[] = sprintf('%04d;%s%02d;Lasttest;Modell %d;%s %06d;03.2015;1.050;1.120;210;%s', 9000 + intdiv($i, 3600), $prefix, $i % 3600 % 100, intdiv($i % 3600, 100), $prefix, $i, str_repeat('x', $pad));
    }

    return implode("\n", $lines)."\n";
}

/** Announces a file and sends it in parts of `$part` bytes; returns the run, not yet complete. */
function largeSend(object $test, string $bytes, int $part, string $name = 'gross.csv'): VehicleImport
{
    $id = (int) $test->actingAs(largeAdmin(), 'admin')
        ->postJson('/admin/fahrzeuge/import/hochladen', ['name' => $name, 'size' => strlen($bytes), 'quelle' => 'import_kba'])
        ->assertCreated()->json('id');

    for ($offset = 0; $offset < strlen($bytes); $offset += $part) {
        $test->actingAs(largeAdmin(), 'admin')
            ->post('/admin/fahrzeuge/import/'.$id.'/teil', ['offset' => $offset, 'part' => UploadedFile::fake()->createWithContent('teil', substr($bytes, $offset, $part))], ['Accept' => 'application/json'])
            ->assertOk();
    }

    return VehicleImport::query()->findOrFail($id);
}

/** The server's work on the run until it waits for a person: as many parts as it takes. */
function largeDrain(int $id, float $seconds = 600): VehicleImport
{
    for ($i = 0; $i < 10_000; $i++) {
        $import = VehicleImport::query()->findOrFail($id);

        if (! $import->working()) {
            return $import;
        }

        app(VehicleImportWork::class)->advance($id, $seconds);
    }

    throw new RuntimeException('The run never stopped working.');
}

it('takes a file beyond the old 5 MB and 5.000 rows, in parts no larger than one request, and imports every row of it', function (): void {
    $bytes = largeCsv(6_000, 900);
    expect(strlen($bytes))->toBeGreaterThan(5 * 1024 * 1024);

    $import = largeSend($this, $bytes, 256 * 1024);

    expect($import->status)->toBe(VehicleImport::UPLOADING)
        ->and(filesize(Storage::disk('local')->path((string) $import->stored_as)))->toBe(strlen($bytes));

    $this->actingAs(largeAdmin(), 'admin')->postJson('/admin/fahrzeuge/import/'.$import->id.'/fertig')->assertOk();
    $import = largeDrain($import->id);

    expect($import->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->file_sha256)->toBe(hash('sha256', $bytes))
        ->and($import->summary)->toMatchArray(['rows' => 6_000, VehicleImporter::CREATE => 6_000, VehicleImporter::REFUSED => 0])
        ->and($import->plan_hash)->toBe(VehicleImporter::fingerprint($import->planEntries()));

    $this->actingAs(largeAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => $import->plan_hash])->assertSessionHasNoErrors();
    $import = largeDrain($import->id);

    expect($import->status)->toBe(VehicleImport::APPLIED)
        ->and(Vehicle::query()->where('make', 'Lasttest')->count())->toBe(6_000)
        // Imported, the file itself is no longer kept: the rows say what each became.
        ->and(Storage::disk('local')->exists((string) $import->stored_as))->toBeFalse();
});

it('answers a part out of turn with what it holds, refuses more than was announced, and finishes only a whole file', function (): void {
    $bytes = largeCsv(40);
    $id = (int) $this->actingAs(largeAdmin(), 'admin')
        ->postJson('/admin/fahrzeuge/import/hochladen', ['name' => 'teile.csv', 'size' => strlen($bytes), 'quelle' => 'import_kba'])
        ->assertCreated()->assertJsonStructure(['id', 'part', 'held', 'href'])->json('id');
    $part = static fn (int $offset, string $content) => ['offset' => $offset, 'part' => UploadedFile::fake()->createWithContent('teil', $content)];
    $json = ['Accept' => 'application/json'];

    $this->post('/admin/fahrzeuge/import/'.$id.'/teil', $part(0, substr($bytes, 0, 1000)), $json)->assertOk()->assertExactJson(['held' => 1000]);
    // The same part again — its answer lost on the way —: the server says where the file stands, and nothing is written twice.
    $this->post('/admin/fahrzeuge/import/'.$id.'/teil', $part(0, substr($bytes, 0, 1000)), $json)->assertStatus(409)->assertExactJson(['held' => 1000]);
    $this->post('/admin/fahrzeuge/import/'.$id.'/teil', $part(5000, substr($bytes, 5000, 10)), $json)->assertStatus(409)->assertExactJson(['held' => 1000]);
    // Not yet whole: no Probelauf of half a file.
    $this->postJson('/admin/fahrzeuge/import/'.$id.'/fertig')->assertUnprocessable()
        ->assertJsonValidationErrors(['file' => 'Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.']);
    // More than the file was announced as: refused, and the file stays as it was.
    $this->post('/admin/fahrzeuge/import/'.$id.'/teil', $part(1000, substr($bytes, 1000).'zu viel'), $json)->assertUnprocessable()
        ->assertJsonValidationErrors(['file' => 'Es ist mehr angekommen, als die Datei groß ist. Lad sie bitte noch einmal hoch.']);

    $this->post('/admin/fahrzeuge/import/'.$id.'/teil', $part(1000, substr($bytes, 1000)), $json)->assertOk()->assertExactJson(['held' => strlen($bytes)]);
    $this->postJson('/admin/fahrzeuge/import/'.$id.'/fertig')->assertOk()->assertExactJson(['href' => '/admin/fahrzeuge/import/'.$id]);

    expect(VehicleImport::query()->findOrFail($id))->status->toBe(VehicleImport::PREVIEWED)
        ->and(VehicleImport::query()->findOrFail($id)->summary)->toMatchArray(['rows' => 40, VehicleImporter::CREATE => 40]);
});

it('lets only the person who announced a file send its parts and finish it, and only who may check a file announce one (R-11)', function (): void {
    $id = (int) $this->actingAs(largeAdmin(), 'admin')
        ->postJson('/admin/fahrzeuge/import/hochladen', ['name' => 'fremd.csv', 'size' => 10, 'quelle' => 'import_kba'])->assertCreated()->json('id');
    // The Gutachten role may check a file too — its own, not another person's upload.
    $other = largeAdmin('compliance-editor');

    $this->actingAs($other, 'admin')->post('/admin/fahrzeuge/import/'.$id.'/teil', ['offset' => 0, 'part' => UploadedFile::fake()->createWithContent('teil', '0123456789')], ['Accept' => 'application/json'])->assertForbidden();
    $this->actingAs($other, 'admin')->postJson('/admin/fahrzeuge/import/'.$id.'/fertig')->assertForbidden();
    $this->actingAs(largeAdmin('catalogue-manager'), 'admin')->postJson('/admin/fahrzeuge/import/hochladen', ['name' => 'x.csv', 'size' => 10, 'quelle' => 'import_kba'])->assertForbidden();

    expect(VehicleImport::query()->findOrFail($id)->bytes_done)->toBe(0);
});

it('decides a file read and checked in many small parts exactly as one read in one go', function (): void {
    // Rows that refuse themselves, a second row under one key, a car the shop has, and a dataset number used twice.
    Vehicle::factory()->create(['hsn' => '9000', 'tsn' => 'L05', 'variant' => 'L 000005', 'source' => 'import_kba', 'max_speed_kmh' => 190]);
    $bytes = largeCsv(1_200)
        ."9000;L01;Lasttest;Modell 0;L 000001;03.2015;1.050;1.120;210;doppelt\n"
        .";;Lasttest;Modell 0;ohne Schlüssel;03.2015;;;;\n"
        ."9001;ZZ1;Lasttest;Modell 0;ohne Baubeginn;;;;;\n";

    $whole = largeSend($this, $bytes, 1_000_000, 'ganz.csv');
    app(ImportUpload::class)->finish($whole);
    $whole = largeDrain($whole->id);

    $parts = largeSend($this, $bytes, 7_000, 'teile.csv');
    app(ImportUpload::class)->finish($parts);

    // No time at all for each part: every call does one batch and stops, until the run is decided.
    $calls = 0;

    while (VehicleImport::query()->findOrFail($parts->id)->working()) {
        app(VehicleImportWork::class)->advance($parts->id, 0.0);
        $calls++;
    }

    $parts->refresh();

    expect($calls)->toBeGreaterThan(5)
        ->and($parts->summary)->toBe($whole->summary)
        ->and($parts->plan_hash)->toBe($whole->plan_hash)
        ->and($parts->planEntries())->toBe($whole->planEntries())
        ->and($whole->summary)->toMatchArray([VehicleImporter::CREATE => 1_199, VehicleImporter::UPDATE => 1, VehicleImporter::REFUSED => 3, 'rows' => 1_203]);
});

it('reads a file as a stream: a file of 30 MB with memory for a few rows, not for the file', function (): void {
    $path = tempnam(sys_get_temp_dir(), 'veh');
    $out = fopen($path, 'wb');
    fwrite($out, "HSN;TSN;Hersteller;Handelsname;Variante;Baubeginn;Bemerkung\n");

    for ($i = 0; ftell($out) < 30 * 1024 * 1024; $i++) {
        fwrite($out, sprintf("0005;Z%02d;Testmarke;Modell;Variante %d;03.2015;%s\n", $i % 100, $i, str_repeat('ä', 200)));
    }

    fclose($out);
    gc_collect_cycles();
    memory_reset_peak_usage();
    $before = memory_get_usage();

    $reader = new DatasetFile(DatasetFile::prepare($path));
    $records = 0;

    foreach ($reader->records() as $cells) {
        $records++;
    }

    $grew = memory_get_peak_usage() - $before;
    @unlink($path);

    expect($records)->toBe($i + 1)
        ->and($grew)->toBeLessThan(8 * 1024 * 1024);
});

it('reads Windows-1252 text, a UTF-8 byte order mark and an Excel workbook as before, each row under its own line', function (): void {
    $dir = Storage::disk('local')->path(ImportUpload::directory().'-test');
    @mkdir($dir, 0775, true);

    // Windows-1252: one byte for ä; the whole file is that, as the old reader decided it.
    file_put_contents($dir.'/ansi.csv', mb_convert_encoding("HSN;TSN;Hersteller;Handelsname;Variante;Baubeginn\n0005;ZA1;Käfer;Modell;Größe;03.2015\n", 'Windows-1252', 'UTF-8'));
    $ansi = new DatasetFile(DatasetFile::prepare($dir.'/ansi.csv'));
    expect(iterator_to_array($ansi->records()))->toBe([1 => ['HSN', 'TSN', 'Hersteller', 'Handelsname', 'Variante', 'Baubeginn'], 2 => ['0005', 'ZA1', 'Käfer', 'Modell', 'Größe', '03.2015']]);

    // A byte order mark is no part of the first column's name; blank lines keep their place in the count.
    file_put_contents($dir.'/bom.csv', "\xEF\xBB\xBFHSN,TSN\n\n0005,ZA1\n");
    $bom = new DatasetFile(DatasetFile::prepare($dir.'/bom.csv'));
    expect(iterator_to_array($bom->records()))->toBe([1 => ['HSN', 'TSN'], 3 => ['0005', 'ZA1']]);

    // A workbook's first sheet, its numbers as a person types them, its rows by their own numbers.
    $writer = new XlsxWriter;
    $writer->openToFile($dir.'/mappe.xlsx');
    $writer->addRow(Row::fromValues(['HSN', 'TSN', 'Achslast vorn kg']));
    $writer->addRow(Row::fromValues(['0005', 'ZA1', 1050]));
    $writer->addRow(Row::fromValues(['0005', 'ZA2', 8.5]));
    $writer->close();

    $state = DatasetFile::prepare($dir.'/mappe.xlsx');
    $book = new DatasetFile($state);
    expect($state['format'])->toBe('xlsx')
        ->and(iterator_to_array($book->records()))->toBe([1 => ['HSN', 'TSN', 'Achslast vorn kg'], 2 => ['0005', 'ZA1', '1050'], 3 => ['0005', 'ZA2', '8,5']]);

    // Read from where a reading stopped: the state after a record starts at the next one.
    $first = new DatasetFile(DatasetFile::prepare($dir.'/bom.csv'));
    foreach ($first->records() as $cells) {
        break;
    }
    expect(iterator_to_array((new DatasetFile($first->state()))->records()))->toBe([3 => ['0005', 'ZA1']]);

    Storage::disk('local')->deleteDirectory(ImportUpload::directory().'-test');
});

it('imports all or nothing: an import stopped half-way leaves every car as it was and the Probelauf as it was shown', function (): void {
    // A car typed from a Gutachten the file fills — written through the merge, after every new car of the file.
    Vehicle::factory()->create([
        'hsn' => null, 'tsn' => null, 'make' => 'Lasttest', 'model' => 'Modell 0', 'variant' => 'T1', 'type_designation' => 'T1',
        'eg_nummer_raw' => 'e1*2007/46*0316*..', 'source' => 'gutachten', 'source_vehicle_id' => null,
        'source_document_id' => ApprovalDocument::factory()->create()->id, 'source_page' => 1,
        'axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null, 'needs_review' => true,
    ]);
    $bytes = "HSN;TSN;Hersteller;Handelsname;Variante;Fahrzeugtyp;EG-Nummer;Baubeginn;Achslast vorn kg;Achslast hinten kg;Höchstgeschwindigkeit km/h\n";

    for ($i = 0; $i < 1_100; $i++) {
        $bytes .= sprintf("9000;N%02d;Lasttest;Modell 0;Neu %d;;;03.2015;1.050;1.120;210\n", $i % 100, $i);
    }

    $bytes .= "9100;MG1;Lasttest;Modell 0;Ergänzt;T1;e1*2007/46*0316*12;03.2015;1.050;1.120;210\n";
    $import = largeSend($this, $bytes, 1_000_000);
    app(ImportUpload::class)->finish($import);
    $import = largeDrain($import->id);
    $shown = $import->planEntries();

    expect($import->summary)->toMatchArray([VehicleImporter::CREATE => 1_100, VehicleImporter::MERGE => 1]);

    // The merge is the last thing the import writes: it stops there — the database gone, a time limit —, after every
    // new car is in, in the same transaction (D-469).
    DB::listen(static function (QueryExecuted $query): void {
        if (preg_match('/^update [`"]?vehicles[`"]? /i', $query->sql) === 1) {
            throw new RuntimeException('Stopped half-way');
        }
    });

    $this->actingAs(largeAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => $import->plan_hash])->assertSessionHasNoErrors();
    $import = largeDrain($import->id);

    expect(Vehicle::query()->count())->toBe(1)
        ->and($import->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->error)->toBe('Der Import ist abgebrochen, bevor er fertig war. An den Fahrzeugen hat sich nichts geändert. Starte ihn bitte noch einmal.')
        ->and($import->planEntries())->toBe($shown)
        ->and($import->applied_at)->toBeNull();
});

it('keeps the import\'s work table the shape of the cars, and the cars\' fingerprint over every column of theirs (D-469)', function (): void {
    $shape = static fn (string $table): array => collect(Schema::getColumns($table))
        ->mapWithKeys(static fn (array $column): array => [$column['name'] => [$column['type'], $column['nullable'], $column['default']]])
        ->all();
    $cars = $shape('vehicles');

    // A column added to the cars and not to the work table — or not to the fingerprint — fails here, not in an import.
    expect(array_diff_key($shape(VehicleImporter::STAGE), array_flip(['vehicle_import_id', 'target_id', 'line'])))->toBe($cars)
        ->and([...VehicleImporter::FINGERPRINT_COLUMNS, 'raw'])->toEqualCanonicalizing(array_keys($cars));
});

it('imports in parts no host stops: no car written before the last, then every one in one transaction (D-469)', function (): void {
    $import = largeSend($this, largeCsv(1_200), 1_000_000);
    app(ImportUpload::class)->finish($import);
    $import = largeDrain($import->id);
    VehicleImport::query()->whereKey($import->id)->update(['status' => VehicleImport::APPLYING, 'applied_by' => largeAdmin()->id]);
    $work = app(VehicleImportWork::class);
    $prepared = [];

    // A part of no time at all still does one step: begun, the work table cleared, then a batch at a time.
    for ($part = 0; $part < 20 && $import->refresh()->status === VehicleImport::APPLYING; $part++) {
        expect(Vehicle::query()->count())->toBe(0);
        $prepared[] = DB::table(VehicleImporter::STAGE)->where('vehicle_import_id', $import->id)->count();
        $work->advance($import->id, 0.0);

        // The page says how far: asked here, not through the page, whose answer would give the server its next part.
        if (($import->refresh()->cursor['phase'] ?? null) === 'stage' && ($import->cursor['done'] ?? 0) === 500) {
            expect(VehicleImportWork::progress($import))->toBe(['step' => 'Fahrzeuge vorbereiten', 'done' => 500, 'total' => 1_200, 'unit' => 'rows']);
            $shown = true;
        }
    }

    expect($import->status)->toBe(VehicleImport::APPLIED)
        ->and($shown ?? false)->toBeTrue()
        ->and($prepared)->toBe([0, 0, 0, 500, 1_000, 1_200, 1_200])
        ->and(Vehicle::query()->where('make', 'Lasttest')->count())->toBe(1_200)
        // Written, what was prepared goes; the file's order is the cars' order.
        ->and(DB::table(VehicleImporter::STAGE)->count())->toBe(0)
        ->and(Vehicle::query()->orderBy('id')->value('variant'))->toBe('L 000000')
        ->and(DB::table('audit_logs')->where('description', 'vehicle.import_applied')->count())->toBe(1);
});

it('writes nothing when any car changed after its Probelauf began — one the file names or not, before the import or during it', function (): void {
    $import = largeSend($this, largeCsv(1_200), 1_000_000);
    app(ImportUpload::class)->finish($import);
    $import = largeDrain($import->id);
    $other = Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'ZA1', 'max_speed_kmh' => 210]);
    $fingerprint = $import->cars_fingerprint;

    // A car came after the Probelauf began, that the file does not name: the import does not begin.
    expect($fingerprint)->not->toBeNull();
    VehicleImport::query()->whereKey($import->id)->update(['status' => VehicleImport::APPLYING, 'applied_by' => largeAdmin()->id]);
    app(VehicleImportWork::class)->advance($import->id, 0.0);

    expect($import->refresh()->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->error)->toBe('Die Fahrzeuge haben sich seit dem Probelauf geändert. Wähl „Neu prüfen“, bevor du importierst.');

    // Begun against the cars as they were — then one changes while the cars are prepared: none is written, and what was
    // prepared goes.
    VehicleImport::query()->whereKey($import->id)->update(['status' => VehicleImport::APPLYING, 'applied_by' => largeAdmin()->id, 'error' => null, 'cars_fingerprint' => VehicleImporter::carsFingerprint()]);
    $work = app(VehicleImportWork::class);

    for ($part = 0; $part < 4; $part++) {
        $work->advance($import->id, 0.0);
    }

    expect($import->refresh()->cursor['phase'])->toBe('stage')
        ->and(DB::table(VehicleImporter::STAGE)->where('vehicle_import_id', $import->id)->count())->toBe(1_000);

    $other->update(['max_speed_kmh' => 220]);
    largeDrain($import->id);

    expect($import->refresh()->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->error)->toBe('Die Fahrzeuge haben sich seit dem Probelauf geändert. Wähl „Neu prüfen“, bevor du importierst.')
        ->and(Vehicle::query()->count())->toBe(1)
        ->and(DB::table(VehicleImporter::STAGE)->count())->toBe(0);
});

it('says how far the server is while it reads, and gives it its next part of the work with each answer', function (): void {
    $bytes = largeCsv(3_000);
    $import = largeSend($this, $bytes, 1_000_000);
    app(ImportUpload::class)->finish($import);
    // One batch only, as a part cut short would leave it.
    app(VehicleImportWork::class)->advance($import->id, 0.0);

    $answer = $this->actingAs(largeAdmin(), 'admin')->getJson('/admin/fahrzeuge/import/'.$import->id.'/stand')->assertOk();

    expect($answer->json('status'))->toBe(VehicleImport::READING)
        ->and($answer->json('progress.step'))->toBe('Datei lesen')
        ->and($answer->json('progress.done'))->toBeGreaterThan(0)
        ->and($answer->json('progress.done'))->toBeLessThan(strlen($bytes))
        ->and($answer->json('progress.total'))->toBe(strlen($bytes))
        ->and($answer->json('progress.text'))->toMatch('/^\d+,\d\x{00A0}MB von \d+,\d\x{00A0}MB gelesen$/u')
        // The answer was on its way first; then the server worked on: the Probelauf is done.
        ->and($import->refresh()->status)->toBe(VehicleImport::PREVIEWED);

    $this->actingAs(largeAdmin(), 'admin')->getJson('/admin/fahrzeuge/import/'.$import->id.'/stand')->assertOk()
        ->assertExactJson(['status' => VehicleImport::PREVIEWED, 'progress' => null, 'error' => null]);
});

it('goes on from the scheduler where the host runs one, a run at a time', function (): void {
    $import = largeSend($this, largeCsv(700), 1_000_000);
    app(ImportUpload::class)->finish($import);

    $this->artisan('fahrzeuge:import-weiter', ['--sekunden' => 60])->expectsOutput('#'.$import->id.' previewed')->assertSuccessful();

    expect($import->refresh()->summary)->toMatchArray(['rows' => 700, VehicleImporter::CREATE => 700]);
});

it('stops a file it cannot read with the reason, and leaves the cars alone', function (): void {
    $import = largeSend($this, "nur eine Zeile ohne Trenner\n", 1_000_000, 'leer.csv');
    app(ImportUpload::class)->finish($import);
    $import = largeDrain($import->id);

    expect($import->status)->toBe(VehicleImport::FAILED)
        ->and($import->error)->toBe('Unter der ersten Zeile steht nichts. Die Datei enthält keine Fahrzeuge.')
        ->and(Vehicle::query()->count())->toBe(0);

    $this->actingAs(largeAdmin(), 'admin')->get('/admin/fahrzeuge/import/'.$import->id)->assertOk()
        ->assertInertia(fn ($page) => $page->where('run.status', VehicleImport::FAILED)->where('run.error', 'Unter der ersten Zeile steht nichts. Die Datei enthält keine Fahrzeuge.')->where('can.apply', false));
});

it('takes over a run whose process went silent, and leaves one alone that is at work', function (): void {
    $import = largeSend($this, largeCsv(700), 1_000_000);
    app(ImportUpload::class)->finish($import);

    // A process holds the run's lock and beats: another leaves the run to it.
    $lock = Cache::lock('vehicle-import:'.$import->id, 900);
    expect($lock->get())->toBeTrue();
    VehicleImportWork::beat($import->id);
    app(VehicleImportWork::class)->advance($import->id, 60);

    expect($import->refresh()->status)->toBe(VehicleImport::READING);

    // Its heartbeat is two minutes old: it was stopped (a time limit, a restart), and its lock is never let go — taken over.
    Cache::store(config('rimify.vehicle_import.progress_store'))->put('vehicle-import-beat:'.$import->id, time() - VehicleImportWork::SILENT_SECONDS - 1, 3600);
    app(VehicleImportWork::class)->advance($import->id, 60);

    expect($import->refresh()->status)->toBe(VehicleImport::PREVIEWED)
        ->and($import->summary)->toMatchArray(['rows' => 700, VehicleImporter::CREATE => 700]);
});

it('gives an import up after three interruptions, writing nothing, with the reason', function (): void {
    $import = largeSend($this, largeCsv(10), 1_000_000);
    app(ImportUpload::class)->finish($import);
    $import = largeDrain($import->id);

    $this->actingAs(largeAdmin(), 'admin')->post('/admin/fahrzeuge/import/'.$import->id.'/importieren', ['plan' => $import->plan_hash])->assertSessionHasNoErrors();
    expect($import->refresh()->status)->toBe(VehicleImport::APPLIED);

    // A second file, its import begun three times by processes a host stopped before they were done.
    $again = largeSend($this, largeCsv(10, 0, 'M'), 1_000_000);
    app(ImportUpload::class)->finish($again);
    $again = largeDrain($again->id);
    VehicleImport::query()->whereKey($again->id)->update(['status' => VehicleImport::APPLYING, 'applied_by' => largeAdmin()->id, 'attempts' => 3]);

    app(VehicleImportWork::class)->advance($again->id);

    expect($again->refresh()->status)->toBe(VehicleImport::PREVIEWED)
        ->and($again->error)->toBe('Der Import wurde dreimal unterbrochen, bevor er fertig war. An den Fahrzeugen hat sich nichts geändert.')
        ->and(Vehicle::query()->where('variant', 'like', 'M %')->count())->toBe(0);
});

it('gives up a file whose parts stopped coming a day ago, and frees its place on the disk', function (): void {
    $bytes = largeCsv(50);
    $id = (int) $this->actingAs(largeAdmin(), 'admin')
        ->postJson('/admin/fahrzeuge/import/hochladen', ['name' => 'halb.csv', 'size' => strlen($bytes), 'quelle' => 'import_kba'])->assertCreated()->json('id');
    $this->post('/admin/fahrzeuge/import/'.$id.'/teil', ['offset' => 0, 'part' => UploadedFile::fake()->createWithContent('teil', substr($bytes, 0, 100))], ['Accept' => 'application/json'])->assertOk();
    $path = (string) VehicleImport::query()->findOrFail($id)->stored_as;

    $this->artisan('fahrzeuge:import-weiter')->assertSuccessful();
    expect(VehicleImport::query()->findOrFail($id)->status)->toBe(VehicleImport::UPLOADING);

    $this->travel(25)->hours();
    $this->artisan('fahrzeuge:import-weiter')->assertSuccessful();

    expect(VehicleImport::query()->findOrFail($id))->status->toBe(VehicleImport::FAILED)
        ->error->toBe('Das Hochladen dieser Datei wurde nicht abgeschlossen. Lad sie bitte noch einmal hoch.')
        ->and(Storage::disk('local')->exists($path))->toBeFalse();
});
