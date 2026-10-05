<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Services\Reset\ResetLevel;
use App\Services\Reset\TestEnvironment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * „Zurücksetzen“ on Einstellungen › System › Testumgebung zurücksetzen: the Super-Admin alone (TestResetPolicy), a
 * level, and the word typed — checked here again, not only in the dialog, so no request without it resets anything.
 */
class TestResetRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('reset', TestEnvironment::class);
    }

    /** A 404, never a 403: the address does not say there is something behind it (EnsureResetPermitted). */
    protected function failedAuthorization(): void
    {
        abort(404);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'level' => ['required', 'string', Rule::enum(ResetLevel::class)],
            'confirmation' => ['required', 'string', 'max:40'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'level.required' => 'Wähl eine Stufe aus.',
            'level.enum' => 'Wähl eine der drei Stufen aus.',
            'confirmation.required' => 'Tippe „'.TestEnvironment::WORD.'“, um zu bestätigen.',
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('confirmation') === false && ! $this->confirmedWord()) {
                    $validator->errors()->add('confirmation', 'Tippe genau „'.TestEnvironment::WORD.'“, um zu bestätigen.');
                }
            },
        ];
    }

    public function level(): ResetLevel
    {
        return ResetLevel::from((string) $this->validated('level'));
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }

    private function confirmedWord(): bool
    {
        return trim((string) $this->input('confirmation')) === TestEnvironment::WORD;
    }
}
