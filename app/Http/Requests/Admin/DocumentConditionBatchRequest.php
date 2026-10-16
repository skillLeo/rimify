<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\DocumentConditions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * A pasted legend, split in the browser and given its kinds by a person, stored as one batch (step 4).
 * Each entry obeys what one entry does (DocumentConditionRequest): a code unique in the document and in
 * the batch, a whole sentence, a chosen kind, and the parameter that kind needs.
 *
 * @phpstan-import-type ConditionInput from DocumentConditions
 */
class DocumentConditionBatchRequest extends FormRequest
{
    /** More than any legend of the two real documents holds. */
    public const MAX_ENTRIES = 200;

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        return $user instanceof AdminUser && $document instanceof ApprovalDocument && $user->can('update', $document);
    }

    protected function prepareForValidation(): void
    {
        $entries = [];

        foreach ((array) $this->input('entries', []) as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $entry['code'] = DocumentConditions::normaliseCode($entry['code'] ?? null);
            $entry['text_de'] = is_string($entry['text_de'] ?? null) ? trim((string) preg_replace('/\s+/u', ' ', $entry['text_de'])) : ($entry['text_de'] ?? null);
            $entries[] = $entry;
        }

        $this->merge(['entries' => $entries]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $document = $this->route('document');
        $rules = [
            'entries' => ['required', 'array', 'min:1', 'max:'.self::MAX_ENTRIES],
            'entries.*.code' => [
                'required', 'string', 'max:32', 'regex:'.DocumentConditions::CODE, 'distinct',
                Rule::unique('document_conditions', 'code')->where('approval_document_id', $document instanceof ApprovalDocument ? $document->id : 0),
            ],
            'entries.*.kind' => ['required', Rule::in(ConditionKind::values())],
            'entries.*.text_de' => ['required', 'string', 'min:5', 'max:2000'],
            'entries.*.source_page' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'entries.*.body_forms' => ['nullable', 'array'],
            'entries.*.body_forms.*' => ['string', Rule::in(DocumentConditions::BODY_FORMS)],
            'entries.*.drive.mode' => ['nullable', Rule::in(['only', 'not'])],
            'entries.*.drive.drive' => ['nullable', Rule::in(DocumentConditions::DRIVES)],
            'entries.*.max_axle_load_kg' => ['nullable', 'integer', 'min:200', 'max:4000'],
            'entries.*.axle' => ['nullable', Rule::in(['FRONT', 'REAR'])],
        ];

        return $rules;
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'entries.required' => 'Keine Zeile zum Speichern.',
            'entries.max' => 'Höchstens 200 Codes auf einmal.',
            'entries.*.code.required' => 'Bitte den Code.',
            'entries.*.code.max' => DocumentConditions::CODE_MESSAGE,
            'entries.*.code.regex' => DocumentConditions::CODE_MESSAGE,
            'entries.*.code.distinct' => 'Dieser Code steht zweimal in der Liste.',
            'entries.*.code.unique' => 'Diesen Code gibt es in diesem Gutachten schon.',
            'entries.*.kind.*' => 'Bitte wähl die Art.',
            'entries.*.text_de.required' => 'Bitte den Satz.',
            'entries.*.text_de.min' => 'Der Satz ist zu kurz.',
            'entries.*.text_de.max' => 'Der Satz darf höchstens 2.000 Zeichen lang sein.',
            'entries.*.source_page.*' => 'Die Seite bitte als ganze Zahl ab 1.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                // A kind that needs one more fact cannot be stored without it — entered one by one.
                foreach ((array) $this->input('entries', []) as $i => $entry) {
                    $kind = is_array($entry) ? ($entry['kind'] ?? null) : null;
                    $missing = match ($kind) {
                        ConditionKind::Karosserieform->value => ! is_array($entry['body_forms'] ?? null) || $entry['body_forms'] === [],
                        ConditionKind::Antrieb->value => ! is_array($entry['drive'] ?? null) || ! isset($entry['drive']['mode'], $entry['drive']['drive']),
                        ConditionKind::ReifenTragfaehigkeit->value => ! is_numeric($entry['max_axle_load_kg'] ?? null),
                        ConditionKind::ReifenAchse->value => ! in_array($entry['axle'] ?? null, ['FRONT', 'REAR'], true),
                        default => false,
                    };

                    if ($missing && ! $validator->errors()->has("entries.{$i}.kind")) {
                        $validator->errors()->add("entries.{$i}.kind", 'Diese Art braucht eine Angabe mehr. Trag den Code bitte einzeln ein.');
                    }

                }
            },
        ];
    }

    /** @return list<ConditionInput> */
    public function entries(): array
    {
        $out = [];

        foreach ((array) $this->validated('entries') as $entry) {
            $drive = $entry['drive'] ?? null;
            $forms = $entry['body_forms'] ?? null;

            $out[] = [
                'code' => (string) $entry['code'],
                'kind' => (string) $entry['kind'],
                'text_de' => (string) $entry['text_de'],
                'source_page' => isset($entry['source_page']) ? (int) $entry['source_page'] : null,
                'body_forms' => is_array($forms) ? array_values(array_map('strval', $forms)) : null,
                'drive' => is_array($drive) && isset($drive['mode'], $drive['drive']) ? ['mode' => (string) $drive['mode'], 'drive' => (string) $drive['drive']] : null,
                'max_axle_load_kg' => isset($entry['max_axle_load_kg']) ? (int) $entry['max_axle_load_kg'] : null,
                'axle' => isset($entry['axle']) && is_string($entry['axle']) ? $entry['axle'] : null,
            ];
        }

        return $out;
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
