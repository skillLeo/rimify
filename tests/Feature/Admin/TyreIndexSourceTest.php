<?php

declare(strict_types=1);

use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\DocumentSpeedDerating;
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
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * How a Gutachten gives its tyres' load index and speed symbol (the operator's brief of 17.10.2026, D-277): at every size,
 * through the vehicle's papers, or through its table of tyre load at speed. Read off the document, kept with its facts,
 * asked before release — and an answer the entry does not bear out stops the release, because the answer decides whether
 * a car's top speed is needed at all.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

const INDEX_UNANSWERED = 'Wähl unter „Angaben“, wie das Gutachten Lastindex und Geschwindigkeitssymbol der Reifen angibt: bei jeder Reifengröße, mit einem Verweis auf die Fahrzeugpapiere oder in einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.';
const INDEX_TABLE_MISSING = 'Laut den Angaben druckt das Gutachten eine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit, erfasst ist sie nicht. Trag sie ein oder ändere die Angabe.';

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

    test()->actingAs(indexAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [
        'vehicle_ids' => [Vehicle::factory()->create()->id], 'config_ids' => [$config->id], 'axle' => 'ALL', 'entry_note' => '', 'source_page' => 4,
        'tyre_sizes' => $sizes, 'conditions' => [],
    ])->assertSessionHasNoErrors();

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

it('does not release a document nobody has answered it for, and says where to answer', function (): void {
    $document = indexDraft(null);

    expect(app(DocumentRelease::class)->check($document))->toBe([INDEX_UNANSWERED]);
    $this->actingAs(indexAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))
        ->assertSessionHasErrors(['release' => 'Noch nicht freigebbar: '.INDEX_UNANSWERED]);

    $document->forceFill(['tyre_index_source' => TyreIndexSource::Papers])->save();

    expect(app(DocumentRelease::class)->check($document))->toBe([]);
    $this->actingAs(indexAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();
    expect($document->refresh()->status->value)->toBe('published');
});

it('holds „Tabelle“ to a table typed from this document — the demo seed’s example is not one', function (): void {
    $document = indexDraft(TyreIndexSource::Table);

    expect(app(DocumentRelease::class)->check($document))->toBe([INDEX_TABLE_MISSING]);

    DocumentSpeedDerating::query()->create(['approval_document_id' => $document->id, 'speed_kmh' => 240, 'symbol' => 'V', 'percent' => 91, 'source_page' => 6, 'seeded_from' => 'ABE 55255']);
    expect(app(DocumentRelease::class)->check($document))->toBe([INDEX_TABLE_MISSING]);

    DocumentSpeedDerating::query()->where('approval_document_id', $document->id)->delete();
    DocumentSpeedDerating::query()->create(['approval_document_id' => $document->id, 'speed_kmh' => 240, 'symbol' => 'V', 'percent' => 91, 'source_page' => 6]);
    expect(app(DocumentRelease::class)->check($document))->toBe([]);
});

it('holds „bei jeder Reifengröße“ to both figures at every size — load index and symbol (D-285)', function (): void {
    $sentence = fn (string $sizes): string => "{$sizes} der Lastindex oder das Geschwindigkeitssymbol, obwohl das Gutachten laut den Angaben beide bei jeder Größe nennt. Trag sie nach oder ändere die Angabe.";

    expect(app(DocumentRelease::class)->check(indexDraft(TyreIndexSource::Document, ['91Y', '', ''])))->toBe([$sentence('Bei 2 Reifengrößen fehlt')])
        ->and(app(DocumentRelease::class)->check(indexDraft(TyreIndexSource::Document, ['91Y', '93W', ''])))->toBe([$sentence('Bei einer Reifengröße fehlt')])
        // A symbol without its load index, or a load index without its symbol, is half the answer.
        ->and(app(DocumentRelease::class)->check(indexDraft(TyreIndexSource::Document, ['91Y', 'W', '93'])))->toBe([$sentence('Bei 2 Reifengrößen fehlt')])
        ->and(app(DocumentRelease::class)->check(indexDraft(TyreIndexSource::Document, ['91Y', '93W'])))->toBe([])
        // The papers ask nothing of the sizes: an index printed at some of them is a minimum, not the answer.
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

it('reads the client’s two documents as the team entered them: ABE 55255 by its table, the Nachtrag by the papers', function (): void {
    /** @var array{documents: array<string, array{row: array<string, mixed>, speed_deratings: list<array<string, mixed>>}>} $set */
    $set = require database_path('seeders/content/abnahme/gutachten.php');
    $read = fn (string $file): mixed => json_decode((string) file_get_contents(base_path("docs/gutachten/{$file}")), true, flags: JSON_THROW_ON_ERROR)['document']['tyre_index_source'] ?? null;

    expect($set['documents']['abe-55255']['row']['tyre_index_source'])->toBe('table')
        // Its table is typed from page 6, not the demo seed's: the answer is borne out.
        ->and(collect($set['documents']['abe-55255']['speed_deratings'])->whereNull('seeded_from')->count())->toBeGreaterThan(0)
        ->and($set['documents']['nachtrag-366-0350-21']['row']['tyre_index_source'])->toBe('papers')
        ->and($read('abe-55255.json'))->toBe('table')
        ->and($read('366-0350-21-WIRD-N1.json'))->toBe('papers');
});

// His admin item 9: the minimum in two fields of its own — what the form sends, the server takes apart and checks apart.
it('takes load index and speed symbol as two fields, and refuses either one the tables do not hold @admin-209', function (): void {
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Document)->create(['page_count' => 12]);
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 19.0]);
    $vehicle = Vehicle::factory()->create();
    $row = fn (mixed $loadIndex, string $symbol) => test()->actingAs(indexAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [
        'vehicle_ids' => [$vehicle->id], 'config_ids' => [$config->id], 'axle' => 'ALL', 'entry_note' => '', 'source_page' => 4, 'conditions' => [],
        'tyre_sizes' => [['width_mm' => 245, 'aspect' => 35, 'diameter' => 19, 'min_load_index' => $loadIndex, 'min_speed_symbol' => $symbol, 'axle' => 'ALL', 'codes' => []]],
    ]);

    $row(999, 'Y')->assertSessionHasErrors(['tyre_sizes.0.min_load_index' => 'Diesen Tragfähigkeitsindex kennt der Shop nicht. Er rechnet mit den Indizes 70 bis 120.']);
    // D-310: past 120 Regulation No 30 prints no capacity — the row waits rather than taking an estimate.
    $row(121, 'Y')->assertSessionHasErrors(['tyre_sizes.0.min_load_index']);
    $row(93, 'X')->assertSessionHasErrors(['tyre_sizes.0.min_speed_symbol' => 'Dieses Geschwindigkeitssymbol gibt es nicht.']);
    $row(93, 'Y')->assertSessionHasNoErrors();

    $size = DB::table('fitment_tyre_sizes')->orderByDesc('id')->first();
    expect($size?->min_load_index)->toBe(93)
        ->and($size?->min_speed_symbol)->toBe('Y');
});
