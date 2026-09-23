<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * Why the verdict carries the Mittenlochbohrung it carries — or why it carries none.
 *
 * The bore is a relationship, not a rim attribute (CLAUDE.md §1): the document states it for the
 * vehicle the rim was tested on, and where it does, the document wins (R-06). The engine reports
 * only what the document said, so this enum records which of three things happened, rather than
 * leaving a bare null the caller has to guess about.
 */
enum CentreBoreSource: string
{
    /** Every covering row that states a bore states the same one, and the verdict carries it. */
    case Document = 'DOCUMENT';

    /**
     * No covering row states a bore. The engine has nothing to report, and the storefront decides
     * what to show instead — the rim's own figure, labelled as the rim's.
     */
    case Unstated = 'UNSTATED';

    /**
     * Covering rows state different bores for this vehicle, so the verdict carries none.
     *
     * Picking one of them would be confidently wrong about the one figure that decides whether a
     * Zentrierring is needed, and §2 says be silent instead.
     */
    case Conflicting = 'CONFLICTING';
}
