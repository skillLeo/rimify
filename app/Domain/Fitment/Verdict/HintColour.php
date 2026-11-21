<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Verdict;

/**
 * The colour a code gives the „Mit Auflagen“ hint on the listing and the product page (the client's item 23; supersedes D-247 for
 * colour). Presentation only: nothing that decides a verdict reads it, and the words stay what they are.
 */
enum HintColour: string
{
    case Green = 'green';
    case Yellow = 'yellow';
    // The client's round of 08.11.2026, §6 (D-439): „Add the option to select 'Red' as a color.“
    case Red = 'red';

    public function labelDe(): string
    {
        return match ($this) {
            self::Green => 'Grün',
            self::Yellow => 'Gelb',
            self::Red => 'Rot',
        };
    }

    /**
     * What one chosen size or combination asks, for the Komplettrad's tyre step (D-488, the client's review of 19.11.2026): its
     * standing — `auflagen` where a code asks something of the customer or the Eintragung is needed, `hinweise` where every code
     * is a Hinweis, `keine` where there is none — and the colour its codes carry in the admin (D-439), loudest first; an Auflage
     * with no colour of its own is the yellow caution, an Eintragung alone too. Presentation only, as the verdict's hint.
     *
     * @param  list<Condition>  $conditions
     * @return array{standing: 'auflagen'|'hinweise'|'keine', hint: 'green'|'yellow'|'red'|null}
     */
    public static function standingOf(array $conditions, bool $entry): array
    {
        $colour = null;

        foreach ($conditions as $condition) {
            // A Hinweis is nothing to do (#23, D-104), whatever its severity: quiet, as the verdict's own notesOnly() reads it.
            if (! $condition->downgradesVerdict() || $condition->level() === ConditionLevel::Hinweis) {
                continue;
            }

            $own = $condition->hintColour ?? self::Yellow;
            $colour = $colour === null || $own->rank() > $colour->rank() ? $own : $colour;
        }

        if ($colour === null && $entry) {
            $colour = self::Yellow;
        }

        return match (true) {
            $colour !== null => ['standing' => 'auflagen', 'hint' => $colour->value],
            $conditions !== [] => ['standing' => 'hinweise', 'hint' => null],
            default => ['standing' => 'keine', 'hint' => null],
        };
    }

    /** How loud: the hint takes the loudest colour among the codes that make the answer conditional. */
    public function rank(): int
    {
        return match ($this) {
            self::Green => 0,
            self::Yellow => 1,
            self::Red => 2,
        };
    }
}
