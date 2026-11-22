<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * One answer for a Komplettrad, wherever it is read (the operator's answer of 21.11.2026, D-501): the tyre step, its tiles,
 * the basket, the Kasse, the order and its mail say the same. The order freezes the line's whole answer — every Auflage of
 * the row, whichever size the paper prints it beside — so the chosen set's answer carries every one of them too: the stricter
 * answer, never „Keine Auflagen.“ beside a basket that says „mit Auflagen“, never fewer Auflagen than the order keeps.
 * Whether an Auflage should count only for the sizes it names is the client's to say; until then nothing is scoped away.
 */
final class SetAnswerFloor
{
    /**
     * The Auflagen to show for the set chosen: its own and every other Auflage of the line, as the order freezes them.
     *
     * @param  list<Condition>  $set  the chosen set's own (ConditionGroups::forSet, forPair)
     * @return list<Condition>
     */
    public static function conditions(array $set, FitmentVerdict $verdict): array
    {
        if (! self::raises($set, $verdict)) {
            return $set;
        }

        return Condition::sorted(Condition::union($set, $verdict->conditions));
    }

    /**
     * A chosen set's answer as the page reads it (ConditionGroups::toArray, FelgenController::pairAnswer), raised the same way:
     * the line's Auflagen beside the combination's, and the standing and colour they give.
     *
     * @param  array<string, mixed>  $answer
     * @param  list<Condition>  $set  the chosen set's own
     * @return array<string, mixed>
     */
    public static function answer(array $answer, array $set, FitmentVerdict $verdict): array
    {
        if (! self::raises($set, $verdict)) {
            return $answer;
        }

        $listed = [...(array) ($answer['combination'] ?? [])];

        foreach ((array) ($answer['sizes'] ?? []) as $size) {
            $listed = [...$listed, ...(array) ($size['conditions'] ?? [])];
        }

        $extra = array_values(array_filter(
            array_map(static fn (Condition $c): string => $c->sentenceDe(), Condition::sorted($verdict->conditions)),
            static fn (string $sentence): bool => ! in_array($sentence, $listed, true),
        ));
        $standing = HintColour::standingOf(self::conditions($set, $verdict), $verdict->requiresEntry || ($answer['entry'] ?? false) === true);

        return [...$answer, 'combination' => [...(array) ($answer['combination'] ?? []), ...$extra], ...$standing];
    }

    /**
     * The line's groups as every page that reads a frozen or live Komplettrad line shows them (basket, order page, mail,
     * admin order): for a chosen size the set's answer raised as above, otherwise the groups as they stand.
     *
     * @return array<string, mixed>
     */
    public static function groups(FitmentVerdict $verdict, ?string $chosenKey, ?string $axle = null, ?string $partnerKey = null): array
    {
        $groups = $verdict->conditionGroups();

        if ($chosenKey === null) {
            return $groups->toArray(null, $axle, $partnerKey);
        }

        return self::answer($groups->toArray($chosenKey, $axle, $partnerKey), $groups->forSet($chosenKey, $partnerKey), $verdict);
    }

    /** @param list<Condition> $set */
    private static function raises(array $set, FitmentVerdict $verdict): bool
    {
        if ($verdict->status !== VerdictStatus::Conditional) {
            return false;
        }

        $own = array_map(static fn (Condition $c): string => $c->sentenceDe(), $set);

        // Any Auflage of the line that the set does not already say: the order freezes it, so the set says it too.
        foreach ($verdict->conditions as $condition) {
            if ($condition->downgradesVerdict() && ! in_array($condition->sentenceDe(), $own, true)) {
                return true;
            }
        }

        return false;
    }
}
