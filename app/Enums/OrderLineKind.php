<?php

declare(strict_types=1);

namespace App\Enums;

enum OrderLineKind: string
{
    case Wheel = 'WHEEL';
    case Tyre = 'TYRE';
    case Package = 'PACKAGE';
    case Service = 'SERVICE';
    case Accessory = 'ACCESSORY';

    /** Only these carry a frozen fitment verdict: they are the lines with a legal answer attached. */
    public function requiresFitmentSnapshot(): bool
    {
        return in_array($this, [self::Wheel, self::Package], true);
    }

    public function labelDe(): string
    {
        return match ($this) {
            self::Wheel => 'Felge',
            self::Tyre => 'Reifen',
            self::Package => 'Komplettrad',
            self::Service => 'Serviceleistung',
            self::Accessory => 'Zubehör',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
