<?php

declare(strict_types=1);

use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * D-287 asked for field T where a released Gutachten naming the car needed it for the tyres. Since D-481 none does: the
 * tyres rest on what the document prints beside each size, never on the car's top speed, so T is optional everywhere and
 * the page says why (D-483). The review stays R-03's: a vehicle without its top speed stays under „Zur Prüfung“.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
});

function topSpeedAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/** A row naming the car, under a document that gives its tyres' index this way — released unless said otherwise. */
function namedBy(Vehicle $vehicle, ?TyreIndexSource $source, bool $released = true): ApprovalDocument
{
    $factory = ApprovalDocument::factory()->abe()->tyreIndex($source);
    $document = ($released ? $factory : $factory->draft())->create();
    Fitment::factory()->create(['approval_document_id' => $document->id, 'vehicle_id' => $vehicle->id]);

    return $document;
}

/** @param array<string, int|null> $figures */
function topSpeedVehicle(array $figures = []): Vehicle
{
    return Vehicle::factory()->create([...['axle_load_front_kg' => 1100, 'axle_load_rear_kg' => 1100, 'max_speed_kmh' => null, 'needs_review' => true], ...$figures]);
}

it('asks for field T for no released Gutachten, however it gives the index — tables, papers and unanswered alike (D-483)', function (): void {
    $vehicle = topSpeedVehicle();
    namedBy($vehicle, TyreIndexSource::Table);
    namedBy($vehicle, TyreIndexSource::Papers);
    namedBy($vehicle, TyreIndexSource::Document);
    namedBy($vehicle, null);
    namedBy($vehicle, TyreIndexSource::Papers, released: false);

    $this->actingAs(topSpeedAdmin(), 'admin')->get("/admin/fahrzeuge/{$vehicle->id}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Fahrzeuge/Show')
            ->where('topSpeed', ['needed' => false, 'released' => 4, 'documents' => []])
            // What the shop waits for of this car, as its answer names it to the customer (D-286): nothing, its axle loads are known.
            ->where('owed', []));
});

it('says on save that the tyres do not need the top speed — still under review', function (): void {
    $vehicle = topSpeedVehicle();
    namedBy($vehicle, TyreIndexSource::Papers);

    $this->actingAs(topSpeedAdmin(), 'admin')->put("/admin/fahrzeuge/{$vehicle->id}", ['axle_load_front_kg' => '1100', 'axle_load_rear_kg' => '1050', 'max_speed_kmh' => ''])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert. Die Höchstgeschwindigkeit fehlt noch – das Fahrzeug bleibt unter „Zur Prüfung“. Für die Reifen braucht der Shop sie nicht.');

    // The review is R-03's: the top speed is missing all the same.
    expect($vehicle->refresh()->needs_review)->toBeTrue();
});

it('waits for the axle loads alone where they are missing, never for T', function (): void {
    $vehicle = topSpeedVehicle(['axle_load_front_kg' => null, 'axle_load_rear_kg' => null]);

    $this->actingAs(topSpeedAdmin(), 'admin')->get("/admin/fahrzeuge/{$vehicle->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('topSpeed', ['needed' => false, 'released' => 0, 'documents' => []])
            ->where('owed', ['8.1', '8.2']));

    namedBy($vehicle, null);

    $this->actingAs(topSpeedAdmin(), 'admin')->get("/admin/fahrzeuge/{$vehicle->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('topSpeed.needed', false)
            ->where('owed', ['8.1', '8.2']));
});

it('refuses the papers\' figures saved from a page opened before the last save, and keeps that save (the admin audit\'s F-25)', function (): void {
    $vehicle = topSpeedVehicle(['max_speed_kmh' => 210, 'needs_review' => false]);
    $url = "/admin/fahrzeuge/{$vehicle->id}";
    $stale = $this->actingAs(topSpeedAdmin(), 'admin')->get($url)->viewData('page')['props']['stamp'];

    // Another tab corrects the rear axle; this tab still holds the old one beside its own change.
    $this->actingAs(topSpeedAdmin(), 'admin')->from($url)->put($url, ['axle_load_front_kg' => '1100', 'axle_load_rear_kg' => '1.150', 'max_speed_kmh' => '210'])
        ->assertSessionHasNoErrors();
    $this->actingAs(topSpeedAdmin(), 'admin')->from($url)->withHeader(EditStamp::HEADER, $stale)
        ->put($url, ['axle_load_front_kg' => '1100', 'axle_load_rear_kg' => '1100', 'max_speed_kmh' => '220'])
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect($vehicle->refresh()->axle_load_rear_kg)->toBe(1150)->and($vehicle->max_speed_kmh)->toBe(210);
});
