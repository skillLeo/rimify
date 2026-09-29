<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

/** Signing in to Mein Konto: an e-mail address and a password. Anyone may try; the route counts the tries. */
class CustomerLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:190'],
            'password' => ['required', 'string', 'max:200'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.required' => 'Bitte gib deine E-Mail-Adresse an.',
            'email.email' => 'Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.',
            'password.required' => 'Bitte gib dein Passwort ein.',
        ];
    }
}
