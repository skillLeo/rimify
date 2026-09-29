<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\PaymentSetting;
use App\Payments\StripeKeys;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use SensitiveParameter;

/**
 * Einstellungen › Zahlung, saved. The three keys are write-only: left empty they keep what is stored, filled they
 * replace it; never sent back (the page shows their last four characters) and never flashed into the session on
 * an error (`dontFlash`, bootstrap/app.php). Every key is checked against the chosen mode with the rules `.env`
 * is held to (StripeKeys): `sk_live_` is refused anywhere but production, `sk_test_` in Livemodus — and the
 * refusal says so in a sentence. A live key refused here is not stored anywhere (R-16).
 */
class PaymentSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');

        return $user instanceof AdminUser && $user->can('update', PaymentSetting::class);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', 'in:test,live'],
            'publishable_key' => ['nullable', 'string', 'max:255'],
            'secret_key' => ['nullable', 'string', 'max:255'],
            'webhook_secret' => ['nullable', 'string', 'max:255'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return ['mode.*' => 'Wähl Testmodus oder Livemodus.'];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            $mode = (string) $this->input('mode') === StripeKeys::LIVE ? StripeKeys::LIVE : StripeKeys::TEST;
            $production = app()->environment('production');
            $stored = PaymentSetting::current();

            foreach (['publishable_key' => 'key', 'secret_key' => 'secret', 'webhook_secret' => 'webhook_secret'] as $input => $field) {
                // A key entered now, or the one stored, if the mode changes under it.
                $key = self::entered($this->input($input)) ?? ($stored?->getAttribute($input) === null ? null : (string) $stored->getAttribute($input));
                $refusal = $key === null ? null : StripeKeys::refusal($field, $key, $mode, $production);

                if ($refusal !== null) {
                    $validator->errors()->add($input, $refusal);
                }
            }
        }];
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');
        abort_unless($user instanceof AdminUser, 403);

        return $user;
    }

    /**
     * The values as entered — each key only where something new was entered.
     *
     * @return array{mode: 'test'|'live', publishable_key: string|null, secret_key: string|null, webhook_secret: string|null}
     */
    public function values(): array
    {
        return [
            'mode' => $this->validated('mode') === StripeKeys::LIVE ? StripeKeys::LIVE : StripeKeys::TEST,
            'publishable_key' => self::entered($this->input('publishable_key')),
            'secret_key' => self::entered($this->input('secret_key')),
            'webhook_secret' => self::entered($this->input('webhook_secret')),
        ];
    }

    private static function entered(#[SensitiveParameter] mixed $value): ?string
    {
        return is_string($value) && trim($value) !== '' ? trim($value) : null;
    }
}
