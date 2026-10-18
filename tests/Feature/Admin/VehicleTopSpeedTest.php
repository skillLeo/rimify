<?php

declare(strict_types=1);

use App\Enums\TyreIndexSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\Approvals\FitmentRows;
use Database\Seeders\AccessSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * D-287, the operator's answers of 18.10.2026: the vehicle form asks for field T only where a released Gutachten naming
 * the car needs it for the tyres — every one that does not give load index and symbol beside every size, an unanswered
 * one included — and names each with what is recorded; elsewhere T is optional and the page says why. A draft asks
 * nothing. The review stays R-03's: a vehicle without its top speed stays under „Zur Prüfung“.
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

it('asks for field T where a released Gutachten needs it, naming each and why — never for a draft, nor for one that gives the index at every size', function (): void {
    $vehicle = topSpeedVehicle();
    $table = namedBy($vehicle, TyreIndexSource::Table);
    $papers = namedBy($vehicle, TyreIndexSource::Papers);
    namedBy($vehicle, TyreIndexSource::Document);
    namedBy($vehicle, TyreIndexSource::Papers, released: false);

    $this->actingAs(topSpeedAdmin(), 'admin')->get("/admin/fahrzeuge/{$vehicle->id}")
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Fahrzeuge/Show')
            ->where('topSpeed.needed', true)
            ->where('topSpeed.released', 3)
            ->where('topSpeed.documents', [
                ['id' => $table->id, 'label' => FitmentRows::label($table), 'href' => "/admin/gutachten/{$table->id}", 'why' => 'Laut den Angaben druckt das Gutachten eine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.'],
                ['id' => $papers->id, 'label' => FitmentRows::label($papers), 'href' => "/admin/gutachten/{$papers->id}", 'why' => 'Laut den Angaben verweist das Gutachten für Lastindex und Geschwindigkeitssymbol auf die Fahrzeugpapiere.'],
            ])
            // What the shop waits for of this car, as its answer names it to the customer (D-286).
            ->where('owed', ['T']));
});

it('marks T optional where every released Gutachten gives load index and symbol at every size, and says so on save — still under review', function (): void {
    $vehicle = topSpeedVehicle();
    namedBy($vehicle, TyreIndexSource::Document);

    $this->actingAs(topSpeedAdmin(), 'admin')->get("/admin/fahrzeuge/{$vehicle->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('topSpeed', ['needed' => false, 'released' => 1, 'documents' => []])
            ->where('owed', []));

    $this->actingAs(topSpeedAdmin(), 'admin')->put("/admin/fahrzeuge/{$vehicle->id}", ['axle_load_front_kg' => '1100', 'axle_load_rear_kg' => '1050', 'max_speed_kmh' => ''])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert. Die Höchstgeschwindigkeit fehlt noch – das Fahrzeug bleibt unter „Zur Prüfung“. Für die Reifen braucht der Shop sie bei diesem Fahrzeug nicht.');

    // The review is R-03's: the top speed is missing all the same.
    expect($vehicle->refresh()->needs_review)->toBeTrue();
});

it('names no reason it does not have: without a released Gutachten T is optional; an unanswered one asks for it', function (): void {
    $vehicle = topSpeedVehicle(['axle_load_front_kg' => null, 'axle_load_rear_kg' => null]);

    $this->actingAs(topSpeedAdmin(), 'admin')->get("/admin/fahrzeuge/{$vehicle->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('topSpeed', ['needed' => false, 'released' => 0, 'documents' => []])
            ->where('owed', ['8.1', '8.2']));

    $unanswered = namedBy($vehicle, null);

    $this->actingAs(topSpeedAdmin(), 'admin')->get("/admin/fahrzeuge/{$vehicle->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('topSpeed.needed', true)
            ->where('topSpeed.documents.0.id', $unanswered->id)
            ->where('topSpeed.documents.0.why', 'Wie das Gutachten Lastindex und Geschwindigkeitssymbol angibt, ist unter „Angaben“ noch nicht erfasst.')
            ->where('owed', ['8.1', '8.2', 'T']));
});
