<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Models\ApprovalDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ApprovalDocument>
 */
class ApprovalDocumentFactory extends Factory
{
    protected $model = ApprovalDocument::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'kind' => ApprovalKind::Teilegutachten->value,
            'report_number' => 'TG-'.$this->faker->numerify('####-##-####'),
            'issuer' => $this->faker->randomElement(['TÜV Rheinland', 'DEKRA', 'TÜV SÜD']),
            'issued_on' => $this->faker->dateTimeBetween('-5 years', '-1 month')->format('Y-m-d'),
            'revision' => 1,
            'valid_from' => $this->faker->dateTimeBetween('-5 years', '-1 month')->format('Y-m-d'),
            'valid_to' => null,
            'pdf_key' => 'gutachten/'.$this->faker->uuid().'.pdf',
            // A real-shaped digest: the published CHECK constraint requires 64 lower-case hex.
            'pdf_sha256' => hash('sha256', $this->faker->unique()->uuid()),
            'page_count' => $this->faker->numberBetween(4, 40),
            'status' => DocumentStatus::Published->value,
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (): array => ['status' => DocumentStatus::Draft->value]);
    }

    public function superseded(): static
    {
        return $this->state(fn (): array => ['status' => DocumentStatus::Superseded->value]);
    }

    public function withdrawn(): static
    {
        return $this->state(fn (): array => ['status' => DocumentStatus::Withdrawn->value]);
    }

    /** Published, but its validity window has already closed. */
    public function expired(): static
    {
        return $this->state(fn (): array => [
            'status' => DocumentStatus::Published->value,
            'valid_from' => now()->subYears(3)->toDateString(),
            'valid_to' => now()->subDay()->toDateString(),
        ]);
    }

    public function abe(): static
    {
        return $this->state(fn (): array => [
            'kind' => ApprovalKind::Abe->value,
            'kba_number' => $this->faker->numerify('#####'),
            'report_number' => null,
        ]);
    }
}
