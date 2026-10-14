<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\Approvals\ReleaseDeclaration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * „Freigeben“ (`approvals` × publish, R-11), with what the person read off the PDF (D-227, D-228): whether every Anlage
 * and every vehicle is entered, and — where the document has rows — how many Auflagen codes and tyre sizes its
 * Verwendungsbereich prints for the entered vehicles, the axle-load limit it names and whether it asks for an Abnahme.
 * Nothing has a default: a question someone skips must stop the release, never pass it.
 *
 * Route: POST /admin/gutachten/{document}/freigeben.
 */
class ApprovalReleaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('publish', $document);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $rows = $this->hasRows();

        return [
            'completeness' => ['required', Rule::in(ApprovalDocument::COMPLETENESS)],
            'missing' => ['nullable', 'string', 'max:255', 'required_if:completeness,'.ApprovalDocument::PARTIAL],
            'codes' => [Rule::requiredIf($rows), 'nullable', 'integer', 'min:0', 'max:999'],
            'sizes' => [Rule::requiredIf($rows), 'nullable', 'integer', 'min:1', 'max:99'],
            'axle_limit_kg' => ['nullable', 'integer', 'min:200', 'max:9999'],
            'abnahme' => [Rule::requiredIf($rows), 'nullable', Rule::in(ReleaseDeclaration::ABNAHME)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'completeness.*' => 'Sag, ob alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst sind.',
            'missing.required_if' => 'Nenn die Anlagen oder Bereiche, die noch fehlen.',
            'missing.max' => 'Das sind mehr als 255 Zeichen. Nenn die fehlenden Anlagen oder Bereiche kürzer.',
            'codes.*' => 'Trag ein, wie viele Auflagen-Codes der Verwendungsbereich für die erfassten Fahrzeuge druckt – als ganze Zahl.',
            'sizes.*' => 'Trag ein, wie viele Reifengrößen der Verwendungsbereich für die erfassten Fahrzeuge nennt – als ganze Zahl.',
            'axle_limit_kg.*' => 'Die Achslastgrenze bitte in Kilogramm, als ganze Zahl zwischen 200 und 9999 – oder leer, wenn der Verwendungsbereich keine nennt.',
            'abnahme.*' => 'Sag, ob der Verwendungsbereich eine Abnahme verlangt.',
        ];
    }

    public function declaration(): ReleaseDeclaration
    {
        $int = fn (string $key): ?int => $this->validated($key) === null ? null : (int) $this->validated($key);

        return new ReleaseDeclaration(
            completeness: (string) $this->validated('completeness'),
            missing: $this->validated('missing') === null ? null : trim((string) $this->validated('missing')),
            codes: $int('codes'),
            sizes: $int('sizes'),
            axleLimitKg: $int('axle_limit_kg'),
            abnahme: $this->validated('abnahme') === null ? null : (string) $this->validated('abnahme'),
        );
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    private function hasRows(): bool
    {
        $document = $this->route('document');

        return $document instanceof ApprovalDocument
            && Fitment::query()->where('approval_document_id', $document->id)->whereNot('status', FitmentStatus::Retired->value)->exists();
    }
}
