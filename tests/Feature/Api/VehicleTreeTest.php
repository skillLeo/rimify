<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Models\Vehicle;
use App\Support\GermanFormat;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * The two lower steps of the make → model → variant drill, for the hero comboboxes.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('lists the models of a make with their variant counts', function (): void {
    $response = $this->getJson('/api/v1/vehicles/models?marke=BMW')->assertOk();

    expect($response->json('models'))->not->toBeEmpty()
        ->and($response->json('models.0'))->toHaveKeys(['model', 'variants']);
});

it('lists the variants of a model with what the selector shows', function (): void {
    $model = (string) $this->getJson('/api/v1/vehicles/models?marke=BMW')->json('models.0.model');

    $response = $this->getJson('/api/v1/vehicles/variants?marke=BMW&modell='.rawurlencode($model))->assertOk();

    expect($response->json('variants'))->not->toBeEmpty()
        ->and($response->json('variants.0'))->toHaveKeys(['id', 'variant', 'buildWindow', 'powerPs', 'needsReview']);
});

/*
 * A Gutachten splits the BMW 1K4 at extension 03/04 of its EG type approval, and the halves carry different bolt
 * sets. Without key numbers and a build window both rows read „1K4“: Feld K is what tells them apart — in the
 * chooser, and in the bar once one is chosen. A car with key numbers is told apart by those.
 */
it('tells apart the halves of a car a Gutachten splits, by Feld K', function (): void {
    $half = static fn (string $eg): Vehicle => Vehicle::factory()->create([
        'hsn' => null, 'tsn' => null, 'vsn' => null, 'make' => 'BMW', 'model' => 'Feld-K-Probe', 'variant' => '1K4',
        'type_designation' => '1K4', 'build_from' => null, 'build_to' => null, 'eg_nummer_raw' => $eg,
    ]);
    $early = $half('e1*2007/46*0283*00-03');
    $late = $half('e1*2007/46*0283*04-..');
    Vehicle::factory()->create(['make' => 'BMW', 'model' => 'Feld-K-Probe', 'variant' => '118d', 'eg_nummer_raw' => 'e1*2007/46*0283*05']);

    $rows = collect($this->getJson('/api/v1/vehicles/variants?marke=BMW&modell=Feld-K-Probe')->assertOk()->json('variants'))->keyBy('id');

    // The range set off from the number, so „ab“ never reads as a date; no-break spaces inside „Feld K“ and the range.
    $nb = "\u{00A0}";

    expect($rows[$early->id]['approval'])->toBe("Feld{$nb}K: e1*2007/46*0283, *00 bis{$nb}*03")
        ->and($rows[$late->id]['approval'])->toBe("Feld{$nb}K: e1*2007/46*0283, ab{$nb}*04")
        ->and($rows[$late->id]['approvalShort'])->toBe("Feld{$nb}K ab{$nb}*04")
        ->and($rows->firstWhere('variant', '118d')['approval'])->toBeNull()
        ->and(GermanFormat::egRange('e1*2001/116*0352*..'))->toBe("Feld{$nb}K: e1*2001/116*0352")
        ->and(GermanFormat::egRange('e1*2001/116*0352*..', short: true))->toBeNull()
        ->and(GermanFormat::egRange('e1*2007/46*0316*08'))->toBe("Feld{$nb}K: e1*2007/46*0316, *08")
        ->and(GermanFormat::egRange(null))->toBeNull();

    $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($late->id, true))->encode()])
        ->get('/felgen')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('vehicle.approval', "Feld{$nb}K: e1*2007/46*0283, ab{$nb}*04"));
});

it('answers an empty list for a make it does not know', function (): void {
    $this->getJson('/api/v1/vehicles/models?marke=Trabant')
        ->assertOk()
        ->assertJsonPath('models', []);
});

it('refuses the variant step without a model', function (): void {
    $this->getJson('/api/v1/vehicles/variants?marke=BMW')->assertStatus(422);
    $this->getJson('/api/v1/vehicles/models')->assertStatus(422);
});
