<?php

declare(strict_types=1);

use App\Domain\Fitment\Data\TyreSize;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Tyres\KomplettradRefusal;
use App\Domain\Fitment\Verdict\ConditionKind;
use App\Models\BalanceWeightColour;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\TyreVariant;
use App\Models\WheelModel;
use App\Services\Commerce\KomplettradSettings;
use App\Services\Storefront\Basket;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * #20 Mischbereifung, end to end (D-105): the product page offers only the pairs the released Gutachten's table lists
 * for the car, the basket re-asks the engine on every add (R-11) and holds the set as two axle lines, and the order
 * freezes each axle on its own line — its size, the size it was paired with, the table entry and what the axle asked.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
    config(['rimify.shipping.cost_cents' => 0, 'rimify.shipping.free_from_cents' => null, 'rimify.payments.driver' => 'sandbox', 'rimify.review.enabled' => true]);
    app(KomplettradSettings::class)->setMountingPerWheelCents(2_500);
});

/**
 * The fixture's permitted car and rim, its row given a second size and the document a pairing table in V19's words:
 * the fixture's size at the front with the wider one at the rear — and a third size the row lists that the table does
 * not pair, the plausible pair no one may buy.
 *
 * @return array{0: KomplettradFixture, 1: TyreSize, 2: TyreSize, 3: TyreSize}
 */
function mixedSetup(): array
{
    $fx = KomplettradFixture::permitted();
    WheelModel::query()->whereKey($fx->config->wheel_model_id)->update(['is_demo' => false]);
    $fx->config->forceFill(['stock_qty' => 40])->save();

    $front = $fx->size;
    $rear = new TyreSize($front->widthMm + 30, $front->aspect - 5, $front->diameterIn);
    $unlisted = new TyreSize($front->widthMm + 10, $front->aspect - 5, $front->diameterIn);
    $r = static fn (TyreSize $s): string => $s->widthMm.'/'.$s->aspect.'R'.(int) $s->diameterIn;

    DocumentCondition::query()->create([
        'approval_document_id' => $fx->document->id,
        'code' => 'V19',
        'kind' => ConditionKind::ReifenKombination,
        'text_de' => 'Bei Verwendung verschiedener Reifengrößen an Vorder- und Hinterachse sind folgende Reifenkombinationen, sofern die Reifengrößen in der Spalte "Reifen" aufgeführt sind, möglich: (Vorderachse – Hinterachse) '
            ."Nr. 1: {$r($front)} – {$r($rear)}; Nr. 2: 315/25R23 – 335/25R23. "
            .'Es sind nur Reifen eines Herstellers und achsweise eines Profiltyps zulässig, für die der Reifen- oder Fahrzeughersteller die Eignung für das jeweilige Fahrzeug bestätigt. Diese Bestätigung ist vom Führer des Fahrzeugs mitzuführen.',
        'source_page' => 12,
    ]);

    $rows = Fitment::query()->where('vehicle_id', $fx->vehicle->id)->where('wheel_config_id', $fx->config->id)->get();

    foreach ($rows as $row) {
        DB::table('fitment_conditions')->insert(['fitment_id' => $row->id, 'code' => 'V19', 'note_de' => null]);

        foreach ([$rear, $unlisted] as $size) {
            FitmentTyreSize::query()->create(['fitment_id' => $row->id, 'width_mm' => $size->widthMm, 'aspect' => $size->aspect, 'diameter_in' => $size->diameterIn, 'axle' => 'ALL']);
        }
    }

    return [$fx, $front, $rear, $unlisted];
}

/** @param  array<string, mixed>  $attributes */
function mixedTyreOf(TyreSize $size, array $attributes = []): TyreVariant
{
    return TyreVariant::factory()->size($size->widthMm, $size->aspect, $size->diameterIn)->withSpeedSymbol('(Y)')->create([
        'name' => 'Sport Contact', 'season' => 'sommer', 'load_index' => 120, 'stock_qty' => 8,
        'price_cents' => 15_000, 'currency' => 'EUR', 'is_demo' => false, ...$attributes,
    ]);
}

it('offers the listed pair on the product page, sells it as two axle lines and freezes each axle on its own order line @kunde-20', function (): void {
    [$fx, $front, $rear, $unlisted] = mixedSetup();
    $frontTyre = mixedTyreOf($front);
    $rearTyre = mixedTyreOf($rear, ['brand_id' => $frontTyre->brand_id, 'price_cents' => 18_000]);
    $colour = BalanceWeightColour::default();
    $verdict = app(FitmentResolver::class)->resolve((int) $fx->vehicle->id, (int) $fx->config->id);

    expect($verdict->tyre?->figuresPermitted)->toBeTrue();

    // The product page: one pair — the table's, front first — with the set that is one maker's one line.
    $page = $this->withCookies($fx->cookies())->get('/felgen/'.$fx->config->wheelModel?->slug)->assertOk()->viewData('page');
    $ours = collect($page['props']['configs'])->firstWhere('id', $fx->config->id);
    $mixed = $ours['mischbereifung'];

    expect($mixed['refusal'])->toBeNull()
        ->and($mixed['sourcePage'])->toBe(12)
        ->and($mixed['rules'])->toStartWith('Es sind nur Reifen eines Herstellers')
        ->and($mixed['pairs'])->toHaveCount(1)
        ->and($mixed['pairs'][0]['front'])->toBe($front->labelDe())
        ->and($mixed['pairs'][0]['rear'])->toBe($rear->labelDe())
        ->and($mixed['pairs'][0]['minSentence'])->toStartWith('Bei Mischbereifung prüfen wir jede Achse mit ihrer eigenen Achslast')
        ->and($mixed['pairs'][0]['sets'])->toHaveCount(1)
        ->and($mixed['pairs'][0]['sets'][0]['frontTyreId'])->toBe($frontTyre->id)
        ->and($mixed['pairs'][0]['sets'][0]['rearTyreId'])->toBe($rearTyre->id);

    // Priced in every active Wuchtgewichte colour, so the card shows what the basket charges for the colour picked (PDP-07).
    $prices = collect($mixed['pairs'][0]['sets'][0]['prices']);

    expect($prices->pluck('colourId')->sort()->values()->all())->toBe(BalanceWeightColour::query()->active()->orderBy('id')->pluck('id')->all())
        ->and($prices->firstWhere('colourId', $colour?->id)['forFour'])->toBe($mixed['pairs'][0]['sets'][0]['forFour']);

    // The basket: two of each, as one entry rendered as the front axle's line and the rear's.
    $this->withCookies($fx->cookies())->from('/felgen')->post('/warenkorb', [
        'kind' => 'WHEEL', 'wheelConfigId' => $fx->config->id, 'tyreVariantId' => $frontTyre->id,
        'rearTyreVariantId' => $rearTyre->id, 'quantity' => 2,
    ])->assertSessionHasNoErrors()->assertSessionHas('toast', 'Mischbereifung zum Warenkorb hinzugefügt.');

    $this->withCookies($fx->cookies())->get('/warenkorb')->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('lines', 2)
            ->where('lines.0.mixed.axle', 'FRONT')
            ->where('lines.0.quantity', 2)
            ->where('lines.0.tyre.id', $frontTyre->id)
            ->where('lines.0.mixed.partnerSize', $rear->labelDe())
            ->where('lines.0.mixed.pairing', 1)
            ->where('lines.0.verdict.notesOnly', false)
            ->where('lines.1.mixed.axle', 'REAR')
            ->where('lines.1.tyre.id', $rearTyre->id)
            ->where('lines.1.blockReasons', [])
            ->where('totals.count', 4)
            ->where('totals.tpms.quantity', 4));

    // The order: two lines in one package group, each axle frozen on its own.
    $this->withCookies($fx->cookies())->from('/kasse')->post('/kasse', [
        'email' => 'misch@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
        'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard', 'rdks' => 'nein',
    ])->assertSessionHasNoErrors();

    $order = Order::query()->latest('id')->firstOrFail();
    $lines = OrderLine::query()->where('order_id', $order->id)->orderBy('id')->get();

    expect($lines)->toHaveCount(2)
        ->and($lines->pluck('axle')->all())->toBe(['FRONT', 'REAR'])
        ->and($lines->pluck('quantity')->all())->toBe([2, 2])
        ->and($lines[0]->package_group)->toBe($lines[1]->package_group)
        ->and($lines[0]->label)->toStartWith('Komplettrad Vorderachse: ')
        ->and($lines[1]->label)->toStartWith('Komplettrad Hinterachse: ');

    $frozen = OrderLineFitment::query()->whereIn('order_line_id', $lines->pluck('id'))->orderBy('order_line_id')->get()
        ->map(static fn (OrderLineFitment $f): array => $f->verdict['mixedTyres'] ?? []);

    expect($frozen[0])->toMatchArray(['axle' => 'FRONT', 'size' => $front->labelDe(), 'partnerSize' => $rear->labelDe(), 'pairing' => 1, 'sourcePage' => 12])
        ->and($frozen[1])->toMatchArray(['axle' => 'REAR', 'size' => $rear->labelDe(), 'partnerSize' => $front->labelDe(), 'pairing' => 1])
        ->and($frozen[0]['minLoadIndex'])->toBeInt()
        ->and($frozen[1]['axleLoadKg'])->toBe($fx->vehicle->axle_load_rear_kg);
});

it('refuses at the basket a plausible pair the table does not list, and the listed pair the wrong way round — R-11 @kunde-20', function (): void {
    [$fx, $front, $rear, $unlisted] = mixedSetup();
    $frontTyre = mixedTyreOf($front);
    $rearTyre = mixedTyreOf($rear, ['brand_id' => $frontTyre->brand_id]);
    $other = mixedTyreOf($unlisted, ['brand_id' => $frontTyre->brand_id]);
    $post = fn (int $a, int $b) => $this->withCookies($fx->cookies())->from('/felgen')->post('/warenkorb', [
        'kind' => 'WHEEL', 'wheelConfigId' => $fx->config->id, 'tyreVariantId' => $a, 'rearTyreVariantId' => $b, 'quantity' => 2,
    ]);

    $post($frontTyre->id, $other->id)->assertSessionHasErrors(['tyreVariantId' => KomplettradRefusal::MixedPairNotListed->sentenceDe()]);
    $post($rearTyre->id, $frontTyre->id)->assertSessionHasErrors(['tyreVariantId' => KomplettradRefusal::MixedPairNotListed->sentenceDe()]);

    expect(session(Basket::SESSION_KEY, []))->toBe([]);
});

it('says nothing about Mischbereifung on a product page whose document prints no pairing table @kunde-20', function (): void {
    $fx = KomplettradFixture::permitted();
    $page = $this->withCookies($fx->cookies())->get('/felgen/'.$fx->config->wheelModel?->slug)->assertOk()->viewData('page');

    expect(collect($page['props']['configs'])->firstWhere('id', $fx->config->id)['mischbereifung'])->toBeNull();
});
