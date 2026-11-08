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
 * and every vehicle is entered — and, where the paper has rows, whether its Verwendungsbereich asks for an Abnahme, with
 * the page it says so on. The release compares that with what was entered.
 *
 * The count of Auflagen codes and tyre sizes (D-440) and the axle-load limit (D-441) are no longer asked: the client's round of
 * 08.11.2026, §3. Nothing has a default: a question someone skips must stop the release, never pass it.
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

        if (! $this->hasRows()) {
            return $rules;
        }

        return $rules + [
            'abnahme' => ['required', Rule::in(ReleaseDeclaration::ABNAHME)],
            'abnahme_page' => [Rule::requiredIf(fn (): bool => in_array($this->input('abnahme'), [ReleaseDeclaration::ABNAHME_ALL, ReleaseDeclaration::ABNAHME_SOME], true)), 'nullable', 'integer', 'min:1', 'max:'.$this->lastPage()],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'completeness.*' => 'Sag, ob alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst sind.',
            'missing.required_if' => 'Nenn die Anlagen oder Bereiche, die noch fehlen.',
            'missing.max' => 'Das sind mehr als 255 Zeichen. Nenn die fehlenden Anlagen oder Bereiche kürzer.',
            'abnahme.*' => 'Sag, ob der Verwendungsbereich eine Abnahme verlangt.',
            'abnahme_page.*' => 'Trag die Seite im PDF ein, auf der du das gelesen hast – als ganze Zahl zwischen 1 und '.$this->lastPage().'.',
        ];
    }

    /** What the release compares the entry with: the completeness answer and, where the paper has rows, the Abnahme. */
    public function declaration(): ReleaseDeclaration
    {
        $missing = $this->validated('missing') === null ? null : trim((string) $this->validated('missing'));
        $abnahme = $this->hasRows() ? (string) $this->validated('abnahme') : null;

        return new ReleaseDeclaration((string) $this->validated('completeness'), $missing, $abnahme);
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    /** A base without rows of its own is asked the completeness alone. */
    private function hasRows(): bool
    {
        $document = $this->route('document');

        return $document instanceof ApprovalDocument
            && Fitment::query()->where('approval_document_id', $document->id)->whereNot('status', FitmentStatus::Retired->value)->exists();
    }

    private function lastPage(): int
    {
        $document = $this->route('document');
        $pages = $document instanceof ApprovalDocument ? $document->page_count : null;

        return is_int($pages) && $pages > 0 ? $pages : 999;
    }
}
