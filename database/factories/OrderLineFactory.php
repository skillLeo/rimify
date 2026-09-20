<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\OrderLineKind;
use App\Models\OrderLine;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderLine>
 */
class OrderLineFactory extends Factory
{
    protected $model = OrderLine::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $quantity = 4;
        $unit = $this->faker->numberBetween(17_200, 29_900);

        return [
            'order_id' => OrderFactory::new(),
            'kind' => OrderLineKind::Wheel->value,
            'label' => 'BORBET Havanna · Graphite matt · 8,5J × 18 · ET 35',
            'quantity' => $quantity,
            'unit_price_cents' => $unit,
            'line_total_cents' => $unit * $quantity,
            'tax_rate_bp' => 1900,
            'currency' => 'EUR',
        ];
    }

    public function kind(OrderLineKind $kind): static
    {
        return $this->state(fn (): array => ['kind' => $kind->value]);
    }
}
