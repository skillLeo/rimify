<?php

declare(strict_types=1);

use Database\Seeders\CommerceSeeder;

/**
 * The two lower steps of the make → model → variant drill, for the hero comboboxes.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('lists the models of a make with their variant counts', function (): void {
    $response = $this->getJson('/api/v1/vehicles/models?marke=BMW')->assertOk();

    expect($response->json('models'))->not->toBeEmpty()
        ->and($response->json('models.0'))->toHaveKeys(['model', 'variants']);
});

it('lists the variants of a model with what the selector shows', function (): void {
    $model = (string) $this->getJson('/api/v1/vehicles/models?marke=BMW')->json('models.0.model');

    $response = $this->getJson('/api/v1/vehicles/variants?marke=BMW&modell='.rawurlencode($model))->assertOk();

    expect($response->json('variants'))->not->toBeEmpty()
        ->and($response->json('variants.0'))->toHaveKeys(['id', 'variant', 'buildWindow', 'powerPs', 'needsReview']);
});

it('answers an empty list for a make it does not know', function (): void {
    $this->getJson('/api/v1/vehicles/models?marke=Trabant')
        ->assertOk()
        ->assertJsonPath('models', []);
});

it('refuses the variant step without a model', function (): void {
    $this->getJson('/api/v1/vehicles/variants?marke=BMW')->assertStatus(422);
    $this->getJson('/api/v1/vehicles/models')->assertStatus(422);
});
