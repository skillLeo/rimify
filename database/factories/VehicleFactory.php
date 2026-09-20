<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\Vehicle;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vehicle>
 */
class VehicleFactory extends Factory
{
    protected $model = Vehicle::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'source_vehicle_id' => $this->faker->unique()->numberBetween(1, 999_999),
            // Four characters, upper-case, leading zeros intact.
            'hsn' => str_pad((string) $this->faker->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'tsn' => mb_strtoupper($this->faker->bothify('?#?')),
            'vsn' => str_pad((string) $this->faker->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'make' => $this->faker->randomElement(['Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Porsche']),
            'model' => $this->faker->randomElement(['RS 4', '3er', 'C-Klasse', 'Golf', '911']),
            'variant' => $this->faker->randomElement(['Avant Quattro', 'Coupe', 'Limousine', 'GTI']),
            'type_designation' => $this->faker->randomElement(['B9', 'E46', 'W205', 'MK8', '992']),
            'eg_nummer_raw' => 'e1*2001/116*'.$this->faker->numerify('####').'*'.$this->faker->numerify('##'),
            'body_form' => $this->faker->randomElement(['Kombi', 'Limousine', 'Coupe', 'Cabrio']),
            'drive_axle' => $this->faker->randomElement(['Vorderachse', 'Hinterachse', 'Allrad']),
            'build_from' => $this->faker->dateTimeBetween('-20 years', '-3 years')->format('Y-m-01'),
            'build_to' => $this->faker->dateTimeBetween('-2 years', 'now')->format('Y-m-28'),
            'axle_load_front_kg' => $this->faker->numberBetween(700, 1300),
            'axle_load_rear_kg' => $this->faker->numberBetween(700, 1300),
            'max_speed_kmh' => $this->faker->numberBetween(140, 300),
            'power_kw' => $this->faker->numberBetween(50, 450),
            'power_ps' => $this->faker->numberBetween(68, 612),
            'displacement_ccm' => $this->faker->numberBetween(900, 6200),
            'doors' => $this->faker->randomElement([2, 3, 4, 5]),
            'seats' => $this->faker->randomElement([2, 4, 5]),
            'needs_review' => false,
            'raw' => [],
            'imported_at' => now(),
        ];
    }

    /** A model still in production: no end to the build window at all. */
    public function stillBuilt(): static
    {
        return $this->state(fn (): array => ['build_to' => null]);
    }

    /**
     * A vehicle the importer could not fully parse. R-03: it may never produce a positive verdict,
     * so the engine's asymmetry suite leans on this state heavily.
     */
    public function needsReview(): static
    {
        return $this->state(fn (): array => [
            'axle_load_front_kg' => null,
            'axle_load_rear_kg' => null,
            'max_speed_kmh' => null,
            'needs_review' => true,
        ]);
    }

    /**
     * The pair from the client's own demo data: HSN 1860 + TSN AAS resolves to two different
     * vehicles whose top speeds and front axle loads differ — precisely the two fields the legal
     * tyre specification is derived from.
     */
    public function rs4AvantFirst(): static
    {
        return $this->state(fn (): array => [
            'source_vehicle_id' => 1,
            'hsn' => '1860', 'tsn' => 'AAS', 'vsn' => '00001',
            'make' => 'Audi', 'model' => 'RS 4', 'variant' => 'RS 4 Avant Quattro',
            'type_designation' => 'B9',
            'eg_nummer_raw' => 'e1*2001/116*0447*11',
            'body_form' => 'Kombi', 'drive_axle' => 'Allrad',
            'build_from' => '2018-03-01', 'build_to' => '2019-11-30',
            'axle_load_front_kg' => 1210, 'axle_load_rear_kg' => 1235,
            'max_speed_kmh' => 280,
            'power_kw' => 331, 'power_ps' => 450, 'displacement_ccm' => 2894,
            'doors' => 5, 'seats' => 5, 'needs_review' => false,
        ]);
    }

    public function rs4AvantSecond(): static
    {
        return $this->state(fn (): array => [
            'source_vehicle_id' => 2,
            'hsn' => '1860', 'tsn' => 'AAS', 'vsn' => '00017',
            'make' => 'Audi', 'model' => 'RS 4', 'variant' => 'RS 4 Avant Quattro',
            'type_designation' => 'B9',
            'eg_nummer_raw' => 'e1*2001/116*0447*15',
            'body_form' => 'Kombi', 'drive_axle' => 'Allrad',
            'build_from' => '2019-12-01', 'build_to' => null,
            'axle_load_front_kg' => 1225, 'axle_load_rear_kg' => 1235,
            'max_speed_kmh' => 290,
            'power_kw' => 331, 'power_ps' => 450, 'displacement_ccm' => 2894,
            'doors' => 5, 'seats' => 5, 'needs_review' => false,
        ]);
    }
}
