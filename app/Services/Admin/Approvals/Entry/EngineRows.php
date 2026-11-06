<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use BackedEnum;
use Illuminate\Support\Facades\DB;

/**
 * What the tables the shop reads hold for one document, in a form two states can be compared in: without ids, stamps or
 * status, every list in one order. `DocumentEntryWriter::desired()` gives the same shape for what they should hold, so
 * „writing a migrated paper back reproduces its rows exactly“ is one `===` (the Gutachten rework's mandatory test).
 *
 * @phpstan-type SizeState array{width_mm: int, aspect: int, diameter_in: float, min_load_index: int|null, min_speed_symbol: string|null, axle: string, kw_min: int|null, kw_max: int|null, codes: list<string>}
 * @phpstan-type RowState array{build_from: string|null, build_to: string|null, permitted_width_min: float|null, permitted_width_max: float|null, permitted_et_min: int|null, permitted_et_max: int|null, centre_bore_mm: float|null, requires_entry: bool, entry_note_de: string|null, entry_override: string|null, entry_override_reason: string|null, source_page: int|null, sizes: list<SizeState>, codes: list<array{code: string, note: string|null}>}
 * @phpstan-type ListState array{eg_number: string|null, eg_number_norm: string|null, number: int, front_width_mm: int, front_aspect: int, front_diameter_in: float, rear_width_mm: int, rear_aspect: int, rear_diameter_in: float, source_page: int|null, carried_over: bool}
 * @phpstan-type State array{rows: array<string, RowState>, list: list<ListState>}
 */
final class EngineRows
{
    /** The key of a row in the state: the row's own identity in `fitments`. */
    public static function key(int $vehicleId, int $configId, string $axle): string
    {
        return $vehicleId.':'.$configId.':'.$axle;
    }

    /** @return State */
    public static function actual(ApprovalDocument $document): array
    {
        $rows = DB::table('fitments')
            ->where('approval_document_id', $document->id)
            ->where('status', '<>', FitmentStatus::Retired->value)
            ->get();
        $ids = $rows->pluck('id')->all();
        $sizes = DB::table('fitment_tyre_sizes')->whereIn('fitment_id', $ids)->orderBy('id')->get();
        $sizeCodes = [];

        foreach (DB::table('fitment_tyre_size_conditions')->whereIn('fitment_tyre_size_id', $sizes->pluck('id')->all())->get() as $code) {
            $sizeCodes[(int) $code->fitment_tyre_size_id][] = (string) $code->code;
        }

        $sizesByRow = [];

        foreach ($sizes as $size) {
            $sizesByRow[(int) $size->fitment_id][] = [
                'width_mm' => (int) $size->width_mm,
                'aspect' => (int) $size->aspect,
                'diameter_in' => (float) $size->diameter_in,
                'min_load_index' => $size->min_load_index === null ? null : (int) $size->min_load_index,
                'min_speed_symbol' => $size->min_speed_symbol,
                'axle' => (string) $size->axle,
                'kw_min' => $size->kw_min === null ? null : (int) $size->kw_min,
                'kw_max' => $size->kw_max === null ? null : (int) $size->kw_max,
                'codes' => $sizeCodes[(int) $size->id] ?? [],
            ];
        }

        $codesByRow = [];

        foreach (DB::table('fitment_conditions')->whereIn('fitment_id', $ids)->get() as $code) {
            $codesByRow[(int) $code->fitment_id][] = ['code' => (string) $code->code, 'note' => $code->note_de];
        }

        $state = [];

        foreach ($rows as $row) {
            $state[self::key((int) $row->vehicle_id, (int) $row->wheel_config_id, (string) $row->axle)] = self::row([
                'build_from' => $row->build_from,
                'build_to' => $row->build_to,
                'permitted_width_min' => $row->permitted_width_min,
                'permitted_width_max' => $row->permitted_width_max,
                'permitted_et_min' => $row->permitted_et_min,
                'permitted_et_max' => $row->permitted_et_max,
                'centre_bore_mm' => $row->centre_bore_mm,
                'requires_entry' => (bool) $row->requires_entry,
                'entry_note_de' => $row->entry_note_de,
                'entry_override' => $row->entry_override,
                'entry_override_reason' => $row->entry_override_reason,
                'source_page' => $row->source_page,
                'sizes' => $sizesByRow[(int) $row->id] ?? [],
                'codes' => $codesByRow[(int) $row->id] ?? [],
            ]);
        }

        ksort($state);

        return [
            'rows' => $state,
            'list' => self::list(DB::table('document_tyre_combinations')->where('approval_document_id', $document->id)->get()
                ->map(static fn (object $row): array => [
                    'eg_number' => $row->eg_number,
                    'eg_number_norm' => $row->eg_number_norm,
                    'number' => (int) $row->number,
                    'front_width_mm' => (int) $row->front_width_mm,
                    'front_aspect' => (int) $row->front_aspect,
                    'front_diameter_in' => (float) $row->front_diameter_in,
                    'rear_width_mm' => (int) $row->rear_width_mm,
                    'rear_aspect' => (int) $row->rear_aspect,
                    'rear_diameter_in' => (float) $row->rear_diameter_in,
                    'source_page' => $row->source_page === null ? null : (int) $row->source_page,
                    'carried_over' => (bool) $row->carried_over,
                ])->all()),
        ];
    }

    /**
     * A row as compared: its figures as numbers, whatever the driver handed back, its children in one order.
     *
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    public static function row(array $row): array
    {
        $number = static fn (mixed $value): ?float => $value === null ? null : (float) $value;
        $whole = static fn (mixed $value): ?int => $value === null ? null : (int) $value;
        $day = static fn (mixed $value): ?string => $value === null ? null : substr((string) $value, 0, 10);
        /** @var list<array<string, mixed>> $sizes */
        $sizes = $row['sizes'];

        foreach ($sizes as &$size) {
            /** @var list<string> $list */
            $list = $size['codes'];
            sort($list);
            $size['codes'] = $list;
        }

        unset($size);
        usort($sizes, static fn (array $a, array $b): int => self::sizeKey($a) <=> self::sizeKey($b));
        /** @var list<array{code: string, note: string|null}> $codes */
        $codes = $row['codes'];
        usort($codes, static fn (array $a, array $b): int => strcmp($a['code'], $b['code']));

        return [
            'build_from' => $day($row['build_from']),
            'build_to' => $day($row['build_to']),
            'permitted_width_min' => $number($row['permitted_width_min']),
            'permitted_width_max' => $number($row['permitted_width_max']),
            'permitted_et_min' => $whole($row['permitted_et_min']),
            'permitted_et_max' => $whole($row['permitted_et_max']),
            'centre_bore_mm' => $number($row['centre_bore_mm']),
            'requires_entry' => (bool) $row['requires_entry'],
            'entry_note_de' => $row['entry_note_de'],
            'entry_override' => $row['entry_override'],
            'entry_override_reason' => $row['entry_override_reason'],
            'source_page' => $whole($row['source_page']),
            'sizes' => $sizes,
            'codes' => $codes,
        ];
    }

    /** @param array<string, mixed> $size */
    public static function sizeKey(array $size): string
    {
        $axle = $size['axle'] instanceof BackedEnum ? $size['axle']->value : $size['axle'];

        return implode('|', [$size['width_mm'], $size['aspect'], number_format((float) $size['diameter_in'], 1, '.', ''), $axle, $size['kw_min'] ?? '', $size['kw_max'] ?? '', $size['min_load_index'] ?? '', $size['min_speed_symbol'] ?? '']);
    }

    /**
     * A list as compared: one order, whatever order it was written in.
     *
     * @param  list<array<string, mixed>>  $rows
     * @return list<array<string, mixed>>
     */
    public static function list(array $rows): array
    {
        $key = static fn (array $row): string => implode('|', [
            $row['eg_number_norm'] ?? '', str_pad((string) $row['number'], 5, '0', STR_PAD_LEFT),
            $row['front_width_mm'], $row['front_aspect'], $row['front_diameter_in'], $row['rear_width_mm'], $row['rear_aspect'], $row['rear_diameter_in'],
        ]);
        usort($rows, static fn (array $a, array $b): int => $key($a) <=> $key($b));

        return $rows;
    }
}
