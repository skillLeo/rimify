<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The three kinds of German type-approval document, plus EC. They behave differently enough that
 * the schema must distinguish them (spec §1.3).
 */
enum ApprovalKind: string
{
    /** Allgemeine Betriebserlaubnis — a KBA general operating permit for the wheel itself. */
    case Abe = 'ABE';

    /** A parts report under §19(3) StVZO; normally requires entry into the vehicle papers. */
    case Teilegutachten = 'TEILEGUTACHTEN';

    /** ECE-R124 European type approval for replacement wheels; carries an approval mark. */
    case Ece = 'ECE';

    /** EC type approval. */
    case Ec = 'EC';

    public function labelDe(): string
    {
        return match ($this) {
            self::Abe => 'ABE',
            self::Teilegutachten => 'Teilegutachten',
            self::Ece => 'ECE-Genehmigung',
            self::Ec => 'EG-Genehmigung',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
