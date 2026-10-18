<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Verdict\FitmentVerdict;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\PapersBook;
use App\Models\BalanceWeightColour;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Services\Storefront\Basket;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Support\Facades\DB;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * D-289 (the operator's brief of 18.10.2026, §1): the axle loads decide the tyres' load index, not whether the wheel is
 * approved — unless the document itself limits by axle load. A car without the figures of its papers: the rim alone
 * sells, with its own answer — never PERMITTED while the tyres are open (R-03) — and the sizes it may only be fitted
 * with; the Komplettrad waits for the papers. Where the document limits the axle load, nothing sells until they are in.
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

it('sells the rim alone while the tyres wait for the papers, with its own answer and the sizes it may only be fitted with', function (): void {
    $verdict = rimAloneVerdict($this);
    $rim = $verdict->forRimAlone();
    $only = collect($rim->conditions ?? [])->firstWhere('code', FitmentVerdict::RIM_ALONE);

    // The answer itself stays what it is: the tyres unconfirmed, nothing sold on them.
    expect($verdict->status)->toBe(VerdictStatus::Unknown)
        ->and($verdict->isSellable())->toBeFalse()
        ->and($verdict->sellsAlone)->toBeTrue()
        // The rim's own: never PERMITTED while the tyres are open (R-03), the tyres' half kept as it is.
        ->and($rim?->status)->toBe(VerdictStatus::Conditional)
        ->and($rim?->isSellable())->toBeTrue()
        ->and($rim?->tyre?->status)->toBe(VerdictStatus::Unknown)
        ->and($rim?->tyre?->papersOwed)->toBe(['8.1', '8.2', 'T'])
        ->and($only?->sentenceDe())->toStartWith('Die Felge ist für dein Fahrzeug nur ')
        ->and($only?->sentenceDe())->toContain($this->fx->size->labelDe())
        // Said in the past: frozen onto the order, it reports the check and stays true there.
        ->and($only?->sentenceDe())->toEndWith('konnten wir nicht bestätigen: Bei der Prüfung fehlten uns die Felder 8.1, 8.2 und T deiner Zulassungsbescheinigung Teil I.');

    $config = rimAlonePayload($this);

    expect($config['verdict']['rimSellable'])->toBeTrue()
        ->and($config['verdict']['sellable'])->toBeFalse()
        ->and($config['komplettrad']['refusalCode'])->toBe('TYRES_AWAIT_PAPERS');

    // A Komplettrad is still refused, the papers named as the way on; the rim alone goes into the basket.
    $this->withCookies($this->fx->cookies())->from('/felgen')
        ->post('/warenkorb', rimAloneAdd($this, withTyre: true))
        ->assertSessionHasErrors(['tyreVariantId' => Basket::TYRES_AWAIT_PAPERS]);

    $this->withCookies($this->fx->cookies())->from('/felgen')
        ->post('/warenkorb', rimAloneAdd($this))
        ->assertSessionHasNoErrors();

    expect(session(Basket::SESSION_KEY))->toHaveCount(1);
});

it('freezes the rim\'s own answer onto the order, and says in the basket what it was sold with', function (): void {
    $line = ['kind' => 'WHEEL', 'wheelConfigId' => $this->fx->config->id, 'tyreVariantId' => null, 'quantity' => 4];
    $basket = $this->withCookies($this->fx->cookies())->withSession([Basket::SESSION_KEY => ['wheel:'.$this->fx->config->id => $line]])
        ->get('/warenkorb')->assertOk()->viewData('page')['props']['lines'][0]['verdict'];

    expect($basket['sellable'])->toBeTrue()
        ->and($basket['status'])->toBe('CONDITIONAL')
        ->and(collect($basket['conditions'])->contains(static fn (string $c): bool => str_starts_with($c, 'Die Felge ist für dein Fahrzeug nur ')))->toBeTrue();

    $this->withCookies($this->fx->cookies())->withSession([Basket::SESSION_KEY => ['wheel:'.$this->fx->config->id => $line]])
        ->from('/kasse')
        ->post('/kasse', ['email' => 'test@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße', 'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard'])
        ->assertSessionHasNoErrors();

    $order = Order::query()->latest('id')->firstOrFail();
    $snapshot = OrderLineFitment::query()->whereIn('order_line_id', OrderLine::query()->where('order_id', $order->id)->pluck('id'))->sole();

    expect($snapshot->verdict_status)->toBe('CONDITIONAL')
        ->and($snapshot->verdict['rimAlone'] ?? null)->toBeTrue()
        ->and($snapshot->verdict['tyreCheck']['status'] ?? null)->toBe('UNKNOWN')
        ->and(collect($snapshot->verdict['conditions'])->pluck('code'))->toContain(FitmentVerdict::RIM_ALONE)
        ->and(FitmentVerdict::fromArray($snapshot->verdict)->rimAlone)->toBeTrue();
});

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

    // The axle loads given, the top speed still owed: the wheel's approval no longer waits — T decides the tyres alone.
    $axles = rimAlonePayload($this, "{$this->fx->vehicle->id}.800.800.-")['verdict'];

    expect($axles['tyre']['owed'] ?? [])->toBe(['T'])
        ->and($axles['rimSellable'])->toBeTrue();
});
