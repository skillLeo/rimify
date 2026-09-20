<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A row of the speed-symbol table.
 *
 * `max_kmh` NULL means "above 300 km/h" — the (Y) case. It is not "unknown", and the deriver
 * treats it as the top of the table rather than as missing data.
 *
 * @property string $symbol
 * @property int $speed_rank
 * @property int|null $max_kmh
 */
class SpeedSymbolEntry extends Model
{
    protected $table = 'speed_symbol_table';

    protected $primaryKey = 'symbol';

    protected $keyType = 'string';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = ['symbol', 'speed_rank', 'max_kmh'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['speed_rank' => 'integer', 'max_kmh' => 'integer'];
    }
}
