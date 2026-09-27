<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * A Gutachten's own facts: the PDF (uploaded straight into the bucket, confirmed here by its pending
 * key), the kind, the number that kind carries, issuer, date, pages, and the revision it replaces.
 * Authorised by ApprovalDocumentPolicy — creating, or editing a draft.
 *
 * Each kind names itself by its own number: an ABE by its KBA number, a Teilegutachten by its report
 * number, an ECE or EG approval by its mark. The one a kind needs is required; the others stay open.
 */
class ApprovalDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            return false;
        }

        $document = $this->document();

        return $document === null ? $user->can('create', ApprovalDocument::class) : $user->can('update', $document);
    }

    protected function prepareForValidation(): void
    {
        foreach (['kba_number', 'report_number', 'approval_mark', 'issuer'] as $key) {
            $value = $this->input($key);
            $this->merge([$key => is_string($value) ? trim($value) : $value]);
        }
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $creating = $this->document() === null;

        return [
            'upload_key' => [$creating ? 'required' : 'nullable', 'string', 'regex:#^pending/[0-9a-z]{26}\.pdf$#'],
            'kind' => ['required', Rule::in(ApprovalKind::values())],
            'kba_number' => ['nullable', 'string', 'max:64', Rule::requiredIf(fn (): bool => $this->input('kind') === ApprovalKind::Abe->value)],
            'report_number' => ['nullable', 'string', 'max:64', Rule::requiredIf(fn (): bool => $this->input('kind') === ApprovalKind::Teilegutachten->value)],
            'approval_mark' => ['nullable', 'string', 'max:64', Rule::requiredIf(fn (): bool => in_array($this->input('kind'), [ApprovalKind::Ece->value, ApprovalKind::Ec->value], true))],
            'issuer' => ['nullable', 'string', 'max:120'],
            // Today in Berlin, where the document was issued — not in UTC, which is still yesterday until 02:00.
            'issued_on' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:1990-01-01', 'before_or_equal:'.now('Europe/Berlin')->toDateString()],
            'page_count' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'supersedes_id' => ['nullable', 'integer', Rule::exists('approval_documents', 'id')->where('status', DocumentStatus::Published->value)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'upload_key.required' => 'Bitte lad zuerst das PDF des Gutachtens hoch.',
            'upload_key.*' => 'Das hochgeladene PDF ist nicht angekommen. Lad es bitte noch einmal hoch.',
            'kind.*' => 'Bitte wähl die Art des Dokuments.',
            'kba_number.required' => 'Eine ABE braucht ihre KBA-Nummer.',
            'kba_number.max' => 'Die KBA-Nummer darf höchstens 64 Zeichen lang sein.',
            'report_number.required' => 'Ein Teilegutachten braucht seine Gutachten-Nummer.',
            'report_number.max' => 'Die Gutachten-Nummer darf höchstens 64 Zeichen lang sein.',
            'approval_mark.required' => 'Eine ECE- oder EG-Genehmigung braucht ihr Genehmigungszeichen.',
            'approval_mark.max' => 'Das Genehmigungszeichen darf höchstens 64 Zeichen lang sein.',
            'issuer.max' => 'Der Aussteller darf höchstens 120 Zeichen lang sein.',
            'issued_on.*' => 'Das Ausstellungsdatum ist kein gültiger Tag in der Vergangenheit. Schreib es bitte so: 12.03.2024.',
            'page_count.*' => 'Die Seitenzahl bitte als ganze Zahl ab 1.',
            'supersedes_id.*' => 'Ersetzt werden kann nur ein freigegebenes Dokument.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $document = $this->document();
                $supersedes = $this->input('supersedes_id');

                if ($document !== null && $supersedes !== null && (int) $supersedes === $document->id) {
                    $validator->errors()->add('supersedes_id', 'Ein Dokument kann sich nicht selbst ersetzen.');
                }
            },
        ];
    }

    /**
     * @return array{kind: string, kba_number: string|null, report_number: string|null, approval_mark: string|null, issuer: string|null, issued_on: string|null, page_count: int|null, supersedes_id: int|null}
     */
    public function facts(): array
    {
        $text = fn (string $key): ?string => is_string($this->validated($key)) && $this->validated($key) !== '' ? (string) $this->validated($key) : null;
        $kind = (string) $this->validated('kind');

        // Only the number the chosen kind carries: a KBA-Nummer typed before the kind was switched
        // to Teilegutachten is not kept behind the form's back.
        return [
            'kind' => $kind,
            'kba_number' => $kind === ApprovalKind::Abe->value ? $text('kba_number') : null,
            'report_number' => $kind === ApprovalKind::Teilegutachten->value ? $text('report_number') : null,
            'approval_mark' => in_array($kind, [ApprovalKind::Ece->value, ApprovalKind::Ec->value], true) ? $text('approval_mark') : null,
            'issuer' => $text('issuer'),
            'issued_on' => $text('issued_on'),
            'page_count' => $this->validated('page_count') === null ? null : (int) $this->validated('page_count'),
            'supersedes_id' => $this->validated('supersedes_id') === null ? null : (int) $this->validated('supersedes_id'),
        ];
    }

    public function uploadKey(): ?string
    {
        $key = $this->validated('upload_key');

        return is_string($key) && $key !== '' ? $key : null;
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }

    public function document(): ?ApprovalDocument
    {
        $document = $this->route('document');

        return $document instanceof ApprovalDocument ? $document : null;
    }
}
