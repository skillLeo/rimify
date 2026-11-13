<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\VehicleSource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * One run of a vehicle dataset: the file as it arrived, its Probelauf, and — once applied — the import it became
 * (VehicleImporter, his admin item 2; any size since D-462).
 *
 * A run goes through its stages on the server, in parts, so no request waits for a whole file:
 * uploading → reading → checking → previewed → applying → applied, or failed with its reason. The file stays on the
 * private disk while the run may read it again (a new mapping is a new reading), and its rows are VehicleImportRow.
 *
 * @property int $id
 * @property int|null $admin_user_id
 * @property string $file_name
 * @property string|null $file_format
 * @property string|null $file_sha256
 * @property int|null $bytes_total
 * @property int $bytes_done
 * @property int|null $rows_total
 * @property int $rows_done
 * @property string|null $stored_as
 * @property array<string, mixed>|null $cursor
 * @property string $source one of VehicleImporter::SOURCES: what every car it creates is stamped with
 * @property string $status
 * @property array{headers?: list<string>}|null $file
 * @property array<string, string>|null $mapping
 * @property array<string, string>|null $examples
 * @property list<array<string, mixed>>|null $checks
 * @property array<string, int>|null $summary
 * @property string|null $plan_hash
 * @property string|null $cars_fingerprint the cars as the Probelauf began against them (VehicleImporter::carsFingerprint, D-469)
 * @property string|null $error
 * @property int $attempts
 * @property Carbon|null $applied_at
 * @property int|null $applied_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class VehicleImport extends Model
{
    public const UPLOADING = 'uploading';

    public const READING = 'reading';

    public const CHECKING = 'checking';

    public const PREVIEWED = 'previewed';

    public const APPLYING = 'applying';

    public const APPLIED = 'applied';

    public const FAILED = 'failed';

    /** The stages the server works on by itself, part after part. */
    public const WORKING = [self::READING, self::CHECKING, self::APPLYING];

    /** The mapping of each source's last import that went through: the next file of that source starts from it. */
    public const MAPPINGS_SETTING = 'vehicle_import_mappings';

    protected $guarded = ['id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'file' => 'array',
            'mapping' => 'array',
            'examples' => 'array',
            'checks' => 'array',
            'summary' => 'array',
            'cursor' => 'array',
            'bytes_total' => 'integer',
            'bytes_done' => 'integer',
            'rows_total' => 'integer',
            'rows_done' => 'integer',
            'attempts' => 'integer',
            'applied_at' => 'datetime',
        ];
    }

    /**
     * Who made the Probelauf.
     *
     * @return BelongsTo<AdminUser, $this>
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'admin_user_id');
    }

    /**
     * Who imported it.
     *
     * @return BelongsTo<AdminUser, $this>
     */
    public function applier(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'applied_by');
    }

    /** @return HasMany<VehicleImportRow, $this> */
    public function lines(): HasMany
    {
        return $this->hasMany(VehicleImportRow::class, 'vehicle_import_id');
    }

    /** @return list<string> */
    public function headers(): array
    {
        return array_map('strval', $this->file['headers'] ?? []);
    }

    /**
     * The Probelauf, row by row in the file's order — for a run small enough to hold (tests, the down migration's
     * shape); the page reads its rows a page at a time.
     *
     * @return list<array{line: string, label: string, keys: string|null, status: string, vehicle: int|null, changes: list<string>, notes: list<string>, reason: string|null}>
     */
    public function planEntries(): array
    {
        return $this->lines()->orderBy('line')->get()->map(static fn (VehicleImportRow $row): array => $row->entry())->values()->all();
    }

    public function working(): bool
    {
        return in_array($this->status, self::WORKING, true);
    }

    /**
     * A Probelauf made before runs kept their file (D-462): what it showed stays, but it cannot be checked again or
     * imported — the file is asked for once more.
     */
    public function expired(): bool
    {
        return $this->status === self::PREVIEWED && $this->stored_as === null;
    }

    /** @return array<string, string>|null */
    public static function savedMapping(VehicleSource $source): ?array
    {
        $all = Setting::get(self::MAPPINGS_SETTING);
        $saved = is_array($all) && is_array($all[$source->value] ?? null) ? $all[$source->value] : null;

        return $saved === null ? null : array_filter($saved, static fn (mixed $header, mixed $field): bool => is_string($field) && is_string($header), ARRAY_FILTER_USE_BOTH);
    }

    /** @param  array<string, string>  $mapping */
    public static function rememberMapping(VehicleSource $source, array $mapping): void
    {
        $all = Setting::get(self::MAPPINGS_SETTING);
        Setting::set(self::MAPPINGS_SETTING, array_replace(is_array($all) ? $all : [], [$source->value => $mapping]));
    }
}
