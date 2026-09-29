<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\StorageSetting;
use Illuminate\Foundation\Http\FormRequest;

/** Opening Einstellungen › Medien und Speicher: the Super-Admin alone (StorageSettingPolicy). */
class StorageSettingsViewRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('view', StorageSetting::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [];
    }
}
