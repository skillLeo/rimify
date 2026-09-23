<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The three seasons a tyre is sold for. `chk_tyre_variants_season` holds exactly these values
 * (create_catalogue_tables.php), and KomplettradColumnsTest keeps the two identical — the same
 * discipline that keeps ConditionSeverity and its CHECK from drifting apart.
 */
enum TyreSeason: string
{
    case Sommer = 'sommer';
    case Winter = 'winter';
    case Ganzjahres = 'ganzjahres';

    /** 'Sommer' — the qualifier used inside a frozen order-line label. */
    public function labelDe(): string
    {
        return match ($this) {
            self::Sommer => 'Sommer',
            self::Winter => 'Winter',
            self::Ganzjahres => 'Ganzjahres',
        };
    }

    /** 'Sommerreifen' — the word a customer reads on a card. */
    public function longLabelDe(): string
    {
        return match ($this) {
            self::Sommer => 'Sommerreifen',
            self::Winter => 'Winterreifen',
            self::Ganzjahres => 'Ganzjahresreifen',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
