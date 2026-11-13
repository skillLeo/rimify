<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles;

use App\Domain\Fitment\Data\PapersFigures;
use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\Vehicle;
use App\Models\VehicleImport;
use App\Models\VehicleImportRow;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Catalogue\CatalogueImporter;
use App\Services\Admin\Vehicles\Import\CheckCount;
use App\Services\Admin\Vehicles\Import\ImportTally;
use App\Services\Admin\Vehicles\Import\PlanChanged;
use App\Support\CatalogueVersion;
use App\Support\ColumnCollation;
use App\Support\GermanFormat;
use DateTimeInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Fahrzeuge › Import (his admin item 2, D-297): a vehicle dataset into the shop — the file, its columns, the Probelauf,
 * the import — built on his demo data's promise that the dataset carries the axle loads. Each row is one car, and the
 * key that keeps cars apart is the one the shop's selector and the operator's brief name: **HSN, TSN and variant**.
 *
 * What a row becomes, decided in the Probelauf and nowhere else:
 * - **neu** — no car carries its key, and none from a Gutachten fits it: created, stamped with the import's source
 *   (`import_kba`, `import_tecdoc` or `import_dat`), never `entwicklung`;
 * - **geändert** / **unverändert** — a car from an earlier import of the same source carries its key: what the file says
 *   otherwise is written (a figure the file leaves empty never empties one), or nothing differs;
 * - **ergänzt** — a car typed from a Gutachten fits it by EG number and Fahrzeugtyp (VehicleMerge): its empty fields
 *   are filled — HSN and TSN among them —, nothing a person entered is overwritten, and no second car is made of it
 *   (a second one would have the key numbers and none of the Gutachten's rows). A car that carries key numbers takes
 *   in only a row under the same ones: another HSN or TSN is another car, and becomes one;
 * - **bleibt** — a car a person checked or typed from a Gutachten, a removed car (R-04), or a car of another source
 *   carries its key: nothing is written, and the source is never changed;
 * - **abgelehnt** — no key numbers, no name, a row twice in the file, or two Gutachten cars it could be: said why.
 *
 * A figure that cannot be read is stored as nothing, never guessed, and the row says which (R-03): a car without its
 * axle loads or top speed waits under „Zur Prüfung“. Lochkreis is not asked for — a verdict comes from the Gutachten
 * naming the car, never from geometry.
 *
 * A file of any size (D-462): the rows live in `vehicle_import_rows`, and the Probelauf decides them a batch at a time —
 * first what a row is by itself (readRow(), while the file is read, with a second row under the same key refused there),
 * then against the shop's cars (the key, then the dataset's number), then against the cars from a Gutachten, then the
 * Gutachten cars several rows claim. Each step reads the cars as they are when it runs; the import plans everything
 * again inside its own transaction and writes nothing when the plan no longer reads the way the Probelauf on screen
 * did — one transaction, one Protokoll entry for the run, and one per car the merge fills.
 */
final class VehicleImporter
{
    public const CREATE = 'create';

    public const UPDATE = 'update';

    public const UNCHANGED = 'unchanged';

    public const MERGE = 'merge';

    public const KEPT = 'kept';

    public const REFUSED = 'refused';

    /** The outcomes a Probelauf ends with, in the order the counts are kept. */
    public const OUTCOMES = [self::CREATE, self::UPDATE, self::UNCHANGED, self::MERGE, self::KEPT, self::REFUSED];

    /** The rows one step of the work decides together: one query each for the cars they name. */
    public const BATCH = 500;

    /** The sources an import may stamp, as the admin names the file's origin. */
    public const SOURCES = [
        VehicleSource::ImportKba->value => 'KBA-Typdaten',
        VehicleSource::ImportTecdoc->value => 'TecDoc',
        VehicleSource::ImportDat->value => 'DAT',
    ];

    /**
     * The fields a row can carry — the contract's own column names (DatasetVehicle) —, whether a file must map it, and
     * the headers it is found under without being told (compared as CatalogueImporter::headerKey() reads them).
     */
    public const FIELDS = [
        'hsn' => ['label' => 'HSN (2.1)', 'required' => true, 'headers' => ['hsn', 'herstellerschluesselnummer', 'herstellerschluessel', '21', 'feld21']],
        'tsn' => ['label' => 'TSN (2.2)', 'required' => true, 'headers' => ['tsn', 'typschluesselnummer', 'typschluessel', '22', 'feld22']],
        'hersteller' => ['label' => 'Hersteller', 'required' => true, 'headers' => ['hersteller', 'marke', 'make', 'manufacturer', 'd1']],
        'handelsname' => ['label' => 'Modell (Handelsbezeichnung)', 'required' => true, 'headers' => ['handelsname', 'handelsbezeichnung', 'modell', 'model', 'd3']],
        'variante' => ['label' => 'Variante', 'required' => true, 'headers' => ['variante', 'variant', 'ausfuehrung', 'version', 'fahrzeugvariante']],
        'fahrzeugtyp' => ['label' => 'Fahrzeugtyp (D.2)', 'required' => false, 'headers' => ['fahrzeugtyp', 'typ', 'type', 'd2']],
        'eg_nummer' => ['label' => 'EG-Typgenehmigungsnummer (K)', 'required' => false, 'headers' => ['egnummer', 'egtypgenehmigungsnummer', 'typgenehmigungsnummer', 'typgenehmigung', 'feldk', 'k']],
        'leistung_kw' => ['label' => 'Leistung in kW (P.2)', 'required' => false, 'headers' => ['leistungkw', 'leistung', 'kw', 'p2']],
        // Required: without a start the window would be open — a car built at any time (R-02, windowRefused).
        'baubeginn' => ['label' => 'Gebaut ab', 'required' => true, 'headers' => ['baubeginn', 'bauvon', 'baujahrvon', 'gebautab', 'von', 'buildfrom']],
        'bauende' => ['label' => 'Gebaut bis', 'required' => false, 'headers' => ['bauende', 'baubis', 'baujahrbis', 'gebautbis', 'bis', 'buildto']],
        'karosserie' => ['label' => 'Karosserie', 'required' => false, 'headers' => ['karosserie', 'karosserieform', 'aufbau', 'body']],
        'antrieb' => ['label' => 'Antrieb', 'required' => false, 'headers' => ['antrieb', 'antriebsart', 'drive']],
        'achslast_vorn_kg' => ['label' => 'Achslast vorn in kg (8.1)', 'required' => false, 'headers' => ['achslastvornkg', 'achslastvorn', 'achslastvorne', '81', 'feld81']],
        'achslast_hinten_kg' => ['label' => 'Achslast hinten in kg (8.2)', 'required' => false, 'headers' => ['achslasthintenkg', 'achslasthinten', '82', 'feld82']],
        // `fahrzeug_max_kmh` is his demo data's column for T (his message of 19.10.2026, D-287); docs/launch/FAHRZEUGDATEN.md.
        'hoechstgeschwindigkeit_kmh' => ['label' => 'Höchstgeschwindigkeit in km/h (T)', 'required' => false, 'headers' => ['hoechstgeschwindigkeitkmh', 'fahrzeugmaxkmh', 'hoechstgeschwindigkeit', 'vmax', 'feldt', 't']],
        // Read for one check only — 8.1 and 8.2 against the car's own total mass (D-318) — and never stored.
        'gesamtmasse_kg' => ['label' => 'Zulässige Gesamtmasse in kg (F.2)', 'required' => false, 'hint' => 'Wird nur zum Abgleich mit 8.1 und 8.2 gelesen und nicht gespeichert.', 'headers' => ['gesamtmassekg', 'gesamtmasse', 'zulaessigegesamtmasse', 'zulgesamtmasse', 'gesamtgewicht', 'zulaessigesgesamtgewicht', 'zulgesamtgewicht', 'f2', 'feldf2']],
        'fahrzeug_id' => ['label' => 'Nummer des Fahrzeugs im Datensatz', 'required' => false, 'headers' => ['fahrzeugid', 'datensatzid', 'id']],
    ];

    /**
     * What the file lacks, counted over every row of it, whatever becomes of the row — the figures a purchase of the
     * full dataset is decided on (the operator's brief of 20.10.2026, D-317). A value that is missing or does not read
     * as a number counts as missing: for the shop it is the same. A number outside what the field can be is the third
     * state, counted apart (implausible(), D-318).
     */
    public const GAPS = [
        'without_speed' => 'Höchstgeschwindigkeit (T)',
        'without_axle' => 'Achslast vorn oder hinten (8.1 oder 8.2)',
        'without_keys' => 'HSN oder TSN (2.1 oder 2.2)',
        'without_eg' => 'EG-Typgenehmigungsnummer (K)',
    ];

    /**
     * The fields each gap is read from, by their number in the papers. A field without a column was never read, so its
     * gap is not counted but named as unmapped: „Keine Spalte zugeordnet“ is not „fehlt im Datensatz“ — the shop says
     * what it mapped and read, never what his file does or does not contain (R-17, the operator's rule of 20.10.2026).
     */
    private const GAP_FIELDS = [
        'without_speed' => ['hoechstgeschwindigkeit_kmh' => 'T'],
        'without_axle' => ['achslast_vorn_kg' => '8.1', 'achslast_hinten_kg' => '8.2'],
        'without_keys' => ['hsn' => '2.1', 'tsn' => '2.2'],
        'without_eg' => ['eg_nummer' => 'K'],
    ];

    /**
     * 8.1 plus 8.2 against the car's total mass (F.2), in per cent (D-318): the axle loads must carry the mass, so a
     * car's sum lies about 100 to 125 % of it; one axle load mapped to the mass itself gives 150 % and more.
     */
    public const SUM_MIN_PERCENT = 95;

    public const SUM_MAX_PERCENT = 140;

    /** The fewest rows with both axle loads before „the same in every row“ means anything: one or two such cars exist. */
    public const SAME_MIN_ROWS = 3;

    /** The rows shown under a check: enough to see what was read. */
    private const EXAMPLES = 3;

    /** The columns of a car an import writes, and the dataset field each comes from. */
    private const COLUMNS = [
        'make' => 'make',
        'model' => 'model',
        'type_designation' => 'typeDesignation',
        'eg_nummer_raw' => 'egNumber',
        'power_kw' => 'powerKw',
        'build_from' => 'buildFrom',
        'build_to' => 'buildTo',
        'body_form' => 'bodyForm',
        'drive_axle' => 'driveAxle',
        'axle_load_front_kg' => 'axleLoadFrontKg',
        'axle_load_rear_kg' => 'axleLoadRearKg',
        'max_speed_kmh' => 'maxSpeedKmh',
    ];

    /** The steps of the Probelauf after the file is read, as the page names them. */
    public const STEP_CARS = 'Abgleich mit den Fahrzeugen im Shop';

    public const STEP_GUTACHTEN = 'Abgleich mit den Fahrzeugen aus Gutachten';

    public const STEP_WRITE = 'Fahrzeuge speichern';

    public function __construct(private readonly VehicleMerge $merge) {}

    /**
     * @param  list<string>  $headers
     * @param  array<string, string>|null  $saved  the mapping of this source's last import that went through
     * @return array<string, string>
     */
    public static function guessMapping(array $headers, ?array $saved = null): array
    {
        $byKey = [];

        foreach ($headers as $header) {
            $byKey[CatalogueImporter::headerKey($header)] ??= $header;
        }

        // A column that names its unit, as the fields here name theirs — „Achslast vorn in kg“, „Zulässige Gesamtmasse
        // kg“, „Leistung in kW“ — maps too; a spelling the file gives exactly comes first (Human QA, HQ-29).
        foreach ($headers as $header) {
            $bare = CatalogueImporter::unitless($header);

            if ($bare !== '') {
                $byKey[$bare] ??= $header;
            }
        }

        $mapping = [];

        foreach (self::FIELDS as $field => $spec) {
            $remembered = $saved[$field] ?? null;

            if (is_string($remembered) && in_array($remembered, $headers, true)) {
                $mapping[$field] = $remembered;

                continue;
            }

            foreach ($spec['headers'] as $candidate) {
                if (isset($byKey[$candidate])) {
                    $mapping[$field] = $byKey[$candidate];

                    break;
                }
            }
        }

        return $mapping;
    }

    /**
     * @param  array<string, string>  $mapping
     * @param  list<string>  $headers
     * @return list<string> the labels of the required fields the mapping leaves without a column
     */
    public static function missing(array $mapping, array $headers): array
    {
        return array_values(array_map(
            static fn (array $spec): string => $spec['label'],
            array_filter(self::FIELDS, static fn (array $spec, string $field): bool => $spec['required'] && ! in_array($mapping[$field] ?? null, $headers, true), ARRAY_FILTER_USE_BOTH),
        ));
    }

    /**
     * A row of the file under a mapping: the contract's fields as typed, and `_line`.
     *
     * @param  array<string, string>  $raw  header → cell
     * @param  array<string, string>  $mapping  field → header
     * @return array<string, string>
     */
    public static function mapped(array $raw, array $mapping, int $line): array
    {
        $row = ['_line' => (string) $line];

        foreach (array_keys(self::FIELDS) as $field) {
            $header = $mapping[$field] ?? null;
            $row[$field] = $header === null ? '' : trim((string) ($raw[$header] ?? ''));
        }

        return $row;
    }

    /**
     * What a row is by itself, while the file is read: refused with its reason — no key numbers, no name, a name too
     * long for the table, a build window that does not read —, or waiting for the cars. `dup_key` keeps rows apart the
     * way the shop does: HSN, TSN and the variant whatever its case.
     *
     * @param  array<string, string>  $row  the contract fields as typed, and `_line`
     * @return array{car: DatasetVehicle, status: string, reason: string|null, label: string, keys: string|null, notes: list<string>, dup_key: string|null, number: int|null}
     */
    public static function readRow(array $row, VehicleSource $source): array
    {
        $car = DatasetVehicle::fromRow(['quelle' => $source->value, ...$row]);
        // Without both key numbers the row has none to show: its reason says what is missing (the page shows „–“).
        $keys = $car->hsn === null || $car->tsn === null ? null : GermanFormat::keyNumbers($car->hsn, $car->tsn);
        $entry = ['car' => $car, 'status' => VehicleImportRow::PENDING, 'reason' => null, 'label' => mb_substr($car->label(), 0, 500), 'keys' => $keys, 'notes' => self::unread($row, $car), 'dup_key' => null, 'number' => $car->sourceVehicleId];

        $reason = match (true) {
            $car->hsn === null || $car->tsn === null => 'HSN oder TSN fehlt oder ist nicht lesbar. Die HSN hat vier Ziffern, die TSN drei Zeichen.',
            $car->make === '' || $car->model === '' || $car->variant === '' => 'Hersteller, Modell oder Variante fehlt.',
            // What the table would refuse is refused here, with its reason — never a run that fails at „Importieren“.
            max(mb_strlen($car->make), mb_strlen($car->model), mb_strlen($car->variant), mb_strlen((string) $car->typeDesignation)) > 255 => 'Hersteller, Modell, Variante oder Fahrzeugtyp ist zu lang: höchstens 255 Zeichen.',
            // The build window decides which Gutachten rows reach the car (R-02): read, or the row waits. An empty start or
            // an unread end would be an open window — a car built at any time —, so neither is ever stored.
            default => self::windowRefused($row, $car),
        };

        if ($reason !== null) {
            return [...$entry, 'status' => self::REFUSED, 'reason' => $reason];
        }

        return [...$entry, 'dup_key' => sha1($car->hsn.'|'.$car->tsn.'|'.mb_strtolower($car->variant))];
    }

    /**
     * A second row under a key an earlier row of the file carries is refused, with the earlier row's line — the earlier
     * rows of the run read from the table, the batch's own from each other.
     *
     * @param  list<array<string, mixed>>  $rows  rows as readRow() decided them, each with its `line`, in the file's order
     * @return list<array<string, mixed>>
     */
    public static function refuseDuplicates(VehicleImport $import, array $rows): array
    {
        $keys = array_values(array_unique(array_filter(array_column($rows, 'dup_key'))));

        if ($keys === []) {
            return $rows;
        }

        /** @var array<string, int> $seen */
        $seen = $import->lines()->where('read_refused', false)->whereIn('dup_key', $keys)
            ->groupBy('dup_key')->selectRaw('dup_key, MIN(line) AS first_line')->pluck('first_line', 'dup_key')
            ->map(static fn (mixed $line): int => (int) $line)->all();

        foreach ($rows as $i => $row) {
            $key = $row['dup_key'] ?? null;

            if ($key === null) {
                continue;
            }

            if (isset($seen[$key])) {
                $rows[$i] = [...$row, 'status' => self::REFUSED, 'reason' => 'Doppelt in der Datei – gleiche HSN, TSN und Variante wie Zeile '.$seen[$key].'.'];

                continue;
            }

            $seen[$key] = (int) $row['line'];
        }

        return $rows;
    }

    /**
     * One batch of the Probelauf's next step, against the cars as they are now — the cars by key and number, then the
     * cars from a Gutachten, then the Gutachten cars several rows claim. Says which step, how many rows it decided and
     * how many of them go on to the cars from a Gutachten — the caller counts, so no step counts the whole file again.
     * False when every row is decided.
     *
     * `$after` is where each step stands: the last line it decided. Each batch is asked for from there on, never from the
     * first line of its outcome again — inside the import's one transaction, the database keeps every row a step has
     * already moved on in that outcome's index until the transaction ends, and a batch asked from the start walked past
     * all of them again: half a million rows took a quarter of an hour (D-462).
     *
     * @param  array<string, int>  $after
     * @return array{step: string, rows: int, open: int}|false
     */
    public function checkStep(VehicleImport $import, array &$after = []): array|false
    {
        $source = VehicleSource::from($import->source);

        $pending = $import->lines()->where('status', VehicleImportRow::PENDING)->where('line', '>', $after[VehicleImportRow::PENDING] ?? 0)->orderBy('line')->limit(self::BATCH)->get();

        if ($pending->isNotEmpty()) {
            $after[VehicleImportRow::PENDING] = (int) $pending->last()->line;
            $open = $this->againstCars($import, $pending->all(), $source);

            return ['step' => self::STEP_CARS, 'rows' => $pending->count(), 'open' => $open];
        }

        $open = $import->lines()->where('status', VehicleImportRow::OPEN)->where('line', '>', $after[VehicleImportRow::OPEN] ?? 0)->orderBy('line')->limit(self::BATCH)->get();

        if ($open->isNotEmpty()) {
            $after[VehicleImportRow::OPEN] = (int) $open->last()->line;
            $this->againstGutachten($open->all(), $source);

            return ['step' => self::STEP_GUTACHTEN, 'rows' => $open->count(), 'open' => 0];
        }

        if ($import->lines()->where('status', VehicleImportRow::MATCHED)->exists()) {
            $this->claims($import);

            return ['step' => self::STEP_GUTACHTEN, 'rows' => 0, 'open' => 0];
        }

        return false;
    }

    /**
     * Rows against the shop's cars: a car carrying the row's key decides it (against()); without one, the dataset's own
     * number of the car must be free — in the shop, and among the rows before it.
     *
     * @param  list<VehicleImportRow>  $rows  in the file's order
     * @return int the rows that go on to the cars from a Gutachten
     */
    private function againstCars(VehicleImport $import, array $rows, VehicleSource $source): int
    {
        $cars = [];

        foreach ($rows as $row) {
            $cars[$row->id] = DatasetVehicle::fromRow(['quelle' => $source->value, ...VehicleImportRow::fields($row->cells, $row->line)]);
        }

        $existing = self::carriers($cars);
        $numbers = array_values(array_unique(array_filter(array_map(static fn (DatasetVehicle $car): ?int => $car->sourceVehicleId, array_diff_key($cars, $existing)))));
        $holders = $numbers === [] ? collect() : Vehicle::withTrashed()->where('source', $source->value)->whereIn('source_vehicle_id', $numbers)->get()->keyBy('source_vehicle_id');
        /** @var array<int, int> $earlier the dataset numbers rows before this batch claimed, and where */
        $earlier = $numbers === [] ? [] : $import->lines()->where('status', VehicleImportRow::OPEN)->whereIn('number', $numbers)
            ->groupBy('number')->selectRaw('number, MIN(line) AS first_line')->pluck('first_line', 'number')
            ->mapWithKeys(static fn (mixed $line, mixed $number): array => [(int) $number => (int) $line])->all();
        $updates = [];

        foreach ($rows as $row) {
            $car = $cars[$row->id];

            if (isset($existing[$row->id])) {
                $updates[$row->id] = self::against($existing[$row->id], $car, $source);

                continue;
            }

            // The dataset's own number of the car: one car per number within its source, in the shop as in the file
            // (uq_vehicle_source_number) — another dataset counts its own cars.
            if ($car->sourceVehicleId !== null) {
                $holder = $holders->get($car->sourceVehicleId);

                if ($holder !== null || isset($earlier[$car->sourceVehicleId])) {
                    $updates[$row->id] = ['status' => self::REFUSED, 'vehicle' => null, 'changes' => [], 'reason' => $holder !== null
                        ? 'Die Nummer '.$car->sourceVehicleId.' aus dem Datensatz trägt schon ein Fahrzeug: '.self::name($holder).'.'
                        : 'Die Nummer '.$car->sourceVehicleId.' aus dem Datensatz steht zweimal in der Datei, auch in Zeile '.$earlier[$car->sourceVehicleId].'.'];

                    continue;
                }

                $earlier[$car->sourceVehicleId] = $row->line;
            }

            // No car carries the key: a car typed from a Gutachten may be this one (VehicleMerge decides), else it is new.
            $updates[$row->id] = ['status' => VehicleImportRow::OPEN, 'vehicle' => null, 'changes' => [], 'reason' => null];
        }

        self::write($updates);

        return count(array_filter($updates, static fn (array $u): bool => $u['status'] === VehicleImportRow::OPEN));
    }

    /**
     * For each car, the first car of the shop — removed ones among them (R-04) — that carries its HSN, TSN and variant,
     * compared as the database compares them: one query for the batch, each key compared under the column's own
     * collation, so a batch finds exactly what one `where()` per row found.
     *
     * @param  array<int, DatasetVehicle>  $cars  row id → car
     * @return array<int, Vehicle> row id → the car that carries its key
     */
    private static function carriers(array $cars): array
    {
        if ($cars === []) {
            return [];
        }

        $collate = ['hsn' => ColumnCollation::of('vehicles', 'hsn'), 'tsn' => ColumnCollation::of('vehicles', 'tsn'), 'variant' => ColumnCollation::of('vehicles', 'variant')];
        $keys = [];
        $bindings = [];

        foreach ($cars as $id => $car) {
            $keys[] = 'SELECT ? AS n, ? AS hsn, ? AS tsn, ? AS variant';
            array_push($bindings, $id, (string) $car->hsn, (string) $car->tsn, $car->variant);
        }

        $found = DB::select(
            'SELECT k.n AS n, MIN(v.id) AS id FROM ('.implode(' UNION ALL ', $keys).') AS k'
            .' JOIN vehicles AS v ON v.hsn = k.hsn COLLATE '.$collate['hsn'].' AND v.tsn = k.tsn COLLATE '.$collate['tsn'].' AND v.variant = k.variant COLLATE '.$collate['variant']
            .' GROUP BY k.n',
            $bindings,
        );

        $ids = [];

        foreach ($found as $hit) {
            $ids[(int) $hit->n] = (int) $hit->id;
        }

        $vehicles = Vehicle::withTrashed()->whereIn('id', array_values(array_unique($ids)))->get()->keyBy('id');

        return array_map(static fn (int $id): Vehicle => $vehicles->get($id), $ids);
    }

    /**
     * Rows no shop car carries against the cars from a Gutachten (VehicleMerge): matched, ambiguous, known, or new.
     * Which matches two rows claim is settled once every row is matched (claims()).
     *
     * @param  list<VehicleImportRow>  $rows
     */
    private function againstGutachten(array $rows, VehicleSource $source): void
    {
        $cars = array_map(static fn (VehicleImportRow $row): DatasetVehicle => DatasetVehicle::fromRow(['quelle' => $source->value, ...VehicleImportRow::fields($row->cells, $row->line)]), $rows);
        $decided = $this->merge->decide($cars);
        $updates = [];

        foreach ($rows as $n => $row) {
            $match = $decided[$n];
            $updates[$row->id] = match (true) {
                $match['status'] === VehicleMerge::MATCHED => ['status' => VehicleImportRow::MATCHED, 'vehicle' => $match['vehicle']?->id, 'changes' => [], 'reason' => null, 'fills' => $match['fills']],
                $match['status'] === VehicleMerge::AMBIGUOUS => ['status' => self::REFUSED, 'vehicle' => null, 'changes' => [], 'reason' => (string) $match['reason']],
                $match['status'] === VehicleMerge::KNOWN => ['status' => self::KEPT, 'vehicle' => null, 'changes' => [], 'reason' => 'Schon aus diesem Datensatz übernommen, unter anderer HSN, TSN oder Variante.'],
                default => ['status' => self::CREATE, 'vehicle' => null, 'changes' => [], 'reason' => null],
            };
        }

        self::write($updates);
    }

    /**
     * The Gutachten cars once every row is matched: one claimed by several rows is a person's call, and every row that
     * claims it is refused; a match with nothing to fill is unchanged, the others fill the car's empty fields.
     */
    private function claims(VehicleImport $import): void
    {
        $claimed = $import->lines()->where('status', VehicleImportRow::MATCHED)->groupBy('vehicle_id')
            ->havingRaw('COUNT(*) > 1')->selectRaw('vehicle_id, COUNT(*) AS claims')->pluck('claims', 'vehicle_id');

        foreach ($claimed as $vehicleId => $count) {
            $vehicle = Vehicle::withTrashed()->find((int) $vehicleId) ?? new Vehicle;
            $import->lines()->where('status', VehicleImportRow::MATCHED)->where('vehicle_id', (int) $vehicleId)
                ->update(['status' => self::REFUSED, 'vehicle_id' => null, 'fills' => null, 'changes' => null, 'reason' => VehicleMerge::claimedBy((int) $count, $vehicle)]);
        }

        $import->lines()->where('status', VehicleImportRow::MATCHED)->chunkById(self::BATCH, function ($rows): void {
            $vehicles = Vehicle::withTrashed()->whereIn('id', $rows->pluck('vehicle_id')->unique()->all())->get()->keyBy('id');
            $updates = [];

            foreach ($rows as $row) {
                $fills = (array) ($row->fills ?? []);
                // Matched, and every field the dataset gives is filled already: nothing to write.
                $updates[$row->id] = $fills === []
                    ? ['status' => self::UNCHANGED, 'vehicle' => $row->vehicle_id, 'changes' => [], 'reason' => null, 'fills' => null]
                    : ['status' => self::MERGE, 'vehicle' => $row->vehicle_id, 'changes' => array_keys($fills), 'reason' => self::mergedInto($vehicles->get($row->vehicle_id)), 'fills' => null];
            }

            self::write($updates);
        });
    }

    /**
     * Each row's outcome, written in one statement per column for the batch, its values bound.
     *
     * @param  array<int, array{status: string, vehicle: int|null, changes: list<string>, reason: string|null, fills?: array<string, mixed>|null}>  $updates  row id → outcome
     */
    private static function write(array $updates): void
    {
        if ($updates === []) {
            return;
        }

        $columns = [
            'status' => static fn (array $u): string => $u['status'],
            'vehicle_id' => static fn (array $u): ?int => $u['vehicle'],
            'changes' => static fn (array $u): ?string => $u['changes'] === [] ? null : (string) json_encode($u['changes']),
            'reason' => static fn (array $u): ?string => $u['reason'],
            // A match with nothing to fill keeps no fills: claims() reads none as nothing to write.
            'fills' => static fn (array $u): ?string => ($u['fills'] ?? []) === [] ? null : (string) json_encode($u['fills']),
        ];
        $sets = [];
        $bindings = [];

        foreach ($columns as $column => $value) {
            $cases = [];

            foreach ($updates as $id => $update) {
                $cases[] = 'WHEN ? THEN ?';
                array_push($bindings, $id, $value($update));
            }

            $sets[] = $column.' = CASE id '.implode(' ', $cases).' END';
        }

        $ids = array_keys($updates);
        DB::update(
            'UPDATE vehicle_import_rows SET '.implode(', ', $sets).' WHERE id IN ('.implode(', ', array_fill(0, count($ids), '?')).')',
            [...$bindings, ...$ids],
        );
    }

    /**
     * The Probelauf's counts once every row is decided — per outcome, the rows with a figure it could not read, every
     * row of the file, and what the file lacks — and the plan's fingerprint, read row by row in the file's order.
     *
     * @param  array<string, int>  $gaps  ImportTally::gaps()
     * @return array{summary: array<string, int>, hash: string}
     */
    public function finish(VehicleImport $import, array $gaps): array
    {
        $counts = $import->lines()->groupBy('status')->selectRaw('status, COUNT(*) AS n')->pluck('n', 'status');
        $summary = [];

        foreach (self::OUTCOMES as $outcome) {
            $summary[$outcome] = (int) ($counts[$outcome] ?? 0);
        }

        $summary['unread'] = $import->lines()->whereNotNull('notes')->count();
        $summary['rows'] = $import->lines()->count();

        return ['summary' => $summary + $gaps, 'hash' => self::planHash($import)];
    }

    /**
     * fingerprint() of the whole plan, without holding it: the same bytes, written a row at a time.
     */
    public static function planHash(VehicleImport $import): string
    {
        $context = hash_init('sha256');
        hash_update($context, '[');
        $first = true;
        $after = 0;

        while (true) {
            $rows = $import->lines()->where('line', '>', $after)->orderBy('line')->limit(2000)->get();

            foreach ($rows as $row) {
                hash_update($context, ($first ? '' : ',').json_encode(self::sortKeys($row->entry())));
                $first = false;
                $after = $row->line;
            }

            if ($rows->count() < 2000) {
                break;
            }
        }

        hash_update($context, ']');

        return hash_final($context);
    }

    /**
     * The gaps as the Probelauf shows them: each with its count and its share of the file's rows — every row, refused
     * ones included, or a half-refused file would show flattering shares (the operator's rule of 20.10.2026). A gap read
     * from a field without a column has no count, only `unmapped`: what was not read is not reported as missing. A run
     * checked before the gaps were counted has none to show.
     *
     * @param  array<string, mixed>  $summary
     * @param  array<string, string>  $mapping  the run's mapping, field → header
     * @param  list<string>  $headers  the file's headers
     * @return list<array{key: string, label: string, count: int|null, share: string|null, unmapped: string|null}>
     */
    public static function gaps(array $summary, array $mapping, array $headers): array
    {
        $rows = (int) ($summary['rows'] ?? 0);

        if ($rows === 0 || ! array_key_exists('without_speed', $summary)) {
            return [];
        }

        $out = [];

        foreach (self::GAPS as $key => $label) {
            $unmapped = self::unmapped(self::GAP_FIELDS[$key], $mapping, $headers);

            if ($unmapped !== null) {
                $out[] = ['key' => $key, 'label' => $label, 'count' => null, 'share' => null, 'unmapped' => $unmapped];

                continue;
            }

            $count = (int) ($summary[$key] ?? 0);
            $out[] = ['key' => $key, 'label' => $label, 'count' => $count, 'share' => GermanFormat::percent($count / $rows * 100, false), 'unmapped' => null];
        }

        return $out;
    }

    /**
     * Which of a check's fields have no column, as the Probelauf says it — „Keine Spalte zugeordnet“, or the single field
     * of a pair — or null when every one is mapped: what was not read is never reported as missing (R-17, D-318).
     *
     * @param  array<string, string>  $fields  field → its number in the papers
     * @param  array<string, string>  $mapping
     * @param  list<string>  $headers
     */
    public static function unmapped(array $fields, array $mapping, array $headers): ?string
    {
        $unread = array_values(array_filter($fields, static fn (string $field): bool => ! in_array($mapping[$field] ?? null, $headers, true), ARRAY_FILTER_USE_KEY));

        return match (true) {
            $unread === [] => null,
            count($unread) === count($fields) => 'Keine Spalte zugeordnet',
            default => 'Keine Spalte für Feld '.implode(' und Feld ', $unread).' zugeordnet',
        };
    }

    /** What a merge fills, as the row says it: the car by its origin, and that only its empty fields are written. */
    private static function mergedInto(?Vehicle $vehicle): string
    {
        $name = $vehicle === null ? '' : ' '.self::name($vehicle);

        return $vehicle?->source === VehicleSource::ManuellGeprueft->value
            ? 'Von Hand angelegtes Fahrzeug'.$name.'. Nur leere Felder werden gefüllt.'
            : 'Fahrzeug aus einem Gutachten:'.$name.'. Nur leere Felder werden gefüllt.';
    }

    /**
     * A row whose key a car already carries.
     *
     * @return array{status: string, vehicle: int, changes: list<string>, reason: string|null}
     */
    private static function against(Vehicle $vehicle, DatasetVehicle $car, VehicleSource $source): array
    {
        $kept = static fn (string $reason): array => ['status' => self::KEPT, 'vehicle' => (int) $vehicle->id, 'changes' => [], 'reason' => $reason];

        if ($vehicle->trashed()) {
            return $kept('Entfernt – bleibt entfernt. Der Import holt kein Fahrzeug zurück.');
        }

        if ($vehicle->source !== $source->value) {
            return $kept(match ($vehicle->source) {
                VehicleSource::ManuellGeprueft->value => 'Von Hand angelegt und geprüft – bleibt, wie es ist.',
                VehicleSource::Gutachten->value => 'Aus einem Gutachten angelegt – bleibt, wie es ist.',
                VehicleSource::Entwicklung->value => 'Testfahrzeug der Entwicklung – bleibt, wie es ist.',
                default => 'Kommt aus einer anderen Quelle ('.(self::SOURCES[$vehicle->source] ?? $vehicle->source).') – bleibt, wie es ist.',
            });
        }

        $changes = array_keys(self::changes($vehicle, $car));

        return $changes === []
            ? ['status' => self::UNCHANGED, 'vehicle' => (int) $vehicle->id, 'changes' => [], 'reason' => null]
            : ['status' => self::UPDATE, 'vehicle' => (int) $vehicle->id, 'changes' => $changes, 'reason' => null];
    }

    /**
     * What the file says otherwise for a car of its own source: a figure the file leaves empty never empties one.
     *
     * @return array<string, mixed>
     */
    private static function changes(Vehicle $vehicle, DatasetVehicle $car): array
    {
        $changes = [];

        foreach (self::row($car) as $column => $value) {
            if ($value === null) {
                continue;
            }

            $ours = $vehicle->getAttribute($column);
            $ours = $ours instanceof DateTimeInterface ? $ours->format('Y-m-d') : $ours;

            if ((string) $ours !== (string) $value) {
                $changes[$column] = $value;
            }
        }

        return $changes;
    }

    /**
     * The car as its row stores it.
     *
     * @return array<string, mixed>
     */
    private static function row(DatasetVehicle $car): array
    {
        $out = [];

        foreach (self::COLUMNS as $column => $property) {
            $value = $car->{$property};
            $out[$column] = $value instanceof DateTimeInterface ? $value->format('Y-m-d') : $value;
        }

        return $out;
    }

    /**
     * The figures a row gave and the import could not read — stored as nothing, and said (R-03). A number outside what
     * its field can be is said as what was read and what was expected, never as a fact about the file (D-318).
     *
     * @param  array<string, string>  $row
     * @return list<string>
     */
    private static function unread(array $row, DatasetVehicle $car): array
    {
        // The build window is not among them: a window that does not read refuses the row (windowRefused).
        $read = [
            'leistung_kw' => $car->powerKw,
            'karosserie' => $car->bodyForm, 'antrieb' => $car->driveAxle, 'eg_nummer' => $car->egNumber,
            'achslast_vorn_kg' => $car->axleLoadFrontKg, 'achslast_hinten_kg' => $car->axleLoadRearKg,
            'hoechstgeschwindigkeit_kmh' => $car->maxSpeedKmh,
        ];
        $notes = [];

        foreach ($read as $field => $value) {
            if (trim((string) ($row[$field] ?? '')) === '' || $value !== null) {
                continue;
            }

            $band = self::bands()[$field] ?? null;
            $number = DatasetVehicle::whole($row[$field]);

            $notes[] = $band !== null && $number !== null
                ? self::FIELDS[$field]['label'].': Gelesen: '.self::figure($number, $band['unit']).'. '.self::expected($band).'.'
                : self::FIELDS[$field]['label'].' nicht lesbar: „'.mb_substr(trim((string) $row[$field]), 0, 40).'“';
        }

        return $notes;
    }

    /**
     * What a figure can physically be, per field — held once, the axle loads in DatasetVehicle, the top speed in
     * PapersFigures — and named here with its unit and what it is.
     *
     * @return array<string, array{min: int, max: int, unit: string, what: string}>
     */
    public static function bands(): array
    {
        $axle = ['min' => DatasetVehicle::AXLE_MIN_KG, 'max' => DatasetVehicle::AXLE_MAX_KG, 'unit' => 'kg', 'what' => 'eine Achslast'];

        return [
            'achslast_vorn_kg' => $axle,
            'achslast_hinten_kg' => $axle,
            'hoechstgeschwindigkeit_kmh' => ['min' => PapersFigures::SPEED_MIN_KMH, 'max' => PapersFigures::SPEED_MAX_KMH, 'unit' => 'km/h', 'what' => 'eine Höchstgeschwindigkeit'],
        ];
    }

    /** @param  array{min: int, max: int, unit: string, what: string}  $band */
    public static function expected(array $band): string
    {
        return 'Erwartet für '.$band['what'].': '.GermanFormat::integer($band['min']).' bis '.self::figure($band['max'], $band['unit']);
    }

    public static function figure(int $value, string $unit): string
    {
        return GermanFormat::integer($value).GermanFormat::NBSP.$unit;
    }

    /**
     * The third state beside missing and mapped (the operator's brief of 20.10.2026, D-318): a value that reads, but
     * not as what its field can be. A column mapped to the wrong column reads fine row by row — 8.1 on the total mass,
     * say — and only such a check shows it. Each check says what was read and what was expected, with up to three rows,
     * never what his file contains. None refuses a row or blocks the import: the fix is a mapping, not the data. A check
     * that could run on no row says so instead of a nought (docs/dev/TEST-SMELLS.md, 2). Counted as the file is read
     * (ImportTally); this is the same count over rows held in hand.
     *
     * @param  list<array<string, string>>  $rows  the contract's fields, as typed, and `_line`
     * @param  array<string, string>  $mapping  field → header
     * @param  list<string>  $headers
     * @return list<array{key: string, label: string, expected: string, count: int|null, checked: int, examples: list<string>, unmapped: string|null, unchecked: string|null}>
     */
    public static function implausible(array $rows, array $mapping, array $headers): array
    {
        $tally = ImportTally::start();

        foreach ($rows as $i => $row) {
            $tally->add($row, $i);
        }

        return $tally->checks($mapping, $headers);
    }

    /** @param  array{min: int, max: int, unit: string, what: string}  $band */
    public static function inBand(int $value, array $band): bool
    {
        return $value >= $band['min'] && $value <= $band['max'];
    }

    /**
     * One check as the Probelauf shows it. Unmapped, it has no count and no rows; not checkable on any row, it says why
     * instead of a nought.
     *
     * @param  list<string>  $examples
     * @return array{key: string, label: string, expected: string, count: int|null, checked: int, examples: list<string>, unmapped: string|null, unchecked: string|null}
     */
    public static function check(string $key, string $label, string $expected, ?string $unmapped, int $count, int $checked, array $examples, ?string $unchecked = null): array
    {
        $counted = $unmapped === null && $unchecked === null;

        return [
            'key' => $key,
            'label' => $label,
            'expected' => $expected,
            'count' => $counted ? $count : null,
            'checked' => $unmapped === null ? $checked : 0,
            'examples' => $counted ? array_slice($examples, 0, self::EXAMPLES) : [],
            'unmapped' => $unmapped,
            'unchecked' => $unmapped === null ? $unchecked : null,
        ];
    }

    private static function name(Vehicle $vehicle): string
    {
        return trim($vehicle->make.' '.$vehicle->model.' '.$vehicle->variant);
    }

    /**
     * Writes the Probelauf: inside one transaction, the plan is made again from the file's rows against the cars as
     * they are now, and nothing is written when it no longer reads the way the Probelauf did (PlanChanged) — the
     * transaction then gives back the Probelauf's own rows. A run stopped half-way writes nothing at all.
     *
     * `$progress` hears how far the work is, from outside the transaction (VehicleImportWork).
     *
     * @param  (callable(string, int, int): void)|null  $progress
     */
    public function apply(VehicleImport $import, AdminUser $admin, ?callable $progress = null): VehicleImport
    {
        $progress ??= static function (string $step, int $done, int $total): void {};

        return DB::transaction(function () use ($import, $admin, $progress): VehicleImport {
            $import = VehicleImport::query()->findOrFail($import->id);
            $source = VehicleSource::from($import->source);

            if (self::missing((array) $import->mapping, $import->headers()) !== []) {
                throw ValidationException::withMessages(['import' => 'Ordne zuerst jedem Pflichtfeld eine Spalte zu und wähl „Neu prüfen“.']);
            }

            // The plan again, from what each row is by itself, against the cars as they are now.
            $eligible = $import->lines()->where('read_refused', false)->update(['status' => VehicleImportRow::PENDING, 'vehicle_id' => null, 'changes' => null, 'fills' => null, 'reason' => null]);
            $count = new CheckCount($eligible);
            $after = [];

            while (($step = $this->checkStep($import, $after)) !== false) {
                $shown = $count->add($step);
                $progress('Noch einmal prüfen: '.$shown['step'], $shown['done'], $shown['total']);
            }

            $finished = $this->finish($import, array_intersect_key((array) $import->summary, self::GAPS));

            if ($import->plan_hash === null || ! hash_equals($import->plan_hash, $finished['hash'])) {
                throw new PlanChanged('Die Fahrzeuge haben sich seit dem Probelauf geändert. Wähl „Neu prüfen“, bevor du importierst.');
            }

            $summary = $finished['summary'];

            if ($summary[self::CREATE] + $summary[self::UPDATE] + $summary[self::MERGE] === 0) {
                throw ValidationException::withMessages(['import' => 'Der Probelauf hat nichts zu importieren gefunden.']);
            }

            // An imported car carries a number of its own (chk_veh_export_id_from_source): the file's, or one past the
            // highest of its source and of the file — read under a lock, so two imports never hand out the same, and
            // never one a row of this file brings itself.
            $next = max((int) Vehicle::withTrashed()->where('source', $source->value)->lockForUpdate()->max('source_vehicle_id'), (int) $import->lines()->max('number')) + 1;
            $total = $summary[self::CREATE] + $summary[self::UPDATE] + $summary[self::MERGE];
            $done = 0;
            $merges = [];
            $after = 0;
            $now = now();

            // Down the file by its line — the run's own unique index —, a batch at a time: asked by three outcomes at once,
            // the database sorted every remaining row again for each batch, and half a million rows took over an hour.
            while (true) {
                $rows = $import->lines()->where('line', '>', $after)->orderBy('line')->limit(self::BATCH)->get();

                if ($rows->isEmpty()) {
                    break;
                }

                $after = (int) $rows->last()->line;
                $rows = $rows->filter(static fn (VehicleImportRow $row): bool => in_array($row->status, [self::CREATE, self::UPDATE, self::MERGE], true));

                if ($rows->isEmpty()) {
                    continue;
                }

                $creates = [];
                $updates = [];

                foreach ($rows as $row) {
                    $fields = VehicleImportRow::fields($row->cells, $row->line);
                    $car = DatasetVehicle::fromRow(['quelle' => $source->value, ...$fields]);

                    if ($row->status === self::CREATE) {
                        $values = self::row($car);
                        $vehicle = new Vehicle([
                            ...$values,
                            'hsn' => $car->hsn,
                            'tsn' => $car->tsn,
                            'variant' => $car->variant,
                            'source' => $source->value,
                            'source_vehicle_id' => $car->sourceVehicleId ?? $next++,
                            'imported_at' => $now,
                            'needs_review' => ! self::complete($values),
                            'raw' => ['import' => ['file' => $import->file_name, 'line' => (string) $row->line, 'row' => $fields]],
                        ]);
                        $vehicle->setCreatedAt($now)->setUpdatedAt($now);
                        $attributes = $vehicle->getAttributes();
                        ksort($attributes);
                        $creates[] = $attributes;
                    } elseif ($row->status === self::UPDATE) {
                        $updates[(int) $row->vehicle_id] = $car;
                    } else {
                        $merges[] = $car;
                    }
                }

                if ($creates !== []) {
                    Vehicle::query()->insert($creates);
                }

                if ($updates !== []) {
                    foreach (Vehicle::query()->lockForUpdate()->whereIn('id', array_keys($updates))->orderBy('id')->get() as $vehicle) {
                        $vehicle->forceFill(self::changes($vehicle, $updates[$vehicle->id]) + ['imported_at' => $now]);
                        $vehicle->needs_review = ! self::complete($vehicle->only(['axle_load_front_kg', 'axle_load_rear_kg', 'max_speed_kmh']));
                        $vehicle->save();
                    }
                }

                $done += $rows->count();
                $progress(self::STEP_WRITE, $done, $total);
            }

            // The Gutachten cars: through the merge itself, so it fills only empty fields and writes its own Protokoll.
            if ($merges !== []) {
                $this->merge->apply($this->merge->plan($merges), $admin);
            }

            $import->forceFill(['status' => VehicleImport::APPLIED, 'applied_at' => now(), 'applied_by' => $admin->id, 'summary' => $summary, 'error' => null])->save();
            VehicleImport::rememberMapping($source, (array) $import->mapping);

            AuditTrail::record($admin, 'vehicle.import_applied', [
                'file' => $import->file_name,
                'source' => $source->value,
                'summary' => $summary,
            ], $import);

            CatalogueVersion::changed();

            return $import;
        });
    }

    /** @param  array<string, mixed>  $values */
    private static function complete(array $values): bool
    {
        return ($values['axle_load_front_kg'] ?? null) !== null && ($values['axle_load_rear_kg'] ?? null) !== null && ($values['max_speed_kmh'] ?? null) !== null;
    }

    /**
     * Why a row's build window refuses it, or null: the start missing or unread, the end given but unread, or the end
     * before the start. Stored, any of them would be an open window — a car built at any time (R-02) —, the opposite of
     * failing closed.
     *
     * @param  array<string, string>  $row
     */
    private static function windowRefused(array $row, DatasetVehicle $car): ?string
    {
        $typed = static fn (string $field): string => mb_substr(trim((string) ($row[$field] ?? '')), 0, 40);

        return match (true) {
            $car->buildFrom === null && $typed('baubeginn') === '' => 'Der Baubeginn fehlt. Bitte Monat und Jahr, etwa 03.2015.',
            $car->buildFrom === null => 'Der Baubeginn ist nicht lesbar: „'.$typed('baubeginn').'“. Bitte Monat und Jahr, etwa 03.2015.',
            $car->buildTo === null && $typed('bauende') !== '' => 'Das Bauende ist nicht lesbar: „'.$typed('bauende').'“. Bitte Monat und Jahr, etwa 12.2019 – oder leer, wenn es noch gebaut wird.',
            $car->buildTo !== null && $car->buildTo < $car->buildFrom => 'Das Bauende liegt vor dem Baubeginn.',
            default => null,
        };
    }

    /**
     * A plan as it reads, whatever order a JSON column keeps object keys in — MySQL sorts them on storing, MariaDB does
     * not —, as the catalogue's import compares its own (CatalogueImporter::fingerprint). planHash() writes the same
     * bytes a row at a time.
     *
     * @param  list<array<string, mixed>>  $plan
     */
    public static function fingerprint(array $plan): string
    {
        return hash('sha256', (string) json_encode(self::sortKeys($plan)));
    }

    private static function sortKeys(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (! array_is_list($value)) {
            ksort($value);
        }

        return array_map(self::sortKeys(...), $value);
    }
}
