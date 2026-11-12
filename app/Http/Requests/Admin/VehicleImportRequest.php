<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\VehicleImport;
use App\Services\Admin\Vehicles\Import\ImportUpload;
use App\Services\Admin\Vehicles\VehicleImporter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Every step of Fahrzeuge › Import, authorised by VehicleImportPolicy on the server (R-11); the route names the step:
 *
 *   - fahrzeugimport.index, fahrzeugimport.show, fahrzeugimport.stand, fahrzeugimport.beispiel — reading the importer
 *     and how far a run is (`imports` × view);
 *   - fahrzeugimport.hochladen — a file announced (`imports` × create): its name, size and source, no size limit (D-462);
 *   - fahrzeugimport.teil, fahrzeugimport.fertig — its parts, and the file complete: only the person who announced it;
 *   - fahrzeugimport.zuordnung — the same file under another mapping;
 *   - fahrzeugimport.importieren — the Probelauf applied (and the vehicles' create and edit rights).
 */
class VehicleImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        $import = $this->route('import');

        return match ($this->step()) {
            'hochladen' => $user->can('preview', VehicleImport::class),
            'teil', 'fertig' => $import instanceof VehicleImport && $user->can('upload', $import),
            // Whether the run is still a Probelauf is asked under its lock (VehicleImporter::remap), and answered in words.
            'zuordnung' => $import instanceof VehicleImport && $user->can('preview', VehicleImport::class),
            'importieren' => $import instanceof VehicleImport && $user->can('apply', $import),
            default => $user->can('viewAny', VehicleImport::class),
        };
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return match ($this->step()) {
            // No ceiling on the file (D-462): only on a part, which the server sized itself (ImportUpload::partBytes).
            'hochladen' => [
                'name' => ['required', 'string', 'max:255'],
                'size' => ['required', 'integer', 'min:1'],
                'quelle' => ['required', 'string', Rule::in(array_keys(VehicleImporter::SOURCES))],
            ],
            'teil' => [
                'offset' => ['required', 'integer', 'min:0'],
                'part' => ['required', 'file', 'max:'.(intdiv(ImportUpload::partBytes(), 1024) + 64)],
            ],
            'zuordnung' => [
                'mapping' => ['present', 'array'],
                'mapping.*' => ['nullable', 'string', 'max:200'],
            ],
            // The Probelauf the page showed (VehicleImporter::fingerprint): what is imported is what was seen.
            'importieren' => [
                'plan' => ['nullable', 'string', 'size:64'],
            ],
            default => [],
        };
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.*' => 'Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).',
            'size.min' => 'Die Datei ist leer. Wähl bitte die Datei mit den Fahrzeugen aus.',
            'size.*' => 'Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).',
            'offset.*' => 'Ein Teil der Datei ist nicht vollständig angekommen. Lad die Datei bitte noch einmal hoch.',
            'part.*' => 'Ein Teil der Datei ist nicht vollständig angekommen. Lad die Datei bitte noch einmal hoch.',
            'quelle.*' => 'Bitte wähl, woher die Fahrzeugdaten kommen.',
            'mapping.*' => 'Die Zuordnung ist unvollständig angekommen. Lad die Seite bitte neu.',
            'plan.*' => 'Die Seite ist nicht mehr aktuell. Lad sie bitte neu.',
        ];
    }

    /** The fingerprint of the Probelauf the page showed, or null where none was sent. */
    public function shownPlan(): ?string
    {
        $plan = $this->validated('plan');

        return is_string($plan) ? $plan : null;
    }

    public function source(): VehicleSource
    {
        return VehicleSource::from((string) $this->validated('quelle'));
    }

    /** @return array<string, string> field => header, only fields the importer knows */
    public function mapping(): array
    {
        $mapping = [];

        foreach ((array) $this->validated('mapping') as $field => $header) {
            if (is_string($field) && isset(VehicleImporter::FIELDS[$field]) && is_string($header) && $header !== '') {
                $mapping[$field] = $header;
            }
        }

        return $mapping;
    }

    public function step(): string
    {
        $name = (string) $this->route()?->getName();

        return substr($name, (int) strrpos($name, '.') + 1);
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
