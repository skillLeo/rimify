<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\AuditLog;
use App\Models\Fitment;
use App\Models\OrderLine;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Demo\DemoCatalogue;
use App\Services\Demo\DemoDashboard;
use App\Services\Demo\DemoPlaceholders;
use App\Services\Demo\DemoPurge;
use App\Services\Demo\DemoPurgeRefused;
use App\Services\Demo\DemoTables;
use Carbon\CarbonImmutable;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\CatalogueSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

/*
 * The example catalogue is demo and goes with the demo set (the launch release §3): not a third state of
 * hidden drafts for whoever loads the real catalogue. Everything real beside it stays; while something
 * real still names it, nothing goes at all; and the live shop never gets it in the first place.
 */

beforeEach(function (): void {
    config(['demo.enabled' => true]);
});

function exampleCatalogue(): void
{
    test()->seed(ApprovalSeeder::class);
    app(DemoDashboard::class)->seed(CarbonImmutable::parse('2026-09-27', 'Europe/Berlin'), 0.25);
}

/** A real wheel under the given brand, with one size, and a real Gutachten row on it. */
function realWheelWithRow(int $brandId): Fitment
{
    $model = WheelModel::factory()->draft()->create(['brand_id' => $brandId, 'is_demo' => false]);
    $finish = WheelFinish::factory()->create(['wheel_model_id' => $model->id]);
    $config = WheelConfig::factory()->create(['wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id]);
    $document = ApprovalDocument::factory()->create(['issuer' => 'Prüfstelle (Test)', 'report_number' => 'TG-ECHT-1']);

    return Fitment::factory()->create([
        'approval_document_id' => $document->id,
        'wheel_config_id' => $config->id,
        'vehicle_id' => Vehicle::query()->orderBy('id')->value('id'),
    ]);
}

it('takes the example catalogue with the demo set, and leaves no draft, document or drawing behind', function (): void {
    exampleCatalogue();
    $before = DemoCatalogue::counts();

    expect($before['wheel_models'])->toBe(21)
        ->and($before['fitments'])->toBeGreaterThan(0)
        ->and($before['approval_documents'])->toBeGreaterThan(0)
        ->and($before['brands'])->toBe(count(CatalogueSeeder::BRANDS))
        ->and(File::isDirectory(DemoPlaceholders::dir()))->toBeTrue();

    $this->artisan('demo:purge', ['--force' => true])->assertSuccessful();

    expect(DemoTables::total())->toBe(0)
        ->and(DB::table('wheel_models')->count())->toBe(0)
        ->and(DB::table('wheel_configs')->count())->toBe(0)
        ->and(DB::table('fitments')->count())->toBe(0)
        ->and(DB::table('approval_documents')->where('issuer', ApprovalSeeder::ISSUER)->count())->toBe(0)
        ->and(DB::table('tyre_variants')->count())->toBe(0)
        ->and(DB::table('brands')->whereIn('name', CatalogueSeeder::BRANDS)->count())->toBe(0)
        ->and(File::isDirectory(DemoPlaceholders::dir()))->toBeFalse();

    // One entry says so, catalogue included, and the live-shop check passes.
    $entry = AuditLog::query()->where('description', 'demo.purged')->sole();

    expect($entry->properties['tables'])->toMatchArray([
        'wheel_models' => 21,
        'fitments' => $before['fitments'],
        'approval_documents' => $before['approval_documents'],
    ]);

    $this->artisan('demo:assert-clean')->assertSuccessful();
});

it('keeps every real row beside it — and an invented brand a real wheel carries', function (): void {
    exampleCatalogue();
    $nordfelge = (int) DB::table('brands')->where('name', 'Nordfelge')->value('id');
    $real = realWheelWithRow($nordfelge);

    app(DemoPurge::class)->run('Test');

    expect(Fitment::query()->whereKey($real->id)->exists())->toBeTrue()
        ->and(DB::table('approval_documents')->where('id', $real->approval_document_id)->exists())->toBeTrue()
        ->and(DB::table('wheel_configs')->where('id', $real->wheel_config_id)->exists())->toBeTrue()
        ->and(DB::table('wheel_models')->where('is_demo', true)->count())->toBe(0)
        ->and(DB::table('brands')->whereIn('name', CatalogueSeeder::BRANDS)->pluck('name')->all())->toBe(['Nordfelge']);
});

it('removes nothing at all while an order line not born demo names an example wheel', function (): void {
    exampleCatalogue();
    $config = DB::table('wheel_configs')->orderBy('id')->value('id');
    OrderLine::factory()->create(['wheel_config_id' => $config, 'is_demo' => false]);
    $total = DemoTables::total();

    expect(fn () => app(DemoPurge::class)->run('Test'))->toThrow(DemoPurgeRefused::class, 'nicht als Demodaten angelegt');

    expect(DemoTables::total())->toBe($total)
        ->and(AuditLog::query()->where('description', 'demo.purged')->exists())->toBeFalse();

    $this->artisan('demo:purge', ['--force' => true])
        ->expectsOutputToContain('Nothing removed.')
        ->assertFailed();
});

it('removes nothing while a real Gutachten has rows on an example wheel, and names it', function (): void {
    exampleCatalogue();
    $document = ApprovalDocument::factory()->create(['issuer' => 'Prüfstelle (Test)', 'report_number' => 'TG-ECHT-2']);
    Fitment::factory()->create([
        'approval_document_id' => $document->id,
        'wheel_config_id' => DB::table('wheel_configs')->orderBy('id')->value('id'),
        'vehicle_id' => Vehicle::query()->orderBy('id')->value('id'),
    ]);
    $total = DemoTables::total();

    expect(fn () => app(DemoPurge::class)->run('Test'))->toThrow(DemoPurgeRefused::class, '„TG-ECHT-2“ hat Zeilen auf Beispielfelgen');

    expect(DemoTables::total())->toBe($total);
});

it('tells the admin that nothing went, and why', function (): void {
    $this->seed(AccessSeeder::class);
    exampleCatalogue();
    OrderLine::factory()->create(['wheel_config_id' => DB::table('wheel_configs')->orderBy('id')->value('id'), 'is_demo' => false]);
    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();

    $this->actingAs($admin, 'admin')->from('/admin')->post('/admin/demodaten/entfernen')
        ->assertRedirect('/admin')
        ->assertSessionHas('toast', fn (string $toast): bool => str_starts_with($toast, 'Nichts entfernt. Eine Bestellposition'));

    expect(DB::table('wheel_models')->where('is_demo', true)->count())->toBe(21);
});

it('keeps the example catalogue when demo:reanchor writes the figures again', function (): void {
    exampleCatalogue();
    $catalogue = DemoCatalogue::counts();

    $this->artisan('demo:reanchor', ['--anchor' => '2026-10-04'])->assertSuccessful();

    expect(DemoCatalogue::counts())->toBe($catalogue);
});

it('never writes the example catalogue to the live shop', function (): void {
    app()['env'] = 'production';

    try {
        // Called as a deploy's db:seed calls them; the command's own production prompt is not the point.
        app(CatalogueSeeder::class)->setContainer(app())->run();
        app(ApprovalSeeder::class)->setContainer(app())->run();
    } finally {
        app()['env'] = 'testing';
    }

    expect(DB::table('wheel_models')->count())->toBe(0)
        ->and(DB::table('approval_documents')->count())->toBe(0)
        ->and(DB::table('tyre_variants')->count())->toBe(0);
});
