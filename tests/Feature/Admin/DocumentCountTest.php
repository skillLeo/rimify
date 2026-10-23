<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\DocumentCondition;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;

/*
 * ADMIN-GEFUNDEN 511 (the operator's brief of 16.10.2026, Group A): the count of a Gutachten's Verwendungsbereich is
 * asked before its rows are entered, each figure with the page it was read on, and the release compares the entry with
 * it — in the four sentences of D-228, word for word. Until now the count was asked at release, beside the entry, so a
 * count copied off the entry passed (HisReleaseTodayTest).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

function countAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', "{$role}@rimify.test")->firstOrFail();
}

/** What the client's Teilegutachten 1810080716 prints for his car, read off the PDF (HisReleaseTodayTest). */
function hisCount(array $overrides = []): array
{
    return $overrides + ['codes' => 6, 'codes_page' => 3, 'sizes' => 3, 'sizes_page' => 3, 'axle_limit_kg' => 1160, 'axle_limit_page' => 3, 'abnahme' => 'all', 'abnahme_page' => 4];
}

/** His entry as he made it: two rows on the rear axle, one tyre size, one code („0“, a Hinweis), no Abnahme, no tested load. */
function enterHisRows(ApprovalDocument $document): void
{
    DocumentCondition::factory()->kind(ConditionKind::Hinweis, 'Nur mit dem BBS-Zubehörsatz T.Nr. 09.31.149.')->create(['approval_document_id' => $document->id, 'code' => '0']);
    $model = WheelModel::factory()->draft()->create(['is_demo' => false, 'name' => 'LeMans']);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => 18.0, 'max_load_kg' => null]);

    test()->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [
        'vehicle_ids' => Vehicle::factory()->count(2)->create()->pluck('id')->all(), 'config_ids' => [$size->id], 'axle' => 'REAR', 'entry_note' => '', 'source_page' => 1,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'REAR', 'codes' => []]],
        'conditions' => [['code' => '0', 'note' => null]],
    ])->assertSessionHasNoErrors();
}

it('counts a new draft before its first row: each figure with its page, said to have been taken before the entry, and in the Protokoll', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);

    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", hisCount())
        ->assertSessionHasNoErrors()->assertSessionHas('toast');

    $document->refresh();
    expect([$document->counted_codes, $document->counted_codes_page, $document->counted_sizes, $document->counted_sizes_page])->toBe([6, 3, 3, 3])
        ->and([$document->counted_axle_limit_kg, $document->counted_axle_limit_page, $document->counted_abnahme, $document->counted_abnahme_page])->toBe([1160, 3, 'all', 4])
        ->and($document->counted_before_entry)->toBeTrue()
        ->and($document->counted_by)->toBe(countAdmin()->id);

    $entry = AuditLog::query()->where('description', 'approval.counted')->sole();
    expect($entry->properties['rows'])->toBe(0)->and($entry->properties['before'])->toBeNull()->and($entry->properties['count']['codes'])->toBe(6);

    // The page shows it, line by line, and the rows' form is there now.
    $this->actingAs(countAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('document.count.lines', ['6 Auflagen-Codes (Seite 3)', '3 Reifengrößen (Seite 3)', "Achslast höchstens 1.160\u{00A0}kg (Seite 3)", 'Abnahme bei jeder Kombination (Seite 4)'])
            ->where('document.count.beforeEntry', true));
});

it('refuses a count without its pages, a page beyond the PDF, and a limit or an Abnahme without the page it stands on', function (array $sent, string $field): void {
    $document = ApprovalDocument::factory()->draft()->create(['page_count' => 8]);

    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", $sent)
        ->assertSessionHasErrorsIn('zaehlung', [$field]);

    expect($document->refresh()->isCounted())->toBeFalse();
})->with([
    'no page for the codes' => [hisCount(['codes_page' => null]), 'codes_page'],
    'a page the PDF does not have' => [hisCount(['sizes_page' => 9]), 'sizes_page'],
    'a limit without its page' => [hisCount(['axle_limit_page' => null]), 'axle_limit_page'],
    'an Abnahme without its page' => [hisCount(['abnahme_page' => null]), 'abnahme_page'],
    'no answer on the Abnahme' => [hisCount(['abnahme' => null]), 'abnahme'],
]);

it('lets only who may enter the draft count it — never a released document', function (): void {
    $draft = ApprovalDocument::factory()->draft()->create(['page_count' => 8]);
    $released = ApprovalDocument::factory()->create(['page_count' => 8]);

    $this->actingAs(countAdmin('support-agent'), 'admin')->post("/admin/gutachten/{$draft->id}/zaehlung", hisCount())->assertForbidden();
    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$released->id}/zaehlung", hisCount())->assertForbidden();

    expect($draft->refresh()->isCounted())->toBeFalse()->and($released->refresh()->isCounted())->toBeFalse();
});

it('keeps what stood before a change in the Protokoll, and a count changed after the entry says so', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);
    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", hisCount())->assertSessionHasNoErrors();
    enterHisRows($document);

    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", hisCount(['codes' => 1, 'sizes' => 1, 'axle_limit_kg' => null, 'axle_limit_page' => null, 'abnahme' => 'none', 'abnahme_page' => null]))
        ->assertSessionHasNoErrors();

    $entry = AuditLog::query()->where('description', 'approval.count_changed')->sole();
    expect($entry->properties['before']['codes'])->toBe(6)
        ->and($entry->properties['count']['codes'])->toBe(1)
        ->and($entry->properties['rows'])->toBe(2)
        ->and($document->refresh()->counted_before_entry)->toBeFalse();
});

it('compares his entry with the count taken before it: refused in the four sentences, word for word, with only the completeness asked at release', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);
    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", hisCount())->assertSessionHasNoErrors();
    enterHisRows($document);

    // The release asks only the completeness now; figures sent with it are not read — the count stands.
    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ['completeness' => 'partial', 'missing' => 'Anlagen außer BMW15', 'codes' => 1, 'sizes' => 1, 'abnahme' => 'none'])
        ->assertSessionHasErrors(['release' => 'Noch nicht freigebbar: '
            .'Auflagen-Codes für die erfassten Fahrzeuge laut Verwendungsbereich: 6, erfasst: 1. Trag die fehlenden nach oder zähl noch einmal. '
            .'Reifengrößen für die erfassten Fahrzeuge laut Verwendungsbereich: 3, erfasst: 1. Trag die fehlenden nach oder zähl noch einmal. '
            ."Der Verwendungsbereich begrenzt die Achslast auf 1.160\u{00A0}kg. Bei einer Ausführung der Felge fehlt die geprüfte Radlast – trag höchstens 580\u{00A0}kg je Rad ein, sonst prüft der Shop die Grenze nicht. "
            .'Der Verwendungsbereich verlangt bei jeder Kombination eine Abnahme, aber bei 2 Zeilen fehlt sie. Erfass den Code, der sie verlangt.']);

    expect($document->refresh()->status->value)->toBe('draft');
});

it('asks a draft that already had rows and no count for it at release — with the pages — and records it as counted after the entry', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);
    enterHisRows($document);

    // Without the count, the release refuses on the questions it has to ask.
    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ['completeness' => 'partial', 'missing' => 'Anlagen außer BMW15'])
        ->assertSessionHasErrors(['codes', 'codes_page', 'sizes', 'sizes_page', 'abnahme']);

    // With it, the count is recorded — after the entry — and the release compares with it.
    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ['completeness' => 'complete', 'missing' => null, 'codes' => 1, 'codes_page' => 3, 'sizes' => 1, 'sizes_page' => 3, 'axle_limit_kg' => null, 'abnahme' => 'none'])
        ->assertSessionHasNoErrors();

    $document->refresh();
    expect($document->status->value)->toBe('published')
        ->and($document->isCounted())->toBeTrue()
        ->and($document->counted_before_entry)->toBeFalse()
        ->and(AuditLog::query()->where('description', 'approval.counted')->sole()->properties['rows'])->toBe(2);
});

it('says on the draft what the release will refuse about the count, before „Freigeben“ is pressed (the admin audit\'s F-18)', function (): void {
    $document = ApprovalDocument::factory()->draft()->create(['kind' => 'TEILEGUTACHTEN', 'report_number' => '1810080716', 'page_count' => 8]);
    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", hisCount(['axle_limit_kg' => null, 'axle_limit_page' => null, 'abnahme' => 'none', 'abnahme_page' => null]))
        ->assertSessionHasNoErrors();
    enterHisRows($document);

    $blockers = $this->actingAs(countAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()->viewData('page')['props']['blockers'];

    expect($blockers)->toContain('Auflagen-Codes für die erfassten Fahrzeuge laut Verwendungsbereich: 6, erfasst: 1. Trag die fehlenden nach oder zähl noch einmal.')
        ->toContain('Reifengrößen für die erfassten Fahrzeuge laut Verwendungsbereich: 3, erfasst: 1. Trag die fehlenden nach oder zähl noch einmal.');

    // Counted again to match the entry, the page has nothing left to say about the count.
    $this->actingAs(countAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/zaehlung", hisCount(['codes' => 1, 'sizes' => 1, 'axle_limit_kg' => null, 'axle_limit_page' => null, 'abnahme' => 'none', 'abnahme_page' => null]))
        ->assertSessionHasNoErrors();
    $after = $this->actingAs(countAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->viewData('page')['props']['blockers'];

    expect(array_filter($after, static fn (string $b): bool => str_contains($b, 'laut Verwendungsbereich')))->toBe([]);
});
