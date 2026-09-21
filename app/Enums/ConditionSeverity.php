<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Four severities, which drive both the wording and the placement in the interface
 * (spec §4.7). An INFO condition must not look like a warning: treating every condition as
 * alarming teaches customers to ignore all of them — including the one that matters.
 */
enum ConditionSeverity: string
{
    /** Worth knowing, changes nothing. Collapsed by default. */
    case Info = 'INFO';

    /** The customer must do something themselves. Rendered expanded, above add-to-basket. */
    case Action = 'ACTION';

    /** Requires a workshop, so it materially changes the cost — acknowledged before the basket. */
    case Workshop = 'WORKSHOP';

    /** Narrows what may be bought; applied as a filter, not only as text. */
    case Restriction = 'RESTRICTION';

    /** Ordering for display: the expensive obligations first. */
    public function weight(): int
    {
        return match ($this) {
            self::Restriction => 4,
            self::Workshop => 3,
            self::Action => 2,
            self::Info => 1,
        };
    }

    /** A verdict carrying any of these is CONDITIONAL, never PERMITTED. */
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
