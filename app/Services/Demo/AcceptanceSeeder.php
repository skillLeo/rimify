<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Enums\CatalogueStatus;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\BalanceWeightColour;
use App\Models\TpmsSensorPrice;
use App\Models\Vehicle;
use App\Models\WheelModel;
use App\Support\MakeName;
use Database\Seeders\CatalogueSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Writes the acceptance set (`rimify:demo --abnahme`, the operator's brief „THE 34“ §1.3): enough of a shop to show the
 * client's 34 points, and nothing more — every row born demo under `abnahme:`, so System › Zurücksetzen › Demodaten takes
 * all of it away in one press (DemoCatalogue).
 *
 * - The BORBET DB8GT2 in its two photographed finishes (the client's four photographs), 18 and 19 Zoll, at the client's
 *   prices (229,00 € and 269,00 € a rim, 12 of each) — the golden record's values (GoldenRecordSeeder).
 * - Its two real Gutachten as the team entered them — ABE 55255 (19 Zoll) and the Nachtrag 366-0350-21-WIRD/N1
 *   (18 Zoll) — with every Auflage (content/abnahme/gutachten.php), released with their PDFs: the very files, checked
 *   by their SHA-256, which this machine must hold (the client's documents stay out of the public repository).
 * - Three demo cars the documents name, with the figures of their papers the tyres are judged by: BMW 3er E90 320i
 *   (19 Zoll: „Freigegeben“), BMW 3er E46 320i (19 Zoll: „Mit Auflagen“ — Abnahme, Radlauf hinten) and BMW X3 E83 2.0d.
 *   Labelled „(Demo)“, with key numbers no real car carries (HSN 0005, TSN Z46/Z90/Z83).
 * - Summer tyres of the invented maker „Laufwerk“ in every size those rows permit, no EU label (D7, as CatalogueSeeder).
 * - The Komplettrad's accessories (#15) where the shop has none of its own: Wuchtgewichte Silber and Schwarz, and an
 *   RDKS price for BMW. A shop that has its own keeps them, untouched.
 *
 * Refused where it would double something real: a real DB8GT2, or a real ABE 55255 / Nachtrag in the shop.
 */
final class AcceptanceSeeder
{
    public const WHEEL_REF = AcceptanceSet::PREFIX.'wheel:db8gt2';

    public const SLUG = 'borbet-db8gt2';

    /**
     * Per car: the key in content/abnahme/gutachten.php, then the papers' figures (Zulassungsbescheinigung Teil I). A car
     * of the development source carries an export number (chk_veh_export_id_from_source): the set's own, from 9 900 001.
     */
    public const CARS = [
        'e90' => [
            'source_vehicle_id' => 9_900_001, 'hsn' => '0005', 'tsn' => 'Z90', 'vsn' => '00001',
            'make' => 'BMW', 'model' => '3er (E90)', 'variant' => '320i Limousine (Demo)',
            'body_form' => 'Limousine', 'drive_axle' => 'Hinterachse', 'build_from' => '2005-03-01', 'build_to' => '2007-08-31',
            'axle_load_front_kg' => 935, 'axle_load_rear_kg' => 1105, 'max_speed_kmh' => 222,
            'power_kw' => 110, 'power_ps' => 150, 'displacement_ccm' => 1995, 'doors' => 4, 'seats' => 5,
        ],
        'e46' => [
            'source_vehicle_id' => 9_900_002, 'hsn' => '0005', 'tsn' => 'Z46', 'vsn' => '00001',
            'make' => 'BMW', 'model' => '3er (E46)', 'variant' => '320i Limousine (Demo)',
            'body_form' => 'Limousine', 'drive_axle' => 'Hinterachse', 'build_from' => '2001-09-01', 'build_to' => '2005-02-28',
            'axle_load_front_kg' => 880, 'axle_load_rear_kg' => 1020, 'max_speed_kmh' => 226,
            'power_kw' => 125, 'power_ps' => 170, 'displacement_ccm' => 2171, 'doors' => 4, 'seats' => 5,
        ],
        'x3' => [
            'source_vehicle_id' => 9_900_003, 'hsn' => '0005', 'tsn' => 'Z83', 'vsn' => '00001',
            'make' => 'BMW', 'model' => 'X3 (E83)', 'variant' => '2.0d (Demo)',
            'body_form' => 'SUV', 'drive_axle' => 'Allrad', 'build_from' => '2004-09-01', 'build_to' => '2007-08-31',
            'axle_load_front_kg' => 1130, 'axle_load_rear_kg' => 1240, 'max_speed_kmh' => 198,
            'power_kw' => 110, 'power_ps' => 150, 'displacement_ccm' => 1995, 'doors' => 5, 'seats' => 5,
        ],
    ];

    /** Name, swatch, palette, sort order — the golden record's (GoldenRecordSeeder). */
    private const FINISHES = [
        'schwarz-matt' => ['Schwarz matt', '#1C1D1F', 'black', 0, 'SM'],
        'bronze-matt' => ['Bronze matt', '#8F6E4C', 'bronze', 10, 'BM'],
    ];

    /** Diameter, KBA number on the wheel, bore, Radlast, weight in grams, price in cents. */
    private const SIZES = [
        18 => [18.0, '53841', 72.50, 650, 8_800, 22_900],
        19 => [19.0, '55255', 72.60, 700, 9_600, 26_900],
    ];

    private const STOCK = 12;

    private const DESCRIPTION = 'Aufs Wesentliche reduziert: maximaler Fahrspaß bei minimalem Gewicht – die Borbet DB8GT2 '
        .'ist das ikonische Sechsspeichenrad für japanische und deutsche Modern Classics. Gegossen, 8,8 kg (18 Zoll) '
        .'und 9,6 kg (19 Zoll) je Rad (Herstellerangaben).';

    /** Width, aspect, diameter, load index, speed symbol, speed rank, price in cents — every size the rows permit. */
    private const TYRES = [
        [225, 35, 19.0, 88, 'Y', 13, 14_900], [235, 35, 19.0, 91, 'Y', 13, 15_900], [245, 30, 19.0, 89, 'Y', 13, 16_900],
        [255, 30, 19.0, 91, 'Y', 13, 17_900], [235, 45, 19.0, 99, 'W', 12, 15_900], [245, 40, 19.0, 98, 'Y', 13, 16_900],
        [255, 40, 19.0, 100, 'Y', 13, 17_900],
        [225, 40, 18.0, 92, 'Y', 13, 11_900], [235, 40, 18.0, 95, 'Y', 13, 12_900], [245, 35, 18.0, 92, 'Y', 13, 13_900],
        [255, 35, 18.0, 94, 'Y', 13, 14_900], [235, 50, 18.0, 101, 'W', 12, 12_900], [245, 45, 18.0, 100, 'Y', 13, 13_900],
        [255, 45, 18.0, 103, 'Y', 13, 14_900],
    ];

    private const TYRE_STOCK = 16;

    /** What an RDKS sensor costs in the set: a demo figure, said to be one in the admin (is_demo). */
    private const TPMS_CENTS = 4_900;

    /** Where this machine keeps the Gutachten PDFs it may copy (the documents disk, as the admin stored them). */
    private string $pdfSource;

    /**
     * @param  array{documents: array<string, array<string, mixed>>, fitments: list<array<string, mixed>>, templates: array<string, array<string, mixed>>}|null  $data
     *                                                                                                                                                                  the documents' rows (content/abnahme/gutachten.php unless given)
     */
    public function __construct(?string $pdfSource = null, private ?array $data = null, private bool $besideSamePdf = false)
    {
        $this->pdfSource = $pdfSource ?? Storage::disk(GutachtenController::DISK)->path('');
    }

    /** Whether the set is in this database. */
    public static function present(): bool
    {
        return WheelModel::query()->where('demo_ref', self::WHEEL_REF)->exists();
    }

    /** Where the set keeps its example copy of a document: a key of its own, never a real document's file. */
    public static function exampleKey(string $document): string
    {
        return "gutachten/abnahme-{$document}-beispiel.pdf";
    }

    /**
     * A set written before 17.10.2026 stored each Gutachten as the very file — on the client's preview the same bytes as
     * his own „ABE 53841“. Here each such document gets its example copy instead (decision 6, the operator's brief of
     * 17.10.2026 §6): read from where it is, checked by its fingerprint, stamped, written under the set's own key and
     * read back; then the row names the copy, and the old file — the set's own (`abnahme-…`) and named by no row any
     * more — is removed. A document that already carries a copy of its own is left as it is. One Protokoll line says
     * which fingerprints moved. Nothing outside the set is read or written.
     *
     * @return list<string> what was done, said
     *
     * @throws RuntimeException where demo data may not be written, or a document's file is not the one on record
     */
    public function giveExampleCopies(): array
    {
        DemoGuard::ensure();

        /** @var array{documents: array<string, array<string, mixed>>} $data */
        $data = $this->data ?? require database_path('seeders/content/abnahme/gutachten.php');
        $disk = Storage::disk(GutachtenController::DISK);
        $notes = [];
        $moved = [];

        foreach ($data['documents'] as $key => $document) {
            $name = self::documentName($document['row']);
            $row = DB::table('approval_documents')->where('is_demo', true)->where('demo_ref', AcceptanceSet::PREFIX.'doc:'.$key)->first(['id', 'pdf_key', 'pdf_sha256']);

            if ($row === null) {
                $notes[] = "„{$name}“ ist nicht im Shop: nichts zu tun.";

                continue;
            }

            if ($row->pdf_sha256 !== $document['pdf']['sha256']) {
                $notes[] = "„{$name}“ hat schon eine eigene Datei: nichts zu tun.";

                continue;
            }

            $original = is_string($row->pdf_key) ? $disk->get($row->pdf_key) : null;

            if (! is_string($original) || hash('sha256', $original) !== $document['pdf']['sha256']) {
                throw new RuntimeException("Die Datei von „{$name}“ ({$row->pdf_key}) ist nicht die, deren Fingerabdruck der Datensatz nennt: nichts geändert.");
            }

            $copy = ExamplePdf::stamp($original);
            $sha = hash('sha256', $copy);
            $copyKey = self::exampleKey((string) $key);
            $disk->put($copyKey, $copy);

            if (hash('sha256', (string) $disk->get($copyKey)) !== $sha) {
                throw new RuntimeException("Die Beispielkopie von „{$name}“ ließ sich nicht unverändert zurücklesen: der Datensatz nennt weiter die alte Datei.");
            }

            DB::table('approval_documents')->where('id', $row->id)->update(['pdf_key' => $copyKey, 'pdf_sha256' => $sha, 'updated_at' => now()]);

            if ($row->pdf_key !== $copyKey && str_starts_with(basename((string) $row->pdf_key), 'abnahme-')
                && DB::table('approval_documents')->where('pdf_key', $row->pdf_key)->doesntExist()) {
                $disk->delete((string) $row->pdf_key);
            }

            $moved[] = ['document' => $name, 'from' => substr((string) $row->pdf_sha256, 0, 12), 'to' => substr($sha, 0, 12)];
            $notes[] = "„{$name}“ hat jetzt die Beispielkopie {$copyKey} (".substr($sha, 0, 12).'…); die alte Kopie ist entfernt.';
        }

        if ($moved !== []) {
            activity('admin')
                ->withProperties(['documents' => $moved, 'environment' => (string) app()->environment()])
                ->tap(static function (AuditLog $entry): void {
                    $entry->forceFill(['actor_email' => 'Konsole (rimify:demo --beispiel-pdfs)']);
                })
                ->log('demo.example_pdfs');
        }

        DemoTables::forget();

        return $notes;
    }

    /**
     * Writes the set. Returns what it wrote, and the notes worth saying (a PDF this machine does not hold).
     *
     * @return array{counts: array<string, int>, notes: list<string>}
     *
     * @throws RuntimeException where demo data may not be written, or the set would double something real
     */
    public function seed(): array
    {
        DemoGuard::ensure();

        if (self::present()) {
            return ['counts' => [], 'notes' => ['Der Abnahme-Satz ist schon da. Entfernen: System › Zurücksetzen › Demodaten.']];
        }

        /** @var array{documents: array<string, array<string, mixed>>, fitments: list<array<string, mixed>>, templates: array<string, array<string, mixed>>} $data */
        $data = $this->data ?? require database_path('seeders/content/abnahme/gutachten.php');
        $notes = $this->refuseDoubles($data['documents']);
        $this->refuseWithoutPdfs($data['documents']);
        $counts = [];

        DB::transaction(function () use ($data, &$counts, &$notes): void {
            $brands = $this->brands($counts);
            $configs = $this->wheel($brands['borbet'], $counts);
            $documents = $this->documents($data['documents'], $counts);
            $vehicles = $this->vehicles($data['templates'], $counts);
            $this->fitments($data['fitments'], $documents, $vehicles, $configs, $counts);
            $this->tyres($brands['laufwerk'], $counts);
            $this->accessories($counts, $notes);
        });

        // The client's photographs onto the two finishes: rendered at the release build (deploy.yml), or here by
        // `wheels:process-images`. Without them the page draws the wheel and says so (PublishCheck).
        CatalogueSeeder::attachMappedPhotographs();
        DemoTables::forget();

        return ['counts' => $counts, 'notes' => $notes];
    }

    /**
     * The set never doubles something real: the wheel by its address, its two Gutachten by their numbers — and by the
     * fingerprint of their PDFs. On the client's preview (13.10.2026) the wheel was already there as „Borbet DBGT8“ and
     * the Nachtrag as „ABE, KBA 53841“: other words for the same wheel and the very same file. A number is typed; a file
     * is what it is.
     *
     * Beside the same file, and only that, the set may be written when someone says so (`--neben-gleicher-pdf`): the
     * operator's decision of 14.10.2026 for that preview — „beside his own wheel: yes“, every row born demo and marked so
     * in every admin list (D-221). The note it returns names the document it sits beside.
     *
     * @param  array<string, array<string, mixed>>  $documents
     * @return list<string> what was let through, said
     */
    private function refuseDoubles(array $documents): array
    {
        $notes = [];
        $hashes = array_values(array_filter(array_map(static fn (array $d): ?string => is_string($d['pdf']['sha256'] ?? null) ? $d['pdf']['sha256'] : null, $documents)));
        $same = $hashes === [] ? null : DB::table('approval_documents')->where('is_demo', false)->whereIn('pdf_sha256', $hashes)
            ->first(['id', 'kind', 'kba_number', 'report_number']);

        if ($same !== null) {
            $name = trim($same->kind.' '.($same->kba_number ?: $same->report_number ?: ''));

            if (! $this->besideSamePdf) {
                throw new RuntimeException('Ein Gutachten des Abnahme-Satzes ist schon im Shop: dieselbe PDF-Datei liegt dort als „'
                    .$name.'“. Der Abnahme-Satz würde es – und die Felge dazu – doppeln und wird nicht geschrieben. (Ausdrücklich daneben: --neben-gleicher-pdf.)');
            }

            $notes[] = 'Neben „'.$name.'“ (Gutachten #'.$same->id.', dieselbe PDF-Datei) geschrieben, wie mit --neben-gleicher-pdf verlangt. Das echte Gutachten bleibt, wie es ist.';
        }

        if (WheelModel::withTrashed()->where('slug', self::SLUG)->where('is_demo', false)->exists()) {
            throw new RuntimeException('Die echte BORBET DB8GT2 ist schon im Shop. Der Abnahme-Satz würde sie doppeln und wird nicht geschrieben.');
        }

        $real = DB::table('approval_documents')->where('is_demo', false)
            ->where(static fn ($q) => $q->where('kba_number', '55255')->orWhere('report_number', '366-0350-21-WIRD/N1'))
            ->value('kind');

        if ($real !== null) {
            throw new RuntimeException('ABE 55255 oder der Nachtrag 366-0350-21-WIRD/N1 sind schon im Shop. Der Abnahme-Satz würde sie doppeln und wird nicht geschrieben.');
        }

        return $notes;
    }

    /**
     * A released Gutachten always has its PDF (chk_document_published_has_pdf): the file the customer reads and an order
     * freezes the hash of. Without the very file — same SHA-256 — nothing is written.
     *
     * @param  array<string, array<string, mixed>>  $documents
     */
    private function refuseWithoutPdfs(array $documents): void
    {
        $missing = [];

        foreach ($documents as $document) {
            $source = $this->pdfPath((string) $document['pdf']['source']);

            if (! is_file($source) || hash_file('sha256', $source) !== $document['pdf']['sha256']) {
                $missing[] = '„'.self::documentName($document['row']).'“ ('.$source.')';
            }
        }

        if ($missing !== []) {
            throw new RuntimeException('Ohne das PDF wird kein Gutachten freigegeben, und auf diesem Rechner fehlt: '.implode(', ', $missing)
                .'. Leg die Datei dorthin oder nenne ihren Ordner mit --pdfs=. Es wurde nichts geschrieben.');
        }
    }

    private function pdfPath(string $key): string
    {
        return rtrim($this->pdfSource, '/\\').DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $key);
    }

    /**
     * BORBET for the wheel and „Laufwerk“ for the tyres: the shop's own where it has them, else born demo.
     *
     * @param  array<string, int>  $counts
     * @return array{borbet: int, laufwerk: int}
     */
    private function brands(array &$counts): array
    {
        $ids = [];

        foreach (['borbet' => ['BORBET', true, '/images/brands/borbet.svg'], 'laufwerk' => ['Laufwerk', false, null]] as $slug => [$name, $wheels, $logo]) {
            $existing = DB::table('brands')->whereNull('deleted_at')
                ->where(static fn ($q) => $q->where('slug', $slug)->orWhereRaw('LOWER(name) = ?', [mb_strtolower($name)]))
                ->value('id');

            if ($existing !== null) {
                $ids[$slug] = (int) $existing;

                continue;
            }

            $ids[$slug] = (int) DB::table('brands')->insertGetId([
                'name' => $name,
                'slug' => $slug,
                'logo_path' => $logo !== null && is_file(public_path(ltrim($logo, '/'))) ? $logo : null,
                'is_wheel_brand' => $wheels,
                'sort_order' => $wheels ? 120 : 900,
                'is_demo' => true,
                'demo_ref' => AcceptanceSet::PREFIX.'brand:'.$slug,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $counts['brands'] = ($counts['brands'] ?? 0) + 1;
        }

        return ['borbet' => $ids['borbet'], 'laufwerk' => $ids['laufwerk']];
    }

    /**
     * The model, its two finishes and four sizes; returns the sizes by the data file's keys (`19-bronze-matt`).
     *
     * @param  array<string, int>  $counts
     * @return array<string, int>
     */
    private function wheel(int $brandId, array &$counts): array
    {
        $modelId = (int) DB::table('wheel_models')->insertGetId([
            'brand_id' => $brandId,
            'name' => 'DB8GT2',
            'slug' => self::SLUG,
            'spoke_count' => 6,
            'description_de' => self::DESCRIPTION,
            'internal_note' => 'Demodaten zur Abnahme (rimify:demo --abnahme). Entfernen: System › Zurücksetzen › Demodaten.',
            'status' => CatalogueStatus::Published->value,
            'is_demo' => true,
            'demo_ref' => self::WHEEL_REF,
            'rating_count' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $counts['wheel_models'] = 1;
        $configs = [];

        foreach (self::FINISHES as $finishKey => [$name, $hex, $palette, $order, $code]) {
            $finishId = (int) DB::table('wheel_finishes')->insertGetId([
                'wheel_model_id' => $modelId,
                'name_de' => $name,
                'hex' => $hex,
                'art_finish' => $palette,
                'sort_order' => $order,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $counts['wheel_finishes'] = ($counts['wheel_finishes'] ?? 0) + 1;

            foreach (self::SIZES as $inch => [$diameter, $kba, $bore, $load, $weight, $price]) {
                $configs["{$inch}-{$finishKey}"] = (int) DB::table('wheel_configs')->insertGetId([
                    'wheel_model_id' => $modelId,
                    'wheel_finish_id' => $finishId,
                    'diameter_in' => $diameter,
                    'width_in' => 8.5,
                    'et_mm' => 35,
                    'bolt_holes' => 5,
                    'bolt_circle_mm' => 120.0,
                    'centre_bore_mm' => $bore,
                    'hump' => 'H2',
                    'bead_profile' => 'J',
                    'kba_number' => $kba,
                    'sku' => sprintf('BOR-DB8GT2-85%d-%s-DEMO', $inch, $code),
                    'price_cents' => $price,
                    'currency' => 'EUR',
                    'stock_qty' => self::STOCK,
                    'weight_g' => $weight,
                    'max_load_kg' => $load,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $counts['wheel_configs'] = ($counts['wheel_configs'] ?? 0) + 1;
            }
        }

        return $configs;
    }

    /**
     * The two Gutachten with every sub-row, released; each PDF copied where this machine holds it.
     *
     * @param  array<string, array<string, mixed>>  $documents
     * @param  array<string, int>  $counts
     * @return array<string, int>
     */
    private function documents(array $documents, array &$counts): array
    {
        $ids = [];
        $disk = Storage::disk(GutachtenController::DISK);

        foreach ($documents as $key => $document) {
            /** @var array<string, mixed> $row */
            $row = $document['row'];
            // The very file, checked before anything was written (refuseWithoutPdfs), stored as the set's own example
            // copy: marked on every page, and never the same file as a real document's (decision 6, D-268).
            $copy = ExamplePdf::stamp((string) file_get_contents($this->pdfPath((string) $document['pdf']['source'])));
            $pdfKey = self::exampleKey((string) $key);
            $disk->put($pdfKey, $copy);

            $ids[$key] = (int) DB::table('approval_documents')->insertGetId([
                ...$row,
                'pdf_key' => $pdfKey,
                'pdf_sha256' => hash('sha256', $copy),
                'status' => 'published',
                // The set enters three cars of each real document, never the whole Verwendungsbereich: every other car
                // is „noch nicht bestätigt“, never refused on its silence (D-227).
                'completeness' => ApprovalDocument::PARTIAL,
                'completeness_at' => now(),
                'completeness_revision' => (int) ($row['revision'] ?? 1),
                'is_demo' => true,
                'demo_ref' => AcceptanceSet::PREFIX.'doc:'.$key,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $counts['approval_documents'] = ($counts['approval_documents'] ?? 0) + 1;

            foreach ($document['conditions'] as $condition) {
                $reworks = $condition['reworks'];
                unset($condition['reworks']);

                $conditionId = (int) DB::table('document_conditions')->insertGetId([
                    ...$condition,
                    'approval_document_id' => $ids[$key],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $counts['document_conditions'] = ($counts['document_conditions'] ?? 0) + 1;

                foreach ($reworks as $rework) {
                    DB::table('document_condition_reworks')->insert([...$rework, 'document_condition_id' => $conditionId, 'created_at' => now(), 'updated_at' => now()]);
                    $counts['document_condition_reworks'] = ($counts['document_condition_reworks'] ?? 0) + 1;
                }
            }

            foreach (['fasteners' => 'document_fasteners', 'notices' => 'document_notices', 'speed_deratings' => 'document_speed_deratings'] as $part => $table) {
                foreach ($document[$part] as $child) {
                    DB::table($table)->insert([...$child, 'approval_document_id' => $ids[$key], 'created_at' => now(), 'updated_at' => now()]);
                    $counts[$table] = ($counts[$table] ?? 0) + 1;
                }
            }
        }

        return $ids;
    }

    /**
     * The three cars, born demo — or brought back where a purge hid them (R-04: a car is never removed).
     *
     * @param  array<string, array<string, mixed>>  $templates
     * @param  array<string, int>  $counts
     * @return array<string, int>
     */
    private function vehicles(array $templates, array &$counts): array
    {
        $ids = [];

        foreach (self::CARS as $key => $car) {
            $ref = AcceptanceSet::PREFIX.'vehicle:'.$key;
            $attributes = [
                ...$car,
                'type_designation' => $templates[$key]['type_designation'],
                'eg_nummer_raw' => $templates[$key]['eg_nummer_raw'],
                'needs_review' => false,
                // Where the row came from, as every car keeps it: the acceptance set, and the papers' figures it was given.
                'raw' => ['abnahme' => ['key' => $key, 'typed' => $car, 'note' => 'Demodaten zur Abnahme (rimify:demo --abnahme)']],
            ];

            $vehicle = Vehicle::withTrashed()->where('demo_ref', $ref)->first();

            if ($vehicle !== null) {
                $vehicle->fill($attributes);
                $vehicle->deleted_at = null;
                $vehicle->save();
            } else {
                $vehicle = Vehicle::query()->create([...$attributes, 'source' => 'entwicklung', 'is_demo' => true, 'demo_ref' => $ref]);
            }

            $ids[$key] = (int) $vehicle->id;
            $counts['vehicles'] = ($counts['vehicles'] ?? 0) + 1;
        }

        return $ids;
    }

    /**
     * The documents' rows for the three cars, with their Auflagen and tyre sizes, as entered.
     *
     * @param  list<array<string, mixed>>  $fitments
     * @param  array<string, int>  $documents
     * @param  array<string, int>  $vehicles
     * @param  array<string, int>  $configs
     * @param  array<string, int>  $counts
     */
    private function fitments(array $fitments, array $documents, array $vehicles, array $configs, array &$counts): void
    {
        foreach ($fitments as $fitment) {
            $id = (int) DB::table('fitments')->insertGetId([
                ...$fitment['row'],
                'approval_document_id' => $documents[$fitment['document']],
                'vehicle_id' => $vehicles[$fitment['vehicle']],
                'wheel_config_id' => $configs[$fitment['config']],
                'status' => 'published',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $counts['fitments'] = ($counts['fitments'] ?? 0) + 1;

            foreach ($fitment['conditions'] as $condition) {
                DB::table('fitment_conditions')->insert([...$condition, 'fitment_id' => $id, 'created_at' => now(), 'updated_at' => now()]);
                $counts['fitment_conditions'] = ($counts['fitment_conditions'] ?? 0) + 1;
            }

            foreach ($fitment['sizes'] as $size) {
                $codes = $size['conditions'];
                // `entry_key` is generated by the table from the size's own columns.
                unset($size['conditions'], $size['entry_key']);

                $sizeId = (int) DB::table('fitment_tyre_sizes')->insertGetId([...$size, 'fitment_id' => $id, 'created_at' => now(), 'updated_at' => now()]);
                $counts['fitment_tyre_sizes'] = ($counts['fitment_tyre_sizes'] ?? 0) + 1;

                foreach ($codes as $code) {
                    DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $sizeId, 'code' => $code, 'created_at' => now(), 'updated_at' => now()]);
                    $counts['fitment_tyre_size_conditions'] = ($counts['fitment_tyre_size_conditions'] ?? 0) + 1;
                }
            }
        }
    }

    /** @param  array<string, int>  $counts */
    private function tyres(int $brandId, array &$counts): void
    {
        foreach (self::TYRES as [$width, $aspect, $diameter, $load, $symbol, $rank, $price]) {
            DB::table('tyre_variants')->insert([
                'brand_id' => $brandId,
                'name' => 'Sommer S5',
                'season' => 'sommer',
                'width_mm' => $width,
                'aspect' => $aspect,
                'diameter_in' => $diameter,
                'load_index' => $load,
                'speed_symbol' => $symbol,
                'speed_rank' => $rank,
                'price_cents' => $price,
                'currency' => 'EUR',
                'stock_qty' => self::TYRE_STOCK,
                'is_demo' => true,
                'demo_ref' => AcceptanceSet::PREFIX.sprintf('tyre:%d-%d-%d', $width, $aspect, (int) $diameter),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $counts['tyre_variants'] = ($counts['tyre_variants'] ?? 0) + 1;
        }
    }

    /**
     * Wuchtgewichte and an RDKS price for BMW, where the shop has none of its own (#15).
     *
     * @param  array<string, int>  $counts
     * @param  list<string>  $notes
     */
    private function accessories(array &$counts, array &$notes): void
    {
        if (! BalanceWeightColour::query()->where('active', true)->exists()) {
            foreach ([['Silber', 'silber', '#C8CCD2', 10, true], ['Schwarz', 'schwarz', '#1A1C20', 20, false]] as [$name, $slug, $hex, $order, $default]) {
                if (DB::table('balance_weight_colours')->where('slug', $slug)->exists()) {
                    continue;
                }

                DB::table('balance_weight_colours')->insert([
                    'name_de' => $name,
                    'slug' => $slug,
                    'swatch_hex' => $hex,
                    'surcharge_cents' => 0,
                    'currency' => 'EUR',
                    'is_default' => $default,
                    'active' => true,
                    'sort_order' => $order,
                    'is_demo' => true,
                    'demo_ref' => AcceptanceSet::PREFIX.'colour:'.$slug,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $counts['balance_weight_colours'] = ($counts['balance_weight_colours'] ?? 0) + 1;
            }
        }

        $key = MakeName::key('BMW');

        if (TpmsSensorPrice::withTrashed()->where('make_key', $key)->doesntExist()) {
            DB::table('tpms_sensor_prices')->insert([
                'make_key' => $key,
                'make_label_de' => 'BMW',
                'price_cents' => self::TPMS_CENTS,
                'currency' => 'EUR',
                'active' => true,
                'is_demo' => true,
                'demo_ref' => AcceptanceSet::PREFIX.'tpms:'.$key,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $counts['tpms_sensor_prices'] = 1;
        }

        $notes[] = 'Ventile bietet der Shop nicht einzeln an: Dazu steht die Frage an den Kunden noch offen (#15).';
    }

    /** @param  array<string, mixed>  $row */
    private static function documentName(array $row): string
    {
        return $row['kind'] === 'ABE' ? 'ABE '.$row['kba_number'] : (string) $row['report_number'];
    }
}
