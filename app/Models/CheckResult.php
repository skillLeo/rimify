<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * One printable RIMIFY-Check: the answer for one car and one wheel, frozen whole under a token (the
 * operator's decision of 29.09.2026). Written once; the database refuses every change.
 *
 * @property int $id
 * @property string $token
 * @property int $vehicle_id
 * @property int $wheel_config_id
 * @property int|null $approval_document_id
 * @property int|null $document_revision
 * @property string $verdict_status
 * @property array<string, mixed> $verdict
 * @property array{axleFrontKg: int, axleRearKg: int, topSpeedKmh: int}|null $papers
 * @property string $engine_version
 * @property Carbon $computed_at
 */
class CheckResult extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'token', 'vehicle_id', 'wheel_config_id', 'approval_document_id', 'document_revision',
        'verdict_status', 'verdict', 'papers', 'engine_version', 'computed_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'vehicle_id' => 'integer',
            'wheel_config_id' => 'integer',
            'approval_document_id' => 'integer',
            'document_revision' => 'integer',
            'verdict' => 'array',
            'papers' => 'array',
            'computed_at' => 'datetime',
        ];
    }
}
