<?php

declare(strict_types=1);

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class SearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'q' => ['required', 'string', 'max:80'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'q.required' => 'Gib einen Suchbegriff ein.',
            'q.max' => 'Der Suchbegriff darf höchstens 80 Zeichen lang sein.',
        ];
    }

    public function term(): string
    {
        return $this->string('q')->toString();
    }
}
