<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Services\Storefront\Basket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Choosing the Wuchtgewichte colour of one Komplettrad line (docs/specs/komplettrad.md §4.10).
 *
 * Guest basket, nobody to authorise. The colour must exist as a live row; whether it is still
 * ACTIVE is re-checked by `Basket::setWeightColour()` on the server, whatever tiles the page
 * offered (R-11) — an admin may have deactivated it a second ago.
 */
class BasketWeightColourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'colourId' => [
                'required',
                'integer',
                'min:1',
                Rule::exists('balance_weight_colours', 'id')->whereNull('deleted_at'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'colourId.required' => 'Bitte wähle eine Farbe für die Wuchtgewichte.',
            'colourId.integer' => 'Bitte wähle eine Farbe für die Wuchtgewichte.',
            'colourId.min' => 'Bitte wähle eine Farbe für die Wuchtgewichte.',
            'colourId.exists' => Basket::WEIGHT_COLOUR_GONE,
        ];
    }

    public function colourId(): int
    {
        return (int) $this->validated('colourId');
    }
}
