<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CatalogueImportRequest;
use App\Models\CatalogueImport;
use App\Services\Admin\AdminNavigation;
use App\Services\Admin\Catalogue\CatalogueFile;
use App\Services\Admin\Catalogue\CatalogueImporter;
use App\Services\Admin\ListExport;
use App\Support\GermanFormat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Katalog › Import — a supplier feed into the catalogue in four steps: the file, its columns, the
 * Probelauf, the import (the review release §4.2, BLOCKED #1). Every import can be taken back whole
 * while nothing has been built on it (CatalogueImporter).
 */
class KatalogImportController extends Controller
{
    /** The rows of one Probelauf the page lists; the counts above them are always the whole file's. */
    public const SHOWN_ROWS = 500;

    public const PREVIEWED = 'Probelauf fertig. Noch ist nichts importiert.';

    public const APPLIED = 'Importiert. Neue Felgen sind Entwürfe, bis du sie veröffentlichst.';

    public const ROLLED_BACK = 'Import zurückgenommen.';

    public const REMAPPED = 'Neu geprüft.';

    public function index(CatalogueImportRequest $request): Response
    {
        $imports = CatalogueImport::query()->with('admin:id,name')->latest('id')->limit(20)->get()
            ->map(static fn (CatalogueImport $i): array => self::summaryRow($i))->values()->all();

        return Inertia::render('Admin/Katalog/Import', [
            'fields' => self::fields(),
            'imports' => $imports,
            // The page lists the latest 20; its context counts them all.
            'total' => CatalogueImport::query()->count(),
            'can' => ['preview' => $request->admin()->can('preview', CatalogueImport::class)],
        ]);
    }

    public function preview(CatalogueImportRequest $request, CatalogueImporter $importer): RedirectResponse
    {
        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages(['file' => 'Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).']);
        }

        $import = $importer->preview(CatalogueFile::read($file), null, $request->pointIsDecimal(), $request->admin());

        return redirect('/admin/katalog/import/'.$import->id)->with('toast', self::PREVIEWED);
    }

    public function show(CatalogueImportRequest $request, CatalogueImport $import): Response
    {
        // On the app's request, not the Form Request: that is a copy, and the crumb is read from the original.
        request()->attributes->set(AdminNavigation::RECORD, $import->file_name);
        $admin = $request->admin();
        $headers = $import->source['headers'];
        $order = ['refused' => 0, 'create' => 1, 'update' => 2];
        $listed = array_values(array_filter($import->plan, static fn (array $e): bool => $e['action'] !== 'unchanged'));
        usort($listed, static fn (array $a, array $b): int => [$order[$a['action']] ?? 3, $a['line']] <=> [$order[$b['action']] ?? 3, $b['line']]);

        // What each column holds, from the first rows that have a value: the mapping is chosen by
        // what a column says, not only by what it is called.
        $examples = [];

        foreach ($headers as $header) {
            foreach ($import->source['rows'] as $row) {
                if (($row[$header] ?? '') !== '') {
                    $examples[$header] = mb_substr((string) $row[$header], 0, 40);

                    break;
                }
            }
        }

        return Inertia::render('Admin/Katalog/ImportRun', [
            'run' => self::summaryRow($import->loadMissing('admin:id,name')) + [
                'decimal' => $import->decimal,
                'rowCount' => count($import->source['rows']),
                'appliedAt' => GermanFormat::dateTime($import->applied_at),
                'rolledBackAt' => GermanFormat::dateTime($import->rolled_back_at),
            ],
            'fields' => self::fields(),
            'headers' => $headers,
            'examples' => $examples,
            'mapping' => (object) $import->mapping,
            'missing' => CatalogueImporter::missing($import->mapping, $headers),
            'rows' => array_slice($listed, 0, self::SHOWN_ROWS),
            'hiddenRows' => max(0, count($listed) - self::SHOWN_ROWS),
            'can' => [
                'remap' => $import->status === CatalogueImport::PREVIEWED && $admin->can('preview', CatalogueImport::class),
                'apply' => $admin->can('apply', $import),
                'rollback' => $admin->can('rollback', $import),
            ],
        ]);
    }

    public function remap(CatalogueImportRequest $request, CatalogueImport $import, CatalogueImporter $importer): RedirectResponse
    {
        $importer->remap($import, $request->mapping(), $request->pointIsDecimal());

        return back()->with('toast', self::REMAPPED);
    }

    public function apply(CatalogueImportRequest $request, CatalogueImport $import, CatalogueImporter $importer): RedirectResponse
    {
        $importer->apply($import, $request->admin());

        return back()->with('toast', self::APPLIED);
    }

    public function rollback(CatalogueImportRequest $request, CatalogueImport $import, CatalogueImporter $importer): RedirectResponse
    {
        $importer->rollback($import, $request->admin());

        return back()->with('toast', self::ROLLED_BACK);
    }

    /**
     * A file to start from: every column the importer knows, named the way it finds them, and two
     * rows that show how a value is written. The brand is plainly an example, never a real one.
     */
    public function sample(CatalogueImportRequest $request): StreamedResponse
    {
        $header = ['SKU', 'Marke', 'Modell', 'Ausführung', 'Durchmesser', 'Breite', 'ET', 'Lochkreis', 'Mittenloch', 'Preis', 'Bestand', 'EAN', 'KBA-Nummer', 'Gewicht', 'Speichen'];
        $rows = [
            ['BEISPIEL-18-80-35-GM', 'Beispielmarke', 'Muster 5', 'Graphit matt', '18', '8', '35', '5x112', '66,6', '189,00', '12', '', '', '10400', '5'],
            ['BEISPIEL-19-85-40-GM', 'Beispielmarke', 'Muster 5', 'Graphit matt', '19', '8,5', '40', '5x112', '66,6', '219,00', '8', '', '', '11200', '5'],
        ];

        return ListExport::download('felgen-import-beispiel', 'csv', $header, $rows);
    }

    /** @return list<array{key: string, label: string, required: bool}> */
    private static function fields(): array
    {
        $fields = [];

        foreach (CatalogueImporter::FIELDS as $key => $spec) {
            $fields[] = ['key' => $key, 'label' => $spec['label'], 'required' => $spec['required']];
        }

        return $fields;
    }

    /** @return array<string, mixed> */
    private static function summaryRow(CatalogueImport $import): array
    {
        return [
            'id' => (int) $import->id,
            'file' => $import->file_name,
            'format' => $import->file_format === 'xlsx' ? 'Excel' : 'CSV',
            'status' => $import->status,
            'statusLabel' => match ($import->status) {
                CatalogueImport::APPLIED => 'Importiert',
                CatalogueImport::ROLLED_BACK => 'Zurückgenommen',
                default => 'Probelauf',
            },
            'summary' => (object) $import->summary,
            'by' => $import->admin?->name,
            'at' => GermanFormat::dateTime($import->created_at),
            'href' => '/admin/katalog/import/'.$import->id,
        ];
    }
}
