<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentCarEntry;
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
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\EntryDriver;

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

function qaEntry(ApprovalDocument $document): DocumentCarEntry
{
    return EntryDriver::car(test(), qaAdmin(), $document->id, Vehicle::factory()->create()->id, qaSize()->id);
}

/** Step 4's save of one car, with what the page sends beside the lines. */
function qaSave(DocumentCarEntry $entry, array $body): TestResponse
{
    return test()->actingAs(qaAdmin(), 'admin')->putJson("/admin/gutachten/{$entry->approval_document_id}/erfassung/fahrzeuge/{$entry->id}", $body + ['lines' => [['id' => null, 'front' => '225/40 R18', 'rear' => '225/40 R18', 'kw' => '', 'codes' => []]], 'codes' => [], 'source_page' => 2]);
}

/** A line of one size for both axles. */
function qaLine(string $tyre, string $kw = '', array $codes = []): array
{
    return ['id' => null, 'front' => $tyre, 'rear' => $tyre, 'kw' => $kw, 'codes' => $codes];
}

it('refuses limits typed the wrong way round with a sentence, never a server fault (GUTACHTEN-01)', function (): void {
    $entry = qaEntry(ApprovalDocument::factory()->draft()->create());

    qaSave($entry, ['width_min' => '9', 'width_max' => '8', 'et_min' => '45', 'et_max' => '30'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['width_max' => '„Breite bis“ ist kleiner als „Breite von“.', 'et_max' => '„ET bis“ ist kleiner als „ET von“.']);

    expect(Fitment::query()->where('approval_document_id', $entry->approval_document_id)->whereHas('tyreSizes')->count())->toBe(0);
});

it('keeps two lines of one size on one tyre entry, and caps a selection of cars (GUTACHTEN-48)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $entry = qaEntry($document);

    qaSave($entry, ['lines' => [qaLine('225/40 R18'), qaLine('225/40R18')]])->assertOk();

    expect(FitmentTyreSize::query()->count())->toBe(1);

    $this->actingAs(qaAdmin(), 'admin')->postJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge", ['vehicle_ids' => range(1, 501)])
        ->assertUnprocessable()->assertJsonValidationErrors('vehicle_ids');
});

it('takes one size printed at two kW bands, or with two load indexes, as two entries (Block D)', function (): void {
    // ABE 55255, page 5: BMW Z3 — 225/35R19 at 85–110 kW and at 85–125 kW; the 18″ Nachtrag, page 7: 225/40R18
    // as 88Y and as 92.
    $entry = qaEntry(ApprovalDocument::factory()->draft()->create());

    qaSave($entry, ['lines' => [
        qaLine('225/35 R19', '85-110', ['K2b']),
        qaLine('225/35 R19', '85-125', ['R70']),
        qaLine('225/40 R18 88Y'),
        qaLine('225/40 R18 92'),
    ]])->assertOk();

    expect(FitmentTyreSize::query()->count())->toBe(4);
});

it('reads one figure as a band of one power, and refuses a band it cannot read (§4: 170 kW)', function (): void {
    $entry = qaEntry(ApprovalDocument::factory()->draft()->create());

    qaSave($entry, ['lines' => [qaLine('225/40 R18 88', '170 kW')]])->assertOk();
    expect(FitmentTyreSize::query()->sole()->only(['kw_min', 'kw_max']))->toBe(['kw_min' => 170, 'kw_max' => 170]);

    qaSave($entry, ['lines' => [qaLine('225/40 R18 88', '195-85')]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['lines.0.kw' => 'Den kW-Bereich bitte so, wie das Gutachten ihn druckt: zwei ganze Zahlen, die kleinere zuerst, etwa 85-195.']);
});

it('takes one code beside several sizes, as the documents print it, and one typed twice beside one as once (Block D)', function (): void {
    // ABE 55255, page 2: K2b, K41 and K46 beside 215/35R19, 225/35R19 and 235/35R19 alike.
    $entry = qaEntry(ApprovalDocument::factory()->draft()->create());

    qaSave($entry, ['lines' => [
        qaLine('215/35 R19', '85-125', ['K2b', 'K41', 'K46', 'T85', 'K2b']),
        qaLine('225/35 R19', '85-195', ['K2b', 'K41', 'K43', 'K46', 'T84', 'T88']),
    ]])->assertOk();

    expect(DB::table('fitment_tyre_size_conditions')->count())->toBe(10);
});

it('takes a code as the 18″ Nachtrag prints it in its Auflagen column — words, umlauts, a hyphen (Block D)', function (): void {
    // 24 pages, as the Nachtrag has: the factory's random count was sometimes below the page 7 cited here.
    $document = ApprovalDocument::factory()->draft()->create(['page_count' => 24]);
    $entry = qaEntry($document);

    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/auflagen", ['code' => "Nicht\u{00A0}330D", 'kind' => 'verbot', 'text_de' => 'Diese Reifengröße ist nicht für den 330d zugelassen (im Gutachten: „Nicht 330D“).', 'source_page' => 7])
        ->assertSessionHasNoErrors();
    $this->actingAs(qaAdmin(), 'admin')
        ->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'Schrägheck 2-türig', 'kind' => 'karosserieform', 'body_forms' => ['Schrägheck'], 'text_de' => 'Im Gutachten in der Spalte Auflagen: „Schrägheck 2-türig“.', 'source_page' => 4])
        ->assertSessionHasNoErrors();

    expect(DocumentCondition::query()->where('approval_document_id', $document->id)->pluck('code')->all())->toEqualCanonicalizing(['Nicht 330D', 'Schrägheck 2-türig']);

    qaSave($entry, ['lines' => [qaLine('245/35 R18 92', '', ['Nicht 330D', '57F'])], 'codes' => [['code' => 'Schrägheck 2-türig', 'note' => null]]])->assertOk();

    qaSave($entry, ['codes' => [['code' => 'K1c/2', 'note' => null]]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['codes.0.code' => DocumentConditions::CODE_MESSAGE]);
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
        ->assertSessionHas('toast', 'Gespeichert. Jetzt fehlt mindestens eine Angabe – das Fahrzeug steht wieder unter „Zur Prüfung“.');
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
    $this->actingAs(qaAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/auflagen", ['code' => 'A01', 'kind' => 'abnahme', 'text_de' => 'Die Anbauabnahme ist erforderlich.']);
    $plain = qaEntry($document);
    $abnahme = EntryDriver::car(test(), qaAdmin(), $document->id, Vehicle::factory()->create()->id, (int) DB::table('fitments')->where('approval_document_id', $document->id)->value('wheel_config_id'));

    // The old box is gone: a typed „yes“ without an Abnahme among the codes is not a yes.
    qaSave($plain, ['requires_entry' => true])->assertOk();
    qaSave($abnahme, ['codes' => [['code' => 'A01', 'note' => null]]])->assertOk();

    expect(Fitment::query()->where('vehicle_id', $plain->vehicle_id)->value('requires_entry'))->toBeFalse()
        ->and(Fitment::query()->where('vehicle_id', $abnahme->vehicle_id)->value('requires_entry'))->toBeTrue();
});
