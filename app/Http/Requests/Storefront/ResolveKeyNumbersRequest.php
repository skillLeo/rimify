<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Support\ShopPath;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The two numbers off the Fahrzeugschein.
 *
 * Both are TEXT and stay text. HSN `0005` is not the number five — an integer cast destroys the
 * leading zeros permanently — and TSN mixes digits and letters, with `307` and `AAS` occurring in
 * the same column. They are upper-cased and trimmed here and nowhere else, so every surface that
 * looks a vehicle up normalises identically.
 *
 * The length rules are deliberately loose on TSN: the papers print three characters, but older
 * records carry two, and refusing those would send a real customer away over a formatting rule.
 */
class ResolveKeyNumbersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'hsn' => mb_strtoupper(trim((string) $this->input('hsn'))),
            'tsn' => mb_strtoupper(trim((string) $this->input('tsn'))),
        ]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'hsn' => ['required', 'string', 'size:4', 'regex:/^[0-9A-Z]{4}$/'],
            'tsn' => ['required', 'string', 'min:1', 'max:3', 'regex:/^[0-9A-Z]{1,3}$/'],
            // Where the car was chosen from, if that page wants the visitor back (the RIMIFY-Check, #28): a shop path.
            'zurueck' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** The shop page to return to after the choice; null sends the visitor to the listing as before. */
    public function returnTo(): ?string
    {
        return ShopPath::of($this->validated('zurueck'));
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'hsn.required' => 'Bitte gib die HSN ein – sie steht in Feld 2.1 der Zulassungsbescheinigung Teil I.',
            'hsn.size' => 'Die HSN hat vier Ziffern – führende Nullen gehören dazu.',
            'hsn.regex' => 'Die HSN hat vier Ziffern – führende Nullen gehören dazu.',
            'tsn.required' => 'Bitte gib die TSN ein – die ersten drei Zeichen aus Feld 2.2 der Zulassungsbescheinigung Teil I.',
            'tsn.regex' => 'Die TSN sind die ersten drei Zeichen aus Feld 2.2 – Ziffern oder Buchstaben.',
        ];
    }

    public function hsn(): string
    {
        return (string) $this->validated('hsn');
    }

    public function tsn(): string
    {
        return (string) $this->validated('tsn');
    }
}
