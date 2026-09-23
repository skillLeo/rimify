<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\Axle;
use App\Enums\FitmentStatus;
use App\Models\Fitment;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Fitment>
 */
class FitmentFactory extends Factory
{
    protected $model = Fitment::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'approval_document_id' => ApprovalDocumentFactory::new(),
            'vehicle_id' => VehicleFactory::new(),
            'wheel_config_id' => WheelConfigFactory::new(),
            'axle' => Axle::All->value,
            // Both NULL: the document does not scope the fitment by build window.
            'build_from' => null,
            'build_to' => null,
            'permitted_width_min' => null,
            'permitted_width_max' => null,
            'permitted_et_min' => null,
            'permitted_et_max' => null,
            // NULL: the document states no bore of its own for this vehicle. Defaulting it to the
            // rim's figure would put a number in the record that no document ever stated.
            'centre_bore_mm' => null,
            'requires_entry' => false,
            'status' => FitmentStatus::Published->value,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (): array => ['status' => FitmentStatus::Draft->value]);
    }

    public function retired(): static
    {
        return $this->state(fn (): array => ['status' => FitmentStatus::Retired->value]);
    }

    public function requiringEntry(string $note = 'Eintragung durch eine amtlich anerkannte Prüfstelle.'): static
    {
        return $this->state(fn (): array => ['requires_entry' => true, 'entry_note_de' => $note]);
    }

    public function permittedWidth(?float $min, ?float $max): static
    {
        return $this->state(fn (): array => ['permitted_width_min' => $min, 'permitted_width_max' => $max]);
    }

    public function permittedEt(?int $min, ?int $max): static
    {
        return $this->state(fn (): array => ['permitted_et_min' => $min, 'permitted_et_max' => $max]);
    }

    public function scopedTo(?string $from, ?string $to): static
    {
        return $this->state(fn (): array => ['build_from' => $from, 'build_to' => $to]);
    }

    /** The Mittenlochbohrung this document states for the vehicle this row covers. */
    public function statingCentreBore(?float $mm): static
    {
        return $this->state(fn (): array => ['centre_bore_mm' => $mm]);
    }

    public function forAxle(Axle $axle): static
    {
        return $this->state(fn (): array => ['axle' => $axle->value]);
    }
}
