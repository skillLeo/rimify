<?php

declare(strict_types=1);

namespace App\Payments;

use App\Models\PaymentSetting;
use SensitiveParameter;
use Throwable;

/**
 * The payment keys in force, and where they come from: Einstellungen › Zahlung first (encrypted in
 * `payment_settings`), `.env` second (config services.stripe, already cleaned of keys it may not use by
 * StripeKeys::enforce at boot). A key the rules refuse for its mode, here, is not used — whichever way it came.
 *
 * Never logs or returns a key: `summary()` is what a page or the preflight may see — the source, the mode and
 * each key's last four characters.
 */
final readonly class PaymentConfig
{
    public const SETTINGS = 'Einstellungen';

    public const ENV = '.env';

    public const NONE = 'keine';

    private function __construct(
        public string $source,
        public string $mode,
        #[SensitiveParameter] public ?string $publishableKey,
        #[SensitiveParameter] public ?string $secretKey,
        #[SensitiveParameter] public ?string $webhookSecret,
    ) {}

    public static function current(): self
    {
        $row = self::row();

        if ($row !== null && (filled($row->secret_key) || filled($row->publishable_key))) {
            return self::checked(self::SETTINGS, $row->mode, $row->publishable_key, $row->secret_key, $row->webhook_secret);
        }

        $env = [config('services.stripe.key'), config('services.stripe.secret'), config('services.stripe.webhook_secret')];

        if (array_filter($env, static fn (mixed $v): bool => is_string($v) && $v !== '') !== []) {
            $mode = config('services.stripe.mode') === StripeKeys::LIVE ? StripeKeys::LIVE : StripeKeys::TEST;

            return self::checked(self::ENV, $mode, ...array_map(static fn (mixed $v): ?string => is_string($v) && $v !== '' ? $v : null, $env));
        }

        return new self(self::NONE, $row->mode ?? StripeKeys::TEST, null, null, null);
    }

    /** All three keys present: a checkout can be taken and its webhook verified. */
    public function complete(): bool
    {
        return $this->publishableKey !== null && $this->secretKey !== null && $this->webhookSecret !== null;
    }

    public function testMode(): bool
    {
        return $this->mode !== StripeKeys::LIVE;
    }

    /**
     * What a page or the preflight may know: never a key, only where they come from, the mode and the last four
     * characters of each.
     *
     * @return array{source: string, mode: string, publishable: string|null, secret: string|null, webhook: string|null, complete: bool}
     */
    public function summary(): array
    {
        return [
            'source' => $this->source,
            'mode' => $this->mode,
            'publishable' => self::last4($this->publishableKey),
            'secret' => self::last4($this->secretKey),
            'webhook' => self::last4($this->webhookSecret),
            'complete' => $this->complete(),
        ];
    }

    public static function last4(#[SensitiveParameter] ?string $key): ?string
    {
        return $key === null || $key === '' ? null : substr($key, -4);
    }

    /** `••••1234`, the way every page shows a key. */
    public static function mask(?string $last4): ?string
    {
        return $last4 === null ? null : '••••'.$last4;
    }

    private static function checked(string $source, string $mode, #[SensitiveParameter] ?string $publishable, #[SensitiveParameter] ?string $secret, #[SensitiveParameter] ?string $webhook): self
    {
        $mode = $mode === StripeKeys::LIVE ? StripeKeys::LIVE : StripeKeys::TEST;
        $production = app()->environment('production');
        $keep = static fn (string $field, ?string $key): ?string => $key === null || StripeKeys::refusal($field, $key, $mode, $production) !== null ? null : $key;

        return new self($source, $mode, $keep('key', $publishable), $keep('secret', $secret), $keep('webhook_secret', $webhook));
    }

    /** The screen's row; none before the table exists (a database the release has not migrated yet). */
    private static function row(): ?PaymentSetting
    {
        try {
            return PaymentSetting::current();
        } catch (Throwable) {
            return null;
        }
    }
}
