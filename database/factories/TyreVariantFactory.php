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
            'available' => true,
            // A real tyre is offered only with its EU label on record (D-303), so a test tyre carries a complete one.
            // Test data: the EPREL number is no real registration.
            'eu_fuel_class' => $this->faker->randomElement(['A', 'B', 'C']),
            'eu_wet_grip_class' => $this->faker->randomElement(['A', 'B']),
            'eu_noise_db' => $this->faker->numberBetween(68, 73),
            'eu_noise_class' => $this->faker->randomElement(['A', 'B']),
            'eu_snow_grip' => false,
            'eu_ice_grip' => false,
            'eprel_id' => (string) $this->faker->unique()->numberBetween(100_000, 9_999_999),
        ];
    }

    /** A tyre whose EU label is not on record: not offered while it is real (D-303). */
    public function unlabelled(): static
    {
        return $this->state(fn (): array => [
            'eu_fuel_class' => null, 'eu_wet_grip_class' => null, 'eu_noise_db' => null, 'eu_noise_class' => null,
            'eu_snow_grip' => null, 'eu_ice_grip' => null, 'eprel_id' => null,
        ]);
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

    /** A tyre marked „nicht verfügbar“ (D-301): what the shop reads; the old count with it, nought. */
    public function outOfStock(): static
    {
        return $this->state(fn (): array => ['stock_qty' => 0, 'available' => false]);
    }
}
