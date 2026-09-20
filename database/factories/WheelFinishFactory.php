<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\WheelFinish;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<WheelFinish>
 */
class WheelFinishFactory extends Factory
{
    protected $model = WheelFinish::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'wheel_model_id' => WheelModelFactory::new(),
            'name_de' => $this->faker->randomElement([
                'Graphite matt', 'Schwarz glänzend', 'Silber', 'Bronze matt', 'Poliert',
            ]).' '.$this->faker->unique()->numberBetween(1, 999_999),
            'hex' => $this->faker->hexColor(),
            'sort_order' => 0,
        ];
    }
}
