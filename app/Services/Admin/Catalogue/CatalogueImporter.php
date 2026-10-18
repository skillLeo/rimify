<?php

declare(strict_types=1);

namespace App\Services\Admin\Catalogue;

use App\Enums\CatalogueStatus;
use App\Http\Requests\Admin\WheelModelRequest;
use App\Models\AdminUser;
use App\Models\Brand;
use App\Models\CatalogueImport;
use App\Models\Setting;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\AuditTrail;
use App\Support\CatalogueVersion;
use App\Support\GermanFormat;
use App\Support\GermanNumber;
use App\Support\Money;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * A supplier feed into Katalog › Felgen: read, mapped, checked in a Probelauf, applied, and — if it
 * was wrong — taken back whole (the review release §4.2, BLOCKED #1).
 *
 * One row is one size. It is found by its SKU: a known SKU may change its price, stock, EAN, KBA
 * number and weight; a new SKU becomes a new size, under a brand, model and finish found by name or
 * created. What an import never does, it refuses row by row with a sentence, and the rest goes on:
 *
 *   - change a known size's measurements, model or finish — an approval may name that size;
 *   - touch a demo row;
 *   - publish: every model it creates is a draft.
 *
 * The import applies what the Probelauf showed, and only if the catalogue still reads the same: if
 * anything changed in between, it asks for a new Probelauf instead of applying a different plan.
 *
 * Parameter binding only (R-14). No brand, no path and no count is assumed: the file says them.
 *
 * @phpstan-type PlanRow array{line: int, sku: string, action: string, label: string, changes: list<array{field: string, from: string, to: string}>, reasons: list<string>, new: array{brand: bool, model: bool, finish: bool}}
 */
final class CatalogueImporter
{
    public const MAX_ROWS = 5000;

    public const MAX_BYTES = 5 * 1024 * 1024;

    /**
     * The fields a row can carry: label, whether a file must map it, and the headers it is found
     * under without being told (compared lower-case, umlauts spelled out, punctuation dropped).
     */
    public const FIELDS = [
        'sku' => ['label' => 'SKU (Artikelnummer)', 'required' => true, 'headers' => ['sku', 'artikelnummer', 'artnr', 'artikelnr', 'article', 'articlenumber', 'itemnumber', 'herstellernummer']],
        'marke' => ['label' => 'Marke', 'required' => true, 'headers' => ['marke', 'hersteller', 'brand', 'manufacturer']],
        'modell' => ['label' => 'Modell', 'required' => true, 'headers' => ['modell', 'model', 'design', 'modellname']],
        'ausfuehrung' => ['label' => 'Ausführung (Farbe)', 'required' => true, 'headers' => ['ausfuehrung', 'farbe', 'color', 'colour', 'finish', 'oberflaeche']],
        'durchmesser' => ['label' => 'Durchmesser (Zoll)', 'required' => true, 'headers' => ['durchmesser', 'zoll', 'diameter', 'felgendurchmesser', 'rimdiameter']],
        'breite' => ['label' => 'Breite (Zoll)', 'required' => true, 'headers' => ['breite', 'width', 'felgenbreite', 'maulweite']],
        'et' => ['label' => 'Einpresstiefe (ET, mm)', 'required' => true, 'headers' => ['et', 'einpresstiefe', 'offset', 'etmm']],
        'lochzahl' => ['label' => 'Lochzahl', 'required' => false, 'headers' => ['lochzahl', 'loecher', 'bolts', 'holes', 'anzahlloecher']],
        'lochkreis' => ['label' => 'Lochkreis (mm) oder Lochbild (5x112)', 'required' => true, 'headers' => ['lochkreis', 'lk', 'pcd', 'lochbild', 'boltpattern', 'boltcircle']],
        'mittenloch' => ['label' => 'Mittenlochbohrung (mm)', 'required' => true, 'headers' => ['mittenloch', 'mittenlochbohrung', 'mlb', 'nabenbohrung', 'centerbore', 'centrebore', 'cb']],
        'preis' => ['label' => 'Preis je Felge (€)', 'required' => true, 'headers' => ['preis', 'price', 'vk', 'verkaufspreis', 'vkpreis']],
        'bestand' => ['label' => 'Bestand', 'required' => false, 'headers' => ['bestand', 'lager', 'lagerbestand', 'stock', 'qty', 'menge']],
        'ean' => ['label' => 'EAN', 'required' => false, 'headers' => ['ean', 'gtin', 'barcode']],
        'kba' => ['label' => 'KBA-Nummer', 'required' => false, 'headers' => ['kba', 'kbanummer', 'kbanr']],
        'gewicht' => ['label' => 'Gewicht (g)', 'required' => false, 'headers' => ['gewicht', 'weight', 'gewichtg']],
        'speichen' => ['label' => 'Speichen', 'required' => false, 'headers' => ['speichen', 'spokes', 'speichenzahl']],
    ];

    /** What a known size may have changed by an import, with how each value reads. */
    private const UPDATABLE = [
        'price_cents' => 'Preis',
        'stock_qty' => 'Bestand',
        'ean' => 'EAN',
        'kba_number' => 'KBA-Nummer',
        'weight_g' => 'Gewicht',
    ];

    /**
     * The headers a file's columns match without a mapping, by field.
     *
     * @param  list<string>  $headers
     * @param  array<string, string>|null  $saved  the last mapping used, which wins where its header is present
     * @return array<string, string>
     */
    public static function guessMapping(array $headers, ?array $saved = null): array
    {
        $mapping = [];
        $byKey = [];

        foreach ($headers as $header) {
            $byKey[self::headerKey($header)] ??= $header;
        }

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

    public static function headerKey(string $header): string
    {
        $key = mb_strtolower(trim($header));
        $key = strtr($key, ['ä' => 'ae', 'ö' => 'oe', 'ü' => 'ue', 'ß' => 'ss']);

        return (string) preg_replace('/[^a-z0-9]/', '', $key);
    }

    /**
     * Before suppliers were named: the mapping of the last import that went through. Still read for a
     * file whose supplier is not given, never written again.
     */
    public const MAPPING_SETTING = 'catalogue_import_mapping';

    /**
     * The mapping of each supplier's last import that went through, keyed by the supplier's name as
     * supplierKey() reads it (`''` for a file without one): the next file from that supplier starts
     * from it (COMPLIANCE row 25).
     */
    public const MAPPINGS_SETTING = 'catalogue_import_mappings';

    /** A supplier's name as the saved mappings are keyed: case, umlauts and punctuation do not matter. */
    public static function supplierKey(?string $supplier): string
    {
        if ($supplier === null || trim($supplier) === '') {
            return '';
        }

        $key = self::headerKey($supplier);

        // A name without Latin letters or digits („Ωμέγα“) keeps its own key rather than sharing the
        // mapping of files without a supplier (K2-27).
        return $key !== '' ? $key : 'u:'.mb_strtolower(trim($supplier));
    }

    /**
     * Whether a mapping stands as this supplier's last import left it — and that memory decided
     * something the column names alone would not have (K2-18).
     *
     * @param  array<string, string>  $mapping
     * @param  list<string>  $headers
     */
    public static function rememberedFor(array $mapping, array $headers, ?string $supplier): bool
    {
        $saved = self::savedMapping($supplier);

        if ($saved === null) {
            return false;
        }

        $fromMemory = self::guessMapping($headers, $saved);

        return $fromMemory !== self::guessMapping($headers) && $mapping == $fromMemory;
    }

    /**
     * The mapping this supplier's last import went through with, if there is one.
     *
     * @return array<string, string>|null
     */
    public static function savedMapping(?string $supplier): ?array
    {
        $key = self::supplierKey($supplier);
        $all = Setting::get(self::MAPPINGS_SETTING);
        $saved = is_array($all) && is_array($all[$key] ?? null) ? $all[$key] : null;

        if ($saved === null && $key === '') {
            $legacy = Setting::get(self::MAPPING_SETTING);
            $saved = is_array($legacy) ? $legacy : null;
        }

        return $saved === null ? null : array_filter($saved, static fn (mixed $header, mixed $field): bool => is_string($field) && is_string($header), ARRAY_FILTER_USE_BOTH);
    }

    /**
     * Reads a file and makes a Probelauf of it: the columns mapped (as given, or as this supplier's last
     * import had them, or by their names), every row planned against the catalogue as it is now. Nothing
     * is written to the catalogue. A mapping that leaves a required field without a column is kept, with
     * no plan, so the page can ask for the missing columns.
     *
     * @param  array{name: string, format: string, sha256: string, headers: list<string>, rows: list<array<string, string>>}  $file
     * @param  array<string, string>|null  $mapping
     */
    public function preview(array $file, ?array $mapping, bool $pointIsDecimal, AdminUser $admin, ?string $supplier = null): CatalogueImport
    {
        $saved = self::savedMapping($supplier);
        $mapping ??= self::guessMapping($file['headers'], $saved);

        $import = new CatalogueImport([
            'admin_user_id' => $admin->id,
            'file_name' => mb_substr($file['name'], 0, 200),
            'supplier' => $supplier,
            'mapping_remembered' => self::rememberedFor($mapping, $file['headers'], $supplier),
            // A workbook's numbers arrive as German text (CatalogueFile): never read with a point.
            'file_format' => $file['format'],
            'file_sha256' => $file['sha256'],
            'status' => CatalogueImport::PREVIEWED,
            'source' => ['headers' => $file['headers'], 'rows' => $file['rows']],
        ]);

        $this->evaluate($import, $mapping, $pointIsDecimal && $file['format'] !== 'xlsx');
        $import->save();

        return $import;
    }

    /**
     * The same file under another mapping, or read with the other decimal mark.
     *
     * @param  array<string, string>  $mapping
     */
    public function remap(CatalogueImport $import, array $mapping, bool $pointIsDecimal): CatalogueImport
    {
        $this->evaluate($import, $mapping, $pointIsDecimal && $import->file_format !== 'xlsx');
        // The note follows the mapping now on screen, not the one the file opened with (K2-18).
        $import->mapping_remembered = self::rememberedFor($import->mapping, $import->source['headers'], $import->supplier);
        $import->save();

        return $import;
    }

    /**
     * The fields a file must carry and this mapping leaves without a column.
     *
     * @param  array<string, string>  $mapping
     * @param  list<string>  $headers
     * @return list<string> their labels
     */
    public static function missing(array $mapping, array $headers): array
    {
        $missing = [];

        foreach (self::FIELDS as $field => $spec) {
            if ($spec['required'] && ! in_array($mapping[$field] ?? null, $headers, true)) {
                $missing[] = $spec['label'];
            }
        }

        return $missing;
    }

    /** @param  array<string, string>  $mapping */
    private function evaluate(CatalogueImport $import, array $mapping, bool $pointIsDecimal): void
    {
        $headers = $import->source['headers'];
        // Only the file's own columns: a mapping naming a column the file lacks maps nothing.
        $mapping = array_filter($mapping, static fn (string $h): bool => in_array($h, $headers, true));
        $rows = [];

        foreach ($import->source['rows'] as $raw) {
            $row = ['_decimal' => $pointIsDecimal ? 'punkt' : 'komma', '_line' => $raw['_line'] ?? null];

            foreach (array_keys(self::FIELDS) as $field) {
                $header = $mapping[$field] ?? null;
                $row[$field] = $header === null ? null : trim((string) ($raw[$header] ?? ''));
            }

            $rows[] = $row;
        }

        $complete = self::missing($mapping, $headers) === [];
        [$plan, $summary] = $complete ? $this->plan($rows) : [[], []];

        $import->forceFill([
            'mapping' => $mapping,
            'decimal' => $pointIsDecimal ? 'punkt' : 'komma',
            'rows' => $rows,
            'plan' => $plan,
            'summary' => $summary,
        ]);
    }

    /**
     * Applies a Probelauf. Planned again first: if the catalogue no longer reads the way it did, the
     * import refuses and asks for a new Probelauf rather than applying a plan nobody has seen.
     */
    public function apply(CatalogueImport $import, AdminUser $admin): CatalogueImport
    {
        if (self::missing($import->mapping, $import->source['headers']) !== []) {
            throw ValidationException::withMessages(['import' => 'Ordne zuerst jedem Pflichtfeld eine Spalte zu und mach den Probelauf.']);
        }

        if ((int) ($import->summary['create'] ?? 0) + (int) ($import->summary['update'] ?? 0) === 0) {
            throw ValidationException::withMessages(['import' => 'Der Probelauf hat nichts zu importieren gefunden.']);
        }

        [$plan] = $this->plan($import->rows);

        if (self::fingerprint($plan) !== self::fingerprint($import->plan)) {
            throw ValidationException::withMessages(['import' => 'Der Katalog hat sich seit dem Probelauf geändert. Mach bitte einen neuen Probelauf, bevor du importierst.']);
        }

        return DB::transaction(function () use ($import, $plan, $admin): CatalogueImport {
            $undo = ['brands' => [], 'restored_brands' => [], 'models' => [], 'finishes' => [], 'configs' => [], 'updated' => []];

            foreach ($plan as $i => $entry) {
                if ($entry['action'] === 'create') {
                    $this->create($import->rows[$i], $undo);
                } elseif ($entry['action'] === 'update') {
                    $this->update($import->rows[$i], $undo);
                }
            }

            $import->forceFill(['status' => CatalogueImport::APPLIED, 'undo' => $undo, 'applied_at' => now()])->save();
            $mappings = Setting::get(self::MAPPINGS_SETTING);
            // array_replace, not a spread: a supplier named by digits alone is an integer key, and kept.
            Setting::set(self::MAPPINGS_SETTING, array_replace(is_array($mappings) ? $mappings : [], [self::supplierKey($import->supplier) => $import->mapping]));

            AuditTrail::record($admin, 'catalogue.imported', [
                'file' => $import->file_name,
                'summary' => $import->summary,
            ], $import);

            // One new version for the whole file, once it commits (D-294).
            CatalogueVersion::changed();

            return $import;
        });
    }

    /**
     * Takes an import back: the values it replaced return, the rows it created go. Refused — whole —
     * if anything built on it since: a changed price, an approval entered for a new size, an order,
     * a model put into the shop.
     */
    public function rollback(CatalogueImport $import, AdminUser $admin): CatalogueImport
    {
        $undo = $import->undo ?? [];
        $configs = array_map('intval', (array) ($undo['configs'] ?? []));
        $models = array_map('intval', (array) ($undo['models'] ?? []));
        $problems = [];

        foreach ((array) ($undo['updated'] ?? []) as $update) {
            $row = WheelConfig::query()->find((int) $update['id']);

            if (! $row instanceof WheelConfig) {
                $problems[] = 'Eine geänderte Größe gibt es nicht mehr.';

                continue;
            }

            foreach ((array) $update['after'] as $field => $value) {
                if ((string) $row->getAttribute($field) !== (string) $value) {
                    $problems[] = 'Die Größe '.$row->getAttribute('sku').' wurde seit dem Import noch einmal geändert.';

                    break;
                }
            }
        }

        if ($configs !== [] && DB::table('fitments')->whereIn('wheel_config_id', $configs)->exists()) {
            $problems[] = 'Für importierte Größen wurden inzwischen Freigaben eingetragen.';
        }

        if ($import->applied_at !== null && $configs !== [] && WheelConfig::withTrashed()->whereIn('id', $configs)->where('updated_at', '>', $import->applied_at)->exists()) {
            $problems[] = 'Importierte Größen wurden seit dem Import geändert.';
        }

        if ($configs !== [] && DB::table('order_lines')->whereIn('wheel_config_id', $configs)->exists()) {
            $problems[] = 'Importierte Größen wurden inzwischen bestellt.';
        }

        if ($models !== [] && WheelModel::withTrashed()->whereIn('id', $models)->where('status', '<>', CatalogueStatus::Draft->value)->exists()) {
            $problems[] = 'Ein importiertes Modell ist inzwischen veröffentlicht oder archiviert.';
        }

        if ($problems !== []) {
            throw ValidationException::withMessages(['import' => 'Der Import lässt sich nicht mehr zurücknehmen: '.implode(' ', array_unique($problems))]);
        }

        try {
            return DB::transaction(function () use ($import, $undo, $configs, $models, $admin): CatalogueImport {
                foreach ((array) ($undo['updated'] ?? []) as $update) {
                    WheelConfig::query()->whereKey((int) $update['id'])->update((array) $update['before']);
                }

                // Created by this import, referenced by nothing (checked above): gone, so the same file
                // can be imported again once its mapping is right.
                // A row still pointed at — even by a soft-deleted one — stays.
                $trashed = static fn ($q) => $q->withTrashed();
                WheelConfig::withTrashed()->whereIn('id', $configs)->forceDelete();
                WheelFinish::withTrashed()->whereIn('id', array_map('intval', (array) ($undo['finishes'] ?? [])))->whereDoesntHave('configs', $trashed)->forceDelete();
                WheelModel::withTrashed()->whereIn('id', $models)->whereDoesntHave('configs', $trashed)->whereDoesntHave('finishes', $trashed)->forceDelete();
                Brand::withTrashed()->whereIn('id', array_map('intval', (array) ($undo['brands'] ?? [])))->whereDoesntHave('wheelModels', $trashed)->forceDelete();
                // A brand the import brought back goes back to where it was: removed, never deleted.
                Brand::query()->whereIn('id', array_map('intval', (array) ($undo['restored_brands'] ?? [])))->whereDoesntHave('wheelModels', $trashed)->get()->each(static fn (Brand $b) => $b->delete());

                $import->forceFill(['status' => CatalogueImport::ROLLED_BACK, 'rolled_back_at' => now(), 'rolled_back_by' => $admin->id])->save();

                AuditTrail::record($admin, 'catalogue.import_rolled_back', [
                    'file' => $import->file_name,
                    'summary' => $import->summary,
                ], $import);

                // The rows above went in bulk, past their models: a new version once it commits (D-294).
                CatalogueVersion::changed();

                return $import;
            });
        } catch (QueryException) {
            throw ValidationException::withMessages(['import' => 'Der Import lässt sich nicht mehr zurücknehmen: Andere Daten verweisen inzwischen auf importierte Größen.']);
        }
    }

    /**
     * @param  list<array<string, string|null>>  $rows
     * @return array{0: list<PlanRow>, 1: array<string, int>}
     */
    private function plan(array $rows): array
    {
        $plan = [];
        $seenSku = [];
        $seenSize = [];
        $summary = ['create' => 0, 'update' => 0, 'unchanged' => 0, 'refused' => 0, 'brands' => 0, 'models' => 0, 'finishes' => 0];
        $newBrands = [];
        $newModels = [];
        $newFinishes = [];

        foreach ($rows as $i => $row) {
            // The file's own line, as a spreadsheet shows it — blank lines included.
            $line = isset($row['_line']) ? (int) $row['_line'] : $i + 2;
            $parsed = self::parse($row);
            $sku = (string) ($row['sku'] ?? '');
            $entry = ['line' => $line, 'sku' => $sku, 'action' => 'refused', 'label' => $parsed['label'], 'changes' => [], 'reasons' => $parsed['errors'], 'new' => ['brand' => false, 'model' => false, 'finish' => false]];

            $skuKey = mb_strtolower($sku);

            if ($sku !== '' && isset($seenSku[$skuKey])) {
                $entry['reasons'][] = 'Die SKU steht doppelt in der Datei (zuerst in Zeile '.$seenSku[$skuKey].').';
            }

            if ($sku !== '') {
                $seenSku[$skuKey] ??= $line;
            }

            if ($entry['reasons'] === []) {
                $entry = $this->planRow($parsed, $entry, $seenSize);
            }

            if ($entry['action'] === 'create') {
                $v = $parsed['values'];
                $brandKey = mb_strtolower($v['brand']);
                $modelKey = $brandKey.'|'.mb_strtolower($v['model']);

                if ($entry['new']['brand']) {
                    $newBrands[$brandKey] = true;
                }

                if ($entry['new']['model']) {
                    $newModels[$modelKey] = true;
                }

                if ($entry['new']['finish']) {
                    $newFinishes[$modelKey.'|'.mb_strtolower($v['finish'])] = true;
                }
            }

            $summary[$entry['action']]++;
            $plan[] = $entry;
        }

        $summary['brands'] = count($newBrands);
        $summary['models'] = count($newModels);
        $summary['finishes'] = count($newFinishes);

        return [$plan, $summary];
    }

    /**
     * @param  array{values: array<string, mixed>, errors: list<string>, label: string}  $parsed
     * @param  PlanRow  $entry
     * @param  array<string, int>  $seenSize
     * @return PlanRow
     */
    private function planRow(array $parsed, array $entry, array &$seenSize): array
    {
        $v = $parsed['values'];
        $existing = WheelConfig::withTrashed()->with(['wheelModel' => static fn ($m) => $m->withTrashed()->with('brand'), 'wheelFinish' => static fn ($f) => $f->withTrashed()])
            ->whereRaw('LOWER(sku) = ?', [mb_strtolower($entry['sku'])])
            ->first();

        if ($existing instanceof WheelConfig) {
            return $this->planUpdate($existing, $v, $entry);
        }

        $brand = Brand::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($v['brand'])])->first();
        $model = $brand === null ? null : WheelModel::query()->where('brand_id', $brand->id)->whereRaw('LOWER(name) = ?', [mb_strtolower($v['model'])])->first();

        if ($model instanceof WheelModel && $model->is_demo) {
            $entry['reasons'][] = 'Das Modell gehört zu den Demodaten. Ein Import ändert keine Demodaten.';

            return $entry;
        }

        if ($model instanceof WheelModel && $model->status === CatalogueStatus::Archived) {
            $entry['reasons'][] = 'Das Modell ist archiviert. Stell es im Katalog wieder her, bevor du Größen dazu importierst.';

            return $entry;
        }

        $finish = $model === null ? null : WheelFinish::query()->where('wheel_model_id', $model->id)->whereRaw('LOWER(name_de) = ?', [mb_strtolower($v['finish'])])->first();

        if ($finish instanceof WheelFinish) {
            $clash = WheelConfig::withTrashed()->where('wheel_finish_id', $finish->id)
                ->where('diameter_in', $v['diameter_in'])->where('width_in', $v['width_in'])
                ->where('et_mm', $v['et_mm'])->where('bolt_circle_mm', $v['bolt_circle_mm'])
                ->value('sku');

            if ($clash !== null) {
                $entry['reasons'][] = 'Diese Größe gibt es in dieser Ausführung schon, unter der SKU '.$clash.'.';

                return $entry;
            }
        }

        $sizeKey = mb_strtolower($v['brand'].'|'.$v['model'].'|'.$v['finish']).'|'.$v['diameter_in'].'|'.$v['width_in'].'|'.$v['et_mm'].'|'.$v['bolt_circle_mm'];

        if (isset($seenSize[$sizeKey])) {
            $entry['reasons'][] = 'Diese Größe steht in dieser Ausführung schon in Zeile '.$seenSize[$sizeKey].'.';

            return $entry;
        }

        $seenSize[$sizeKey] = $entry['line'];
        $entry['action'] = 'create';
        $entry['new'] = ['brand' => $brand === null, 'model' => $model === null, 'finish' => $finish === null];

        return $entry;
    }

    /**
     * @param  array<string, mixed>  $v
     * @param  PlanRow  $entry
     * @return PlanRow
     */
    private function planUpdate(WheelConfig $existing, array $v, array $entry): array
    {
        $model = $existing->wheelModel;

        if ($existing->trashed() || $model === null || $model->trashed()) {
            $entry['reasons'][] = 'Die SKU gehört zu einer entfernten Größe. Stell sie im Katalog wieder her oder gib eine neue SKU.';

            return $entry;
        }

        if ($model->is_demo) {
            $entry['reasons'][] = 'Die SKU gehört zu den Demodaten. Ein Import ändert keine Demodaten.';

            return $entry;
        }

        $same = mb_strtolower($model->brand->name) === mb_strtolower($v['brand'])
            && mb_strtolower($model->name) === mb_strtolower($v['model'])
            && mb_strtolower((string) $existing->wheelFinish?->name_de) === mb_strtolower($v['finish'])
            && (float) $existing->diameter_in === (float) $v['diameter_in']
            && (float) $existing->width_in === (float) $v['width_in']
            && $existing->et_mm === $v['et_mm']
            && (int) $existing->getAttribute('bolt_holes') === $v['bolt_holes']
            && (float) $existing->getAttribute('bolt_circle_mm') === (float) $v['bolt_circle_mm']
            && (float) $existing->getAttribute('centre_bore_mm') === (float) $v['centre_bore_mm'];

        if (! $same) {
            $entry['reasons'][] = 'Die SKU gehört zu „'.$model->brand->name.' '.$model->name.' · '.$existing->label().'“. Maße, Modell und Ausführung ändert ein Import nie – eine Freigabe kann an dieser Größe hängen.';

            return $entry;
        }

        foreach (self::UPDATABLE as $field => $label) {
            $to = $v[$field] ?? null;

            // A column the file does not carry, or an empty cell, leaves the value as it is.
            if ($to === null) {
                continue;
            }

            $from = $existing->getAttribute($field);

            if ((string) $from !== (string) $to) {
                $entry['changes'][] = ['field' => $label, 'from' => self::show($field, $from), 'to' => self::show($field, $to)];
            }
        }

        $entry['action'] = $entry['changes'] === [] ? 'unchanged' : 'update';

        return $entry;
    }

    /**
     * One row's values, read the German way (or the file's own way with `_decimal = punkt`), and every
     * cell that could not be read, as sentences.
     *
     * @param  array<string, string|null>  $row
     * @return array{values: array<string, mixed>, errors: list<string>, label: string}
     */
    public static function parse(array $row): array
    {
        $point = ($row['_decimal'] ?? 'komma') === 'punkt';
        $errors = [];
        $text = static fn (string $f): string => trim((string) ($row[$f] ?? ''));

        foreach (['sku' => 'Die SKU fehlt.', 'marke' => 'Die Marke fehlt.', 'modell' => 'Das Modell fehlt.', 'ausfuehrung' => 'Die Ausführung fehlt.'] as $field => $sentence) {
            if ($text($field) === '') {
                $errors[] = $sentence;
            }
        }

        if ($text('sku') !== '' && preg_match('/^[A-Za-z0-9._\-\/]{1,64}$/', $text('sku')) !== 1) {
            $errors[] = 'Die SKU darf nur Buchstaben, Ziffern und . _ - / enthalten und höchstens 64 Zeichen lang sein.';
        }

        $measure = static function (string $field, int $places, int $min, int $max, string $sentence) use ($text, $point, &$errors): ?string {
            $value = GermanNumber::parse($text($field), $places, false, $point);

            if ($value === null || (float) $value < $min || (float) $value > $max) {
                $errors[] = $sentence;

                return null;
            }

            return $value;
        };

        $diameter = $measure('durchmesser', 1, 12, 26, 'Den Durchmesser können wir nicht lesen (Zoll, zwischen 12 und 26).');
        $width = $measure('breite', 2, 4, 14, 'Die Breite können wir nicht lesen (Zoll, zwischen 4 und 14).');
        $et = GermanNumber::integer($text('et'), true);

        if ($et === null || $et < -99 || $et > 99) {
            $errors[] = 'Die Einpresstiefe können wir nicht lesen (ganze Millimeter, zwischen −99 und 99).';
            $et = null;
        }

        // `5x112` in one column, or the hole count in its own.
        $pattern = $text('lochkreis');
        $holes = null;

        if (preg_match('/^(\d{1,2})\s*[x×\/]\s*(.+)$/u', $pattern, $m) === 1) {
            $holes = (int) $m[1];
            $pattern = $m[2];
        } elseif ($text('lochzahl') !== '') {
            $holes = GermanNumber::integer($text('lochzahl'));
        }

        if ($holes === null || ! in_array($holes, [3, 4, 5, 6, 8, 10], true)) {
            $errors[] = 'Die Lochzahl fehlt oder ist ungewöhnlich (3, 4, 5, 6, 8 oder 10).';
            $holes = null;
        }

        $circle = GermanNumber::parse($pattern, 1, false, $point);

        if ($circle === null || (float) $circle < 90 || (float) $circle > 210) {
            $errors[] = 'Den Lochkreis können wir nicht lesen (Millimeter, zwischen 90 und 210).';
            $circle = null;
        }

        $bore = $measure('mittenloch', 2, 50, 90, 'Die Mittenlochbohrung können wir nicht lesen (Millimeter, zwischen 50 und 90).');

        $priceText = $text('preis');

        if ($point) {
            $priceText = str_replace(',', '', $priceText);
            $priceText = str_replace('.', ',', $priceText);
        }

        $price = Money::fromGerman($priceText);

        if ($price === null || $price <= 0) {
            $errors[] = 'Den Preis können wir nicht lesen.';
        }

        // An optional column that is missing or empty leaves the value alone; one that is there must read.
        $optional = static function (string $field, callable $read, string $sentence) use ($text, &$errors): mixed {
            $raw = $text($field);

            if ($raw === '') {
                return null;
            }

            $value = $read($raw);

            if ($value === null) {
                $errors[] = $sentence;
            }

            return $value;
        };

        $stock = $optional('bestand', static fn (string $r): ?int => ($n = GermanNumber::integer($r)) !== null && $n <= 100000 ? $n : null, 'Den Bestand können wir nicht lesen (ganze Zahl ab 0).');
        $ean = $optional('ean', static fn (string $r): ?string => preg_match('/^\d{8,14}$/', $r) === 1 ? $r : null, 'Die EAN besteht aus 8 bis 14 Ziffern.');
        $kba = $optional('kba', static fn (string $r): ?string => mb_strlen($r) <= 32 ? $r : null, 'Die KBA-Nummer ist länger als 32 Zeichen.');
        $weight = $optional('gewicht', static fn (string $r): ?int => ($n = GermanNumber::integer($r)) !== null && $n >= 1000 && $n <= 40000 ? $n : null, 'Das Gewicht bitte in Gramm, zwischen 1.000 und 40.000.');
        $spokes = $optional('speichen', static fn (string $r): ?int => in_array($n = GermanNumber::integer($r), WheelModelRequest::SPOKES, true) ? $n : null, 'Die Speichenzahl muss 5, 6, 7, 10 oder 20 sein.');

        $label = trim($text('marke').' '.$text('modell')).($text('ausfuehrung') === '' ? '' : ' · '.$text('ausfuehrung'));

        if ($diameter !== null && $width !== null && $et !== null) {
            $label .= ' · '.GermanFormat::wheelSize($width, $diameter, $et);
        }

        if ($holes !== null && $circle !== null) {
            $label .= ' · '.GermanFormat::boltPattern($holes, $circle);
        }

        return [
            'values' => [
                'brand' => $text('marke'),
                'model' => $text('modell'),
                'finish' => $text('ausfuehrung'),
                'diameter_in' => $diameter,
                'width_in' => $width,
                'et_mm' => $et,
                'bolt_holes' => $holes,
                'bolt_circle_mm' => $circle,
                'centre_bore_mm' => $bore,
                'price_cents' => $price,
                'stock_qty' => $stock,
                'ean' => $ean,
                'kba_number' => $kba,
                'weight_g' => $weight,
                'spoke_count' => $spokes,
            ],
            'errors' => $errors,
            'label' => $label === '' ? 'Zeile ohne Angaben' : $label,
        ];
    }

    /**
     * @param  array<string, string|null>  $row
     * @param  array{brands: list<int>, restored_brands: list<int>, models: list<int>, finishes: list<int>, configs: list<int>, updated: list<array<string, mixed>>}  $undo
     */
    private function create(array $row, array &$undo): void
    {
        $v = self::parse($row)['values'];

        $brand = Brand::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($v['brand'])])->first();

        // A removed brand of that name comes back — its id, its slug, its logo — as on the Marken page and in
        // the Felge form, rather than a second one at `…-2` (K2-35). Taking the import back removes it again.
        if (! $brand instanceof Brand) {
            $removed = Brand::onlyTrashed()->whereRaw('LOWER(name) = ?', [mb_strtolower($v['brand'])])->latest('deleted_at')->first();

            if ($removed instanceof Brand && ! Brand::query()->where('slug', $removed->slug)->exists()) {
                $removed->restore();
                $brand = $removed;
                $undo['restored_brands'][] = (int) $removed->id;
            }
        }

        if (! $brand instanceof Brand) {
            $brand = Brand::query()->create([
                'name' => $v['brand'],
                'slug' => self::uniqueSlug(Brand::class, $v['brand']),
                'is_wheel_brand' => true,
                'sort_order' => (int) Brand::query()->max('sort_order') + 10,
            ]);
            $undo['brands'][] = (int) $brand->id;
        }

        $model = WheelModel::query()->where('brand_id', $brand->id)->whereRaw('LOWER(name) = ?', [mb_strtolower($v['model'])])->first();

        if (! $model instanceof WheelModel) {
            $model = WheelModel::query()->create([
                'brand_id' => $brand->id,
                'name' => $v['model'],
                'slug' => WheelEditor::slug($brand->name.' '.$v['model']),
                'spoke_count' => $v['spoke_count'] ?? 5,
                // An import never publishes.
                'status' => CatalogueStatus::Draft->value,
                'is_demo' => false,
            ]);
            $undo['models'][] = (int) $model->id;
        }

        $finish = WheelFinish::query()->where('wheel_model_id', $model->id)->whereRaw('LOWER(name_de) = ?', [mb_strtolower($v['finish'])])->first();

        if (! $finish instanceof WheelFinish) {
            $finish = WheelFinish::query()->create([
                'wheel_model_id' => $model->id,
                'name_de' => $v['finish'],
                'art_finish' => 'graphite',
                'sort_order' => ((int) WheelFinish::query()->where('wheel_model_id', $model->id)->max('sort_order')) + 10,
            ]);
            $undo['finishes'][] = (int) $finish->id;
        }

        $config = WheelConfig::query()->create([
            'wheel_model_id' => $model->id,
            'wheel_finish_id' => $finish->id,
            'diameter_in' => $v['diameter_in'],
            'width_in' => $v['width_in'],
            'et_mm' => $v['et_mm'],
            'bolt_holes' => $v['bolt_holes'],
            'bolt_circle_mm' => $v['bolt_circle_mm'],
            'centre_bore_mm' => $v['centre_bore_mm'],
            'sku' => trim((string) $row['sku']),
            'ean' => $v['ean'],
            'kba_number' => $v['kba_number'],
            'price_cents' => $v['price_cents'],
            'currency' => 'EUR',
            'stock_qty' => $v['stock_qty'] ?? 0,
            'weight_g' => $v['weight_g'],
        ]);
        $undo['configs'][] = (int) $config->id;
    }

    /**
     * @param  array<string, string|null>  $row
     * @param  array{brands: list<int>, models: list<int>, finishes: list<int>, configs: list<int>, updated: list<array<string, mixed>>}  $undo
     */
    private function update(array $row, array &$undo): void
    {
        $v = self::parse($row)['values'];
        $config = WheelConfig::query()->whereRaw('LOWER(sku) = ?', [mb_strtolower(trim((string) $row['sku']))])->firstOrFail();
        $before = [];
        $after = [];

        foreach (array_keys(self::UPDATABLE) as $field) {
            if ($v[$field] === null || (string) $config->getAttribute($field) === (string) $v[$field]) {
                continue;
            }

            $before[$field] = $config->getAttribute($field);
            $after[$field] = $v[$field];
        }

        if ($after === []) {
            return;
        }

        $config->forceFill($after)->save();
        $undo['updated'][] = ['id' => (int) $config->id, 'before' => $before, 'after' => $after];
    }

    /**
     * What a plan says, independent of how it was stored: a JSON column keeps object keys in an order
     * of its own, so keys are sorted before the plan is compared.
     *
     * @param  list<array<string, mixed>>  $plan
     */
    private static function fingerprint(array $plan): string
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

        return hash('sha256', (string) json_encode($sorted(array_map(static fn (array $e): array => [$e['action'], $e['changes'], $e['reasons'], $e['new']], $plan))));
    }

    private static function show(string $field, mixed $value): string
    {
        if ($value === null || $value === '') {
            return '–';
        }

        return match ($field) {
            'price_cents' => GermanFormat::money((int) $value),
            'stock_qty' => GermanFormat::integer((int) $value),
            'weight_g' => GermanFormat::integer((int) $value).' g',
            default => (string) $value,
        };
    }

    /** @param  class-string<Brand>  $class */
    private static function uniqueSlug(string $class, string $name): string
    {
        $base = Str::slug($name, '-', 'de') ?: 'marke';
        $slug = $base;
        $n = 2;

        while ($class::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$n++;
        }

        return $slug;
    }
}
