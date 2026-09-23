<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\CentreBoreSource;
use App\Domain\Storefront\VehicleContext;
use App\Enums\FitmentStatus;
use App\Support\GermanFormat;
use Database\Seeders\ApprovalSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * The Mittenlochbohrung on the product page (client, 2026-09-23).
 *
 * The bore is not a property of the rim alone: the approval states its own figure for the vehicle
 * it covers, and that is the number a customer with a chosen car must read. So the page carries up
 * to two values — the document's for this car, inside the verdict, and the rim's own beside it —
 * and the payload must never let the second stand in for the first.
 */

beforeEach(function (): void {
    $this->seed(ApprovalSeeder::class);
});

/** One live MOTEC fitment whose document states its own bore, or one where it states none. */
function pdpBoreFitment(bool $stated): object
{
    $row = DB::table('fitments as f')
        ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
        ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
        ->join('vehicles as v', 'v.id', '=', 'f.vehicle_id')
        ->where('wm.slug', 'motec-mcr4-ultimate')
        ->where('f.status', FitmentStatus::Published->value)
        ->when($stated, fn ($q) => $q->whereNotNull('f.centre_bore_mm'), fn ($q) => $q->whereNull('f.centre_bore_mm'))
        ->orderBy('f.id')
        ->first([
            'f.vehicle_id', 'f.wheel_config_id',
            'f.centre_bore_mm as document_bore',
            'wc.centre_bore_mm as rim_bore',
            'wm.slug',
        ]);

    expect($row)->not->toBeNull('the demo data must hold such a fitment');

    return $row;
}

/** @return array<string, string> the encrypted cookie the storefront reads the vehicle from */
function pdpBoreCookie(int $vehicleId): array
{
    return [VehicleContext::COOKIE => (new VehicleContext($vehicleId, true))->encode()];
}

/** @return array<string, mixed> the configuration the page shipped, by id */
function pdpBoreConfig(array $props, int $configId): array
{
    $config = collect($props['configs'])->firstWhere('id', $configId);

    expect($config)->not->toBeNull('the page must ship the configuration under test');

    return $config;
}

it('shows the bore the document states for the chosen car, beside the rim\'s own', function (): void {
    $row = pdpBoreFitment(stated: true);

    $props = $this->withCookies(pdpBoreCookie((int) $row->vehicle_id))
        ->get('/felgen/'.$row->slug)
        ->assertOk()
        ->viewData('page')['props'];

    $config = pdpBoreConfig($props, (int) $row->wheel_config_id);

    // Two different claims, each under its own key. The rim is catalogued at 66,5 mm and the
    // document states 66,6 mm for this car: the payload carries both, and neither is the other.
    expect($config['verdict']['centreBore'])->toBe(GermanFormat::millimetres((float) $row->document_bore))
        ->and($config['verdict']['centreBoreSource'])->toBe(CentreBoreSource::Document->value)
        ->and($config['centreBore'])->toBe(GermanFormat::millimetres((float) $row->rim_bore))
        ->and($config['verdict']['centreBore'])->not->toBe($config['centreBore']);
});

it('states no bore of its own where the document states none, and never borrows the rim\'s', function (): void {
    $row = pdpBoreFitment(stated: false);

    $props = $this->withCookies(pdpBoreCookie((int) $row->vehicle_id))
        ->get('/felgen/'.$row->slug)
        ->assertOk()
        ->viewData('page')['props'];

    $config = pdpBoreConfig($props, (int) $row->wheel_config_id);

    expect($config['verdict']['centreBore'])->toBeNull()
        ->and($config['verdict']['centreBoreSource'])->toBe(CentreBoreSource::Unstated->value)
        // The rim's own figure is still there — labelled as the rim's on the page, never as a
        // statement the document made about this car.
        ->and($config['centreBore'])->toBe(GermanFormat::millimetres((float) $row->rim_bore));
});

it('makes no claim about a bore at all until a vehicle is chosen', function (): void {
    $row = pdpBoreFitment(stated: true);

    $props = $this->get('/felgen/'.$row->slug)->assertOk()->viewData('page')['props'];
    $config = pdpBoreConfig($props, (int) $row->wheel_config_id);

    expect($props['hasVehicle'])->toBeFalse()
        ->and($config['verdict'])->toBeNull()
        ->and($config['centreBore'])->toBe(GermanFormat::millimetres((float) $row->rim_bore));
});

it('carries the hump designation only for a wheel whose record holds one', function (): void {
    $motec = $this->get('/felgen/motec-mcr4-ultimate')->assertOk()->viewData('page')['props'];

    expect(collect($motec['configs'])->pluck('hump')->unique()->all())->toBe(['H2']);

    // A demo wheel has no Gutachten, so it has no designation and the details show no Hump row.
    $demo = $this->get('/felgen/demo-fuenfspeiche-f-01')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Produkt/Index'))
        ->viewData('page')['props'];

    expect(collect($demo['configs'])->every(static fn (array $c): bool => $c['hump'] === null))->toBeTrue();
});
