<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\StorageSetting;
use Illuminate\Foundation\Http\FormRequest;
use SensitiveParameter;

/**
 * „Buckets von AWS laden“: the names the key may see (ListBuckets), so the operator picks the real
 * one instead of typing it. Keys as on the form — empty keeps the stored ones; never flashed back
 * (bootstrap/app.php `dontFlash`).
 */
class StorageBucketsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', StorageSetting::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'region' => ['required', 'string', 'max:32', 'regex:/^[a-z]{2}(-[a-z]+)+-\d$/'],
            'endpoint' => ['nullable', 'string', 'url:https,http', 'max:255'],
            'path_style' => ['nullable', 'boolean'],
            'access_key' => ['nullable', 'string', 'min:16', 'max:128', 'regex:/^[A-Z0-9]+$/'],
            'secret' => ['nullable', 'string', 'min:30', 'max:128'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return (new StorageSettingsRequest)->messages();
    }

    /** @return array{region: string, endpoint: string|null, path_style: bool, access_key: string|null, secret: string|null} */
    public function values(): array
    {
        return [
            'region' => (string) $this->validated('region'),
            'endpoint' => self::entered($this->input('endpoint')),
            'path_style' => $this->boolean('path_style'),
            'access_key' => self::entered($this->input('access_key')),
            'secret' => self::entered($this->input('secret')),
        ];
    }

    private static function entered(#[SensitiveParameter] mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
