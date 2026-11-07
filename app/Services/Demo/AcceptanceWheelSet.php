<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreLine;
use App\Models\DocumentWheelCombination;
use App\Models\DocumentWheelSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Support\CatalogueVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * A demonstration of the client's fourth change, written by `rimify:demo --satz` (the operator's brief of 07.11.2026): the acceptance
 * set's DB8GT2 with 8,5 × 18 ET 35 in front and 8,5 × 19 ET 35 behind, as in his mockup, for a fourth demo car, on a paper of its
 * own. There is no real paper to show this on the preview with, so this one says what it is: its number, its issuer and its one
 * page, stamped „BEISPIEL“. It goes through the same entry tables and writer as a paper typed in the admin, so the shop reads it
 * as it would any other.
 *
 * Every row born demo under `abnahme:satz:`: System › Zurücksetzen › Demodaten takes it away with the rest of the set; written
 * again, it writes nothing twice.
 */
final class AcceptanceWheelSet
{
    public const PREFIX = AcceptanceSet::PREFIX.'satz:';

    public const NUMBER = 'BEISPIEL-SATZ';

    /** The demo car: papers' figures for a car that takes both sizes, front lighter than rear; slow enough to need no table of load at speed. */
    public const CAR = [
        'source_vehicle_id' => 9_900_004, 'hsn' => '0005', 'tsn' => 'Z30', 'vsn' => '00001',
        'make' => 'BMW', 'model' => '3er (F30)', 'variant' => '316d Limousine (Demo)',
        'body_form' => 'Limousine', 'drive_axle' => 'Hinterachse', 'build_from' => '2012-03-01', 'build_to' => '2015-06-30',
        'axle_load_front_kg' => 1010, 'axle_load_rear_kg' => 1200, 'max_speed_kmh' => 205,
        'power_kw' => 85, 'power_ps' => 116, 'displacement_ccm' => 1995, 'doors' => 4, 'seats' => 5,
        'type_designation' => '3K', 'eg_nummer_raw' => 'e1*2007/46*0460*12',
    ];

    /** Front and rear size of each tyre line: width, aspect, diameter, load index, speed symbol. All of them the set's tyres. */
    private const LINES = [
        [[225, 40, 18.0, 92, 'Y'], [255, 30, 19.0, 91, 'Y']],
        [[245, 35, 18.0, 92, 'Y'], [255, 30, 19.0, 91, 'Y']],
    ];

    public static function present(): bool
    {
        return DB::table('approval_documents')->where('demo_ref', self::PREFIX.'doc')->exists();
    }

    /**
     * @return array<string, int> rows written, by table
     *
     * @throws RuntimeException where demo data may not be written, or the acceptance set's wheel is not there
     */
    public function seed(): array
    {
        DemoGuard::ensure();

        if (self::present()) {
            return [];
        }

        $modelId = DB::table('wheel_models')->where('demo_ref', AcceptanceSeeder::WHEEL_REF)->value('id');

        if ($modelId === null) {
            throw new RuntimeException('Der Abnahme-Satz fehlt: Der Satz vorne und hinten baut auf seiner Felge auf. Zuerst rimify:demo --abnahme.');
        }

        $version = static fn (float $diameter): ?WheelConfig => WheelConfig::query()->where('wheel_model_id', $modelId)->where('diameter_in', $diameter)->orderBy('id')->first();
        $front = $version(18.0);
        $rear = $version(19.0);

        if ($front === null || $rear === null) {
            throw new RuntimeException('Die Felge des Abnahme-Satzes hat nicht beide Größen, 18 und 19 Zoll.');
        }

        $counts = [];

        DB::transaction(function () use ($front, $rear, &$counts): void {
            $document = $this->document();
            $car = $this->car();
            $sizeFront = DocumentWheelSize::query()->create(['approval_document_id' => $document->id, ...array_intersect_key($front->getAttributes(), array_flip(DocumentWheelSize::DIMENSION))]);
            $sizeRear = DocumentWheelSize::query()->create(['approval_document_id' => $document->id, ...array_intersect_key($rear->getAttributes(), array_flip(DocumentWheelSize::DIMENSION))]);
            $combination = DocumentWheelCombination::query()->create(['approval_document_id' => $document->id, 'front_wheel_size_id' => $sizeFront->id, 'rear_wheel_size_id' => $sizeRear->id, 'position' => 1]);
            $entry = DocumentCarEntry::query()->create(['approval_document_id' => $document->id, 'document_wheel_combination_id' => $combination->id, 'vehicle_id' => $car->id, 'axle' => 'ALL', 'source_page' => 1, 'position' => 1]);

            foreach (self::LINES as $i => [$f, $r]) {
                DocumentTyreLine::query()->create([
                    'document_car_entry_id' => $entry->id,
                    'position' => $i,
                    'front_width_mm' => $f[0], 'front_aspect' => $f[1], 'front_diameter_in' => $f[2], 'front_load_index' => $f[3], 'front_speed_symbol' => $f[4],
                    'rear_width_mm' => $r[0], 'rear_aspect' => $r[1], 'rear_diameter_in' => $r[2], 'rear_load_index' => $r[3], 'rear_speed_symbol' => $r[4],
                ]);
            }

            (new DocumentEntryWriter)->write($document);

            // Past the release door, as the rest of the set: it is a demonstration, and says so on every surface.
            DB::table('fitments')->where('approval_document_id', $document->id)->update(['status' => FitmentStatus::Published->value]);
            DB::table('approval_documents')->where('id', $document->id)->update(['status' => DocumentStatus::Published->value]);

            $counts = [
                'approval_documents' => 1,
                'vehicles' => 1,
                'fitments' => DB::table('fitments')->where('approval_document_id', $document->id)->count(),
                'fitment_wheel_sets' => DB::table('fitment_wheel_sets')->whereIn('front_fitment_id', DB::table('fitments')->where('approval_document_id', $document->id)->select('id'))->count(),
            ];
        });

        DemoTables::forget();
        CatalogueVersion::changed();

        return $counts;
    }

    private function document(): ApprovalDocument
    {
        $pdf = ExamplePdf::stamp(self::paperPdf());
        $key = AcceptanceSeeder::exampleKey('satz');
        Storage::disk(GutachtenController::DISK)->put($key, $pdf);

        $id = (int) DB::table('approval_documents')->insertGetId([
            'kind' => 'ABE',
            'kba_number' => self::NUMBER,
            'issuer' => 'Beispiel aus der RIMIFY-Testumgebung',
            'issued_on' => '2026-11-07',
            'revision' => 1,
            'valid_from' => '2026-11-07',
            'tyre_index_source' => 'document',
            'page_count' => 1,
            'pdf_key' => $key,
            'pdf_sha256' => hash('sha256', $pdf),
            'status' => DocumentStatus::Draft->value,
            'completeness' => ApprovalDocument::PARTIAL,
            'completeness_at' => now(),
            'completeness_revision' => 1,
            'is_demo' => true,
            'demo_ref' => self::PREFIX.'doc',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ApprovalDocument::query()->findOrFail($id);
    }

    /** The car, born demo, or brought back where a purge hid it (R-04: a car is never removed). */
    private function car(): Vehicle
    {
        $ref = self::PREFIX.'vehicle';
        $attributes = [
            ...self::CAR,
            'needs_review' => false,
            'raw' => ['abnahme' => ['key' => 'satz', 'typed' => self::CAR, 'note' => 'Demodaten zur Abnahme (rimify:demo --satz)']],
        ];
        $vehicle = Vehicle::withTrashed()->where('demo_ref', $ref)->first();

        if ($vehicle !== null) {
            $vehicle->fill($attributes);
            $vehicle->deleted_at = null;
            $vehicle->save();

            return $vehicle;
        }

        return Vehicle::query()->create([...$attributes, 'source' => 'entwicklung', 'is_demo' => true, 'demo_ref' => $ref]);
    }

    /** One page that says what it is: the paper behind this demonstration holds nothing else. */
    private static function paperPdf(): string
    {
        $stream = "BT /F1 16 Tf 60 760 Td (Beispiel aus der RIMIFY-Testumgebung) Tj ET\n"
            ."BT /F1 11 Tf 60 730 Td (Vorne 8,5 x 18 ET 35, hinten 8,5 x 19 ET 35: nur zur Vorfuehrung des Satzes im Shop.) Tj ET\n";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}endstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];

        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$object}\nendobj\n";
        }

        $start = strlen($pdf);
        $pdf .= 'xref'."\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";

        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.'trailer'."\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$start}\n%%EOF\n";
    }
}
