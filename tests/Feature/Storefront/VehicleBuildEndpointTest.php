<?php

declare(strict_types=1);

use App\Domain\Storefront\PapersBook;
use App\Models\Vehicle;
use App\Support\VehicleName;
use Illuminate\Testing\TestResponse;

/*
 * The owner's body style and drive for a car whose data has none (the operator's last prompt §1.1): the same
 * cookie as 8.1, 8.2 and T, the same policy, refused in words where it is not one the engine knows.
 */
function buildCookieOf(TestResponse $response): ?string
{
    foreach ($response->headers->getCookies() as $cookie) {
        if ($cookie->getName() === PapersBook::COOKIE) {
            return $cookie->getValue();
        }
    }

    return null;
}

it('keeps the answer beside the figures, and a second answer for one of the two keeps the other', function (): void {
    $vehicle = Vehicle::factory()->create(['hsn' => null, 'tsn' => null, 'body_form' => null, 'drive_axle' => null]);
    // The toast names the car the answer went to: another tab may show a car chosen since (G-10).
    $name = VehicleName::forShop($vehicle->make, $vehicle->model, $vehicle->variant, $vehicle->type_designation);

    $first = $this->withUnencryptedCookie(PapersBook::COOKIE, "{$vehicle->id}.1100.1100.250")
        ->from('/felgen')->post("/fahrzeug/{$vehicle->id}/aufbau", ['body_form' => 'Kombi'])
        ->assertRedirect('/felgen')
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', "Angabe für {$name} übernommen und neu geprüft.");

    expect(buildCookieOf($first))->toBe("{$vehicle->id}.1100.1100.250_{$vehicle->id}-k20");

    $second = $this->withUnencryptedCookie(PapersBook::COOKIE, (string) buildCookieOf($first))
        ->post("/fahrzeug/{$vehicle->id}/aufbau", ['drive_axle' => 'Allrad']);

    expect(buildCookieOf($second))->toBe("{$vehicle->id}.1100.1100.250_{$vehicle->id}-k21");

    // Forgotten again: the figures stay.
    $gone = $this->withUnencryptedCookie(PapersBook::COOKIE, (string) buildCookieOf($second))
        ->delete("/fahrzeug/{$vehicle->id}/aufbau")
        ->assertSessionHas('toast', "Angaben zu Karosserieform und Antriebsart für {$name} gelöscht.");

    expect(buildCookieOf($gone))->toBe("{$vehicle->id}.1100.1100.250");
});

it('refuses, in words, a body style or drive the engine does not know, and an empty answer', function (): void {
    $vehicle = Vehicle::factory()->create();

    $this->post("/fahrzeug/{$vehicle->id}/aufbau", ['body_form' => 'Pickup'])
        ->assertSessionHasErrorsIn('aufbau', ['body_form' => 'Wähl eine der gezeigten Karosserieformen.']);
    $this->post("/fahrzeug/{$vehicle->id}/aufbau", ['drive_axle' => 'Kette'])
        ->assertSessionHasErrorsIn('aufbau', ['drive_axle' => 'Wähl eine der gezeigten Antriebsarten.']);
    $this->post("/fahrzeug/{$vehicle->id}/aufbau", [])
        ->assertSessionHasErrorsIn('aufbau', ['body_form' => 'Wähl die Karosserieform oder die Antriebsart deines Fahrzeugs.']);
});

// As for 8.1, 8.2 and T: a car the shop no longer offers is not found, before the policy is even asked.
it('takes no answer for a car the shop no longer offers', function (): void {
    $vehicle = Vehicle::factory()->create();
    $vehicle->delete();

    $this->post("/fahrzeug/{$vehicle->id}/aufbau", ['body_form' => 'Kombi'])->assertNotFound();
    $this->delete("/fahrzeug/{$vehicle->id}/aufbau")->assertNotFound();
});
