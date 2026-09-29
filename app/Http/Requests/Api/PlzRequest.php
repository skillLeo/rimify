<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * The PLZ lookup (/api/v1/plz/{plz}): public data, asked by a guest at the checkout, so every visitor may ask. The
 * route admits five digits only; the rule says so again for the request itself.
 */
class PlzRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['plz' => $this->route('plz')]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return ['plz' => ['required', 'string', 'regex:/^\d{5}$/']];
    }

    public function plz(): string
    {
        return (string) $this->validated('plz');
    }
}
