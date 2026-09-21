<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\CatalogueStatus;
use App\Models\WheelModel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<WheelModel>
 */
class WheelModelFactory extends Factory
{
    protected $model = WheelModel::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = $this->faker->randomElement([
            'Havanna', 'Superturismo GT', 'Monstr', 'CI-R', 'Grip', 'KPS', 'LV', 'BLZ',
        ]);

        return [
            'brand_id' => BrandFactory::new(),
            'name' => $name,
            'type_designation' => mb_strtoupper($this->faker->bothify('??##')),
            'slug' => Str::slug($name).'-'.$this->faker->unique()->numberBetween(1, 999_999),
            'status' => CatalogueStatus::Published->value,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (): array => ['status' => CatalogueStatus::Draft->value]);
    }
}
