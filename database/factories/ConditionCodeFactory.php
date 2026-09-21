<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Enums\ConditionSeverity;
use App\Models\ConditionCode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ConditionCode>
 */
class ConditionCodeFactory extends Factory
{
    protected $model = ConditionCode::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        return [
            'code' => mb_strtoupper($this->faker->unique()->bothify('COND_?????')),
            'severity' => ConditionSeverity::Info->value,
            // Never empty: a condition without a sentence would put a bare code in front of a
            // customer, which R-15 forbids and a CHECK constraint refuses.
            'text_de' => 'Hinweis zur Reifengröße beachten.',
            'affects_tyre_choice' => false,
            'affects_purchase' => false,
            'requires_acknowledgement' => false,
            'sort_order' => 0,
        ];
    }

    public function severity(ConditionSeverity $severity): static
    {
        return $this->state(fn (): array => [
            'severity' => $severity->value,
            'affects_purchase' => $severity->affectsPurchaseByDefault(),
            'requires_acknowledgement' => $severity->requiresAcknowledgement(),
        ]);
    }

    public function entryRequired(): static
    {
        return $this->state(fn (): array => [
            'code' => 'ENTRY_REQUIRED',
            'severity' => ConditionSeverity::Action->value,
            'text_de' => 'Eintragung in die Fahrzeugpapiere erforderlich.',
            'affects_purchase' => true,
        ]);
    }

    public function archRolling(): static
    {
        return $this->state(fn (): array => [
            'code' => 'ARCH_ROLLING',
            'severity' => ConditionSeverity::Workshop->value,
            'text_de' => 'Bördeln der Radläufe erforderlich.',
            'affects_purchase' => true,
            'requires_acknowledgement' => true,
        ]);
    }

    public function tyreBrandLimit(): static
    {
        return $this->state(fn (): array => [
            'code' => 'TYRE_BRAND_LIMIT',
            'severity' => ConditionSeverity::Restriction->value,
            'text_de' => 'Nur mit Reifen der angegebenen Hersteller zulässig.',
            'affects_tyre_choice' => true,
            'affects_purchase' => true,
        ]);
    }
}
