<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Domain\Fitment\Tyres\CombinationEntry;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreLine;
use App\Models\Vehicle;
use App\Support\TyreText;
use App\Support\VehicleName;

/**
 * Front/rear pairs are entered per car, but the shop holds them per field K (D-358): `document_tyre_combinations` has no
 * column for a car, and the engine gives a car every pair of its K's list whose two sizes its row carries on their axles.
 * So two cars of one K can be entered differently, and the engine answer one list for both.
 *
 * This asks what the engine would answer, car by car, and compares it with what was entered for that car:
 *
 * - **a pair the car would get though nobody entered it for that car** is a conflict, and stops the release: selling it
 *   would be a wrong answer. The way out is to enter it on both cars or on neither. Nothing is merged, and the verdict
 *   logic does not change.
 * - **a car the list cannot reach** — a field K that is no EG number, or none, on a paper with a list — fails closed by
 *   itself (`TyrePairingTable::unmatched`: its tyres are „Noch nicht bestätigt“, no Komplettrad). Said, never a block.
 *
 * @phpstan-type Conflict array{vehicleId: int, car: string, k: string, pair: string, others: list<string>}
 * @phpstan-type Unreachable array{vehicleId: int, car: string, k: string|null}
 */
final readonly class PairListCheck
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /** @return array{conflicts: list<Conflict>, unreachable: list<Unreachable>} */
    public function of(EntryModel $model): array
    {
        $conflicts = [];
        $unreachable = [];

        if (! $model->hasList()) {
            return ['conflicts' => [], 'unreachable' => []];
        }

        $list = $this->writer->listOf($model);
        $caps = DocumentEntryWriter::capsOf($model->document->id);
        /** @var array<string, list<string>> $keys */
        $keys = [];

        foreach ($list as $row) {
            if (is_string($row['eg_number_norm'])) {
                $keys[$row['eg_number_norm']][] = self::pairKey($row);
            }
        }

        $own = [];
        $names = [];

        foreach ($model->entries as $entry) {
            /** @var Vehicle|null $car */
            $car = $entry->vehicle;
            $names[$entry->vehicle_id] = self::carName($car);
            $own[$entry->vehicle_id] ??= [];

            foreach ($entry->lines as $line) {
                if (EntryModel::twoSided($line) && ($line->in_list ?? true) && ($line->in_list !== null || DocumentEntryWriter::appliesTo($line, $car))) {
                    $own[$entry->vehicle_id][self::lineKey($line)] = true;
                }
            }
        }

        // Which entry of the list each car answers from: only cars of one entry share a list.
        $entryOf = [];

        foreach ($model->entries->groupBy('vehicle_id') as $vehicleId => $entries) {
            /** @var DocumentCarEntry $first */
            $first = $entries->first();
            /** @var Vehicle|null $car */
            $car = $first->vehicle;
            $k = $car?->getAttribute('eg_nummer_norm');
            $entryOf[(int) $vehicleId] = CombinationEntry::for(is_string($k) && $k !== '' ? $k : null, $keys);
        }

        foreach ($model->entries->groupBy('vehicle_id') as $vehicleId => $entries) {
            /** @var DocumentCarEntry $first */
            $first = $entries->first();
            /** @var Vehicle|null $car */
            $car = $first->vehicle;
            $k = $car?->getAttribute('eg_nummer_norm');
            $k = is_string($k) && $k !== '' ? $k : null;
            $entry = CombinationEntry::for($k, $keys);

            if ($entry === null) {
                $unreachable[] = ['vehicleId' => (int) $vehicleId, 'car' => $names[$vehicleId], 'k' => $k];

                continue;
            }

            [$front, $rear] = $this->axleSizes($entries->all(), $car, $caps);

            foreach (array_unique($keys[$entry]) as $pair) {
                [$f, $r] = explode('|', $pair);

                if (isset($front[$f], $rear[$r]) && ! isset($own[$vehicleId][$pair])) {
                    $others = [];

                    foreach ($own as $otherId => $pairs) {
                        if ($otherId !== (int) $vehicleId && isset($pairs[$pair]) && $entryOf[$otherId] === $entry) {
                            $others[] = $names[$otherId];
                        }
                    }

                    $conflicts[] = ['vehicleId' => (int) $vehicleId, 'car' => $names[$vehicleId], 'k' => (string) $k, 'pair' => self::pairLabel($f, $r), 'others' => array_values(array_unique($others))];
                }
            }
        }

        return ['conflicts' => $conflicts, 'unreachable' => $unreachable];
    }

    /**
     * What stops the release, in the release's own kind of sentence.
     *
     * @param  list<Conflict>  $conflicts
     * @return list<string>
     */
    public static function sentences(array $conflicts): array
    {
        return array_map(static fn (array $c): string => sprintf(
            '%s hat dieselbe Betriebserlaubnis (%s) wie %s, aber nicht die Kombination %s. Der Shop speichert Kombinationen je Betriebserlaubnis: Trag sie bei allen betroffenen Fahrzeugen ein oder bei keinem.',
            $c['car'],
            $c['k'],
            $c['others'] === [] ? 'ein anderes Fahrzeug' : implode(', ', $c['others']),
            $c['pair'],
        ), $conflicts);
    }

    /**
     * The sizes a car's rows carry on each axle, at its power, as the engine filters them (FitmentResolver::axleRequirement).
     *
     * @param  array<int, DocumentCarEntry>  $entries
     * @param  array<string, int>  $caps
     * @return array{0: array<string, true>, 1: array<string, true>}
     */
    private function axleSizes(array $entries, ?Vehicle $car, array $caps): array
    {
        $power = $car?->getAttribute('power_kw');
        $front = [];
        $rear = [];

        foreach ($entries as $entry) {
            foreach ($this->writer->sizesOf($entry, $caps) as $size) {
                if ($power !== null && (($size['kw_min'] !== null && (int) $power < $size['kw_min']) || ($size['kw_max'] !== null && (int) $power > $size['kw_max']))) {
                    continue;
                }

                $key = self::sizeKey($size['width_mm'], $size['aspect'], $size['diameter_in']);

                if ($entry->axle !== 'REAR' && $size['axle'] !== 'REAR') {
                    $front[$key] = true;
                }

                if ($entry->axle !== 'FRONT' && $size['axle'] !== 'FRONT') {
                    $rear[$key] = true;
                }
            }
        }

        return [$front, $rear];
    }

    private static function sizeKey(int $width, int $aspect, float $diameter): string
    {
        return $width.'/'.$aspect.'/'.number_format($diameter, 1, '.', '');
    }

    /** @param array<string, mixed> $row */
    private static function pairKey(array $row): string
    {
        return self::sizeKey((int) $row['front_width_mm'], (int) $row['front_aspect'], (float) $row['front_diameter_in']).'|'.self::sizeKey((int) $row['rear_width_mm'], (int) $row['rear_aspect'], (float) $row['rear_diameter_in']);
    }

    private static function lineKey(DocumentTyreLine $line): string
    {
        return self::sizeKey((int) $line->front_width_mm, (int) $line->front_aspect, (float) $line->front_diameter_in).'|'.self::sizeKey((int) $line->rear_width_mm, (int) $line->rear_aspect, (float) $line->rear_diameter_in);
    }

    private static function pairLabel(string $front, string $rear): string
    {
        $label = static function (string $key): string {
            [$width, $aspect, $diameter] = explode('/', $key);

            return TyreText::label(['width' => (int) $width, 'aspect' => (int) $aspect, 'diameter' => (float) $diameter, 'li' => null, 'si' => null, 'marker' => null]);
        };

        return $label($front).' vorne mit '.$label($rear).' hinten';
    }

    private static function carName(?Vehicle $car): string
    {
        return $car === null ? 'Fahrzeug' : VehicleName::from($car);
    }
}
