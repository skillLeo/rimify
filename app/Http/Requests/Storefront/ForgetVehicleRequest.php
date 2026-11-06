<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Support\ShopPath;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Fahrzeug entfernen“. Open to anyone: it forgets the visitor's own cookie. A page the car was chosen for names itself, so the
 * visitor stays on it: a shop path, anything else as none.
 */
class ForgetVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['zurueck' => ['nullable', 'string', 'max:255']];
    }

    /** The shop page to stay on; null opens the selector as before. */
    public function returnTo(): ?string
    {
        return ShopPath::of($this->validated('zurueck'));
    }
}
