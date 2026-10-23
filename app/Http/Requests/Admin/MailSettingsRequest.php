<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\MailSetting;
use Illuminate\Foundation\Http\FormRequest;
use SensitiveParameter;

/**
 * Einstellungen › E-Mail, saved or tested. The access key and the secret are write-only, as on Medien und Speicher:
 * left empty they keep what is stored, filled they replace it; never sent back, never flashed into the session
 * (`dontFlash` in bootstrap/app.php). The region is not a field: SES runs in the bucket's region (MailSetting::REGION).
 */
class MailSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', MailSetting::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'from_address' => ['required', 'string', 'email:rfc,filter_unicode', 'max:254'],
            'from_name' => ['nullable', 'string', 'max:120'],
            'access_key' => ['nullable', 'string', 'min:16', 'max:128', 'regex:/^[A-Z0-9]+$/'],
            'secret' => ['nullable', 'string', 'min:30', 'max:128'],
            // The topic SES reports to, in the same region: arn:aws:sns:eu-north-1:<account id>:rimify-ses-meldungen.
            'topic_arn' => ['nullable', 'string', 'max:256', 'regex:/^arn:aws:sns:'.MailSetting::REGION.':\d{12}:[A-Za-z0-9_-]{1,256}$/'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'from_address.required' => 'Gib bitte die Absenderadresse ein, z. B. bestellung@rimify.de.',
            'from_address.*' => 'Die Absenderadresse ist keine gültige E-Mail-Adresse.',
            'from_name.*' => 'Der Absendername ist zu lang.',
            'access_key.*' => 'Der Zugriffsschlüssel besteht aus Großbuchstaben und Ziffern, wie AWS ihn anzeigt.',
            'secret.*' => 'Der geheime Schlüssel ist zu kurz. Kopier ihn bitte vollständig aus AWS.',
            'topic_arn.*' => 'Das SNS-Thema schreibt AWS so: arn:aws:sns:'.MailSetting::REGION.':<Konto-ID>:name – in derselben Region.',
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
     * @return array{from_address: string, from_name: string|null, topic_arn: string|null, access_key: string|null, secret: string|null}
     */
    public function values(): array
    {
        return [
            'from_address' => strtolower(trim((string) $this->validated('from_address'))),
            'from_name' => self::entered($this->input('from_name')),
            'topic_arn' => self::entered($this->input('topic_arn')),
            'access_key' => self::entered($this->input('access_key')),
            'secret' => self::entered($this->input('secret')),
        ];
    }

    private static function entered(#[SensitiveParameter] mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
