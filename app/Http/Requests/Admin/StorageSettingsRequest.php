<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\StorageSetting;
use Illuminate\Foundation\Http\FormRequest;
use SensitiveParameter;

/**
 * Einstellungen › Medien und Speicher, saved or tested. The access key and the secret are
 * write-only: left empty they keep what is stored, filled they replace it; they are never sent back
 * (the page shows their last four characters) and never flashed into the session on an error
 * (`dontFlash` in bootstrap/app.php — the exception handler's list, the only one Laravel reads).
 */
class StorageSettingsRequest extends FormRequest
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
            'provider' => ['required', 'string', 'in:s3'],
            'region' => ['required', 'string', 'max:32', 'regex:/^[a-z]{2}(-[a-z]+)+-\d$/'],
            // S3's own rule: 3–63 characters, lower case, digits, dots and hyphens, a letter or digit at each end.
            'bucket' => ['required', 'string', 'regex:/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/'],
            'endpoint' => ['nullable', 'string', 'url:https,http', 'max:255'],
            'path_style' => ['required', 'boolean'],
            'public_url' => ['nullable', 'string', 'url:https', 'max:255'],
            'access_key' => ['nullable', 'string', 'min:16', 'max:128', 'regex:/^[A-Z0-9]+$/'],
            'secret' => ['nullable', 'string', 'min:30', 'max:128'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'region.*' => 'Die Region schreibt AWS so: eu-north-1.',
            'bucket.required' => 'Gib bitte den Namen des Buckets ein.',
            'bucket.*' => 'Ein Bucket-Name hat 3 bis 63 Zeichen: Kleinbuchstaben, Ziffern, Punkte und Bindestriche.',
            'endpoint.*' => 'Der Endpunkt ist eine Adresse wie https://s3.eu-north-1.amazonaws.com – oder leer.',
            'public_url.*' => 'Die öffentliche Adresse beginnt mit https:// – oder bleibt leer.',
            'access_key.*' => 'Der Zugriffsschlüssel besteht aus Großbuchstaben und Ziffern, wie AWS ihn anzeigt.',
            'secret.*' => 'Der geheime Schlüssel ist zu kurz. Kopier ihn bitte vollständig aus AWS.',
        ];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }

    /**
     * The values as entered — the two keys only where something new was entered.
     *
     * @return array{provider: string, region: string, bucket: string, endpoint: string|null, path_style: bool, public_url: string|null, access_key: string|null, secret: string|null}
     */
    public function values(): array
    {
        return [
            'provider' => (string) $this->validated('provider'),
            'region' => (string) $this->validated('region'),
            'bucket' => (string) $this->validated('bucket'),
            'endpoint' => self::entered($this->input('endpoint')),
            'path_style' => $this->boolean('path_style'),
            'public_url' => self::entered($this->input('public_url')),
            'access_key' => self::entered($this->input('access_key')),
            'secret' => self::entered($this->input('secret')),
        ];
    }

    private static function entered(#[SensitiveParameter] mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
