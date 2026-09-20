<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Two documents that disagree about the same vehicle and wheel are a real-world event — a reissue,
 * a transcription slip, a genuinely narrower second approval — surfaced at entry time rather than
 * at complaint time (spec §4.8).
 */
enum ConflictKind: string
{
    /**
     * One document requires entry in the papers, the other does not. A HARD BLOCK on save: the
     * stricter answer is the only safe one to show a customer.
     */
    case EntryRequirement = 'ENTRY_REQUIREMENT';

    case TyreSizes = 'TYRE_SIZES';
    case WidthEtRange = 'WIDTH_ET_RANGE';
    case Conditions = 'CONDITIONS';

    public function isBlocking(): bool
    {
        return $this === self::EntryRequirement;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
