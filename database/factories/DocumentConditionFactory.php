<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentCondition>
 */
class DocumentConditionFactory extends Factory
{
    protected $model = DocumentCondition::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'approval_document_id' => ApprovalDocument::factory(),
            'code' => strtoupper($this->faker->unique()->bothify('?##')),
            'kind' => ConditionKind::Hinweis->value,
            'text_de' => 'Hinweis aus dem Gutachten, als ganzer Satz.',
            'source_page' => 2,
        ];
    }

    public function kind(ConditionKind $kind, string $textDe): static
    {
        return $this->state(fn (): array => ['kind' => $kind->value, 'text_de' => $textDe]);
    }
}
