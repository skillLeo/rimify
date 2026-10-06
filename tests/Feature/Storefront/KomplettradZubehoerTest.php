<?php

declare(strict_types=1);

use App\Models\BalanceWeightColour;
use App\Models\TpmsSensorPrice;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use App\Support\MakeName;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The client's #15: with Komplettrad chosen, the product page offers what goes with it — the Wuchtgewichte colours the
 * admin keeps active, each set priced with it on the server, and the RDKS question for the set, priced for the car's
 * make — and nothing of it under „Nur Felgen“. The answer given there is the checkout's own: asked once, not twice.
 * On a car with RDKS the sensor is the valve (komplettrad.md D-041), so the one answer settles both.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
});

/** @return array<string, mixed> */
function zubehoerPost(KomplettradFixture $set, ?int $tyreId, array $extra = []): array
{
    return array_merge(['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'tyreVariantId' => $tyreId, 'quantity' => 4], $extra);
}

/**
 * One tyre of one configuration's offer, as the product page ships it.
 *
 * @return array<string, mixed>
 */
function zubehoerCard(mixed $page, int $configId, int $tyreId): array
{
    $config = collect(is_array($page) ? $page['props']['configs'] : [])->firstWhere('id', $configId);

    return collect($config['komplettrad']['tyres'] ?? [])->firstWhere('id', $tyreId) ?? throw new RuntimeException("Tyre {$tyreId} is not offered.");
}

it('ships the active colours, the RDKS question and every set priced per colour — and none of it without a car @kunde-15', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();
    $black = BalanceWeightColour::query()->where('name_de', 'Schwarz')->firstOrFail();
    $black->forceFill(['surcharge_cents' => 500])->save();
    $slug = $set->config->wheelModel->slug;

    $page = $this->withCookies($set->cookies())->get('/felgen/'.$slug)->assertOk()
        ->assertInertia(fn (AssertableInertia $p) => $p
            ->has('komplettradOptions.colours', 2)
            ->where('komplettradOptions.colours.0.name', 'Silber')
            ->where('komplettradOptions.colours.0.isDefault', true)
            ->where('komplettradOptions.colours.1.surcharge', GermanFormat::money(500))
            ->where('komplettradOptions.tpms.applicable', true)
            ->where('komplettradOptions.tpms.quantity', 4)
            ->where('komplettradOptions.tpms.choice', null))
        ->viewData('page');

    $card = zubehoerCard($page, $set->config->id, $tyre->id);
    $prices = collect($card['prices'])->keyBy('colourId');

    // The black set costs the silver one plus four times the surcharge — computed by the server, read by the page.
    expect($prices)->toHaveCount(2)
        ->and($prices[$black->id]['forFourCents'])->toBe($card['forFourCents'] + 4 * 500)
        ->and($prices[BalanceWeightColour::default()?->id]['forFour'])->toBe($card['forFour']);

    $this->defaultCookies = [];
    $this->get('/felgen/'.$slug)->assertInertia(fn (AssertableInertia $p) => $p->where('komplettradOptions', null));
});

it('prices the sensors for the car\'s make, and says so where no price is entered', function (): void {
    $set = KomplettradFixture::permitted();
    $slug = $set->config->wheelModel->slug;

    $this->withCookies($set->cookies())->get('/felgen/'.$slug)
        ->assertInertia(fn (AssertableInertia $p) => $p
            ->where('komplettradOptions.tpms.available', false)
            ->where('komplettradOptions.tpms.yesTotal', null)
            ->where('komplettradOptions.tpms.notice', fn (?string $notice): bool => is_string($notice) && str_contains($notice, 'RDKS-Sensoren noch nicht hinterlegt')));

    TpmsSensorPrice::factory()->ofMake(MakeName::key($set->vehicle->make), MakeName::normalise($set->vehicle->make))->create(['price_cents' => 4_900]);

    $this->withCookies($set->cookies())->get('/felgen/'.$slug)
        ->assertInertia(fn (AssertableInertia $p) => $p
            ->where('komplettradOptions.tpms.available', true)
            ->where('komplettradOptions.tpms.line', '4 × '.GermanFormat::money(4_900))
            ->where('komplettradOptions.tpms.yesTotal', GermanFormat::money(19_600)));
});

it('adds the set with the colour picked and records the RDKS answer as the checkout\'s own @kunde-15', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();
    $black = BalanceWeightColour::query()->where('name_de', 'Schwarz')->firstOrFail();
    TpmsSensorPrice::factory()->ofMake(MakeName::key($set->vehicle->make), MakeName::normalise($set->vehicle->make))->create(['price_cents' => 4_900]);

    $this->withCookies($set->cookies())->post('/warenkorb', zubehoerPost($set, $tyre->id, ['weightColourId' => $black->id, 'rdks' => 'ja']))
        ->assertSessionHasNoErrors();

    $line = session(Basket::SESSION_KEY)['wheel:'.$set->config->id.':tyre:'.$tyre->id];
    expect($line['weightColourId'])->toBe($black->id)
        ->and(session(Basket::SESSION_TPMS)['choice'])->toBe('ja');

    // The checkout finds the question answered, at the price it was answered at.
    $this->withCookies($set->cookies())->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $p) => $p
            ->where('totals.tpms.choice', 'ja')
            ->where('totals.tpms.totalCents', 19_600));
});

it('refuses sensors where no price is entered for the make, and adds nothing', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();

    $this->withCookies($set->cookies())->post('/warenkorb', zubehoerPost($set, $tyre->id, ['rdks' => 'ja']))
        ->assertSessionHasErrors(['rdks' => Basket::TPMS_UNAVAILABLE_REFUSAL]);

    expect(session(Basket::SESSION_KEY, []))->toBe([])
        ->and(session(Basket::SESSION_TPMS))->toBeNull();

    // „Ohne Sensoren“ needs no price.
    $this->withCookies($set->cookies())->post('/warenkorb', zubehoerPost($set, $tyre->id, ['rdks' => 'nein']))->assertSessionHasNoErrors();
    expect(session(Basket::SESSION_TPMS)['choice'])->toBe('nein');
});

it('leaves the RDKS question alone for rims added without a tyre @kunde-15', function (): void {
    $set = KomplettradFixture::permitted();

    $this->withCookies($set->cookies())->post('/warenkorb', zubehoerPost($set, null, ['rdks' => 'ja']))->assertSessionHasNoErrors();

    expect(session(Basket::SESSION_TPMS))->toBeNull();
});
