<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A general code of one car's row, as the paper prints it — with the qualifier the paper adds, where it adds one. What the
 * code means is the paper's own list (`document_conditions`).
 *
 * @property int $id
 * @property int $document_car_entry_id
 * @property string $code
 * @property string|null $note_de
 */
class DocumentCarEntryCode extends Model
{
    protected $fillable = ['document_car_entry_id', 'code', 'note_de'];
}
