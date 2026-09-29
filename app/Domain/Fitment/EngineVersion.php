<?php

declare(strict_types=1);

namespace App\Domain\Fitment;

/**
 * The resolver's build identity, frozen onto every order line.
 *
 * Bump it on any change that could alter a verdict for the same inputs. If a defect is ever found,
 * this is what lets RIMIFY name exactly which orders were computed by the affected build instead
 * of re-checking the whole history or guessing.
 *
 * 1.1.0 (29.09.2026): the tyre half and the combined answer (R-03 as amended), the document's table of
 * tyre load at speed, the kW band beside a size, and codes read where the document prints them —
 * body-style codes as alternatives, a size's own codes narrowing that size, one size printed twice read
 * as one. Orders frozen before carry 1.0.0.
 *
 * 1.2.0 (29.09.2026): a car's body style and drive where its data has none — the owner's answer, else an
 * unambiguous word of its name (the operator's last prompt §1.1), each frozen with its source — and an UNKNOWN
 * that names what of the car it waits for.
 */
final class EngineVersion
{
    public const CURRENT = '1.2.0';

    private function __construct() {}
}
