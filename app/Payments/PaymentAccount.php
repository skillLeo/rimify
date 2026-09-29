<?php

declare(strict_types=1);

namespace App\Payments;

/**
 * „Verbindung testen“ on Einstellungen › Zahlung: the account the keys belong to — its name, country, currency and
 * the payment methods it may take — or the provider's own error, word for word.
 */
final readonly class PaymentAccount
{
    /** @param  list<string>  $methods */
    public function __construct(
        public bool $ok,
        public ?string $name = null,
        public ?string $country = null,
        public ?string $currency = null,
        public array $methods = [],
        public ?bool $live = null,
        public ?string $error = null,
    ) {}

    public static function failed(string $error): self
    {
        return new self(false, error: $error);
    }

    /** @return array{ok: bool, name: string|null, country: string|null, currency: string|null, methods: list<string>, live: bool|null, error: string|null} */
    public function toArray(): array
    {
        return [
            'ok' => $this->ok,
            'name' => $this->name,
            'country' => $this->country,
            'currency' => $this->currency,
            'methods' => $this->methods,
            'live' => $this->live,
            'error' => $this->error,
        ];
    }
}
