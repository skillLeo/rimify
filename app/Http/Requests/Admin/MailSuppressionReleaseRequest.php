<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\MailSetting;
use Illuminate\Foundation\Http\FormRequest;

/** Lifting the block on one address in Einstellungen › E-Mail: a change of that screen (MailSettingPolicy::update). */
class MailSuppressionReleaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', MailSetting::class);
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
