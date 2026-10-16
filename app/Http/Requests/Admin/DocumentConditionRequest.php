<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Services\Admin\Approvals\DocumentConditions;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * One entry of a Gutachten's Auflagenverzeichnis, added or changed while the document is a draft
 * (ApprovalDocumentPolicy::update, R-11). The code is unique within its document, compared exactly as
 * printed; the sentence is whole (R-15); the kind is chosen, never guessed; and the parameter a kind needs
 * is required with it — a Karosserieform code without its body styles could narrow nothing, and would
 * leave the row UNKNOWN.
 *
 * @phpstan-import-type ConditionInput from DocumentConditions
 */
class DocumentConditionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');
        $condition = $this->route('condition');

        if (! $user instanceof AdminUser || ! $document instanceof ApprovalDocument) {
            return false;
        }

        if ($condition !== null && (! $condition instanceof DocumentCondition || $condition->approval_document_id !== $document->id)) {
            return false;
        }

        return $user->can('update', $document);
    }

    protected function prepareForValidation(): void
    {
        $code = $this->input('code');
        $text = $this->input('text_de');

        $this->merge([
            // A space copied from a PDF may be a no-break space: one plain space between the words; a printed
            // closing bracket (`16a)`) is not part of the code (DocumentConditions::normaliseCode).
            'code' => DocumentConditions::normaliseCode($code),
            'text_de' => is_string($text) ? trim((string) preg_replace('/\s+/u', ' ', $text)) : $text,
        ]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        // Taking an entry away sends nothing but the entry in the URL: only the right is asked.
        if ($this->isMethod('DELETE')) {
            return [];
        }

        $document = $this->route('document');
        $condition = $this->route('condition');
        $kind = $this->input('kind');

        return [
            'code' => [
                'required', 'string', 'max:32', 'regex:'.DocumentConditions::CODE,
                Rule::unique('document_conditions', 'code')
                    ->where('approval_document_id', $document instanceof ApprovalDocument ? $document->id : 0)
                    ->ignore($condition instanceof DocumentCondition ? $condition->id : null),
            ],
            'kind' => ['required', Rule::in(ConditionKind::values())],
            'text_de' => ['required', 'string', 'min:5', 'max:2000'],
            'source_page' => ['nullable', 'integer', 'min:1', 'max:2000'],
            'body_forms' => [$kind === ConditionKind::Karosserieform->value ? 'required' : 'nullable', 'array', 'min:1'],
            'body_forms.*' => ['string', 'distinct', Rule::in(DocumentConditions::BODY_FORMS)],
            'drive' => [$kind === ConditionKind::Antrieb->value ? 'required' : 'nullable', 'array'],
            'drive.mode' => [$kind === ConditionKind::Antrieb->value ? 'required' : 'nullable', Rule::in(['only', 'not'])],
            'drive.drive' => [$kind === ConditionKind::Antrieb->value ? 'required' : 'nullable', Rule::in(DocumentConditions::DRIVES)],
            'max_axle_load_kg' => [$kind === ConditionKind::ReifenTragfaehigkeit->value ? 'required' : 'nullable', 'integer', 'min:200', 'max:4000'],
            'axle' => [$kind === ConditionKind::ReifenAchse->value ? 'required' : 'nullable', Rule::in(['FRONT', 'REAR'])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'code.required' => 'Bitte den Code so, wie das Gutachten ihn druckt, zum Beispiel A01.',
            'code.max' => DocumentConditions::CODE_MESSAGE,
            'code.regex' => DocumentConditions::CODE_MESSAGE,
            'code.unique' => 'Diesen Code gibt es in diesem Gutachten schon.',
            'kind.*' => 'Bitte wähl, was für eine Auflage das ist.',
            'text_de.required' => 'Bitte den Satz aus dem Gutachten, so wie ihn eine Kundin oder ein Kunde lesen soll.',
            'text_de.min' => 'Der Satz ist zu kurz. Schreib ihn ganz aus.',
            'text_de.max' => 'Der Satz darf höchstens 2.000 Zeichen lang sein.',
            'source_page.*' => 'Die Seite bitte als ganze Zahl ab 1.',
            'body_forms.required' => 'Bitte kreuz an, für welche Karosserieformen die Zeile gilt.',
            'body_forms.*' => 'Bitte kreuz an, für welche Karosserieformen die Zeile gilt.',
            'drive.*' => 'Bitte wähl, mit oder ohne welchen Antrieb die Zeile gilt.',
            'drive.mode.*' => 'Bitte wähl „nur mit“ oder „nicht mit“.',
            'drive.drive.*' => 'Bitte wähl den Antrieb.',
            'max_axle_load_kg.required' => 'Bitte die zulässige Achslast in kg, bis zu der der Code gilt — sie steht im Satz des Gutachtens.',
            'max_axle_load_kg.*' => 'Die Achslast bitte in ganzen Kilogramm, zwischen 200 und 4.000.',
            'axle.*' => 'Bitte wähl die Achse, auf die der Code die Reifengröße beschränkt.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $document = $this->route('document');
                $page = $this->input('source_page');

                if ($document instanceof ApprovalDocument && $document->page_count !== null && is_numeric($page) && (int) $page > $document->page_count && ! $validator->errors()->has('source_page')) {
                    $validator->errors()->add('source_page', "Das Gutachten hat nur {$document->page_count} Seiten.");
                }

            },
        ];
    }

    /** @return ConditionInput */
    public function payload(): array
    {
        $drive = $this->validated('drive');
        $forms = $this->validated('body_forms');

        return [
            'code' => (string) $this->validated('code'),
            'kind' => (string) $this->validated('kind'),
            'text_de' => (string) $this->validated('text_de'),
            'source_page' => $this->validated('source_page') === null ? null : (int) $this->validated('source_page'),
            'body_forms' => is_array($forms) ? array_values(array_map('strval', $forms)) : null,
            'drive' => is_array($drive) && isset($drive['mode'], $drive['drive']) ? ['mode' => (string) $drive['mode'], 'drive' => (string) $drive['drive']] : null,
            'max_axle_load_kg' => $this->validated('max_axle_load_kg') === null ? null : (int) $this->validated('max_axle_load_kg'),
            'axle' => is_string($this->validated('axle')) ? (string) $this->validated('axle') : null,
        ];
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
