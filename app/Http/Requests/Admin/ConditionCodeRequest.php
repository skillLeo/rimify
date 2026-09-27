<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\ConditionSeverity;
use App\Models\AdminUser;
use App\Models\ConditionCode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * One Auflage of the Auflagen-Katalog (ConditionCodePolicy; the route names the step): its stable
 * key, how heavy it is, and the full German sentence every customer reads — never a code (R-15). A
 * sentence starts with a capital and ends with a full stop; that is checked, not hoped for.
 *
 * An Auflage that a freigegebenes Gutachten carries is part of that document: what it says, its
 * Einstufung and what it asks of the customer no longer change (a released Gutachten changes only by a
 * new Fassung). Only its import key may still be corrected. A new wording is a new Auflage.
 */
class ConditionCodeRequest extends FormRequest
{
    /** Said when a released Gutachten's Auflage would change its meaning. */
    public const RELEASED_REFUSAL = 'Diese Auflage steht in einem freigegebenen Gutachten und ändert sich dort nicht mehr. '
        .'Für eine andere Formulierung oder Einstufung leg bitte eine neue Auflage an.';

    /** Whether a row outside a draft carries the Auflage: then its meaning is fixed. */
    public static function released(int $codeId): bool
    {
        return DB::table('fitment_conditions as fc')
            ->join('fitments as f', 'f.id', '=', 'fc.fitment_id')
            ->where('fc.condition_code_id', $codeId)
            ->where('f.status', '!=', 'draft')
            ->exists();
    }

    public const SEVERITY_LABELS = [
        'INFO' => 'Hinweis',
        'ACTION' => 'Aufgabe für den Kunden',
        'WORKSHOP' => 'Werkstatt nötig',
        'RESTRICTION' => 'Einschränkung',
    ];

    public function authorize(): bool
    {
        $user = $this->user('admin');
        $code = $this->route('code');

        if (! $user instanceof AdminUser) {
            return false;
        }

        return match ($this->step()) {
            'store' => $user->can('create', ConditionCode::class),
            'update' => $code instanceof ConditionCode && $user->can('update', $code),
            'destroy' => $code instanceof ConditionCode && $user->can('delete', $code),
            default => $user->can('viewAny', ConditionCode::class),
        };
    }

    protected function prepareForValidation(): void
    {
        if (in_array($this->step(), ['store', 'update'], true)) {
            $this->merge([
                'code' => is_string($this->input('code')) ? strtoupper(trim((string) $this->input('code'))) : $this->input('code'),
                'text' => is_string($this->input('text')) ? trim((string) preg_replace('/\s+/u', ' ', (string) $this->input('text'))) : $this->input('text'),
            ]);
        }
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        if (! in_array($this->step(), ['store', 'update'], true)) {
            return [];
        }

        $code = $this->route('code');

        return [
            'code' => ['required', 'string', 'regex:/^[A-Z][A-Z0-9_]{1,63}$/', Rule::unique('condition_codes', 'code')->ignore($code instanceof ConditionCode ? $code->id : null)],
            'severity' => ['required', Rule::in(ConditionSeverity::values())],
            'text' => ['required', 'string', 'min:12', 'max:600', 'regex:/^[A-ZÄÖÜ0-9„].*[.!][“"]?$/u'],
            'affects_tyre_choice' => ['required', 'boolean'],
            'requires_acknowledgement' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'code.required' => 'Bitte gib der Auflage einen Schlüssel, zum Beispiel RADLAUF_BOERDELN.',
            'code.regex' => 'Der Schlüssel besteht aus Großbuchstaben, Ziffern und Unterstrichen, zum Beispiel RADLAUF_BOERDELN.',
            'code.unique' => 'Diesen Schlüssel hat schon eine andere Auflage.',
            'severity.*' => 'Bitte wähl die Einstufung der Auflage.',
            'text.required' => 'Bitte schreib die Auflage als ganzen Satz, so wie Kundinnen und Kunden sie lesen.',
            'text.min' => 'Das ist zu kurz für einen ganzen Satz.',
            'text.max' => 'Die Auflage darf höchstens 600 Zeichen lang sein.',
            'text.regex' => 'Bitte als ganzen Satz: mit einem Großbuchstaben am Anfang und einem Punkt am Ende.',
            'affects_tyre_choice.*' => 'Bitte sag, ob die Auflage die Reifenwahl einschränkt.',
            'requires_acknowledgement.*' => 'Bitte sag, ob die Auflage vor dem Kauf bestätigt wird.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $code = $this->route('code');

                if ($this->step() !== 'update' || ! $code instanceof ConditionCode || $validator->errors()->isNotEmpty() || ! self::released((int) $code->id)) {
                    return;
                }

                $wanted = $this->codeAttributes();
                $changed = $wanted['text_de'] !== $code->text_de
                    || $wanted['severity'] !== $code->severity->value
                    || $wanted['affects_tyre_choice'] !== (bool) $code->affects_tyre_choice
                    || $wanted['requires_acknowledgement'] !== (bool) $code->requires_acknowledgement;

                if ($changed) {
                    $validator->errors()->add('text', self::RELEASED_REFUSAL);
                }
            },
        ];
    }

    /** @return array{code: string, severity: string, text_de: string, affects_tyre_choice: bool, affects_purchase: bool, requires_acknowledgement: bool} */
    public function codeAttributes(): array
    {
        $severity = ConditionSeverity::from((string) $this->validated('severity'));

        return [
            'code' => (string) $this->validated('code'),
            'severity' => $severity->value,
            'text_de' => (string) $this->validated('text'),
            'affects_tyre_choice' => (bool) $this->validated('affects_tyre_choice'),
            // Anything heavier than a Hinweis makes a verdict CONDITIONAL (ConditionSeverity).
            'affects_purchase' => $severity->affectsPurchaseByDefault(),
            'requires_acknowledgement' => (bool) $this->validated('requires_acknowledgement') || $severity->requiresAcknowledgement(),
        ];
    }

    public function step(): string
    {
        $name = (string) $this->route()?->getName();

        return substr($name, (int) strrpos($name, '.') + 1);
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
