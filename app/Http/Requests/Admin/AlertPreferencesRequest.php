<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Admin\AdminAlerts;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Was du bekommst“: per kind of alert, in the admin yes or no, by e-mail yes or no.
 *
 * A person's own choices, so any signed-in account may send them. Kinds this person may not receive
 * are refused here rather than quietly stored: AdminAlerts::remember keeps only what was offered.
 */
class AlertPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('admin') instanceof AdminUser;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'kinds' => ['required', 'array', 'max:'.count(AdminAlerts::KINDS)],
            'kinds.*.kind' => ['required', 'string', 'in:'.implode(',', array_keys(AdminAlerts::KINDS)), 'distinct'],
            'kinds.*.inApp' => ['required', 'boolean'],
            'kinds.*.email' => ['required', 'boolean'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        // Nothing here is typed by hand — every field is a switch the page drew — so a refusal
        // means the page is out of date, and every rule says the same thing.
        $message = 'Diese Auswahl können wir nicht speichern. Lade die Seite neu und versuch es noch einmal.';
        $messages = [];

        foreach ($this->rules() as $field => $rules) {
            foreach ($rules as $rule) {
                $messages[$field.'.'.explode(':', $rule)[0]] = $message;
            }
        }

        return $messages;
    }

    /** @return array<string, array{inApp: bool, email: bool}> */
    public function choices(): array
    {
        /** @var list<array{kind: string, inApp: mixed, email: mixed}> $rows */
        $rows = $this->validated('kinds');
        $choices = [];

        foreach ($rows as $row) {
            $choices[$row['kind']] = ['inApp' => (bool) $row['inApp'], 'email' => (bool) $row['email']];
        }

        return $choices;
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
