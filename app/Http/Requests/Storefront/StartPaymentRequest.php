<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

/**
 * „Zahlungspflichtig bestellen“ with a payment provider in the page (KasseZahlungController): the checkout form as
 * PlaceOrderRequest takes it, and the token of what the page showed (CheckoutShown), so the server can tell whether
 * the basket is still that.
 */
class StartPaymentRequest extends PlaceOrderRequest
{
    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [...parent::rules(), 'shown' => ['required', 'string', 'regex:/^[a-f0-9]{16}\.[a-f0-9]{16}$/']];
    }

    public function shown(): string
    {
        return (string) $this->validated('shown');
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [...parent::messages(), 'shown.required' => 'Lade die Kasse bitte neu – deine Eingaben bleiben erhalten.', 'shown.regex' => 'Lade die Kasse bitte neu – deine Eingaben bleiben erhalten.'];
    }
}
