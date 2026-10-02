<?php

declare(strict_types=1);

use App\Models\WheelModel;
use App\Services\Storefront\Basket;
use App\Support\GermanFormat;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * PDP-08: the shelf is counted against the basket and the add together. Four rims three times with twelve in stock fit;
 * the fourth add is refused at the click — with the stock and what the basket already holds — not confirmed and then
 * marked unorderable in the basket. A Komplettrad of the same rim counts against the same shelf, and its tyres against
 * theirs.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
});

function heldStockSet(int $rims): KomplettradFixture
{
    $set = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($set->config->wheel_model_id)->update(['is_demo' => false]);
    $set->config->forceFill(['stock_qty' => $rims])->save();

    return $set;
}

it('refuses the add that would take more rims than the shelf holds, counting what the basket already has', function (): void {
    $set = heldStockSet(12);
    $add = fn () => $this->withCookies($set->cookies())->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, 'quantity' => 4]);

    $add()->assertSessionHasNoErrors();
    $add()->assertSessionHasNoErrors();
    $add()->assertSessionHasNoErrors();

    $add()->assertSessionHasErrors([
        'wheelConfigId' => sprintf(Basket::WHEEL_HELD, GermanFormat::integer(12), GermanFormat::integer(12)),
    ]);

    expect(collect(session(Basket::SESSION_KEY, []))->sum('quantity'))->toBe(12);
});

it('counts a Komplettrad of the same rim against the same shelf, and its tyres against theirs', function (): void {
    $set = heldStockSet(6);
    $tyre = $set->tyre(['stock_qty' => 6]);
    $post = fn (array $line) => $this->withCookies($set->cookies())->from('/felgen')
        ->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $set->config->id, ...$line]);

    $post(['quantity' => 4])->assertSessionHasNoErrors();

    // Four rims held, six on the shelf: a set of four more does not fit (said under the tyre, as every set's refusal is).
    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasErrors([
        'tyreVariantId' => sprintf(Basket::WHEEL_HELD, GermanFormat::integer(6), GermanFormat::integer(4)),
    ]);

    // The rims made room for: twelve on the shelf, four tyres held of six.
    $set->config->forceFill(['stock_qty' => 12])->save();
    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasNoErrors();

    $post(['tyreVariantId' => $tyre->id, 'quantity' => 4])->assertSessionHasErrors([
        'tyreVariantId' => sprintf(Basket::TYRE_HELD, GermanFormat::integer(6), GermanFormat::integer(4)),
    ]);
});
