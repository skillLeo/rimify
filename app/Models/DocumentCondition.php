<?php

declare(strict_types=1);

namespace App\Models;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\ConditionLevel;
use Database\Factories\DocumentConditionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * One entry of a Gutachten's own Auflagenverzeichnis: the code as the document prints it, what kind of
 * Auflage it is, the full German sentence and the page it stands on (the corrections memo §1).
 *
 * A code means what *this* document says it means and nothing else: a row of the document carries the
 * code, and the engine reads its sentence here, in the row's own document, never in another one.
 *
 * @property int $id
 * @property int $approval_document_id
 * @property string $code
 * @property ConditionKind $kind
 * @property string $text_de
 * @property int|null $source_page
 * @property list<string>|null $body_forms karosserieform: the body styles permitted
 * @property array{mode: string, drive: string}|null $drive antrieb: only with, or not with, a drive
 * @property int|null $max_axle_load_kg reifen_tragfaehigkeit: the permitted axle load this code allows up to
 * @property string|null $axle reifen_achse: FRONT or REAR
 * @property ConditionLevel|null $level how loud it is in the shop (#23, D-104): Hinweis, Auflage, nicht zulässig — never below its kind's floor
 * @property string|null $limit_confirmed_reason why a load-index limit that differs from the table stands as the document states it
 * @property int|null $limit_confirmed_by
 * @property Carbon|null $limit_confirmed_at
 */
class DocumentCondition extends Model
{
    /** @use HasFactory<DocumentConditionFactory> */
    use HasFactory;

    protected $fillable = ['approval_document_id', 'code', 'kind', 'text_de', 'source_page', 'body_forms', 'drive', 'max_axle_load_kg', 'axle', 'level'];

    /**
     * An Auflage written without a level gets the operator's default (ConditionLevel::defaultFor); one below its kind's
     * floor is raised to it — and the database refuses it besides (chk_condition_level_floor).
     */
    protected static function booted(): void
    {
        static::saving(static function (DocumentCondition $condition): void {
            $level = $condition->level ?? ConditionLevel::defaultFor((string) $condition->code, $condition->kind, (string) $condition->text_de);

            $condition->level = $level->atLeastFloorOf($condition->kind);
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'kind' => ConditionKind::class,
            'level' => ConditionLevel::class,
            'source_page' => 'integer',
            'body_forms' => 'array',
            'drive' => 'array',
            'max_axle_load_kg' => 'integer',
            'limit_confirmed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<ApprovalDocument, $this> */
    public function document(): BelongsTo
    {
        return $this->belongsTo(ApprovalDocument::class, 'approval_document_id');
    }
}
