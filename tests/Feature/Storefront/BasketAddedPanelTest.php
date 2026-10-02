<?php

declare(strict_types=1);

use App\Support\GermanFormat;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The client's #16: after an add, the response carries what the panel shows — the line at the amount just added and
 * that amount's price, and the basket's count and subtotal as they now stand. Every figure is the server's own render.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
});

it('flashes the rims just added, at their price, and the basket as it now stands', function (): void {
    $set = KomplettradFixture::permitted();
    $model = $set->config->wheelModel;
    $post = ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'quantity' => 2];

    $this->withCookies($set->cookies())->post('/warenkorb', $post)->assertSessionHasNoErrors();
    $this->withCookies($set->cookies())->post('/warenkorb', $post)
        ->assertSessionHas('toast', 'Zum Warenkorb hinzugefügt.')
        ->assertSessionHas('added', fn (array $added): bool => $added['heading'] === 'Zum Warenkorb hinzugefügt.'
            && count($added['lines']) === 1
            && $added['lines'][0]['title'] === trim($model->brand->name.' '.$model->name)
            && str_starts_with($added['lines'][0]['detail'], 'Felge · ')
            // The amount just added and its price — not the four the line now holds.
            && $added['lines'][0]['quantity'] === 2
            && $added['lines'][0]['price'] === GermanFormat::money(2 * (int) $set->config->price_cents)
            && $added['count'] === 4
            && $added['subtotal'] === GermanFormat::money(4 * (int) $set->config->price_cents));
});

it('flashes a Komplettrad with its tyre named', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();

    $this->withCookies($set->cookies())
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'tyreVariantId' => $tyre->id, 'quantity' => 4])
        ->assertSessionHas('added', fn (array $added): bool => $added['heading'] === 'Komplettrad zum Warenkorb hinzugefügt.'
            && str_starts_with($added['lines'][0]['detail'], 'Komplettrad · ')
            && str_contains($added['lines'][0]['detail'], $tyre->label())
            && $added['lines'][0]['quantity'] === 4);
});

it('flashes nothing to show for an add the server refused', function (): void {
    $set = KomplettradFixture::permitted();

    $this->withCookies($set->cookies())
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'quantity' => 999])
        ->assertSessionHasErrors('quantity')
        ->assertSessionMissing('added');
});
