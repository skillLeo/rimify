<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * The engine's own severity scale.
 *
 * Deliberately NOT `App\Enums\ConditionSeverity`: the engine depends on no application enum and no
 * Eloquent model (R-13), so it can be exercised with nothing booted and cannot be changed by a
 * decision taken elsewhere in the application. `Infrastructure/` maps between the two, and a test
 * asserts the two sets of values stay identical — if they ever diverge, that is a defect, not a
 * translation.
 */
enum Severity: string
{
    /** Worth knowing, changes nothing. Collapsed by default, and does not downgrade a verdict. */
    case Info = 'INFO';

    /** The customer must do something themselves. */
    case Action = 'ACTION';

    /** Requires a workshop, so it materially changes what the purchase costs. */
    case Workshop = 'WORKSHOP';

    /** Narrows what may be bought; applied as a filter, not only as text. */
    case Restriction = 'RESTRICTION';

    /** Display ordering: the expensive obligations first. */
    public function weight(): int
    {
        return match ($this) {
            self::Restriction => 4,
            self::Workshop => 3,
            self::Action => 2,
            self::Info => 1,
        };
    }

    /**
     * Anything above INFO makes a verdict CONDITIONAL. INFO does not, because treating every
     * condition as alarming teaches customers to ignore all of them — including the one that
     * matters.
     */
    public function affectsPurchaseByDefault(): bool
    {
        return $this !== self::Info;
    }

    public function requiresAcknowledgement(): bool
    {
        return $this === self::Workshop;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
