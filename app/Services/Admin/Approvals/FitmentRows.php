<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\FitmentCondition;
use App\Models\FitmentTyreSize;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * The Verwendungsbereich of one Gutachten, as rows: which vehicle variants may carry which of the
 * catalogue's sizes, with which tyre sizes, under which of the document's codes, found on which page.
 *
 * One entry in the form usually stands for many rows — a Gutachten lists a vehicle type with a range
 * of sizes — so rows are added for every vehicle × size chosen, all sharing what was entered. A row
 * already there (the same vehicle, size and axle in this document) is left as it is and counted.
 *
 * Codes are stored as printed, on the row and on each tyre size; their meaning is the document's own
 * list (DocumentConditions). The Eintragung is never typed: `requires_entry` is derived from an Abnahme
 * among a row's codes and its sizes', or set by an override that carries its reason, its author and its
 * time (the corrections memo §2). It is written again whenever the document's list changes (refreshEntry).
 *
 * Rows are written only while the document is a draft; they become visible to customers only when the
 * whole document is freigegeben (DocumentRelease), never one by one.
 *
 * @phpstan-type TyreSizeInput array{width_mm: int, aspect: int, diameter_in: string, min_load_index: int|null, min_speed_symbol: string|null, axle: string, kw_min: int|null, kw_max: int|null, codes: list<string>}
 * @phpstan-type RowSpec array{axle: string, entry_override: string|null, entry_override_reason: string|null, entry_note_de: string|null, source_page: int|null, build_from: string|null, build_to: string|null, permitted_width_min: string|null, permitted_width_max: string|null, permitted_et_min: int|null, permitted_et_max: int|null, centre_bore_mm: string|null, tyre_sizes: list<TyreSizeInput>, conditions: list<array{code: string, note: string|null}>}
 */
final class FitmentRows
{
    /**
     * @param  list<int>  $vehicleIds
     * @param  list<int>  $configIds
     * @param  RowSpec  $spec
     * @return array{created: int, skipped: int}
     */
    public function add(ApprovalDocument $document, array $vehicleIds, array $configIds, array $spec, AdminUser $admin): array
    {
        return DB::transaction(function () use ($document, $vehicleIds, $configIds, $spec, $admin): array {
            $created = 0;
            $skipped = 0;
            $entry = self::derive($document, $spec);

            foreach ($vehicleIds as $vehicleId) {
                foreach ($configIds as $configId) {
                    $exists = Fitment::query()
                        ->where('approval_document_id', $document->id)
                        ->where('vehicle_id', $vehicleId)
                        ->where('wheel_config_id', $configId)
                        ->where('axle', $spec['axle'])
                        ->exists();

                    if ($exists) {
                        $skipped++;

                        continue;
                    }

                    $row = Fitment::query()->create(self::columns($spec, $entry) + [
                        'approval_document_id' => $document->id,
                        'vehicle_id' => $vehicleId,
                        'wheel_config_id' => $configId,
                        'status' => FitmentStatus::Draft->value,
                        'created_by' => $admin->id,
                    ]);

                    $this->override($row, $spec, $admin);
                    $this->children($row, $spec);
                    $created++;
                }
            }

            AuditTrail::record($admin, 'approval.rows_added', [
                'document' => self::label($document),
                'rows' => $created,
                'skipped' => $skipped,
                'entry_override' => $spec['entry_override'],
                'entry_override_reason' => $spec['entry_override_reason'],
            ], $document);

            return ['created' => $created, 'skipped' => $skipped];
        });
    }

    /** @param  RowSpec  $spec */
    public function update(Fitment $row, array $spec, AdminUser $admin): void
    {
        DB::transaction(function () use ($row, $spec, $admin): void {
            $document = $row->approvalDocument;
            $before = [$row->entry_override, $row->entry_override_reason];

            $row->fill(self::columns($spec, self::derive($document, $spec)))->save();
            $this->override($row, $spec, $admin);
            $row->tyreSizes()->delete();
            $row->conditionCodes()->delete();
            $this->children($row, $spec);

            AuditTrail::record($admin, 'approval.row_updated', [
                'document' => self::label($document),
                'row' => $row->id,
            ], $document);

            // Who said otherwise than the codes, and why, is its own entry in the Protokoll.
            if ($before !== [$spec['entry_override'], $spec['entry_override_reason']]) {
                AuditTrail::record($admin, 'approval.entry_overridden', [
                    'document' => self::label($document),
                    'row' => $row->id,
                    'override' => $spec['entry_override'],
                    'reason' => $spec['entry_override_reason'],
                ], $document);
            }
        });
    }

    /**
     * The row as its form writes it — the columns a person sets, the override with its reason, each tyre size with its
     * codes, the row's codes with their notes — for EditStamp: a row saved from a form opened on another state is
     * refused, not written over (the admin audit's F-25). The derived Eintragung is left out: the document's list moves
     * it, not this form. Expects tyreSizes.conditionCodes and conditionCodes loaded.
     *
     * @return array<string, mixed>
     */
    public static function state(Fitment $row): array
    {
        return [
            'row' => $row->only(['axle', 'entry_note_de', 'source_page', 'build_from', 'build_to', 'permitted_width_min', 'permitted_width_max', 'permitted_et_min', 'permitted_et_max', 'centre_bore_mm', 'entry_override', 'entry_override_reason']),
            'sizes' => $row->tyreSizes->sortBy('id')->map(static fn (FitmentTyreSize $size): array => $size->only(['width_mm', 'aspect', 'diameter_in', 'min_load_index', 'min_speed_symbol', 'axle', 'kw_min', 'kw_max'])
                + ['codes' => $size->conditionCodes->pluck('code')->map(static fn (mixed $code): string => (string) $code)->sort()->values()->all()])->values()->all(),
            'codes' => $row->conditionCodes->sortBy('code')->map(static fn (FitmentCondition $condition): array => [(string) $condition->code, $condition->note_de])->values()->all(),
        ];
    }

    public function delete(Fitment $row, AdminUser $admin): void
    {
        DB::transaction(function () use ($row, $admin): void {
            $document = $row->approvalDocument;
            $row->delete();

            AuditTrail::record($admin, 'approval.row_deleted', ['document' => self::label($document), 'row' => $row->id], $document);
        });
    }

    /**
     * Writes every row's derived Eintragung again — after the document's list changed, a code may have
     * become an Abnahme or stopped being one. An override stays as the person set it.
     */
    public static function refreshEntry(ApprovalDocument $document): void
    {
        $abnahme = DB::table('document_conditions')->where('approval_document_id', $document->id)
            ->where('kind', ConditionKind::Abnahme->value)->pluck('code')->all();

        $rows = Fitment::query()->with(['conditionCodes', 'tyreSizes.conditionCodes'])
            ->where('approval_document_id', $document->id)->whereNull('entry_override')->get();

        foreach ($rows as $row) {
            $codes = $row->conditionCodes->pluck('code')->all();

            foreach ($row->tyreSizes as $size) {
                $codes = [...$codes, ...$size->conditionCodes->pluck('code')->all()];
            }

            $derived = array_intersect($codes, $abnahme) !== [];

            if ($row->requires_entry !== $derived) {
                $row->forceFill(['requires_entry' => $derived])->save();
            }
        }
    }

    /**
     * The Eintragung the spec's codes derive in this document: an Abnahme among the row's codes or any
     * size's.
     *
     * @param  RowSpec  $spec
     */
    public static function derive(ApprovalDocument $document, array $spec): bool
    {
        $codes = array_column($spec['conditions'], 'code');

        foreach ($spec['tyre_sizes'] as $size) {
            $codes = [...$codes, ...$size['codes']];
        }

        return $codes !== [] && DB::table('document_conditions')
            ->where('approval_document_id', $document->id)
            ->where('kind', ConditionKind::Abnahme->value)
            ->whereIn('code', array_values(array_unique($codes)))
            ->exists();
    }

    /**
     * @param  RowSpec  $spec
     * @return array<string, mixed>
     */
    private static function columns(array $spec, bool $derived): array
    {
        return [
            'axle' => $spec['axle'],
            'requires_entry' => match ($spec['entry_override']) {
                'required' => true,
                'not_required' => false,
                default => $derived,
            },
            'entry_note_de' => $spec['entry_note_de'],
            'source_page' => $spec['source_page'],
            'build_from' => $spec['build_from'],
            'build_to' => $spec['build_to'],
            'permitted_width_min' => $spec['permitted_width_min'],
            'permitted_width_max' => $spec['permitted_width_max'],
            'permitted_et_min' => $spec['permitted_et_min'],
            'permitted_et_max' => $spec['permitted_et_max'],
            'centre_bore_mm' => $spec['centre_bore_mm'],
        ];
    }

    /**
     * The override, with who and when — kept as it was when neither it nor its reason changed.
     *
     * @param  RowSpec  $spec
     */
    private function override(Fitment $row, array $spec, AdminUser $admin): void
    {
        if ($spec['entry_override'] === null) {
            $row->forceFill(['entry_override' => null, 'entry_override_reason' => null, 'entry_override_by' => null, 'entry_override_at' => null])->save();

            return;
        }

        if ($row->entry_override === $spec['entry_override'] && $row->entry_override_reason === $spec['entry_override_reason']) {
            return;
        }

        $row->forceFill([
            'entry_override' => $spec['entry_override'],
            'entry_override_reason' => $spec['entry_override_reason'],
            'entry_override_by' => $admin->id,
            'entry_override_at' => now(),
        ])->save();
    }

    /** @param  RowSpec  $spec */
    private function children(Fitment $row, array $spec): void
    {
        $now = now();

        foreach ($spec['tyre_sizes'] as $size) {
            $codes = $size['codes'];
            unset($size['codes']);
            /** @var FitmentTyreSize $stored */
            $stored = $row->tyreSizes()->create($size);

            DB::table('fitment_tyre_size_conditions')->insert(array_map(static fn (string $code): array => [
                'fitment_tyre_size_id' => $stored->id,
                'code' => $code,
                'created_at' => $now,
                'updated_at' => $now,
            ], $codes));
        }

        DB::table('fitment_conditions')->insert(array_map(static fn (array $condition): array => [
            'fitment_id' => $row->id,
            'code' => $condition['code'],
            'note_de' => $condition['note'],
            'created_at' => $now,
            'updated_at' => $now,
        ], $spec['conditions']));
    }

    public static function label(ApprovalDocument $document): string
    {
        return $document->kind->labelDe().' '.($document->number() ?? '#'.$document->id);
    }
}
