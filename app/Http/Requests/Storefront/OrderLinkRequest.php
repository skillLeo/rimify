<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;

/**
 * „Neuen Link schicken“ on the page an expired order link opens (D-240): the order number and the address the order
 * went to. Open to anyone — the answer never says whether the two belong together (BestellungLinkController), and
 * OrderPolicy::resendLink decides for the order found.
 */
class OrderLinkRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'order_number' => ['required', 'string', 'max:32'],
            'email' => ['required', 'string', 'email:rfc', 'max:254'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'order_number.required' => 'Bitte gib die Bestellnummer an – sie steht in der Bestätigung, zum Beispiel 2611-10487.',
            'order_number.max' => 'Diese Bestellnummer ist zu lang. Sie sieht so aus: 2611-10487.',
            'email.required' => 'Bitte gib die E-Mail-Adresse an, an die die Bestätigung ging.',
            'email.email' => 'Bitte gib eine gültige E-Mail-Adresse an.',
            'email.max' => 'Diese E-Mail-Adresse ist zu lang.',
        ];
    }

    public function number(): string
    {
        return mb_strtoupper(trim((string) $this->validated('order_number')));
    }

    public function email(): string
    {
        return mb_strtolower(trim((string) $this->validated('email')));
    }
}
