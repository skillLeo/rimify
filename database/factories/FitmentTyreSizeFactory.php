<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Axle;
use App\Models\FitmentTyreSize;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FitmentTyreSize>
 */
class FitmentTyreSizeFactory extends Factory
{
    protected $model = FitmentTyreSize::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'fitment_id' => FitmentFactory::new(),
            'width_mm' => 245,
            'aspect' => 45,
            'diameter_in' => 18.0,
            // NULL means the document states no minimum of its own, so the derivation governs.
            'min_load_index' => null,
            'min_speed_symbol' => null,
            'axle' => Axle::All->value,
        ];
    }

    public function size(int $widthMm, int $aspect, float $diameterIn): static
    {
        return $this->state(fn (): array => [
            'width_mm' => $widthMm,
            'aspect' => $aspect,
            'diameter_in' => $diameterIn,
        ]);
    }

    /** The document stating its own minimum — R-06's "the document wins" branch. */
    public function withDocumentMinima(?int $loadIndex, ?string $speedSymbol): static
    {
        return $this->state(fn (): array => [
            'min_load_index' => $loadIndex,
            'min_speed_symbol' => $speedSymbol,
        ]);
    }

    public function forAxle(Axle $axle): static
    {
        return $this->state(fn (): array => ['axle' => $axle->value]);
    }
}
