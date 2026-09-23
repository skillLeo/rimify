<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class FitmentNotifyRequest extends FormRequest
{
    /**
     * Refused, before any validation, while outgoing mail is not configured: the double opt-in
     * could not arrive, so a subscription would be a promise nobody keeps (rimify.features.notify_by_mail).
     */
    public function authorize(): bool
    {
        return (bool) config('rimify.features.notify_by_mail');
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['email' => mb_strtolower(trim((string) $this->input('email')))]);
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'fahrzeug' => ['required', 'integer', 'min:1', 'exists:vehicles,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Bitte gib deine E-Mail-Adresse an.',
            'email.email' => 'Das sieht nicht nach einer E-Mail-Adresse aus.',
            'email.max' => 'Die E-Mail-Adresse ist zu lang.',
            'fahrzeug.required' => 'Bitte wähle zuerst dein Fahrzeug.',
            'fahrzeug.exists' => 'Dieses Fahrzeug kennen wir nicht.',
        ];
    }

    public function email(): string
    {
        return (string) $this->validated('email');
    }

    public function vehicleId(): int
    {
        return (int) $this->validated('fahrzeug');
    }
}
