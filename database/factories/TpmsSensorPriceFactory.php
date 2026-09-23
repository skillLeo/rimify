<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\TpmsSensorPrice;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<TpmsSensorPrice>
 */
class TpmsSensorPriceFactory extends Factory
{
    protected $model = TpmsSensorPrice::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        // make_key is unique, so every row carries its own number. The price is deliberately one
        // cent — never a plausible figure — so every test states the amount it asserts on.
        $make = $this->faker->randomElement(['Volkswagen', 'Porsche', 'Audi', 'BMW', 'Ford', 'Opel']);
        $number = $this->faker->unique()->numberBetween(1, 999_999);

        return [
            'make_key' => Str::slug($make).'-'.$number,
            'make_label_de' => $make.' '.$number,
            'price_cents' => 1,
            'currency' => 'EUR',
            'active' => true,
        ];
    }

    /** A price keyed on a real make: `ofMake('volkswagen', 'Volkswagen')`. */
    public function ofMake(string $key, string $labelDe): static
    {
        return $this->state(fn (): array => ['make_key' => $key, 'make_label_de' => $labelDe]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['active' => false]);
    }
}
