<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Domain\Storefront\VehicleKey;
use App\Models\Vehicle;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #8 (D-116, the operator's brief „THE 34“): the car in the address, as its key numbers —
 * `?fahrzeug=0005-582-00003`, Herstellerschlüssel, Typschlüssel and Variante — on a page that answers for one car. The
 * address decides the car, the cookie remembers it, the server renders from it, and the page's address and its
 * canonical link carry the car it was rendered for, so it can be saved and shared. The older `?fahrzeug=<id>` is still
 * read. An unknown key is ignored, never an error; key numbers that name two cars are asked about (R-01); the basket and
 * the checkout never take a car from their address.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

/** @return array{0: Vehicle, 1: Vehicle} two cars the catalogue holds, each with all three key numbers */
function urlCars(): array
{
    $cars = Vehicle::query()->whereNotNull('hsn')->whereNotNull('tsn')->whereNotNull('vsn')->orderBy('id')->limit(2)->get();

    return [$cars[0], $cars[1]];
}

function urlCookie(Vehicle $vehicle): array
{
    return [VehicleContext::COOKIE => (new VehicleContext((int) $vehicle->id, true))->encode()];
}

it('@kunde-08 renders the car its key numbers name, remembers it in the cookie and keeps it in the address', function (): void {
    [$car] = urlCars();
    $key = VehicleKey::of($car);

    expect($key)->toMatch('/^\d{4}-[0-9A-Z]{1,3}-[0-9A-Z]+$/');

    $response = $this->get('/felgen?fahrzeug='.$key)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('vehicle.id', $car->id)
            ->url('/felgen?fahrzeug='.$key)
            ->where('canonical', rtrim((string) config('app.url'), '/').'/felgen?fahrzeug='.$key));

    $cookie = collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === VehicleContext::COOKIE);

    expect($cookie)->not->toBeNull();
});

it('@kunde-08 still reads the older number, and writes the address as key numbers', function (): void {
    [$car] = urlCars();

    $this->get('/felgen?fahrzeug='.$car->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('vehicle.id', $car->id)
            ->url('/felgen?fahrzeug='.VehicleKey::of($car)));
});

it('@kunde-08 lets the address win over the cookie — the shared link shows the car it was shared for', function (): void {
    [$mine, $shared] = urlCars();

    $this->withCookies(urlCookie($mine))->get('/felgen?fahrzeug='.VehicleKey::of($shared))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('vehicle.id', $shared->id)
            ->url('/felgen?fahrzeug='.VehicleKey::of($shared)));
});

it('@kunde-08 writes the remembered car into the address of a page asked for without one', function (): void {
    [$car] = urlCars();
    $key = VehicleKey::of($car);

    $this->withCookies(urlCookie($car))->get('/felgen?sort=preis')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->url('/felgen?sort=preis&fahrzeug='.$key));

    $this->withCookies(urlCookie($car))->get('/')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->url('/?fahrzeug='.$key));
});

it('ignores key numbers the catalogue does not hold and corrects the address to the car it shows', function (): void {
    [$car] = urlCars();
    $unknown = (int) Vehicle::withTrashed()->max('id') + 1000;

    foreach (['0005-ZZZ-99999', (string) $unknown] as $missing) {
        $this->withCookies(urlCookie($car))->get('/felgen?fahrzeug='.$missing)->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->where('vehicle.id', $car->id)
                ->url('/felgen?fahrzeug='.VehicleKey::of($car)));
    }
});

it('reads no car from a malformed key, and leaves no key in the address without a car', function (): void {
    foreach (['abc', '0005-AB', '0005-ABCD-1', '00005-AB-1'] as $malformed) {
        $this->get('/felgen?fahrzeug='.$malformed)->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page->where('vehicle', null)->url('/felgen'));
    }
});

it('@kunde-08 asks which car is meant where two cars share the three key numbers, and picks none (R-01)', function (): void {
    [$car, $twin] = urlCars();
    // The data's own fault, made here: the second car under the first one's numbers.
    DB::table('vehicles')->where('id', $twin->id)->update(['hsn' => $car->hsn, 'tsn' => $car->tsn, 'vsn' => $car->vsn]);

    $response = $this->get('/felgen?fahrzeug='.VehicleKey::of($car).'&zoll=18')
        ->assertRedirect()
        ->assertSessionHas('lookup', fn (array $lookup): bool => $lookup['status'] === 'ambiguous' && count($lookup['distinction']['rows'] ?? $lookup['distinction']) >= 2);

    // To the selector, which shows the chooser and brings the visitor back to the page — without either car.
    $target = urldecode((string) $response->headers->get('Location'));

    expect($target)->toContain('/felgen-suchen?zurueck=/felgen?zoll=18')
        ->and($target)->not->toContain('fahrzeug=');
});

it('takes no car from the address of the basket', function (): void {
    [$mine, $other] = urlCars();

    $this->withCookies(urlCookie($mine))->get('/warenkorb?fahrzeug='.VehicleKey::of($other))->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('vehicle.id', $mine->id));
});
