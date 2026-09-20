<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ConflictKind;
use App\Enums\ConflictStatus;
use App\Models\FitmentConflict;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FitmentConflict>
 */
class FitmentConflictFactory extends Factory
{
    protected $model = FitmentConflict::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'kind' => ConflictKind::TyreSizes->value,
            'status' => ConflictStatus::Open->value,
            'vehicle_id' => VehicleFactory::new(),
            'wheel_config_id' => WheelConfigFactory::new(),
            'candidate_fitment_id' => null,
            'existing_fitment_id' => FitmentFactory::new(),
            'detail' => ['existing' => [], 'candidate' => []],
            'blocking' => false,
        ];
    }

    /** An entry-requirement mismatch is the one kind that hard-blocks a save. */
    public function entryRequirement(): static
    {
        return $this->state(fn (): array => [
            'kind' => ConflictKind::EntryRequirement->value,
            'blocking' => true,
        ]);
    }

    public function resolved(): static
    {
        return $this->state(fn (): array => [
            'status' => ConflictStatus::ResolvedIntersection->value,
            'resolved_at' => now(),
        ]);
    }
}
