<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles;

use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\Vehicle;
use App\Models\VehicleImport;
use App\Services\Admin\AuditTrail;
use App\Services\Admin\Catalogue\CatalogueImporter;
use App\Support\CatalogueVersion;
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
 * Applying checks the plan again first: if the cars changed since the Probelauf, nothing is written and a new
 * Probelauf is asked for. One transaction, one Protokoll entry for the run, and one per car the merge fills.
 */
final class VehicleImporter
{
    public const MAX_ROWS = CatalogueImporter::MAX_ROWS;

    public const CREATE = 'create';

    public const UPDATE = 'update';

    public const UNCHANGED = 'unchanged';

    public const MERGE = 'merge';

    public const KEPT = 'kept';

    public const REFUSED = 'refused';

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
        'fahrzeug_id' => ['label' => 'Nummer des Fahrzeugs im Datensatz', 'required' => false, 'headers' => ['fahrzeugid', 'datensatzid', 'id']],
    ];

    /**
     * What the file lacks, counted over every row of it, whatever becomes of the row — the figures a purchase of the
     * full dataset is decided on (the operator's brief of 20.10.2026, D-317). A value that is missing or does not read
     * counts as missing: for the shop it is the same.
     */
    public const GAPS = [
        'without_speed' => 'Höchstgeschwindigkeit (T)',
        'without_axle' => 'Achslast vorn oder hinten (8.1 oder 8.2)',
        'without_keys' => 'HSN oder TSN (2.1 oder 2.2)',
        'without_eg' => 'EG-Typgenehmigungsnummer (K)',
    ];

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
     * A Probelauf of a file: mapped (as given, or as the last import of this source had it, or by the column names),
     * every row planned against the cars as they are now. Nothing is written to the cars.
     *
     * @param  array{name: string, format: string, sha256: string, headers: list<string>, rows: list<array<string, string>>}  $file
     * @param  array<string, string>|null  $mapping
     */
    public function preview(array $file, ?array $mapping, VehicleSource $source, AdminUser $admin): VehicleImport
    {
        $mapping ??= self::guessMapping($file['headers'], VehicleImport::savedMapping($source));

        $import = new VehicleImport([
            'admin_user_id' => $admin->id,
            'file_name' => mb_substr($file['name'], 0, 200),
            'file_format' => $file['format'],
            'file_sha256' => $file['sha256'],
            'source' => $source->value,
            'status' => VehicleImport::PREVIEWED,
            'file' => ['headers' => $file['headers'], 'rows' => $file['rows']],
        ]);

        $this->evaluate($import, $mapping);
        $import->save();

        return $import;
    }

    /**
     * The same file under another mapping, checked again — only while it is a Probelauf, asked under its lock: an
     * imported run keeps the mapping it was imported with.
     *
     * @param  array<string, string>  $mapping
     */
    public function remap(VehicleImport $import, array $mapping): VehicleImport
    {
        return DB::transaction(function () use ($import, $mapping): VehicleImport {
            $import = VehicleImport::query()->lockForUpdate()->findOrFail($import->id);

            if ($import->status !== VehicleImport::PREVIEWED) {
                throw ValidationException::withMessages(['import' => 'Diese Datei ist schon importiert. Ihre Zuordnung bleibt, wie sie war.']);
            }

            $this->evaluate($import, $mapping);
            $import->save();

            return $import;
        });
    }

    /** @param  array<string, string>  $mapping */
    private function evaluate(VehicleImport $import, array $mapping): void
    {
        $headers = $import->file['headers'];
        $mapping = array_filter($mapping, static fn (string $header): bool => in_array($header, $headers, true));
        $rows = [];

        foreach ($import->file['rows'] as $raw) {
            $row = ['_line' => (string) ($raw['_line'] ?? '')];

            foreach (array_keys(self::FIELDS) as $field) {
                $header = $mapping[$field] ?? null;
                $row[$field] = $header === null ? '' : trim((string) ($raw[$header] ?? ''));
            }

            $rows[] = $row;
        }

        [$plan, $summary] = self::missing($mapping, $headers) === [] ? $this->plan($rows, VehicleSource::from($import->source)) : [[], []];

        $import->forceFill(['mapping' => $mapping, 'rows' => $rows, 'plan' => $plan, 'summary' => $summary]);
    }

    /**
     * Every row against the cars as they are now.
     *
     * @param  list<array<string, string>>  $rows  the contract's fields, as typed, and `_line`
     * @return array{0: list<array<string, mixed>>, 1: array<string, int>}
     */
    public function plan(array $rows, VehicleSource $source): array
    {
        $plan = [];
        $seen = [];
        $numbers = [];
        $open = [];
        $gaps = array_fill_keys(array_keys(self::GAPS), 0);

        foreach ($rows as $i => $row) {
            $car = DatasetVehicle::fromRow(['quelle' => $source->value, ...$row]);
            $line = (string) ($row['_line'] ?? $i + 2);
            $gaps['without_speed'] += $car->maxSpeedKmh === null ? 1 : 0;
            $gaps['without_axle'] += $car->axleLoadFrontKg === null || $car->axleLoadRearKg === null ? 1 : 0;
            $gaps['without_keys'] += $car->hsn === null || $car->tsn === null ? 1 : 0;
            $gaps['without_eg'] += $car->egNumber === null ? 1 : 0;
            // Without both key numbers the row has none to show: its reason says what is missing (the page shows „–“).
            $keys = $car->hsn === null || $car->tsn === null ? null : GermanFormat::keyNumbers($car->hsn, $car->tsn);
            $entry = ['line' => $line, 'label' => $car->label(), 'keys' => $keys, 'status' => self::REFUSED, 'vehicle' => null, 'changes' => [], 'notes' => self::unread($row, $car), 'reason' => null];

            if ($car->hsn === null || $car->tsn === null) {
                $plan[$i] = [...$entry, 'reason' => 'HSN oder TSN fehlt oder ist nicht lesbar. Die HSN hat vier Ziffern, die TSN drei Zeichen.'];

                continue;
            }

            if ($car->make === '' || $car->model === '' || $car->variant === '') {
                $plan[$i] = [...$entry, 'reason' => 'Hersteller, Modell oder Variante fehlt.'];

                continue;
            }

            // What the table would refuse is refused here, with its reason — never a run that fails at „Importieren“.
            if (max(mb_strlen($car->make), mb_strlen($car->model), mb_strlen($car->variant), mb_strlen((string) $car->typeDesignation)) > 255) {
                $plan[$i] = [...$entry, 'reason' => 'Hersteller, Modell, Variante oder Fahrzeugtyp ist zu lang: höchstens 255 Zeichen.'];

                continue;
            }

            // The build window decides which Gutachten rows reach the car (R-02): read, or the row waits. An empty start
            // or an unread end would be an open window — a car built at any time —, so neither is ever stored.
            $window = self::windowRefused($row, $car);

            if ($window !== null) {
                $plan[$i] = [...$entry, 'reason' => $window];

                continue;
            }

            $key = $car->hsn.'|'.$car->tsn.'|'.mb_strtolower($car->variant);

            if (isset($seen[$key])) {
                $plan[$i] = [...$entry, 'reason' => 'Doppelt in der Datei – gleiche HSN, TSN und Variante wie Zeile '.$seen[$key].'.'];

                continue;
            }

            $seen[$key] = $line;
            $existing = Vehicle::withTrashed()->where('hsn', $car->hsn)->where('tsn', $car->tsn)->where('variant', $car->variant)->orderBy('id')->first();

            if ($existing !== null) {
                $plan[$i] = [...$entry, ...self::against($existing, $car, $source)];

                continue;
            }

            // The dataset's own number of the car: one car per number within its source, in the shop as in the file
            // (uq_vehicle_source_number) — another dataset counts its own cars.
            if ($car->sourceVehicleId !== null) {
                $holder = Vehicle::withTrashed()->where('source', $source->value)->where('source_vehicle_id', $car->sourceVehicleId)->first();

                if ($holder !== null || isset($numbers[$car->sourceVehicleId])) {
                    $plan[$i] = [...$entry, 'reason' => $holder !== null
                        ? 'Die Nummer '.$car->sourceVehicleId.' aus dem Datensatz trägt schon ein Fahrzeug: '.self::name($holder).'.'
                        : 'Die Nummer '.$car->sourceVehicleId.' aus dem Datensatz steht zweimal in der Datei, auch in Zeile '.$numbers[$car->sourceVehicleId].'.'];

                    continue;
                }

                $numbers[$car->sourceVehicleId] = $line;
            }

            // No car carries the key: a car typed from a Gutachten may be this one (VehicleMerge decides), else it is new.
            $open[$i] = $car;
            $plan[$i] = $entry;
        }

        $decided = $this->merge->plan(array_values($open));

        foreach (array_keys($open) as $n => $i) {
            $match = $decided[$n];
            $plan[$i] = [...$plan[$i], ...match (true) {
                // Matched, and every field the dataset gives is filled already: nothing to write.
                $match['status'] === VehicleMerge::MATCHED && $match['fills'] === [] => ['status' => self::UNCHANGED, 'vehicle' => $match['vehicle']?->id],
                $match['status'] === VehicleMerge::MATCHED => ['status' => self::MERGE, 'vehicle' => $match['vehicle']?->id, 'changes' => array_keys($match['fills']), 'reason' => self::mergedInto($match['vehicle'])],
                $match['status'] === VehicleMerge::AMBIGUOUS => ['status' => self::REFUSED, 'reason' => (string) $match['reason']],
                $match['status'] === VehicleMerge::KNOWN => ['status' => self::KEPT, 'reason' => 'Schon aus diesem Datensatz übernommen, unter anderer HSN, TSN oder Variante.'],
                default => ['status' => self::CREATE],
            }];
        }

        ksort($plan);
        $plan = array_values($plan);
        $summary = array_fill_keys([self::CREATE, self::UPDATE, self::UNCHANGED, self::MERGE, self::KEPT, self::REFUSED], 0);

        foreach ($plan as $entry) {
            $summary[$entry['status']]++;
        }

        $summary['unread'] = count(array_filter($plan, static fn (array $e): bool => $e['notes'] !== []));
        $summary['rows'] = count($rows);

        return [$plan, $summary + $gaps];
    }

    /**
     * The file's gaps as the Probelauf shows them: each with its count and its share of the file's rows. A run checked
     * before the gaps were counted has none to show.
     *
     * @param  array<string, mixed>  $summary
     * @return list<array{key: string, label: string, count: int, share: string}>
     */
    public static function gaps(array $summary): array
    {
        $rows = (int) ($summary['rows'] ?? 0);

        if ($rows === 0 || ! array_key_exists('without_speed', $summary)) {
            return [];
        }

        $out = [];

        foreach (self::GAPS as $key => $label) {
            $count = (int) ($summary[$key] ?? 0);
            $out[] = ['key' => $key, 'label' => $label, 'count' => $count, 'share' => GermanFormat::percent($count / $rows * 100, false)];
        }

        return $out;
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
     * The figures a row gave and the import could not read — stored as nothing, and said (R-03).
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
            if (trim((string) ($row[$field] ?? '')) !== '' && $value === null) {
                $notes[] = self::FIELDS[$field]['label'].' nicht lesbar: „'.mb_substr(trim((string) $row[$field]), 0, 40).'“';
            }
        }

        return $notes;
    }

    private static function name(Vehicle $vehicle): string
    {
        return trim($vehicle->make.' '.$vehicle->model.' '.$vehicle->variant);
    }

    /**
     * Writes the Probelauf, planned again first: a plan that no longer reads the way it did is not applied.
     *
     * All of it under the run's own lock and inside one transaction: a second click, or a second tab, waits for the
     * first and then finds the file imported — never a car written twice. `$shown` is the fingerprint of the Probelauf
     * on the person's screen: what is imported is what they saw, not one another tab has checked since.
     */
    public function apply(VehicleImport $import, AdminUser $admin, ?string $shown = null): VehicleImport
    {
        return DB::transaction(function () use ($import, $admin, $shown): VehicleImport {
            $import = VehicleImport::query()->lockForUpdate()->findOrFail($import->id);

            if ($import->status !== VehicleImport::PREVIEWED) {
                throw ValidationException::withMessages(['import' => 'Diese Datei ist schon importiert.']);
            }

            if (self::missing($import->mapping, $import->file['headers']) !== []) {
                throw ValidationException::withMessages(['import' => 'Ordne zuerst jedem Pflichtfeld eine Spalte zu und wähl „Neu prüfen“.']);
            }

            if ($shown !== null && ! hash_equals(self::fingerprint($import->plan), $shown)) {
                throw ValidationException::withMessages(['import' => 'Der Probelauf wurde geändert, seit du diese Seite geöffnet hast. Lad die Seite neu und prüf ihn, bevor du importierst.']);
            }

            $source = VehicleSource::from($import->source);
            [$plan, $summary] = $this->plan($import->rows, $source);

            if (self::fingerprint($plan) !== self::fingerprint($import->plan)) {
                throw ValidationException::withMessages(['import' => 'Die Fahrzeuge haben sich seit dem Probelauf geändert. Wähl „Neu prüfen“, bevor du importierst.']);
            }

            if ($summary[self::CREATE] + $summary[self::UPDATE] + $summary[self::MERGE] === 0) {
                throw ValidationException::withMessages(['import' => 'Der Probelauf hat nichts zu importieren gefunden.']);
            }

            $merges = [];
            // An imported car carries a number of its own (chk_veh_export_id_from_source): the file's, or one past the
            // highest of its source and of the file — read under a lock, so two imports never hand out the same, and
            // never one a row of this file brings itself.
            $numbered = array_filter(array_map(static fn (array $row): ?int => DatasetVehicle::fromRow(['quelle' => $source->value, ...$row])->sourceVehicleId, $import->rows));
            $next = max((int) Vehicle::withTrashed()->where('source', $source->value)->lockForUpdate()->max('source_vehicle_id'), $numbered === [] ? 0 : max($numbered)) + 1;

            foreach ($plan as $n => $entry) {
                $car = DatasetVehicle::fromRow(['quelle' => $source->value, ...$import->rows[$n]]);

                if ($entry['status'] === self::CREATE) {
                    $values = self::row($car);
                    Vehicle::query()->create([
                        ...$values,
                        'hsn' => $car->hsn,
                        'tsn' => $car->tsn,
                        'variant' => $car->variant,
                        'source' => $source->value,
                        'source_vehicle_id' => $car->sourceVehicleId ?? $next++,
                        'imported_at' => now(),
                        'needs_review' => ! self::complete($values),
                        'raw' => ['import' => ['file' => $import->file_name, 'line' => $entry['line'], 'row' => $import->rows[$n]]],
                    ]);
                } elseif ($entry['status'] === self::UPDATE) {
                    $vehicle = Vehicle::query()->lockForUpdate()->findOrFail((int) $entry['vehicle']);
                    $vehicle->forceFill(self::changes($vehicle, $car) + ['imported_at' => now()]);
                    $vehicle->needs_review = ! self::complete($vehicle->only(['axle_load_front_kg', 'axle_load_rear_kg', 'max_speed_kmh']));
                    $vehicle->save();
                } elseif ($entry['status'] === self::MERGE) {
                    $merges[] = $car;
                }
            }

            // The Gutachten cars: through the merge itself, so it fills only empty fields and writes its own Protokoll.
            if ($merges !== []) {
                $this->merge->apply($this->merge->plan($merges), $admin);
            }

            $import->forceFill(['status' => VehicleImport::APPLIED, 'applied_at' => now(), 'applied_by' => $admin->id, 'plan' => $plan, 'summary' => $summary])->save();
            VehicleImport::rememberMapping($source, $import->mapping);

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
     * not —, as the catalogue's import compares its own (CatalogueImporter::fingerprint).
     *
     * @param  list<array<string, mixed>>  $plan
     */
    public static function fingerprint(array $plan): string
    {
        $sorted = static function (mixed $value) use (&$sorted): mixed {
            if (! is_array($value)) {
                return $value;
            }

            if (! array_is_list($value)) {
                ksort($value);
            }

            return array_map($sorted, $value);
        };

        return hash('sha256', (string) json_encode($sorted($plan)));
    }
}
