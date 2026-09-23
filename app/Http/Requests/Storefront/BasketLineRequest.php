<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Adding one basket line.
 *
 * Only wheels: RIMIFY sells Felgen alone or Kompletträder, never a standalone tyre (ACCURACY.md
 * D6), and the server refuses one whatever a page or a hand-made request sends (R-11). A
 * Komplettrad is a WHEEL line carrying its tyre; whether that tyre may go on this wheel on this
 * car is not a validation question — `Basket::refusalFor()` asks the fitment engine, with the
 * posted quantity, before anything reaches the session (docs/specs/komplettrad.md §4.3–§4.4).
 *
 * Quantity is capped, because a stepper held down is indistinguishable from a script and neither
 * should be able to ask the pricing code for a total that overflows. Four is the normal order;
 * ninety-nine is generous enough that no honest customer meets the limit.
 */
class BasketLineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'kind' => ['required', Rule::in(['WHEEL'])],
            'wheelConfigId' => ['required', 'integer', 'min:1'],
            'tyreVariantId' => ['nullable', 'integer', 'min:1'],
            'weightColourId' => ['nullable', 'integer', 'min:1'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'kind.required' => 'Bitte wähle zuerst eine Felge.',
            'kind.in' => 'Reifen gibt es bei uns nur zusammen mit einer Felge als Komplettrad.',
            'wheelConfigId.required' => 'Bitte wähle zuerst eine Größe.',
            'wheelConfigId.integer' => 'Bitte wähle zuerst eine Größe.',
            'wheelConfigId.min' => 'Bitte wähle zuerst eine Größe.',
            'tyreVariantId.integer' => 'Bitte wähle zuerst einen Reifen.',
            'tyreVariantId.min' => 'Bitte wähle zuerst einen Reifen.',
            'weightColourId.integer' => 'Bitte wähle eine Farbe für die Wuchtgewichte.',
            'weightColourId.min' => 'Bitte wähle eine Farbe für die Wuchtgewichte.',
            'quantity.required' => 'Bitte gib eine Menge an.',
            'quantity.integer' => 'Bitte gib eine Menge als ganze Zahl an.',
            'quantity.min' => 'Die Menge muss mindestens 1 sein.',
            'quantity.max' => 'Mehr als 99 Stück passen nicht in eine Position.',
        ];
    }

    public function quantity(): int
    {
        return (int) $this->validated('quantity');
    }

    public function wheelConfigId(): int
    {
        return (int) $this->validated('wheelConfigId');
    }

    /** The tyre of a Komplettrad; null for a Felgen-only line. */
    public function tyreVariantId(): ?int
    {
        $value = $this->validated('tyreVariantId');

        return $value === null ? null : (int) $value;
    }

    /** The Wuchtgewichte colour, if the page chose one; null lets the basket assign the default. */
    public function weightColourId(): ?int
    {
        $value = $this->validated('weightColourId');

        return $value === null ? null : (int) $value;
    }
}
