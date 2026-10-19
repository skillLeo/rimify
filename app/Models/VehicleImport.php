<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\VehicleSource;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One Probelauf of a vehicle dataset, and — once applied — the import it became (VehicleImporter, his admin item 2).
 *
 * The file's cells are kept as read, so the mapping can change without a new upload and the import applies exactly the
 * Probelauf on screen.
 *
 * @property int $id
 * @property int|null $admin_user_id
 * @property string $file_name
 * @property string $file_format
 * @property string $file_sha256
 * @property string $source one of VehicleImporter::SOURCES: what every car it creates is stamped with
 * @property string $status
 * @property array{headers: list<string>, rows: list<array<string, string>>} $file
 * @property array<string, string> $mapping
 * @property list<array<string, string>> $rows
 * @property list<array<string, mixed>> $plan
 * @property array<string, int> $summary
 * @property Carbon|null $applied_at
 * @property int|null $applied_by
 * @property Carbon|null $created_at
 */
class VehicleImport extends Model
{
    public const PREVIEWED = 'previewed';

    public const APPLIED = 'applied';

    /** The mapping of each source's last import that went through: the next file of that source starts from it. */
    public const MAPPINGS_SETTING = 'vehicle_import_mappings';

    protected $guarded = ['id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'file' => 'array',
            'mapping' => 'array',
            'rows' => 'array',
            'plan' => 'array',
            'summary' => 'array',
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
