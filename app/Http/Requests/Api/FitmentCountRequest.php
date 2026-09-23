<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Either a vehicle id from the guided route, or the two key numbers. The key numbers are
 * normalised the way the selector normalises them — upper case, no surrounding space — so a
 * pasted "0005 " counts the same car the form would.
 */
class FitmentCountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'hsn' => $this->has('hsn') ? mb_strtoupper(trim((string) $this->input('hsn'))) : null,
            'tsn' => $this->has('tsn') ? mb_strtoupper(trim((string) $this->input('tsn'))) : null,
        ]);
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'fahrzeug' => ['required_without_all:hsn,tsn', 'nullable', 'integer', 'min:1'],
            'hsn' => ['required_without:fahrzeug', 'nullable', 'string', 'size:4', 'regex:/^[0-9A-Z]{4}$/'],
            'tsn' => ['required_without:fahrzeug', 'nullable', 'string', 'size:3', 'regex:/^[0-9A-Z]{3}$/'],
        ];
    }

    public function vehicleId(): ?int
    {
        $id = $this->validated('fahrzeug');

        return $id === null ? null : (int) $id;
    }

    public function hsn(): string
    {
        return (string) $this->validated('hsn');
    }

    public function tsn(): string
    {
        return (string) $this->validated('tsn');
    }
}
