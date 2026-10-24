<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Fitment;
use App\Models\Vehicle;
use App\Services\Admin\Vehicles\VehicleCorrection;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * The admin audit's F-17: a car typed by hand could not be corrected — its details read-only, no „Entfernen“ (R-04), and
 * typing it again refused as a twin, so a typo stayed for good. Now it is corrected in place while nothing refers to it;
 * once a Gutachten row, a conflict, an enquiry, an order or a check in the shop names it, its details stay as they are,
 * and the page says why. A car is never deleted.
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function correctionAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** A car typed by hand, with a typo in its make and its power. */
function typedCar(array $overrides = []): Vehicle
{
    test()->actingAs(correctionAdmin(), 'admin')->post('/admin/fahrzeuge', [
        'make' => 'Prüfwrek', 'model' => 'Größe Eins', 'variant' => '1.6 Limousine', 'type_designation' => 'PW1',
        'hsn' => '0005', 'tsn' => 'ZZ8', 'eg_number' => 'e1*2007/46*0999*02', 'power_kw' => '900', 'build_from' => '03.2019',
        'build_to' => '', 'body_form' => '', 'drive_axle' => '', 'axle_load_front_kg' => '980', 'axle_load_rear_kg' => '1.150', 'max_speed_kmh' => '200',
        ...$overrides,
    ])->assertSessionHasNoErrors();

    return Vehicle::query()->latest('id')->firstOrFail();
}

/** @return array<string, string> */
function correctedForm(Vehicle $vehicle, array $changes = []): array
{
    return [...VehicleCorrection::form($vehicle), ...$changes];
}

it('corrects a car typed by hand that nothing refers to, and writes old and new to the Protokoll', function (): void {
    $car = typedCar();

    $this->actingAs(correctionAdmin(), 'admin')->get("/admin/fahrzeuge/{$car->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('identity.correctable', true)
            ->where('identity.why', null)
            ->where('identity.form.make', 'Prüfwrek')
            ->where('identity.form.build_from', '03.2019')
            ->has('bodyForms')->has('drives'));

    $this->actingAs(correctionAdmin(), 'admin')->from("/admin/fahrzeuge/{$car->id}")
        ->put("/admin/fahrzeuge/{$car->id}/angaben", correctedForm($car, ['make' => 'Prüfwerk', 'power_kw' => '90']))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Angaben korrigiert.');

    $car->refresh();
    $entry = AuditLog::query()->where('description', 'vehicle.corrected')->sole();

    expect($car->make)->toBe('Prüfwerk')
        ->and($car->power_kw)->toBe(90)
        // The figures for the tyres are the other form's: untouched.
        ->and($car->axle_load_front_kg)->toBe(980)
        ->and($entry->properties['old']['make'])->toBe('Prüfwrek')
        ->and($entry->properties['new']['power_kw'])->toBe(90);
});

it('keeps the details of a car a Gutachten row names, and says why — on the page and on a save sent anyway', function (): void {
    $car = typedCar();
    Fitment::factory()->create(['vehicle_id' => $car->id]);

    $this->actingAs(correctionAdmin(), 'admin')->get("/admin/fahrzeuge/{$car->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('identity.correctable', false)
            ->where('identity.form', null)
            ->where('identity.why', 'Auf dieses Fahrzeug verweist schon eine Zeile eines Gutachtens. Seine Angaben lassen sich deshalb nicht mehr ändern, damit erklärbar bleibt, was darauf beruht.'));

    $this->actingAs(correctionAdmin(), 'admin')->from("/admin/fahrzeuge/{$car->id}")
        ->put("/admin/fahrzeuge/{$car->id}/angaben", correctedForm($car, ['make' => 'Prüfwerk']))
        ->assertSessionHasErrors('_vehicle');

    expect($car->refresh()->make)->toBe('Prüfwrek');
});

it('corrects only a car typed by hand — not one from a dataset', function (): void {
    $imported = Vehicle::factory()->create(['source' => 'import_kba']);

    $this->actingAs(correctionAdmin(), 'admin')->get("/admin/fahrzeuge/{$imported->id}")
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('identity.correctable', false)
            ->where('identity.why', 'Korrigieren lassen sich hier nur Fahrzeuge, die von Hand angelegt wurden. Dieses stammt aus einem Fahrzeugdatensatz.'));
});

it('refuses a correction that would make the car another one\'s twin, and a save from a page opened before the last', function (): void {
    $first = typedCar(['variant' => '2.0 Limousine', 'tsn' => 'ZZ9']);
    $second = typedCar();

    $this->actingAs(correctionAdmin(), 'admin')->from("/admin/fahrzeuge/{$second->id}")
        ->put("/admin/fahrzeuge/{$second->id}/angaben", correctedForm($second, ['variant' => '2.0 Limousine', 'tsn' => 'ZZ9']))
        ->assertSessionHasErrors('variant');

    // Keeping its own key is no twin.
    $stale = EditStamp::of(VehicleCorrection::state($second->id));
    $this->actingAs(correctionAdmin(), 'admin')->from("/admin/fahrzeuge/{$second->id}")
        ->put("/admin/fahrzeuge/{$second->id}/angaben", correctedForm($second, ['model' => 'Größe Zwei']))
        ->assertSessionHasNoErrors();

    $this->actingAs(correctionAdmin(), 'admin')->from("/admin/fahrzeuge/{$second->id}")->withHeader(EditStamp::HEADER, $stale)
        ->put("/admin/fahrzeuge/{$second->id}/angaben", correctedForm($second->refresh(), ['model' => 'Größe Drei']))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect($second->refresh()->model)->toBe('Größe Zwei')->and($first->refresh()->variant)->toBe('2.0 Limousine');
});

it('is refused on the server to a role that may not change vehicles (R-11)', function (): void {
    $car = typedCar();

    $this->actingAs(correctionAdmin('content-editor'), 'admin')
        ->put("/admin/fahrzeuge/{$car->id}/angaben", correctedForm($car, ['make' => 'Prüfwerk']))
        ->assertForbidden();

    expect($car->refresh()->make)->toBe('Prüfwrek');
});
