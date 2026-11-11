<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\MailSetting;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use SensitiveParameter;

/**
 * Einstellungen › E-Mail, saved or tested — Amazon SES's set, or Brevo's SMTP login and key (D-450). The keys are write-only, as on Medien und Speicher:
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
        // Brevo (D-450): its SMTP login and SMTP key; SES's key pair and topic are not asked.
        if ($this->input('provider') === MailSetting::BREVO) {
            return [
                'provider' => ['required', Rule::in([MailSetting::SES, MailSetting::BREVO])],
                'from_address' => ['required', 'string', 'email:rfc,filter_unicode', 'max:254'],
                'from_name' => ['nullable', 'string', 'max:120'],
                'smtp_login' => ['required', 'string', 'max:254', 'regex:/^\S+@\S+$/'],
                'secret' => ['nullable', 'string', 'min:20', 'max:256', 'regex:/^\S+$/'],
            ];
        }

        return [
            'provider' => ['nullable', Rule::in([MailSetting::SES, MailSetting::BREVO])],
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
            'secret.*' => $this->input('provider') === MailSetting::BREVO
                ? 'Der SMTP-Schlüssel ist zu kurz. Kopier ihn bitte vollständig aus Brevo (SMTP & API › SMTP).'
                : 'Der geheime Schlüssel ist zu kurz. Kopier ihn bitte vollständig aus AWS.',
            'smtp_login.required' => 'Gib bitte den SMTP-Login aus Brevo ein (SMTP & API › SMTP, z. B. 8a1b2c001@smtp-brevo.com).',
            'smtp_login.*' => 'Den SMTP-Login zeigt Brevo unter SMTP & API › SMTP, in der Form name@smtp-brevo.com.',
            'provider.*' => 'Wähl bitte Amazon SES oder Brevo.',
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
     * @return array{provider: 'ses'|'brevo', from_address: string, from_name: string|null, topic_arn: string|null, access_key: string|null, secret: string|null, smtp_login: string|null}
     */
    public function values(): array
    {
        return [
            'provider' => $this->input('provider') === MailSetting::BREVO ? MailSetting::BREVO : MailSetting::SES,
            'smtp_login' => self::entered($this->input('smtp_login')),
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
