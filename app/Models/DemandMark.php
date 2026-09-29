<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * The team's answer to one Nachfrage-Lücke: watched, or a Gutachten requested from a wheel brand.
 *
 * @property int $id
 * @property string $gap_key
 * @property string $state
 * @property int|null $brand_id
 * @property int|null $admin_user_id
 * @property CarbonImmutable $marked_at
 * @property-read Brand|null $brand
 * @property-read AdminUser|null $admin
 */
class DemandMark extends Model
{
    public const WATCHED = 'watched';

    public const REQUESTED = 'requested';

    /** `v:123` a variant in the catalogue, `k:0005-ABC` key numbers it does not know. */
    public const KEY_PATTERN = '/^(v:[1-9][0-9]{0,9}|k:[0-9]{4}-[A-Z0-9]{3})$/';

    protected $fillable = ['gap_key', 'state', 'brand_id', 'admin_user_id', 'marked_at'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['marked_at' => 'immutable_datetime'];
    }

    /** @return BelongsTo<Brand, $this> */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /** @return BelongsTo<AdminUser, $this> */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(AdminUser::class, 'admin_user_id');
    }
}
