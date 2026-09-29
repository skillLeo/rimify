<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The kinds of German type-approval document (spec §1.3, the corrections memo §4). They behave
 * differently enough that the schema must distinguish them. The order is the admin's choice list.
 */
enum ApprovalKind: string
{
    /** Allgemeine Betriebserlaubnis — a KBA general operating permit for the wheel itself. */
    case Abe = 'ABE';

    /** A supplement to another document: it names its base, which it does not replace. */
    case Nachtrag = 'NACHTRAG';

    /** A parts report under §19(3) StVZO; normally requires entry into the vehicle papers. */
    case Teilegutachten = 'TEILEGUTACHTEN';

    /** EG-Typgenehmigung — an EC type approval; carries an approval mark. */
    case Ec = 'EC';

    /** ECE-R124 European type approval for replacement wheels; carries an approval mark. */
    case Ece = 'ECE';

    public function labelDe(): string
    {
        return match ($this) {
            self::Abe => 'ABE',
            self::Nachtrag => 'Nachtrag',
            self::Teilegutachten => 'Teilegutachten',
            self::Ec => 'EG-Typgenehmigung',
            self::Ece => 'ECE-Genehmigung',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
