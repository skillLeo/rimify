<?php

declare(strict_types=1);

use App\Enums\FitmentStatus;
use App\Events\ApprovalDocumentPublished;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Admin\Dashboard\Coverage;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia;

/**
 * The Abdeckungs-Matrix: counted exactly as the storefront decides what it may show, cached and
 * dropped on publish, and every cell leading to the variants it counts.
 */
beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    Cache::flush();
});

function coverageAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A variant with an approved (or not yet approved) wheel of one size. */
function coveredVariant(string $make, float $size, bool $published = true, string $variant = '320d'): Vehicle
{
    $vehicle = Vehicle::factory()->create(['make' => $make, 'model' => '3er', 'variant' => $variant]);
    $config = WheelConfig::factory()->create(['diameter_in' => $size]);
    $document = ApprovalDocument::factory()->create(['status' => $published ? 'published' : 'draft']);

    Fitment::factory()->create([
        'vehicle_id' => $vehicle->id,
        'wheel_config_id' => $config->id,
        'approval_document_id' => $document->id,
        'status' => FitmentStatus::Published->value,
    ]);

    return $vehicle;
}

it('counts per make and rim size the variants with a wheel a customer may be shown', function (): void {
    coveredVariant('BMW', 19);
    coveredVariant('BMW', 19, variant: '330i');
    coveredVariant('BMW', 18);
    // A row of a document still in draft is nothing a customer may see.
    coveredVariant('BMW', 20, published: false);
    Vehicle::factory()->create(['make' => 'BMW', 'model' => '5er', 'variant' => '520d']);

    $matrix = app(Coverage::class)->matrix();
    $bmw = collect($matrix['rows'])->firstWhere('make', 'BMW');
    $cells = collect($bmw['cells'])->keyBy('size');

    expect(array_column($matrix['sizes'], 'key'))->toBe(['18', '19'])
        ->and($bmw['variants'])->toBe(5)
        ->and($bmw['covered'])->toBe(3)
        ->and($cells['19']['count'])->toBe(2)
        ->and($cells['19']['sentence'])->toBe('BMW, 19 Zoll: 2 von 5 Varianten')
        ->and($cells['19']['href'])->toBe('/admin/abdeckung?marke=BMW&zoll=19')
        ->and($matrix['summary']['sentence'])->toBe('Abdeckung insgesamt: 3 Freigaben über 3 Varianten');
});

it('shades a cell in proportion to the largest, and leaves an empty one empty', function (): void {
    expect(Coverage::level(0, 10))->toBe(0)
        ->and(Coverage::level(1, 10))->toBe(1)
        ->and(Coverage::level(5, 10))->toBe(4)
        ->and(Coverage::level(10, 10))->toBe(7);
});

it('keeps the count for an hour, and counts again the moment a document is published', function (): void {
    coveredVariant('Audi', 18);
    expect(app(Coverage::class)->matrix()['summary']['fitments'])->toBe('1');

    coveredVariant('Audi', 19);
    expect(app(Coverage::class)->matrix()['summary']['fitments'])->toBe('1');

    ApprovalDocumentPublished::dispatch(ApprovalDocument::query()->firstOrFail());

    expect(app(Coverage::class)->matrix()['summary']['fitments'])->toBe('2');
});

describe('the Abdeckung page', function (): void {
    it('opens for the Gutachten role and refuses the others', function (): void {
        $this->actingAs(coverageAdmin('compliance-editor'), 'admin')->get('/admin/abdeckung')->assertOk();
        $this->actingAs(coverageAdmin('content-editor'), 'admin')->get('/admin/abdeckung')->assertForbidden();
    });

    it('lists behind a cell every variant of the make, the ones without a wheel first', function (): void {
        coveredVariant('BMW', 19, variant: '330i');
        Vehicle::factory()->create(['make' => 'BMW', 'model' => 'X3', 'variant' => 'X3 M40i']);

        $this->actingAs(coverageAdmin(), 'admin')->get('/admin/abdeckung?marke=BMW&zoll=19')
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Admin/Abdeckung/Index')
                ->where('selection.covered', 1)
                ->where('selection.total', 2)
                ->where('selection.rows.0.vehicle', 'X3 M40i')
                ->where('selection.rows.0.wheels', 0)
                ->where('selection.rows.1.wheels', 1)
                ->where('admin.breadcrumbs.1.label', 'Abdeckung'));
    });
});

it('rides on the Übersicht only for a role that may open the Gutachten area', function (): void {
    $this->actingAs(coverageAdmin(), 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page->loadDeferredProps(fn (AssertableInertia $reload) => $reload->has('charts.coverage.rows')));

    $this->actingAs(coverageAdmin('order-manager'), 'admin')->get('/admin')
        ->assertInertia(fn (AssertableInertia $page) => $page->loadDeferredProps(fn (AssertableInertia $reload) => $reload->where('charts.coverage', false)));
});
