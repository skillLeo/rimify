<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

/** „Passwort vergessen“: the address a new link goes to — the answer is the same whether an account exists or not. */
class CustomerEmailRequest extends FormRequest
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
        return ['email' => ['required', 'string', 'email', 'max:190']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'email.required' => 'Bitte gib deine E-Mail-Adresse an.',
            'email.email' => 'Diese E-Mail-Adresse ist unvollständig – sie braucht ein @ und eine Domain.',
        ];
    }
}
