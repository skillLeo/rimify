<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A row of the load-index table. Seeded from App\Domain\Fitment\Derivation\ReferenceTables so the
 * client's compliance owner can verify it against a printed reference without a deployment.
 *
 * @property int $load_index
 * @property int $capacity_kg
 */
class LoadIndexEntry extends Model
{
    protected $table = 'load_index_table';

    protected $primaryKey = 'load_index';

    public $incrementing = false;

    public $timestamps = false;

    protected $fillable = ['load_index', 'capacity_kg'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['load_index' => 'integer', 'capacity_kg' => 'integer'];
    }
}
