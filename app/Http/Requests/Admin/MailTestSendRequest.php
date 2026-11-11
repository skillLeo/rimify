<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\MailSetting;
use Illuminate\Foundation\Http\FormRequest;

/**
 * „Test-E-Mail senden“ on Einstellungen › E-Mail (D-450): the address one real message goes to. Asked of MailSettingPolicy,
 * as saving the settings is (R-11).
 */
class MailTestSendRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', MailSetting::class);
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return ['test_to' => ['required', 'string', 'email:rfc,filter_unicode', 'max:254']];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'test_to.required' => 'Gib bitte die Adresse ein, an die die Test-E-Mail gehen soll.',
            'test_to.*' => 'Das ist keine gültige E-Mail-Adresse.',
        ];
    }

    public function to(): string
    {
        return strtolower(trim((string) $this->validated('test_to')));
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }
}
