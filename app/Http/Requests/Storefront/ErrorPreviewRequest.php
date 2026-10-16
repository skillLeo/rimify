<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Services\Storefront\ErrorPage;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

/**
 * One of the error pages the shop wrote sentences for, opened on purpose in a test environment (ErrorPagePolicy, D-243).
 * Anything else — the live shop, a status without a page of its own — is the 404 every unknown address gets.
 */
class ErrorPreviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('preview', ErrorPage::class);
    }

    protected function failedAuthorization(): never
    {
        abort(404);
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['status' => (int) $this->route('status')]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'status' => ['required', 'integer', Rule::in(ErrorPage::DESIGNED)],
            // The page that needs neither the bundle nor the database: what a failed boot shows.
            'eigenstaendig' => ['nullable', 'boolean'],
        ];
    }

    protected function failedValidation(Validator $validator): never
    {
        abort(404);
    }

    public function status(): int
    {
        return (int) $this->validated('status');
    }

    public function standalone(): bool
    {
        return $this->boolean('eigenstaendig');
    }
}
