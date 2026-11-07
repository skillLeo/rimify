<?php

declare(strict_types=1);

use App\Domain\Fitment\Infrastructure\EloquentFitmentRepository;
use App\Enums\DocumentStatus;
use App\Enums\FitmentStatus;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
use App\Services\Admin\Approvals\CombinationCensus;
use App\Services\Admin\Approvals\Entry\DocumentEntryProof;
use App\Services\Admin\Approvals\Entry\DocumentEntryReader;
use App\Services\Admin\Approvals\Entry\DocumentEntryWriter;
use App\Services\Admin\Approvals\Entry\EngineRows;
use App\Services\Demo\AcceptanceSeeder;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CatalogueSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\GoldenRecordSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\TranscriptionEntry;
use Tests\Support\MinimalPdf;

/*
 * The Gutachten rework's mandatory test (§6, §10.3): carrying a paper entered before the five steps into them changes no verdict,
 * and its next Fassung gives the same answers. For every paper of every data set the shop has:
 *
 * - what the writer would write from the entry is exactly what the tables hold, with nothing written;
 * - with every row and list row taken away and written back from the entry alone, the tables hold byte for byte what they held —
 *   the rows, their tyre sizes and codes, the list of combinations, whatever the engine reads;
 * - and the shop's answers — the verdict, the Komplettrad and its combinations — are what they were. On the small data sets every
 *   car × rim pair; on the large ones a sample, one car in ENTRY_SAMPLE: a census of 2.000 pairs takes ten minutes, and rows equal
 *   byte for byte cannot answer differently.
 */

const ENTRY_SAMPLE = 12;

/**
 * Every row wiped and every list gone, then written again from the entry alone, each paper left in the status it had. A row keeps
 * its id, as it does in the writer (the shop lists what several rows say in their order); that none is missing or added is what
 * DocumentEntryProof has just shown.
 */
function writeEveryPaperBack(): void
{
    $writer = new DocumentEntryWriter;

    foreach (ApprovalDocument::query()->orderBy('id')->get() as $document) {
        $rows = DB::table('fitments')->where('approval_document_id', $document->id)->where('status', '<>', FitmentStatus::Retired->value);
        $ids = (clone $rows)->pluck('id')->all();

        if ($ids === [] && DocumentTyreCombination::query()->where('approval_document_id', $document->id)->doesntExist()) {
            continue;
        }

        $had = $document->status;
        $rowStatus = (clone $rows)->value('status') ?? FitmentStatus::Draft->value;
        DB::table('fitment_tyre_sizes')->whereIn('fitment_id', $ids)->delete();
        DB::table('fitment_conditions')->whereIn('fitment_id', $ids)->delete();
        DB::table('fitments')->whereIn('id', $ids)->update(['status' => FitmentStatus::Draft->value, 'requires_entry' => false, 'source_page' => null, 'entry_note_de' => null]);
        DocumentTyreCombination::query()->where('approval_document_id', $document->id)->delete();

        // Only a draft is written; the paper goes straight back to what it was.
        DB::table('approval_documents')->where('id', $document->id)->update(['status' => DocumentStatus::Draft->value]);
        $writer->write($document->refresh());
        DB::table('fitments')->whereIn('id', $ids)->update(['status' => $rowStatus]);
        DB::table('approval_documents')->where('id', $document->id)->update(['status' => $had->value]);
    }
}

/** @return int the papers read */
function everyPaperReadsAndWritesBack(bool $sampled = true): int
{
    $census = app(CombinationCensus::class);
    $cars = Fitment::query()->distinct()->orderBy('vehicle_id')->pluck('vehicle_id')->map(static fn (mixed $id): int => (int) $id)->all();
    $sample = $sampled ? array_values(array_filter($cars, static fn (int $car, int $i): bool => $i % ENTRY_SAMPLE === 0, ARRAY_FILTER_USE_BOTH)) : $cars;
    $answers = $census->take(new EloquentFitmentRepository, vehicleIds: $sample);
    expect($answers)->not->toBeEmpty('precondition: this data set has no car × rim pair to compare');

    $documents = ApprovalDocument::query()->orderBy('id')->get();
    $reader = new DocumentEntryReader;
    $proof = new DocumentEntryProof(new DocumentEntryWriter);
    $held = [];
    $papers = 0;

    foreach ($documents as $document) {
        $held[$document->id] = EngineRows::actual($document);
        $papers += $held[$document->id]['rows'] === [] ? 0 : 1;
        $reader->ensure($document);
        expect($proof->differences($document))->toBe([], "paper {$document->id}: the entry does not write back");
    }

    expect($papers)->toBeGreaterThan(0, 'precondition: no paper with rows')
        ->and(DocumentCarEntry::query()->exists())->toBeTrue('precondition: nothing was carried over');

    writeEveryPaperBack();

    foreach ($documents as $document) {
        expect(EngineRows::actual($document))->toBe($held[$document->id], "paper {$document->id}: the rows written back differ");
    }

    expect($census->take(new EloquentFitmentRepository, vehicleIds: $sample))->toBe($answers);

    return $papers;
}

it('carries every paper of the development data over, and writes every row back as it was', function (): void {
    $this->seed(DatabaseSeeder::class);

    expect(everyPaperReadsAndWritesBack())->toBeGreaterThan(5);
});

it('carries every paper of the shop fixture over, its lists of combinations included', function (): void {
    CatalogueSeeder::$shopFixture = true;
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);

    expect(everyPaperReadsAndWritesBack())->toBeGreaterThan(0);
})->after(function (): void {
    CatalogueSeeder::$shopFixture = false;
});

it('carries the acceptance set over, every Gutachten in it', function (): void {
    config(['demo.enabled' => true]);
    $this->seed(ReferenceDataSeeder::class);
    $dir = sys_get_temp_dir().'/rimify-abnahme-pdfs-roundtrip';
    $data = require database_path('seeders/content/abnahme/gutachten.php');

    foreach ($data['documents'] as $key => $document) {
        $path = $dir.'/'.$document['pdf']['source'];
        is_dir(dirname($path)) || mkdir(dirname($path), 0777, true);
        file_put_contents($path, MinimalPdf::make(["stand-in for {$key}"]));
        $data['documents'][$key]['pdf']['sha256'] = hash_file('sha256', $path);
    }

    (new AcceptanceSeeder($dir, $data))->seed();

    expect(everyPaperReadsAndWritesBack())->toBeGreaterThanOrEqual(2);
});

it('carries the Borbet transcriptions over, written as a person enters them', function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class, GoldenRecordSeeder::class]);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
    $this->withoutMiddleware(ThrottleRequests::class);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    (new TranscriptionEntry($this, $admin))->enterBoth();

    // Entered through the five steps, these papers have their entry: taken away, it is built again from the rows and written back.
    DB::table('document_kept_combinations')->delete();
    DB::table('document_wheel_sizes')->delete();

    expect(everyPaperReadsAndWritesBack())->toBeGreaterThanOrEqual(2);
});
