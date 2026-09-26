<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

/**
 * Changing your own password.
 *
 * The current password is required even though the session is already signed in: a panel left open
 * on a shared desk must not let the next person lock its owner out. Twelve characters is the floor
 * the security brief sets (BRIEF-2 §3). The breached-password check that brief also asks for calls
 * an outside service and needs its own answer for when that service is down, so it arrives with the
 * security step rather than as a rule that silently passes when the network fails.
 */
class AdminPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('admin') instanceof AdminUser;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', 'current_password:admin'],
            'password' => ['required', 'string', 'confirmed', 'different:current_password', Password::min(12)],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'current_password.required' => 'Bitte gib dein aktuelles Passwort ein.',
            'current_password.current_password' => 'Das aktuelle Passwort stimmt nicht.',
            'password.required' => 'Bitte gib ein neues Passwort ein.',
            'password.confirmed' => 'Die beiden neuen Passwörter stimmen nicht überein.',
            'password.different' => 'Das neue Passwort muss sich vom aktuellen unterscheiden.',
            'password.min' => 'Das neue Passwort braucht mindestens 12 Zeichen.',
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

    public function newPassword(): string
    {
        return (string) $this->validated('password');
    }
}
