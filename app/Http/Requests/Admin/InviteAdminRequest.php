<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Enums\PermissionAction;
use App\Enums\PermissionModule;
use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;

/**
 * *Person einladen*: an address, an optional name, and the role the account will hold.
 *
 * Only whoever may create in Rollen & Rechte may invite (R-11). Whether the address is free and
 * whether this person may hand out that role are asked by the controller, against the database as it
 * is at that moment — see BenutzerController::invite().
 */
class InviteAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->may(PermissionModule::Roles, PermissionAction::Create);
    }

    /** An address is compared as it would be typed into the sign-in form: trimmed, lower case. */
    protected function prepareForValidation(): void
    {
        $email = $this->input('email');
        $name = $this->input('name');

        $this->merge([
            'email' => is_string($email) ? mb_strtolower(trim($email)) : $email,
            'name' => is_string($name) && trim($name) !== '' ? trim($name) : null,
        ]);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'string', 'email:rfc,filter_unicode', 'max:255'],
            'role_id' => ['required', 'integer'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'name.max' => 'Der Name darf höchstens 255 Zeichen lang sein.',
            'email.required' => 'Bitte gib die E-Mail-Adresse der Person ein.',
            'email.email' => 'Das sieht nicht nach einer E-Mail-Adresse aus.',
            'email.max' => 'Die E-Mail-Adresse darf höchstens 255 Zeichen lang sein.',
            'role_id.required' => 'Bitte wähle eine Rolle.',
            'role_id.integer' => 'Bitte wähle eine Rolle aus der Liste.',
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

    public function email(): string
    {
        return (string) $this->validated('email');
    }

    public function name(): ?string
    {
        $name = $this->validated('name');

        return is_string($name) ? $name : null;
    }

    public function roleId(): int
    {
        return (int) $this->validated('role_id');
    }
}
