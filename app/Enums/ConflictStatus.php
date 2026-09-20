<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * An unresolved conflict is a ROW with a status, so it appears on the admin dashboard until
 * someone deals with it and never gets lost in a toast notification (spec §4.8).
 */
enum ConflictStatus: string
{
    case Open = 'open';
    case ResolvedIntersection = 'resolved_intersection';
    case ResolvedSupersede = 'resolved_supersede';
    case Dismissed = 'dismissed';

    public function isOpen(): bool
    {
        return $this === self::Open;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
