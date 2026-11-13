<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Enums\TyreIndexSource;
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
            // From the app's clock, which a test's travelTo() moves; Faker's '-5 years' reads the wall clock and drew
            // a document not yet valid on a travelled test's day (D-436).
            'issued_on' => $this->faker->dateTimeBetween(now()->subYears(5)->toDateTime(), now()->subMonth()->toDateTime())->format('Y-m-d'),
            'revision' => 1,
            'valid_from' => $this->faker->dateTimeBetween(now()->subYears(5)->toDateTime(), now()->subMonth()->toDateTime())->format('Y-m-d'),
            'valid_to' => null,
            'pdf_key' => 'gutachten/'.$this->faker->uuid().'.pdf',
            // A real-shaped digest: the published CHECK constraint requires 64 lower-case hex.
            'pdf_sha256' => hash('sha256', $this->faker->unique()->uuid()),
            // Fixed, never random: tests cite pages up to 13, and a draw below that failed one now and then
            // („Das Gutachten hat nur 6 Seiten.“). A test about the page limit sets its own count.
            'page_count' => 24,
            'status' => DocumentStatus::Published->value,
            // A fixture document is entered whole, and someone said so (D-227). A test about the default sets
            // `unanswered()`: in the shop, a document nobody has answered for reads as partial.
            'completeness' => ApprovalDocument::COMPLETE,
            'completeness_at' => now(),
            'completeness_revision' => 1,
            // How it gives its tyres' index, read off it (D-277): the papers, the answer that asks the most of a car. A test
            // about another answer, or about none, sets `tyreIndex()`.
            'tyre_index_source' => TyreIndexSource::Papers->value,
        ];
    }

    /** How the document gives its tyres' load index and speed symbol; null = never answered (D-277). */
    public function tyreIndex(?TyreIndexSource $source): static
    {
        return $this->state(fn (): array => ['tyre_index_source' => $source?->value]);
    }

    /** Released before the completeness question existed, or never answered: read as partial (D-227). */
    public function unanswered(): static
    {
        return $this->state(fn (): array => ['completeness' => null, 'completeness_at' => null, 'completeness_revision' => null]);
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
