<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles;

use App\Enums\VehicleSource;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\DocumentConditions;
use App\Support\EgNumber;
use DateTimeImmutable;

/**
 * One car as a vehicle dataset names it (BLOCKED.md #16), in the columns the merge and the import read — the contract
 * a file's own columns are mapped onto (VehicleImporter::FIELDS). A figure that cannot be read is null, never a guess
 * (R-03): an unreadable axle load fills nothing, and the import says which it could not read.
 */
final readonly class DatasetVehicle
{
    public function __construct(
        public VehicleSource $source,
        public ?int $sourceVehicleId,
        public ?string $hsn,
        public ?string $tsn,
        public string $make,
        public string $model,
        public string $variant,
        public ?string $typeDesignation,
        public ?string $egNumber,
        public ?DateTimeImmutable $buildFrom,
        public ?DateTimeImmutable $buildTo,
        public ?int $axleLoadFrontKg,
        public ?int $axleLoadRearKg,
        public ?int $maxSpeedKmh,
        public ?int $powerKw,
        public ?string $bodyForm = null,
        public ?string $driveAxle = null,
    ) {}

    /**
     * A row with the contract's German column names: quelle, fahrzeug_id, hsn, tsn, hersteller, handelsname,
     * variante, fahrzeugtyp, eg_nummer, baubeginn, bauende, achslast_vorn_kg, achslast_hinten_kg,
     * hoechstgeschwindigkeit_kmh, leistung_kw, karosserie, antrieb.
     *
     * Dates as a dataset or a German spreadsheet writes them: `2015-03`, `2015-03-01`, `03.2015`, `03/2015`,
     * `01.03.2015`. A build end given as a month ends on that month's last day — the last month built is built whole
     * (R-02). Figures may carry a German thousands dot: `1.050`.
     *
     * @param  array<string, string|null>  $row
     */
    public static function fromRow(array $row): self
    {
        $text = static fn (string $key): ?string => ($v = trim((string) ($row[$key] ?? ''))) === '' ? null : $v;
        $number = static function (string $key, int $min, int $max) use ($text): ?int {
            $v = $text($key);

            if ($v === null) {
                return null;
            }

            $v = preg_match('/^\d{1,3}(?:[.\s\x{00A0}\x{202F}]\d{3})+$/u', $v) === 1 ? (string) preg_replace('/\D/', '', $v) : $v;

            return preg_match('/^\d+$/', $v) === 1 && (int) $v >= $min && (int) $v <= $max ? (int) $v : null;
        };
        $date = static function (string $key, bool $end) use ($text): ?DateTimeImmutable {
            $v = $text($key);

            if ($v === null) {
                return null;
            }

            [$year, $month, $day] = match (true) {
                preg_match('/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/', $v, $m) === 1 => [(int) $m[1], (int) $m[2], isset($m[3]) ? (int) $m[3] : null],
                preg_match('/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/', $v, $m) === 1 => [(int) $m[3], (int) $m[2], (int) $m[1]],
                preg_match('/^(\d{1,2})[.\/](\d{4})$/', $v, $m) === 1 => [(int) $m[2], (int) $m[1], null],
                default => [0, 0, null],
            };

            if ($year < 1900 || $year > 2100 || ! checkdate($month, $day ?? 1, $year)) {
                return null;
            }

            $first = new DateTimeImmutable(sprintf('%04d-%02d-%02d', $year, $month, $day ?? 1));

            return $day === null && $end ? $first->modify('last day of this month') : $first;
        };
        $listed = static function (string $key, array $list) use ($text): ?string {
            $v = $text($key);

            foreach ($list as $entry) {
                if ($v !== null && mb_strtolower($entry) === mb_strtolower($v)) {
                    return $entry;
                }
            }

            return null;
        };
        $hsn = $text('hsn');
        $tsn = $text('tsn');
        $keysValid = $hsn !== null && $tsn !== null && preg_match('/^\d{1,4}$/', $hsn) === 1 && preg_match('/^[0-9A-Z]{3}$/i', $tsn) === 1;
        $eg = $text('eg_nummer');

        return new self(
            source: VehicleSource::tryFrom((string) $text('quelle')) ?? VehicleSource::ImportKba,
            sourceVehicleId: $number('fahrzeug_id', 1, 4_294_967_295),
            // Both or neither: a half pair names no car.
            hsn: $keysValid ? str_pad((string) $hsn, 4, '0', STR_PAD_LEFT) : null,
            tsn: $keysValid ? mb_strtoupper((string) $tsn) : null,
            make: (string) $text('hersteller'),
            model: (string) $text('handelsname'),
            variant: (string) ($text('variante') ?? $text('handelsname')),
            typeDesignation: $text('fahrzeugtyp'),
            // Kept only where it reads as one, and fits the columns that hold it: an EG number that does not is no key to a
            // Gutachten.
            egNumber: $eg !== null && EgNumber::parse($eg) !== null && mb_strlen($eg) <= 255 && mb_strlen((string) Vehicle::normaliseEcNumber($eg)) <= 64 ? $eg : null,
            buildFrom: $date('baubeginn', false),
            buildTo: $date('bauende', true),
            axleLoadFrontKg: $number('achslast_vorn_kg', 300, 4000),
            axleLoadRearKg: $number('achslast_hinten_kg', 300, 4000),
            maxSpeedKmh: $number('hoechstgeschwindigkeit_kmh', 60, 420),
            powerKw: $number('leistung_kw', 10, 1000),
            bodyForm: $listed('karosserie', DocumentConditions::BODY_FORMS),
            driveAxle: $listed('antrieb', array_values(array_diff(DocumentConditions::DRIVES, ['Allradlenkung']))),
        );
    }

    public function egNormalised(): ?string
    {
        return Vehicle::normaliseEcNumber($this->egNumber);
    }

    /** `BMW 420i (3C)` — for the dry run's table. */
    public function label(): string
    {
        // Maker, model and variant, as the car is named everywhere else (VehicleName): a variant alone is not a car.
        return trim(preg_replace('/\s+/', ' ', $this->make.' '.$this->model.' '.$this->variant) ?? '').($this->typeDesignation === null ? '' : ' ('.$this->typeDesignation.')');
    }
}
