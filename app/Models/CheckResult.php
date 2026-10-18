<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Support\Carbon;

/**
 * One printable RIMIFY-Check: the answer for one car and one wheel, frozen whole under a token (the
 * operator's decision of 29.09.2026). Written once; the database refuses every change.
 *
 * Kept twelve months, then deleted with the figures from the papers it holds (D-292): they are stored only to print
 * this check, so they expire with it — a stored figure with no expiry is a decision nobody made (the operator).
 *
 * @property int $id
 * @property string $token
 * @property int $vehicle_id
 * @property int $wheel_config_id
 * @property int|null $approval_document_id
 * @property int|null $document_revision
 * @property string $verdict_status
 * @property array<string, mixed> $verdict
 * @property array{axleFrontKg: int|null, axleRearKg: int|null, topSpeedKmh: int|null, powerKw?: int|null}|null $papers
 * @property string $engine_version
 * @property Carbon $computed_at
 * @property Carbon|null $created_at
 */
class CheckResult extends Model
{
    use Prunable;

    public const UPDATED_AT = null;

    /** How long a check is kept, in months — the year the papers cookie lasts (PapersBook::LIFETIME_MINUTES). */
    public const KEEP_MONTHS = 12;

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

    /**
     * In whole days in Berlin: a check stays through the last day its page names („Link gültig bis …“) and goes in the
     * night after it — never at 03:30 on the day it promised (the interaction review of D-292).
     *
     * @return Builder<static>
     */
    public function prunable(): Builder
    {
        $threshold = now()->timezone('Europe/Berlin')->startOfDay()->subMonthsNoOverflow(self::KEEP_MONTHS)->utc();

        return static::query()->where('computed_at', '<', $threshold);
    }

    /** The last day, in Berlin, the link still opens this check. */
    public function keptUntil(): Carbon
    {
        return $this->computed_at->copy()->timezone('Europe/Berlin')->startOfDay()->addMonthsNoOverflow(self::KEEP_MONTHS);
    }

    /** Past its last day: treated as gone, whether or not the nightly prune has taken it yet. */
    public function expired(): bool
    {
        return $this->keptUntil()->lt(now()->timezone('Europe/Berlin')->startOfDay());
    }
}
