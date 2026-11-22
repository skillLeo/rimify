<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Setting up the second factor, or changing it (D-514): the signed-in person's own, and nobody else's — nothing here
 * takes an id, as on Profil. The code is the one the app shows for the key on the screen; recovery codes and switching
 * off carry no field.
 */
class TwoFactorSetupRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('admin') instanceof AdminUser;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return $this->isMethod('POST') && $this->routeIs('admin.zwei-faktor.bestaetigen')
            ? ['code' => ['required', 'string', 'max:16']]
            : [];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['code.required' => 'Bitte gib den Code aus deiner App ein.'];
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
