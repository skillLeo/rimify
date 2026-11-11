<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ShippingMethod;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ShippingMethod> */
class ShippingMethodFactory extends Factory
{
    protected $model = ShippingMethod::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'name' => 'Standardversand',
            'description_de' => null,
            'price_cents' => 990,
            'currency' => 'EUR',
            'free_from_cents' => null,
            'delivery_min_days' => 3,
            'delivery_max_days' => 5,
            'countries' => ['DE'],
            'product_types' => null,
            'position' => 1,
            'active' => true,
            'is_demo' => false,
            'demo_ref' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['active' => false]);
    }

    /** @param list<string> $types */
    public function only(array $types): static
    {
        return $this->state(['product_types' => $types]);
    }
}
