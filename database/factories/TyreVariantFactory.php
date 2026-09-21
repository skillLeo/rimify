<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Fitment\Derivation\ReferenceTables;
use App\Models\TyreVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TyreVariant>
 */
class TyreVariantFactory extends Factory
{
    protected $model = TyreVariant::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        // Symbol and rank are always chosen together, so no factory row can contradict itself
        // by carrying a symbol whose rank says something different.
        $entry = $this->faker->randomElement(array_filter(
            ReferenceTables::SPEED_SYMBOLS,
            static fn (array $row): bool => $row['rank'] >= 6,
        ));

        return [
            'brand_id' => BrandFactory::new(),
            'name' => $this->faker->randomElement(['Potenza Sport', 'PremiumContact 7', 'Pilot Sport 5']),
            'season' => $this->faker->randomElement(['sommer', 'winter', 'ganzjahres']),
            'width_mm' => $this->faker->randomElement([205, 225, 245, 255, 275]),
            'aspect' => $this->faker->randomElement([35, 40, 45, 50]),
            'diameter_in' => $this->faker->randomElement([17.0, 18.0, 19.0, 20.0]),
            'load_index' => $this->faker->numberBetween(88, 103),
            'speed_symbol' => $entry['symbol'],
            'speed_rank' => $entry['rank'],
            'price_cents' => $this->faker->numberBetween(9_900, 32_900),
            'currency' => 'EUR',
            'stock_qty' => $this->faker->numberBetween(1, 60),
        ];
    }

    /** @param  non-empty-string  $symbol */
    public function withSpeedSymbol(string $symbol): static
    {
        $rank = null;

        foreach (ReferenceTables::SPEED_SYMBOLS as $row) {
            if ($row['symbol'] === $symbol) {
                $rank = $row['rank'];
            }
        }

        return $this->state(fn (): array => ['speed_symbol' => $symbol, 'speed_rank' => $rank]);
    }

    public function size(int $widthMm, int $aspect, float $diameterIn): static
    {
        return $this->state(fn (): array => [
            'width_mm' => $widthMm,
            'aspect' => $aspect,
            'diameter_in' => $diameterIn,
        ]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn (): array => ['stock_qty' => 0]);
    }
}
