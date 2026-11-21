<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Storefront\PapersBook;
use App\Models\BalanceWeightColour;
use App\Services\Storefront\Basket;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Support\Facades\DB;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * D-289 (the operator's brief of 18.10.2026, §1): the axle loads do not decide whether the wheel is approved — unless the
 * document itself limits by axle load: then nothing sells until they are in. Since D-481 the tyres ask nothing of the car,
 * so the rim is never sold alone for their sake; what stays is the wheel's own wait where its document limits the load.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, AccessSeeder::class, KomplettradOptionsSeeder::class]);
    config([
        // The test payment, off production (TestzahlungTest): the purchase goes through.
        'rimify.review.enabled' => true,
        'rimify.payments.driver' => 'sandbox',
        'rimify.shipping.cost_cents' => 0,
        'rimify.shipping.free_from_cents' => null,
        'rimify.shipping.delivery_time' => '3–5 Werktage',
    ]);
    $this->fx = KomplettradFixture::permitted();
    $this->fx->config->forceFill(['stock_qty' => 20])->save();
    // The car as one typed from a Gutachten: none of the figures of its papers.
    $this->fx->vehicle->forceFill(['axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null, 'needs_review' => true])->save();
});

function rimAloneVerdict(object $test): FitmentVerdict
{
    return app(FitmentResolver::class)->resolve((int) $test->fx->vehicle->id, (int) $test->fx->config->id);
}

/** @return array<string, mixed> the product page's answer for the fixture's size */
function rimAlonePayload(object $test, ?string $papers = null): array
{
    $request = $test->withCookies($test->fx->cookies());

    if ($papers !== null) {
        $request = $request->withUnencryptedCookie(PapersBook::COOKIE, $papers);
    }

    $configs = $request->get('/felgen/'.$test->fx->config->wheelModel->slug)->assertOk()->viewData('page')['props']['configs'];

    return collect($configs)->firstWhere('id', $test->fx->config->id);
}

/** @return array<string, mixed> */
function rimAloneAdd(object $test, bool $withTyre = false): array
{
    return [
        'kind' => 'WHEEL',
        'wheelConfigId' => $test->fx->config->id,
        'quantity' => 4,
        ...($withTyre ? [
            'tyreVariantId' => $test->fx->tyre()->id,
            'weightColourId' => BalanceWeightColour::query()->where('is_default', true)->value('id'),
            'rdks' => 'nein',
        ] : []),
    ];
}

it('sells nothing where the document itself limits the axle load and the car\'s is not known — and the rim once it is', function (): void {
    // BBS: „nur für Fahrzeuge mit maximaler Achslast 1160 kg“, declared at release — and a document that needs the top speed
    // for its tyres (D-284), so T stays owed below once the axle loads are in.
    DB::table('approval_documents')->where('id', $this->fx->document->id)->update(['counted_axle_limit_kg' => 1160, 'counted_axle_limit_page' => 3, 'tyre_index_source' => null]);

    $verdict = rimAloneVerdict($this);

    expect($verdict->sellsAlone)->toBeFalse()
        ->and($verdict->forRimAlone())->toBeNull()
        ->and(rimAlonePayload($this)['verdict']['rimSellable'])->toBeFalse();

    $this->withCookies($this->fx->cookies())->from('/felgen')
        ->post('/warenkorb', rimAloneAdd($this))
        ->assertSessionHasErrors(['wheelConfigId' => Basket::TYRES_AWAIT_PAPERS]);

    // A rim line already in the basket says the same, in the add's words — never „kein Gutachten“ over a wheel its
    // Gutachten approves (R-17, the interaction review).
    $line = ['kind' => 'WHEEL', 'wheelConfigId' => $this->fx->config->id, 'tyreVariantId' => null, 'quantity' => 4];
    $basket = $this->withCookies($this->fx->cookies())->withSession([Basket::SESSION_KEY => ['wheel:'.$this->fx->config->id => $line]])
        ->get('/warenkorb')->viewData('page')['props']['lines'][0];

    expect($basket['verdict']['sellable'])->toBeFalse()
        ->and($basket['blockReasons'])->toBe([Basket::TYRES_AWAIT_PAPERS]);

    // The axle loads given: the wheel's approval no longer waits, and since D-481 nothing of the car is asked for the tyres —
    // the whole answer sells, the rim and the Komplettrad alike.
    $axles = rimAlonePayload($this, "{$this->fx->vehicle->id}.800.800.-")['verdict'];

    expect($axles['tyre']['owed'] ?? [])->toBe([])
        ->and($axles['sellable'])->toBeTrue();
});
