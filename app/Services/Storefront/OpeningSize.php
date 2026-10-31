<?php

declare(strict_types=1);

namespace App\Services\Storefront;

use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictStatus;

/**
 * The size a wheel's product page opens on — and the size its card speaks for and links to. One rule for both, so a card
 * and its page never give two answers (M-6, the operator's answer of 31.10.2026): until then the card summed its sizes
 * itself and the page picked its own in the browser, and six cards said „Noch nicht bestätigt“ over pages that said
 * „Nicht freigegeben“.
 *
 * Sold and available first, then sold; of the rest, the size whose answer is still open — its tyres first, then any
 * other open question —, the refused last. The cheapest within each, the oldest row on a tie.
 */
final class OpeningSize
{
    /**
     * @param  list<array{id: int, verdict: FitmentVerdict|null, inStock: bool, priceCents: int}>  $sizes
     */
    public static function pick(array $sizes): ?int
    {
        if ($sizes === []) {
            return null;
        }

        usort($sizes, static fn (array $a, array $b): int => [self::rank($a), $a['priceCents'], $a['id']] <=> [self::rank($b), $b['priceCents'], $b['id']]);

        return $sizes[0]['id'];
    }

    /** @param  array{verdict: FitmentVerdict|null, inStock: bool}  $size */
    private static function rank(array $size): int
    {
        $verdict = $size['verdict'];

        // No car chosen: every size is offered, as the page offers it. A rim sold alone while its tyres wait (D-289) sells.
        if ($verdict === null || $verdict->isSellable() || $verdict->forRimAlone() !== null) {
            return $size['inStock'] ? 0 : 1;
        }

        if ($verdict->tyreUnconfirmed()) {
            return 2;
        }

        return $verdict->status === VerdictStatus::Unknown ? 3 : 4;
    }
}
