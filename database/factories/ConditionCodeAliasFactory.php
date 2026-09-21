<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ConditionCodeAlias;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConditionCodeAlias>
 */
class ConditionCodeAliasFactory extends Factory
{
    protected $model = ConditionCodeAlias::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'condition_code_id' => ConditionCodeFactory::new(),
            'approval_document_id' => null,
            'printed_code' => mb_strtoupper($this->faker->bothify('?##')),
            'issuer' => $this->faker->randomElement(['TÜV Rheinland', 'DEKRA', 'TÜV SÜD']),
        ];
    }
}
