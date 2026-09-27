<?php

declare(strict_types=1);

use App\Enums\FitmentStatus;
use App\Http\Requests\Admin\ConditionCodeRequest;
use App\Http\Requests\Admin\FitmentRowsRequest;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\ConditionCode;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;

/**
 * The interaction review of Gutachten-Erfassung (docs/qa/BUGS.md, GUTACHTEN-01…51): every refusal is a
 * sentence under the field at fault, never a server fault; a released Gutachten's Auflage keeps its
 * meaning; a hidden number is not saved; German thousands are read; a missing PDF is said, not linked.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function qaAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

function qaSize(): WheelConfig
{
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);

    return WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'width_in' => 8.0, 'et_mm' => 35]);
}

function qaRows(array $vehicleIds, array $configIds, array $override = []): array
{
    return array_replace([
        'vehicle_ids' => $vehicleIds,
        'config_ids' => $configIds,
        'axle' => 'ALL',
        'requires_entry' => false,
        'entry_note' => '',
        'source_page' => 2,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL']],
        'conditions' => [],
    ], $override);
}

it('refuses limits typed the wrong way round with a sentence, never a server fault (GUTACHTEN-01)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create();
    $size = qaSize();

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['width_min' => '9', 'width_max' => '8', 'et_min' => '45', 'et_max' => '30']))
        ->assertSessionHasErrors(['width_max' => 'Die Breite bis ist kleiner als die Breite von.', 'et_max' => 'ET bis ist kleiner als ET von.']);

    expect(Fitment::query()->count())->toBe(0);
});

it('reads „+225“ and „225“ as one tyre size, and caps a batch (GUTACHTEN-01, -48)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create();
    $size = qaSize();
    $twice = [
        ['width_mm' => '+225', 'aspect' => 40, 'diameter' => 18, 'axle' => 'ALL'],
        ['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'axle' => 'ALL'],
    ];

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['tyre_sizes' => $twice]))
        ->assertSessionHasErrors(['tyre_sizes.1.width_mm' => 'Diese Reifengröße steht schon in der Liste.']);

    $vehicles = Vehicle::factory()->count(50)->create()->pluck('id')->all();
    $sizes = collect(range(1, 41))->map(fn (): int => qaSize()->id)->all();

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows($vehicles, $sizes))
        ->assertSessionHasErrors('config_ids');

    expect(FitmentRowsRequest::MAX_ROWS)->toBe(2000)->and(Fitment::query()->count())->toBe(0);
});

it('refuses a changed row that would twin another on the same axle (GUTACHTEN-23)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create();
    $size = qaSize();

    $this->actingAs(qaAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['axle' => 'FRONT']));
    $this->actingAs(qaAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['axle' => 'REAR']));
    $front = Fitment::query()->where('axle', 'FRONT')->firstOrFail();

    $this->actingAs(qaAdmin(), 'admin')
        ->put("/admin/gutachten/{$document->id}/zeilen/{$front->id}", qaRows([], [], ['axle' => 'REAR', 'vehicle_ids' => null, 'config_ids' => null]))
        ->assertSessionHasErrors(['axle' => 'Für dieses Fahrzeug und diese Größe gibt es schon eine Zeile mit dieser Achse.']);
});

it('keeps a released Gutachten’s Auflage as it is, and lets a draft’s change (GUTACHTEN-44)', function (): void {
    $code = ConditionCode::query()->create([
        'code' => 'QA_TEST', 'severity' => 'INFO', 'text_de' => 'Nur mit Serienradschrauben.', 'affects_tyre_choice' => false,
        'affects_purchase' => false, 'requires_acknowledgement' => false, 'sort_order' => 999,
    ]);
    $form = ['code' => 'QA_TEST', 'severity' => 'INFO', 'text' => 'Nur mit den Radschrauben des Herstellers.', 'affects_tyre_choice' => false, 'requires_acknowledgement' => false];

    // Used by nothing yet: it changes.
    $this->actingAs(qaAdmin(), 'admin')->put("/admin/auflagen/{$code->id}", $form)->assertSessionHasNoErrors();

    $document = ApprovalDocument::factory()->draft()->create();
    $this->actingAs(qaAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", qaRows([Vehicle::factory()->create()->id], [qaSize()->id], ['conditions' => [['id' => $code->id, 'note' => '']]]));
    Fitment::query()->where('approval_document_id', $document->id)->update(['status' => FitmentStatus::Published->value]);

    $this->actingAs(qaAdmin(), 'admin')->put("/admin/auflagen/{$code->id}", [...$form, 'severity' => 'WORKSHOP'])
        ->assertSessionHasErrors(['text' => ConditionCodeRequest::RELEASED_REFUSAL]);
    $this->actingAs(qaAdmin(), 'admin')->put("/admin/auflagen/{$code->id}", [...$form, 'code' => 'QA_SCHRAUBEN'])->assertSessionHasNoErrors();

    expect($code->fresh()?->severity->value)->toBe('INFO')->and($code->fresh()?->code)->toBe('QA_SCHRAUBEN');

    $this->actingAs(qaAdmin(), 'admin')->get('/admin/auflagen')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('can.delete', true)
        ->where('codes', fn ($codes): bool => collect($codes)->firstWhere('id', $code->id)['released'] === true)
        ->where('severities', fn ($severities): bool => collect($severities)->firstWhere('value', 'WORKSHOP')['acknowledged'] === true)
    );
});

it('accepts an Auflage whose sentence ends in a closing quote (GUTACHTEN-45)', function (): void {
    $this->actingAs(qaAdmin(), 'admin')->post('/admin/auflagen', [
        'code' => 'NUR_MARKE', 'severity' => 'RESTRICTION', 'text' => 'Nur mit Reifen der Marke „Beispiel.“',
        'affects_tyre_choice' => true, 'requires_acknowledgement' => false,
    ])->assertSessionHasNoErrors();
});

it('saves only the number the chosen kind carries (GUTACHTEN-28)', function (): void {
    $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
    Storage::disk('docs_private')->put($key, "%PDF-1.4\n% Beispiel\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");

    $this->actingAs(qaAdmin(), 'admin')->post('/admin/gutachten', [
        'upload_key' => $key, 'kind' => 'TEILEGUTACHTEN', 'report_number' => 'TG-7', 'kba_number' => '53810',
    ])->assertSessionHasNoErrors();

    expect(ApprovalDocument::query()->sole()->only(['report_number', 'kba_number']))->toBe(['report_number' => 'TG-7', 'kba_number' => null]);
});

it('reads axle loads written the German way (GUTACHTEN-38)', function (): void {
    $vehicle = Vehicle::factory()->create(['axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null, 'needs_review' => true]);

    $this->actingAs(qaAdmin(), 'admin')->put("/admin/fahrzeuge/{$vehicle->id}", ['axle_load_front_kg' => '1.200', 'axle_load_rear_kg' => '1.050', 'max_speed_kmh' => '250'])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert. Das Fahrzeug ist vollständig.');

    expect($vehicle->fresh()?->only(['axle_load_front_kg', 'axle_load_rear_kg', 'needs_review']))->toBe(['axle_load_front_kg' => 1200, 'axle_load_rear_kg' => 1050, 'needs_review' => false]);

    $this->actingAs(qaAdmin(), 'admin')->put("/admin/fahrzeuge/{$vehicle->id}", ['axle_load_front_kg' => '1200', 'axle_load_rear_kg' => '', 'max_speed_kmh' => '250'])
        ->assertSessionHas('toast', 'Gespeichert. Es fehlt jetzt eine Angabe – das Fahrzeug ist wieder zur Prüfung.');
});

it('says a stored PDF is missing instead of linking to nothing (GUTACHTEN-51)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['pdf_key' => 'gutachten/fehlt.pdf', 'pdf_sha256' => hash('sha256', 'x')]);

    $this->actingAs(qaAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page->where('document.pdfUrl', null)->where('document.pdfMissing', true));

    Storage::disk('docs_public')->put('gutachten/fehlt.pdf', '%PDF-1.4');

    $this->actingAs(qaAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page->where('document.pdfMissing', false)->whereNot('document.pdfUrl', null));
});

it('finds a vehicle by HSN and TSN pasted with a no-break space or a hyphen (GUTACHTEN-37)', function (): void {
    $vehicle = Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'QAT']);

    foreach (["0005\u{00A0}QAT", '0005-QAT'] as $term) {
        $this->actingAs(qaAdmin(), 'admin')->getJson('/admin/gutachten/suche/fahrzeuge?q='.rawurlencode($term))
            ->assertOk()->assertJsonPath('items.0.id', $vehicle->id);
    }

    expect(DB::table('fitments')->count())->toBe(0);
});

it('refuses a row whose Eintragung box and Auflage say opposite things', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create();
    $size = qaSize();
    $entry = ConditionCode::query()->where('code', 'ENTRY_REQUIRED')->firstOrFail();
    $none = ConditionCode::query()->where('code', 'NO_ENTRY_REQUIRED')->firstOrFail();

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['requires_entry' => false, 'conditions' => [['id' => $entry->id, 'note' => '']]]))
        ->assertSessionHasErrors('requires_entry');

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['requires_entry' => true, 'conditions' => [['id' => $none->id, 'note' => '']]]))
        ->assertSessionHasErrors('requires_entry');

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['requires_entry' => true, 'conditions' => [['id' => $entry->id, 'note' => '']]]))
        ->assertSessionHasNoErrors();

    expect(Fitment::query()->count())->toBe(1);
});
