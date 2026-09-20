<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The module half of the permission matrix — the rows of the Rollen & Rechte grid.
 */
enum PermissionModule: string
{
    case Catalogue = 'catalogue';
    case Vehicles = 'vehicles';
    case Approvals = 'approvals';
    case Orders = 'orders';
    case Customers = 'customers';
    case Content = 'content';
    case Media = 'media';
    case Roles = 'roles';
    case Imports = 'imports';
    case Reports = 'reports';
    case Settings = 'settings';
    case AuditLog = 'audit_log';

    public function labelDe(): string
    {
        return match ($this) {
            self::Catalogue => 'Katalog',
            self::Vehicles => 'Fahrzeuge',
            self::Approvals => 'Gutachten',
            self::Orders => 'Bestellungen',
            self::Customers => 'Kunden',
            self::Content => 'Inhalte',
            self::Media => 'Medien',
            self::Roles => 'Rollen & Rechte',
            self::Imports => 'Importe',
            self::Reports => 'Auswertungen',
            self::Settings => 'Einstellungen',
            self::AuditLog => 'Protokoll',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
