<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\Approvals\CountFigures;
use App\Services\Admin\Approvals\ReleaseDeclaration;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * „Freigeben“ (`approvals` × publish, R-11), with what the person read off the PDF (D-227, D-228): whether every Anlage
 * and every vehicle is entered — and the count of the Verwendungsbereich the entry is compared with.
 *
 * The count is taken before the rows are entered, each figure with its page (ADMIN-GEFUNDEN 511, DocumentCountRequest),
 * and the release reads it from the document. Only a document that has rows and was never counted — a draft from before
 * the count was asked first — is asked for it here, with the pages; it is recorded as counted after the entry, and the
 * page and the Protokoll say so. Nothing has a default: a question someone skips must stop the release, never pass it.
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
        $rules = [
            'completeness' => ['required', Rule::in(ApprovalDocument::COMPLETENESS)],
            'missing' => ['nullable', 'string', 'max:255', 'required_if:completeness,'.ApprovalDocument::PARTIAL],
        ];

        if (! $this->asksCount()) {
            return $rules;
        }

        $page = ['integer', 'min:1', 'max:'.$this->lastPage()];

        return $rules + [
            'codes' => ['required', 'integer', 'min:0', 'max:999'],
            'codes_page' => ['required', ...$page],
            'sizes' => ['required', 'integer', 'min:1', 'max:99'],
            'sizes_page' => ['required', ...$page],
            'axle_limit_kg' => ['nullable', 'integer', 'min:200', 'max:9999'],
            'axle_limit_page' => [Rule::requiredIf(fn (): bool => $this->filled('axle_limit_kg')), 'nullable', ...$page],
            'abnahme' => ['required', Rule::in(ReleaseDeclaration::ABNAHME)],
            'abnahme_page' => [Rule::requiredIf(fn (): bool => in_array($this->input('abnahme'), [ReleaseDeclaration::ABNAHME_ALL, ReleaseDeclaration::ABNAHME_SOME], true)), 'nullable', ...$page],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        $page = 'Trag die Seite im PDF ein, auf der du das gelesen hast – als ganze Zahl zwischen 1 und '.$this->lastPage().'.';

        return [
            'completeness.*' => 'Sag, ob alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst sind.',
            'missing.required_if' => 'Nenn die Anlagen oder Bereiche, die noch fehlen.',
            'missing.max' => 'Das sind mehr als 255 Zeichen. Nenn die fehlenden Anlagen oder Bereiche kürzer.',
            'codes.*' => 'Trag ein, wie viele Auflagen-Codes der Verwendungsbereich für die erfassten Fahrzeuge druckt – als ganze Zahl.',
            'sizes.*' => 'Trag ein, wie viele Reifengrößen der Verwendungsbereich für die erfassten Fahrzeuge nennt – als ganze Zahl.',
            'axle_limit_kg.*' => 'Die Achslastgrenze bitte in Kilogramm, als ganze Zahl zwischen 200 und 9999 – oder leer, wenn der Verwendungsbereich keine nennt.',
            'abnahme.*' => 'Sag, ob der Verwendungsbereich eine Abnahme verlangt.',
            'codes_page.*' => $page,
            'sizes_page.*' => $page,
            'axle_limit_page.*' => $page,
            'abnahme_page.*' => $page,
        ];
    }

    /** The count this request carries: only where the document has rows and was never counted. */
    public function figures(): ?CountFigures
    {
        if (! $this->asksCount()) {
            return null;
        }

        $int = fn (string $key): ?int => $this->validated($key) === null ? null : (int) $this->validated($key);

        return new CountFigures(
            codes: (int) $this->validated('codes'),
            codesPage: (int) $this->validated('codes_page'),
            sizes: (int) $this->validated('sizes'),
            sizesPage: (int) $this->validated('sizes_page'),
            axleLimitKg: $int('axle_limit_kg'),
            axleLimitPage: $int('axle_limit_page'),
            abnahme: (string) $this->validated('abnahme'),
            abnahmePage: $int('abnahme_page'),
        );
    }

    /** What the release compares the entry with: the document's count where it has one, and the completeness answer. */
    public function declaration(): ReleaseDeclaration
    {
        $completeness = (string) $this->validated('completeness');
        $missing = $this->validated('missing') === null ? null : trim((string) $this->validated('missing'));
        $document = $this->route('document');
        $count = $document instanceof ApprovalDocument ? CountFigures::of($document) : null;

        return $count?->declaration($completeness, $missing) ?? $this->figures()?->declaration($completeness, $missing) ?? new ReleaseDeclaration($completeness, $missing);
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /** A document with rows that was never counted: asked here, the one place left to ask it. */
    private function asksCount(): bool
    {
        $document = $this->route('document');

        return $document instanceof ApprovalDocument
            && ! $document->isCounted()
            && Fitment::query()->where('approval_document_id', $document->id)->whereNot('status', FitmentStatus::Retired->value)->exists();
    }

    private function lastPage(): int
    {
        $document = $this->route('document');
        $pages = $document instanceof ApprovalDocument ? $document->page_count : null;

        return is_int($pages) && $pages > 0 ? $pages : 999;
    }
}
