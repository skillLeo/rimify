<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The PDFs of a Gutachten (D-494), `approvals` × edit on a draft or the released revision (ApprovalDocumentPolicy::manageFiles,
 * R-11). One request for the four actions, each asking only its own fields: a further PDF (`upload_key`, label, date), a label
 * and date, visible or not, the order.
 *
 * Routes: POST /admin/gutachten/{document}/pdfs, PUT /admin/gutachten/{document}/pdfs/{file?}, POST …/pdfs/{file}/sichtbar,
 * PUT /admin/gutachten/{document}/pdfs-reihenfolge.
 */
class DocumentFileRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('manageFiles', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return match ($this->route()?->getName()) {
            'admin.gutachten.pdfs.store' => [
                'upload_key' => ['required', 'string', 'max:64'],
                'label' => ['required', 'string', 'max:80'],
                'dated_on' => ['nullable', 'date_format:Y-m-d'],
            ],
            'admin.gutachten.pdfs.update' => [
                'label' => ['required', 'string', 'max:80'],
                'dated_on' => ['nullable', 'date_format:Y-m-d'],
            ],
            'admin.gutachten.pdfs.visible' => ['visible' => ['required', 'boolean']],
            'admin.gutachten.pdfs.order' => ['order' => ['required', 'array', 'min:1', 'max:200'], 'order.*' => ['nullable', 'integer', 'min:1']],
            default => [],
        };
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'upload_key.required' => 'Bitte wähl das PDF aus.',
            'label.required' => 'Gib dem PDF eine Bezeichnung, die der Kunde liest – etwa „Nachtrag“ oder „Anlage 3“.',
            'label.max' => 'Die Bezeichnung ist länger als 80 Zeichen. Fass sie kürzer.',
            'dated_on.*' => 'Das Datum lesen wir so nicht. Wähl es im Kalender oder lass das Feld leer.',
            'visible.*' => 'Sag, ob das PDF im Shop zu sehen sein soll.',
            'order.*' => 'Die Reihenfolge passt nicht mehr zu den PDFs. Lad die Seite neu und sortier noch einmal.',
        ];
    }

    public function label(): string
    {
        return trim((string) $this->validated('label'));
    }

    public function datedOn(): ?string
    {
        $date = $this->validated('dated_on');

        return is_string($date) && $date !== '' ? $date : null;
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
