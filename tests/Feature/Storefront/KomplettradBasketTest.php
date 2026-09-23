<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Models\BalanceWeightColour;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/**
 * docs/specs/komplettrad.md §4.1–§4.4 and §9.2: a Komplettrad enters the basket only with a
 * vehicle, only with a tyre the verdict permits at the posted quantity, and only with an active
 * Wuchtgewichte colour. Every refusal is a full German sentence — the engine's own where the engine
 * decided — and leaves the session exactly as it was (R-11, CLAUDE.md §2).
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
});

/**
 * The POST body the product page sends for a Komplettrad.
 *
 * @return array<string, mixed>
 */
function komplettradPost(int $wheelConfigId, ?int $tyreVariantId, int $quantity = 4, ?int $weightColourId = null): array
{
    return [
        'kind' => 'WHEEL',
        'wheelConfigId' => $wheelConfigId,
        'tyreVariantId' => $tyreVariantId,
        'weightColourId' => $weightColourId,
        'quantity' => $quantity,
    ];
}

/**
 * One configuration as the product page ships it (`viewData('page')`), by id.
 *
 * @return array<string, mixed>
 */
function pdpConfig(mixed $page, int $configId): array
{
    $configs = is_array($page) && is_array($page['props']['configs'] ?? null) ? $page['props']['configs'] : [];

    foreach ($configs as $config) {
        if (is_array($config) && ($config['id'] ?? null) === $configId) {
            return $config;
        }
    }

    throw new RuntimeException("Configuration {$configId} is not on the product page.");
}

/**
 * One tyre card of an offer, by tyre id.
 *
 * @param  array<string, mixed>  $offer
 * @return array<string, mixed>
 */
function offeredTyre(array $offer, int $tyreId): array
{
    foreach (is_array($offer['tyres'] ?? null) ? $offer['tyres'] : [] as $card) {
        if (is_array($card) && ($card['id'] ?? null) === $tyreId) {
            return $card;
        }
    }

    throw new RuntimeException("Tyre {$tyreId} is not offered.");
}

/**
 * The ids of every tyre an offer lists.
 *
 * @param  array<string, mixed>  $offer
 * @return list<int>
 */
function offeredTyreIds(array $offer): array
{
    $ids = [];

    foreach (is_array($offer['tyres'] ?? null) ? $offer['tyres'] : [] as $card) {
        if (is_array($card) && is_int($card['id'] ?? null)) {
            $ids[] = $card['id'];
        }
    }

    return $ids;
}

it('adds a permitted Komplettrad as one line keyed on the wheel and the tyre, with the default colour', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();
    $default = BalanceWeightColour::default();

    expect($default)->not->toBeNull();

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id))
        ->assertRedirect('/felgen/x')
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Komplettrad zum Warenkorb hinzugefügt.');

    $key = 'wheel:'.$set->config->id.':tyre:'.$tyre->id;
    $cart = session(Basket::SESSION_KEY);

    expect($cart)->toHaveCount(1)->toHaveKey($key)
        ->and($cart[$key])->toBe([
            'kind' => 'WHEEL',
            'wheelConfigId' => $set->config->id,
            'tyreVariantId' => $tyre->id,
            'weightColourId' => $default?->id,
            'quantity' => 4,
        ]);

    $this->withCookies($set->cookies())
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('lines.0.key', $key)
            ->where('lines.0.isSet', true)
            ->where('lines.0.setLabel', 'Komplettrad')
            ->where('lines.0.tyre.id', $tyre->id)
            ->where('lines.0.tyre.sizeLabel', $tyre->label())
            ->where('lines.0.weights.colourId', $default?->id)
            ->where('lines.0.weights.name', 'Silber')
            ->where('lines.0.blockReasons', [])
            ->has('lines.0.components', 4)
            ->where('lines.0.components.0.label', 'Felge')
            ->where('lines.0.components.1.label', 'Reifen')
            ->where('lines.0.components.2.label', 'Montage und Auswuchten')
            ->where('lines.0.components.3.label', 'Wuchtgewichte (Silber)')
            ->where('totals.count', 4)
        );
});

it('refuses a tyre the verdict does not permit with the engine\'s sentence and writes nothing to the session', function (): void {
    $set = KomplettradFixture::permitted();
    // A size no document lists: one aspect step off the permitted one.
    $tyre = $set->tyre(['aspect' => $set->size->aspect + 1]);

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id))
        ->assertRedirect('/felgen/x')
        ->assertSessionHasErrors(['tyreVariantId' => KomplettradRefusal::SizeNotPermitted->sentenceDe()]);

    expect(session(Basket::SESSION_KEY))->toBeNull();
});

it('refuses a Komplettrad without a vehicle: there is no verdict to check a tyre against', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();

    $this->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id))
        ->assertRedirect('/felgen/x')
        ->assertSessionHasErrors(['tyreVariantId' => KomplettradRefusal::NoVehicle->sentenceDe()]);

    expect(session(Basket::SESSION_KEY))->toBeNull();

    // The Felge alone stays buyable without a vehicle, exactly as before.
    $this->post('/warenkorb', komplettradPost($set->config->id, null))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Zum Warenkorb hinzugefügt.');

    expect(session(Basket::SESSION_KEY))->toHaveKey('wheel:'.$set->config->id);
});

it('answers a wheel no Gutachten covers for this car with the UNKNOWN sentence, never the NOT_PERMITTED one', function (): void {
    $set = KomplettradFixture::permitted();
    $config = $set->undocumentedConfig();
    // Refused before any tyre is looked at, so the tyre's size does not matter here.
    $tyre = $set->tyre();

    expect(app(FitmentResolver::class)->resolve($set->vehicle->id, $config->id)->status)->toBe(VerdictStatus::Unknown);

    // The add-time gate (§4.4 step 2): a car we hold no document for is not told it is unapproved.
    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($config->id, $tyre->id))
        ->assertSessionHasErrors(['tyreVariantId' => Basket::WHEEL_UNKNOWN]);

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($config->id, null))
        ->assertSessionHasErrors(['wheelConfigId' => Basket::WHEEL_UNKNOWN]);

    expect(session(Basket::SESSION_KEY))->toBeNull()
        ->and(Basket::WHEEL_UNKNOWN)->not->toBe(Basket::WHEEL_NOT_PERMITTED);

    // The product page (§3.2): the offer carries the engine's UNKNOWN sentence, not the other one.
    $pageConfig = pdpConfig(
        $this->withCookies($set->cookies())->get('/felgen/'.$config->wheelModel->slug)->viewData('page'),
        $config->id,
    );

    expect($pageConfig['komplettrad']['refusalCode'])->toBe(KomplettradRefusal::VerdictUnknown->value)
        ->and($pageConfig['komplettrad']['refusal'])->toBe(KomplettradRefusal::VerdictUnknown->sentenceDe())
        ->and($pageConfig['komplettrad']['tyres'])->toBe([])
        ->and($pageConfig['verdict']['status'])->toBe(VerdictStatus::Unknown->value);
});

it('stores the posted colour and keeps it when the same combination is added again', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();
    $schwarz = BalanceWeightColour::query()->where('slug', 'schwarz')->firstOrFail();
    $key = 'wheel:'.$set->config->id.':tyre:'.$tyre->id;

    $this->withCookies($set->cookies())
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id, 4, $schwarz->id))
        ->assertSessionHasNoErrors();

    // Adding the same combination again merges into one line and keeps the stored colour.
    $this->withCookies($set->cookies())
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id))
        ->assertSessionHasNoErrors();

    $cart = session(Basket::SESSION_KEY);

    expect($cart)->toHaveCount(1)
        ->and($cart[$key]['quantity'])->toBe(8)
        ->and($cart[$key]['weightColourId'])->toBe($schwarz->id);

    $this->withCookies($set->cookies())
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 1)
            ->where('lines.0.quantity', 8)
            ->where('lines.0.weights.name', 'Schwarz')
            ->has('lines.0.weightOptions', 2)
            ->where('lines.0.weightOptions.0.name', 'Silber')
            ->where('lines.0.weightOptions.0.isDefault', true)
            ->where('lines.0.weightOptions.1.name', 'Schwarz')
        );
});

it('keeps a Felge and a Komplettrad of the same rim as two lines', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();

    $this->withCookies($set->cookies())
        ->post('/warenkorb', komplettradPost($set->config->id, null))
        ->assertSessionHasNoErrors();

    $this->withCookies($set->cookies())
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id))
        ->assertSessionHasNoErrors();

    expect(array_keys(session(Basket::SESSION_KEY)))
        ->toBe(['wheel:'.$set->config->id, 'wheel:'.$set->config->id.':tyre:'.$tyre->id]);

    $this->withCookies($set->cookies())
        ->get('/warenkorb')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 2)
            ->where('lines.0.setLabel', 'Felge')
            ->where('lines.0.tyre', null)
            ->has('lines.0.components', 1)
            ->where('lines.0.components.0.label', 'Felge')
            ->where('lines.0.weightOptions', [])
            ->where('lines.1.setLabel', 'Komplettrad')
            ->where('totals.count', 8)
        );
});

it('refuses four Kompletträder against one tyre in stock at the click, not at the checkout', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre(['stock_qty' => 1]);

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id, 4))
        ->assertSessionHasErrors(['tyreVariantId' => KomplettradRefusal::OutOfStock->sentenceDe()]);

    expect(session(Basket::SESSION_KEY))->toBeNull();

    // One is what the shelf holds, so one may be added.
    $this->withCookies($set->cookies())
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id, 1))
        ->assertSessionHasNoErrors();

    expect(session(Basket::SESSION_KEY))->toHaveCount(1);
});

it('refuses more wheels than are in stock for a Felgen-only line too', function (): void {
    $set = KomplettradFixture::permitted();
    $set->config->update(['stock_qty' => 3]);

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, null, 4))
        ->assertSessionHasErrors(['wheelConfigId' => Basket::WHEEL_SOLD_OUT]);

    expect(session(Basket::SESSION_KEY))->toBeNull();
});

it('refuses a colour that is not active, and any Komplettrad while no colour is active at all', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();
    $schwarz = BalanceWeightColour::query()->where('slug', 'schwarz')->firstOrFail();
    $schwarz->update(['active' => false]);

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id, 4, $schwarz->id))
        ->assertSessionHasErrors(['tyreVariantId' => Basket::WEIGHT_COLOUR_GONE]);

    BalanceWeightColour::query()->update(['active' => false]);

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, $tyre->id))
        ->assertSessionHasErrors(['tyreVariantId' => Basket::NO_WEIGHT_COLOUR_REFUSAL]);

    expect(session(Basket::SESSION_KEY))->toBeNull();

    // The product page says so before the click, with the Felgen purchase as the way forward.
    $config = pdpConfig(
        $this->withCookies($set->cookies())->get('/felgen/'.$set->config->wheelModel->slug)->viewData('page'),
        $set->config->id,
    );

    expect($config['komplettrad']['refusalCode'])->toBe(Basket::NO_WEIGHT_COLOUR_CODE)
        ->and($config['komplettrad']['refusal'])->toBe(Basket::NO_WEIGHT_COLOUR_REFUSAL);
});

it('refuses a tyre that no longer exists, deleted or never there', function (): void {
    $set = KomplettradFixture::permitted();
    $deleted = $set->tyre();
    $deleted->delete();

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, $deleted->id))
        ->assertSessionHasErrors(['tyreVariantId' => Basket::TYRE_GONE]);

    $this->withCookies($set->cookies())
        ->from('/felgen/x')
        ->post('/warenkorb', komplettradPost($set->config->id, 999_999))
        ->assertSessionHasErrors(['tyreVariantId' => Basket::TYRE_GONE]);

    expect(session(Basket::SESSION_KEY))->toBeNull();
});

it('offers on the product page exactly what the basket takes, priced per wheel, and only with a vehicle', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = $set->tyre();
    // In stock for one wheel, not for the set of four the page sells.
    $short = $set->tyre(['stock_qty' => 2]);
    $slug = $set->config->wheelModel->slug;

    $config = pdpConfig($this->withCookies($set->cookies())->get('/felgen/'.$slug)->assertOk()->viewData('page'), $set->config->id);
    $offer = $config['komplettrad'];
    $ids = offeredTyreIds($offer);

    expect($offer['refusal'])->toBeNull()
        ->and($offer['refusalCode'])->toBeNull()
        ->and($offer['quantity'])->toBe(4)
        ->and($ids)->toContain($tyre->id)
        ->and($ids)->not->toContain($short->id)
        ->and($offer['minSentence'])->toStartWith('Für dein Fahrzeug brauchen die Reifen mindestens Tragfähigkeitsindex')
        // While the mounting fee is unconfigured the figure is the known sum, and the page says so.
        ->and($offer['priceOpen'])->toBeTrue()
        ->and($config['verdict']['tyreLayout'])->toBe('SAME')
        ->and($config['verdict']['tyreSizesFront'])->toBe($config['verdict']['tyreSizes'])
        ->and($config['verdict']['tyreSizesFront'])->toContain($set->size->labelDe())
        ->and($config['verdict']['minLoadIndex'])->toBeInt()
        ->and($config['verdict']['minSpeedSymbol'])->toBeString()
        ->and($config['verdict']['minSentence'])->toBe($offer['minSentence']);

    $card = offeredTyre($offer, $tyre->id);
    $perWheel = $set->config->price_cents + $tyre->price_cents;

    expect($card['sizeLabel'])->toBe($tyre->label())
        ->and($card['seasonLabel'])->toEndWith('reifen')
        ->and($card['perWheelCents'])->toBe($perWheel)
        ->and($card['perWheel'])->toBe(GermanFormat::money($perWheel))
        ->and($card['forFourCents'])->toBe($perWheel * 4)
        ->and($card['forFour'])->toBe(GermanFormat::money($perWheel * 4))
        ->and($card['label'])->toBeNull();

    // Once the client names the fee it is in the per-wheel price and the price is no longer open.
    config(['rimify.komplettrad.mounting_per_wheel_cents' => 1_900]);

    $offer = pdpConfig($this->withCookies($set->cookies())->get('/felgen/'.$slug)->viewData('page'), $set->config->id)['komplettrad'];
    $card = offeredTyre($offer, $tyre->id);

    expect($offer['priceOpen'])->toBeFalse()
        ->and($card['perWheelCents'])->toBe($perWheel + 1_900);

    // Without a vehicle there is no verdict and no offer: the sentence sends the customer to the selector.
    $this->defaultCookies = [];

    $offer = pdpConfig($this->get('/felgen/'.$slug)->viewData('page'), $set->config->id)['komplettrad'];

    expect($offer['refusalCode'])->toBe(KomplettradRefusal::NoVehicle->value)
        ->and($offer['refusal'])->toBe(KomplettradRefusal::NoVehicle->sentenceDe())
        ->and($offer['tyres'])->toBe([]);
});
