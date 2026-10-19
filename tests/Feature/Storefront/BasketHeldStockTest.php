<?php

declare(strict_types=1);

use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Models\WheelModel;
use App\Services\Storefront\Basket;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * His admin items 7 and 10 (D-299, D-301): a rim and a tyre are available or not — the shop counts neither, so no add is
 * held against a shelf, the basket's own lines included, and one marked „nicht verfügbar“ is refused at the click. A real
 * tyre without its EU label on record is not offered either (D-303).
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
});

function heldStockSet(int $rims): KomplettradFixture
{
    $set = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($set->config->wheel_model_id)->update(['is_demo' => false]);
    $set->config->forceFill(['stock_qty' => $rims, 'available' => true])->save();

    return $set;
}

it('takes any number of an available rim, and refuses a size marked „nicht verfügbar“ @admin-207', function (): void {
    // A count of twelve, from before (the column is kept and no longer read): a fourth add of four still goes in.
    $set = heldStockSet(12);
    $add = fn () => $this->withCookies($set->cookies())->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'quantity' => 4]);

    foreach (range(1, 4) as $_) {
        $add()->assertSessionHasNoErrors();
    }

    expect(collect(session(Basket::SESSION_KEY, []))->sum('quantity'))->toBe(16);

    $set->config->forceFill(['available' => false])->save();

    $add()->assertSessionHasErrors(['wheelConfigId' => Basket::WHEEL_SOLD_OUT]);
});

it('counts a Komplettrad’s tyres no more than its rims, and refuses one marked „nicht verfügbar“ @admin-210', function (): void {
    $set = heldStockSet(0);
    // A count of six, from before (the column is kept and no longer read): a second set of four still goes in.
    $tyre = $set->tyre(['stock_qty' => 6]);
    $post = fn (array $line) => $this->withCookies($set->cookies())->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, ...$line]);

    $post(['quantity' => 4])->assertSessionHasNoErrors();
    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasNoErrors();
    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasNoErrors();

    $tyre->forceFill(['available' => false])->save();

    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasErrors([
        'tyreVariantId' => KomplettradRefusal::OutOfStock->sentenceDe(),
    ]);
});

it('refuses a real tyre whose EU label is not on record, and marks its line in the basket (D-303) @admin-210', function (): void {
    $set = heldStockSet(0);
    $tyre = $set->tyre();
    $post = fn (array $line) => $this->withCookies($set->cookies())->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, ...$line]);

    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasNoErrors();

    // The label taken away after the add: the line says the tyre is not available, and the basket cannot be ordered.
    $tyre->forceFill(['eprel_id' => null])->save();

    $this->withCookies($set->cookies())->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('lines.0.inStock', false)
        ->where('lines.0.blockReasons', fn ($reasons) => collect($reasons)->contains(KomplettradRefusal::OutOfStock->sentenceDe())));

    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasErrors([
        'tyreVariantId' => KomplettradRefusal::OutOfStock->sentenceDe(),
    ]);
});
