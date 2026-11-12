<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * One row of a vehicle dataset, as its run read it and as its Probelauf decided it (VehicleImporter, D-462).
 *
 * `cells` holds the contract fields as typed, in the order of CELLS: a list, not an object, because a file of half a
 * million cars would otherwise carry every field's name half a million times. The order is the storage's and never
 * changes; a field added to the importer is added at the end.
 *
 * @property int $id
 * @property int $vehicle_import_id
 * @property int $line
 * @property list<string>|null $cells
 * @property string $status
 * @property bool $read_refused
 * @property int|null $vehicle_id
 * @property string $label
 * @property string|null $keys
 * @property list<string>|null $changes
 * @property list<string>|null $notes
 * @property array<string, mixed>|null $fills
 * @property string|null $reason
 * @property string|null $dup_key
 * @property int|null $number
 */
class VehicleImportRow extends Model
{
    /** The fields of `cells`, in their stored order (the migration of D-462 holds the same list). */
    public const CELLS = [
        'hsn', 'tsn', 'hersteller', 'handelsname', 'variante', 'fahrzeugtyp', 'eg_nummer', 'leistung_kw', 'baubeginn', 'bauende',
        'karosserie', 'antrieb', 'achslast_vorn_kg', 'achslast_hinten_kg', 'hoechstgeschwindigkeit_kmh', 'gesamtmasse_kg', 'fahrzeug_id',
    ];

    /** While the Probelauf runs: read and not refused by itself; past the cars; matched to a car from a Gutachten. */
    public const PENDING = 'pending';

    public const OPEN = 'open';

    public const MATCHED = 'matched';

    public $timestamps = false;

    protected $guarded = ['id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'cells' => 'array',
            'read_refused' => 'boolean',
            'changes' => 'array',
            'notes' => 'array',
            'fills' => 'array',
        ];
    }

    /** @return BelongsTo<VehicleImport, $this> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(VehicleImport::class, 'vehicle_import_id');
    }

    /**
     * The row as the importer reads it: the contract fields by name, and the file's line.
     *
     * @param  list<string>|null  $cells
     * @return array<string, string>
     */
    public static function fields(?array $cells, int $line): array
    {
        $row = ['_line' => (string) $line];

        foreach (self::CELLS as $i => $field) {
            $row[$field] = (string) ($cells[$i] ?? '');
        }

        return $row;
    }

    /**
     * @param  array<string, string>  $row  the contract fields by name
     * @return list<string>
     */
    public static function cellsOf(array $row): array
    {
        return array_map(static fn (string $field): string => (string) ($row[$field] ?? ''), self::CELLS);
    }

    /**
     * The row's entry as the Probelauf shows it — the shape VehicleImporter::fingerprint() reads.
     *
     * @return array{line: string, label: string, keys: string|null, status: string, vehicle: int|null, changes: list<string>, notes: list<string>, reason: string|null}
     */
    public function entry(): array
    {
        return [
            'line' => (string) $this->line,
            'label' => $this->label,
            'keys' => $this->keys,
            'status' => $this->status,
            'vehicle' => $this->vehicle_id === null ? null : (int) $this->vehicle_id,
            // Read as the column: inside the model `$this->changes` is Eloquent's own record of what the last save changed.
            'changes' => $this->getAttribute('changes') ?? [],
            'notes' => $this->notes ?? [],
            'reason' => $this->reason,
        ];
    }
}
