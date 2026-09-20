<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Address;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Address>
 */
class AddressFactory extends Factory
{
    protected $model = Address::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'customer_id' => CustomerFactory::new(),
            'full_name' => $this->faker->name(),
            'street' => $this->faker->streetName(),
            'house_number' => (string) $this->faker->numberBetween(1, 180),
            'zip_code' => $this->faker->numerify('#####'),
            'city' => $this->faker->randomElement(['Düsseldorf', 'Köln', 'München', 'Hamburg', 'Berlin']),
            'country' => 'DE',
        ];
    }
}
