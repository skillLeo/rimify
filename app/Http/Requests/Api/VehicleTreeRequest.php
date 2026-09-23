<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

/**
 * One step of the make → model → variant drill. The model is required only on the variant step;
 * the controller decides which step it is serving.
 */
class VehicleTreeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'marke' => ['required', 'string', 'max:64'],
            'modell' => ['sometimes', 'required', 'string', 'max:64'],
        ];
    }

    public function make(): string
    {
        return trim((string) $this->validated('marke'));
    }

    public function model(): string
    {
        return trim((string) $this->validated('modell', ''));
    }
}
