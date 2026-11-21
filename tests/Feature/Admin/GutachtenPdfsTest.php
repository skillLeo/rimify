<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\ApprovalDocumentFile;
use App\Models\AuditLog;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentPdfs;
use App\Services\Admin\AuditDescriber;
use App\Services\Storage\StorageSettings;
use App\Support\GutachtenPdfLink;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;

/*
 * Several PDFs per Gutachten (D-494, the operator's brief of 19.11.2026, item C): the paper's own first, then its Nachträge,
 * Anlagen or older versions, each labelled, dated and placed — on a released paper too, for no verdict rests on them. Hidden,
 * never deleted. The customer sees them all beside the answer; a purchase freezes which ones it was shown.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake(GutachtenController::DISK);
});

function pdfsAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A pending upload, as the browser leaves it (PdfUpload): its key for the form. */
function pendingPdf(string $body = "%PDF-1.4\n% Nachtrag\n%%EOF\n"): string
{
    $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
    Storage::disk('docs_private')->put($key, $body);

    return $key;
}

/** A released paper with its own PDF on the disk, one car on one wheel. @return array{ApprovalDocument, Vehicle, WheelConfig} */
function releasedWithPdf(): array
{
    $document = ApprovalDocument::factory()->abe()->create(['kba_number' => '55255', 'issued_on' => '2025-07-16']);
    Storage::disk(GutachtenController::DISK)->put((string) $document->pdf_key, "%PDF-1.4\n");
    $vehicle = Vehicle::factory()->create(['build_from' => '2019-01-01', 'build_to' => null]);
    $model = WheelModel::factory()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => 8.0, 'et_mm' => 35]);
    $fitment = Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id, 'source_page' => 6]);
    FitmentTyreSize::factory()->create(['fitment_id' => $fitment->id, 'width_mm' => 225, 'aspect' => 40, 'diameter_in' => 18.0]);

    return [$document, $vehicle, $config];
}

it('adds a further PDF to a released paper, checked and hashed, and lists it after the paper’s own — in the Protokoll, in words', function (): void {
    [$document] = releasedWithPdf();

    $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs", ['upload_key' => pendingPdf(), 'label' => 'Nachtrag 1', 'dated_on' => '2025-07-02'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'PDF hinzugefügt: Nachtrag 1. Im Shop steht es ab jetzt zur Auswahl.');

    $files = DocumentPdfs::of($document->refresh());
    $added = ApprovalDocumentFile::query()->where('is_main', false)->sole();

    expect(array_column($files, 'label'))->toBe(['Gutachten', 'Nachtrag 1'])
        ->and($files[0]['main'])->toBeTrue()
        ->and($added->sha256)->toBe(hash('sha256', "%PDF-1.4\n% Nachtrag\n%%EOF\n"))
        ->and(Storage::disk(GutachtenController::DISK)->exists((string) $added->file_key))->toBeTrue()
        // A released paper takes it without a new revision: its own facts are untouched.
        ->and($document->status->value)->toBe('published')
        ->and($document->revision)->toBe(1);

    $entry = AuditLog::query()->where('description', 'approval.file_added')->sole();

    expect(app(AuditDescriber::class)->describe($entry)['sentence'])->toBe('Zu „ABE 55255“ wurde das PDF „Nachtrag 1“ hinzugefügt.');
});

it('refuses a file that is no PDF by its first bytes, whatever it is called', function (): void {
    [$document] = releasedWithPdf();

    $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs", ['upload_key' => pendingPdf("MZ\x90\x00 not a pdf"), 'label' => 'Anlage'])
        ->assertSessionHasErrors(['upload_key' => 'Das ist keine PDF-Datei. Ein Gutachten wird nur im PDF-Format angenommen.']);

    expect(ApprovalDocumentFile::query()->where('is_main', false)->count())->toBe(0);
});

it('hides a further PDF from the shop and shows it again — never the paper’s own, never deleted', function (): void {
    [$document] = releasedWithPdf();
    $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs", ['upload_key' => pendingPdf(), 'label' => 'Anlage 3'])->assertSessionHasNoErrors();
    $file = ApprovalDocumentFile::query()->where('is_main', false)->sole();

    $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs/{$file->id}/sichtbar", ['visible' => false])->assertSessionHasNoErrors();

    expect(array_column(DocumentPdfs::of($document), 'label'))->toBe(['Gutachten'])
        ->and(array_column(DocumentPdfs::of($document, withHidden: true), 'hidden'))->toBe([false, true])
        ->and($file->refresh()->hidden_at)->not->toBeNull()
        ->and(Storage::disk(GutachtenController::DISK)->exists((string) $file->file_key))->toBeTrue();

    $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs/{$file->id}/sichtbar", ['visible' => true])->assertSessionHasNoErrors();

    expect(array_column(DocumentPdfs::of($document), 'label'))->toBe(['Gutachten', 'Anlage 3']);

    // The paper's own stays: its pages stand in the rows.
    $this->actingAs(pdfsAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/pdfs", ['label' => 'Gutachten KBA', 'dated_on' => null])->assertSessionHasNoErrors();
    $main = ApprovalDocumentFile::query()->where('is_main', true)->sole();

    $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs/{$main->id}/sichtbar", ['visible' => false])
        ->assertSessionHasErrors(['file' => DocumentPdfs::MAIN_HIDDEN]);

    expect(array_column(DocumentPdfs::of($document), 'label'))->toBe(['Gutachten KBA', 'Anlage 3']);
});

it('sets the order the customer reads them in, the paper’s own included', function (): void {
    [$document] = releasedWithPdf();

    foreach (['Nachtrag', 'Anlage'] as $label) {
        $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs", ['upload_key' => pendingPdf(), 'label' => $label])->assertSessionHasNoErrors();
    }

    [$nachtrag, $anlage] = ApprovalDocumentFile::query()->where('is_main', false)->orderBy('id')->pluck('id')->all();

    $this->actingAs(pdfsAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/pdfs-reihenfolge", ['order' => [$anlage, null, $nachtrag]])->assertSessionHasNoErrors();

    expect(array_column(DocumentPdfs::of($document->refresh()), 'label'))->toBe(['Anlage', 'Gutachten', 'Nachtrag']);

    // An order that leaves one out, or names another paper's, is refused whole.
    $this->actingAs(pdfsAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/pdfs-reihenfolge", ['order' => [$anlage, null]])->assertSessionHasErrors('order');
});

it('lets only who may edit Gutachten change them, and never on a revision the shop no longer reads', function (): void {
    [$document] = releasedWithPdf();
    $old = ApprovalDocument::factory()->abe()->create(['status' => 'superseded']);

    $this->actingAs(pdfsAdmin('support-agent'), 'admin')->post("/admin/gutachten/{$document->id}/pdfs", ['upload_key' => pendingPdf(), 'label' => 'Nachtrag'])->assertForbidden();
    $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$old->id}/pdfs", ['upload_key' => pendingPdf(), 'label' => 'Nachtrag'])->assertForbidden();

    expect(ApprovalDocumentFile::query()->where('is_main', false)->count())->toBe(0);
});

it('shows the customer every visible PDF beside the answer, the paper’s own at its row’s page — and one link where there is only that one', function (): void {
    [$document, $vehicle, $config] = releasedWithPdf();
    $one = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);

    expect(GutachtenPdfLink::files($one->document))->toBe([]);

    $this->actingAs(pdfsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/pdfs", ['upload_key' => pendingPdf(), 'label' => 'Nachtrag', 'dated_on' => '2025-07-02'])->assertSessionHasNoErrors();
    $two = app(FitmentResolver::class)->resolve($vehicle->id, $config->id);
    $links = GutachtenPdfLink::files($two->document);

    expect(array_column($links, 'label'))->toBe(['Gutachten', 'Nachtrag'])
        ->and($links[0]['page'])->toBe(6)
        ->and($links[0]['url'])->toEndWith('#page=6')
        ->and($links[1]['date'])->toBe('02.07.2025')
        ->and($links[1]['page'])->toBeNull()
        // Frozen with the verdict where there is more than the paper's own: label and hash of each.
        ->and(array_column($two->document->toArray()['files'] ?? [], 'label'))->toBe(['Gutachten', 'Nachtrag'])
        ->and($one->document->toArray())->not->toHaveKey('files');
});

it('lists the paper’s PDFs on its admin page, the hidden ones marked, with the right to change them', function (): void {
    [$document] = releasedWithPdf();

    $this->actingAs(pdfsAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('can.files', true)
            ->where('pdfs.0.label', 'Gutachten')
            ->where('pdfs.0.main', true)
            ->where('pdfs.0.dateLabel', '16.07.2025'));
});
