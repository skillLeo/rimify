<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Page;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * The client's 22 „permission.denied“ of 10.10.2026 (info@rimify.de, Super-Admin): eleven pairs of „update“ and
 * „publish“ on admin.gutachten.show, the first in the second of his first Freigabe. Walked again here as a Super-Admin:
 * release a document, open it, open a draft, try a real edit, open the homepage's editor — and count what the Protokoll
 * writes at each step, and what the screen answers.
 *
 * Evidence for ADMIN-GEFUNDEN 509 (S2) and 510: the pair is the page's two button checks, written as refusals although
 * nothing was refused, and the released page offers no way on. It describes the shop as it is today; the admin round's fix
 * turns each expected pair into nothing written — the test it asks for.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    app(StorageSettings::class)->flush();
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

/** @return list<string> the abilities refused since the given entry, in order */
function refusedSince(int $after): array
{
    return AuditLog::query()->where('id', '>', $after)->where('description', 'permission.denied')->orderBy('id')
        ->get()->map(static fn (AuditLog $a): string => (string) ($a->properties['ability'] ?? '?').' @ '.(string) ($a->properties['route'] ?? '?'))->all();
}

function lastEntry(): int
{
    return (int) AuditLog::query()->max('id');
}

it('reproduces the pair: every view of a released Gutachten writes „update“ and „publish“ as refused — and the page itself answers 200, no message', function (): void {
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $document = ApprovalDocument::factory()->draft()->create();
    $model = WheelModel::factory()->draft()->create(['is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $size = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id]);
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [
        'vehicle_ids' => [Vehicle::factory()->create()->id], 'config_ids' => [$size->id], 'axle' => 'ALL', 'entry_note' => '', 'source_page' => 4,
        'tyre_sizes' => [['width_mm' => 225, 'aspect' => 40, 'diameter' => 18, 'min_load_index' => null, 'min_speed_symbol' => '', 'axle' => 'ALL', 'codes' => []]],
        'conditions' => [],
    ])->assertSessionHasNoErrors();

    // A draft, opened by its Super-Admin: nothing refused.
    $before = lastEntry();
    $this->actingAs($admin, 'admin')->get("/admin/gutachten/{$document->id}")->assertOk();
    expect(refusedSince($before))->toBe([]);

    // The Freigabe redirects to the document's page — the pair, in the same second, as on 10.10.
    $before = lastEntry();
    $this->actingAs($admin, 'admin')->followingRedirects()->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertOk();
    expect(refusedSince($before))->toBe(['update @ admin.gutachten.show', 'publish @ admin.gutachten.show']);

    // Every further view of the released document: the pair again, and a page that answers 200 with no refusal on it.
    $before = lastEntry();
    $this->actingAs($admin, 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()
        ->assertInertia(fn ($page) => $page->where('can.edit', false)->where('can.release', false));
    expect(refusedSince($before))->toBe(['update @ admin.gutachten.show', 'publish @ admin.gutachten.show']);

    // What a real refusal looks like: an edit sent to the released document — 403, and written once.
    $before = lastEntry();
    $this->actingAs($admin, 'admin')->post("/admin/gutachten/{$document->id}/zeilen", [])->assertForbidden();
    expect(refusedSince($before))->toHaveCount(1);
});

it('writes nothing refused for the homepage editor and its publishing', function (): void {
    $this->seed(ContentSeeder::class);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $home = Page::query()->where('slug', Page::HOME_SLUG)->firstOrFail();

    $before = lastEntry();
    $this->actingAs($admin, 'admin')->get("/admin/seiten/{$home->id}")->assertOk();
    expect(refusedSince($before))->toBe([]);
});
