<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals;

use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Support\EgNumber;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * A Gutachten's tyre combinations per entry of its Verwendungsbereich (his admin item 19: „the Bereifungskombinationen
 * should be adjustable per EG-Typgenehmigungsnummer“; the operator's brief of 29.10.2026, Batch 2, D-358): a document
 * lists vehicle types by their EG type-approval number, and the combinations and Auflagen belong to each type, not to
 * the document as a whole.
 *
 * The entries a document has are the EG numbers of the cars it names — the vehicles under its fitments, as the document
 * prints them (`e1*2001/116*0287*00-09`) — and those already on its rows. `carryOver()` moves the lists entered before
 * per document onto every entry of that document, each copy marked „übernommen, bitte prüfen“; a document whose cars
 * carry no EG number keeps its rows without one, and they match no car (fails closed, CLAUDE.md §2): a verdict never
 * borrows another type's combinations.
 */
final class CombinationEntries
{
    /**
     * The EG numbers of a document's entries, normalised, in their order: those of its cars, then those only on its rows.
     *
     * @return list<string>
     */
    public static function of(int $documentId): array
    {
        $cars = DB::table('fitments')
            ->join('vehicles', 'vehicles.id', '=', 'fitments.vehicle_id')
            ->where('fitments.approval_document_id', $documentId)
            ->whereNotNull('vehicles.eg_nummer_norm')
            ->where('vehicles.eg_nummer_norm', '<>', '')
            ->distinct()
            ->orderBy('vehicles.eg_nummer_norm')
            ->pluck('vehicles.eg_nummer_norm');

        $rows = DB::table('document_tyre_combinations')
            ->where('approval_document_id', $documentId)
            ->whereNotNull('eg_number_norm')
            ->distinct()
            ->orderBy('eg_number_norm')
            ->pluck('eg_number_norm');

        return array_values(array_unique(array_filter(
            [...$cars->map(static fn (mixed $k): string => (string) $k), ...$rows->map(static fn (mixed $k): string => (string) $k)],
            static fn (string $k): bool => EgNumber::parse($k) !== null,
        )));
    }

    /**
     * The carry-over held to the brief's §4, not a single verdict changed: every car × rim pair a list reaches is read as
     * the shop read the lists before (EloquentFitmentRepository::beforeEntries()) and per entry after, in one transaction
     * with the move. Where one answer would differ, nothing is moved and the exception names the pairs (fails closed,
     * CLAUDE.md §2) — a car without a field K under a document's list is one: it would lose the list.
     *
     * Nothing to move, nothing read: a new database has no list yet — and no reference tables either until it is seeded,
     * so the census is built only where a list waits for its entry.
     *
     * @return array{documents: int, copied: int, unassigned: int, pairs: int}
     */
    public function carryOverWithoutChange(?CombinationCensus $census = null): array
    {
        if (DB::table('document_tyre_combinations')->whereNull('eg_number_norm')->doesntExist()) {
            return ['documents' => 0, 'copied' => 0, 'unassigned' => 0, 'pairs' => 0];
        }

        $census ??= app(CombinationCensus::class);
        $before = $census->take(EloquentFitmentRepository::beforeEntries(), listedOnly: true);

        return DB::transaction(function () use ($census, $before): array {
            $moved = $this->carryOver();
            $after = $census->take(new EloquentFitmentRepository, listedOnly: true);
            $changed = array_keys(array_diff_key($after, $before) + array_filter($before, static fn (array $answer, string $pair): bool => ($after[$pair] ?? null) !== $answer, ARRAY_FILTER_USE_BOTH));

            if ($changed !== []) {
                throw new RuntimeException(sprintf(
                    'Bereifungskombinationen nicht je EG-Nummer übernommen: %d von %d Urteilen (Fahrzeug:Felge) wären danach anders – %s.',
                    count($changed),
                    count($before),
                    implode(', ', array_slice($changed, 0, 10)),
                ));
            }

            return [...$moved, 'pairs' => count($before)];
        });
    }

    /**
     * Moves every list entered per document onto each of its entries, marked as carried over; idempotent — a row that
     * has an entry is left alone.
     *
     * @return array{documents: int, copied: int, unassigned: int}
     */
    public function carryOver(): array
    {
        $documents = DB::table('document_tyre_combinations')->whereNull('eg_number_norm')->distinct()->pluck('approval_document_id');
        $copied = 0;
        $unassigned = 0;

        foreach ($documents as $documentId) {
            $documentId = (int) $documentId;
            $entries = self::of($documentId);
            $rows = DB::table('document_tyre_combinations')->where('approval_document_id', $documentId)->whereNull('eg_number_norm')->orderBy('id')->get();

            if ($entries === []) {
                // No car of this document carries an EG number: the rows stay without one and match no car.
                $unassigned += $rows->count();

                continue;
            }

            DB::transaction(static function () use ($documentId, $entries, $rows, &$copied): void {
                // The rows themselves go to the first entry and keep their ids — the id an order line froze (D-335)
                // still names its row; every further entry gets a copy.
                $first = array_shift($entries);

                DB::table('document_tyre_combinations')
                    ->where('approval_document_id', $documentId)
                    ->whereNull('eg_number_norm')
                    ->update(['eg_number' => $first, 'eg_number_norm' => $first, 'carried_over' => true]);

                foreach ($entries as $entry) {
                    foreach ($rows as $row) {
                        $copy = (array) $row;
                        unset($copy['id']);

                        DB::table('document_tyre_combinations')->insert([
                            ...$copy,
                            'eg_number' => $entry,
                            'eg_number_norm' => $entry,
                            'carried_over' => true,
                        ]);
                        $copied++;
                    }
                }
            });
        }

        return ['documents' => $documents->count(), 'copied' => $copied, 'unassigned' => $unassigned];
    }
}
