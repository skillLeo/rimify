<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * Which source produced a per-axle minimum (R-06).
 *
 * Recorded on the verdict so the reasoning is inspectable rather than assumed: when a customer or
 * a workshop asks why a 92 was required, the answer is either "the document says so" or "your
 * car's axle load says so", and those are different conversations.
 */
enum MinSource: string
{
    /** The Gutachten stated its own minimum, and it governed. */
    case Document = 'DOCUMENT';

    /** Derived from the vehicle's axle load or top speed, because the document was silent — or
     *  because the derivation was the stricter of the two. */
    case Derived = 'DERIVED';

    /** The car's own papers named it (15.1, 15.2, as the customer typed them) and it was the stricter — never in
     *  place of a derivation, only on top of one (R-03, D-242). */
    case Papers = 'PAPERS';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
