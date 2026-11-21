<?php

declare(strict_types=1);

use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentRelease;
use App\Services\Admin\Approvals\DocumentRevision;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\EntryDriver;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * How a Gutachten gives its tyres' load index and speed symbol (the operator's brief of 17.10.2026, D-277): at every size,
 * through the vehicle's papers, or through its table of tyre load at speed. Kept with the document's facts where it was
 * answered. Since D-481 the tyres rest on what the document prints beside each size, so the answer decides nothing: the
 * release neither asks it nor holds the entry to it (D-483).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function indexAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/**
 * A draft with one row — one car, one wheel — on these tyre sizes, each with the index typed beside it as the document
 * prints it: „91Y“, „Y“, „91“, or '' for none.
 *
 * @param  list<string>  $printed
 */
function indexDraft(?TyreIndexSource $source, array $printed = ['']): ApprovalDocument
{
    $document = ApprovalDocument::factory()->draft()->tyreIndex($source)->create(['page_count' => 12]);
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0]);
    $sizes = array_map(
        function (string $index, int $i): array {
            preg_match('/^(\d*)([A-Z]*)$/', $index, $m);

            return ['width_mm' => 225 + 10 * $i, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => $m[1] === '' ? null : (int) $m[1], 'min_speed_symbol' => $m[2], 'axle' => 'ALL', 'codes' => []];
        },
        $printed,
        array_keys($printed),
    );

    EntryDriver::enter(test(), indexAdmin(), $document->id, [
        'vehicle_ids' => [Vehicle::factory()->create()->id], 'config_ids' => [$config->id], 'axle' => 'ALL', 'entry_note' => '', 'source_page' => 4,
        'tyre_sizes' => $sizes, 'conditions' => [],
    ]);

    return $document->refresh();
}

it('keeps the answer with the document’s facts, an empty choice as none, and refuses anything else', function (): void {
    $key = 'pending/'.Str::lower((string) Str::ulid()).'.pdf';
    Storage::disk('docs_private')->put($key, "%PDF-1.4\n% ABE 55255\n%%EOF\n");

    $this->actingAs(indexAdmin(), 'admin')->post('/admin/gutachten', ['upload_key' => $key, 'kind' => 'ABE', 'kba_number' => '55255', 'tyre_index_source' => 'table'])
        ->assertSessionHasNoErrors();
    $document = ApprovalDocument::query()->sole();

    expect($document->tyre_index_source)->toBe(TyreIndexSource::Table);

    $this->actingAs(indexAdmin(), 'admin')->put("/admin/gutachten/{$document->id}", ['kind' => 'ABE', 'kba_number' => '55255', 'tyre_index_source' => ''])
        ->assertSessionHasNoErrors();
    expect($document->refresh()->tyre_index_source)->toBeNull();

    $this->actingAs(indexAdmin(), 'admin')->put("/admin/gutachten/{$document->id}", ['kind' => 'ABE', 'kba_number' => '55255', 'tyre_index_source' => 'raten'])
        ->assertSessionHasErrors(['tyre_index_source' => 'Bitte wähl, wie das Gutachten Lastindex und Geschwindigkeitssymbol der Reifen angibt.']);

    // The database holds the three answers too: no other value is ever written, whatever path writes it.
    expect(fn () => DB::table('approval_documents')->where('id', $document->id)->update(['tyre_index_source' => 'raten']))->toThrow(QueryException::class);
});

it('shows the answer in the form and on the record — and nothing where there is none', function (): void {
    $answered = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
    $open = ApprovalDocument::factory()->draft()->tyreIndex(null)->create();

    $this->actingAs(indexAdmin(), 'admin')->get("/admin/gutachten/{$answered->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('document.shape.tyre_index_source', 'papers')
            ->where('document.header', fn ($header): bool => collect($header)->contains(['label' => 'Lastindex und Geschwindigkeitssymbol', 'value' => 'laut Gutachten aus den Fahrzeugpapieren'])));

    $this->actingAs(indexAdmin(), 'admin')->get("/admin/gutachten/{$open->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('document.shape.tyre_index_source', '')
            ->where('document.header', fn ($header): bool => ! collect($header)->contains('label', 'Lastindex und Geschwindigkeitssymbol')));
});

it('releases a document nobody has answered it for: the answer decides nothing since D-481 (D-483)', function (): void {
    $document = indexDraft(null);

    expect(app(DocumentRelease::class)->check($document))->toBe([]);
    $this->actingAs(indexAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();
    expect($document->refresh()->status->value)->toBe('published')
        ->and($document->tyre_index_source)->toBeNull();

    // The step's own way to answer it is gone with the question: 404, or 405 where another route claims the address.
    $gone = $this->actingAs(indexAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/lastindex", ['tyre_index_source' => 'papers']);

    expect($gone->status())->toBeIn([404, 405])
        ->and($document->refresh()->tyre_index_source)->toBeNull();
});

it('releases „Tabelle“ with no table typed: the shop reads ETRTO\'s for every document (D-459)', function (): void {
    $document = indexDraft(TyreIndexSource::Table);

    expect(app(DocumentRelease::class)->check($document))->toBe([]);
    $this->actingAs(indexAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();
    expect($document->refresh()->status->value)->toBe('published');
});

it('holds „bei jeder Reifengröße“ to nothing: a size without its figures asks nothing, as the verdict does (D-481, D-483)', function (): void {
    expect(app(DocumentRelease::class)->check(indexDraft(TyreIndexSource::Document, ['91Y', '', ''])))->toBe([])
        ->and(app(DocumentRelease::class)->check(indexDraft(TyreIndexSource::Document, ['91Y', 'W', '93'])))->toBe([])
        ->and(app(DocumentRelease::class)->check(indexDraft(TyreIndexSource::Papers, ['Y', ''])))->toBe([]);
});

it('asks nothing of a base without rows of its own — its Nachtrag answers for its Verwendungsbereich', function (): void {
    $base = ApprovalDocument::factory()->abe()->draft()->tyreIndex(null)->create(['papers_correction_required' => false]);
    ApprovalDocument::factory()->create(['kind' => 'NACHTRAG', 'supplement_to_id' => $base->id]);

    expect(app(DocumentRelease::class)->check($base))->toBe([]);
});

it('carries the answer into a new revision: it is a fact of the document, not of one release', function (): void {
    $released = ApprovalDocument::factory()->tyreIndex(TyreIndexSource::Table)->create();

    expect(app(DocumentRevision::class)->draftFrom($released, indexAdmin())->tyre_index_source)->toBe(TyreIndexSource::Table);
});

it('reads the client’s two documents as the team entered them: ABE 55255 by its table, the Nachtrag by the papers — the table itself never typed (D-459)', function (): void {
    /** @var array{documents: array<string, array<string, mixed>&array{row: array<string, mixed>}>} $set */
    $set = require database_path('seeders/content/abnahme/gutachten.php');
    $read = fn (string $file): mixed => json_decode((string) file_get_contents(base_path("docs/gutachten/{$file}")), true, flags: JSON_THROW_ON_ERROR)['document']['tyre_index_source'] ?? null;

    expect($set['documents']['abe-55255']['row']['tyre_index_source'])->toBe('table')
        // Its table is not typed: every document reads ETRTO's, the same figures as its page 6.
        ->and($set['documents']['abe-55255'])->not->toHaveKey('speed_deratings')
        ->and($set['documents']['nachtrag-366-0350-21']['row']['tyre_index_source'])->toBe('papers')
        ->and($read('abe-55255.json'))->toBe('table')
        ->and($read('366-0350-21-WIRD-N1.json'))->toBe('papers');
});

// His admin item 9: the minimum in two fields of its own — what the form sends, the server takes apart and checks apart.
it('reads load index and speed symbol apart, and keeps a line neither stands in the tables for, saying why @admin-209', function (): void {
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create(['page_count' => 12]);
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 19.0]);
    $vehicle = Vehicle::factory()->create();
    $entry = EntryDriver::car(test(), indexAdmin(), $document->id, $vehicle->id, $config->id);
    $line = fn (string $tyre) => test()->actingAs(indexAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}", [
        'lines' => [['id' => null, 'front' => $tyre, 'rear' => $tyre, 'kw' => '', 'codes' => []]], 'codes' => [], 'source_page' => 4,
    ])->assertOk();

    // A tyre that does not read — no size in it — is kept as typed, said, and writes nothing; the release waits for it. A figure is
    // never why (D-479): the form of the size is all that is checked.
    $line('Winterreifen 245')->assertJsonPath('car.lines.0.frontWhy', 'Nicht lesbar. Schreib die Größe etwa so: 225/40 R18 88W, 305/70 R22.5 160F oder 235/50R18.');
    expect(DB::table('fitment_tyre_sizes')->count())->toBe(0)
        ->and(implode(' ', app(DocumentRelease::class)->check($document)))->toContain('nicht lesbar');
    // Past 120 Regulation No 30 prints no capacity (D-310): entered as the paper prints it all the same, since the client's round of
    // 08.11.2026, §4 (D-442) — the shop answers its tyres „Noch nicht bestätigt“ (TopSpeedByDocumentTest), never an estimate.
    $line('245/35 R19 121Y')->assertJsonPath('car.lines.0.frontWhy', null);
    expect(DB::table('fitment_tyre_sizes')->orderByDesc('id')->value('min_load_index'))->toBe(121);
    // Any symbol is kept as typed (D-479); the exact size is what the shop then offers.
    $line('245/35 R19 93X')->assertJsonPath('car.lines.0.front', '245/35 R19 93X')->assertJsonPath('car.lines.0.frontWhy', null);
    $line('245/35 R19 93Y')->assertJsonPath('car.lines.0.frontWhy', null);

    $size = DB::table('fitment_tyre_sizes')->orderByDesc('id')->first();
    expect($size?->min_load_index)->toBe(93)
        ->and($size?->min_speed_symbol)->toBe('Y');
});

// The client's message of 19.11.2026 (D-479): „remove all restrictions completely … only keep the normal string format validation“.
// Each string he and the brief name is saved by the step-4 entry as typed, written with its figures, and shown back.
it('saves every size the client types in step 4, with any load index and any symbol, and shows it back as typed (D-479)', function (string $typed, string $shown, float $rim, ?int $li, ?string $si): void {
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create(['page_count' => 12]);
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => $rim]);
    $entry = EntryDriver::car(test(), indexAdmin(), $document->id, Vehicle::factory()->create()->id, $config->id);

    test()->actingAs(indexAdmin(), 'admin')->putJson("/admin/gutachten/{$document->id}/erfassung/fahrzeuge/{$entry->id}", [
        'lines' => [['id' => null, 'front' => $typed, 'rear' => $typed, 'kw' => '', 'codes' => []]], 'codes' => [], 'source_page' => 4,
    ])->assertOk()
        ->assertJsonPath('car.lines.0.front', $shown)->assertJsonPath('car.lines.0.rear', $shown)
        ->assertJsonPath('car.lines.0.frontWhy', null)->assertJsonPath('car.lines.0.rearWhy', null);

    $size = DB::table('fitment_tyre_sizes')->orderByDesc('id')->first();

    expect($size)->not->toBeNull()
        ->and((float) $size->diameter_in)->toBe($rim)
        ->and($size->min_load_index)->toBe($li)
        ->and($size->min_speed_symbol)->toBe($si);
})->with([
    'the screenshot' => ['305/70 R22.5 160F', '305/70 R22.5 160F', 22.5, 160, 'F'],
    'dual index, L' => ['315/80R22.5 156/150L', '315/80 R22.5 156/150L', 22.5, 156, 'L'],
    'W' => ['225/40 R18 88W', '225/40 R18 88W', 18.0, 88, 'W'],
    'no symbol' => ['245/45R18 100', '245/45 R18 100', 18.0, 100, null],
    'no figures' => ['235/50R18', '235/50 R18', 18.0, null, null],
    'ZR, bracket Y' => ['225/45 ZR17 (91Y)', '225/45 R17 91(Y)', 17.0, 91, '(Y)'],
    'index and symbol apart' => ['205/55 R16 91 V', '205/55 R16 91V', 16.0, 91, 'V'],
    'C, dual, T' => ['195/65 R15 C 99/97 T', '195/65 R15 C 99/97T', 15.0, 99, 'T'],
    'half rim 19.5, M' => ['265/70 R19.5 140/138 M', '265/70 R19.5 140/138M', 19.5, 140, 'M'],
    'A8' => ['205/55 R16 94 A8', '205/55 R16 94A8', 16.0, 94, 'A8'],
]);
