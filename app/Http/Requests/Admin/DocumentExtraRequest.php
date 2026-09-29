<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentConditionRework;
use App\Models\DocumentFastener;
use App\Models\DocumentNotice;
use App\Support\GermanNumber;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * What a draft Gutachten states beside its codes (the corrections memo §4): a Befestigungsmittel, a
 * Pflichthinweis, or the millimetres of a „Nacharbeit mit Maßen“ code — added or taken away, while the
 * document is a draft (ApprovalDocumentPolicy::update, R-11). The route names which of the three.
 */
class DocumentExtraRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $document = $this->route('document');

        if (! $user instanceof AdminUser || ! $document instanceof ApprovalDocument) {
            return false;
        }

        // A child in the URL belongs to the document in the URL, or nothing is done.
        $child = $this->route('fastener') ?? $this->route('notice') ?? $this->route('rework');

        if ($child !== null && ! self::belongs($child, $document)) {
            return false;
        }

        return $user->can('update', $document);
    }

    private static function belongs(mixed $child, ApprovalDocument $document): bool
    {
        return match (true) {
            $child instanceof DocumentFastener, $child instanceof DocumentNotice => $child->approval_document_id === $document->id,
            $child instanceof DocumentConditionRework => $child->condition?->approval_document_id === $document->id,
            default => false,
        };
    }

    /** Which of the three the route is about. */
    public function extra(): string
    {
        $name = (string) $this->route()?->getName();

        return match (true) {
            str_contains($name, 'befestigungsmittel') => 'fastener',
            str_contains($name, 'hinweis') => 'notice',
            default => 'rework',
        };
    }

    protected function prepareForValidation(): void
    {
        $trimmed = [];

        foreach (['number', 'thread', 'seat', 'article_number', 'vehicle_types', 'text_de', 'vehicle_type', 'note_de'] as $key) {
            $value = $this->input($key);

            if (is_string($value)) {
                $trimmed[$key] = trim((string) preg_replace('/\s+/u', ' ', $value));
            }
        }

        foreach (['torque_nm', 'shaft_length_mm', 'source_page'] as $key) {
            if ($this->input($key) === '') {
                $trimmed[$key] = null;
            }
        }

        $this->merge($trimmed);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        if ($this->isMethod('DELETE')) {
            return [];
        }

        $document = $this->route('document');
        $documentId = $document instanceof ApprovalDocument ? $document->id : 0;

        return match ($this->extra()) {
            'fastener' => [
                'number' => ['required', 'string', 'max:16', Rule::unique('document_fasteners', 'number')->where('approval_document_id', $documentId)],
                'thread' => ['required', 'string', 'max:32'],
                'seat' => ['required', 'string', 'max:48'],
                'torque_nm' => ['nullable', 'integer', 'between:50,300'],
                'shaft_length_mm' => ['nullable', 'integer', 'between:10,120'],
                'article_number' => ['nullable', 'string', 'max:64'],
                'vehicle_types' => ['nullable', 'string', 'max:255'],
                'source_page' => ['nullable', 'integer', 'min:1', 'max:2000'],
            ],
            'notice' => [
                'text_de' => ['required', 'string', 'min:10', 'max:1000'],
                'source_page' => ['nullable', 'integer', 'min:1', 'max:2000'],
            ],
            default => [
                'document_condition_id' => ['required', 'integer', Rule::exists('document_conditions', 'id')->where('approval_document_id', $documentId)->where('kind', ConditionKind::Nacharbeitsprofil->value)],
                'vehicle_type' => ['required', 'string', 'max:64'],
                'axle' => ['required', Rule::in(['FRONT', 'REAR', 'ALL'])],
                'from_mm' => ['nullable', 'string', 'max:8'],
                'to_mm' => ['nullable', 'string', 'max:8'],
                'flare_mm' => ['nullable', 'string', 'max:8'],
                'note_de' => ['nullable', 'string', 'max:500'],
            ],
        };
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'number.required' => 'Bitte die Nummer, so wie das Gutachten das Befestigungsmittel nennt, zum Beispiel S01.',
            'number.unique' => 'Diese Nummer gibt es in diesem Gutachten schon.',
            'number.max' => 'Die Nummer hat höchstens 16 Zeichen.',
            'thread.*' => 'Bitte das Gewinde, zum Beispiel M14x1,25.',
            'seat.*' => 'Bitte den Sitz, zum Beispiel Kegelbund 60°.',
            'torque_nm.*' => 'Das Anzugsmoment bitte in ganzen Newtonmetern, zwischen 50 und 300.',
            'shaft_length_mm.*' => 'Die Schaftlänge bitte in ganzen Millimetern, zwischen 10 und 120.',
            'source_page.*' => 'Die Seite bitte als ganze Zahl ab 1.',
            'text_de.required' => 'Bitte den Hinweis als ganzen Satz, so wie er im Gutachten steht.',
            'text_de.min' => 'Der Satz ist zu kurz. Schreib ihn ganz aus.',
            'text_de.max' => 'Der Hinweis darf höchstens 1.000 Zeichen lang sein.',
            'document_condition_id.*' => 'Bitte wähl den Code der Nacharbeit – einen Code dieses Gutachtens der Art „Nacharbeit mit Maßen“.',
            'vehicle_type.*' => 'Bitte den Fahrzeugtyp, so wie das Gutachten ihn nennt, zum Beispiel 3C.',
            'axle.*' => 'Bitte wähl die Achse.',
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

                if ($this->isMethod('DELETE') || $this->extra() !== 'rework') {
                    return;
                }

                $values = [];

                foreach (['from_mm' => [0, 400], 'to_mm' => [0, 400], 'flare_mm' => [0, 60]] as $field => [$min, $max]) {
                    $raw = $this->input($field);

                    if (! is_string($raw) || trim($raw) === '') {
                        continue;
                    }

                    $value = GermanNumber::parse($raw, 1);

                    if ($value === null || (float) $value < $min || (float) $value > $max) {
                        $validator->errors()->add($field, "Das Maß bitte in Millimetern, zwischen {$min} und {$max}, zum Beispiel 12,5.");
                    } else {
                        $values[$field] = (float) $value;
                    }
                }

                if ($values === [] && ! $validator->errors()->hasAny(['from_mm', 'to_mm', 'flare_mm'])) {
                    $validator->errors()->add('from_mm', 'Bitte mindestens ein Maß: von, bis oder die Aufweitung.');
                }

                if (isset($values['from_mm'], $values['to_mm']) && $values['from_mm'] > $values['to_mm']) {
                    $validator->errors()->add('to_mm', '„Bis“ ist kleiner als „von“.');
                }
            },
        ];
    }

    /** @return array<string, mixed> the columns to store, read the German way */
    public function payload(): array
    {
        $decimal = fn (string $key): ?float => is_string($this->validated($key)) && trim((string) $this->validated($key)) !== ''
            ? (float) GermanNumber::parse((string) $this->validated($key), 1)
            : null;

        return match ($this->extra()) {
            'fastener' => [
                'number' => (string) $this->validated('number'),
                'thread' => (string) $this->validated('thread'),
                'seat' => (string) $this->validated('seat'),
                'torque_nm' => $this->validated('torque_nm') === null ? null : (int) $this->validated('torque_nm'),
                'shaft_length_mm' => $this->validated('shaft_length_mm') === null ? null : (int) $this->validated('shaft_length_mm'),
                'article_number' => self::nullable($this->validated('article_number')),
                'vehicle_types' => self::nullable($this->validated('vehicle_types')),
                'source_page' => $this->validated('source_page') === null ? null : (int) $this->validated('source_page'),
            ],
            'notice' => [
                'text_de' => (string) $this->validated('text_de'),
                'source_page' => $this->validated('source_page') === null ? null : (int) $this->validated('source_page'),
            ],
            default => [
                'document_condition_id' => (int) $this->validated('document_condition_id'),
                'vehicle_type' => (string) $this->validated('vehicle_type'),
                'axle' => (string) $this->validated('axle'),
                'from_mm' => $decimal('from_mm'),
                'to_mm' => $decimal('to_mm'),
                'flare_mm' => $decimal('flare_mm'),
                'note_de' => self::nullable($this->validated('note_de')),
            ],
        };
    }

    private static function nullable(mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }

    /** The child in the URL, for a removal. */
    public function child(): ?Model
    {
        $child = $this->route('fastener') ?? $this->route('notice') ?? $this->route('rework');

        return $child instanceof Model ? $child : null;
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
