<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use App\Models\DocumentConditionRework;
use App\Models\DocumentFastener;
use App\Models\DocumentNotice;
use App\Models\DocumentSpeedDerating;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Admin\Approvals\DocumentRevision;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * ADMIN-GEFUNDEN 510 (the operator's brief of 16.10.2026, Group A): release was a door with no handle on the other side.
 * The released page said „Für Änderungen legst du eine neue Fassung an“ and offered no way to do it; the client looked
 * nine times in six minutes. „Neue Fassung anlegen“ now starts a draft revision holding everything the released one
 * holds, and the shop reads the released one until the new one is released and supersedes it.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function revisionAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', "{$role}@rimify.test")->firstOrFail();
}

/** A released Teilegutachten with something in every table a document owns. */
function releasedWithEverything(): ApprovalDocument
{
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);
    test()->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", ['codes' => 2, 'codes_page' => 3, 'sizes' => 1, 'sizes_page' => 3, 'axle_limit_kg' => null, 'axle_limit_page' => null, 'abnahme' => 'all', 'abnahme_page' => 4])->assertSessionHasNoErrors();

    $note = DocumentCondition::factory()->kind(ConditionKind::Hinweis, 'Nur mit dem BBS-Zubehörsatz T.Nr. 09.31.149.')->create(['approval_document_id' => $document->id, 'code' => '0', 'level' => 'auflage']);
    $arch = DocumentCondition::factory()->kind(ConditionKind::Abnahme, 'Abnahme nach § 19 Abs. 3 StVZO.')->create(['approval_document_id' => $document->id, 'code' => 'A01']);
    DocumentConditionRework::query()->create(['document_condition_id' => $arch->id, 'vehicle_type' => 'E90', 'axle' => 'REAR', 'from_mm' => 15, 'to_mm' => 30, 'flare_mm' => null, 'note_de' => null]);
    DocumentFastener::query()->create(['approval_document_id' => $document->id, 'number' => 'S01', 'thread' => 'M14x1,25', 'seat' => 'Kegelbund 60°', 'torque_nm' => 120, 'source_page' => 5]);
    DocumentNotice::query()->create(['approval_document_id' => $document->id, 'text_de' => 'Radschrauben nach 50 km nachziehen.', 'source_page' => 5, 'sort_order' => 1]);
    DocumentSpeedDerating::query()->create(['approval_document_id' => $document->id, 'speed_kmh' => 240, 'symbol' => 'V', 'percent' => '91', 'source_page' => 6]);

    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'LeMans']);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0]);
    test()->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [
        'vehicle_ids' => Vehicle::factory()->count(2)->create(['eg_nummer_raw' => 'e1*2007/46*0316*11', 'eg_nummer_norm' => 'e1*2007/46*0316*11'])->pluck('id')->all(),
        'config_ids' => [$size->id], 'axle' => 'ALL', 'entry_note' => '', 'source_page' => 3,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => ['A01']]],
        'conditions' => [['code' => '0', 'note' => null]],
    ])->assertSessionHasNoErrors();
    // The list of the entry its cars fall under (his admin item 19, D-358).
    test()->actingAs(revisionAdmin(), 'admin')->put("/admin/gutachten/{$document->id}/bereifungskombinationen", [
        'entry' => 'e1*2007/46*0316*11', 'source_page' => 4, 'combinations' => [['number' => 1, 'front' => '225/40 R18', 'rear' => '225/40 R18']],
    ])->assertSessionHasNoErrors();

    test()->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();

    return $document->refresh();
}

/** @return array<string, int> what a document holds, table by table */
function holdings(int $id): array
{
    $rows = DB::table('fitments')->where('approval_document_id', $id)->pluck('id');
    $sizes = DB::table('fitment_tyre_sizes')->whereIn('fitment_id', $rows)->pluck('id');
    $conditions = DB::table('document_conditions')->where('approval_document_id', $id)->pluck('id');

    return [
        'document_conditions' => $conditions->count(),
        'document_condition_reworks' => DB::table('document_condition_reworks')->whereIn('document_condition_id', $conditions)->count(),
        'document_fasteners' => DB::table('document_fasteners')->where('approval_document_id', $id)->count(),
        'document_notices' => DB::table('document_notices')->where('approval_document_id', $id)->count(),
        'document_speed_deratings' => DB::table('document_speed_deratings')->where('approval_document_id', $id)->count(),
        'document_tyre_combinations' => DB::table('document_tyre_combinations')->where('approval_document_id', $id)->count(),
        'fitments' => $rows->count(),
        'fitment_conditions' => DB::table('fitment_conditions')->whereIn('fitment_id', $rows)->count(),
        'fitment_tyre_sizes' => $sizes->count(),
        'fitment_tyre_size_conditions' => DB::table('fitment_tyre_size_conditions')->whereIn('fitment_tyre_size_id', $sizes)->count(),
    ];
}

it('starts a new revision as a draft holding all the released one holds — the shop still reads the released one', function (): void {
    $released = releasedWithEverything();

    $response = $this->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/neue-fassung")->assertSessionHasNoErrors();
    $draft = ApprovalDocument::query()->where('supersedes_id', $released->id)->sole();
    $response->assertRedirect('/admin/gutachten/'.$draft->id);

    expect(holdings($draft->id))->toBe(holdings($released->id))
        ->and(array_sum(holdings($draft->id)))->toBeGreaterThan(10)
        ->and($draft->status->value)->toBe('draft')
        ->and($draft->revision)->toBe($released->revision + 1)
        ->and($draft->completeness)->toBeNull()
        ->and([$draft->counted_codes, $draft->counted_abnahme_page])->toBe([2, 4])
        ->and(DB::table('fitments')->where('approval_document_id', $draft->id)->distinct()->pluck('status')->all())->toBe(['draft'])
        // The level the person chose travels with the code.
        ->and(DocumentCondition::query()->where('approval_document_id', $draft->id)->where('code', '0')->value('level')?->value)->toBe('auflage')
        // The released one is untouched: the shop reads it until the new one is released.
        ->and($released->refresh()->status->value)->toBe('published')
        ->and(DB::table('fitments')->where('approval_document_id', $released->id)->distinct()->pluck('status')->all())->toBe(['published']);

    $entry = AuditLog::query()->where('description', 'approval.revision_started')->sole();
    expect($entry->properties['revision'])->toBe($released->revision + 1)->and($entry->properties['rows'])->toBe(2);
});

it('opens the revision already started instead of copying twice, and the released page offers it', function (): void {
    $released = releasedWithEverything();
    $this->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/neue-fassung");
    $this->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/neue-fassung")
        ->assertSessionHas('toast', 'Für dieses Gutachten gibt es schon eine neue Fassung im Entwurf – hier ist sie.');

    $draft = ApprovalDocument::query()->where('supersedes_id', $released->id)->sole();

    $this->actingAs(revisionAdmin(), 'admin')->get("/admin/gutachten/{$released->id}")->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('can.revise', true)->where('revisionDraft.id', $draft->id));
});

it('lets only who may create Gutachten start one, and only from a released document', function (): void {
    $released = releasedWithEverything();
    $draft = ApprovalDocument::factory()->draft()->create();

    $this->actingAs(revisionAdmin('support-agent'), 'admin')->post("/admin/gutachten/{$released->id}/neue-fassung")->assertForbidden();
    $this->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$draft->id}/neue-fassung")->assertForbidden();

    expect(ApprovalDocument::query()->whereNotNull('supersedes_id')->exists())->toBeFalse();
});

it('replaces the released revision once the new one is released', function (): void {
    $released = releasedWithEverything();
    $this->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/neue-fassung");
    $draft = ApprovalDocument::query()->where('supersedes_id', $released->id)->sole();

    $this->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$draft->id}/freigeben", ReleaseAnswers::for($draft))->assertSessionHasNoErrors();

    expect($draft->refresh()->status->value)->toBe('published')
        ->and($released->refresh()->status->value)->toBe('superseded');
});

it('knows every column the database computes in the tables it copies — a new one fails here, not in the admin', function (): void {
    $generated = collect(DB::select(
        "SELECT TABLE_NAME AS t, COLUMN_NAME AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND EXTRA LIKE '%GENERATED%' AND TABLE_NAME IN ('".implode("','", DocumentRevision::TABLES)."')"
    ))->groupBy('t')->map(static fn ($columns): array => $columns->pluck('c')->sort()->values()->all())->all();

    expect($generated)->toBe(DocumentRevision::GENERATED);
});

it('keeps a demo document\'s revision born demo, with a reference of its own', function (): void {
    $released = releasedWithEverything();
    DB::table('approval_documents')->where('id', $released->id)->update(['updated_at' => now()]);
    $demo = ApprovalDocument::factory()->create(['is_demo' => true, 'demo_ref' => 'abnahme:doc:abe-55255']);

    $this->actingAs(revisionAdmin(), 'admin')->post("/admin/gutachten/{$demo->id}/neue-fassung")->assertSessionHasNoErrors();

    $draft = ApprovalDocument::query()->where('supersedes_id', $demo->id)->sole();
    expect((bool) $draft->getAttribute('is_demo'))->toBeTrue()->and($draft->getAttribute('demo_ref'))->toBe('abnahme:doc:abe-55255:f2');
});
