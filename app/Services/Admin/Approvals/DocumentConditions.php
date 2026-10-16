<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Data\RowFilter;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\ConditionLevel;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\DocumentConditionRework;
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
    public const BODY_FORMS = RowFilter::BODY_FORMS;

    /** The drives an `antrieb` code may name. */
    public const DRIVES = ['Allrad', 'Vorderachse', 'Hinterachse', 'Allradlenkung'];

    /**
     * A code as the documents print it: letters and digits, words joined by a space or a hyphen — ABE 55255's
     * `A01`, `K1c`, `140`, and what the 18″ Nachtrag prints in its Auflagen column without a legend line:
     * `Cabrio`, `Heckantrieb`, `Schrägheck 2-türig`, `Nicht 330D` — at most 32 characters (the columns' width).
     * The row form reads the same rule (rows.ts, CODE).
     */
    public const CODE = '/^[\p{L}\p{N}](?:[\p{L}\p{N} \-]{0,30}[\p{L}\p{N}])?$/u';

    /** The sentence a refused code is answered with, wherever a code is typed. */
    public const CODE_MESSAGE = 'Einen Code bitte so, wie das Gutachten ihn druckt: Buchstaben und Ziffern, höchstens 32 Zeichen – zum Beispiel A01, 16a) oder „Nicht 330D“.';

    /**
     * A code as typed, made the code it is, wherever one is typed: one plain space between words, whatever space a PDF's
     * copied text carried, and the closing bracket some documents print after a code dropped — BBS's Teilegutachten
     * lists `0)`, `R)`, `13)`, `16a)` (the client's item 8, ADMIN-GEFUNDEN 514). The form tells him to type a code as
     * the document prints it; typed so, it is the same code as without the bracket, and his rows find their legend.
     */
    public static function normaliseCode(mixed $code): mixed
    {
        if (! is_string($code)) {
            return $code;
        }

        $code = trim((string) preg_replace('/\s+/u', ' ', $code));

        return preg_replace('/\s*\)$/u', '', $code) ?? $code;
    }

    public const IN_USE = 'Dieser Code steht noch in Zeilen des Verwendungsbereichs. Nimm ihn dort zuerst heraus.';

    public const HAS_REWORKS = 'Zu diesem Code stehen Maße der Nacharbeit. Nimm sie unter „Befestigung und Hinweise“ zuerst heraus.';

    /** @param ConditionInput $input */
    public function create(ApprovalDocument $document, array $input, AdminUser $admin): DocumentCondition
    {
        return DB::transaction(function () use ($document, $input, $admin): DocumentCondition {
            $condition = DocumentCondition::query()->create(['approval_document_id' => $document->id] + self::columns($input));

            AuditTrail::record($admin, 'approval.condition_added', ['document' => FitmentRows::label($document), 'code' => $condition->code, 'kind' => $condition->kind->value], $document);
            // A row may already carry the code, typed before it was defined: its Eintragung follows now.
            FitmentRows::refreshEntry($document);

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

            $condition->fill(self::columns($input));

            // A confirmed load-index limit is confirmed for the figure it had: a new code or new kilograms ask again.
            if ($condition->isDirty(['code', 'max_axle_load_kg', 'kind'])) {
                $condition->forceFill(['limit_confirmed_reason' => null, 'limit_confirmed_by' => null, 'limit_confirmed_at' => null]);
            }

            $condition->save();
            $document = $condition->document()->firstOrFail();

            AuditTrail::record($admin, 'approval.condition_changed', ['document' => FitmentRows::label($document), 'code' => $condition->code, 'kind' => $condition->kind->value], $document);
            FitmentRows::refreshEntry($document);
        });
    }

    /**
     * How loud the Auflage is in the shop (#23, D-104) — on a released document too: the words and the colour, never
     * the verdict. The floor is the request's, the model's and the database's.
     */
    public function setLevel(DocumentCondition $condition, ConditionLevel $level, AdminUser $admin): void
    {
        DB::transaction(function () use ($condition, $level, $admin): void {
            $old = $condition->level;
            $condition->forceFill(['level' => $level->atLeastFloorOf($condition->kind)])->save();
            $document = $condition->document()->firstOrFail();

            AuditTrail::record($admin, 'approval.condition_level_set', [
                'document' => FitmentRows::label($document),
                'code' => $condition->code,
                'old' => $old?->value,
                'level' => $condition->level?->value,
            ], $document);
        });
    }

    public function delete(DocumentCondition $condition, AdminUser $admin): void
    {
        DB::transaction(function () use ($condition, $admin): void {
            if (self::uses($condition) > 0) {
                throw ValidationException::withMessages(['condition' => self::IN_USE]);
            }

            // Its millimetres would go with it, without a word: taken away first, on purpose.
            if (DocumentConditionRework::query()->where('document_condition_id', $condition->id)->exists()) {
                throw ValidationException::withMessages(['condition' => self::HAS_REWORKS]);
            }

            $document = $condition->document()->firstOrFail();
            $condition->delete();

            AuditTrail::record($admin, 'approval.condition_removed', ['document' => FitmentRows::label($document), 'code' => $condition->code], $document);
            FitmentRows::refreshEntry($document);
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
     * How many rows and tyre sizes carry each code of the document — two queries for the whole list.
     *
     * @return array<string, int>
     */
    public static function usesByCode(ApprovalDocument $document): array
    {
        $counts = [];

        $rows = DB::table('fitment_conditions as fc')
            ->join('fitments as f', 'f.id', '=', 'fc.fitment_id')
            ->where('f.approval_document_id', $document->id)
            ->groupBy('fc.code')
            ->pluck(DB::raw('COUNT(*) as n'), 'fc.code');

        $sizes = DB::table('fitment_tyre_size_conditions as sc')
            ->join('fitment_tyre_sizes as s', 's.id', '=', 'sc.fitment_tyre_size_id')
            ->join('fitments as f', 'f.id', '=', 's.fitment_id')
            ->where('f.approval_document_id', $document->id)
            ->groupBy('sc.code')
            ->pluck(DB::raw('COUNT(*) as n'), 'sc.code');

        foreach ([$rows, $sizes] as $set) {
            foreach ($set as $code => $n) {
                $counts[(string) $code] = ($counts[(string) $code] ?? 0) + (int) $n;
            }
        }

        return $counts;
    }

    /**
     * The codes the document's rows and tyre sizes carry that its list does not define, with how many
     * rows carry each — every one of them keeps those rows UNKNOWN and the Freigabe shut.
     *
     * @return list<array{code: string, rows: int}>
     */
    public static function unresolvedIn(ApprovalDocument $document): array
    {
        $defined = DB::table('document_conditions')->where('approval_document_id', $document->id)->select('code');

        $onRows = DB::table('fitment_conditions as fc')
            ->join('fitments as f', 'f.id', '=', 'fc.fitment_id')
            ->where('f.approval_document_id', $document->id)
            ->whereNotIn('fc.code', $defined)
            ->select('fc.code', 'f.id as fitment_id');

        $onSizes = DB::table('fitment_tyre_size_conditions as sc')
            ->join('fitment_tyre_sizes as s', 's.id', '=', 'sc.fitment_tyre_size_id')
            ->join('fitments as f', 'f.id', '=', 's.fitment_id')
            ->where('f.approval_document_id', $document->id)
            ->whereNotIn('sc.code', $defined)
            ->select('sc.code', 'f.id as fitment_id');

        return DB::query()->fromSub($onRows->union($onSizes), 'u')
            ->groupBy('code')->orderBy('code')
            ->get(['code', DB::raw('COUNT(DISTINCT fitment_id) as n')])
            ->map(static fn (object $r): array => ['code' => (string) $r->code, 'rows' => (int) $r->n])
            ->values()->all();
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
