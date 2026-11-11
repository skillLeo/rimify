<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Domain\Fitment\Tyres\CombinationEntry;
use App\Models\ApprovalDocument;
use App\Models\DocumentKeptCombination;
use App\Models\DocumentTyreCombination;
use App\Services\Admin\Approvals\Entry\DocumentEntryReader;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Services\Admin\Approvals\Entry\EntryModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Front/rear pairs per car (his round of 08.11, §2; D-447): each row of `document_tyre_combinations` the shop reads for a car
 * names that car, so two cars of one field K can hold different pairs, and the warning „teilt seine Betriebserlaubnis“ has no
 * cause left. `bind()` gives every car a document's list reaches today — through its field K, as CombinationEntry chooses —
 * the rows of its entry: the rows themselves go to the entry's first car and keep their ids (the id an order line froze,
 * D-335, still names its row), every further car of that entry gets a copy. Rows no car is reached by stay without a car;
 * the shop matches them by field K as before (EloquentFitmentRepository::tyreCombinations).
 */
final class CombinationCars
{
    private const PAIR = ['front_width_mm', 'front_aspect', 'front_diameter_in', 'rear_width_mm', 'rear_aspect', 'rear_diameter_in'];

    /**
     * The binding held to the brief's rule, not a single verdict changed: every car × rim pair a list reaches is read before
     * and after, in one transaction with the binding. Where one answer would differ, nothing is bound and the exception names
     * the pairs (fails closed, CLAUDE.md §2). Nothing to bind, nothing read: a new database has no list yet.
     *
     * @return array{documents: int, bound: int, copied: int, pairs: int}
     */
    public function bindWithoutChange(?CombinationCensus $census = null): array
    {
        if (DB::table('document_tyre_combinations')->whereNull('vehicle_id')->whereNotNull('eg_number_norm')->doesntExist()) {
            return ['documents' => 0, 'bound' => 0, 'copied' => 0, 'pairs' => 0];
        }

        $census ??= app(CombinationCensus::class);
        $before = $census->take(new EloquentFitmentRepository, listedOnly: true);

        return DB::transaction(function () use ($census, $before): array {
            $bound = $this->bind();
            $after = $census->take(new EloquentFitmentRepository, listedOnly: true);
            $changed = array_keys(array_diff_key($after, $before) + array_filter($before, static fn (array $answer, string $pair): bool => ($after[$pair] ?? null) !== $answer, ARRAY_FILTER_USE_BOTH));

            if ($changed !== []) {
                throw new RuntimeException(sprintf(
                    'Reifenkombinationen nicht je Fahrzeug übernommen: %d von %d Urteilen (Fahrzeug:Felge) wären danach anders – %s.',
                    count($changed),
                    count($before),
                    implode(', ', array_slice($changed, 0, 10)),
                ));
            }

            return [...$bound, 'pairs' => count($before)];
        });
    }

    /**
     * Binds the rows of every document to the cars they reach; idempotent — a row that names a car is left alone, and a
     * document whose rows already name cars is not read again.
     *
     * @return array{documents: int, bound: int, copied: int}
     */
    public function bind(?int $documentId = null): array
    {
        $documents = DB::table('document_tyre_combinations')->whereNull('vehicle_id')->whereNotNull('eg_number_norm')
            ->when($documentId !== null, static fn ($q) => $q->where('approval_document_id', $documentId))
            ->distinct()->orderBy('approval_document_id')->pluck('approval_document_id');
        $bound = 0;
        $copied = 0;

        foreach ($documents as $documentId) {
            $documentId = (int) $documentId;

            if (DB::table('document_tyre_combinations')->where('approval_document_id', $documentId)->whereNotNull('vehicle_id')->exists()) {
                continue;
            }

            $rows = DB::table('document_tyre_combinations')->where('approval_document_id', $documentId)->orderBy('id')->get();
            /** @var array<string, list<string>> $keys */
            $keys = [];

            foreach ($rows as $row) {
                if (is_string($row->eg_number_norm)) {
                    $keys[$row->eg_number_norm][] = self::pairKey($row);
                }
            }

            // Every car the shop reads this document for — its rows, whatever their state — under the entry its K chooses.
            $cars = DB::table('fitments')
                ->join('vehicles', 'vehicles.id', '=', 'fitments.vehicle_id')
                ->where('fitments.approval_document_id', $documentId)
                ->distinct()
                ->orderBy('fitments.vehicle_id')
                ->get(['fitments.vehicle_id', 'vehicles.eg_nummer_norm']);
            /** @var array<string, list<int>> $carsOf */
            $carsOf = [];

            foreach ($cars as $car) {
                $entry = CombinationEntry::for(is_string($car->eg_nummer_norm) && $car->eg_nummer_norm !== '' ? $car->eg_nummer_norm : null, $keys);

                if ($entry !== null) {
                    $carsOf[$entry][] = (int) $car->vehicle_id;
                }
            }

            foreach ($carsOf as $entry => $vehicleIds) {
                foreach (['document_tyre_combinations', 'document_kept_combinations'] as $table) {
                    $own = $table === 'document_tyre_combinations'
                        ? $rows->filter(static fn (object $row): bool => $row->eg_number_norm === $entry)
                        : DB::table($table)->where('approval_document_id', $documentId)->whereNull('vehicle_id')->where('eg_number_norm', $entry)->orderBy('id')->get();
                    $cars = $vehicleIds;
                    $first = array_shift($cars);

                    DB::table($table)->whereIn('id', $own->pluck('id'))->update(['vehicle_id' => $first]);

                    foreach ($cars as $vehicleId) {
                        foreach ($own as $row) {
                            $copy = (array) $row;
                            unset($copy['id']);
                            DB::table($table)->insert([...$copy, 'vehicle_id' => $vehicleId]);
                        }
                    }

                    if ($table === 'document_tyre_combinations') {
                        $bound += $own->count();
                        $copied += $own->count() * count($cars);
                    }
                }
            }

            if ($carsOf !== [] && DB::table('document_car_entries')->where('approval_document_id', $documentId)->exists()) {
                $this->onTheEntry($documentId);
            }
        }

        return ['documents' => $documents->count(), 'bound' => $bound, 'copied' => $copied];
    }

    /**
     * A paper already in the five steps: every pair a car now holds stands on that car's entry, so its next Fassung writes back
     * exactly what the shop reads (DocumentEntryProof). Under one field K the shop gave a car the pairs another car was entered
     * with; they stay its own — not a verdict changes — and are put on its lines where its rows carry both sizes, kept apart
     * where they do not, marked „übernommen, bitte prüfen“.
     */
    private function onTheEntry(int $documentId): void
    {
        $model = EntryModel::of(ApprovalDocument::query()->findOrFail($documentId));
        $listed = [];

        foreach ((new DocumentEntryWriter)->listOf($model) as $row) {
            if ($row['vehicle_id'] !== null) {
                $listed[(int) $row['vehicle_id']][self::pairKey((object) $row)] = true;
            }
        }

        $reader = new DocumentEntryReader;

        foreach (DocumentTyreCombination::query()->where('approval_document_id', $documentId)->whereNotNull('vehicle_id')->orderBy('id')->get() as $row) {
            if (isset($listed[(int) $row->vehicle_id][self::pairKey((object) $row->getAttributes())])) {
                continue;
            }

            $row->forceFill(['carried_over' => true])->save();
            $carried = false;

            foreach ($model->entries->where('vehicle_id', $row->vehicle_id) as $entry) {
                $carried = $reader->carry($entry, $row) || $carried;
            }

            if (! $carried) {
                DocumentKeptCombination::query()->create([
                    'approval_document_id' => $documentId,
                    ...$row->only(['vehicle_id', 'eg_number', 'eg_number_norm', 'number', 'front_width_mm', 'front_aspect', 'front_diameter_in', 'rear_width_mm', 'rear_aspect', 'rear_diameter_in', 'source_page', 'carried_over']),
                ]);
            }
        }
    }

    /** Whether this database holds pairs per car yet: before D-447's migration, no such column (an older migration may ask). */
    public static function perCar(): bool
    {
        return Schema::hasColumn('document_tyre_combinations', 'vehicle_id');
    }

    private static function pairKey(object $row): string
    {
        return implode('|', array_map(static fn (string $column): string => (string) (float) $row->{$column}, self::PAIR));
    }
}
