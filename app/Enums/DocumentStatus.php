<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Approval-document lifecycle. Revisions supersede, never overwrite (spec §4.9), so a
 * superseded document stays readable for every order that was placed against it.
 */
enum DocumentStatus: string
{
    case Draft = 'draft';
    case Published = 'published';
    case Superseded = 'superseded';
    case Withdrawn = 'withdrawn';

    /** Only a published document may ever produce a positive verdict. */
    public function isVisibleToCustomers(): bool
    {
        return $this === self::Published;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
