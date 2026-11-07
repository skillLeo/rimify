<?php

declare(strict_types=1);

namespace Tests\Support\Gutachten;

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreLine;
use App\Models\DocumentTyreLineCode;
use App\Models\DocumentWheelSize;
use App\Models\WheelConfig;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Support\TyreText;

/**
 * A paper's cars and tyres as a person enters them: step 2's wheel size, step 3's cars, step 4's lines, through the endpoints
 * those steps call, so every request passes the Form Request and the Policy a person's does.
 *
 * What the steps do not type is a size for one axle alone: a line there is vorne + hinten. A paper entered before them has such
 * sizes, and so do the Borbet transcriptions, read row by row from their PDFs. Those lines are written directly, as
 * DocumentEntryReader writes them.
 */
final class EntryDriver
{
    /**
     * @param  array{vehicle_ids: list<int>, config_ids: list<int>, source_page?: int|null, tyre_sizes?: list<array<string, mixed>>, conditions?: list<array{code: string, note?: string|null}>}  $row
     */
    public static function enter(object $test, AdminUser $admin, int $documentId, array $row): void
    {
        $base = "/admin/gutachten/{$documentId}/erfassung";
        $configId = $row['config_ids'][0] ?? null;

        // The factory's diameter is random and the steps refuse R18 on a 19-inch rim: a wheel takes its tyres' diameter.
        $diameters = array_values(array_unique(array_map(static fn (array $size): float => (float) ($size['diameter'] ?? $size['diameter_in']), $row['tyre_sizes'] ?? [])));

        if ($configId !== null && count($diameters) === 1) {
            WheelConfig::query()->whereKey($configId)->update(['diameter_in' => $diameters[0]]);
        }

        if ($configId !== null && DocumentWheelSize::query()->where('approval_document_id', $documentId)->doesntExist()) {
            $test->actingAs($admin, 'admin')->postJson("{$base}/kombinationen", ['front_config_id' => $configId, 'rear_config_id' => $configId])->assertOk();
        }

        $test->actingAs($admin, 'admin')->postJson("{$base}/fahrzeuge", ['vehicle_ids' => $row['vehicle_ids']])->assertOk();

        foreach ($row['vehicle_ids'] as $vehicleId) {
            $entry = DocumentCarEntry::query()->where('approval_document_id', $documentId)->where('vehicle_id', $vehicleId)->firstOrFail();
            self::lines($test, $admin, $entry, $row['tyre_sizes'] ?? [], $row['conditions'] ?? [], $row['source_page'] ?? null);
        }
    }

    /**
     * One car's tyres, each size as the old row's array named it.
     *
     * @param  list<array<string, mixed>>  $sizes
     * @param  list<array{code: string, note?: string|null}>  $conditions
     */
    public static function lines(object $test, AdminUser $admin, DocumentCarEntry $entry, array $sizes, array $conditions = [], ?int $page = null): void
    {
        $both = [];
        $oneAxle = [];

        foreach ($sizes as $size) {
            if (($size['axle'] ?? 'ALL') === 'ALL') {
                $both[] = [
                    'id' => null,
                    'front' => self::text($size),
                    'rear' => self::text($size),
                    'kw' => isset($size['kw_min'], $size['kw_max']) ? $size['kw_min'].'-'.$size['kw_max'] : '',
                    'codes' => $size['codes'] ?? [],
                ];
            } else {
                $oneAxle[] = $size;
            }
        }

        $test->actingAs($admin, 'admin')->putJson("/admin/gutachten/{$entry->approval_document_id}/erfassung/fahrzeuge/{$entry->id}", [
            'lines' => $both,
            'codes' => array_map(static fn (array $code): array => ['code' => $code['code'], 'note' => $code['note'] ?? null], $conditions),
            'source_page' => $page,
        ])->assertOk();

        if ($oneAxle !== []) {
            self::oneAxleLines($entry, $oneAxle, count($both));
        }
    }

    /** A car chosen, without tyres: step 3 and no further. */
    public static function car(object $test, AdminUser $admin, int $documentId, int $vehicleId, int $configId): DocumentCarEntry
    {
        $base = "/admin/gutachten/{$documentId}/erfassung";

        if (DocumentWheelSize::query()->where('approval_document_id', $documentId)->doesntExist()) {
            $test->actingAs($admin, 'admin')->postJson("{$base}/kombinationen", ['front_config_id' => $configId, 'rear_config_id' => $configId])->assertOk();
        }

        $test->actingAs($admin, 'admin')->postJson("{$base}/fahrzeuge", ['vehicle_ids' => [$vehicleId]])->assertOk();

        return DocumentCarEntry::query()->where('approval_document_id', $documentId)->where('vehicle_id', $vehicleId)->firstOrFail();
    }

    /**
     * Sizes for one axle alone, written as the reader writes them, then the rows from them.
     *
     * @param  list<array<string, mixed>>  $sizes
     */
    private static function oneAxleLines(DocumentCarEntry $entry, array $sizes, int $position): void
    {
        foreach ($sizes as $i => $size) {
            $side = $size['axle'] === 'FRONT' ? 'front' : 'rear';
            $line = DocumentTyreLine::query()->create([
                'document_car_entry_id' => $entry->id,
                'position' => $position + $i,
                "{$side}_width_mm" => $size['width_mm'],
                "{$side}_aspect" => $size['aspect'],
                "{$side}_diameter_in" => $size['diameter'],
                "{$side}_load_index" => $size['min_load_index'] ?? null,
                "{$side}_speed_symbol" => ($size['min_speed_symbol'] ?? '') === '' ? null : $size['min_speed_symbol'],
                'kw_min' => $size['kw_min'] ?? null,
                'kw_max' => $size['kw_max'] ?? null,
                'from_rows' => true,
            ]);

            foreach ($size['codes'] ?? [] as $code) {
                DocumentTyreLineCode::query()->create(['document_tyre_line_id' => $line->id, 'code' => $code]);
            }
        }

        (new DocumentEntryWriter)->write(ApprovalDocument::query()->findOrFail($entry->approval_document_id));
    }

    /** @param array<string, mixed> $size */
    public static function text(array $size): string
    {
        return TyreText::label([
            'width' => (int) $size['width_mm'],
            'aspect' => (int) $size['aspect'],
            'diameter' => (float) ($size['diameter'] ?? $size['diameter_in']),
            'li' => $size['min_load_index'] ?? null,
            'si' => ($size['min_speed_symbol'] ?? '') === '' ? null : $size['min_speed_symbol'],
            'marker' => null,
        ]);
    }
}
