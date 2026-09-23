<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Services\Storefront\Basket;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * The answer to „Brauchst du RDKS-Sensoren?" (docs/specs/komplettrad.md §5.3).
 *
 * Guest checkout, nobody to authorise. The answer is `ja` or `nein` and nothing else — no price
 * travels with it: the server quotes the sensor from `tpms_sensor_prices` for the current
 * vehicle's make when it stores the answer, and re-renders the totals itself.
 */
class TpmsChoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'choice' => ['required', Rule::in(['ja', 'nein'])],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'choice.required' => Basket::TPMS_UNANSWERED_REFUSAL,
            'choice.in' => Basket::TPMS_UNANSWERED_REFUSAL,
        ];
    }

    public function choice(): string
    {
        return (string) $this->validated('choice');
    }
}
