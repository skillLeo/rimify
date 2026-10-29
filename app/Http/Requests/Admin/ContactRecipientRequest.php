<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\ContactMessage;
use Illuminate\Foundation\Http\FormRequest;

/** The address the contact form's messages are mailed to (#12, D-347), through ContactMessagePolicy::configure (R-11). */
class ContactRecipientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('configure', ContactMessage::class);
    }

    protected function prepareForValidation(): void
    {
        $address = $this->input('address');
        $this->merge(['address' => is_string($address) ? trim($address) : $address]);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['address' => ['required', 'string', 'max:190', 'email:rfc']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'address.required' => 'Trag die Adresse ein, an die neue Nachrichten gehen sollen.',
            'address.*' => 'Diese E-Mail-Adresse sieht nicht vollständig aus. Bitte prüf sie noch einmal.',
        ];
    }

    public function address(): string
    {
        return (string) $this->validated('address');
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }
}
