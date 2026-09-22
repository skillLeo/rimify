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
 * Komplettrad will be a WHEEL line carrying its tyre; until that tyre can be checked against the
 * fitment's permitted sizes, a line with a tyre is refused rather than silently stripped of it.
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
            'tyreVariantId' => ['prohibited'],
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
            'tyreVariantId.prohibited' => 'Kompletträder kannst du noch nicht in den Warenkorb legen.',
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
}
