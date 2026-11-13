<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\VehicleImportRequest;
use App\Models\VehicleImport;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\ListExport;
use App\Services\Admin\Vehicles\Import\ImportUpload;
use App\Services\Admin\Vehicles\Import\PartOutOfTurn;
use App\Services\Admin\Vehicles\Import\VehicleImportWork;
use App\Services\Admin\Vehicles\VehicleImporter;
use App\Support\GermanFormat;
use App\Support\ScheduleBeat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Fahrzeuge › Import (his admin item 2, D-297): a vehicle dataset into the shop in four steps — the file and where it
 * comes from, its columns, the Probelauf, the import (VehicleImporter). Nothing is written to a car before the import,
 * and the import writes exactly the Probelauf on screen.
 *
 * A file of any size (D-462): it arrives in parts (ImportUpload), and the server reads, checks and imports it on its
 * own (VehicleImportWork) — after the response of each request that asks how far it is, and from the scheduler where
 * the host runs one. The run's page shows how far it is and reloads itself when a step is done.
 */
class FahrzeugImportController extends Controller
{
    /** The rows of one Probelauf the page lists; the counts above them are always the whole file's. */
    public const SHOWN_ROWS = 500;

    public const REMAPPED = 'Die Datei wird mit der neuen Zuordnung geprüft.';

    public const APPLYING = 'Der Import läuft.';

    /** A run that stopped, or a file not yet whole: told so when asked to check again or to import (D-462). */
    private const STOPPED = 'Dieser Probelauf ist abgebrochen. Lad die Datei bitte noch einmal hoch.';

    private const INCOMPLETE = 'Die Datei ist noch nicht vollständig hochgeladen.';

    /** What the page lists first: refused rows, then what changes, then what stays. */
    private const LISTED = [VehicleImporter::REFUSED, VehicleImporter::CREATE, VehicleImporter::UPDATE, VehicleImporter::MERGE, VehicleImporter::KEPT, VehicleImporter::UNCHANGED];

    public function index(VehicleImportRequest $request): Response
    {
        return Inertia::render('Admin/Fahrzeuge/Import', [
            'sources' => array_map(static fn (string $value, string $label): array => ['value' => $value, 'label' => $label], array_keys(VehicleImporter::SOURCES), VehicleImporter::SOURCES),
            'fields' => self::fields(),
            'imports' => VehicleImport::query()->with(['admin:id,name', 'applier:id,name'])->latest('id')->limit(20)
                ->get(['id', 'admin_user_id', 'applied_by', 'file_name', 'file_format', 'source', 'status', 'summary', 'applied_at', 'created_at', 'stored_as', 'updated_at'])
                ->map(static fn (VehicleImport $i): array => self::summaryRow($i))->values()->all(),
            'total' => VehicleImport::query()->count(),
            'can' => ['preview' => $request->admin()->canQuietly('preview', VehicleImport::class)],
        ]);
    }

    /** A file announced: its name, its size and where it comes from. The parts follow (part()). */
    public function start(VehicleImportRequest $request, ImportUpload $upload): JsonResponse
    {
        $import = $upload->start($request->admin(), (string) $request->validated('name'), (int) $request->validated('size'), $request->source());

        return response()->json([
            'id' => $import->id,
            'part' => ImportUpload::partBytes(),
            'held' => 0,
            'href' => '/admin/fahrzeuge/import/'.$import->id,
        ], 201);
    }

    /** One part of the file. Out of turn, the answer says where the file stands, and the browser goes on from there. */
    public function part(VehicleImportRequest $request, VehicleImport $import, ImportUpload $upload): JsonResponse
    {
        $part = $request->file('part');

        if (! $part instanceof UploadedFile) {
            throw ValidationException::withMessages(['file' => 'Ein Teil der Datei ist nicht angekommen. Lad die Datei bitte noch einmal hoch.']);
        }

        try {
            $held = $upload->append($import, (int) $request->validated('offset'), $part);
        } catch (PartOutOfTurn $gap) {
            return response()->json(['held' => $gap->held], 409);
        }

        return response()->json(['held' => $held]);
    }

    /** The whole file is there: the Probelauf begins on the server, and the browser goes to the run's page. */
    public function finish(VehicleImportRequest $request, VehicleImport $import, ImportUpload $upload): JsonResponse
    {
        $import = $upload->finish($import);
        self::workAfterResponse($import);

        return response()->json(['href' => '/admin/fahrzeuge/import/'.$import->id]);
    }

    public function show(VehicleImportRequest $request, VehicleImport $import): Response
    {
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, $import->file_name);
        $admin = $request->admin();
        $headers = $import->headers();
        $mapping = (array) ($import->mapping ?? []);
        $summary = (array) ($import->summary ?? []);
        $decided = in_array($import->status, [VehicleImport::PREVIEWED, VehicleImport::APPLYING, VehicleImport::APPLIED], true) && $summary !== [];
        [$rows, $listed] = $decided ? self::listed($import) : [[], 0];
        $usable = ! $import->expired() && $import->stored_as !== null && Storage::disk('local')->exists($import->stored_as);

        if ($import->working()) {
            self::workAfterResponse($import);
        }

        return Inertia::render('Admin/Fahrzeuge/ImportRun', [
            'run' => self::summaryRow($import->loadMissing(['admin:id,name', 'applier:id,name'])) + [
                'rowCount' => (int) ($import->rows_total ?? 0),
                'appliedAt' => GermanFormat::dateTime($import->applied_at),
                'error' => $import->error,
                'expired' => $import->expired(),
                'size' => $import->bytes_total === null ? null : GermanFormat::megabytes((int) $import->bytes_total),
            ],
            'progress' => self::progress($import),
            'poll' => '/admin/fahrzeuge/import/'.$import->id.'/stand',
            // Whether the server goes on with the page closed: only where the host's scheduler runs (ScheduleBeat).
            'unattended' => (ScheduleBeat::secondsAgo() ?? PHP_INT_MAX) <= 180,
            'fields' => self::fields(),
            'headers' => $headers,
            'examples' => (object) ($import->examples ?? []),
            'mapping' => (object) $mapping,
            'missing' => in_array($import->status, [VehicleImport::PREVIEWED, VehicleImport::APPLIED], true) ? VehicleImporter::missing($mapping, $headers) : [],
            // What the file lacks, as counts and shares of its rows: the figures he decides a purchase on (D-317).
            'gaps' => VehicleImporter::gaps($summary, $mapping, $headers),
            // Read, but not as what the field can be: most often a column mapped to the wrong column (D-318).
            'implausible' => $import->checks ?? [],
            'rows' => $rows,
            'hiddenRows' => max(0, $listed - count($rows)),
            // Sent back with „Importieren“: the import applies this Probelauf, not one another tab has checked since.
            'planHash' => (string) ($import->plan_hash ?? ''),
            'can' => [
                'remap' => $import->status === VehicleImport::PREVIEWED && $usable && $admin->canQuietly('preview', VehicleImport::class),
                'apply' => $import->status === VehicleImport::PREVIEWED && $usable && $import->plan_hash !== null && $admin->canQuietly('apply', $import),
            ],
        ]);
    }

    /** How far the server is with the run — and, after the answer, a part more of the work. */
    public function status(VehicleImportRequest $request, VehicleImport $import): JsonResponse
    {
        if ($import->working()) {
            self::workAfterResponse($import);
        }

        return response()->json(['status' => $import->status, 'progress' => self::progress($import), 'error' => $import->error]);
    }

    /** The same file under another mapping, read and checked again — only while it is a Probelauf, asked under its lock. */
    public function remap(VehicleImportRequest $request, VehicleImport $import): RedirectResponse
    {
        $mapping = $request->mapping();

        $import = DB::transaction(static function () use ($import, $mapping): VehicleImport {
            $import = VehicleImport::query()->lockForUpdate()->findOrFail($import->id);

            if ($import->status !== VehicleImport::PREVIEWED) {
                throw ValidationException::withMessages(['import' => match ($import->status) {
                    VehicleImport::APPLIED => 'Diese Datei ist schon importiert. Die Zuordnung bleibt, wie sie war.',
                    VehicleImport::APPLYING => 'Der Import läuft gerade. Die Zuordnung bleibt, wie sie war.',
                    VehicleImport::FAILED => self::STOPPED,
                    VehicleImport::UPLOADING => self::INCOMPLETE,
                    default => 'Die Datei wird gerade geprüft. Warte bitte, bis der Probelauf fertig ist.',
                }]);
            }

            if ($import->expired() || $import->stored_as === null || ! Storage::disk('local')->exists($import->stored_as)) {
                throw ValidationException::withMessages(['import' => 'Die Datei dieses Probelaufs liegt nicht mehr auf dem Server. Lad sie bitte noch einmal hoch.']);
            }

            $import->forceFill(['mapping' => $mapping, 'status' => VehicleImport::READING, 'cursor' => null, 'summary' => [], 'plan_hash' => null, 'checks' => null, 'error' => null, 'attempts' => 0])->save();

            return $import;
        });

        self::workAfterResponse($import);

        return back()->with('toast', self::REMAPPED);
    }

    /**
     * The import asked for: checked under the run's lock — a second click, or a second tab, finds it running or done —,
     * against the Probelauf the page showed, then done by the server in one transaction (VehicleImportWork).
     */
    public function apply(VehicleImportRequest $request, VehicleImport $import): RedirectResponse
    {
        $shown = $request->shownPlan();
        $admin = $request->admin();

        $import = DB::transaction(static function () use ($import, $shown, $admin): VehicleImport {
            $import = VehicleImport::query()->lockForUpdate()->findOrFail($import->id);

            throw_if($import->status === VehicleImport::APPLIED, ValidationException::withMessages(['import' => 'Diese Datei ist schon importiert.']));
            throw_if($import->status === VehicleImport::APPLYING, ValidationException::withMessages(['import' => 'Der Import dieser Datei läuft schon.']));
            throw_if($import->status === VehicleImport::FAILED, ValidationException::withMessages(['import' => self::STOPPED]));
            throw_if($import->status === VehicleImport::UPLOADING, ValidationException::withMessages(['import' => self::INCOMPLETE]));
            throw_if($import->status !== VehicleImport::PREVIEWED, ValidationException::withMessages(['import' => 'Der Probelauf ist noch nicht fertig.']));
            throw_if($import->expired(), ValidationException::withMessages(['import' => 'Die Datei dieses Probelaufs liegt nicht mehr auf dem Server. Lad sie bitte noch einmal hoch.']));
            throw_if(VehicleImporter::missing((array) $import->mapping, $import->headers()) !== [], ValidationException::withMessages(['import' => 'Ordne zuerst jedem Pflichtfeld eine Spalte zu und wähl „Neu prüfen“.']));
            throw_if($import->plan_hash === null || ($shown !== null && ! hash_equals($import->plan_hash, $shown)), ValidationException::withMessages(['import' => 'Der Probelauf wurde geändert, seit du diese Seite geöffnet hast. Lad die Seite neu und prüf ihn, bevor du importierst.']));

            $summary = (array) $import->summary;
            throw_if(((int) ($summary[VehicleImporter::CREATE] ?? 0)) + ((int) ($summary[VehicleImporter::UPDATE] ?? 0)) + ((int) ($summary[VehicleImporter::MERGE] ?? 0)) === 0, ValidationException::withMessages(['import' => 'Der Probelauf hat nichts zu importieren gefunden.']));

            $import->forceFill(['status' => VehicleImport::APPLYING, 'applied_by' => $admin->id, 'error' => null, 'attempts' => 0])->save();

            return $import;
        });

        self::workAfterResponse($import);

        return back()->with('toast', self::APPLYING);
    }

    /**
     * A file to start from: every column the importer knows, named the way it finds them, and two rows that show how a
     * value is written. The cars are plainly examples, never real ones.
     */
    public function sample(VehicleImportRequest $request): StreamedResponse
    {
        $header = ['HSN', 'TSN', 'Hersteller', 'Handelsname', 'Variante', 'Fahrzeugtyp', 'EG-Nummer', 'Leistung kW', 'Baubeginn', 'Bauende', 'Karosserie', 'Antrieb', 'Achslast vorn kg', 'Achslast hinten kg', 'Höchstgeschwindigkeit km/h'];
        $rows = [
            ['0000', 'AAA', 'Beispielmarke', 'Muster', '1.6 Limousine', 'BM1', 'e1*2007/46*0001*00', '85', '03.2015', '12.2019', 'Limousine', 'Vorderachse', '960', '900', '195'],
            ['0000', 'AAB', 'Beispielmarke', 'Muster', '2.0 Kombi', 'BM1', 'e1*2007/46*0001*01', '110', '06.2016', '', 'Kombi', 'Allrad', '1.050', '1.120', '225'],
        ];

        return ListExport::download('fahrzeuge-import-beispiel', 'csv', $header, $rows);
    }

    /** A part of the server's work on the run, once the answer is on its way (VehicleImportWork). */
    private static function workAfterResponse(VehicleImport $import): void
    {
        $id = (int) $import->id;

        app()->terminating(static function () use ($id): void {
            app(VehicleImportWork::class)->advance($id);
        });
    }

    /**
     * How far the server is, in the page's words.
     *
     * @return array{step: string, done: int, total: int, percent: int, text: string}|null
     */
    private static function progress(VehicleImport $import): ?array
    {
        $progress = VehicleImportWork::progress($import);

        if ($progress === null) {
            return null;
        }

        $total = max(0, (int) $progress['total']);
        $done = min($total, max(0, (int) $progress['done']));
        $text = match (true) {
            $total === 0 => 'Wird vorbereitet …',
            $progress['unit'] === 'bytes' => GermanFormat::megabytes($done).' von '.GermanFormat::megabytes($total).' gelesen',
            default => GermanFormat::integer($done).' von '.GermanFormat::integer($total).' Zeilen',
        };

        return [
            'step' => (string) $progress['step'],
            'done' => $done,
            'total' => $total,
            'percent' => $total === 0 ? 0 : (int) floor($done / $total * 100),
            'text' => $text,
        ];
    }

    /**
     * The rows the page lists, in its order — refused first, then what changes, then what stays —, read a status at a
     * time so a file of half a million rows is never sorted whole; and how many there are to list in all.
     *
     * @return array{0: list<array<string, mixed>>, 1: int}
     */
    private static function listed(VehicleImport $import): array
    {
        $rows = [];

        foreach (self::LISTED as $status) {
            $left = self::SHOWN_ROWS - count($rows);

            if ($left <= 0) {
                break;
            }

            $query = $import->lines()->where('status', $status)->orderBy('line')->limit($left);

            // An unchanged row is listed only where it gave a figure the import could not read.
            if ($status === VehicleImporter::UNCHANGED) {
                $query->whereNotNull('notes');
            }

            foreach ($query->get() as $row) {
                $rows[] = $row->entry();
            }
        }

        $listed = $import->lines()->where('status', '!=', VehicleImporter::UNCHANGED)->count()
            + $import->lines()->where('status', VehicleImporter::UNCHANGED)->whereNotNull('notes')->count();

        return [$rows, $listed];
    }

    /** @return list<array{key: string, label: string, required: bool, hint: string|null}> */
    private static function fields(): array
    {
        $fields = [];

        foreach (VehicleImporter::FIELDS as $key => $spec) {
            $fields[] = ['key' => $key, 'label' => $spec['label'], 'required' => $spec['required'], 'hint' => $spec['hint'] ?? null];
        }

        return $fields;
    }

    /** @return array<string, mixed> */
    private static function summaryRow(VehicleImport $import): array
    {
        return [
            'id' => (int) $import->id,
            'file' => $import->file_name,
            'source' => VehicleImporter::SOURCES[$import->source] ?? $import->source,
            'format' => match ($import->file_format) {
                'xlsx' => 'Excel',
                'csv' => 'CSV',
                default => '–',
            },
            'status' => $import->status,
            'statusLabel' => self::statusLabel($import),
            'summary' => (object) ($import->summary ?? []),
            // An imported run is named by its import: when, and by whom — the Probelauf's author otherwise.
            'by' => $import->status === VehicleImport::APPLIED ? ($import->applier->name ?? $import->admin?->name) : $import->admin?->name,
            'at' => GermanFormat::dateTime($import->applied_at ?? $import->created_at),
            'href' => '/admin/fahrzeuge/import/'.$import->id,
        ];
    }

    private static function statusLabel(VehicleImport $import): string
    {
        return match ($import->status) {
            // A file whose parts stopped coming an hour ago is not still on its way.
            VehicleImport::UPLOADING => $import->updated_at !== null && $import->updated_at->lt(now()->subHour()) ? 'Hochladen abgebrochen' : 'Wird hochgeladen',
            VehicleImport::READING => 'Datei wird gelesen',
            VehicleImport::CHECKING => 'Probelauf läuft',
            VehicleImport::APPLYING => 'Wird importiert',
            VehicleImport::APPLIED => 'Importiert',
            VehicleImport::FAILED => 'Abgebrochen',
            default => 'Probelauf',
        };
    }
}
