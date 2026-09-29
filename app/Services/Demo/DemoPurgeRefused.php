<?php

declare(strict_types=1);

namespace App\Services\Demo;

use RuntimeException;

/**
 * The demo set was not removed, and nothing of it was: something real still names the example catalogue
 * (DemoCatalogue::blockers()). Each reason is one German sentence saying what and what to do.
 */
final class DemoPurgeRefused extends RuntimeException
{
    /** @param  list<string>  $reasons */
    public function __construct(public readonly array $reasons)
    {
        parent::__construct(implode(' ', $reasons));
    }
}
