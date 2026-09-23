<?php

declare(strict_types=1);

use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Models\TyreVariant;
use App\Models\WheelConfig;
use App\Services\Storefront\Basket;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/**
 * ACCURACY.md D6, findings #17/#81: RIMIFY sells Felgen alone or Kompletträder, never a standalone
 * tyre. The server refuses a TYRE line whatever the page sends (R-11); a WHEEL line may carry a
 * tyre only when the fitment engine permits it on the chosen car (docs/specs/komplettrad.md §4.4);
 * and a tyre line left in an older session is neither shown nor priced.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
});

it('refuses a standalone tyre with a 422 and leaves the basket as it was', function (): void {
    $tyre = TyreVariant::query()->where('stock_qty', '>', 0)->firstOrFail();

    $this->postJson('/warenkorb', ['kind' => 'TYRE', 'tyreVariantId' => $tyre->id, 'quantity' => 4])
        ->assertStatus(422)
        ->assertJsonPath('errors.kind.0', 'Reifen gibt es bei uns nur zusammen mit einer Felge als Komplettrad.');

    expect(session(Basket::SESSION_KEY))->toBeNull();

    $this->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page->has('lines', 0)->where('totals.count', 0));
});

it('takes a wheel line whose tyre the verdict permits, and refuses one it does not', function (): void {
    $set = KomplettradFixture::permitted();
    $permitted = $set->tyre();
    $wrongDiameter = $set->tyre(['diameter_in' => $set->size->diameterIn + 1]);

    $this->withCookies($set->cookies())
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'tyreVariantId' => $permitted->id, 'quantity' => 4])
        ->assertSessionHasNoErrors();

    $this->withCookies($set->cookies())
        ->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'tyreVariantId' => $wrongDiameter->id, 'quantity' => 4])
        ->assertRedirect('/felgen')
        ->assertSessionHasErrors(['tyreVariantId' => KomplettradRefusal::DiameterMismatch->sentenceDe()]);

    // The refused line never reached the session; the permitted one is still its only line.
    expect(array_keys(session(Basket::SESSION_KEY)))->toBe(['wheel:'.$set->config->id.':tyre:'.$permitted->id]);
});

it('still takes a wheel', function (): void {
    $config = WheelConfig::query()->where('stock_qty', '>', 4)->firstOrFail();

    $this->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4])
        ->assertSessionHasNoErrors();

    $this->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page
        ->has('lines', 1)
        ->where('lines.0.kind', 'WHEEL')
        ->where('lines.0.key', 'wheel:'.$config->id)
        ->where('lines.0.isSet', false)
        ->where('lines.0.setLabel', 'Felge')
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
