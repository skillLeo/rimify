<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\BalanceWeightColour;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BalanceWeightColour>
 */
class BalanceWeightColourFactory extends Factory
{
    protected $model = BalanceWeightColour::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        // name_de and slug are both unique, so every row carries its own number — as the finish
        // and model factories do.
        $name = $this->faker->randomElement(['Silber', 'Schwarz', 'Grau', 'Bronze'])
            .' '.$this->faker->unique()->numberBetween(1, 999_999);

        return [
            'name_de' => $name,
            'slug' => Str::slug($name),
            // chk_weight_colour_hex is case-sensitive: upper-case digits only.
            'swatch_hex' => mb_strtoupper($this->faker->hexColor()),
            'surcharge_cents' => 0,
            'currency' => 'EUR',
            'is_default' => false,
            'active' => true,
            'sort_order' => 0,
        ];
    }

    public function asDefault(): static
    {
        return $this->state(fn (): array => ['is_default' => true]);
    }

    public function inactive(): static
    {
        return $this->state(fn (): array => ['active' => false]);
    }

    public function withSurcharge(int $cents): static
    {
        return $this->state(fn (): array => ['surcharge_cents' => $cents]);
    }
}
