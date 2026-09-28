<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * A Gutachten's own Auflagenverzeichnis (step 4 of the entry flow): the codes the document prints, each with
 * its kind, its full sentence and its page.
 *
 * Nothing is classified here: the kind decides what a customer is told, so a person chooses it for every
 * code. A pasted legend block is split in the browser (splitLegend) and stored only as the person confirmed it.
 * A code a row still carries is never taken away — the row would lose its sentence.
 *
 * @phpstan-type ConditionInput array{code: string, kind: string, text_de: string, source_page: int|null, body_forms: list<string>|null, drive: array{mode: string, drive: string}|null, max_axle_load_kg: int|null, axle: string|null}
 */
final class DocumentConditions
{
    /** The body styles a `karosserieform` code may name — the words the vehicle records use. */
    public const BODY_FORMS = ['Limousine', 'Kombi', 'Coupe', 'Cabrio', 'Schrägheck', 'SUV', 'Roadster', 'Van'];

    /** The drives an `antrieb` code may name. */
    public const DRIVES = ['Allrad', 'Vorderachse', 'Hinterachse', 'Allradlenkung'];

    public const IN_USE = 'Dieser Code steht noch in Zeilen des Verwendungsbereichs. Nimm ihn dort zuerst heraus.';

    /** @param ConditionInput $input */
    public function create(ApprovalDocument $document, array $input, AdminUser $admin): DocumentCondition
    {
        return DB::transaction(function () use ($document, $input, $admin): DocumentCondition {
            $condition = DocumentCondition::query()->create(['approval_document_id' => $document->id] + self::columns($input));

            AuditTrail::record($admin, 'approval.condition_added', ['document' => FitmentRows::label($document), 'code' => $condition->code, 'kind' => $condition->kind->value], $document);

            return $condition;
        });
    }

    /** @param ConditionInput $input */
    public function update(DocumentCondition $condition, array $input, AdminUser $admin): void
    {
        DB::transaction(function () use ($condition, $input, $admin): void {
            $old = $condition->code;

            if ($input['code'] !== $old && self::uses($condition) > 0) {
                throw ValidationException::withMessages(['code' => 'Der Code steht schon in Zeilen des Verwendungsbereichs und bleibt deshalb, wie er ist.']);
            }

            $condition->fill(self::columns($input))->save();

            AuditTrail::record($admin, 'approval.condition_changed', ['document' => FitmentRows::label($condition->document()->firstOrFail()), 'code' => $condition->code], $condition->document()->firstOrFail());
        });
    }

    public function delete(DocumentCondition $condition, AdminUser $admin): void
    {
        DB::transaction(function () use ($condition, $admin): void {
            if (self::uses($condition) > 0) {
                throw ValidationException::withMessages(['condition' => self::IN_USE]);
            }

            $document = $condition->document()->firstOrFail();
            $condition->delete();

            AuditTrail::record($admin, 'approval.condition_removed', ['document' => FitmentRows::label($document), 'code' => $condition->code], $document);
        });
    }

    /**
     * How many rows and tyre sizes of its document carry the code.
     */
    public static function uses(DocumentCondition $condition): int
    {
        $rows = DB::table('fitment_conditions as fc')
            ->join('fitments as f', 'f.id', '=', 'fc.fitment_id')
            ->where('f.approval_document_id', $condition->approval_document_id)
            ->where('fc.code', $condition->code)
            ->count();

        $sizes = DB::table('fitment_tyre_size_conditions as sc')
            ->join('fitment_tyre_sizes as s', 's.id', '=', 'sc.fitment_tyre_size_id')
            ->join('fitments as f', 'f.id', '=', 's.fitment_id')
            ->where('f.approval_document_id', $condition->approval_document_id)
            ->where('sc.code', $condition->code)
            ->count();

        return $rows + $sizes;
    }

    /**
     * The codes of `$codes` that `$document` does not define — compared exactly as printed.
     *
     * @param  list<string>  $codes
     * @return list<string>
     */
    public static function undefined(ApprovalDocument $document, array $codes): array
    {
        if ($codes === []) {
            return [];
        }

        $known = DocumentCondition::query()->where('approval_document_id', $document->id)->whereIn('code', $codes)->pluck('code')->all();

        return array_values(array_diff($codes, $known));
    }

    /**
     * @param  ConditionInput  $input
     * @return array<string, mixed>
     */
    private static function columns(array $input): array
    {
        $kind = ConditionKind::from($input['kind']);

        // Only the parameter the kind uses is kept: a Karosserieform code never carries an axle load.
        return [
            'code' => $input['code'],
            'kind' => $kind->value,
            'text_de' => $input['text_de'],
            'source_page' => $input['source_page'],
            'body_forms' => $kind === ConditionKind::Karosserieform ? $input['body_forms'] : null,
            'drive' => $kind === ConditionKind::Antrieb ? $input['drive'] : null,
            'max_axle_load_kg' => $kind === ConditionKind::ReifenTragfaehigkeit ? $input['max_axle_load_kg'] : null,
            'axle' => $kind === ConditionKind::ReifenAchse ? $input['axle'] : null,
        ];
    }
}
