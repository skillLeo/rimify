<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\PaymentSetting;
use Illuminate\Foundation\Http\FormRequest;

/** Opening Einstellungen › Zahlung, and „Verbindung testen“: the Super-Admin alone (PaymentSettingPolicy). */
class PaymentSettingsViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('view', PaymentSetting::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
