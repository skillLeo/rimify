<?php

declare(strict_types=1);

use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Services\Storefront\Basket;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * ACCURACY.md D6, findings #17/#81: RIMIFY sells Felgen alone or Kompletträder, never a standalone
 * tyre. The server refuses a TYRE line whatever the page sends (R-11), and a tyre line left in an
 * older session is neither shown nor priced.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('refuses a standalone tyre with a 422 and leaves the basket as it was', function (): void {
    $tyre = TyreVariant::query()->where('stock_qty', '>', 0)->firstOrFail();

    $this->postJson('/warenkorb', ['kind' => 'TYRE', 'tyreVariantId' => $tyre->id, 'quantity' => 4])
        ->assertStatus(422)
        ->assertJsonPath('errors.kind.0', 'Reifen gibt es bei uns nur zusammen mit einer Felge als Komplettrad.');

    expect(session(Basket::SESSION_KEY))->toBeNull();

    $this->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page->has('lines', 0)->where('totals.count', 0));
});

it('refuses a wheel line that tries to carry an unchecked tyre', function (): void {
    $config = WheelConfig::query()->where('stock_qty', '>', 4)->firstOrFail();
    $tyre = TyreVariant::query()->firstOrFail();

    $this->postJson('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => $tyre->id, 'quantity' => 4])
        ->assertStatus(422)
        ->assertJsonPath('errors.tyreVariantId.0', 'Kompletträder kannst du noch nicht in den Warenkorb legen.');

    expect(session(Basket::SESSION_KEY))->toBeNull();
});

it('still takes a wheel', function (): void {
    $config = WheelConfig::query()->where('stock_qty', '>', 4)->firstOrFail();

    $this->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4])
        ->assertSessionHasNoErrors();

    $this->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page
        ->has('lines', 1)
        ->where('lines.0.kind', 'WHEEL')
        ->where('lines.0.key', 'wheel:'.$config->id)
    );
});

it('drops a tyre line an older session still carries', function (): void {
    $config = WheelConfig::query()->where('stock_qty', '>', 4)->firstOrFail();
    $tyre = TyreVariant::query()->firstOrFail();

    $this->withSession([Basket::SESSION_KEY => [
        'tyre:'.$tyre->id => ['kind' => 'TYRE', 'wheelConfigId' => null, 'tyreVariantId' => $tyre->id, 'quantity' => 4],
        'wheel:'.$config->id => ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4],
    ]])
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('lines.0.kind', 'WHEEL')
            ->where('totals.count', 4)
            ->where('totals.subtotalCents', $config->price_cents * 4)
        );
});
