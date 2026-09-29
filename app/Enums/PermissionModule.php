<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * The module half of the permission matrix — the rows of the Rollen & Rechte grid.
 *
 * Not every module knows every action: an order is never "published", the Protokoll is never
 * "deleted". `actions()` names the ones that are real for each module, and nothing else is shown,
 * accepted or seeded — a checkbox for a right that no code ever asks about would be a promise the
 * panel cannot keep.
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

    /**
     * The actions this module really has, in the grid's column order.
     *
     * @return list<PermissionAction>
     */
    public function actions(): array
    {
        return match ($this) {
            self::Catalogue, self::Approvals => [
                PermissionAction::View, PermissionAction::Create, PermissionAction::Edit,
                PermissionAction::Delete, PermissionAction::Publish, PermissionAction::Export,
            ],
            self::Vehicles => [
                PermissionAction::View, PermissionAction::Create, PermissionAction::Edit,
                PermissionAction::Delete, PermissionAction::Export,
            ],
            self::Orders => [PermissionAction::View, PermissionAction::Edit, PermissionAction::Export],
            self::Customers => [PermissionAction::View, PermissionAction::Edit, PermissionAction::Delete, PermissionAction::Export],
            self::Content => [
                PermissionAction::View, PermissionAction::Create, PermissionAction::Edit,
                PermissionAction::Delete, PermissionAction::Publish,
            ],
            self::Media, self::Roles => [PermissionAction::View, PermissionAction::Create, PermissionAction::Edit, PermissionAction::Delete],
            self::Imports => [PermissionAction::View, PermissionAction::Create],
            self::Reports, self::AuditLog => [PermissionAction::View, PermissionAction::Export],
            self::Settings => [PermissionAction::View, PermissionAction::Edit],
        };
    }

    /** Whether the action is one this module really has. */
    public function hasAction(PermissionAction $action): bool
    {
        return in_array($action, $this->actions(), true);
    }

    /**
     * Every real cell of the grid as `module.action`, modules in row order and actions in column
     * order — the only rights a role can hold.
     *
     * @return list<string>
     */
    public static function cells(): array
    {
        $cells = [];

        foreach (self::cases() as $module) {
            foreach ($module->actions() as $action) {
                $cells[] = $module->value.'.'.$action->value;
            }
        }

        return $cells;
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
