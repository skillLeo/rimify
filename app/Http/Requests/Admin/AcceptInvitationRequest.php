<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Accepting an invitation: the name the team will see, and a password chosen twice.
 *
 * Anyone holding the link may try — the link is the credential, and the controller checks it before
 * anything is written. Twelve characters is the floor the security brief sets for every admin
 * password (BRIEF-2 §3), the same as changing it later in Profil.
 */
class AcceptInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $name = $this->input('name');

        if (is_string($name)) {
            $this->merge(['name' => trim($name)]);
        }
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // The length before the repeat: a short password with an empty repeat was told only that the two differ
            // (the admin audit's F-29) — the form shows the first sentence.
            'password' => ['required', 'string', 'max:255', Password::min(12), 'confirmed'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.required' => 'Bitte gib deinen Namen ein.',
            'name.max' => 'Der Name darf höchstens 255 Zeichen lang sein.',
            'password.required' => 'Bitte wähle ein Passwort.',
            'password.confirmed' => 'Die beiden Passwörter stimmen nicht überein.',
            'password.min' => 'Das Passwort braucht mindestens 12 Zeichen.',
            'password.max' => 'Das Passwort darf höchstens 255 Zeichen lang sein.',
        ];
    }

    public function name(): string
    {
        return (string) $this->validated('name');
    }

    public function password(): string
    {
        return (string) $this->validated('password');
    }
}
