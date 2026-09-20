<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\WheelConfig;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WheelConfig>
 */
class WheelConfigFactory extends Factory
{
    protected $model = WheelConfig::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'wheel_model_id' => WheelModelFactory::new(),
            'wheel_finish_id' => WheelFinishFactory::new(),
            'diameter_in' => $this->faker->randomElement([17.0, 18.0, 19.0, 20.0]),
            'width_in' => $this->faker->randomElement([7.5, 8.0, 8.5, 9.0, 9.5]),
            'et_mm' => $this->faker->numberBetween(25, 45),
            'bolt_holes' => 5,
            'bolt_circle_mm' => 112.0,
            'centre_bore_mm' => 66.60,
            'sku' => mb_strtoupper($this->faker->unique()->bothify('RMF-######-??##')),
            'price_cents' => $this->faker->numberBetween(68_900, 119_600),
            'currency' => 'EUR',
            'stock_qty' => $this->faker->numberBetween(1, 40),
            'weight_g' => $this->faker->numberBetween(8_500, 14_500),
        ];
    }

    public function outOfStock(): static
    {
        return $this->state(fn (): array => ['stock_qty' => 0]);
    }

    /** `8,5J × 18 · ET 35` — the size the spec's worked example uses throughout. */
    public function havanna85x18(): static
    {
        return $this->state(fn (): array => [
            'diameter_in' => 18.0,
            'width_in' => 8.5,
            'et_mm' => 35,
            'bolt_holes' => 5,
            'bolt_circle_mm' => 112.0,
            'centre_bore_mm' => 66.60,
        ]);
    }
}
