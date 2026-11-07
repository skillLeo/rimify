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

    public function labelDe(): string
    {
        return match ($this) {
            self::Green => 'Grün',
            self::Yellow => 'Gelb',
        };
    }
}
