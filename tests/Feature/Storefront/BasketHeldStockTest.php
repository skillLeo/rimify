<?php

declare(strict_types=1);

use App\Models\WheelModel;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * His admin item 7 (D-299): a rim is available or not — the shop counts none, so no add of rims is held against a shelf,
 * and a size marked „nicht verfügbar“ is refused at the click. The tyres still count (PDP-08): a Komplettrad's tyres
 * against their shelf, the basket's own lines included.
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

it('counts a Komplettrad’s tyres against their shelf, never its rims', function (): void {
    $set = heldStockSet(0);
    $tyre = $set->tyre(['stock_qty' => 6]);
    $post = fn (array $line) => $this->withCookies($set->cookies())->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, ...$line]);

    $post(['quantity' => 4])->assertSessionHasNoErrors();
    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasNoErrors();

    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasErrors([
        'tyreVariantId' => sprintf(Basket::TYRE_HELD, GermanFormat::integer(6), GermanFormat::integer(4)),
    ]);
});
