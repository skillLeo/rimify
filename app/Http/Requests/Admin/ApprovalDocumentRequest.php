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

    /** Page 1's header, as the record stores it (the corrections memo §4). */
    public const HEADER = ['annex', 'test_report_number', 'copy_number', 'designation_number', 'test_site'];

    protected function prepareForValidation(): void
    {
        foreach (['kba_number', 'report_number', 'approval_mark', 'issuer', 'supplement_to_number', ...self::HEADER, 'valid_from_production', 'missing_annexes'] as $key) {
            $value = $this->input($key);
            $this->merge([$key => is_string($value) ? trim($value) : $value]);
        }

        foreach (['test_date', 'revision_date', 'supplement_to_id', 'papers_correction'] as $key) {
            if ($this->input($key) === '') {
                $this->merge([$key => null]);
            }
        }
    }

    /**
     * `03.2021`, `3.2021`, `03/2021`, `2021-03`, or `032021` from a phone's number pad (B-04) →
     * `2021-03-01`; null when it does not read as a month.
     */
    public static function month(?string $typed): ?string
    {
        if ($typed === null || $typed === '') {
            return null;
        }

        if (preg_match('/^(\d{1,2})\s*[.\/,]\s*(\d{4})$/', $typed, $m) === 1 || preg_match('/^(\d{2})(\d{4})$/', $typed, $m) === 1) {
            [$month, $year] = [(int) $m[1], (int) $m[2]];
        } elseif (preg_match('/^(\d{4})-(\d{1,2})$/', $typed, $m) === 1) {
            [$year, $month] = [(int) $m[1], (int) $m[2]];
        } else {
            return null;
        }

        return $month >= 1 && $month <= 12 && $year >= 1980 && $year <= 2100 ? sprintf('%04d-%02d-01', $year, $month) : null;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $creating = $this->document() === null;

        return [
            'upload_key' => [$creating ? 'required' : 'nullable', 'string', 'regex:#^pending/[0-9a-z]{26}\.pdf$#'],
            'kind' => ['required', Rule::in(ApprovalKind::values())],
            'kba_number' => ['nullable', 'string', 'max:64', Rule::requiredIf(fn (): bool => $this->input('kind') === ApprovalKind::Abe->value)],
            'report_number' => ['nullable', 'string', 'max:64', Rule::requiredIf(fn (): bool => in_array($this->input('kind'), [ApprovalKind::Teilegutachten->value, ApprovalKind::Nachtrag->value], true))],
            'approval_mark' => ['nullable', 'string', 'max:64', Rule::requiredIf(fn (): bool => in_array($this->input('kind'), [ApprovalKind::Ece->value, ApprovalKind::Ec->value], true))],
            'issuer' => ['nullable', 'string', 'max:120'],
            // Today in Berlin, where the document was issued — not in UTC, which is still yesterday until 02:00.
            'issued_on' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:1990-01-01', 'before_or_equal:'.now('Europe/Berlin')->toDateString()],
            'page_count' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'supersedes_id' => ['nullable', 'integer', Rule::exists('approval_documents', 'id')->where('status', DocumentStatus::Published->value)],
            // A Nachtrag names its base: one of ours, or the number of one we do not hold.
            'supplement_to_id' => ['nullable', 'integer', Rule::exists('approval_documents', 'id')->whereNot('kind', ApprovalKind::Nachtrag->value)],
            'supplement_to_number' => ['nullable', 'string', 'max:64', Rule::requiredIf(fn (): bool => $this->input('kind') === ApprovalKind::Nachtrag->value && ! is_numeric($this->input('supplement_to_id')))],
            'annex' => ['nullable', 'string', 'max:64'],
            'test_report_number' => ['nullable', 'string', 'max:64'],
            'copy_number' => ['nullable', 'string', 'max:32'],
            'designation_number' => ['nullable', 'string', 'max:64'],
            'test_site' => ['nullable', 'string', 'max:120'],
            'test_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:1980-01-01', 'before_or_equal:'.now('Europe/Berlin')->toDateString()],
            'revision_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:1980-01-01', 'before_or_equal:'.now('Europe/Berlin')->toDateString()],
            'valid_from_production' => ['nullable', 'string', 'max:8'],
            // § 15 FZV, as the document says it (ABE 53841, point 10); empty when it says nothing.
            'papers_correction' => ['nullable', 'string', Rule::in(['not_required', 'required'])],
            // The Anlagen of its Verwendungsbereich we do not hold, as printed: „1–15“.
            'missing_annexes' => ['nullable', 'string', 'max:64'],
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
            'supplement_to_id.*' => 'Ein Nachtrag ergänzt ein Gutachten, keinen anderen Nachtrag. Bitte wähl das Grundgutachten.',
            'supplement_to_number.required' => 'Bitte nenn das Grundgutachten, zu dem der Nachtrag gehört – etwa ABE 53841 –, oder wähl es aus der Liste.',
            'supplement_to_number.max' => 'Die Nummer des Grundgutachtens darf höchstens 64 Zeichen lang sein.',
            'annex.max' => 'Die Anlage darf höchstens 64 Zeichen lang sein.',
            'test_report_number.max' => 'Die Prüfbericht-Nummer darf höchstens 64 Zeichen lang sein.',
            'copy_number.max' => 'Die Ausfertigung darf höchstens 32 Zeichen lang sein.',
            'designation_number.max' => 'Die Benennungsnummer darf höchstens 64 Zeichen lang sein.',
            'test_site.max' => 'Der Prüfort darf höchstens 120 Zeichen lang sein.',
            'test_date.*' => 'Das Prüfdatum ist kein gültiger Tag in der Vergangenheit. Schreib es bitte so: 12.03.2024.',
            'revision_date.*' => 'Der Stand ist kein gültiger Tag in der Vergangenheit. Schreib ihn bitte so: 12.03.2024.',
            'kba_number.max' => 'Die KBA-Nummer darf höchstens 64 Zeichen lang sein.',
            'report_number.required' => $this->input('kind') === ApprovalKind::Nachtrag->value ? 'Ein Nachtrag braucht seine Nummer, so wie sie auf der ersten Seite steht.' : 'Ein Teilegutachten braucht seine Gutachten-Nummer.',
            'report_number.max' => 'Die Gutachten-Nummer darf höchstens 64 Zeichen lang sein.',
            'approval_mark.required' => 'Eine ECE- oder EG-Genehmigung braucht ihr Genehmigungszeichen.',
            'approval_mark.max' => 'Das Genehmigungszeichen darf höchstens 64 Zeichen lang sein.',
            'issuer.max' => 'Der Aussteller darf höchstens 120 Zeichen lang sein.',
            'issued_on.*' => 'Das Ausstellungsdatum ist kein gültiger Tag in der Vergangenheit. Schreib es bitte so: 12.03.2024.',
            'page_count.*' => 'Die Seitenzahl bitte als ganze Zahl ab 1.',
            'supersedes_id.*' => 'Ersetzt werden kann nur ein freigegebenes Dokument.',
            'papers_correction.*' => 'Bitte wähl, was das Dokument zur Berichtigung der Fahrzeugpapiere sagt.',
            'missing_annexes.max' => 'Die fehlenden Anlagen dürfen höchstens 64 Zeichen lang sein.',
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

                if ($document !== null && is_numeric($this->input('supplement_to_id')) && (int) $this->input('supplement_to_id') === $document->id) {
                    $validator->errors()->add('supplement_to_id', 'Ein Nachtrag kann sich nicht selbst ergänzen.');
                }

                $month = $this->input('valid_from_production');

                if (is_string($month) && $month !== '' && self::month($month) === null && ! $validator->errors()->has('valid_from_production')) {
                    $validator->errors()->add('valid_from_production', 'Den Monat können wir nicht lesen. Schreib ihn bitte so: 03.2021.');
                }
            },
        ];
    }

    /**
     * @return array<string, string|int|bool|null>
     */
    public function facts(): array
    {
        $text = fn (string $key): ?string => is_string($this->validated($key)) && $this->validated($key) !== '' ? (string) $this->validated($key) : null;
        $kind = (string) $this->validated('kind');
        $nachtrag = $kind === ApprovalKind::Nachtrag->value;
        $base = $nachtrag && $this->validated('supplement_to_id') !== null ? (int) $this->validated('supplement_to_id') : null;

        // Only the number the chosen kind carries: a KBA-Nummer typed before the kind was switched
        // to Teilegutachten is not kept behind the form's back. Likewise a base, only for a Nachtrag.
        return [
            'kind' => $kind,
            'kba_number' => $kind === ApprovalKind::Abe->value ? $text('kba_number') : null,
            'report_number' => in_array($kind, [ApprovalKind::Teilegutachten->value, ApprovalKind::Nachtrag->value], true) ? $text('report_number') : null,
            'approval_mark' => in_array($kind, [ApprovalKind::Ece->value, ApprovalKind::Ec->value], true) ? $text('approval_mark') : null,
            'issuer' => $text('issuer'),
            'issued_on' => $text('issued_on'),
            'page_count' => $this->validated('page_count') === null ? null : (int) $this->validated('page_count'),
            'supersedes_id' => $this->validated('supersedes_id') === null ? null : (int) $this->validated('supersedes_id'),
            'supplement_to_id' => $base,
            'supplement_to_number' => $nachtrag && $base === null ? $text('supplement_to_number') : null,
            'annex' => $text('annex'),
            'test_report_number' => $text('test_report_number'),
            'copy_number' => $text('copy_number'),
            'designation_number' => $text('designation_number'),
            'test_site' => $text('test_site'),
            'test_date' => $text('test_date'),
            'revision_date' => $text('revision_date'),
            'valid_from_production' => self::month($text('valid_from_production')),
            'papers_correction_required' => match ($this->validated('papers_correction')) {
                'not_required' => false,
                'required' => true,
                default => null,
            },
            'missing_annexes' => $text('missing_annexes'),
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
