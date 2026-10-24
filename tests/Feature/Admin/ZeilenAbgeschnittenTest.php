<?php

declare(strict_types=1);

use App\Enums\Axle;
use App\Http\Controllers\Admin\FahrzeugeController;
use App\Http\Controllers\Admin\GutachtenController;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\DB;

/*
 * The admin audit's F-37: a Gutachten's page drew its first 1.000 rows and a vehicle's its first 500, and dropped the
 * rest without a word — the release then said „Alle 1.000 Zeilen gelten danach sofort im Shop“ of a document that
 * releases every row. Both pages now count every row and say where the table is cut.
 */

beforeEach(fn () => $this->seed([AccessSeeder::class, ReferenceDataSeeder::class]));

function cutAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/**
 * Rows for every pairing of documents, vehicles and sizes on all three axles, written in one go.
 *
 * @param  list<int>  $documents
 * @param  list<int>  $vehicles
 * @param  list<int>  $configs
 */
function manyRows(array $documents, array $vehicles, array $configs): int
{
    $rows = [];

    foreach ($documents as $document) {
        foreach ($vehicles as $vehicle) {
            foreach ($configs as $config) {
                foreach (Axle::cases() as $axle) {
                    $rows[] = ['approval_document_id' => $document, 'vehicle_id' => $vehicle, 'wheel_config_id' => $config, 'axle' => $axle->value, 'requires_entry' => false, 'status' => 'draft', 'created_at' => now(), 'updated_at' => now()];
                }
            }
        }
    }

    foreach (array_chunk($rows, 500) as $chunk) {
        DB::table('fitments')->insert($chunk);
    }

    return count($rows);
}

it('counts every row of a Gutachten past the rows it draws, so the release says how many it brings into the shop', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    $total = manyRows([$document->id], Vehicle::factory()->count(12)->create()->modelKeys(), WheelConfig::factory()->count(28)->create()->modelKeys());

    expect($total)->toBe(1_008)->and($total)->toBeGreaterThan(GutachtenController::ROWS_SHOWN);

    $props = test()->actingAs(cutAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()->viewData('page')['props'];

    expect($props['rows'])->toHaveCount(GutachtenController::ROWS_SHOWN)
        ->and($props['rowsTotal'])->toBe(1_008);
});

it('counts every row naming a vehicle past the rows its page draws', function (): void {
    $vehicle = Vehicle::factory()->create();
    $total = manyRows(ApprovalDocument::factory()->count(12)->create()->modelKeys(), [$vehicle->id], WheelConfig::factory()->count(14)->create()->modelKeys());

    expect($total)->toBe(504)->and($total)->toBeGreaterThan(FahrzeugeController::ROWS_SHOWN);

    $props = test()->actingAs(cutAdmin(), 'admin')->get("/admin/fahrzeuge/{$vehicle->id}")->assertOk()->viewData('page')['props'];

    expect($props['rows'])->toHaveCount(FahrzeugeController::ROWS_SHOWN)
        ->and($props['rowsTotal'])->toBe(504);
});

it('gives the rows it draws as the total below the cut', function (): void {
    $document = ApprovalDocument::factory()->draft()->create();
    manyRows([$document->id], [Vehicle::factory()->create()->id], [WheelConfig::factory()->create()->id]);

    $props = test()->actingAs(cutAdmin(), 'admin')->get("/admin/gutachten/{$document->id}")->assertOk()->viewData('page')['props'];

    expect($props['rows'])->toHaveCount(3)->and($props['rowsTotal'])->toBe(3);
});
