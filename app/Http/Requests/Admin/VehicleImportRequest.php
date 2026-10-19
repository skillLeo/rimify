<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\VehicleImport;
use App\Services\Admin\Vehicles\VehicleImporter;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Every step of Fahrzeuge › Import, authorised by VehicleImportPolicy on the server (R-11); the route names the step:
 *
 *   - fahrzeugimport.index, fahrzeugimport.show, fahrzeugimport.beispiel — reading the importer (`imports` × view);
 *   - fahrzeugimport.probelauf — a file read and checked (`imports` × create), nothing written to the cars;
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
            'probelauf' => $user->can('preview', VehicleImport::class),
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
            'probelauf' => [
                // The 5 MB ceiling is CatalogueFile's, said in its words; this one only keeps a huge body out.
                'file' => ['required', 'file', 'max:'.(6 * 1024)],
                'quelle' => ['required', 'string', Rule::in(array_keys(VehicleImporter::SOURCES))],
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
            'file.required' => 'Bitte wähl eine Datei aus: CSV oder Excel (.xlsx).',
            'file.file' => 'Die Datei ist nicht vollständig angekommen. Lad sie bitte noch einmal hoch.',
            'file.max' => 'Die Datei ist größer als 5 MB. Teil sie bitte auf.',
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
