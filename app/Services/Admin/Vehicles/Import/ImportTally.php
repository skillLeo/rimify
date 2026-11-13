<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles\Import;

use App\Services\Admin\Vehicles\DatasetVehicle;
use App\Services\Admin\Vehicles\VehicleImporter;
use App\Support\GermanFormat;

/**
 * What a Probelauf counts over every row of a file, a row at a time (D-462): the gaps a purchase of the full dataset is
 * decided on (D-317) and what reads but cannot be (D-318). It holds counts and the first rows of each finding — never
 * the rows themselves —, and its state is plain data, so a file read in parts is counted once, whole.
 *
 * The wording is VehicleImporter's; checks() returns what VehicleImporter::implausible() always returned.
 */
final class ImportTally
{
    /** The rows shown under a check: enough to see what was read. */
    private const EXAMPLES = 3;

    /**
     * @param  array{rows: int, gaps: array<string, int>, range: array{count: int, checked: int, examples: list<string>}, same: array{pairs: int, differ: bool, examples: list<string>}, sum: array{count: int, checked: int, examples: list<string>}, speed: array{count: int, checked: int, examples: list<string>}}  $state
     */
    private function __construct(private array $state) {}

    public static function start(): self
    {
        $none = ['count' => 0, 'checked' => 0, 'examples' => []];

        return new self([
            'rows' => 0,
            'gaps' => array_fill_keys(array_keys(VehicleImporter::GAPS), 0),
            'range' => $none,
            'same' => ['pairs' => 0, 'differ' => false, 'examples' => []],
            'sum' => $none,
            'speed' => $none,
        ]);
    }

    /** @param  array<string, mixed>|null  $state */
    public static function from(?array $state): self
    {
        if (! is_array($state) || ! isset($state['rows'], $state['gaps'], $state['range'], $state['same'], $state['sum'], $state['speed'])) {
            return self::start();
        }

        /** @var array{rows: int, gaps: array<string, int>, range: array{count: int, checked: int, examples: list<string>}, same: array{pairs: int, differ: bool, examples: list<string>}, sum: array{count: int, checked: int, examples: list<string>}, speed: array{count: int, checked: int, examples: list<string>}} $state */
        return new self($state);
    }

    /** @return array<string, mixed> */
    public function state(): array
    {
        return $this->state;
    }

    /**
     * One row of the file: the contract fields as typed, and `_line`.
     *
     * @param  array<string, string>  $row
     * @param  int  $index  the row's place among the file's rows, from 0 — names a row that carries no line
     */
    public function add(array $row, int $index, ?DatasetVehicle $car = null): void
    {
        $car ??= DatasetVehicle::fromRow($row);
        $line = 'Zeile '.($row['_line'] ?? (string) ($index + 2));
        $bands = VehicleImporter::bands();
        $front = DatasetVehicle::whole($row['achslast_vorn_kg'] ?? null);
        $rear = DatasetVehicle::whole($row['achslast_hinten_kg'] ?? null);
        $speed = DatasetVehicle::whole($row['hoechstgeschwindigkeit_kmh'] ?? null);
        $mass = DatasetVehicle::whole($row['gesamtmasse_kg'] ?? null);

        $this->state['rows']++;
        // Missing is blank or no number; a number outside its band is the third state, implausible.
        $this->state['gaps']['without_speed'] += $speed === null ? 1 : 0;
        $this->state['gaps']['without_axle'] += $front === null || $rear === null ? 1 : 0;
        $this->state['gaps']['without_keys'] += $car->hsn === null || $car->tsn === null ? 1 : 0;
        $this->state['gaps']['without_eg'] += $car->egNumber === null ? 1 : 0;

        // Each axle load on its own against what an axle load can be.
        $odd = [];
        $read = 0;

        foreach (['8.1' => $front, '8.2' => $rear] as $number => $value) {
            if ($value === null) {
                continue;
            }

            $read++;

            if (! VehicleImporter::inBand($value, $bands['achslast_vorn_kg'])) {
                $odd[] = VehicleImporter::figure($value, 'kg').' ('.$number.')';
            }
        }

        $this->state['range']['checked'] += $read > 0 ? 1 : 0;

        if ($odd !== []) {
            $this->found('range', $line.': Gelesen: '.implode(', ', $odd));
        }

        // 8.1 equal to 8.2 in every row: two columns read as one, or the same column mapped twice.
        if ($front !== null && $rear !== null) {
            $this->state['same']['pairs']++;
            $this->state['same']['differ'] = $this->state['same']['differ'] || $front !== $rear;

            if (count($this->state['same']['examples']) < self::EXAMPLES) {
                $this->state['same']['examples'][] = $line.': Gelesen: '.VehicleImporter::figure($front, 'kg').' und '.VehicleImporter::figure($rear, 'kg');
            }
        }

        // 8.1 plus 8.2 against the car's own total mass, where both axle loads are believable and the mass is read.
        if ($front !== null && $rear !== null && $mass !== null && $mass !== 0
            && VehicleImporter::inBand($front, $bands['achslast_vorn_kg']) && VehicleImporter::inBand($rear, $bands['achslast_hinten_kg'])) {
            $this->state['sum']['checked']++;
            $percent = ($front + $rear) / $mass * 100;

            if ($percent < VehicleImporter::SUM_MIN_PERCENT || $percent > VehicleImporter::SUM_MAX_PERCENT) {
                $this->found('sum', $line.': Gelesen: '.VehicleImporter::figure($front, 'kg').' + '.VehicleImporter::figure($rear, 'kg').' = '.VehicleImporter::figure($front + $rear, 'kg')
                    // One decimal: a flagged 140,4 % must never read as the 140 % the band allows.
                    .' bei '.VehicleImporter::figure($mass, 'kg').' Gesamtmasse ('.GermanFormat::percent($percent, false).')');
            }
        }

        // The top speed against the band the customer's papers form holds it to.
        if ($speed !== null) {
            $this->state['speed']['checked']++;

            if (! VehicleImporter::inBand($speed, $bands['hoechstgeschwindigkeit_kmh'])) {
                $this->found('speed', $line.': Gelesen: '.VehicleImporter::figure($speed, 'km/h'));
            }
        }
    }

    public function rows(): int
    {
        return $this->state['rows'];
    }

    /** @return array<string, int> */
    public function gaps(): array
    {
        return $this->state['gaps'];
    }

    /**
     * The checks as the Probelauf shows them (VehicleImporter::implausible()): each says what was read and what was
     * expected, with up to three rows, never what the file contains; a check that could run on no row says so.
     *
     * @param  array<string, string>  $mapping  field → header
     * @param  list<string>  $headers
     * @return list<array{key: string, label: string, expected: string, count: int|null, checked: int, examples: list<string>, unmapped: string|null, unchecked: string|null}>
     */
    public function checks(array $mapping, array $headers): array
    {
        if ($this->state['rows'] === 0) {
            return [];
        }

        $bands = VehicleImporter::bands();
        $axles = ['achslast_vorn_kg' => '8.1', 'achslast_hinten_kg' => '8.2'];
        $range = $this->state['range'];
        $same = $this->state['same'];
        $sum = $this->state['sum'];
        $speed = $this->state['speed'];
        $alike = $same['pairs'] >= VehicleImporter::SAME_MIN_ROWS && ! $same['differ'];
        $column = $mapping['achslast_vorn_kg'] ?? null;
        $sameColumn = $column !== null && $column === ($mapping['achslast_hinten_kg'] ?? null);

        return [
            VehicleImporter::check(
                'axle_range',
                'Achslast vorn oder hinten (8.1 oder 8.2)',
                VehicleImporter::expected($bands['achslast_vorn_kg']).'.',
                VehicleImporter::unmapped($axles, $mapping, $headers),
                $range['count'],
                $range['checked'],
                $range['examples'],
                // Over no row, „in keiner Zeile“ would be a pass nobody checked (docs/dev/TEST-SMELLS.md, 2).
                $range['checked'] === 0 ? 'Nicht geprüft: keine Zeile, in der eine Achslast gelesen wurde.' : null,
            ),
            VehicleImporter::check(
                'axle_same',
                'Achslast vorn gleich hinten (8.1 = 8.2) in jeder geprüften Zeile',
                'Erwartet: mindestens eine Zeile mit verschiedenen Werten vorn und hinten.',
                VehicleImporter::unmapped($axles, $mapping, $headers),
                $alike ? $same['pairs'] : 0,
                $same['pairs'],
                $alike ? [
                    ...($sameColumn ? ['Die Spalte „'.$column.'“ ist sowohl 8.1 als auch 8.2 zugeordnet.'] : []),
                    ...$same['examples'],
                ] : [],
                $same['pairs'] < VehicleImporter::SAME_MIN_ROWS ? 'Nicht geprüft: Dafür sind mindestens '.VehicleImporter::SAME_MIN_ROWS.' Zeilen nötig, in denen beide Achslasten gelesen wurden.' : null,
            ),
            VehicleImporter::check(
                'axle_sum',
                'Achslast vorn plus hinten (8.1 + 8.2) im Verhältnis zur zulässigen Gesamtmasse (F.2)',
                'Erwartet: '.VehicleImporter::SUM_MIN_PERCENT.' bis '.GermanFormat::percent(VehicleImporter::SUM_MAX_PERCENT, false).' der zulässigen Gesamtmasse.',
                VehicleImporter::unmapped([...$axles, 'gesamtmasse_kg' => 'F.2'], $mapping, $headers),
                $sum['count'],
                $sum['checked'],
                $sum['examples'],
                $sum['checked'] === 0 ? 'Nicht geprüft: keine Zeile, in der eine Gesamtmasse gelesen wurde und beide Achslasten im erwarteten Bereich liegen.' : null,
            ),
            VehicleImporter::check(
                'speed_range',
                'Höchstgeschwindigkeit (T)',
                VehicleImporter::expected($bands['hoechstgeschwindigkeit_kmh']).'.',
                VehicleImporter::unmapped(['hoechstgeschwindigkeit_kmh' => 'T'], $mapping, $headers),
                $speed['count'],
                $speed['checked'],
                $speed['examples'],
                $speed['checked'] === 0 ? 'Nicht geprüft: keine Zeile, in der eine Höchstgeschwindigkeit gelesen wurde.' : null,
            ),
        ];
    }

    private function found(string $check, string $example): void
    {
        $this->state[$check]['count']++;

        if (count($this->state[$check]['examples']) < self::EXAMPLES) {
            $this->state[$check]['examples'][] = $example;
        }
    }
}
