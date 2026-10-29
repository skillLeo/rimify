<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\WheelModel;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The one sentence beside every rim's typed stars (#19, D-345; § 5b Abs. 3 UWG): whatever the shop says about where they
 * come from and that it has not checked them. Emptied, the stars stop rendering everywhere. Who may type stars may word
 * it (WheelModelPolicy::rate).
 */
class StatedDisclosureRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('rate', WheelModel::class);
    }

    protected function prepareForValidation(): void
    {
        $text = $this->input('disclosure');
        $this->merge(['disclosure' => is_string($text) ? trim((string) preg_replace('/\s+/u', ' ', $text)) : $text]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['disclosure' => ['present', 'nullable', 'string', 'max:200']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['disclosure.*' => 'Der Satz darf höchstens 200 Zeichen lang sein.'];
    }

    public function disclosure(): string
    {
        return (string) ($this->validated('disclosure') ?? '');
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser ? $user : abort(403);
    }
}
