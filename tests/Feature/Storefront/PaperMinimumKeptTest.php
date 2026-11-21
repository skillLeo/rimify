<?php

declare(strict_types=1);

use App\Domain\Fitment\Derivation\SpeedSymbolDeriver;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Order;
use App\Models\TyreVariant;
use App\Services\Storefront\Basket;
use App\Support\CatalogueVersion;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Testing\TestResponse;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The client's answer of 21.11.2026: „yes keep the logic for load and speed index minimums when showing tire options. Otherwise
 * we would recommend tires that are illegal to drive.“ With every entry check gone (D-479, D-481), the paper's printed minimum —
 * what the admin typed beside a size — is the one guard left. Proven over HTTP on every way a tyre reaches an order: the offer
 * of the Komplettrad step, a direct address naming a tyre, the basket's add, and the basket and the Kasse after the fact.
 */

beforeEach(function (): void {
    config(['rimify.komplettrad.mounting_per_wheel_cents' => 2_500]);
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
});

/** The fixture's size with the paper's printed figures beside it, as step 4 stores them. */
function printedMinimum(KomplettradFixture $set, int $li, string $si): void
{
    $fitments = Fitment::query()->where('vehicle_id', $set->vehicle->id)->where('wheel_config_id', $set->config->id)->pluck('id');
    $rows = FitmentTyreSize::query()->whereIn('fitment_id', $fitments)
        ->where('width_mm', $set->size->widthMm)->where('aspect', $set->size->aspect)->where('diameter_in', $set->size->diameterIn);

    expect($rows->count())->toBeGreaterThan(0);
    $rows->update(['min_load_index' => $li, 'min_speed_symbol' => $si]);
    CatalogueVersion::changed();
}

/** A tyre of the fixture's size with this index and symbol, ranked by the shop's own table (an unranked symbol has 0, D-484). */
function tyreAt(KomplettradFixture $set, int $li, string $si, array $more = []): TyreVariant
{
    $rank = app(SpeedSymbolDeriver::class)->rankOf($si) ?? 0;

    return $set->tyre(['load_index' => $li, 'speed_symbol' => $si, 'speed_rank' => $rank, ...$more]);
}

/** The tyre ids the Komplettrad step offers for the size on screen, four alike. @return list<int> */
function offered(object $test, KomplettradFixture $set, string $query = ''): array
{
    $props = $test->withCookies($set->cookies())->get('/komplettraeder?groesse='.$set->config->id.$query)->assertOk()->viewData('page')['props'];

    return collect($props['config']['komplettrad']['tyres'] ?? [])->map(static fn (array $tyre): int => (int) $tyre['id'])->values()->all();
}

/** The basket's answer to adding this tyre to the size, as the page sends it. */
function addSet(object $test, KomplettradFixture $set, TyreVariant $tyre): TestResponse
{
    return $test->withCookies($set->cookies())->from('/komplettraeder?groesse='.$set->config->id)
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'tyreVariantId' => $tyre->id, 'rdks' => 'nein', 'quantity' => 4]);
}

it('offers and sells only tyres that reach the paper\'s printed index and symbol', function (int $li, string $si, bool $legal, array $more = []): void {
    $set = KomplettradFixture::permitted();
    printedMinimum($set, 94, 'W');
    $variant = tyreAt($set, $li, $si, $more);

    expect(in_array($variant->id, offered($this, $set), true))->toBe($legal);

    // A direct address naming the tyre offers nothing more than the page does.
    expect(in_array($variant->id, offered($this, $set, '&reifen='.$variant->id), true))->toBe($legal);

    $response = addSet($this, $set, $variant);

    if ($legal) {
        $response->assertSessionHasNoErrors();
    } else {
        $response->assertSessionHasErrors();
        expect($this->withCookies($set->cookies())->get('/warenkorb')->viewData('page')['props']['lines'] ?? [])->toBe([]);
    }
})->with([
    'exactly the minimum, 94W' => [94, 'W', true],
    'above it, 98Y' => [98, 'Y', true],
    'XL, 98W' => [98, 'W', true, ['name' => 'Sport XL']],
    'the bracket form above, 94(W)' => [94, '(W)', true],
    'the bracket form, 94(Y)' => [94, '(Y)', true],
    'one index too low, 93W' => [93, 'W', false],
    'one symbol too low, 94V' => [94, 'V', false],
    'both too low, 91H' => [91, 'H', false],
    'a symbol the shop cannot rank, 94Z' => [94, 'Z', false],
]);

it('refuses a tyre of another size whatever its figures — the size the paper prints, exactly', function (): void {
    $set = KomplettradFixture::permitted();
    printedMinimum($set, 94, 'W');
    $other = TyreVariant::factory()->size($set->size->widthMm + 10, $set->size->aspect, $set->size->diameterIn)->withSpeedSymbol('(Y)')
        ->create(['load_index' => 120, 'stock_qty' => 8, 'price_cents' => 15_000, 'currency' => 'EUR', 'is_demo' => false]);

    expect(in_array($other->id, offered($this, $set), true))->toBeFalse();
    addSet($this, $set, $other)->assertSessionHasErrors();
});

it('matches a symbol the shop cannot rank exactly, never above or below it — fail closed', function (): void {
    $set = KomplettradFixture::permitted();
    printedMinimum($set, 94, 'F');
    $same = tyreAt($set, 94, 'F');
    $faster = tyreAt($set, 94, 'Y');

    $offer = offered($this, $set);

    expect(in_array($same->id, $offer, true))->toBeTrue()
        ->and(in_array($faster->id, $offer, true))->toBeFalse();
    addSet($this, $set, $faster)->assertSessionHasErrors();
});

it('reads a dual index by its first figure, the one for a single tyre', function (): void {
    $set = KomplettradFixture::permitted();
    // „99/97 T“ printed: the engine holds 99, the single wheel's.
    printedMinimum($set, 99, 'T');
    $ok = tyreAt($set, 99, 'T');
    $second = tyreAt($set, 97, 'T');

    $offer = offered($this, $set);

    expect(in_array($ok->id, $offer, true))->toBeTrue()
        ->and(in_array($second->id, $offer, true))->toBeFalse();
});

it('takes a tyre out of the basket and the Kasse once the paper\'s minimum rises above it', function (): void {
    $set = KomplettradFixture::permitted();
    $tyre = tyreAt($set, 94, 'W');
    addSet($this, $set, $tyre)->assertSessionHasNoErrors();

    // The paper's figure corrected upwards after the add: the line in the basket no longer sells.
    printedMinimum($set, 96, 'W');
    $basket = $this->withCookies($set->cookies())->get('/warenkorb')->assertOk()->viewData('page')['props'];
    $line = collect($basket['lines'] ?? [])->first();

    expect($line)->not->toBeNull()
        ->and($line['blockReasons'])->toContain('Dieser Reifen erfüllt die Mindestwerte für dein Fahrzeug nicht.');

    // The Kasse takes no order for it, and writes nothing.
    config(['rimify.shipping.cost_cents' => 990]);
    $orders = Order::query()->count();
    $this->withCookies($set->cookies())->from('/kasse')->post('/kasse', [
        'email' => 'kunde@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12',
        'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'nein',
    ])->assertRedirect()->assertSessionHasErrors(['order' => Basket::BLOCKED_REFUSAL]);

    expect(Order::query()->count())->toBe($orders);
});

it('offers every tyre of exactly that size where the paper prints no figure — and still none of another size', function (): void {
    $set = KomplettradFixture::permitted();
    $fitments = Fitment::query()->where('vehicle_id', $set->vehicle->id)->where('wheel_config_id', $set->config->id)->pluck('id');
    FitmentTyreSize::query()->whereIn('fitment_id', $fitments)->update(['min_load_index' => null, 'min_speed_symbol' => null]);
    CatalogueVersion::changed();
    $weak = tyreAt($set, 70, 'Q');
    $other = TyreVariant::factory()->size($set->size->widthMm + 10, $set->size->aspect, $set->size->diameterIn)->withSpeedSymbol('(Y)')
        ->create(['load_index' => 120, 'stock_qty' => 8, 'price_cents' => 15_000, 'currency' => 'EUR', 'is_demo' => false]);

    $offer = offered($this, $set);

    expect(in_array($weak->id, $offer, true))->toBeTrue()
        ->and(in_array($other->id, $offer, true))->toBeFalse();
});
