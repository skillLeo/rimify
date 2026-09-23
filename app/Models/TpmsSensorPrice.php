<?php

declare(strict_types=1);

namespace App\Models;

use App\Support\MakeName;
use Database\Factories\TpmsSensorPriceFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * What one RDKS sensor costs for one CAR make, in integer cents — per sensor, never per set
 * (docs/specs/komplettrad.md D-030).
 *
 * `vehicles.make` is free text, so the join key is MakeName::key(): 'VW', 'vw' and 'Volkswagen'
 * all key to `volkswagen`, and `make_label_de` is what a human reads. A make without an active row
 * is a make whose price nobody has confirmed: forMake() returns null and the checkout says so
 * instead of charging a number (CLAUDE.md §2). A price of zero cannot be stored (chk_tpms_price).
 *
 * @property int $id
 * @property string $make_key
 * @property string $make_label_de
 * @property int $price_cents
 * @property string $currency
 * @property bool $active
 */
class TpmsSensorPrice extends Model
{
    /** @use HasFactory<TpmsSensorPriceFactory> */
    use HasFactory;

    use SoftDeletes;

    protected $fillable = ['make_key', 'make_label_de', 'price_cents', 'currency', 'active'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'price_cents' => 'integer',
            'active' => 'boolean',
        ];
    }

    /**
     * The active price for this make, or null when the make is empty, unusable or has no row.
     * `''` from MakeName::key() is "no make" and fails closed, exactly as a null does.
     */
    public static function forMake(?string $make): ?self
    {
        if ($make === null || trim($make) === '') {
            return null;
        }

        $key = MakeName::key($make);

        if ($key === '') {
            return null;
        }

        return static::query()->where('make_key', $key)->where('active', true)->first();
    }
}
