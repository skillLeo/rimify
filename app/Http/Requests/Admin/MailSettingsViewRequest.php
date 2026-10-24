<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\MailSetting;
use Illuminate\Foundation\Http\FormRequest;

/** Opening Einstellungen › E-Mail: the Super-Admin alone (MailSettingPolicy) — and, below, a blocked address looked for. */
class MailSettingsViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('view', MailSetting::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['sperre' => ['nullable', 'string', 'max:190']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['sperre.*' => 'Gib eine Adresse oder einen Teil davon ein, höchstens 190 Zeichen.'];
    }

    /** The part of an address typed into the block list's search; empty for none. */
    public function blockedSearch(): string
    {
        $typed = $this->validated('sperre');

        return is_string($typed) ? mb_strtolower(trim($typed)) : '';
    }
}
