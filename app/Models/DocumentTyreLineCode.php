<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A code beside one line of tyres, as the paper prints it — on Gutachten, car, rim and tyre at once, the client's own words.
 * What it means is the paper's own list (`document_conditions`).
 *
 * @property int $id
 * @property int $document_tyre_line_id
 * @property string $code
 */
class DocumentTyreLineCode extends Model
{
    protected $fillable = ['document_tyre_line_id', 'code'];
}
