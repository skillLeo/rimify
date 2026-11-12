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
 * A combination's codes moved onto the combination, once (the client's review of 11.11, A; D-451): the rows written before it held a
 * code typed beside a combination of step 4 on that combination's tyre sizes — since D-437 a sentence for the whole set on one side
 * only, which the shop then said for one axle („11A · Hinterachse“). Now the combination's row of the list holds it
 * (`document_tyre_combination_conditions`), for both its axles and no other combination.
 *
 * Exactly what the writer now writes, and nothing else, the way D-437's repair went: the codes the stored sizes
 * have beyond it come off, the codes the list's rows lack go on — and only where that is the one difference. A code comes off a size
 * only where it lands on a combination of the same car that holds the size: no code a car was told is dropped. A row that differs in
 * anything else is left as it is and named. One entry in the Protokoll per paper.
 *
 * Back (the migration's down): each combination's codes onto every size of its car's rows on the wheel they were typed for that the
 * combination holds, on its axle — the cautious reading, never fewer than before — and off the combination.
 */
final readonly class CombinationCodesToSets
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /** @return list<int> the papers whose rows the shop reads or a draft shows: released, or being entered */
    public static function papers(): array
    {
        return ApprovalDocument::query()->whereIn('status', [DocumentStatus::Published->value, DocumentStatus::Draft->value])
            ->whereExists(static fn ($q) => $q->selectRaw('1')->from('document_car_entries as e')->whereColumn('e.approval_document_id', 'approval_documents.id'))
            ->orderBy('id')->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all();
    }

    /**
     * @return array{moved: list<string>, additions: int, left: list<string>} per paper: the codes off a size („car:config:axle
     *                                                                        225/35/18.0 REAR 11A“), how many went onto a combination, and what was
     *                                                                        left as it stood
     */
    public function move(ApprovalDocument $document, bool $write = true): array
    {
        $desired = $this->writer->desired(EntryModel::of($document));
        $actual = EngineRows::actual($document);
        $moved = [];
        $left = [];

        // The list: each of the car's combinations, with the codes it should hold and the rows that stand for it.
        /** @var array<string, list<string>> $wanted vehicle|front|rear => codes */
        $wanted = [];

        foreach ($desired['list'] as $row) {
            if ($row['vehicle_id'] !== null && $row['codes'] !== []) {
                $wanted[self::pairKey($row)] = array_values(array_unique([...($wanted[self::pairKey($row)] ?? []), ...$row['codes']]));
            }
        }

        /** @var array<string, list<int>> $standing vehicle|front|rear => ids of `document_tyre_combinations` */
        $standing = [];
        /** @var array<int, list<string>> $held id => `config:code` it holds */
        $held = [];

        foreach (DB::table('document_tyre_combinations')->where('approval_document_id', $document->id)->whereNotNull('vehicle_id')->orderBy('id')->get() as $row) {
            $standing[self::pairKey((array) $row)][] = (int) $row->id;
        }

        foreach (DB::table('document_tyre_combination_conditions')->whereIn('document_tyre_combination_id', array_merge([], ...array_values($standing)))->get() as $code) {
            $held[(int) $code->document_tyre_combination_id][] = $code->wheel_config_id.':'.$code->code;
        }

        /** @var list<array{int, int, string}> $additions combination, wheel, code */
        $additions = [];
        /** @var array<string, array<string, true>> $landing vehicle => wheel|code|axle|size => true: where a code stands on a combination */
        $landing = [];

        foreach ($wanted as $key => $codes) {
            if (! isset($standing[$key])) {
                $left[] = 'Kombination '.$key.' fehlt in der Liste';

                continue;
            }

            [$vehicleId, $front, $rear] = explode('|', $key);

            foreach ($codes as $tagged) {
                [$configId, $code] = explode(':', $tagged, 2);
                $landing[$vehicleId][$configId.'|'.$code.'|FRONT|'.$front] = true;
                $landing[$vehicleId][$configId.'|'.$code.'|REAR|'.$rear] = true;

                foreach ($standing[$key] as $id) {
                    if (! in_array($tagged, $held[$id] ?? [], true)) {
                        $additions[] = [$id, (int) $configId, $code];
                    }
                }
            }
        }

        // The sizes: codes they hold beyond what the writer now writes — off, where the code stands on a combination of the car with that size.
        /** @var list<array{int, string}> $deletions */
        $deletions = [];
        /** @var list<int> $entries size entries that only carried such codes: they go with them */
        $entries = [];

        foreach (array_intersect_key($actual['rows'], $desired['rows']) as $rowKey => $row) {
            $want = $desired['rows'][$rowKey];

            if ($row === $want) {
                continue;
            }

            $plan = self::codesOnlyLess($row, $want);

            if ($plan === null) {
                $left[] = $rowKey;

                continue;
            }

            [$vehicleId, $configId, $axle] = explode(':', $rowKey);
            $fitment = DB::table('fitments')->where('approval_document_id', $document->id)->where('vehicle_id', (int) $vehicleId)
                ->where('wheel_config_id', (int) $configId)->where('axle', $axle)->where('status', '<>', FitmentStatus::Retired->value)->value('id');

            foreach ($plan as [$size, $codes, $drop]) {
                $sizeKey = $size['width_mm'].'/'.$size['aspect'].'/'.number_format((float) $size['diameter_in'], 1, '.', '');
                $axles = $size['axle'] === 'ALL' ? ['FRONT', 'REAR'] : [(string) $size['axle']];
                $lands = static fn (string $code): bool => array_filter($axles, static fn (string $on): bool => isset($landing[$vehicleId][$configId.'|'.$code.'|'.$on.'|'.$sizeKey])) !== [];
                $sizeId = self::sizeId((int) $fitment, $size);

                // An entry that only carried such codes goes with them — only where every one of them lands on a combination.
                if ($drop && array_filter($codes, static fn (string $code): bool => ! $lands($code)) !== []) {
                    $left[] = sprintf('%s %s %s', $rowKey, $sizeKey, $size['axle']);

                    continue;
                }

                foreach ($codes as $code) {
                    if (! $lands($code)) {
                        $left[] = sprintf('%s %s %s %s', $rowKey, $sizeKey, $size['axle'], $code);

                        continue;
                    }

                    $deletions[] = [$sizeId, $code];
                    $moved[] = sprintf('%s %s %s %s', $rowKey, $sizeKey, $size['axle'], $code);
                }

                if ($drop) {
                    $entries[] = $sizeId;
                }
            }
        }

        foreach (array_diff_key($actual['rows'], $desired['rows']) + array_diff_key($desired['rows'], $actual['rows']) as $rowKey => $row) {
            $left[] = $rowKey;
        }

        sort($left);
        $left = array_values(array_unique($left));

        if ($write && ($deletions !== [] || $additions !== [])) {
            DB::transaction(static function () use ($deletions, $additions, $entries, $document, $moved): void {
                $now = now();

                foreach ($additions as [$id, $configId, $code]) {
                    DB::table('document_tyre_combination_conditions')->insert(['document_tyre_combination_id' => $id, 'wheel_config_id' => $configId, 'code' => $code, 'created_at' => $now, 'updated_at' => $now]);
                }

                foreach ($deletions as [$sizeId, $code]) {
                    DB::table('fitment_tyre_size_conditions')->where('fitment_tyre_size_id', $sizeId)->where('code', $code)->delete();
                }

                // Its codes off, the entry says nothing its twin for both axles does not: the writer no longer writes it.
                DB::table('fitment_tyre_sizes')->whereIn('id', $entries)->whereNotExists(static fn ($q) => $q->selectRaw('1')->from('fitment_tyre_size_conditions as c')->whereColumn('c.fitment_tyre_size_id', 'fitment_tyre_sizes.id'))->delete();

                AuditTrail::system('System', 'approval.combination_codes_to_sets', [
                    'document' => FitmentRows::label($document),
                    'codes' => array_values(array_unique(array_map(static fn (array $a): string => $a[2], $additions))),
                    'combinations' => count(array_unique(array_map(static fn (array $a): int => $a[0], $additions))),
                    'sizes' => count($moved),
                ], $document);
            });
        }

        return ['moved' => $moved, 'additions' => count($additions), 'left' => $left];
    }

    /**
     * The way back: each combination's codes onto every size of its car's rows on that wheel the combination holds, on its axle, and
     * off the combination. Never fewer codes than before the move — on a size a code stood on one side of, it now stands on both.
     */
    public function back(int $documentId): int
    {
        $restored = 0;
        $pairs = DB::table('document_tyre_combinations')->where('approval_document_id', $documentId)->whereNotNull('vehicle_id')->orderBy('id')->get();
        $codes = DB::table('document_tyre_combination_conditions')->whereIn('document_tyre_combination_id', $pairs->pluck('id')->all())->get()->groupBy('document_tyre_combination_id');

        foreach ($pairs as $pair) {
            foreach ($codes[$pair->id] ?? [] as $code) {
                $rows = DB::table('fitments')->where('approval_document_id', $documentId)->where('vehicle_id', $pair->vehicle_id)
                    ->where('wheel_config_id', $code->wheel_config_id)->where('status', '<>', FitmentStatus::Retired->value)->pluck('id')->all();

                foreach (DB::table('fitment_tyre_sizes')->whereIn('fitment_id', $rows)->get() as $size) {
                    $front = (int) $size->width_mm === (int) $pair->front_width_mm && (int) $size->aspect === (int) $pair->front_aspect
                        && (float) $size->diameter_in === (float) $pair->front_diameter_in && $size->axle !== 'REAR';
                    $rear = (int) $size->width_mm === (int) $pair->rear_width_mm && (int) $size->aspect === (int) $pair->rear_aspect
                        && (float) $size->diameter_in === (float) $pair->rear_diameter_in && $size->axle !== 'FRONT';

                    if (($front || $rear) && ! DB::table('fitment_tyre_size_conditions')->where('fitment_tyre_size_id', $size->id)->where('code', $code->code)->exists()) {
                        DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $size->id, 'code' => $code->code, 'created_at' => now(), 'updated_at' => now()]);
                        $restored++;
                    }
                }
            }
        }

        DB::table('document_tyre_combination_conditions')->whereIn('document_tyre_combination_id', $pairs->pluck('id')->all())->delete();

        return $restored;
    }

    /** @param array<string, mixed> $row */
    private static function pairKey(array $row): string
    {
        $size = static fn (string $side): string => $row["{$side}_width_mm"].'/'.$row["{$side}_aspect"].'/'.number_format((float) $row["{$side}_diameter_in"], 1, '.', '');

        return $row['vehicle_id'].'|'.$size('front').'|'.$size('rear');
    }

    /** @param array<string, mixed> $size */
    private static function sizeId(int $fitment, array $size): int
    {
        return (int) DB::table('fitment_tyre_sizes')->where('fitment_id', $fitment)->where('width_mm', $size['width_mm'])->where('aspect', $size['aspect'])
            ->where('diameter_in', $size['diameter_in'])->where('axle', $size['axle'])
            ->where(static fn ($q) => $size['min_load_index'] === null ? $q->whereNull('min_load_index') : $q->where('min_load_index', $size['min_load_index']))
            ->where(static fn ($q) => $size['min_speed_symbol'] === null ? $q->whereNull('min_speed_symbol') : $q->where('min_speed_symbol', $size['min_speed_symbol']))
            ->where(static fn ($q) => $size['kw_min'] === null ? $q->whereNull('kw_min') : $q->where('kw_min', $size['kw_min']))
            ->where(static fn ($q) => $size['kw_max'] === null ? $q->whereNull('kw_max') : $q->where('kw_max', $size['kw_max']))
            ->value('id');
    }

    /**
     * Where the row as it stands and the row as it should stand differ only in codes the stored sizes have more of: which size loses
     * which — and, where the writer no longer writes an entry at all, that entry, if it only carried such codes: the same size with the
     * same figures stands on an entry of the row for both axles (D-437 wrote a second one, for one axle, to carry a combination's code).
     *
     * @param  array<string, mixed>  $row
     * @param  array<string, mixed>  $want
     * @return list<array{0: array<string, mixed>, 1: list<string>, 2: bool}>|null size, codes off, the entry goes too
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
        $bare = static function (array $size, bool $axle = true): array {
            unset($size['codes']);

            if (! $axle) {
                unset($size['axle']);
            }

            return $size;
        };
        $matched = array_fill(0, count($should), false);
        $plan = [];

        foreach ($has as $size) {
            $twin = null;

            foreach ($should as $j => $other) {
                if (! $matched[$j] && $bare($other) === $bare($size)) {
                    $twin = $j;

                    break;
                }
            }

            if ($twin !== null) {
                $matched[$twin] = true;
                /** @var list<string> $codes */
                $codes = $size['codes'];
                /** @var list<string> $wanted */
                $wanted = $should[$twin]['codes'];

                if (array_diff($wanted, $codes) !== []) {
                    return null;
                }

                $extra = array_values(array_diff($codes, $wanted));

                if ($extra !== []) {
                    $plan[] = [$size, $extra, false];
                }

                continue;
            }

            $forBoth = array_filter($has, static fn (array $other): bool => $other['axle'] === 'ALL' && $bare($other, false) === $bare($size, false));

            if ($size['axle'] === 'ALL' || $size['codes'] === [] || $forBoth === []) {
                return null;
            }

            /** @var list<string> $codes */
            $codes = $size['codes'];
            $plan[] = [$size, $codes, true];
        }

        return in_array(false, $matched, true) || $plan === [] ? null : $plan;
    }
}
