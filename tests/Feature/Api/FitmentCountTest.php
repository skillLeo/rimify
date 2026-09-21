<?php

declare(strict_types=1);

use Database\Seeders\CommerceSeeder;

/**
 * F1 — the live count under the selector. The count is the listing's own count; by key numbers
 * it follows the resolver: none, one, or a choice — never a guess (R-01).
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('counts the wheels a document permits on a vehicle', function (): void {
    $vehicleId = (int) $this->getJson('/api/v1/fitment/count?hsn=0005&tsn=582')
        ->assertOk()
        ->json('vehicle.id');

    $response = $this->getJson('/api/v1/fitment/count?fahrzeug='.$vehicleId)->assertOk();

    expect($response->json('count'))->toBeGreaterThan(0)
        ->and($response->json('permitted') + $response->json('conditional'))->toBe($response->json('count'))
        ->and($response->json('ambiguous'))->toBe([])
        ->and($response->json('vehicle.label'))->toStartWith('BMW');
});

it('hands back a choice when the key numbers match several vehicles', function (): void {
    $this->getJson('/api/v1/fitment/count?hsn=1860&tsn=AAS')
        ->assertOk()
        ->assertJsonPath('count', 0)
        ->assertJsonPath('vehicle', null)
        ->assertJsonCount(2, 'ambiguous');
});

it('answers zero for key numbers nobody has', function (): void {
    $this->getJson('/api/v1/fitment/count?hsn=9999&tsn=ZZZ')
        ->assertOk()
        ->assertJsonPath('count', 0)
        ->assertJsonPath('vehicle', null)
        ->assertJsonPath('ambiguous', []);
});

it('accepts pasted key numbers with spaces and lower case', function (): void {
    $this->getJson('/api/v1/fitment/count?hsn=%200005%20&tsn=%20582')
        ->assertOk()
        ->assertJsonPath('vehicle.short', 'BMW 3er');
});

it('refuses a request without a vehicle or key numbers', function (): void {
    $this->getJson('/api/v1/fitment/count')->assertStatus(422);
    $this->getJson('/api/v1/fitment/count?hsn=00&tsn=5')->assertStatus(422);
});

it('answers zero for a vehicle id that does not exist', function (): void {
    $this->getJson('/api/v1/fitment/count?fahrzeug=999999')
        ->assertOk()
        ->assertJsonPath('count', 0)
        ->assertJsonPath('vehicle', null);
});
