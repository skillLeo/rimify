<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Enums\ConflictKind;
use App\Enums\ConflictStatus;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\FitmentConflict;
use App\Models\FitmentTyreSize;

/**
 * Two documents that say different things about the same car and the same wheel.
 *
 * Run when a Gutachten is freigegeben: each of its rows is held against the published rows of every
 * other current document for the same vehicle and size. Where they differ — one asks for an
 * Eintragung and the other does not, other tyre sizes, another width or ET range, other Auflagen —
 * a conflict is recorded with both sides, as they are shown side by side, and the team is told
 * (ConflictAlertObserver). The release goes on: until someone decides, the resolver merges toward
 * caution, so the stricter statement governs. The system never picks a winner itself.
 */
final class ConflictDetector
{
    /** @return list<FitmentConflict> the conflicts recorded now (not the ones already open) */
    public function detect(ApprovalDocument $document, ?AdminUser $by): array
    {
        $rows = Fitment::query()
            ->with(['tyreSizes', 'conditions'])
            ->where('approval_document_id', $document->id)
            ->where('status', '<>', FitmentStatus::Retired->value)
            ->get();

        $recorded = [];

        foreach ($rows as $row) {
            $others = Fitment::query()
                ->with(['tyreSizes', 'conditions', 'approvalDocument'])
                ->where('vehicle_id', $row->vehicle_id)
                ->where('wheel_config_id', $row->wheel_config_id)
                ->where('approval_document_id', '<>', $document->id)
                // The revision this one replaces is not a second opinion: it is going.
                ->when($document->supersedes_id !== null, static fn ($q) => $q->where('approval_document_id', '<>', $document->supersedes_id))
                ->where('status', FitmentStatus::Published->value)
                ->whereHas('approvalDocument', static fn ($q) => $q->where('status', DocumentStatus::Published->value))
                ->get();

            foreach ($others as $existing) {
                if (! self::axlesOverlap($row->axle->value, $existing->axle->value)) {
                    continue;
                }

                foreach ($this->differences($row, $existing) as $kind => $field) {
                    $open = FitmentConflict::query()
                        ->where('candidate_fitment_id', $row->id)
                        ->where('existing_fitment_id', $existing->id)
                        ->where('kind', $kind)
                        ->where('status', ConflictStatus::Open->value)
                        ->exists();

                    if ($open) {
                        continue;
                    }

                    $recorded[] = FitmentConflict::query()->create([
                        'kind' => $kind,
                        'status' => ConflictStatus::Open->value,
                        'vehicle_id' => $row->vehicle_id,
                        'wheel_config_id' => $row->wheel_config_id,
                        'candidate_fitment_id' => $row->id,
                        'existing_fitment_id' => $existing->id,
                        'blocking' => false,
                        'detected_by' => $by?->id,
                        'detail' => [
                            'field' => $field,
                            'existing' => self::side($existing, $existing->approvalDocument),
                            'candidate' => self::side($row, $document),
                        ],
                    ]);
                }
            }
        }

        return $recorded;
    }

    /** @return array<string, string> kind => the field it is about */
    private function differences(Fitment $a, Fitment $b): array
    {
        $out = [];

        if ($a->requires_entry !== $b->requires_entry) {
            $out[ConflictKind::EntryRequirement->value] = 'requires_entry';
        }

        if (self::sizes($a) !== self::sizes($b)) {
            $out[ConflictKind::TyreSizes->value] = 'tyre_sizes';
        }

        $range = static fn (Fitment $f): string => implode('|', [$f->permitted_width_min, $f->permitted_width_max, $f->permitted_et_min, $f->permitted_et_max]);

        if ($range($a) !== $range($b)) {
            $out[ConflictKind::WidthEtRange->value] = 'width_et_range';
        }

        if (self::codes($a) !== self::codes($b)) {
            $out[ConflictKind::Conditions->value] = 'conditions';
        }

        return $out;
    }

    /** @return list<string> */
    private static function sizes(Fitment $row): array
    {
        $sizes = $row->tyreSizes->map(static fn (FitmentTyreSize $s): string => $s->width_mm.'/'.$s->aspect.'R'.(float) $s->diameter_in.'@'.$s->axle->value)->all();
        sort($sizes);

        return $sizes;
    }

    /** @return list<string> */
    private static function codes(Fitment $row): array
    {
        $codes = $row->conditions->pluck('code')->map(static fn (mixed $c): string => (string) $c)->all();
        sort($codes);

        return $codes;
    }

    private static function axlesOverlap(string $a, string $b): bool
    {
        return $a === $b || $a === 'ALL' || $b === 'ALL';
    }

    /** @return array<string, mixed> */
    private static function side(Fitment $row, ?ApprovalDocument $document): array
    {
        return [
            'document' => $document?->number(),
            'document_id' => $document?->id,
            'issuer' => $document?->issuer,
            'requires_entry' => $row->requires_entry,
            'tyre_sizes' => self::sizes($row),
            'conditions' => self::codes($row),
            'source_page' => $row->source_page,
        ];
    }
}
