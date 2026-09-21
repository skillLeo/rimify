<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The action half of the module × action permission matrix. Spatie stores the roles; this is the
 * application's own model of what a role may do, so the panel can render a grid rather than a
 * list of opaque permission strings.
 */
enum PermissionAction: string
{
    case View = 'view';
    case Create = 'create';
    case Edit = 'edit';
    case Delete = 'delete';
    case Publish = 'publish';
    case Export = 'export';

    public function labelDe(): string
    {
        return match ($this) {
            self::View => 'Ansehen',
            self::Create => 'Anlegen',
            self::Edit => 'Bearbeiten',
            self::Delete => 'Löschen',
            self::Publish => 'Veröffentlichen',
            self::Export => 'Exportieren',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
