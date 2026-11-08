<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * The rows written before D-437, put right once: a code typed beside one combination of step 4 that reached another through a size the
 * two share (the client's round of 08.11.2026, §5). A released paper's rows are otherwise never rewritten (DocumentEntryWriter) — here
 * only that code comes off that size, and only where it is the one difference between what the rows hold and what the writer now
 * writes: every other field of the row, every size and every other code as it stands. A row that differs in anything else is left as
 * it is and named, for a person to look at. One entry in the Protokoll per paper.
 */
final readonly class CombinationCodeRepair
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /**
     * @return array{removed: list<string>, left: list<string>} per paper: „car:config:axle 225/35/18.0 FRONT 11A“ taken off, and the rows
     *                                                          that differ otherwise
     */
    public function repair(ApprovalDocument $document, bool $write = true): array
    {
        $desired = $this->writer->desired(EntryModel::of($document))['rows'];
        $actual = EngineRows::actual($document)['rows'];
        $removed = [];
        $left = [];
        /** @var list<array{int, string}> $deletions */
        $deletions = [];

        foreach (array_intersect_key($actual, $desired) as $key => $row) {
            $want = $desired[$key];

            if ($row === $want) {
                continue;
            }

            $plan = self::codesOnlyLess($row, $want);

            if ($plan === null) {
                $left[] = $key;

                continue;
            }

            [$vehicleId, $configId, $axle] = explode(':', $key);
            $fitment = DB::table('fitments')->where('approval_document_id', $document->id)->where('vehicle_id', (int) $vehicleId)
                ->where('wheel_config_id', (int) $configId)->where('axle', $axle)->where('status', '<>', FitmentStatus::Retired->value)->value('id');

            foreach ($plan as [$size, $codes]) {
                $sizeId = DB::table('fitment_tyre_sizes')->where('fitment_id', $fitment)->where('width_mm', $size['width_mm'])->where('aspect', $size['aspect'])
                    ->where('diameter_in', $size['diameter_in'])->where('axle', $size['axle'])
                    ->where(static fn ($q) => $size['min_load_index'] === null ? $q->whereNull('min_load_index') : $q->where('min_load_index', $size['min_load_index']))
                    ->where(static fn ($q) => $size['min_speed_symbol'] === null ? $q->whereNull('min_speed_symbol') : $q->where('min_speed_symbol', $size['min_speed_symbol']))
                    ->where(static fn ($q) => $size['kw_min'] === null ? $q->whereNull('kw_min') : $q->where('kw_min', $size['kw_min']))
                    ->where(static fn ($q) => $size['kw_max'] === null ? $q->whereNull('kw_max') : $q->where('kw_max', $size['kw_max']))
                    ->value('id');

                foreach ($codes as $code) {
                    $deletions[] = [(int) $sizeId, $code];
                    $removed[] = sprintf('%s %d/%d/%s %s %s', $key, $size['width_mm'], $size['aspect'], number_format((float) $size['diameter_in'], 1, '.', ''), $size['axle'], $code);
                }
            }
        }

        foreach (array_diff_key($actual, $desired) + array_diff_key($desired, $actual) as $key => $row) {
            $left[] = $key;
        }

        sort($left);

        if ($write && $deletions !== []) {
            DB::transaction(static function () use ($deletions, $document, $removed): void {
                foreach ($deletions as [$sizeId, $code]) {
                    DB::table('fitment_tyre_size_conditions')->where('fitment_tyre_size_id', $sizeId)->where('code', $code)->delete();
                }

                AuditTrail::system('System', 'approval.combination_codes_corrected', [
                    'document' => FitmentRows::label($document),
                    'codes' => array_values(array_unique(array_map(static fn (string $line): string => (string) substr($line, (int) strrpos($line, ' ') + 1), $removed))),
                    'sizes' => count($removed),
                ], $document);
            });
        }

        return ['removed' => $removed, 'left' => $left];
    }

    /** @return list<int> the papers whose rows the shop reads or a draft shows: released, or being entered */
    public static function papers(): array
    {
        return ApprovalDocument::query()->whereIn('status', [DocumentStatus::Published->value, DocumentStatus::Draft->value])
            ->whereExists(static fn ($q) => $q->selectRaw('1')->from('document_car_entries as e')->whereColumn('e.approval_document_id', 'approval_documents.id'))
            ->orderBy('id')->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all();
    }

    /**
     * Where the row as it stands and the row as it should stand differ only in codes the stored sizes have more of: which size loses which.
     *
     * @param  array<string, mixed>  $row
     * @param  array<string, mixed>  $want
     * @return list<array{0: array<string, mixed>, 1: list<string>}>|null
     */
    private static function codesOnlyLess(array $row, array $want): ?array
    {
        foreach ($row as $field => $value) {
            if ($field !== 'sizes' && $value !== $want[$field]) {
                return null;
            }
        }

        /** @var list<array<string, mixed>> $has */
        $has = $row['sizes'];
        /** @var list<array<string, mixed>> $should */
        $should = $want['sizes'];

        if (count($has) !== count($should)) {
            return null;
        }

        $plan = [];

        foreach ($has as $i => $size) {
            $other = $should[$i];
            /** @var list<string> $codes */
            $codes = $size['codes'];
            /** @var list<string> $wanted */
            $wanted = $other['codes'];
            unset($size['codes'], $other['codes']);

            if ($size !== $other || array_diff($wanted, $codes) !== []) {
                return null;
            }

            $extra = array_values(array_diff($codes, $wanted));

            if ($extra !== []) {
                $plan[] = [$size, $extra];
            }
        }

        return $plan === [] ? null : $plan;
    }
}
