<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Models\DocumentCarEntry;
use App\Models\Vehicle;
use Illuminate\Support\Facades\DB;

/**
 * „Allgemeine Codes dieses Fahrzeugs“ — what a Gutachten says of the car as a whole — once per car and paper (the client's review of
 * 11.11, B; D-452), not per wheel combination: every combination of that car carries them. A car is its HSN/TSN: two cars of the
 * paper with the same key numbers share the value. One that has none yet (taken from a Gutachten, D-297) is itself. Never across
 * papers: another Gutachten says its own (the operator's default, asked in the report).
 *
 * @phpstan-type CarCode array{code: string, note: string|null}
 */
final class CarCodes
{
    /** @var array<int, array<string, list<CarCode>>> paper => car => its codes, read once per request */
    private static array $read = [];

    /** The car a set belongs to: `0005/683`, or `#152` for a car without key numbers. */
    public static function keyOf(?Vehicle $car, int $vehicleId): string
    {
        $hsn = $car?->getAttribute('hsn');
        $tsn = $car?->getAttribute('tsn');

        return is_string($hsn) && $hsn !== '' && is_string($tsn) && $tsn !== '' ? $hsn.'/'.mb_strtoupper($tsn) : '#'.$vehicleId;
    }

    public static function keyOfEntry(DocumentCarEntry $entry): string
    {
        /** @var Vehicle|null $car */
        $car = $entry->vehicle;

        return self::keyOf($car, (int) $entry->vehicle_id);
    }

    /**
     * Every car's set of a paper, in the order they were typed.
     *
     * @return array<string, list<CarCode>> car => its codes
     */
    public static function forDocument(int $documentId): array
    {
        if (isset(self::$read[$documentId])) {
            return self::$read[$documentId];
        }

        $out = [];

        foreach (DB::table('document_vehicle_codes')->where('approval_document_id', $documentId)->orderBy('id')->get() as $row) {
            $out[(string) $row->car_key][] = ['code' => (string) $row->code, 'note' => $row->note_de === null ? null : (string) $row->note_de];
        }

        return self::$read[$documentId] = $out;
    }

    /** What was read is read again: after a write, and between two tests. */
    public static function forget(): void
    {
        self::$read = [];
    }

    /** @return list<CarCode> */
    public static function of(DocumentCarEntry $entry): array
    {
        return self::forDocument((int) $entry->approval_document_id)[self::keyOfEntry($entry)] ?? [];
    }

    /**
     * The car's set, replaced: what it holds now is what every combination of the car says.
     *
     * @param  list<CarCode>  $codes
     */
    public static function put(DocumentCarEntry $entry, array $codes): void
    {
        $key = self::keyOfEntry($entry);
        /** @var Vehicle|null $car */
        $car = $entry->vehicle;
        $now = now();
        self::forget();

        DB::table('document_vehicle_codes')->where('approval_document_id', $entry->approval_document_id)->where('car_key', $key)->delete();

        foreach (self::unique($codes) as $code) {
            DB::table('document_vehicle_codes')->insert([
                'approval_document_id' => $entry->approval_document_id,
                'car_key' => $key,
                'hsn' => str_starts_with($key, '#') ? null : $car?->getAttribute('hsn'),
                'tsn' => str_starts_with($key, '#') ? null : $car?->getAttribute('tsn'),
                'vehicle_id' => str_starts_with($key, '#') ? (int) $entry->vehicle_id : null,
                'code' => $code['code'],
                'note_de' => $code['note'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    /**
     * The cells of the paper that share this car's set: its own combinations, and those of every car with its key numbers.
     *
     * @return list<DocumentCarEntry>
     */
    public static function cellsSharing(DocumentCarEntry $entry): array
    {
        $key = self::keyOfEntry($entry);

        return DocumentCarEntry::query()->with('vehicle:id,hsn,tsn')->where('approval_document_id', $entry->approval_document_id)->orderBy('id')->get()
            ->filter(static fn (DocumentCarEntry $other): bool => self::keyOfEntry($other) === $key)->values()->all();
    }

    /**
     * The cars whose rows a change of this set reaches.
     *
     * @return list<int>
     */
    public static function vehiclesSharing(DocumentCarEntry $entry): array
    {
        return array_values(array_unique(array_map(static fn (DocumentCarEntry $cell): int => (int) $cell->vehicle_id, self::cellsSharing($entry))));
    }

    /**
     * One entry per code, the first note it came with — and a second note for the same code joined to it, never dropped.
     *
     * @param  list<CarCode>  $codes
     * @return list<CarCode>
     */
    public static function unique(array $codes): array
    {
        $out = [];

        foreach ($codes as $code) {
            $note = $code['note'] === null || trim($code['note']) === '' ? null : trim($code['note']);

            if (! isset($out[$code['code']])) {
                $out[$code['code']] = ['code' => $code['code'], 'note' => $note];
            } elseif ($note !== null && $out[$code['code']]['note'] !== $note && ! str_contains((string) $out[$code['code']]['note'], $note)) {
                $out[$code['code']]['note'] = $out[$code['code']]['note'] === null ? $note : $out[$code['code']]['note'].' · '.$note;
            }
        }

        return array_values($out);
    }
}
