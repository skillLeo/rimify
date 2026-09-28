<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One Probelauf of a supplier feed, and — once applied — the import it became (CatalogueImporter).
 *
 * The rows are kept as they were checked, so the import applies exactly what the Probelauf showed;
 * `undo` holds what it takes to take the import back.
 *
 * @property int $id
 * @property int|null $admin_user_id
 * @property string $file_name
 * @property string|null $supplier who sent the file, as the admin named it
 * @property bool $mapping_remembered whether the mapping started from this supplier's last import
 * @property string $file_format
 * @property string $file_sha256
 * @property string $status
 * @property array<string, string> $mapping
 * @property string $decimal
 * @property array{headers: list<string>, rows: list<array<string, string>>} $source
 * @property list<array<string, string|null>> $rows
 * @property list<array<string, mixed>> $plan
 * @property array<string, int> $summary
 * @property array<string, mixed>|null $undo
 * @property Carbon|null $applied_at
 * @property Carbon|null $rolled_back_at
 * @property int|null $rolled_back_by
 * @property Carbon|null $created_at
 */
class CatalogueImport extends Model
{
    public const PREVIEWED = 'previewed';

    public const APPLIED = 'applied';

    public const ROLLED_BACK = 'rolled_back';

    protected $guarded = ['id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'mapping' => 'array',
            'mapping_remembered' => 'boolean',
            'source' => 'array',
            'rows' => 'array',
            'plan' => 'array',
            'summary' => 'array',
            'undo' => 'array',
            'applied_at' => 'datetime',
            'rolled_back_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'admin_user_id');
    }
}
