<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Services\Admin\Approvals\FitmentRows;
use App\Services\Admin\AuditTrail;
use Illuminate\Support\Facades\DB;

/**
 * The general codes of a car moved from each of its cells to the car, once (the client's review of 11.11, B; D-452). Where every cell
 * of a car — every wheel combination, every car of its key numbers — says the same, that is the car's. Where they differ and the
 * codes were typed in the five steps, the car keeps all of it: the codes together, a code's notes joined — never one dropped — and the
 * car is named. Where they differ and every cell came from the rows before the five steps, each keeps its own: such a row says its
 * codes for its wheel, not for the car (D-452's reason) — named too. Then the rows the shop reads: a combination that lacked one of its
 * car's codes gets it, and nothing else changes — only ever more Auflagen, never fewer.
 *
 * Back: each cell of the car its car's whole set again; the rows keep what they have.
 *
 * @phpstan-import-type CarCode from CarCodes
 */
final readonly class CarCodesOnce
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /**
     * Every paper's cells' codes, per car. Reads `document_car_entry_codes`, writes `document_vehicle_codes`.
     *
     * @return array{merged: list<string>, kept: list<string>} each car whose cells said different things: merged („Gutachten 33 · 0005/683 ·
     *                                                         3 Zellen · 2B (nur bei 1 von 3)“), or kept per combination (from the rows before)
     */
    public function gather(): array
    {
        $merged = [];
        $kept = [];
        // Per cell: how many of its lines were typed in the five steps; per paper, whether any line of it was read from a row before them.
        $typed = DB::table('document_tyre_lines')->where('from_rows', false)->groupBy('document_car_entry_id')
            ->selectRaw('document_car_entry_id, COUNT(*) AS n')->pluck('n', 'document_car_entry_id')->map(static fn (mixed $n): int => (int) $n)->all();
        $fromRows = DB::table('document_tyre_lines')->join('document_car_entries', 'document_car_entries.id', '=', 'document_tyre_lines.document_car_entry_id')
            ->where('document_tyre_lines.from_rows', true)->distinct()->pluck('document_car_entries.approval_document_id')
            ->map(static fn (mixed $id): int => (int) $id)->flip()->all();
        $cells = DB::table('document_car_entries')->orderBy('id')->get(['id', 'approval_document_id', 'vehicle_id']);
        $cars = DB::table('vehicles')->whereIn('id', $cells->pluck('vehicle_id')->unique()->all())->get(['id', 'hsn', 'tsn'])->keyBy('id');
        /** @var array<int, list<CarCode>> $byCell */
        $byCell = [];

        foreach (DB::table('document_car_entry_codes')->orderBy('id')->get() as $code) {
            $byCell[(int) $code->document_car_entry_id][] = ['code' => (string) $code->code, 'note' => $code->note_de === null ? null : (string) $code->note_de];
        }

        /** @var array<int, array<string, list<int>>> $groups paper => car => its cells */
        $groups = [];

        foreach ($cells as $cell) {
            $car = $cars->get($cell->vehicle_id);
            $key = self::key($car?->hsn, $car?->tsn, (int) $cell->vehicle_id);
            $groups[(int) $cell->approval_document_id][$key][] = (int) $cell->id;
        }

        $now = now();

        foreach ($groups as $documentId => $byCar) {
            foreach ($byCar as $key => $ids) {
                $sets = array_map(static fn (int $id): array => $byCell[$id] ?? [], $ids);
                $all = CarCodes::unique(array_merge([], ...$sets));

                if ($all === []) {
                    continue;
                }

                $same = count(array_unique(array_map(static fn (array $set): string => (string) json_encode(CarCodes::unique($set)), $sets))) === 1;
                $partial = [];

                foreach ($all as $code) {
                    $with = count(array_filter($sets, static fn (array $set): bool => in_array($code['code'], array_column($set, 'code'), true)));

                    if ($with < count($sets)) {
                        $partial[] = "{$code['code']} (nur bei {$with} von ".count($sets).')';
                    }
                }

                $line = sprintf('Gutachten %d · %s · %d %s · %s', $documentId, $key, count($sets), count($sets) === 1 ? 'Zelle' : 'Zellen', $partial === [] ? 'Hinweise verbunden' : implode(', ', $partial));

                // A car carried from the rows before the five steps — its paper's lines were read from them, and none of its own typed
                // since — whose rows say different things per wheel: each combination keeps its own, as the shop reads it now. A row
                // without tyres was carried too, as a cell without lines. In a paper typed from the start, every car is being typed.
                $carried = isset($fromRows[$documentId]) && array_sum(array_map(static fn (int $id): int => $typed[$id] ?? 0, $ids)) === 0;

                if (! $same && $carried) {
                    $kept[] = $line;

                    continue;
                }

                if (! $same) {
                    $merged[] = $line;
                }

                $first = $cars->get(DB::table('document_car_entries')->where('id', $ids[0])->value('vehicle_id'));

                // The car's now: off the cells.
                DB::table('document_car_entry_codes')->whereIn('document_car_entry_id', $ids)->delete();

                foreach ($all as $code) {
                    DB::table('document_vehicle_codes')->insert([
                        'approval_document_id' => $documentId,
                        'car_key' => $key,
                        'hsn' => str_starts_with($key, '#') ? null : $first?->hsn,
                        'tsn' => str_starts_with($key, '#') ? null : $first?->tsn,
                        'vehicle_id' => str_starts_with($key, '#') ? (int) substr($key, 1) : null,
                        'code' => $code['code'],
                        'note_de' => $code['note'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }

        return ['merged' => $merged, 'kept' => $kept];
    }

    /** @return list<int> the papers whose rows the shop reads or a draft shows: released, or being entered */
    public static function papers(): array
    {
        return ApprovalDocument::query()->whereIn('status', [DocumentStatus::Published->value, DocumentStatus::Draft->value])
            ->whereExists(static fn ($q) => $q->selectRaw('1')->from('document_car_entries as e')->whereColumn('e.approval_document_id', 'approval_documents.id'))
            ->orderBy('id')->pluck('id')->map(static fn (mixed $id): int => (int) $id)->all();
    }

    /**
     * A paper's rows given the codes of their car that they lack — where that is the one difference from what the writer writes; a row
     * that differs in anything else is left and named.
     *
     * @return array{added: list<string>, left: list<string>} „car:config:axle 2B“ added, rows left
     */
    public function rows(ApprovalDocument $document, bool $write = true): array
    {
        $desired = $this->writer->desired(EntryModel::of($document))['rows'];
        $actual = EngineRows::actual($document)['rows'];
        $added = [];
        $left = [];
        /** @var list<array{int, string, string|null, bool}> $inserts row, code, note, whether the row holds the code already (its note grows) */
        $inserts = [];

        foreach (array_intersect_key($actual, $desired) as $key => $row) {
            $want = $desired[$key];

            if ($row === $want) {
                continue;
            }

            /** @var array<string, string|null> $have */
            $have = array_column($row['codes'], 'note', 'code');
            /** @var array<string, string|null> $should */
            $should = array_column($want['codes'], 'note', 'code');
            $rest = static function (array $r): array {
                unset($r['codes'], $r['requires_entry']);

                return $r;
            };
            // A code the row holds and the car's set does not, or a note that would lose its words: not this repair's to decide.
            $foreign = array_diff_key($have, $should) !== [] || array_filter($have, static fn (?string $note, string $code): bool => $note !== null && ! str_contains((string) $should[$code], $note), ARRAY_FILTER_USE_BOTH) !== [];

            // Only codes the row lacks, notes that grow; the Eintragung may only follow them, from „nein“ to „ja“ (an Abnahme among them).
            if ($rest($row) !== $rest($want) || $foreign || ($row['requires_entry'] && ! $want['requires_entry'])) {
                $left[] = $key;

                continue;
            }

            [$vehicleId, $configId, $axle] = explode(':', $key);
            $fitment = (int) DB::table('fitments')->where('approval_document_id', $document->id)->where('vehicle_id', (int) $vehicleId)
                ->where('wheel_config_id', (int) $configId)->where('axle', $axle)->where('status', '<>', FitmentStatus::Retired->value)->value('id');

            foreach ($should as $code => $note) {
                if (! array_key_exists($code, $have) || $have[$code] !== $note) {
                    $inserts[] = [$fitment, (string) $code, $note, array_key_exists($code, $have)];
                    $added[] = $key.' '.$code.(array_key_exists($code, $have) ? ' (Hinweis ergänzt)' : '');
                }
            }

            if ($want['requires_entry'] && ! $row['requires_entry']) {
                $added[] = $key.' Eintragung';
            }
        }

        foreach (array_diff_key($actual, $desired) + array_diff_key($desired, $actual) as $key => $row) {
            $left[] = $key;
        }

        sort($left);

        if ($write && $inserts !== []) {
            DB::transaction(static function () use ($inserts, $document, $desired): void {
                $now = now();

                foreach ($inserts as [$fitment, $code, $note, $held]) {
                    if ($held) {
                        DB::table('fitment_conditions')->where('fitment_id', $fitment)->where('code', $code)->update(['note_de' => $note, 'updated_at' => $now]);
                    } else {
                        DB::table('fitment_conditions')->insert(['fitment_id' => $fitment, 'code' => $code, 'note_de' => $note, 'created_at' => $now, 'updated_at' => $now]);
                    }
                }

                foreach (array_unique(array_column($inserts, 0)) as $fitment) {
                    $row = DB::table('fitments')->where('id', $fitment)->first(['vehicle_id', 'wheel_config_id', 'axle']);

                    if ($row !== null && ($desired[EngineRows::key((int) $row->vehicle_id, (int) $row->wheel_config_id, (string) $row->axle)]['requires_entry'] ?? false) === true) {
                        DB::table('fitments')->where('id', $fitment)->update(['requires_entry' => true]);
                    }
                }

                AuditTrail::system('System', 'approval.vehicle_codes_per_car', [
                    'document' => FitmentRows::label($document),
                    'codes' => array_values(array_unique(array_map(static fn (array $i): string => $i[1], $inserts))),
                    'rows' => count(array_unique(array_column($inserts, 0))),
                ], $document);
            });
        }

        return ['added' => $added, 'left' => $left];
    }

    /** The way back: every cell of a car its car's whole set, into `document_car_entry_codes` again. */
    public function spread(): void
    {
        $now = now();

        foreach (DocumentCarEntry::query()->with('vehicle:id,hsn,tsn')->orderBy('id')->get() as $cell) {
            foreach (CarCodes::of($cell) as $code) {
                DB::table('document_car_entry_codes')->insertOrIgnore(['document_car_entry_id' => $cell->id, 'code' => $code['code'], 'note_de' => $code['note'], 'created_at' => $now, 'updated_at' => $now]);
            }
        }
    }

    private static function key(mixed $hsn, mixed $tsn, int $vehicleId): string
    {
        return is_string($hsn) && $hsn !== '' && is_string($tsn) && $tsn !== '' ? $hsn.'/'.mb_strtoupper($tsn) : '#'.$vehicleId;
    }
}
