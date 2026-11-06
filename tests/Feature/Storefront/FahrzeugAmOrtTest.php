<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use Database\Seeders\ApprovalSeeder;

/*
 * The car is chosen for the wheel on screen (the interaction review of Phase 3): the product page's „Fahrzeug wählen“ promises the
 * versions of this wheel for the car, so choosing one comes back here, version kept; removing the car stays here too, the page then
 * answering for no car. A way back is a path of this shop only (ShopPath): anything else goes where it always went.
 */

beforeEach(function (): void {
    $this->seed(ApprovalSeeder::class);
});

it('stays on the wheel when the car is removed there, without the car', function (): void {
    $back = '/felgen/nordfelge-fjord?ausfuehrung=2&groesse=5';

    $this->delete('/fahrzeug', ['zurueck' => $back])
        ->assertRedirect($back)
        ->assertCookieExpired(VehicleContext::COOKIE)
        ->assertSessionHas('toast', 'Fahrzeug entfernt.');
});

it('opens the selector where the removal names no way back, or one that is none', function (?string $back): void {
    $this->delete('/fahrzeug', $back === null ? [] : ['zurueck' => $back])
        ->assertRedirect('/felgen-suchen')
        ->assertCookieExpired(VehicleContext::COOKIE);
})->with(['none' => [null], 'another host' => ['https://example.org/felgen'], 'protocol-relative' => ['//example.org/felgen'], 'dots' => ['/felgen/../admin']]);

it('comes back to the wheel and the version with the car just chosen', function (): void {
    $config = WheelConfig::query()->with('wheelModel')->firstOrFail();
    $vehicle = Vehicle::query()->firstOrFail();
    $back = '/felgen/'.$config->wheelModel->slug.'?ausfuehrung='.$config->wheel_finish_id.'&groesse='.$config->id;

    $location = (string) $this->from('/felgen-suchen')
        ->post('/fahrzeug', ['fahrzeug' => $vehicle->id, 'zurueck' => $back])
        ->assertRedirect()
        ->headers->get('Location');

    expect($location)->toContain('/felgen/'.$config->wheelModel->slug.'?ausfuehrung='.$config->wheel_finish_id.'&groesse='.$config->id.'&fahrzeug=');
});
