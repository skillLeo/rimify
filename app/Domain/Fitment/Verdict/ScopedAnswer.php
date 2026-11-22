<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

use App\Support\Switches;

/**
 * A4 of the operator's brief of 22.11.2026, behind `rimify.features.scoped_auflagen` (off): a Komplettrad's answer scoped to
 * the sizes chosen — an Auflage the paper prints beside another size of the row is not said for this set. The reverse of
 * D-501's floor (SetAnswerFloor), and less strict than it; the client decides whether it is right (the operator's answer of
 * 21.11.2026, item 1: „Don't scope it by size until he says yes“). D-506.
 *
 * Only the wheel half moves, and only as the resolver makes it (FitmentResolver: the Eintragung, or an Auflage that is no tyre
 * limit): with the set's own Auflagen and the set's own Eintragung. The tyre half stays as resolved, the weaker of the two
 * decides, and anything other than a CONDITIONAL answer for a Komplettrad is returned as it is — fail closed.
 */
final class ScopedAnswer
{
    /** The answer for this set, where the switch is on; the verdict itself everywhere else. */
    public static function of(FitmentVerdict $verdict, ?string $sizeKey, ?string $partnerKey = null): FitmentVerdict
    {
        if (! Switches::scopedAuflagen() || $sizeKey === null || $verdict->status !== VerdictStatus::Conditional
            || $verdict->rimAlone || $verdict->restored || $verdict->reason !== null || $verdict->tyre === null) {
            return $verdict;
        }

        $groups = $verdict->conditionGroups();
        $set = $groups->forSet($sizeKey, $partnerKey);
        $entry = $partnerKey === null ? $groups->entryFor($sizeKey, $verdict->requiresEntry) : $groups->entryForSet($sizeKey, $partnerKey);

        $affects = array_filter($set, static fn (Condition $c): bool => $c->downgradesVerdict() && ! $c->affectsTyreChoice) !== [];
        $wheel = $entry || $affects ? VerdictStatus::Conditional : VerdictStatus::Permitted;
        // Tyre limits are the tyres' half: kept whole, never scoped away with the Auflagen.
        $tyreLimits = array_values(array_filter($verdict->conditions, static fn (Condition $c): bool => $c->affectsTyreChoice && ! in_array($c, $set, false)));

        return $verdict->scopedTo(
            conditions: Condition::sorted([...$set, ...$tyreLimits]),
            status: VerdictStatus::weaker($wheel, $verdict->tyre->status),
            wheelStatus: $wheel,
            requiresEntry: $entry,
        );
    }
}
