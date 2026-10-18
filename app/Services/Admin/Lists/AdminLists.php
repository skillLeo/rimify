<?php

declare(strict_types=1);

namespace App\Services\Admin\Lists;

use App\Enums\PermissionModule;
use App\Http\Requests\Admin\BestellungenFilterRequest;
use App\Http\Requests\Admin\FelgenFilterRequest;
use Illuminate\Foundation\Http\FormRequest;

/**
 * The admin's lists that carry Gespeicherte Ansichten and a Spaltenwahl (docs/admin/rest-build-plan.md,
 * step 2.2) — one entry per list, so every later list plugs into the same views and columns by
 * describing itself here: who may open it, where it lives, which query keys make one of its views,
 * and which columns it can show.
 *
 * @phpstan-type Column array{key: string, label: string, default: bool, required: bool}
 * @phpstan-type ListSpec array{module: PermissionModule, path: string, keys: list<string>, request: class-string<FormRequest>, columns: list<Column>}
 */
final class AdminLists
{
    public const BESTELLUNGEN = 'bestellungen';

    public const FELGEN = 'felgen';

    /** @return list<string> */
    public static function keys(): array
    {
        return [self::BESTELLUNGEN, self::FELGEN];
    }

    /** @return ListSpec|null */
    public static function get(string $list): ?array
    {
        return match ($list) {
            self::BESTELLUNGEN => [
                'module' => PermissionModule::Orders,
                'path' => '/admin/bestellungen',
                // BestellungenFilterRequest::canonical — a view is exactly these, never the page.
                'keys' => ['q', 'status', 'zeitraum', 'von', 'bis', 'zahlart', 'versandart', 'min', 'max', 'auflagen', 'sort', 'richtung'],
                // The list's own Form Request: a view's filters must be ones the list takes.
                'request' => BestellungenFilterRequest::class,
                'columns' => [
                    // The number names the order: it cannot be hidden.
                    ['key' => 'nummer', 'label' => 'Nummer', 'default' => true, 'required' => true],
                    ['key' => 'datum', 'label' => 'Datum', 'default' => true, 'required' => false],
                    ['key' => 'kunde', 'label' => 'Kundin oder Kunde', 'default' => true, 'required' => false],
                    ['key' => 'fahrzeug', 'label' => 'Fahrzeug', 'default' => false, 'required' => false],
                    ['key' => 'summe', 'label' => 'Summe', 'default' => true, 'required' => false],
                    ['key' => 'zahlung', 'label' => 'Zahlung', 'default' => true, 'required' => false],
                    ['key' => 'versand', 'label' => 'Versand', 'default' => true, 'required' => false],
                ],
            ],
            self::FELGEN => [
                'module' => PermissionModule::Catalogue,
                'path' => '/admin/felgen',
                'keys' => ['q', 'status', 'marke', 'freigaben', 'demo', 'radtyp', 'sort', 'richtung'],
                'request' => FelgenFilterRequest::class,
                'columns' => [
                    // Brand and model name the row: they cannot be hidden.
                    ['key' => 'felge', 'label' => 'Felge', 'default' => true, 'required' => true],
                    ['key' => 'status', 'label' => 'Status', 'default' => true, 'required' => false],
                    ['key' => 'groessen', 'label' => 'Größen', 'default' => true, 'required' => false],
                    ['key' => 'preis', 'label' => 'Preis ab', 'default' => true, 'required' => false],
                    // Available or not, never a count (D-299); the key stays, as saved views name it.
                    ['key' => 'bestand', 'label' => 'Verfügbar', 'default' => true, 'required' => false],
                    ['key' => 'freigaben', 'label' => 'Freigaben', 'default' => true, 'required' => false],
                    ['key' => 'aktualisiert', 'label' => 'Geändert', 'default' => false, 'required' => false],
                ],
            ],
            default => null,
        };
    }

    /**
     * The columns to show from a stored choice: the list's own keys only, in the list's order, the
     * required ones always — and the defaults where nothing (or nothing usable) was chosen.
     *
     * @return list<string>
     */
    public static function columns(string $list, mixed $chosen): array
    {
        $spec = self::get($list);

        if ($spec === null) {
            return [];
        }

        $picked = is_array($chosen) ? array_values(array_filter($chosen, 'is_string')) : null;
        $shown = [];

        foreach ($spec['columns'] as $column) {
            $on = $picked === null ? $column['default'] : in_array($column['key'], $picked, true);

            if ($column['required'] || $on) {
                $shown[] = $column['key'];
            }
        }

        return $shown;
    }
}
