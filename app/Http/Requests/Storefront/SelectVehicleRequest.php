<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

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
        ];
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
