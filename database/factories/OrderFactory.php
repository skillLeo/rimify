<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Address;
use App\Models\Customer;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $subtotal = $this->faker->numberBetween(68_900, 300_000);
        $shipping = $this->faker->randomElement([0, 990, 1_990]);
        // German VAT at 19%, computed out of a gross total in integers.
        $total = $subtotal + $shipping;

        return [
            'order_number' => 'RMF-'.$this->faker->unique()->numerify('######'),
            'customer_id' => fn (): Customer => Customer::factory()->create(),
            'delivery_address_id' => fn (): Address => Address::factory()->create(),
            'billing_address_id' => fn (): Address => Address::factory()->create(),
            'status' => OrderStatus::Paid->value,
            'vehicle_label' => 'Audi RS 4 Avant Quattro (B9)',
            'vehicle_hsn' => '1860',
            'vehicle_tsn' => 'AAS',
            'vehicle_vsn' => '00001',
            'subtotal_cents' => $subtotal,
            'shipping_cents' => $shipping,
            'tax_cents' => (int) round($total * 19 / 119),
            'total_cents' => $total,
            'currency' => 'EUR',
            'placed_at' => now(),
            'paid_at' => now(),
        ];
    }

    public function status(OrderStatus $status): static
    {
        return $this->state(fn (): array => ['status' => $status->value]);
    }

    public function pendingPayment(): static
    {
        return $this->state(fn (): array => [
            'status' => OrderStatus::PendingPayment->value,
            'paid_at' => null,
        ]);
    }
}
