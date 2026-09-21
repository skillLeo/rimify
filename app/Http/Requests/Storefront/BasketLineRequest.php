<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Adding or changing one basket line.
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
            'kind' => ['required', Rule::in(['WHEEL', 'TYRE'])],
            'wheelConfigId' => ['nullable', 'integer', 'min:1', 'required_if:kind,WHEEL'],
            'tyreVariantId' => ['nullable', 'integer', 'min:1', 'required_if:kind,TYRE'],
            'quantity' => ['required', 'integer', 'min:1', 'max:99'],
        ];
    }

    public function kind(): string
    {
        return (string) $this->validated('kind');
    }

    public function quantity(): int
    {
        return (int) $this->validated('quantity');
    }

    public function referenceId(): int
    {
        return $this->kind() === 'TYRE'
            ? (int) $this->validated('tyreVariantId')
            : (int) $this->validated('wheelConfigId');
    }
}
