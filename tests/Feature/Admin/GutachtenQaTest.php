<?php

declare(strict_types=1);

use App\Http\Requests\Admin\FitmentRowsRequest;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentConditions;
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
        ->assertSessionHasErrors(['tyre_sizes.1.width_mm' => 'Diese Reifengröße steht mit diesem kW-Bereich und diesen Indizes schon in der Liste.']);

    $vehicles = Vehicle::factory()->count(50)->create()->pluck('id')->all();
    $sizes = collect(range(1, 41))->map(fn (): int => qaSize()->id)->all();

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows($vehicles, $sizes))
        ->assertSessionHasErrors('config_ids');

    expect(FitmentRowsRequest::MAX_ROWS)->toBe(2000)->and(Fitment::query()->count())->toBe(0);
});

it('takes one size printed at two kW bands, or with two load indexes, as two entries (Block D)', function (): void {
    // ABE 55255, page 5: BMW Z3 — 225/35R19 at 85–110 kW and at 85–125 kW; the 18″ Nachtrag, page 7: 225/40R18
    // as 88Y and as 92.
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create();
    $size = qaSize();
    $entries = [
        ['width_mm' => 225, 'aspect' => 35, 'diameter' => 19, 'axle' => 'ALL', 'kw_min' => 85, 'kw_max' => 110, 'codes' => ['K2b']],
        ['width_mm' => 225, 'aspect' => 35, 'diameter' => 19, 'axle' => 'ALL', 'kw_min' => 85, 'kw_max' => 125, 'codes' => ['R70']],
        ['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'axle' => 'ALL', 'min_load_index' => 88, 'min_speed_symbol' => 'Y'],
        ['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'axle' => 'ALL', 'min_load_index' => 92],
    ];

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['tyre_sizes' => $entries]))
        ->assertSessionHasNoErrors();

    expect(FitmentTyreSize::query()->count())->toBe(4);

    // The same band and indexes twice is one entry typed twice.
    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['tyre_sizes' => [$entries[0], [...$entries[0], 'codes' => ['R70']]]]))
        ->assertSessionHasErrors(['tyre_sizes.1.width_mm' => 'Diese Reifengröße steht mit diesem kW-Bereich und diesen Indizes schon in der Liste.']);
});

it('takes one code beside several sizes, as the documents print it, and refuses it twice beside one (Block D)', function (): void {
    // ABE 55255, page 2: K2b, K41 and K46 beside 215/35R19, 225/35R19 and 235/35R19 alike.
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create();
    $size = qaSize();
    $sizes = [
        ['width_mm' => 215, 'aspect' => 35, 'diameter' => 19, 'axle' => 'ALL', 'kw_min' => 85, 'kw_max' => 125, 'codes' => ['K2b', 'K41', 'K46', 'T85']],
        ['width_mm' => 225, 'aspect' => 35, 'diameter' => 19, 'axle' => 'ALL', 'kw_min' => 85, 'kw_max' => 195, 'codes' => ['K2b', 'K41', 'K43', 'K46', 'T84', 'T88']],
    ];

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['tyre_sizes' => $sizes]))
        ->assertSessionHasNoErrors();

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['tyre_sizes' => [[...$sizes[0], 'codes' => ['K2b', 'K41', 'K2b']]]]))
        ->assertSessionHasErrors(['tyre_sizes.0.codes.2' => 'Dieser Code steht bei der Reifengröße zweimal.']);
});

it('takes a code as the 18″ Nachtrag prints it in its Auflagen column — words, umlauts, a hyphen (Block D)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create();
    $size = qaSize();

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/auflagen", ['code' => "Nicht\u{00A0}330D", 'kind' => 'verbot', 'text_de' => 'Diese Reifengröße ist nicht für den 330d zugelassen (im Gutachten: „Nicht 330D“).', 'source_page' => 7])
        ->assertSessionHasNoErrors();
    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'Schrägheck 2-türig', 'kind' => 'karosserieform', 'body_forms' => ['Schrägheck'], 'text_de' => 'Im Gutachten in der Spalte Auflagen: „Schrägheck 2-türig“.', 'source_page' => 4])
        ->assertSessionHasNoErrors();

    expect(DocumentCondition::query()->where('approval_document_id', $document->id)->pluck('code')->all())->toEqualCanonicalizing(['Nicht 330D', 'Schrägheck 2-türig']);

    $sizes = [['width_mm' => 245, 'aspect' => 35, 'diameter' => 18, 'axle' => 'ALL', 'min_load_index' => 92, 'codes' => ['Nicht 330D', '57F']]];

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['tyre_sizes' => $sizes, 'conditions' => [['code' => 'Schrägheck 2-türig']]]))
        ->assertSessionHasNoErrors();

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [$size->id], ['conditions' => [['code' => 'K1c/2']]]))
        ->assertSessionHasErrors(['conditions.0.code' => DocumentConditions::CODE_MESSAGE]);
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

it('fixes a released Gutachten’s Auflagen, and lets a draft’s change (GUTACHTEN-44)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $form = ['code' => 'S01', 'kind' => 'hinweis', 'text_de' => 'Nur mit Serienradschrauben.'];
    $this->actingAs(qaAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", $form)->assertSessionHasNoErrors();
    $condition = DocumentCondition::query()->sole();

    // A draft's list changes.
    $this->actingAs(qaAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/auflagen/{$condition->id}", [...$form, 'kind' => 'befestigung', 'text_de' => 'Nur mit den Radschrauben des Herstellers.'])
        ->assertSessionHasNoErrors();
    expect($condition->fresh()?->kind->value)->toBe('befestigung');

    // A released one's does not: its meaning is what the shop told customers.
    $document->forceFill(['status' => 'published'])->save();
    $this->actingAs(qaAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/auflagen/{$condition->id}", [...$form, 'kind' => 'karosseriearbeit'])->assertForbidden();

    expect($condition->fresh()?->kind->value)->toBe('befestigung');
});

it('accepts an Auflage whose sentence ends in a closing quote (GUTACHTEN-45)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();

    $this->actingAs(qaAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", [
        'code' => 'R12', 'kind' => 'verbot', 'text_de' => 'Nur mit Reifen der Marke „Beispiel.“',
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

it('never takes the Eintragung as typed: it follows from an Abnahme among the codes (the corrections memo §2)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $vehicle = Vehicle::factory()->create();
    $this->actingAs(qaAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'A01', 'kind' => 'abnahme', 'text_de' => 'Die Anbauabnahme ist erforderlich.']);

    // The old box is gone: a typed „yes“ without an Abnahme among the codes is not a yes.
    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [qaSize()->id], ['requires_entry' => true]))
        ->assertSessionHasNoErrors();
    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/zeilen", qaRows([$vehicle->id], [qaSize()->id], ['conditions' => [['code' => 'A01', 'note' => '']]]))
        ->assertSessionHasNoErrors();

    expect(Fitment::query()->orderBy('id')->pluck('requires_entry')->all())->toBe([false, true]);
});
