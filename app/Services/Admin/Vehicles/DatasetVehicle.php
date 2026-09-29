<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles;

use App\Enums\VehicleSource;
use App\Models\Vehicle;
use DateTimeImmutable;

/**
 * One car as a bought vehicle dataset names it (BLOCKED.md #16), in the columns the merge reads — the
 * contract the dataset's import maps its own columns onto. A figure that cannot be read is null, never a
 * guess (R-03): an unreadable axle load fills nothing.
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
    ) {}

    /**
     * A row with the contract's German column names: quelle, fahrzeug_id, hsn, tsn, hersteller, handelsname,
     * variante, fahrzeugtyp, eg_nummer, baubeginn, bauende, achslast_vorn_kg, achslast_hinten_kg,
     * hoechstgeschwindigkeit_kmh, leistung_kw.
     *
     * @param  array<string, string|null>  $row
     */
    public static function fromRow(array $row): self
    {
        $text = static fn (string $key): ?string => ($v = trim((string) ($row[$key] ?? ''))) === '' ? null : $v;
        $number = static fn (string $key, int $min, int $max): ?int => ($v = $text($key)) !== null && preg_match('/^\d+$/', $v) === 1 && (int) $v >= $min && (int) $v <= $max ? (int) $v : null;
        $month = static function (string $key) use ($text): ?DateTimeImmutable {
            $v = $text($key);

            if ($v === null || preg_match('/^(\d{4})-(\d{2})(?:-(\d{2}))?$/', $v, $m) !== 1 || ! checkdate((int) $m[2], (int) ($m[3] ?? 1), (int) $m[1])) {
                return null;
            }

            return new DateTimeImmutable(sprintf('%s-%s-%s', $m[1], $m[2], $m[3] ?? '01'));
        };
        $hsn = $text('hsn');
        $tsn = $text('tsn');
        $keysValid = $hsn !== null && $tsn !== null && preg_match('/^\d{1,4}$/', $hsn) === 1 && preg_match('/^[0-9A-Z]{3}$/i', $tsn) === 1;

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
            egNumber: $text('eg_nummer'),
            buildFrom: $month('baubeginn'),
            buildTo: $month('bauende'),
            axleLoadFrontKg: $number('achslast_vorn_kg', 300, 4000),
            axleLoadRearKg: $number('achslast_hinten_kg', 300, 4000),
            maxSpeedKmh: $number('hoechstgeschwindigkeit_kmh', 60, 420),
            powerKw: $number('leistung_kw', 10, 1000),
        );
    }

    public function egNormalised(): ?string
    {
        return Vehicle::normaliseEcNumber($this->egNumber);
    }

    /** `BMW 420i (3C)` — for the dry run's table. */
    public function label(): string
    {
        return trim($this->make.' '.$this->variant).($this->typeDesignation === null ? '' : ' ('.$this->typeDesignation.')');
    }
}
