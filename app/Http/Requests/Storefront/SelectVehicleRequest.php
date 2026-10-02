<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Support\ShopPath;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Choosing a variant from the guided tree.
 *
 * Existence is checked against the table rather than assumed: a bookmarked selector URL can name a
 * vehicle an import soft-deleted last night, and that must produce a message, not a verdict
 * computed from a row that is no longer current.
 */
class SelectVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'fahrzeug' => ['required', 'integer', 'min:1'],
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
            'fahrzeug.required' => 'Bitte wähle zuerst eine Variante aus.',
        ];
    }

    public function vehicleId(): int
    {
        return (int) $this->validated('fahrzeug');
    }
}
