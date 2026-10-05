<?php

declare(strict_types=1);

namespace App\Services\Reset;

use RuntimeException;

/**
 * The append-only check (ResetProbe) did not hold after tables were made again: the reset counts as failed (CLAUDE.md
 * R-12.3), its tables go back from the safety copy, and the Protokoll names each check that failed.
 */
final class ResetCheckFailed extends RuntimeException
{
    /** @param  list<array{check: string, text: string, detail: string}>  $failures */
    public function __construct(public readonly array $failures, string $when)
    {
        parent::__construct('Prüfung '.$when.' fehlgeschlagen: '.implode('; ', array_map(
            static fn (array $f): string => $f['text'].' ('.$f['detail'].')',
            $failures,
        )));
    }
}
