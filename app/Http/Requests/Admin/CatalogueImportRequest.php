<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\CatalogueImport;
use App\Services\Admin\Catalogue\CatalogueImporter;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Every step of Katalog › Import, authorised by CatalogueImportPolicy on the server (R-11); the route
 * names the step:
 *
 *   - import.index, import.show, import.beispiel — reading the importer (`imports` × view);
 *   - import.probelauf — a file read and checked (`imports` × create), nothing written to the catalogue;
 *   - import.zuordnung — the same file under another mapping;
 *   - import.importieren — the Probelauf applied (and the catalogue's create and edit rights);
 *   - import.zuruecknehmen — an applied import taken back.
 */
class CatalogueImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        $import = $this->route('import');

        return match ($this->step()) {
            'probelauf' => $user->can('preview', CatalogueImport::class),
            'zuordnung' => $import instanceof CatalogueImport && $import->status === CatalogueImport::PREVIEWED && $user->can('preview', CatalogueImport::class),
            'importieren' => $import instanceof CatalogueImport && $user->can('apply', $import),
            'zuruecknehmen' => $import instanceof CatalogueImport && $user->can('rollback', $import),
            default => $user->can('viewAny', CatalogueImport::class),
        };
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return match ($this->step()) {
            'probelauf' => [
                // The 5 MB ceiling is CatalogueFile's, said in its words; this one only keeps a huge body out.
                'file' => ['required', 'file', 'max:'.(6 * 1024)],
                'dezimal' => ['nullable', 'in:komma,punkt'],
            ],
            'zuordnung' => [
                'mapping' => ['present', 'array'],
                'mapping.*' => ['nullable', 'string', 'max:200'],
                'dezimal' => ['required', 'in:komma,punkt'],
            ],
            default => [],
        };
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'file.required' => 'Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).',
            'file.file' => 'Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.',
            'file.max' => 'Die Datei ist größer als 5 MB. Teil sie bitte auf.',
            'dezimal.*' => 'Bitte wähl, wie die Datei Kommazahlen schreibt.',
            'mapping.*' => 'Die Zuordnung ist unvollständig angekommen. Lad die Seite bitte neu.',
        ];
    }

    /** @return array<string, string> field => header, only fields the importer knows */
    public function mapping(): array
    {
        $mapping = [];

        foreach ((array) $this->validated('mapping') as $field => $header) {
            if (is_string($field) && isset(CatalogueImporter::FIELDS[$field]) && is_string($header) && $header !== '') {
                $mapping[$field] = $header;
            }
        }

        return $mapping;
    }

    public function pointIsDecimal(): bool
    {
        return $this->input('dezimal') === 'punkt';
    }

    public function step(): string
    {
        $name = (string) $this->route()?->getName();

        return substr($name, (int) strrpos($name, '.') + 1);
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
