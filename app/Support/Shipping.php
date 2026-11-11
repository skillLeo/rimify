<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\ShippingMethod;

/**
 * What delivery costs and how long it takes, by one shipping method (his round of 08.11, §7B; D-449) — the product page,
 * the basket, the checkout's block before the order button (§ 312j BGB, PAngV) and the preflight all read it here, once.
 *
 * Einstellungen › Versand holds the methods. A basket is offered the active ones that ship to Germany and ship everything in
 * it (ShippingMethod::ships), in the admin's order; the cheapest is chosen until the customer chooses another. The product
 * page names the cheapest active method for rims. Only while no method was ever saved does the `.env` stand as one method,
 * „Standardversand“, as the one setting of Einstellungen › Verkäufer & Versand fell back to it before.
 *
 * The checkout ships to Germany only — it asks for no country, and another one brings its own VAT (OSS) — so Germany is the
 * one country a method can name (COUNTRIES). The delivery time is a range of working days („3–5 Werktage“); the `.env`
 * fallback is the sentence as the operator wrote it.
 */
final readonly class Shipping
{
    /** The one setting before D-449; read once more by its migration, then never. */
    public const KEY = 'shop.shipping';

    /** The delivery countries the checkout knows, by ISO code. */
    public const COUNTRIES = ['DE' => 'Deutschland'];

    public const DOMESTIC = 'DE';

    /** What a method can be limited to: what the basket holds. */
    public const PRODUCT_TYPES = ['felgen' => 'Felgen allein', 'komplettrad' => 'Kompletträder'];

    /** @param  'Versand'|'.env'|'keine'  $source */
    public function __construct(
        public ?int $id,
        public string $name,
        private ?int $cost,
        private ?int $freeFrom,
        public ?int $minDays,
        public ?int $maxDays,
        public ?string $timeText,
        public ?string $description,
        public bool $demo,
        public string $source,
    ) {}

    /** The product page's: the cheapest active method that ships rims (§7B: „follows the cheapest active method“). */
    public static function current(): self
    {
        return self::cheapest(['felgen']);
    }

    /**
     * The methods a basket holding these products may go by, in the admin's order.
     *
     * @param  list<string>  $types  `felgen`, `komplettrad`
     * @return list<self>
     */
    public static function options(array $types, string $country = self::DOMESTIC): array
    {
        if (! ShippingMethod::query()->exists()) {
            return [self::fromEnv()];
        }

        return ShippingMethod::query()->where('active', true)->orderBy('position')->orderBy('id')->get()
            ->filter(static fn (ShippingMethod $method): bool => $method->ships($types, $country))
            ->map(static fn (ShippingMethod $method): self => self::of($method))
            ->values()->all();
    }

    /**
     * The cheapest of them for this subtotal — what the basket goes by until the customer chooses — and among equals the
     * first; one without a price only where none has one; none at all where no method ships the basket.
     *
     * @param  list<string>  $types
     */
    public static function cheapest(array $types, int $subtotal = 0): self
    {
        $options = self::options($types);
        $priced = array_values(array_filter($options, static fn (self $option): bool => $option->configured()));

        if ($priced === []) {
            return $options[0] ?? self::none();
        }

        usort($priced, static fn (self $a, self $b): int => (int) $a->forSubtotal($subtotal) <=> (int) $b->forSubtotal($subtotal));

        return $priced[0];
    }

    /**
     * The method the customer chose, while it still ships this basket; else the cheapest.
     *
     * @param  list<string>  $types
     */
    public static function chosen(?int $id, array $types, int $subtotal = 0): self
    {
        foreach (self::options($types) as $option) {
            if ($id !== null && $option->id === $id) {
                return $option;
            }
        }

        return self::cheapest($types, $subtotal);
    }

    public static function of(ShippingMethod $method): self
    {
        return new self(
            (int) $method->id,
            $method->name,
            (int) $method->price_cents,
            $method->free_from_cents,
            (int) $method->delivery_min_days,
            (int) $method->delivery_max_days,
            null,
            $method->description_de === null || trim($method->description_de) === '' ? null : trim($method->description_de),
            (bool) $method->is_demo,
            'Versand',
        );
    }

    /** No method ships the basket: no price, no time — the order waits, as without a shipping price. */
    public static function none(): self
    {
        return new self(null, 'Versand', null, null, null, null, null, null, false, 'keine');
    }

    /** `.env`, while Einstellungen › Versand was never saved. */
    private static function fromEnv(): self
    {
        $text = config('rimify.shipping.delivery_time');

        return new self(
            null,
            'Standardversand',
            self::cents(config('rimify.shipping.cost_cents')),
            self::cents(config('rimify.shipping.free_from_cents')),
            null,
            null,
            is_string($text) && trim($text) !== '' ? trim($text) : null,
            null,
            false,
            '.env',
        );
    }

    /** What delivery costs, or null while it is not given. */
    public function costCents(): ?int
    {
        return $this->cost;
    }

    /** From which subtotal delivery is free; null: never, or not given. */
    public function freeFromCents(): ?int
    {
        return $this->freeFrom;
    }

    public function configured(): bool
    {
        return $this->cost !== null;
    }

    /** The shipping for a subtotal in cents, or null while no price is given. Nothing in the basket ships free. */
    public function forSubtotal(int $subtotal): ?int
    {
        if ($this->cost === null) {
            return null;
        }

        return $subtotal === 0 || ($this->freeFrom !== null && $subtotal >= $this->freeFrom) ? 0 : $this->cost;
    }

    /** `3–5 Werktage`, `1 Werktag` — or the `.env` sentence; null while not given. */
    public function deliveryTime(): ?string
    {
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
     * The method as the basket and the checkout show it, for this subtotal.
     *
     * @return array{id: int|null, name: string, description: string|null, priceCents: int|null, price: string|null, free: bool, freeFrom: string|null, deliveryTime: string|null, demo: bool}
     */
    public function view(int $subtotal): array
    {
        $cents = $this->forSubtotal($subtotal);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'priceCents' => $cents,
            'price' => $cents === null ? null : GermanFormat::money($cents),
            'free' => $cents === 0 && $subtotal > 0,
            'freeFrom' => $this->freeFrom === null || $this->cost === 0 ? null : GermanFormat::money($this->freeFrom),
            'deliveryTime' => $this->deliveryTime(),
            'demo' => $this->demo,
        ];
    }

    /**
     * What a real order needs and is not given yet, in the preflight's words (Art. 246a § 1 EGBGB: the price of
     * delivery and the delivery time, before the order).
     *
     * @return list<string>
     */
    public function missing(): array
    {
        if ($this->source === 'keine') {
            return ['eine aktive Versandart'];
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
}
