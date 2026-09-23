<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\BalanceWeightColourFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

/**
 * A colour a Wuchtgewicht can have — "Silber", "Schwarz" — configured by the admin and chosen by
 * the customer per Komplettrad line in the basket.
 *
 * The surcharge is per WHEEL, in integer cents, and is 0 until the client charges for a colour
 * (docs/specs/komplettrad.md D-031). Exactly one live row is the default; MySQL cannot express
 * "exactly one true" as a CHECK, so makeDefault() enforces it inside a transaction. No active
 * colour at all means no Komplettrad can be built: the storefront refuses rather than inventing
 * one (CLAUDE.md §2).
 *
 * @property int $id
 * @property string $name_de
 * @property string $slug
 * @property string|null $swatch_hex
 * @property int $surcharge_cents
 * @property string $currency
 * @property bool $is_default
 * @property bool $active
 * @property int $sort_order
 */
class BalanceWeightColour extends Model
{
    /** @use HasFactory<BalanceWeightColourFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'name_de', 'slug', 'swatch_hex', 'surcharge_cents', 'currency', 'is_default', 'active', 'sort_order',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'surcharge_cents' => 'integer',
            'is_default' => 'boolean',
            'active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    /**
     * @param  Builder<BalanceWeightColour>  $query
     * @return Builder<BalanceWeightColour>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    /**
     * The colour a Komplettrad gets when the customer has not chosen one: the active default,
     * else the first active colour by sort order, else null — and null means no Komplettrad.
     */
    public static function default(): ?self
    {
        $ordered = static::query()->active()->orderBy('sort_order')->orderBy('id');

        return (clone $ordered)->where('is_default', true)->first() ?? $ordered->first();
    }

    /**
     * Make this the one default. Every other row — trashed ones included, so a restore can never
     * bring a second default back — loses the flag in the same transaction.
     */
    public function makeDefault(): void
    {
        DB::transaction(function (): void {
            static::withTrashed()
                ->whereKeyNot($this->getKey())
                ->where('is_default', true)
                ->update(['is_default' => false]);

            $this->forceFill(['is_default' => true])->save();
        });
    }
}
