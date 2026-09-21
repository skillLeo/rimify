<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * Four states, never a boolean (R-07).
 *
 * The distinction that matters most is `NotPermitted` versus `Unknown`. A boolean collapses them
 * into "no", which tells the customer something false — "we checked and your car cannot have this"
 * when the truth is "we hold no document" — and tells RIMIFY nothing. `Unknown` is also the input
 * to the catalogue-gap report: refusing to guess and learning which Gutachten to buy next turn out
 * to be the same mechanism.
 */
enum VerdictStatus: string
{
    /** A published document permits it, with no condition that affects the purchase. */
    case Permitted = 'PERMITTED';

    /** Permitted, but conditions apply and must be read before the basket. */
    case Conditional = 'CONDITIONAL';

    /** We hold a document and it does not cover this combination. */
    case NotPermitted = 'NOT_PERMITTED';

    /** We hold no document, or the vehicle record is incomplete under R-03. */
    case Unknown = 'UNKNOWN';

    /** May the customer put this in the basket at all? */
    public function isSellable(): bool
    {
        return $this === self::Permitted || $this === self::Conditional;
    }

    /** Does this outcome mean RIMIFY should learn something from it? */
    public function feedsGapReport(): bool
    {
        return $this === self::Unknown;
    }

    public function labelDe(): string
    {
        return match ($this) {
            self::Permitted => 'Freigegeben',
            self::Conditional => 'Freigegeben mit Auflagen',
            self::NotPermitted => 'Nicht freigegeben',
            self::Unknown => 'Keine Angabe',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
