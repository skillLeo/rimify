<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * „Neue Fassung anlegen“ (ADMIN-GEFUNDEN 510, the operator's brief of 16.10.2026, Group A): the way back into a
 * released Gutachten. A released document changes no more — it is what customers were told — so a correction is a new
 * revision that supersedes it once it is released itself (DocumentRelease). Until then the shop reads the released one.
 *
 * The new revision starts as a draft holding everything its predecessor holds — its facts and PDF, its count, its
 * Auflagenverzeichnis with the levels, the reworks, fasteners and notices, its table of tyre load at speed, and every
 * row with its codes and tyre sizes — so a correction is a correction, not a second entry. What the release asks it
 * asks again: the completeness answer is not carried over. A demo document's revision is born demo too, and goes with
 * the demo set.
 */
final class DocumentRevision
{
    /** The tables a revision copies, child after parent. */
    public const TABLES = [
        'approval_documents', 'document_conditions', 'document_condition_reworks', 'document_fasteners', 'document_notices',
        'document_speed_deratings', 'fitments', 'fitment_conditions', 'fitment_tyre_sizes', 'fitment_tyre_size_conditions',
    ];

    /** Columns the database computes itself, never written (`DocumentRevisionTest` holds this list to the schema). */
    public const GENERATED = ['fitment_tyre_sizes' => ['entry_key']];

    /** The draft revision of a released document — made now, or the one already started. */
    public function draftFrom(ApprovalDocument $released, AdminUser $admin): ApprovalDocument
    {
        if ($released->status !== DocumentStatus::Published) {
            throw new LogicException('Eine neue Fassung entsteht nur aus einem freigegebenen Gutachten.');
        }

        $started = self::startedFor($released);

        if ($started !== null) {
            return $started;
        }

        return DB::transaction(function () use ($released, $admin): ApprovalDocument {
            $revision = (int) $released->revision + 1;
            $id = self::insertCopy('approval_documents', (array) DB::table('approval_documents')->where('id', $released->id)->first(), [
                'status' => DocumentStatus::Draft->value,
                'revision' => $revision,
                'supersedes_id' => $released->id,
                'valid_from' => null,
                'valid_to' => null,
                'created_by' => $admin->id,
                // Asked again at its release (D-227): an answer about the old revision is not one about the new.
                'completeness' => null,
                'completeness_by' => null,
                'completeness_at' => null,
                'completeness_revision' => null,
                'demo_ref' => $released->getAttribute('demo_ref') === null ? null : self::demoRef((string) $released->getAttribute('demo_ref'), $revision),
            ]);

            $conditions = self::copyChildren('document_conditions', 'approval_document_id', $released->id, $id);
            foreach ($conditions as $from => $to) {
                self::copyChildren('document_condition_reworks', 'document_condition_id', $from, $to);
            }

            foreach (['document_fasteners', 'document_notices', 'document_speed_deratings'] as $table) {
                self::copyChildren($table, 'approval_document_id', $released->id, $id);
            }

            $rows = self::copyChildren('fitments', 'approval_document_id', $released->id, $id, ['status' => FitmentStatus::Draft->value], static fn (array $row): bool => $row['status'] !== FitmentStatus::Retired->value);

            foreach ($rows as $from => $to) {
                self::copyChildren('fitment_conditions', 'fitment_id', $from, $to);

                foreach (self::copyChildren('fitment_tyre_sizes', 'fitment_id', $from, $to) as $sizeFrom => $sizeTo) {
                    self::copyChildren('fitment_tyre_size_conditions', 'fitment_tyre_size_id', $sizeFrom, $sizeTo);
                }
            }

            $draft = ApprovalDocument::query()->findOrFail($id);

            AuditTrail::record($admin, 'approval.revision_started', [
                'document' => FitmentRows::label($draft),
                'from' => FitmentRows::label($released),
                'revision' => $revision,
                'rows' => count($rows),
            ], $draft);

            return $draft;
        });
    }

    /** The draft that already supersedes it, if someone started one. */
    public static function startedFor(ApprovalDocument $released): ?ApprovalDocument
    {
        return ApprovalDocument::query()->where('supersedes_id', $released->id)->where('status', DocumentStatus::Draft->value)->orderByDesc('id')->first();
    }

    /**
     * Every row of `$table` that hangs on `$from`, copied onto `$to` — the old id mapped to the new one, where the table
     * has ids (a pivot such as `fitment_conditions` has none, and nothing hangs on its rows).
     *
     * @param  array<string, mixed>  $overrides
     * @param  (callable(array<string, mixed>): bool)|null  $keep
     * @return array<int, int>
     */
    private static function copyChildren(string $table, string $column, int $from, int $to, array $overrides = [], ?callable $keep = null): array
    {
        $map = [];
        $rows = DB::table($table)->where($column, $from)->get()->map(static fn (object $row): array => (array) $row)
            ->sortBy(static fn (array $row): int => (int) ($row['id'] ?? 0));

        foreach ($rows as $data) {
            if ($keep !== null && ! $keep($data)) {
                continue;
            }

            if (array_key_exists('id', $data)) {
                $map[(int) $data['id']] = self::insertCopy($table, $data, [$column => $to, ...$overrides]);
            } else {
                DB::table($table)->insert(self::stamped($table, $data, [$column => $to, ...$overrides]));
            }
        }

        return $map;
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  array<string, mixed>  $overrides
     */
    private static function insertCopy(string $table, array $row, array $overrides): int
    {
        unset($row['id']);

        return (int) DB::table($table)->insertGetId(self::stamped($table, $row, $overrides));
    }

    /**
     * The row as copied: without the columns the database computes, new timestamps where it has them, the overrides
     * laid over it.
     *
     * @param  array<string, mixed>  $row
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private static function stamped(string $table, array $row, array $overrides): array
    {
        $row = array_diff_key($row, array_flip(self::GENERATED[$table] ?? []));

        foreach (['created_at', 'updated_at'] as $stamp) {
            if (array_key_exists($stamp, $row)) {
                $row[$stamp] = now();
            }
        }

        return array_replace($row, $overrides);
    }

    /** `abnahme:doc:abe-55255` → `abnahme:doc:abe-55255:f2`: born demo like its predecessor, and as unique. */
    private static function demoRef(string $ref, int $revision): string
    {
        $suffix = ":f{$revision}";

        return mb_substr(preg_replace('/:f\d+$/', '', $ref) ?? $ref, 0, 48 - strlen($suffix)).$suffix;
    }
}
