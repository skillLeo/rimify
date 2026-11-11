<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Services\Storefront\Basket;
use App\Support\Shipping;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * The customer's shipping method at the checkout (his round of 08.11, §7B; D-449). Guest checkout, nobody to authorise. Only
 * the method's id travels — no price: the server prices it for the basket and re-renders the totals itself, and it takes
 * only a method that is active and ships what the basket holds.
 */
class ShippingChoiceRequest extends FormRequest
{
    public const UNKNOWN = 'Diese Versandart gibt es für deinen Warenkorb nicht. Wähl bitte eine der angezeigten.';

    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'versandart' => ['required', 'integer', 'min:1'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'versandart.*' => self::UNKNOWN,
        ];
    }

    /** @return list<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $types = Basket::productTypes(app(Basket::class)->summary($this)['lines']);
            $ids = array_map(static fn (Shipping $option): ?int => $option->id, Shipping::options($types));

            if (! in_array($this->chosen(), $ids, true)) {
                $validator->errors()->add('versandart', self::UNKNOWN);
            }
        }];
    }

    public function chosen(): int
    {
        return (int) $this->input('versandart');
    }
}
