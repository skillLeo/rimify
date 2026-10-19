<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\VehicleImportRequest;
use App\Models\VehicleImport;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Catalogue\CatalogueFile;
use App\Services\Admin\ListExport;
use App\Services\Admin\Vehicles\VehicleImporter;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Fahrzeuge › Import (his admin item 2, D-297): a vehicle dataset into the shop in four steps — the file and where it
 * comes from, its columns, the Probelauf, the import (VehicleImporter). Nothing is written to a car before the import,
 * and the import writes exactly the Probelauf on screen.
 */
class FahrzeugImportController extends Controller
{
    /** The rows of one Probelauf the page lists; the counts above them are always the whole file's. */
    public const SHOWN_ROWS = 500;

    public const PREVIEWED = 'Probelauf fertig. Noch ist nichts importiert.';

    public const APPLIED = 'Importiert.';

    public const REMAPPED = 'Neu geprüft.';

    public function index(VehicleImportRequest $request): Response
    {
        return Inertia::render('Admin/Fahrzeuge/Import', [
            'sources' => array_map(static fn (string $value, string $label): array => ['value' => $value, 'label' => $label], array_keys(VehicleImporter::SOURCES), VehicleImporter::SOURCES),
            'fields' => self::fields(),
            // The list reads the summaries only: a run's file, rows and plan can be megabytes each.
            'imports' => VehicleImport::query()->with(['admin:id,name', 'applier:id,name'])->latest('id')->limit(20)
                ->get(['id', 'admin_user_id', 'applied_by', 'file_name', 'file_format', 'source', 'status', 'summary', 'applied_at', 'created_at'])
                ->map(static fn (VehicleImport $i): array => self::summaryRow($i))->values()->all(),
            'total' => VehicleImport::query()->count(),
            'can' => ['preview' => $request->admin()->canQuietly('preview', VehicleImport::class)],
        ]);
    }

    public function preview(VehicleImportRequest $request, VehicleImporter $importer): RedirectResponse
    {
        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages(['file' => 'Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).']);
        }

        $import = $importer->preview(CatalogueFile::read($file, 'Fahrzeuge'), null, $request->source(), $request->admin());

        return redirect('/admin/fahrzeuge/import/'.$import->id)->with('toast', self::PREVIEWED);
    }

    public function show(VehicleImportRequest $request, VehicleImport $import): Response
    {
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, $import->file_name);
        $admin = $request->admin();
        $headers = $import->file['headers'];
        // What needs a look first: refused rows, then what changes, then what stays.
        $order = [VehicleImporter::REFUSED => 0, VehicleImporter::CREATE => 1, VehicleImporter::UPDATE => 2, VehicleImporter::MERGE => 3, VehicleImporter::KEPT => 4];
        $listed = array_values(array_filter($import->plan, static fn (array $e): bool => $e['status'] !== VehicleImporter::UNCHANGED || $e['notes'] !== []));
        usort($listed, static fn (array $a, array $b): int => [$order[$a['status']] ?? 5, (int) $a['line']] <=> [$order[$b['status']] ?? 5, (int) $b['line']]);

        // What each column holds, from the first row that has a value: a column is chosen by what it says.
        $examples = [];

        foreach ($headers as $header) {
            foreach ($import->file['rows'] as $row) {
                if (($row[$header] ?? '') !== '') {
                    $examples[$header] = mb_substr((string) $row[$header], 0, 40);

                    break;
                }
            }
        }

        return Inertia::render('Admin/Fahrzeuge/ImportRun', [
            'run' => self::summaryRow($import->loadMissing(['admin:id,name', 'applier:id,name'])) + [
                'rowCount' => count($import->file['rows']),
                'appliedAt' => GermanFormat::dateTime($import->applied_at),
            ],
            'fields' => self::fields(),
            'headers' => $headers,
            'examples' => $examples,
            'mapping' => (object) $import->mapping,
            'missing' => VehicleImporter::missing($import->mapping, $headers),
            // What the file lacks, as counts and shares of its rows: the figures he decides a purchase on (D-317).
            'gaps' => VehicleImporter::gaps((array) ($import->summary ?? [])),
            'rows' => array_slice($listed, 0, self::SHOWN_ROWS),
            'hiddenRows' => max(0, count($listed) - self::SHOWN_ROWS),
            // Sent back with „Importieren“: the import applies this Probelauf, not one another tab has checked since.
            'planHash' => VehicleImporter::fingerprint($import->plan),
            'can' => [
                'remap' => $import->status === VehicleImport::PREVIEWED && $admin->canQuietly('preview', VehicleImport::class),
                'apply' => $import->status === VehicleImport::PREVIEWED && $admin->canQuietly('apply', $import),
            ],
        ]);
    }

    public function remap(VehicleImportRequest $request, VehicleImport $import, VehicleImporter $importer): RedirectResponse
    {
        $importer->remap($import, $request->mapping());

        return back()->with('toast', self::REMAPPED);
    }

    public function apply(VehicleImportRequest $request, VehicleImport $import, VehicleImporter $importer): RedirectResponse
    {
        $importer->apply($import, $request->admin(), $request->shownPlan());

        return back()->with('toast', self::APPLIED);
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

    /** @return list<array{key: string, label: string, required: bool}> */
    private static function fields(): array
    {
        $fields = [];

        foreach (VehicleImporter::FIELDS as $key => $spec) {
            $fields[] = ['key' => $key, 'label' => $spec['label'], 'required' => $spec['required']];
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
            'format' => $import->file_format === 'xlsx' ? 'Excel' : 'CSV',
            'status' => $import->status,
            'statusLabel' => $import->status === VehicleImport::APPLIED ? 'Importiert' : 'Probelauf',
            'summary' => (object) $import->summary,
            // An imported run is named by its import: when, and by whom — the Probelauf's author otherwise.
            'by' => $import->status === VehicleImport::APPLIED ? ($import->applier->name ?? $import->admin?->name) : $import->admin?->name,
            'at' => GermanFormat::dateTime($import->applied_at ?? $import->created_at),
            'href' => '/admin/fahrzeuge/import/'.$import->id,
        ];
    }
}
