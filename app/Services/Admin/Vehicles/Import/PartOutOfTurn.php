<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles\Import;

use RuntimeException;

/** A part of a vehicle file that does not start where the file on the server ends: the browser goes on from `held`. */
final class PartOutOfTurn extends RuntimeException
{
    public function __construct(public readonly int $held)
    {
        parent::__construct('The part does not start where the file ends.');
    }
}
