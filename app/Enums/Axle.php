<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Mixed fitment is modelled now and exposed later (spec §4.10): different sizes front and
 * rear are common on exactly the performance cars in the client's demo data, and supporting it
 * later must be a UI change, not a migration.
 */
enum Axle: string
{
    case All = 'ALL';
    case Front = 'FRONT';
    case Rear = 'REAR';

    public function coversFront(): bool
    {
        return $this !== self::Rear;
    }

    public function coversRear(): bool
    {
        return $this !== self::Front;
    }

    public function labelDe(): string
    {
        return match ($this) {
            self::All => 'Alle Achsen',
            self::Front => 'Vorderachse',
            self::Rear => 'Hinterachse',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
