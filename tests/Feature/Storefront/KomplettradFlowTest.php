<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleKey;
use App\Enums\CatalogueStatus;
use App\Models\BalanceWeightColour;
use App\Models\TyreModel;
use App\Models\TyreModelImage;
use App\Services\Admin\Catalogue\TyreModels;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use App\Support\Money;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The Komplettrad's steps on the server (the Gutachten rework §9): the row the product page ships, so the two can never disagree, and
 * what the steps add to it — the photographs by the tyre's model and the fee for the sum. Nothing here decides whether a tyre fits:
 * only the tyres TyreEligibility permits are in the row, and the basket asks the engine again on the add (R-11, R-13).
 */

beforeEach(function (): void {
    config(['rimify.komplettrad.mounting_per_wheel_cents' => 2_500]);
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
});

/**
 * What the flow's page was given.
 *
 * @return array<string, mixed>
 */
function flowProps(mixed $test, KomplettradFixture $set, string $query = ''): array
{
    return $test->withCookies($set->cookies())
        ->get('/komplettraeder?groesse='.$set->config->id.$query)
        ->assertOk()
        ->viewData('page')['props'];
}

/**
 * The same size as the product page ships it.
 *
 * @return array<string, mixed>
 */
function pageRow(mixed $test, KomplettradFixture $set): array
{
    $page = $test->withCookies($set->cookies())->get('/felgen/'.$set->config->wheelModel->slug.'?ausfuehrung='.$set->config->wheel_finish_id)->assertOk()->viewData('page');

    return collect($page['props']['configs'])->firstWhere('id', $set->config->id);
}

it('leads back to the rims where the size is no size, never a dead end', function (string $address): void {
    $this->get($address)->assertRedirect('/felgen');
})->with([
    'none' => '/komplettraeder',
    'not a number' => '/komplettraeder?groesse=abc',
    'nobody’s' => '/komplettraeder?groesse=99999999',
]);

it('shows no size of a model that is not on sale', function (): void {
    $set = KomplettradFixture::permitted();
    $set->config->wheelModel->forceFill(['status' => CatalogueStatus::Draft])->save();

    $this->withCookies($set->cookies())->get('/komplettraeder?groesse='.$set->config->id)->assertRedirect('/felgen');
});

it('opens the rim’s step on the page itself, with the product and the version, server-rendered from the address', function (): void {
    $set = KomplettradFixture::permitted();

    $this->withCookies($set->cookies())
        ->get('/komplettraeder?groesse='.$set->config->id.'&schritt=2')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Komplettrad/Index')
            ->where('schritt', 2)
            ->where('config.id', $set->config->id)
            ->where('config.versionLabel', fn (string $label): bool => str_starts_with($label, 'Breite'.GermanFormat::NBSP))
            ->where('product.slug', $set->config->wheelModel->slug)
            ->where('product.finishId', $set->config->wheel_finish_id)
        );
});

it('reads a step that is none as none: the page opens where it can', function (string $step): void {
    expect(flowProps($this, KomplettradFixture::permitted(), '&schritt='.$step)['schritt'])->toBeNull();
})->with(['5', '0', 'x', '2; DROP']);

it('offers exactly what the product page offers for the same size: one row, so the two can never disagree @kunde-18', function (): void {
    $set = KomplettradFixture::permitted();
    $fits = $set->tyre();
    // A size no document lists, one aspect step off the permitted one.
    $none = $set->tyre(['aspect' => $set->size->aspect + 1]);

    $row = flowProps($this, $set)['config'];
    $ids = collect($row['komplettrad']['tyres'])->pluck('id')->all();

    expect($ids)->toContain($fits->id)
        ->not->toContain($none->id)
        ->and($row['komplettrad'])->toEqual(pageRow($this, $set)['komplettrad']);
});

it('takes the car from its own address, as the other pages that answer for one car do (D-116)', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();
    $key = VehicleKey::of($set->vehicle);

    $props = $this->get('/komplettraeder?groesse='.$set->config->id.'&fahrzeug='.$key)->assertOk()->viewData('page')['props'];

    expect(collect($props['config']['komplettrad']['tyres'])->pluck('id')->all())->toContain($tyre->id);
});

it('says why where there is no car, and lists no tyre @kunde-25', function (): void {
    $set = KomplettradFixture::permitted();
    $set->tyre();

    $this->get('/komplettraeder?groesse='.$set->config->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('config.komplettrad.refusalCode', 'NO_VEHICLE')
            ->where('config.komplettrad.tyres', [])
            ->whereType('config.komplettrad.refusal', 'string')
        );
});

it('hands each tyre its own model’s photographs in their order, and nothing to a model without any', function (): void {
    $set = KomplettradFixture::permitted();
    $pictured = $set->tyre(['name' => 'Mit Bild']);
    $plain = $set->tyre(['name' => 'Ohne Bild', 'width_mm' => $pictured->width_mm]);
    app(TyreModels::class)->sync();
    $model = TyreModel::query()->where('name', 'Mit Bild')->sole();

    foreach ([1 => 'hinten', 0 => 'vorne'] as $position => $name) {
        TyreModelImage::query()->create([
            'tyre_model_id' => $model->id,
            'position' => $position,
            'alt_de' => 'Mit Bild, '.$name,
            'manifest' => ['name' => $name, 'base' => '/media/'.$name, 'width' => 800, 'height' => 800, 'widths' => [800], 'placeholder' => '', 'fallback' => 'jpg'],
        ]);
    }

    $photos = (array) flowProps($this, $set)['photos'];

    expect(collect($photos[$pictured->id])->pluck('name')->all())->toBe(['vorne', 'hinten'])
        ->and($photos[$pictured->id][0]['alt'])->toBe('Mit Bild, vorne')
        ->and($photos)->not->toHaveKey($plain->id);
});

it('prices a set so that its lines add up to it: rims, tyres, the fee and the colour', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre(['price_cents' => 15_000]);
    $props = flowProps($this, $set);
    $card = collect($props['config']['komplettrad']['tyres'])->firstWhere('id', $tyre->id);
    $rims = 4 * (int) $set->config->price_cents;

    expect($card['tyreSetCents'])->toBe(60_000)
        ->and($card['tyreSet'])->toBe(Money::fromMinor(60_000, 'EUR')->format())
        ->and($card['tyrePrice'])->toBe(Money::fromMinor(15_000, 'EUR')->format())
        ->and($props['mounting'])->toBe(['each' => Money::fromMinor(2_500, 'EUR')->format(), 'total' => Money::fromMinor(10_000, 'EUR')->format()])
        ->and($card['forFourCents'])->toBe($rims + 60_000 + 10_000);

    foreach ($props['options']['colours'] as $colour) {
        $price = collect($card['prices'])->firstWhere('colourId', $colour['id']);

        expect($price['forFourCents'])->toBe($rims + 60_000 + 10_000 + 4 * $colour['surchargeCents']);
    }
});

it('says what a tyre’s figures mean, also for the symbol with no upper limit: a card never breaks on it', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre(['load_index' => 100]);
    $card = collect(flowProps($this, $set)['config']['komplettrad']['tyres'])->firstWhere('id', $tyre->id);

    expect($card['facts'])->toBe('Lastindex 100: bis 800'.GermanFormat::NBSP.'kg je Reifen · (Y): über 300'.GermanFormat::NBSP.'km/h');
});

it('names no fee nobody has named: the steps say so, never a guessed figure', function (): void {
    config(['rimify.komplettrad.mounting_per_wheel_cents' => null]);

    expect(flowProps($this, KomplettradFixture::permitted())['mounting'])->toBeNull();
});

it('takes what the steps post: the tyre, the colour and the answer on the sensors, and the basket asks the engine again', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();
    $colour = BalanceWeightColour::query()->where('is_default', false)->where('active', true)->firstOrFail();

    $this->withCookies($set->cookies())
        ->from('/komplettraeder?groesse='.$set->config->id.'&schritt=4')
        ->post('/warenkorb', [
            'kind' => 'WHEEL',
            'wheelConfigId' => $set->config->id,
            'tyreVariantId' => $tyre->id,
            'rearTyreVariantId' => null,
            'weightColourId' => $colour->id,
            'rdks' => 'nein',
            'quantity' => 4,
        ])
        ->assertSessionHasNoErrors();

    expect(session(Basket::SESSION_KEY)['wheel:'.$set->config->id.':tyre:'.$tyre->id])->toMatchArray(['tyreVariantId' => $tyre->id, 'weightColourId' => $colour->id, 'quantity' => 4])
        ->and(session(Basket::SESSION_TPMS)['choice'])->toBe('nein');
});
