<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Brand>
 */
class BrandFactory extends Factory
{
    protected $model = Brand::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = $this->faker->randomElement([
            'BORBET', 'OZ RACING', 'ALUTEC', 'BBS', 'YIDO', 'rotiform',
            'Bridgestone', 'Continental', 'Michelin', 'Dunlop', 'Pirelli', 'Goodyear',
        ]);

        return [
            'name' => $name.' '.$this->faker->unique()->numberBetween(1, 999_999),
            'slug' => Str::slug($name).'-'.$this->faker->unique()->numberBetween(1, 999_999),
            'sort_order' => 0,
        ];
    }

    public function named(string $name): static
    {
        return $this->state(fn (): array => ['name' => $name, 'slug' => Str::slug($name)]);
    }
}
