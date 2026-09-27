<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\ConditionSeverity;
use App\Models\AdminUser;
use App\Models\ConditionCode;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * One Auflage of the Auflagen-Katalog (ConditionCodePolicy; the route names the step): its stable
 * key, how heavy it is, and the full German sentence every customer reads — never a code (R-15). A
 * sentence starts with a capital and ends with a full stop; that is checked, not hoped for.
 */
class ConditionCodeRequest extends FormRequest
{
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
            'text' => ['required', 'string', 'min:12', 'max:600', 'regex:/^[A-ZÄÖÜ0-9„].*[.!]$/u'],
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
            'severity.*' => 'Bitte wähl, wie schwer die Auflage wiegt.',
            'text.required' => 'Bitte schreib die Auflage als ganzen Satz, so wie der Kunde sie lesen soll.',
            'text.min' => 'Das ist zu kurz für einen ganzen Satz.',
            'text.max' => 'Die Auflage darf höchstens 600 Zeichen lang sein.',
            'text.regex' => 'Bitte als ganzen Satz: mit einem Großbuchstaben am Anfang und einem Punkt am Ende.',
            'affects_tyre_choice.*' => 'Bitte sag, ob die Auflage die Reifenwahl einschränkt.',
            'requires_acknowledgement.*' => 'Bitte sag, ob der Kunde die Auflage bestätigen muss.',
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
