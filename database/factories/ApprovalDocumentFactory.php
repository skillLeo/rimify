<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ApprovalKind;
use App\Enums\DocumentStatus;
use App\Enums\TyreIndexSource;
use App\Models\ApprovalDocument;
use App\Models\DocumentSpeedDerating;
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

    /**
     * A document that prints its own table of tyre load at speed — ABE 55255's, page 6. Without one a car
     * faster than 210 km/h gets an UNKNOWN tyre half (the operator's review of C9, §5), so a test about
     * something else on a fast car gives its document the table.
     */
    public function printingDeratingTable(): static
    {
        return $this->afterCreating(static function (ApprovalDocument $document): void {
            /** @var array{source_page: int, rows: array<int, array<string, int|null>>} $printed */
            $printed = require database_path('seeders/content/derating-abe-55255.php');

            foreach ($printed['rows'] as $speed => $row) {
                foreach ($row as $symbol => $percent) {
                    DocumentSpeedDerating::query()->create([
                        'approval_document_id' => $document->id,
                        'speed_kmh' => $speed,
                        'symbol' => $symbol,
                        'percent' => $percent,
                        'source_page' => $printed['source_page'],
                    ]);
                }
            }
        });
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
