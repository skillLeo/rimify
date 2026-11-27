<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles;

use App\Domain\Fitment\Data\PapersFigures;
use App\Domain\Fitment\Support\BuildPeriod;
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
    /**
     * What a permitted axle load (8.1, 8.2) can physically be for a car (the operator's brief of 20.10.2026, D-318): a
     * whole number outside it is read but not believed — stored as nothing, and shown in the Probelauf as implausible
     * with what was read. Most often it means the wrong column is mapped.
     */
    public const AXLE_MIN_KG = 400;

    public const AXLE_MAX_KG = 2500;

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
        /** Field K where it is no EG number: the national ABE number („C640*“), information only (D-502). */
        public ?string $abeNumber,
        /** The certain window's start (D-516): the start's own day where the file gives one, else BuildPeriod::certainFrom(). */
        public ?DateTimeImmutable $buildFrom,
        /** The certain window's end: the end's own day where the file gives one, else BuildPeriod::certainTo(). Null: still built. */
        public ?DateTimeImmutable $buildTo,
        public ?int $axleLoadFrontKg,
        public ?int $axleLoadRearKg,
        public ?int $maxSpeedKmh,
        public ?int $powerKw,
        public ?string $bodyForm = null,
        public ?string $driveAxle = null,
        /** The period as the file states it (D-516): a month the file leaves empty stays null. */
        public ?int $buildFromYear = null,
        public ?int $buildFromMonth = null,
        public ?int $buildToYear = null,
        public ?int $buildToMonth = null,
        /** The VSN as the file writes it, its own column — no longer in brackets behind the name (D-517). */
        public ?string $vsn = null,
        /** The dataset's own form name, as written („Wohnmobil“) — the selector's grouping, never a verdict's (D-519). */
        public ?string $bodyFormRaw = null,
    ) {}

    /**
     * One end of the build period as a file writes it — a year and a month column (his list, D-478), or one date column
     * („2015“, „03.2015“, „03/2015“, „2015-03“, „01.03.2015“, „2015-03-01“) — read as year, month and day, each null where
     * the file does not give it. `ok` is false where something was given that does not read.
     *
     * @return array{year: int|null, month: int|null, day: int|null, ok: bool}
     */
    public static function datePart(string $date, string $year, string $month): array
    {
        $date = trim($date);
        $year = trim($year);
        $month = trim($month);
        $none = ['year' => null, 'month' => null, 'day' => null, 'ok' => true];
        $bad = ['year' => null, 'month' => null, 'day' => null, 'ok' => false];
        $readYear = static fn (string $v): ?int => preg_match('/^\d{4}$/', $v) === 1 && (int) $v >= 1900 && (int) $v <= 2100 ? (int) $v : null;
        $readMonth = static fn (string $v): ?int => preg_match('/^\d{1,2}$/', $v) === 1 && (int) $v >= 1 && (int) $v <= 12 ? (int) $v : null;

        if ($year !== '' || $month !== '') {
            $y = $year === '' ? null : $readYear($year);
            $m = $month === '' ? null : $readMonth($month);

            // A year that does not read, or a month that does not, is said; a month without a year is the importer's to refuse.
            return ['year' => $y, 'month' => $m, 'day' => null, 'ok' => ($year === '' || $y !== null) && ($month === '' || $m !== null)];
        }

        if ($date === '') {
            return $none;
        }

        [$y, $m, $d] = match (true) {
            preg_match('/^(\d{4})$/', $date, $x) === 1 => [(int) $x[1], null, null],
            preg_match('/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/', $date, $x) === 1 => [(int) $x[1], (int) $x[2], isset($x[3]) ? (int) $x[3] : null],
            preg_match('/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/', $date, $x) === 1 => [(int) $x[3], (int) $x[2], (int) $x[1]],
            preg_match('/^(\d{1,2})[.\/](\d{4})$/', $date, $x) === 1 => [(int) $x[2], (int) $x[1], null],
            default => [0, 0, null],
        };

        if ($y < 1900 || $y > 2100 || ($m !== null && ! checkdate($m, $d ?? 1, $y))) {
            return $bad;
        }

        return ['year' => $y, 'month' => $m, 'day' => $d, 'ok' => true];
    }

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
        $number = static function (string $key, int $min, int $max) use ($row): ?int {
            $v = self::whole($row[$key] ?? null);

            return $v !== null && $v >= $min && $v <= $max ? $v : null;
        };
        $listed = static function (string $key, array $list, array $synonyms = []) use ($text): ?string {
            $v = $text($key);
            $v = $v === null ? null : ($synonyms[mb_strtolower($v)] ?? $v);

            foreach ($list as $entry) {
                if ($v !== null && mb_strtolower($entry) === mb_strtolower($v)) {
                    return $entry;
                }
            }

            return null;
        };
        $from = self::datePart((string) ($row['baubeginn'] ?? ''), (string) ($row['bauvon_jahr'] ?? ''), (string) ($row['bauvon_monat'] ?? ''));
        $to = self::datePart((string) ($row['bauende'] ?? ''), (string) ($row['bauende_jahr'] ?? ''), (string) ($row['bauende_monat'] ?? ''));
        // A month without its year is no period at all: the importer refuses such a row; here it is simply unread.
        $period = new BuildPeriod($from['year'], $from['year'] === null ? null : $from['month'], $to['year'], $to['year'] === null ? null : $to['month']);
        $vsn = $text('vsn');
        $hsn = $text('hsn');
        $tsn = $text('tsn');
        // A TSN is three characters, always; a spreadsheet saving the list drops the leading zeros of `040` (the client's
        // runs #35 and #36, 25.11.2026: 1.162 rows refused). Digits only and shorter: the zeros it lost are put back (D-518).
        if ($tsn !== null && preg_match('/^\d{1,2}$/', $tsn) === 1) {
            $tsn = str_pad($tsn, 3, '0', STR_PAD_LEFT);
        }
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
            // Field K as the file writes it, whatever its form (D-520, the client's question of 26.11.2026): only trimmed. Its
            // normalised copy (eg_nummer_norm) is for matching only, and only an EG number in the EU form ever matches a
            // Gutachten (EgNumber::parse) — an old national number („G731*“) is kept and simply matches nothing. Only what
            // the columns cannot hold is left out, and the row says so (unread()).
            egNumber: $eg !== null && mb_strlen($eg) <= 255 && mb_strlen((string) Vehicle::normaliseEcNumber($eg)) <= 64 ? $eg : null,
            // Not an EG number, but what field K holds for an older car: kept as read, never a key to a Gutachten (D-502).
            abeNumber: $eg !== null && EgNumber::parse($eg) === null && mb_strlen($eg) <= 64 ? $eg : null,
            buildFrom: $from['day'] !== null && $from['year'] !== null && $from['month'] !== null
                ? new DateTimeImmutable(sprintf('%04d-%02d-%02d', $from['year'], $from['month'], $from['day']))
                : $period->certainFrom(),
            buildTo: $to['day'] !== null && $to['year'] !== null && $to['month'] !== null
                ? new DateTimeImmutable(sprintf('%04d-%02d-%02d', $to['year'], $to['month'], $to['day']))
                : $period->certainTo(),
            axleLoadFrontKg: $number('achslast_vorn_kg', self::AXLE_MIN_KG, self::AXLE_MAX_KG),
            axleLoadRearKg: $number('achslast_hinten_kg', self::AXLE_MIN_KG, self::AXLE_MAX_KG),
            // The band the customer's own papers form holds T to — one band for the top speed, never a second.
            maxSpeedKmh: $number('hoechstgeschwindigkeit_kmh', PapersFigures::SPEED_MIN_KMH, PapersFigures::SPEED_MAX_KMH),
            powerKw: $number('leistung_kw', 10, 1000),
            bodyForm: $listed('karosserie', DocumentConditions::BODY_FORMS),
            // His dataset writes the drive as Allrad-, Front- or Heckantrieb (D-478): the same three axles.
            driveAxle: $listed('antrieb', array_values(array_diff(DocumentConditions::DRIVES, ['Allradlenkung'])), ['allradantrieb' => 'Allrad', 'frontantrieb' => 'Vorderachse', 'vorderradantrieb' => 'Vorderachse', 'heckantrieb' => 'Hinterachse', 'hinterradantrieb' => 'Hinterachse']),
            buildFromYear: $period->fromYear,
            buildFromMonth: $period->fromMonth,
            buildToYear: $period->toYear,
            buildToMonth: $period->toMonth,
            vsn: $vsn,
            bodyFormRaw: ($form = $text('karosserie')) === null ? null : mb_substr($form, 0, 64),
        );
    }

    /**
     * A whole number as a dataset or a German spreadsheet writes it — `1050`, `1.050`, `1 050` — whatever its size, or
     * null when the cell holds none. The bands decide afterwards whether it is believed.
     */
    public static function whole(?string $cell): ?int
    {
        $v = trim((string) $cell);

        if ($v === '') {
            return null;
        }

        $v = preg_match('/^\d{1,3}(?:[.\s\x{00A0}\x{202F}]\d{3})+$/u', $v) === 1 ? (string) preg_replace('/\D/', '', $v) : $v;

        return preg_match('/^\d{1,18}$/', $v) === 1 ? (int) $v : null;
    }

    public function egNormalised(): ?string
    {
        return Vehicle::normaliseEcNumber($this->egNumber);
    }

    /** `BMW 420i (3C)` — for the dry run's table. */
    public function label(): string
    {
        // Maker, model and variant, as the car is named everywhere else (VehicleName): a variant alone is not a car.
        return trim(preg_replace('/\s+/', ' ', $this->make.' '.$this->model.' '.$this->variant) ?? '').($this->typeDesignation === null ? '' : ' ('.$this->typeDesignation.')')
            // The VSN beside the name where it tells two cars of one HSN and TSN apart (D-517).
            .($this->vsn === null ? '' : ' · VSN '.$this->vsn);
    }
}
