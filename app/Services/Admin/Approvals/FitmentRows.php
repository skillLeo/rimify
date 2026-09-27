<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * The Verwendungsbereich of one Gutachten, as rows: which vehicle variants may carry which of the
 * catalogue's sizes, with which tyre sizes, under which Auflagen, found on which page.
 *
 * One entry in the form usually stands for many rows — a Gutachten lists a vehicle type with a range
 * of sizes — so rows are added for every vehicle × size chosen, all sharing what was entered. A row
 * already there (the same vehicle, size and axle in this document) is left as it is and counted.
 *
 * Rows are written only while the document is a draft; they become visible to customers only when the
 * whole document is freigegeben (DocumentRelease), never one by one.
 *
 * @phpstan-type TyreSizeInput array{width_mm: int, aspect: int, diameter_in: string, min_load_index: int|null, min_speed_symbol: string|null, axle: string}
 * @phpstan-type RowSpec array{axle: string, requires_entry: bool, entry_note_de: string|null, source_page: int|null, build_from: string|null, build_to: string|null, permitted_width_min: string|null, permitted_width_max: string|null, permitted_et_min: int|null, permitted_et_max: int|null, centre_bore_mm: string|null, tyre_sizes: list<TyreSizeInput>, conditions: list<array{id: int, note: string|null}>}
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

                    $row = Fitment::query()->create(self::columns($spec) + [
                        'approval_document_id' => $document->id,
                        'vehicle_id' => $vehicleId,
                        'wheel_config_id' => $configId,
                        'status' => FitmentStatus::Draft->value,
                        'created_by' => $admin->id,
                    ]);

                    $this->children($row, $spec);
                    $created++;
                }
            }

            AuditTrail::record($admin, 'approval.rows_added', [
                'document' => self::label($document),
                'rows' => $created,
                'skipped' => $skipped,
            ], $document);

            return ['created' => $created, 'skipped' => $skipped];
        });
    }

    /** @param  RowSpec  $spec */
    public function update(Fitment $row, array $spec, AdminUser $admin): void
    {
        DB::transaction(function () use ($row, $spec, $admin): void {
            $row->fill(self::columns($spec))->save();
            $row->tyreSizes()->delete();
            $row->conditions()->detach();
            $this->children($row, $spec);

            AuditTrail::record($admin, 'approval.row_updated', [
                'document' => self::label($row->approvalDocument),
                'row' => $row->id,
            ], $row->approvalDocument);
        });
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
     * @param  RowSpec  $spec
     * @return array<string, mixed>
     */
    private static function columns(array $spec): array
    {
        return [
            'axle' => $spec['axle'],
            'requires_entry' => $spec['requires_entry'],
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

    /** @param  RowSpec  $spec */
    private function children(Fitment $row, array $spec): void
    {
        foreach ($spec['tyre_sizes'] as $size) {
            $row->tyreSizes()->create($size);
        }

        foreach ($spec['conditions'] as $condition) {
            $row->conditions()->attach($condition['id'], ['note_de' => $condition['note']]);
        }
    }

    public static function label(ApprovalDocument $document): string
    {
        return $document->kind->labelDe().' '.($document->number() ?? '#'.$document->id);
    }
}
