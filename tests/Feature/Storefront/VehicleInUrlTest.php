<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Models\Vehicle;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * The client's #8 (D-116): the car in the address. `?fahrzeug=<id>` on a page that answers for one car decides the car,
 * the cookie remembers it, the server renders from it, and the page's address carries the car it was rendered for —
 * so it can be saved and shared. An unknown number is ignored, never an error; the basket and the checkout never
 * take a car from their address.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

/** @return array{0: Vehicle, 1: Vehicle} two cars the catalogue holds */
function urlCars(): array
{
    $cars = Vehicle::query()->orderBy('id')->limit(2)->get();

    return [$cars[0], $cars[1]];
}

function urlCookie(Vehicle $vehicle): array
{
    return [VehicleContext::COOKIE => (new VehicleContext((int) $vehicle->id, true))->encode()];
}

it('renders the car the address names, remembers it in the cookie and keeps it in the address', function (): void {
    [$car] = urlCars();

    $response = $this->get('/felgen?fahrzeug='.$car->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('vehicle.id', $car->id)
            ->url('/felgen?fahrzeug='.$car->id));

    $cookie = collect($response->headers->getCookies())->first(fn ($c) => $c->getName() === VehicleContext::COOKIE);

    expect($cookie)->not->toBeNull();
});

it('lets the address win over the cookie — the shared link shows the car it was shared for', function (): void {
    [$mine, $shared] = urlCars();

    $this->withCookies(urlCookie($mine))->get('/felgen?fahrzeug='.$shared->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('vehicle.id', $shared->id)
            ->url('/felgen?fahrzeug='.$shared->id));
});

it('writes the remembered car into the address of a page asked for without one', function (): void {
    [$car] = urlCars();

    $this->withCookies(urlCookie($car))->get('/felgen?sort=preis')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->url('/felgen?sort=preis&fahrzeug='.$car->id));

    $this->withCookies(urlCookie($car))->get('/')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->url('/?fahrzeug='.$car->id));
});

it('ignores a number the catalogue does not hold and corrects the address to the car it shows', function (): void {
    [$car] = urlCars();
    $unknown = (int) Vehicle::withTrashed()->max('id') + 1000;

    $this->withCookies(urlCookie($car))->get('/felgen?fahrzeug='.$unknown)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('vehicle.id', $car->id)
            ->url('/felgen?fahrzeug='.$car->id));
});

it('reads no car from a malformed number, and leaves no number in the address without a car', function (): void {
    $this->get('/felgen?fahrzeug=abc')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('vehicle', null)->url('/felgen'));
});

it('takes no car from the address of the basket', function (): void {
    [$mine, $other] = urlCars();

    $this->withCookies(urlCookie($mine))->get('/warenkorb?fahrzeug='.$other->id)->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('vehicle.id', $mine->id));
});
