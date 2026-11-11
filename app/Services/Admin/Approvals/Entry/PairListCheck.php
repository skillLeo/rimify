<?php

declare(strict_types=1);

namespace App\Services\Admin\Approvals\Entry;

use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreLine;
use App\Models\DocumentWheelCombination;
use App\Models\Vehicle;
use App\Support\TyreText;
use App\Support\VehicleName;

/**
 * Front/rear pairs are entered per car and wheel combination, and the shop holds them per car (his round of 08.11, §2; D-447):
 * `document_tyre_combinations` names the car, not the wheel combination, and the engine gives a car every pair of its list
 * whose two sizes its rows carry on their axles. Where two wheel combinations of one car have different diameters, a pair's
 * sizes already say which one it belongs to. Where they have the same diameters front and rear, they may not: a pair entered
 * for one of them is offered on the other too wherever that one's rows carry both its sizes.
 *
 * This asks what the engine would answer, cell by cell, and compares it with what was entered for that cell. A pair the cell
 * would get though nobody entered it there is a mix, and stops the release: selling it would be a wrong answer. The way out
 * is to enter it there too, or to take it out where it stands. Nothing is merged, and the verdict logic does not change.
 * Two cars no longer share anything: each answers from its own list, whatever its field K.
 *
 * @phpstan-type Conflict array{entryId: int, vehicleId: int, car: string, pair: string, combination: string, enteredAt: list<string>}
 */
final readonly class PairListCheck
{
    public function __construct(private DocumentEntryWriter $writer) {}

    /** @return array{conflicts: list<Conflict>} */
    public function of(EntryModel $model): array
    {
        $conflicts = [];

        if (! $model->hasList()) {
            return ['conflicts' => []];
        }

        $caps = DocumentEntryWriter::capsOf($model->document->id);
        /** @var array<int, list<string>> $keys car => the pairs of its list */
        $keys = [];

        foreach ($this->writer->listOf($model) as $row) {
            if ($row['vehicle_id'] !== null) {
                $keys[(int) $row['vehicle_id']][] = self::pairKey($row);
            }
        }

        /** @var array<int, array<int, array<string, true>>> $own car => wheel combination => the pairs entered */
        $own = [];
        /** @var array<int, string> $labels wheel combination => its label */
        $labels = [];

        foreach ($model->entries as $entry) {
            /** @var Vehicle|null $car */
            $car = $entry->vehicle;
            /** @var DocumentWheelCombination|null $combination */
            $combination = $entry->combination;
            $own[$entry->vehicle_id][$entry->document_wheel_combination_id] ??= [];
            $labels[$entry->document_wheel_combination_id] = $combination === null ? '' : EntryView::combinationLabel($combination);

            foreach ($entry->lines as $line) {
                if (EntryModel::twoSided($line) && EntryModel::stands($entry, $line) && ($line->in_list ?? true) && ($line->in_list !== null || DocumentEntryWriter::appliesTo($line, $car))) {
                    $own[$entry->vehicle_id][$entry->document_wheel_combination_id][self::lineKey($line)] = true;
                }
            }
        }

        foreach ($model->entries->groupBy('vehicle_id') as $vehicleId => $entries) {
            $vehicleId = (int) $vehicleId;

            if (! isset($keys[$vehicleId])) {
                continue;
            }

            /** @var DocumentCarEntry $first */
            $first = $entries->first();
            /** @var Vehicle|null $car */
            $car = $first->vehicle;
            [$front, $rear] = $this->axleSizes($entries->all(), $car, $caps);

            // Cell by cell: what the engine would answer for this front version with this rear one.
            foreach ($entries as $cell) {
                /** @var DocumentWheelCombination $combination */
                $combination = $cell->combination;

                foreach (array_unique($keys[$vehicleId]) as $pair) {
                    [$f, $r] = explode('|', $pair);

                    if (! isset($front[$combination->front_wheel_size_id][$f], $rear[$combination->rear_wheel_size_id][$r]) || isset($own[$vehicleId][$combination->id][$pair])) {
                        continue;
                    }

                    $at = [];

                    foreach ($own[$vehicleId] as $other => $pairs) {
                        if ($other !== $combination->id && isset($pairs[$pair])) {
                            $at[] = $labels[$other];
                        }
                    }

                    $conflicts[] = [
                        'entryId' => (int) $cell->id,
                        'vehicleId' => $vehicleId,
                        'car' => self::carName($car),
                        'pair' => self::pairLabel($f, $r),
                        'combination' => EntryView::combinationLabel($combination),
                        'enteredAt' => array_values(array_unique($at)),
                    ];
                }
            }
        }

        return ['conflicts' => $conflicts];
    }

    /**
     * What stops the release, in the release's own kind of sentence.
     *
     * @param  list<Conflict>  $conflicts
     * @return list<string>
     */
    public static function sentences(array $conflicts): array
    {
        return array_map(static function (array $c): string {
            $at = $c['enteredAt'] === [] ? 'der anderen Felgenkombination' : self::quoted($c['enteredAt']);

            return sprintf(
                'Bei %1$s steht die Reifenkombination %2$s nur bei %3$s, ihre Größen stehen aber auch bei „%4$s“. Beide Felgenkombinationen haben vorne und hinten dieselben Durchmesser. Weil der Shop Reifenkombinationen je Fahrzeug speichert, würde er sie auch bei „%4$s“ anbieten. Gilt sie auch dort, trag sie dort ein; sonst nimm sie bei %3$s heraus.',
                $c['car'],
                $c['pair'],
                $at,
                $c['combination'],
            );
        }, $conflicts);
    }

    /**
     * @param  list<string>  $labels
     */
    private static function quoted(array $labels): string
    {
        $quoted = array_map(static fn (string $label): string => '„'.$label.'“', $labels);
        $last = array_pop($quoted);

        return $quoted === [] ? (string) $last : implode(', ', $quoted).' und '.$last;
    }

    /**
     * The sizes a car's rows carry on each axle of each version, at its power, as the engine filters them
     * (FitmentResolver::axleRequirement).
     *
     * @param  array<int, DocumentCarEntry>  $entries
     * @param  array<string, int>  $caps
     * @return array{0: array<int, array<string, true>>, 1: array<int, array<string, true>>}
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

                /** @var DocumentWheelCombination $combination */
                $combination = $entry->combination;

                if ($entry->axle !== 'REAR' && $size['axle'] !== 'REAR') {
                    $front[$combination->front_wheel_size_id][$key] = true;
                }

                if ($entry->axle !== 'FRONT' && $size['axle'] !== 'FRONT') {
                    $rear[$combination->rear_wheel_size_id][$key] = true;
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
