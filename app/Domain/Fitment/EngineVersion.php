<?php

declare(strict_types=1);

namespace App\Domain\Fitment;

/**
 * The resolver's build identity, frozen onto every order line.
 *
 * Bump it on any change that could alter a verdict for the same inputs. If a defect is ever found,
 * this is what lets RIMIFY name exactly which orders were computed by the affected build instead
 * of re-checking the whole history or guessing.
 */
final class EngineVersion
{
    public const CURRENT = '1.0.0';

    private function __construct() {}
}
