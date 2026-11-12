<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

/*
 * A vehicle dataset of any size (the operator's brief of 12.11.2026, item H; D-462). The file no longer travels as one
 * request and no longer lives in one JSON cell: it arrives in parts, stays on the private disk while the run needs it,
 * and its rows — the contract fields as typed, and what the Probelauf decided for each — are rows of their own. The run
 * itself carries where its work stands, so a Probelauf or an import interrupted by a time limit goes on where it stopped.
 *
 * The runs made before keep everything they showed: their plan moves row by row into `vehicle_import_rows`, and back
 * on rollback. They were read in one go and kept no file, so they cannot be checked again — a Probelauf among them asks
 * for the file once more (VehicleImport::expired()).
 */
return new class extends Migration
{
    private const FIELDS = [
        'hsn', 'tsn', 'hersteller', 'handelsname', 'variante', 'fahrzeugtyp', 'eg_nummer', 'leistung_kw', 'baubeginn', 'bauende',
        'karosserie', 'antrieb', 'achslast_vorn_kg', 'achslast_hinten_kg', 'hoechstgeschwindigkeit_kmh', 'gesamtmasse_kg', 'fahrzeug_id',
    ];

    public function up(): void
    {
        Schema::create('vehicle_import_rows', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('vehicle_import_id')->constrained('vehicle_imports')->cascadeOnDelete();
            $t->unsignedInteger('line')->comment('the row as a spreadsheet numbers it');
            $t->json('cells')->nullable()->comment('the contract fields as typed, in VehicleImportRow::CELLS order');
            $t->string('status', 10)->comment('create | update | unchanged | merge | kept | refused — pending, open or matched while the Probelauf runs');
            $t->boolean('read_refused')->default(false)->comment('refused by the row itself or as a second row with its key: no car changes that');
            $t->unsignedBigInteger('vehicle_id')->nullable()->comment('the car the row is about — no key: a car is never deleted (R-04)');
            $t->string('label', 500)->default('');
            $t->string('keys', 32)->nullable()->comment('HSN and TSN as the page shows them');
            $t->json('changes')->nullable()->comment('the columns an update changes or a merge fills');
            $t->json('notes')->nullable()->comment('the figures the row gave and the import could not read');
            $t->json('fills')->nullable()->comment('a merge’s values while the Probelauf runs');
            $t->string('reason', 1000)->nullable();
            $t->char('dup_key', 40)->charset('ascii')->collation('ascii_bin')->nullable()->comment('HSN, TSN and variant as the file names them, hashed');
            $t->unsignedInteger('number')->nullable()->comment('the dataset’s own number of the car');

            $t->unique(['vehicle_import_id', 'line'], 'uq_vehicle_import_row_line');
            $t->index(['vehicle_import_id', 'status', 'line'], 'idx_vehicle_import_row_status');
            $t->index(['vehicle_import_id', 'dup_key'], 'idx_vehicle_import_row_dup');
            $t->index(['vehicle_import_id', 'number'], 'idx_vehicle_import_row_number');
            $t->index(['vehicle_import_id', 'vehicle_id'], 'idx_vehicle_import_row_vehicle');
        });

        Schema::table('vehicle_imports', function (Blueprint $t): void {
            $t->string('file_format', 8)->nullable()->comment('csv | xlsx — known once the file is complete')->change();
            $t->char('file_sha256', 64)->nullable()->change();
            $t->json('file')->nullable()->comment('the headers of the file')->change();
            $t->json('mapping')->nullable()->change();
            $t->json('summary')->nullable()->change();
            $t->string('status', 16)->default('previewed')->comment('uploading | reading | checking | previewed | applying | applied | failed')->change();
            $t->unsignedBigInteger('bytes_total')->nullable()->after('file_sha256')->comment('the file’s size as announced');
            $t->unsignedBigInteger('bytes_done')->default(0)->after('bytes_total')->comment('received while uploading, read while reading');
            $t->unsignedInteger('rows_total')->nullable()->after('bytes_done');
            $t->unsignedInteger('rows_done')->default(0)->after('rows_total');
            $t->string('stored_as', 255)->nullable()->after('rows_done')->comment('the file on the private disk while the run may read it');
            $t->json('cursor')->nullable()->after('stored_as')->comment('where the work stands');
            $t->json('examples')->nullable()->after('mapping')->comment('the first value of each column');
            $t->json('checks')->nullable()->after('examples')->comment('what reads but cannot be (D-318)');
            $t->char('plan_hash', 64)->nullable()->after('summary')->comment('the Probelauf as it reads (VehicleImporter::fingerprint)');
            $t->string('error', 1000)->nullable()->after('plan_hash');
            $t->unsignedTinyInteger('attempts')->default(0)->after('error');
        });

        foreach (DB::table('vehicle_imports')->orderBy('id')->get(['id', 'status', 'file', 'rows', 'plan']) as $run) {
            $rows = json_decode((string) $run->rows, true) ?: [];
            $plan = json_decode((string) $run->plan, true) ?: [];
            $file = json_decode((string) $run->file, true) ?: [];
            $out = [];

            foreach ($rows as $n => $row) {
                $entry = $plan[$n] ?? null;
                $out[] = [
                    'vehicle_import_id' => $run->id,
                    'line' => (int) ($entry['line'] ?? $row['_line'] ?? $n + 2),
                    'cells' => json_encode(array_map(static fn (string $field): string => (string) ($row[$field] ?? ''), self::FIELDS)),
                    // A run whose columns were not all mapped has rows and no plan: they wait, as they did.
                    'status' => $entry['status'] ?? 'pending',
                    'read_refused' => ($entry['status'] ?? null) === 'refused',
                    'vehicle_id' => $entry['vehicle'] ?? null,
                    'label' => mb_substr((string) ($entry['label'] ?? ''), 0, 500),
                    'keys' => $entry['keys'] ?? null,
                    'changes' => ($entry['changes'] ?? []) === [] ? null : json_encode($entry['changes']),
                    'notes' => ($entry['notes'] ?? []) === [] ? null : json_encode($entry['notes']),
                    'reason' => $entry['reason'] ?? null,
                ];
            }

            foreach (array_chunk($out, 500) as $chunk) {
                DB::table('vehicle_import_rows')->insert($chunk);
            }

            DB::table('vehicle_imports')->where('id', $run->id)->update([
                'file' => json_encode(['headers' => $file['headers'] ?? []]),
                'rows_total' => count($rows),
                'rows_done' => count($rows),
            ]);
        }

        Schema::table('vehicle_imports', function (Blueprint $t): void {
            $t->dropColumn(['rows', 'plan']);
        });
    }

    public function down(): void
    {
        Schema::table('vehicle_imports', function (Blueprint $t): void {
            $t->json('rows')->nullable()->after('mapping');
            $t->json('plan')->nullable()->after('rows');
        });

        // A run that never finished — a file half uploaded, a Probelauf still reading — has nothing the old table can
        // show: it goes, with its rows and its file.
        foreach (DB::table('vehicle_imports')->whereNotIn('status', ['previewed', 'applied'])->pluck('stored_as', 'id') as $id => $stored) {
            DB::table('vehicle_imports')->where('id', $id)->delete();

            if (is_string($stored) && $stored !== '') {
                Storage::disk('local')->delete([$stored, $stored.'.utf8', $stored.'.csv']);
            }
        }

        foreach (DB::table('vehicle_imports')->orderBy('id')->get(['id', 'file']) as $run) {
            $rows = [];
            $plan = [];
            $file = json_decode((string) $run->file, true) ?: [];

            foreach (DB::table('vehicle_import_rows')->where('vehicle_import_id', $run->id)->orderBy('line')->cursor() as $row) {
                $cells = json_decode((string) $row->cells, true) ?: [];
                $rows[] = ['_line' => (string) $row->line, ...array_combine(self::FIELDS, array_pad(array_slice($cells, 0, count(self::FIELDS)), count(self::FIELDS), ''))];
                $plan[] = [
                    'line' => (string) $row->line,
                    'label' => (string) $row->label,
                    'keys' => $row->keys,
                    'status' => $row->status,
                    'vehicle' => $row->vehicle_id === null ? null : (int) $row->vehicle_id,
                    'changes' => json_decode((string) ($row->changes ?? '[]'), true) ?: [],
                    'notes' => json_decode((string) ($row->notes ?? '[]'), true) ?: [],
                    'reason' => $row->reason,
                ];
            }

            DB::table('vehicle_imports')->where('id', $run->id)->update([
                'file' => json_encode(['headers' => $file['headers'] ?? [], 'rows' => []]),
                'rows' => json_encode($rows),
                'plan' => json_encode(array_values(array_filter($plan, static fn (array $e): bool => in_array($e['status'], ['create', 'update', 'unchanged', 'merge', 'kept', 'refused'], true)))),
                'mapping' => DB::raw('COALESCE(mapping, JSON_OBJECT())'),
                'summary' => DB::raw('COALESCE(summary, JSON_OBJECT())'),
                'file_format' => DB::raw("COALESCE(file_format, 'csv')"),
                'file_sha256' => DB::raw("COALESCE(file_sha256, REPEAT('0', 64))"),
            ]);
        }

        Schema::dropIfExists('vehicle_import_rows');

        Schema::table('vehicle_imports', function (Blueprint $t): void {
            $t->dropColumn(['bytes_total', 'bytes_done', 'rows_total', 'rows_done', 'stored_as', 'cursor', 'examples', 'checks', 'plan_hash', 'error', 'attempts']);
        });

        Schema::table('vehicle_imports', function (Blueprint $t): void {
            $t->string('file_format', 8)->nullable(false)->comment('csv | xlsx')->change();
            $t->char('file_sha256', 64)->nullable(false)->change();
            $t->json('file')->nullable(false)->comment('the headers and the cells as read')->change();
            $t->json('mapping')->nullable(false)->change();
            $t->json('rows')->nullable(false)->comment('the rows after mapping, the contract fields as typed')->change();
            $t->json('plan')->nullable(false)->comment('per row: create | update | unchanged | merge | kept | refused, and why')->change();
            $t->json('summary')->nullable(false)->change();
            $t->string('status', 16)->default('previewed')->comment('previewed | applied')->change();
        });
    }
};
