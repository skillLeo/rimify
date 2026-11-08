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
