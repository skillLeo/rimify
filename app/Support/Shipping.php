<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Setting;

/**
 * What delivery costs and how long it takes, as Einstellungen › Verkäufer & Versand says it — the product page, the
 * basket, the checkout's block before the order button (§ 312j BGB) and the order mail all read it here, once.
 *
 * Where it comes from, in the order KomplettradSettings reads its prices: the settings row when an admin ever saved
 * the page (a cleared field then means cleared, not „fall back to .env“), else the `.env` values (`rimify.shipping`).
 *
 * The price is per delivery country. The checkout ships to Germany only — it asks for no country, and another one
 * brings its own VAT (OSS) — so Germany is the one country the page offers (COUNTRIES), and the one every price is
 * asked for. The delivery time is a range of working days („3–5 Werktage“); the `.env` fallback is the sentence as
 * the operator wrote it.
 *
 * Values marked as placeholders („Platzhalter“) are never said to a customer: every surface treats them as not given
 * — „Versandkosten werden noch festgelegt“, no real order — and the preflight names them.
 */
final readonly class Shipping
{
    public const KEY = 'shop.shipping';

    /** The delivery countries the checkout knows, by ISO code. */
    public const COUNTRIES = ['DE' => 'Deutschland'];

    public const DOMESTIC = 'DE';

    /**
     * @param  array<string, array{cost_cents: int|null, free_from_cents: int|null}>  $zones  by country code
     * @param  string|null  $timeText  the `.env` sentence, where no range was saved
     * @param  'Einstellungen'|'.env'  $source
     */
    public function __construct(
        public array $zones,
        public ?int $minDays,
        public ?int $maxDays,
        public ?string $timeText,
        public bool $placeholder,
        public string $source,
    ) {}

    public static function current(): self
    {
        $row = Setting::get(self::KEY);

        if (is_array($row)) {
            $zones = [];

            foreach (self::COUNTRIES as $code => $name) {
                $zone = is_array($row['zones'][$code] ?? null) ? $row['zones'][$code] : [];
                $zones[$code] = ['cost_cents' => self::cents($zone['cost_cents'] ?? null), 'free_from_cents' => self::cents($zone['free_from_cents'] ?? null)];
            }

            return new self(
                $zones,
                self::days($row['delivery_min_days'] ?? null),
                self::days($row['delivery_max_days'] ?? null),
                null,
                ($row['placeholder'] ?? false) === true,
                'Einstellungen',
            );
        }

        $text = config('rimify.shipping.delivery_time');

        return new self(
            [self::DOMESTIC => [
                'cost_cents' => self::cents(config('rimify.shipping.cost_cents')),
                'free_from_cents' => self::cents(config('rimify.shipping.free_from_cents')),
            ]],
            null,
            null,
            is_string($text) && trim($text) !== '' ? trim($text) : null,
            false,
            '.env',
        );
    }

    /** What delivery to the country costs, or null while it is not given (or only a placeholder). */
    public function costCents(string $country = self::DOMESTIC): ?int
    {
        return $this->placeholder ? null : ($this->zones[$country]['cost_cents'] ?? null);
    }

    /** From which subtotal delivery to the country is free; null: never, or not given. */
    public function freeFromCents(string $country = self::DOMESTIC): ?int
    {
        return $this->placeholder ? null : ($this->zones[$country]['free_from_cents'] ?? null);
    }

    public function configured(string $country = self::DOMESTIC): bool
    {
        return $this->costCents($country) !== null;
    }

    /** The shipping for a subtotal in cents, or null while no price is given. Nothing in the basket ships free. */
    public function forSubtotal(int $subtotal, string $country = self::DOMESTIC): ?int
    {
        $cost = $this->costCents($country);

        if ($cost === null) {
            return null;
        }

        $freeFrom = $this->freeFromCents($country);

        return $subtotal === 0 || ($freeFrom !== null && $subtotal >= $freeFrom) ? 0 : $cost;
    }

    /** `3–5 Werktage`, `1 Werktag` — or the `.env` sentence; null while not given (or only a placeholder). */
    public function deliveryTime(): ?string
    {
        if ($this->placeholder) {
            return null;
        }

        if ($this->minDays !== null && $this->maxDays !== null) {
            return self::range($this->minDays, $this->maxDays);
        }

        return $this->timeText;
    }

    /** `3–5 Werktage`, `2 Werktage`, `1 Werktag` — the en dash of a range (R-10). */
    public static function range(int $min, int $max): string
    {
        if ($min === $max) {
            return $min === 1 ? '1 Werktag' : "{$min} Werktage";
        }

        return "{$min}–{$max} Werktage";
    }

    /**
     * The product page's line under the price: `Lieferzeit 3–5 Werktage · Versand 4,90 € · versandkostenfrei ab
     * 500,00 €` — only what is given; null when nothing is.
     */
    public function summary(): ?string
    {
        $cost = $this->costCents();
        $freeFrom = $this->freeFromCents();
        $time = $this->deliveryTime();

        $parts = array_values(array_filter([
            $time === null ? null : 'Lieferzeit '.$time,
            $cost === null ? null : ($cost === 0 ? 'versandkostenfrei' : 'Versand '.GermanFormat::money($cost)),
            $cost === null || $cost === 0 || $freeFrom === null ? null : 'versandkostenfrei ab '.GermanFormat::money($freeFrom),
        ]));

        return $parts === [] ? null : implode(' · ', $parts);
    }

    /**
     * What a real order needs and is not given yet, in the preflight's words (Art. 246a § 1 EGBGB: the price of
     * delivery and the delivery time, before the order).
     *
     * @return list<string>
     */
    public function missing(): array
    {
        if ($this->placeholder) {
            return ['Versandangaben (noch Platzhalter)'];
        }

        return array_values(array_filter([
            $this->costCents() === null ? 'Versandkosten' : null,
            $this->deliveryTime() === null ? 'Lieferzeit' : null,
        ]));
    }

    private static function cents(mixed $value): ?int
    {
        return is_int($value) && $value >= 0 ? $value : null;
    }

    private static function days(mixed $value): ?int
    {
        return is_int($value) && $value >= 1 && $value <= 60 ? $value : null;
    }
}
