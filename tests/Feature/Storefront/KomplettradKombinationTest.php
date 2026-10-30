<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Domain\Fitment\Verdict\PapersWording;
use App\Http\Controllers\Storefront\WarenkorbController;
use App\Mail\OrderConfirmationMail;
use App\Models\DocumentCondition;
use App\Models\DocumentTyreCombination;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\TyreVariant;
use App\Models\WheelModel;
use App\Services\Admin\Orders\OrderDetail;
use App\Services\Commerce\KomplettradSettings;
use App\Services\Storefront\Basket;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * F-10, end to end (the operator's decision of 24.10.2026 on the client's item 8, D-335): where the Gutachten lists its
 * tyre combinations, the product page offers the Komplettrad as those combinations and never as four of one size; the
 * basket holds a set as 2 + 2, fixed; the order freezes the combination's row and both axles — size, tyre, the answer —
 * on each of its two lines, and the order says each axle's Auflagen under the axle's name.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
    config(['rimify.shipping.cost_cents' => 0, 'rimify.shipping.free_from_cents' => null, 'rimify.payments.driver' => 'sandbox', 'rimify.review.enabled' => true]);
    app(KomplettradSettings::class)->setMountingPerWheelCents(2_500);
});

/**
 * The fixture's permitted car and rim, its row given a wider size the document gives the rear axle alone — with its own
 * Auflage, „keine Schneeketten“ — and the document a list of two combinations: Nr. 1 the fixture's size on both axles,
 * Nr. 2 that size at the front with the wider one at the rear.
 *
 * @return array{0: KomplettradFixture, 1: TyreSize, 2: TyreSize, 3: DocumentTyreCombination, 4: DocumentTyreCombination}
 */
function kombiShopSetup(): array
{
    $fx = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($fx->config->wheel_model_id)->update(['is_demo' => false]);
    $fx->config->forceFill(['stock_qty' => 40])->save();

    $front = $fx->size;
    $rear = new TyreSize($front->widthMm + 30, $front->aspect - 5, $front->diameterIn);

    DocumentCondition::query()->create([
        'approval_document_id' => $fx->document->id,
        'code' => 'K12',
        'kind' => ConditionKind::Hinweis,
        'text_de' => 'Die Verwendung von Schneeketten ist nicht zulässig.',
        'source_page' => 7,
    ]);

    foreach (Fitment::query()->where('vehicle_id', $fx->vehicle->id)->where('wheel_config_id', $fx->config->id)->get() as $row) {
        $size = FitmentTyreSize::query()->create(['fitment_id' => $row->id, 'width_mm' => $rear->widthMm, 'aspect' => $rear->aspect, 'diameter_in' => $rear->diameterIn, 'axle' => 'REAR']);
        DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $size->id, 'code' => 'K12']);
    }

    $combination = static fn (int $number, TyreSize $f, TyreSize $r): DocumentTyreCombination => DocumentTyreCombination::query()->create([
        'approval_document_id' => $fx->document->id, 'number' => $number,
        'front_width_mm' => $f->widthMm, 'front_aspect' => $f->aspect, 'front_diameter_in' => $f->diameterIn,
        'rear_width_mm' => $r->widthMm, 'rear_aspect' => $r->aspect, 'rear_diameter_in' => $r->diameterIn,
        'source_page' => 5,
    ]);

    return [$fx, $front, $rear, $combination(1, $front, $front), $combination(2, $front, $rear)];
}

/** @param  array<string, mixed>  $attributes */
function kombiShopTyre(TyreSize $size, array $attributes = []): TyreVariant
{
    return TyreVariant::factory()->size($size->widthMm, $size->aspect, $size->diameterIn)->withSpeedSymbol('(Y)')->create([
        'name' => 'Sport Contact', 'season' => 'sommer', 'load_index' => 120, 'stock_qty' => 8,
        'price_cents' => 15_000, 'currency' => 'EUR', 'is_demo' => false, ...$attributes,
    ]);
}

/** @return array<string, mixed> the product page's row for the fixture's size */
function kombiShopRow(KomplettradFixture $fx): array
{
    $page = test()->withCookies($fx->cookies())->get('/felgen/'.$fx->config->wheelModel?->slug)->assertOk()->viewData('page');

    return collect($page['props']['configs'])->firstWhere('id', $fx->config->id);
}

it('offers the Komplettrad as the Gutachten\'s combinations, holds a set as 2 + 2 and freezes both axles with the combination @admin-208', function (): void {
    [$fx, $front, $rear, $nr1, $nr2] = kombiShopSetup();
    $frontTyre = kombiShopTyre($front);
    $rearTyre = kombiShopTyre($rear, ['brand_id' => $frontTyre->brand_id, 'price_cents' => 18_000]);

    // The product page: no four of one size, the two combinations in their numbering — each axle's Auflagen by name.
    $row = kombiShopRow($fx);
    $offer = $row['komplettrad'];
    $combinations = collect($offer['combinations']);

    expect($offer['refusal'])->toBeNull()
        ->and($offer['tyres'])->toBe([])
        ->and($offer['perAxle'])->toBe(2)
        ->and($offer['sourcePage'])->toBe(5)
        ->and($row['mischbereifung'])->toBeNull()
        ->and($combinations->pluck('number')->all())->toBe([1, 2])
        ->and($combinations[0]['sameSize'])->toBeTrue()
        ->and(collect($combinations[0]['sets'])->map(static fn (array $s): array => [$s['frontTyreId'], $s['rearTyreId']])->all())->toBe([[$frontTyre->id, $frontTyre->id]])
        ->and(collect($combinations[1]['sets'])->map(static fn (array $s): array => [$s['frontTyreId'], $s['rearTyreId']])->all())->toBe([[$frontTyre->id, $rearTyre->id]])
        // One size on both axles is one group for both, holding every Auflage of it — never „Für beide Achsen“ above it.
        ->and($combinations[0]['answer']['combination'])->toBe([])
        ->and(collect($combinations[0]['answer']['sizes'])->pluck('axle')->all())->toBe(['Vorder- und Hinterachse'])
        ->and($combinations[1]['answer']['perAxle'])->toBeTrue()
        ->and(collect($combinations[1]['answer']['sizes'])->map(static fn (array $a): array => [$a['axle'], $a['size'], $a['conditions']])->all())->toBe([
            ['Vorderachse', $front->labelDe(), []],
            ['Hinterachse', $rear->labelDe(), ['Die Verwendung von Schneeketten ist nicht zulässig.']],
        ]);

    // The basket: two of each whatever was posted — and added again, still the one set.
    $add = fn () => $this->withCookies($fx->cookies())->from('/felgen')->post('/warenkorb', [
        'kind' => 'WHEEL', 'wheelConfigId' => $fx->config->id, 'tyreVariantId' => $frontTyre->id,
        'rearTyreVariantId' => $rearTyre->id, 'quantity' => 4,
    ]);

    // A combination of the Gutachten is the Komplettrad itself: never called „Mischbereifung“, whatever its sizes. Added
    // again, it says it is there already — never „hinzugefügt“ over nothing added.
    $add()->assertSessionHasNoErrors()->assertSessionHas('toast', 'Komplettrad zum Warenkorb hinzugefügt.');
    $add()->assertSessionHasNoErrors()->assertSessionHas('toast', WarenkorbController::SET_HELD_TOAST)
        ->assertSessionHas('added.heading', WarenkorbController::SET_HELD_TOAST);

    $key = 'wheel:'.$fx->config->id.':tyre:'.$frontTyre->id.':rear:'.$rearTyre->id;

    expect(session(Basket::SESSION_KEY)[$key]['quantity'])->toBe(2);

    // No stepper: an amount posted to the set leaves it 2 + 2.
    $this->withCookies($fx->cookies())->from('/warenkorb')->patch('/warenkorb/'.$key.':axle:FRONT', ['quantity' => 3]);

    expect(session(Basket::SESSION_KEY)[$key]['quantity'])->toBe(2);

    $this->withCookies($fx->cookies())->get('/warenkorb')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 2)
            ->where('lines.0.quantity', 2)
            ->where('lines.0.mixed.fixed', true)
            ->where('lines.0.mixed.listed', true)
            ->where('lines.0.mixed.combinationId', $nr2->id)
            ->where('lines.0.mixed.pairing', 2)
            ->where('lines.0.verdict.conditionGroups.axle', 'Vorderachse')
            ->where('lines.1.verdict.conditionGroups.axle', 'Hinterachse')
            ->where('lines.1.verdict.conditionGroups.combination', fn ($sentences): bool => collect($sentences)->contains('Die Verwendung von Schneeketten ist nicht zulässig.'))
            ->where('lines.0.verdict.conditionGroups.combination', fn ($sentences): bool => ! collect($sentences)->contains('Die Verwendung von Schneeketten ist nicht zulässig.'))
            ->where('totals.count', 4));

    // The order: two lines in one package, each freezing the combination's row and both axles.
    $this->withCookies($fx->cookies())->from('/kasse')->post('/kasse', [
        'email' => 'kombi@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
        'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'nein',
    ])->assertSessionHasNoErrors();

    $order = Order::query()->latest('id')->firstOrFail();
    $lines = OrderLine::query()->where('order_id', $order->id)->orderBy('id')->get();
    $frozen = OrderLineFitment::query()->whereIn('order_line_id', $lines->pluck('id'))->orderBy('order_line_id')->get()
        ->map(static fn (OrderLineFitment $f): array => $f->verdict['combination'] ?? []);

    expect($lines->pluck('axle')->all())->toBe(['FRONT', 'REAR'])
        ->and($lines->pluck('quantity')->all())->toBe([2, 2])
        ->and($lines[0]->package_group)->toBe($lines[1]->package_group)
        // Both lines frozen with the combination: the loop below checks two records, never none (TEST-SMELLS §2).
        ->and($frozen->filter(static fn (array $c): bool => $c !== [])->count())->toBe(2);

    foreach ($frozen as $combination) {
        expect($combination)->toMatchArray(['id' => $nr2->id, 'number' => 2, 'sourcePage' => 5])
            ->and($combination['status'])->toBeIn(['PERMITTED', 'CONDITIONAL'])
            ->and($combination['front'])->toMatchArray(['axle' => 'FRONT', 'size' => $front->labelDe()])
            ->and($combination['front']['tyre']['id'])->toBe($frontTyre->id)
            // Each axle with every Auflage that holds on it — the row's, and its size's own: the chains at the rear alone.
            ->and($combination['front']['conditions'])->not->toContain('Die Verwendung von Schneeketten ist nicht zulässig.')
            ->and($combination['rear'])->toMatchArray(['axle' => 'REAR', 'size' => $rear->labelDe()])
            ->and($combination['rear']['conditions'])->toContain('Die Verwendung von Schneeketten ist nicht zulässig.')
            ->and(array_diff($combination['front']['conditions'], $combination['rear']['conditions']))->toBe([])
            ->and($combination['rear']['tyre']['id'])->toBe($rearTyre->id)
            ->and($combination['rear']['minLoadIndex'])->toBeInt();
    }

    // The admin's order: what went on which axle, and each axle's Auflagen under its name — never the rear's at the front.
    $detail = collect(app(OrderDetail::class)->for($order)['lines']);

    expect($detail->pluck('snapshot.conditionGroups.axle')->all())->toBe(['Vorderachse', 'Hinterachse'])
        ->and($detail[0]['snapshot']['conditionGroups']['combination'])->not->toContain('Die Verwendung von Schneeketten ist nicht zulässig.')
        ->and($detail[1]['snapshot']['conditionGroups']['combination'])->toContain('Die Verwendung von Schneeketten ist nicht zulässig.')
        ->and($detail[0]['snapshot']['combination']['number'])->toBe(2)
        ->and(collect($detail[0]['snapshot']['combination']['axles'])->pluck('axle')->all())->toBe(['Vorderachse', 'Hinterachse']);
});

it('sells the combination with one size on both axles as that combination, one tyre on both — never as four of one size @admin-208', function (): void {
    [$fx, $front] = kombiShopSetup();
    $tyre = kombiShopTyre($front);

    // Four of one size is refused at the basket's gate in so many words (R-11).
    $this->withCookies($fx->cookies())->from('/felgen')->post('/warenkorb', [
        'kind' => 'WHEEL', 'wheelConfigId' => $fx->config->id, 'tyreVariantId' => $tyre->id, 'quantity' => 4,
    ])->assertSessionHasErrors(['tyreVariantId' => KomplettradRefusal::AsCombination->sentenceDe()]);

    $this->withCookies($fx->cookies())->from('/felgen')->post('/warenkorb', [
        'kind' => 'WHEEL', 'wheelConfigId' => $fx->config->id, 'tyreVariantId' => $tyre->id, 'rearTyreVariantId' => $tyre->id, 'quantity' => 2,
    ])->assertSessionHasNoErrors()->assertSessionHas('toast', 'Komplettrad zum Warenkorb hinzugefügt.');

    $this->withCookies($fx->cookies())->get('/warenkorb')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 2)
            ->where('lines.0.mixed.axle', 'FRONT')
            ->where('lines.0.mixed.pairing', 1)
            ->where('lines.0.tyre.id', $tyre->id)
            ->where('lines.1.mixed.axle', 'REAR')
            ->where('lines.1.tyre.id', $tyre->id)
            ->where('lines.1.blockReasons', [])
            ->where('totals.count', 4));

    // The tyres go from both axles at once, said as both: the four rims stay.
    $key = 'wheel:'.$fx->config->id.':tyre:'.$tyre->id.':rear:'.$tyre->id;

    $this->withCookies($fx->cookies())->from('/warenkorb')->delete('/warenkorb/'.$key.':axle:FRONT/reifen')
        ->assertSessionHas('toast', WarenkorbController::SET_TYRES_REMOVED_TOAST);

    expect(session(Basket::SESSION_KEY))->toHaveKey('wheel:'.$fx->config->id)
        ->and(session(Basket::SESSION_KEY)['wheel:'.$fx->config->id]['quantity'])->toBe(4)
        ->and(session(Basket::SESSION_KEY))->not->toHaveKey($key);
});

it('says the set\'s Eintragung on both axles\' lines — basket, order page, mail and admin — where one size needs it @admin-208', function (): void {
    [$fx, $front, $rear] = kombiShopSetup();
    $frontTyre = kombiShopTyre($front);
    $rearTyre = kombiShopTyre($rear, ['brand_id' => $frontTyre->brand_id, 'price_cents' => 18_000]);

    // The wider rear size alone is to be inspected and entered in the papers (as the A01 of the review's Prüfrad).
    DocumentCondition::query()->create([
        'approval_document_id' => $fx->document->id,
        'code' => 'K20',
        'kind' => ConditionKind::Abnahme,
        'text_de' => 'Die Rad-Reifen-Kombination ist von einem amtlich anerkannten Sachverständigen abzunehmen und in die Fahrzeugpapiere einzutragen.',
        'source_page' => 7,
    ]);
    $sizes = FitmentTyreSize::query()->where('width_mm', $rear->widthMm)->where('aspect', $rear->aspect)->pluck('id');

    expect($sizes)->not->toBeEmpty();

    foreach ($sizes as $size) {
        DB::table('fitment_tyre_size_conditions')->insert(['fitment_tyre_size_id' => $size, 'code' => 'K20']);
    }

    // The precondition the set rests on: each size's own answer differs — the front size alone needs none.
    $groups = app(FitmentResolver::class)->resolve($fx->vehicle->id, $fx->config->id)?->conditionGroups();

    expect($groups?->entryFor($front->key(), true))->toBeFalse()
        ->and($groups?->entryFor($rear->key(), false))->toBeTrue()
        // The product page says the set's already (D-335).
        ->and(collect(kombiShopRow($fx)['komplettrad']['combinations'])->firstWhere('number', 2)['answer']['entry'])->toBeTrue();

    $this->withCookies($fx->cookies())->from('/felgen')->post('/warenkorb', [
        'kind' => 'WHEEL', 'wheelConfigId' => $fx->config->id, 'tyreVariantId' => $frontTyre->id, 'rearTyreVariantId' => $rearTyre->id, 'quantity' => 2,
    ])->assertSessionHasNoErrors();

    // The basket: both lines need it — the front's too, the car carries both sizes.
    $basket = $this->withCookies($fx->cookies())->get('/warenkorb')->assertOk()->viewData('page')['props']['lines'];

    expect(collect($basket)->pluck('mixed.axle')->all())->toBe(['FRONT', 'REAR'])
        ->and(collect($basket)->pluck('verdict.conditionGroups.entry')->all())->toBe([true, true]);

    foreach ($basket as $line) {
        expect($line['verdict']['sentence'])->toContain(PapersWording::entryLine(true, $line['verdict']['papersExempt']))
            ->and($line['verdict']['conditions'])->not->toContain('Keine Eintragung erforderlich.');
    }

    $this->withCookies($fx->cookies())->from('/kasse')->post('/kasse', [
        'email' => 'kombi@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
        'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'nein',
    ])->assertSessionHasNoErrors();

    $order = Order::query()->latest('id')->firstOrFail();

    // The order page, the confirmation mail and the admin's order say it on both lines as well.
    $page = $this->withCookies($fx->cookies())->get('/bestellung/'.$order->public_id)->assertOk()->viewData('page')['props']['lines'];
    $mail = (new OrderConfirmationMail($order, null))->content()->with['lines'];
    $detail = app(OrderDetail::class)->for($order)['lines'];

    expect(collect($page)->pluck('verdict.conditionGroups.axle')->all())->toBe(['Vorderachse', 'Hinterachse'])
        ->and(collect($page)->pluck('verdict.conditionGroups.entry')->all())->toBe([true, true])
        ->and(collect($mail)->pluck('axle')->all())->toBe(['Vorderachse', 'Hinterachse'])
        ->and(collect($mail)->pluck('entry')->filter()->count())->toBe(2)
        ->and(collect($detail)->pluck('snapshot.conditionGroups.entry')->all())->toBe([true, true]);
});

it('offers no Komplettrad in a combination the shop has no tyre for on one axle — the rim alone stays, and nothing fills the gap @admin-208', function (): void {
    [$fx, $front, $rear] = kombiShopSetup();
    $frontTyre = kombiShopTyre($front);
    // A size no combination names, on the shelf beside it.
    $other = kombiShopTyre(new TyreSize($front->widthMm + 10, $front->aspect - 5, $front->diameterIn), ['brand_id' => $frontTyre->brand_id]);

    $combinations = collect(kombiShopRow($fx)['komplettrad']['combinations']);

    expect($combinations[1]['sets'])->toBe([])
        ->and($combinations[1]['noSet'])->toBe('Für die Hinterachse ('.$rear->labelDe().') können wir dir gerade keinen passenden Reifen anbieten – ein Komplettrad gibt es in dieser Kombination deshalb nicht. Die Felge allein kannst du bestellen.')
        ->and(count($combinations[0]['sets']))->toBe(1);

    // Never another size in the gap.
    $this->withCookies($fx->cookies())->from('/felgen')->post('/warenkorb', [
        'kind' => 'WHEEL', 'wheelConfigId' => $fx->config->id, 'tyreVariantId' => $frontTyre->id, 'rearTyreVariantId' => $other->id, 'quantity' => 2,
    ])->assertSessionHasErrors(['tyreVariantId' => KomplettradRefusal::MixedPairNotListed->sentenceDe()]);

    // The rim alone stays buyable.
    $this->withCookies($fx->cookies())->from('/felgen')->post('/warenkorb', [
        'kind' => 'WHEEL', 'wheelConfigId' => $fx->config->id, 'quantity' => 4,
    ])->assertSessionHasNoErrors()->assertSessionHas('toast', 'Zum Warenkorb hinzugefügt.');
});
