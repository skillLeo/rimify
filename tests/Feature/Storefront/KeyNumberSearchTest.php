<?php

declare(strict_types=1);

use App\Enums\VehicleSource;
use App\Models\CatalogueGapEvent;
use App\Models\Vehicle;
use App\Support\KeyNumberSearch;
use Inertia\Testing\AssertableInertia;

/*
 * The search by key numbers while no vehicle dataset is loaded (the operator's brief of 05.10.2026, §8): a car typed
 * from a Gutachten has no key numbers and the development seeds are no dataset, so every lookup would end in „not
 * found". The path is closed — one sentence, given to every page — and the server answers no lookup. `auto` opens it
 * once an import or cars checked by hand bring key numbers; `on` and `off` force it.
 */

beforeEach(function (): void {
    config(['rimify.features.key_numbers' => 'auto']);
});

/** A car with key numbers, from the given source. */
function keyNumberCar(VehicleSource $source): Vehicle
{
    return Vehicle::factory()->create(['hsn' => '0005', 'tsn' => 'CKT', 'source' => $source->value]);
}

it('keeps the path closed while only seeds carry key numbers, and says so on every page', function (): void {
    keyNumberCar(VehicleSource::Entwicklung);

    expect(KeyNumberSearch::available())->toBeFalse();

    // Shared with every page — read here from the lightest.
    $this->get('/rechtliches/impressum')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('keyNumbersClosed', KeyNumberSearch::CLOSED));
});

it('answers no lookup while closed: what was typed comes back, and no gap is counted', function (): void {
    keyNumberCar(VehicleSource::Entwicklung);

    $this->from('/felgen-suchen')->post('/fahrzeug/schluesselnummern', ['hsn' => '0005', 'tsn' => 'CKT'])
        ->assertRedirect('/felgen-suchen')
        ->assertSessionHas('lookup', ['status' => 'closed', 'hsn' => '0005', 'tsn' => 'CKT']);

    expect(CatalogueGapEvent::query()->count())->toBe(0);
});

it('opens once an import brings key numbers, or a person has checked a car', function (VehicleSource $source): void {
    keyNumberCar($source);

    expect(KeyNumberSearch::available())->toBeTrue();

    $this->get('/rechtliches/impressum')->assertInertia(fn (AssertableInertia $page) => $page->where('keyNumbersClosed', null));
})->with([
    'KBA import' => [VehicleSource::ImportKba],
    'checked by hand' => [VehicleSource::ManuellGeprueft],
]);

it('is forced by its setting either way', function (): void {
    config(['rimify.features.key_numbers' => 'on']);
    expect(KeyNumberSearch::available())->toBeTrue();

    keyNumberCar(VehicleSource::ImportKba);
    config(['rimify.features.key_numbers' => 'off']);
    expect(KeyNumberSearch::available())->toBeFalse()
        ->and(KeyNumberSearch::closedSentence())->toBe(KeyNumberSearch::CLOSED);
});
