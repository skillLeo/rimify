<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Validator;

/**
 * „Passwort bestätigen“: the signed-in person's own password, once more, before a screen that holds
 * the shop's keys. Checked against the account itself; a wrong one is said in a sentence.
 */
class SudoConfirmRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('admin') instanceof AdminUser;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['password' => ['required', 'string', 'max:200']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['password.required' => 'Gib bitte dein Passwort ein.'];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $user = $this->user('admin');

                if ($validator->errors()->isEmpty() && (! $user instanceof AdminUser || ! Hash::check((string) $this->input('password'), (string) $user->getAuthPassword()))) {
                    $validator->errors()->add('password', 'Das Passwort stimmt nicht. Versuch es bitte noch einmal.');
                }
            },
        ];
    }
}
