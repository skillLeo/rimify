<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\MailSetting;
use Illuminate\Foundation\Http\FormRequest;

/** Opening Einstellungen › E-Mail: the Super-Admin alone (MailSettingPolicy). */
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
        return [];
    }
}
