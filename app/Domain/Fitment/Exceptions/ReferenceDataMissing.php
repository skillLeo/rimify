<?php

declare(strict_types=1);

namespace App\Domain\Fitment\Exceptions;

use RuntimeException;

/**
 * Thrown when the reference tables the derivations run against are empty.
 *
 * This is deliberately loud. An empty load-index table cannot be allowed to look like "no
 * minimum applies": that is a configuration fault presenting itself as a permissive legal answer.
 */
final class ReferenceDataMissing extends RuntimeException
{
    public static function loadIndexTable(): self
    {
        return new self(
            'The load index table is empty. Without it no minimum load index can be derived, '
            .'and a missing minimum would permit every tyre. Seed ReferenceDataSeeder.'
        );
    }

    public static function speedSymbolTable(): self
    {
        return new self(
            'The speed symbol table is empty. Without it no minimum speed symbol can be derived, '
            .'and a missing minimum would permit every tyre. Seed ReferenceDataSeeder.'
        );
    }
}
