<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\Vehicle;
use App\Services\Storefront\VehicleTree;
use Database\Seeders\AccessSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * His admin items 1 and 3 (D-296): Fahrzeuge › Neues Fahrzeug — a car typed by hand from its Zulassungsbescheinigung
 * Teil I, stored as checked by hand and never as development data, the same HSN, TSN and variant never twice. The axle
 * loads may stay empty — the form says what that costs before it saves —, and a car without them, or without its top
 * speed, waits under „Zur Prüfung“ (R-03).
 */

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->seed(ReferenceDataSeeder::class);
});

function manualAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/**
 * The car as a person types it off the papers — a German thousands dot, a three-digit HSN, a lower-case TSN.
 *
 * @param  array<string, string>  $overrides
 * @return array<string, string>
 */
function manualCar(array $overrides = []): array
{
    return [
        'make' => 'Testmarke', 'model' => 'Modell (T1)', 'variant' => '2.0 Limousine', 'type_designation' => 'T1',
        'hsn' => '005', 'tsn' => 'afd', 'eg_number' => 'e1*2001/116*0287*12',
        'power_kw' => '125', 'build_from' => '03.2005', 'build_to' => '12.2011', 'body_form' => '', 'drive_axle' => 'Hinterachse',
        'axle_load_front_kg' => '1.160', 'axle_load_rear_kg' => '1.240', 'max_speed_kmh' => '',
        ...$overrides,
    ];
}

it('shows the form with the body forms and drives a car may name @admin-201', function (): void {
    $this->actingAs(manualAdmin(), 'admin')->get('/admin/fahrzeuge/neu')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Admin/Fahrzeuge/Neu')
            ->has('bodyForms')
            ->where('drives', ['Allrad', 'Vorderachse', 'Hinterachse'])
            ->where('admin.breadcrumbs', [['label' => 'Fahrzeuge', 'href' => '/admin/fahrzeuge'], ['label' => 'Neues Fahrzeug', 'href' => null]]));

    // The list offers it to who may create a car, and the import to who may import.
    $this->actingAs(manualAdmin(), 'admin')->get('/admin/fahrzeuge')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('can', ['create' => true, 'import' => true]));
    $this->actingAs(manualAdmin('catalogue-manager'), 'admin')->get('/admin/fahrzeuge')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('can', ['create' => false, 'import' => false]));
});

it('stores a car typed from its papers as checked by hand, with every field as typed @admin-201 @admin-203', function (): void {
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar())
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $vehicle = Vehicle::query()->where('make', 'Testmarke')->sole();

    expect($vehicle->source)->toBe('manuell_geprueft')
        ->and($vehicle->is_demo)->toBeFalse()
        ->and($vehicle->hsn)->toBe('0005')
        ->and($vehicle->tsn)->toBe('AFD')
        ->and($vehicle->getAttribute('eg_nummer_raw'))->toBe('e1*2001/116*0287*12')
        ->and($vehicle->getAttribute('type_designation'))->toBe('T1')
        ->and($vehicle->getAttribute('power_kw'))->toBe(125)
        ->and($vehicle->build_from?->toDateString())->toBe('2005-03-01')
        // The last month built is built whole: the window ends on its last day (R-02).
        ->and($vehicle->build_to?->toDateString())->toBe('2011-12-31')
        ->and($vehicle->getAttribute('body_form'))->toBeNull()
        ->and($vehicle->getAttribute('drive_axle'))->toBe('Hinterachse')
        ->and($vehicle->axle_load_front_kg)->toBe(1160)
        ->and($vehicle->axle_load_rear_kg)->toBe(1240)
        // No top speed: under „Zur Prüfung“ (R-03); its page asks for T once a released Gutachten needs it (D-287).
        ->and($vehicle->max_speed_kmh)->toBeNull()
        ->and($vehicle->needs_review)->toBeTrue()
        ->and(AuditLog::query()->where('description', 'vehicle.created_manually')->exists())->toBeTrue();

    // In the selector at once: the vehicle tree is kept under the catalogue's version (D-294).
    expect(collect(app(VehicleTree::class)->makes())->pluck('make'))->toContain('Testmarke');
});

it('leaves a car with both axle loads and its top speed out of the review @admin-203', function (): void {
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar(['max_speed_kmh' => '230']))
        ->assertSessionHasNoErrors();

    expect(Vehicle::query()->where('make', 'Testmarke')->sole()->needs_review)->toBeFalse();
});

it('refuses the same HSN, TSN and variant twice — a removed car too, never deleted (R-04) @admin-201', function (): void {
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar())->assertSessionHasNoErrors();
    Vehicle::query()->where('make', 'Testmarke')->sole()->delete();

    // Removed, it is in no list any more: said as removed (R-04).
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar(['hsn' => '0005', 'tsn' => 'AFD']))
        ->assertSessionHasErrors(['variant' => 'Ein entferntes Fahrzeug hat schon diese HSN, TSN und Variante: Testmarke Modell (T1) 2.0 Limousine. Gib eine eigene Variante an.']);

    // Another variant under the same key numbers is another car.
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar(['variant' => '2.0 Touring']))->assertSessionHasNoErrors();

    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar(['variant' => '2.0 Touring']))
        ->assertSessionHasErrors(['variant' => 'Ein Fahrzeug mit dieser HSN, TSN und Variante gibt es schon: Testmarke Modell (T1) 2.0 Touring. Ist es ein anderes Fahrzeug, gib eine eigene Variante an.']);
});

it('reads key numbers past every space, never cutting one off: „ 0005“ is 0005 @admin-203', function (): void {
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar(['hsn' => ' 0005', 'tsn' => ' af d', 'build_from' => '03,2005']))
        ->assertSessionHasNoErrors();

    $car = Vehicle::query()->where('make', 'Testmarke')->sole();

    expect($car->hsn)->toBe('0005')
        ->and($car->tsn)->toBe('AFD')
        // A phone's decimal keypad types a comma: the month reads the same.
        ->and($car->build_from?->toDateString())->toBe('2005-03-01');

    // Five digits are five digits: refused, never shortened to four.
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar(['hsn' => '00055', 'variant' => '2.0 Touring']))
        ->assertSessionHasErrors(['hsn' => 'Die HSN hat vier Ziffern, mit führenden Nullen: 0005.']);
});

it('takes field K as printed — on an older car, its national ABE number @admin-203', function (): void {
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar(['eg_number' => 'A 333']))
        ->assertSessionHasNoErrors();

    expect(Vehicle::query()->where('make', 'Testmarke')->sole()->getAttribute('eg_nummer_raw'))->toBe('A 333');
});

it('refuses what does not read, each in its own sentence', function (array $typed, string $field, string $sentence): void {
    $this->actingAs(manualAdmin(), 'admin')->post('/admin/fahrzeuge', manualCar($typed))
        ->assertSessionHasErrors([$field => $sentence]);

    expect(Vehicle::query()->where('make', 'Testmarke')->exists())->toBeFalse();
})->with([
    'an HSN of letters' => [['hsn' => 'ABCD'], 'hsn', 'Die HSN hat vier Ziffern, mit führenden Nullen: 0005.'],
    'a TSN of four' => [['tsn' => 'AFDE'], 'tsn', 'Die TSN sind die ersten drei Zeichen aus Feld 2.2 – Ziffern oder Buchstaben, etwa AFD.'],
    'field K in another shape' => [['eg_number' => '2001/116/0287'], 'eg_number', 'So sieht Feld K nicht aus. Eine EG-Typgenehmigungsnummer beginnt mit e und der Länderziffer, etwa e1*2007/46*0316*12; bei älteren Fahrzeugen steht dort eine nationale ABE-Nummer aus Buchstaben und Ziffern, etwa A 333.'],
    'a build window the wrong way round' => [['build_to' => '01.2004'], 'build_to', 'Das Bauende liegt vor dem Baubeginn.'],
    'a month that is no month' => [['build_from' => '13.2005'], 'build_from', 'Bitte Monat und Jahr, etwa 06.2014.'],
    'a year no car was built in' => [['build_to' => '06.2061'], 'build_to', 'Bitte ein Jahr zwischen 1900 und '.(now()->year + 2).'.'],
    'an axle load out of range' => [['axle_load_rear_kg' => '12.400'], 'axle_load_rear_kg', 'Die Achslast hinten bitte in Kilogramm, zwischen 300 und 5.000 (Feld 8.2).'],
    'no power' => [['power_kw' => ''], 'power_kw', 'Trag die Leistung in kW ein (Feld P.2, die erste Zahl).'],
]);

it('lets only who may create vehicles create one — the server says so, not the button (R-11) @admin-201', function (): void {
    $this->actingAs(manualAdmin('catalogue-manager'), 'admin')->get('/admin/fahrzeuge/neu')->assertForbidden();
    $this->actingAs(manualAdmin('catalogue-manager'), 'admin')->post('/admin/fahrzeuge', manualCar())->assertForbidden();

    expect(Vehicle::query()->where('make', 'Testmarke')->exists())->toBeFalse();
});
