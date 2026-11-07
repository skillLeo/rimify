<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Resolver\WheelSets;
use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Enums\TyreIndexSource;
use App\Enums\VehicleSource;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\CheckResult;
use App\Models\DocumentCarEntry;
use App\Models\DocumentCondition;
use App\Models\Fitment;
use App\Models\Order;
use App\Models\OrderLine;
use App\Models\OrderLineFitment;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use App\Services\Commerce\KomplettradSettings;
use App\Services\Storage\StorageSettings;
use App\Services\Storefront\Basket;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Gutachten\ReleaseAnswers;

/*
 * The client's fourth change in the shop (the operator's brief of 07.11.2026, §5): where a paper names two versions of a rim for a
 * car, front and rear, the car gets them as a set, two and two, each at its own price, and never four of a version it may have on
 * one axle only. The engine's verdict for each version stays what it was; the set is the weaker of the two.
 */

beforeEach(function (): void {
    $this->seed([AccessSeeder::class, ReferenceDataSeeder::class, CommerceSeeder::class, KomplettradOptionsSeeder::class]);
    config(['media.s3' => ['key' => null, 'secret' => null, 'region' => 'eu-north-1', 'bucket' => null, 'url' => null, 'endpoint' => null, 'path_style' => false]]);
    config(['rimify.shipping.cost_cents' => 0, 'rimify.shipping.free_from_cents' => null, 'rimify.payments.driver' => 'sandbox', 'rimify.review.enabled' => true]);
    app(StorageSettings::class)->flush();
    app(KomplettradSettings::class)->setMountingPerWheelCents(2_500);
    Storage::fake('docs_private');
    Storage::fake('docs_public');
});

const WS_K = 'e1*2007/46*0356*04';

function wsAdmin(): AdminUser
{
    return AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
}

/**
 * The mockup's wheel, in black and bronze, with a third version in black alone that is on no paper.
 *
 * @return array{model: WheelModel, front: WheelConfig, rear: WheelConfig, frontBronze: WheelConfig, rearBronze: WheelConfig}
 */
function wsWheel(): array
{
    $model = WheelModel::factory()->create(['is_demo' => false, 'status' => CatalogueStatus::Published, 'name' => 'DB8GT2', 'type_designation' => 'DB8']);
    $black = WheelFinish::factory()->create(['wheel_model_id' => $model->id, 'name_de' => 'Schwarz matt']);
    $bronze = WheelFinish::factory()->create(['wheel_model_id' => $model->id, 'name_de' => 'Bronze matt']);
    $version = static fn (WheelFinish $finish, float $diameter, int $cents): WheelConfig => WheelConfig::factory()->create([
        'wheel_model_id' => $model->id, 'wheel_finish_id' => $finish->id, 'diameter_in' => $diameter, 'width_in' => 8.5, 'et_mm' => 35,
        'bolt_holes' => 5, 'bolt_circle_mm' => 120.0, 'centre_bore_mm' => 72.5, 'price_cents' => $cents, 'available' => true,
    ]);

    return [
        'model' => $model,
        'front' => $version($black, 18.0, 22_900),
        'rear' => $version($black, 19.0, 26_900),
        'frontBronze' => $version($bronze, 18.0, 22_900),
        'rearBronze' => $version($bronze, 19.0, 26_900),
    ];
}

function wsUrl(ApprovalDocument $document, string $path = ''): string
{
    return "/admin/gutachten/{$document->id}/erfassung{$path}";
}

/**
 * A released paper for one car: the wheel combinations given as [front, rear], each with its tyre lines.
 *
 * @param  list<array{0: WheelConfig, 1: WheelConfig, 2: list<array{0: string, 1: string}>}>  $combinations
 * @return array{document: ApprovalDocument, car: Vehicle}
 */
function wsPaper(array $combinations, ?Vehicle $car = null): array
{
    $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
    $car ??= Vehicle::factory()->create(['eg_nummer_raw' => WS_K, 'eg_nummer_norm' => WS_K, 'source' => VehicleSource::ManuellGeprueft->value]);

    foreach ($combinations as [$front, $rear]) {
        test()->actingAs(wsAdmin(), 'admin')->postJson(wsUrl($document, '/kombinationen'), ['front_config_id' => $front->id, 'rear_config_id' => $rear->id])->assertOk();
    }

    test()->actingAs(wsAdmin(), 'admin')->postJson(wsUrl($document, '/fahrzeuge'), ['vehicle_ids' => [$car->id]])->assertOk();

    $cells = DocumentCarEntry::query()->where('approval_document_id', $document->id)->orderBy('position')->get()->values();

    foreach ($combinations as $i => [, , $lines]) {
        test()->actingAs(wsAdmin(), 'admin')->putJson(wsUrl($document, "/fahrzeuge/{$cells[$i]->id}"), [
            'lines' => array_map(static fn (array $line): array => ['id' => null, 'front' => $line[0], 'rear' => $line[1], 'kw' => '', 'codes' => $line[2] ?? []], $lines),
            'codes' => [],
            'source_page' => 2,
        ])->assertOk();
    }

    return ['document' => $document, 'car' => $car];
}

function wsRelease(ApprovalDocument $document): void
{
    test()->actingAs(wsAdmin(), 'admin')->post("/admin/gutachten/{$document->id}/freigeben", ReleaseAnswers::for($document))->assertSessionHasNoErrors();
}

/** @return array<string, string> */
function wsCookies(Vehicle $car): array
{
    return [VehicleContext::COOKIE => (new VehicleContext($car->id, true))->encode()];
}

/** @return array{wheel: array<string, mixed>, document: ApprovalDocument, car: Vehicle} */
function wsStaggered(): array
{
    $wheel = wsWheel();
    ['document' => $document, 'car' => $car] = wsPaper([[$wheel['front'], $wheel['rear'], [['225/40R18 92Y', '255/30R19 91Y']]]]);
    wsRelease($document);

    return ['wheel' => $wheel, 'document' => $document, 'car' => $car];
}

describe('the engine read', function (): void {
    it('reads two unchanged verdicts: each version on its axle as the resolver answers it, the set the weaker of the two', function (): void {
        ['wheel' => $wheel, 'car' => $car, 'document' => $document] = wsStaggered();
        $resolver = app(FitmentResolver::class);

        $set = app(WheelSets::class)->find($car->id, $wheel['front']->id, $wheel['rear']->id);

        expect($set)->not->toBeNull()
            ->and($set->key())->toBe($wheel['front']->id.'-'.$wheel['rear']->id)
            ->and($set->front->toArray()['status'])->toBe($resolver->resolve($car->id, $wheel['front']->id)->toArray()['status'])
            ->and($set->rear->toArray()['status'])->toBe($resolver->resolve($car->id, $wheel['rear']->id)->toArray()['status'])
            ->and($set->status())->toBe(VerdictStatus::weaker($set->front->status, $set->rear->status));

        $combined = $set->combined();

        // What a surface always shows of the tyres names both axles, never the one half.
        expect($combined->tyre?->summary)->toContain('Vorderachse')->toContain('Hinterachse');

        $keys = static fn (array $sizes): array => array_map(static fn ($size): string => $size->key(), $sizes);

        // Each axle as its own version's verdict has it: neither half taken from the other.
        expect($keys($combined->front->sizes))->toBe($keys($set->front->front->sizes))
            ->and($keys($combined->rear->sizes))->toBe($keys($set->rear->rear->sizes))
            ->and($keys($set->front->rear->sizes))->toBe([])
            ->and($keys($set->rear->front->sizes))->toBe([]);
    });

    it('says the weaker: an Auflage on the rear version only makes the whole set conditional, the front version\'s own verdict stays as it was', function (): void {
        $wheel = wsWheel();
        $document = ApprovalDocument::factory()->draft()->tyreIndex(TyreIndexSource::Papers)->create();
        DocumentCondition::query()->create(['approval_document_id' => $document->id, 'code' => 'K1', 'kind' => 'karosseriearbeit', 'text_de' => 'Bördeln der Radläufe erforderlich.', 'source_page' => 2]);
        $car = Vehicle::factory()->create(['eg_nummer_raw' => WS_K, 'eg_nummer_norm' => WS_K, 'source' => VehicleSource::ManuellGeprueft->value]);
        test()->actingAs(wsAdmin(), 'admin')->postJson(wsUrl($document, '/kombinationen'), ['front_config_id' => $wheel['front']->id, 'rear_config_id' => $wheel['rear']->id])->assertOk();
        test()->actingAs(wsAdmin(), 'admin')->postJson(wsUrl($document, '/fahrzeuge'), ['vehicle_ids' => [$car->id]])->assertOk();
        $cell = DocumentCarEntry::query()->where('approval_document_id', $document->id)->firstOrFail();
        test()->actingAs(wsAdmin(), 'admin')->putJson(wsUrl($document, "/fahrzeuge/{$cell->id}"), [
            'lines' => [['id' => null, 'front' => '225/40R18 92Y', 'rear' => '255/30R19 91Y', 'kw' => '', 'codes' => ['K1']]], 'codes' => [], 'source_page' => 2,
        ])->assertOk();
        wsRelease($document);

        $set = app(WheelSets::class)->find($car->id, $wheel['front']->id, $wheel['rear']->id);

        expect($set->status())->toBe(VerdictStatus::Conditional)
            ->and($set->combined()->status)->toBe(VerdictStatus::Conditional)
            ->and($set->combined()->requiresEntry)->toBe($set->front->requiresEntry || $set->rear->requiresEntry);
    });

    it('holds no set a customer may not be shown: a withdrawn paper takes it away, and front and rear swapped is another set', function (): void {
        ['wheel' => $wheel, 'car' => $car, 'document' => $document] = wsStaggered();
        $sets = app(WheelSets::class);

        expect($sets->find($car->id, $wheel['rear']->id, $wheel['front']->id))->toBeNull();

        Fitment::query()->where('approval_document_id', $document->id)->update(['status' => 'retired']);

        expect($sets->find($car->id, $wheel['front']->id, $wheel['rear']->id))->toBeNull();
    });
});

describe('the rule of the shop', function (): void {
    it('never sells four of a version the car may have on one axle: front or rear, it is refused in the same words, and nothing is added', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();

        foreach (['front', 'rear'] as $side) {
            $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $wheel[$side]->id, 'quantity' => 4])
                ->assertSessionHasErrors(['wheelConfigId' => Basket::ONLY_IN_SET]);
        }

        expect(session(Basket::SESSION_KEY, []))->toBe([]);
    });

    it('sells such a version as four to nobody, whether or not a set exists for it: a row for one axle alone', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();
        Fitment::query()->where('wheel_config_id', $wheel['rear']->id)->update(['status' => 'retired']);

        $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $wheel['front']->id, 'quantity' => 4])
            ->assertSessionHasErrors(['wheelConfigId' => Basket::ONLY_IN_SET]);
    });

    it('keeps four of a version the same paper names front and rear too, beside a set it also stands in', function (): void {
        $wheel = wsWheel();
        ['document' => $document, 'car' => $car] = wsPaper([
            [$wheel['front'], $wheel['front'], [['225/40R18 92Y', '225/40R18 92Y']]],
            [$wheel['front'], $wheel['rear'], [['225/40R18 92Y', '255/30R19 91Y']]],
        ]);
        wsRelease($document);

        $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $wheel['front']->id, 'quantity' => 4])
            ->assertSessionHasNoErrors();
        $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $wheel['rear']->id, 'quantity' => 4])
            ->assertSessionHasErrors(['wheelConfigId' => Basket::ONLY_IN_SET]);
    });

    it('leaves a car without any set as it was: every version with sizes on both axles sells as four', function (): void {
        $wheel = wsWheel();
        ['document' => $document, 'car' => $car] = wsPaper([[$wheel['front'], $wheel['front'], [['225/40R18 92Y', '225/40R18 92Y']]]]);
        wsRelease($document);

        $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $wheel['front']->id, 'quantity' => 4])
            ->assertSessionHasNoErrors();
    });
});

describe('a set in the basket', function (): void {
    it('goes in as one line per axle, two wheels each, each version at its own price, and the amount cannot be changed', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();

        $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', [
            'kind' => 'WHEEL', 'wheelConfigId' => $wheel['front']->id, 'rearWheelConfigId' => $wheel['rear']->id, 'quantity' => 99,
        ])->assertSessionHasNoErrors();

        $this->withCookies(wsCookies($car))->get('/warenkorb')->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->has('lines', 2)
                ->where('lines.0.wheelConfigId', $wheel['front']->id)
                ->where('lines.0.quantity', 2)
                ->where('lines.0.lineTotalCents', 45_800)
                ->where('lines.0.mixed.axle', 'FRONT')
                ->where('lines.0.mixed.fixed', true)
                ->where('lines.0.setLabel', 'Felge Vorderachse')
                ->where('lines.1.wheelConfigId', $wheel['rear']->id)
                ->where('lines.1.quantity', 2)
                ->where('lines.1.lineTotalCents', 53_800)
                ->where('lines.1.setLabel', 'Felge Hinterachse')
                ->where('lines.1.blockReasons', [])
                ->where('totals.count', 4)
                ->where('cartCount', 4)
                ->where('totals.subtotalCents', 99_600));

        $key = app(Basket::class)->key($wheel['front']->id, null, null, $wheel['rear']->id);

        $this->withCookies(wsCookies($car))->patch('/warenkorb/'.$key.':axle:FRONT', ['quantity' => 8]);

        $this->withCookies(wsCookies($car))->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page->where('lines.0.quantity', 2)->where('lines.1.quantity', 2));
    });

    it('refuses two versions no paper names together: the wrong way round, another car, no car at all', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();
        $other = Vehicle::factory()->create();
        $post = fn (array $cookies, int $front, int $rear) => $this->withCookies($cookies)->from('/felgen')->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $front, 'rearWheelConfigId' => $rear, 'quantity' => 2]);

        // First: the test client keeps a cookie once it has one.
        $post([], $wheel['front']->id, $wheel['rear']->id)->assertSessionHasErrors(['wheelConfigId' => Basket::SET_NEEDS_CAR]);
        $post(wsCookies($car), $wheel['rear']->id, $wheel['front']->id)->assertSessionHasErrors(['wheelConfigId' => Basket::NOT_A_SET]);
        $post(wsCookies($other), $wheel['front']->id, $wheel['rear']->id)->assertSessionHasErrors(['wheelConfigId' => Basket::NOT_A_SET]);
    });

    it('refuses a set with a version not available, and blocks a set held in the basket when its paper goes', function (): void {
        ['wheel' => $wheel, 'car' => $car, 'document' => $document] = wsStaggered();
        $add = ['kind' => 'WHEEL', 'wheelConfigId' => $wheel['front']->id, 'rearWheelConfigId' => $wheel['rear']->id, 'quantity' => 2];

        $wheel['rear']->forceFill(['available' => false])->save();
        $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', $add)->assertSessionHasErrors(['wheelConfigId' => Basket::WHEEL_SOLD_OUT]);

        $wheel['rear']->forceFill(['available' => true])->save();
        $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', $add)->assertSessionHasNoErrors();
        $this->withCookies(wsCookies($car))->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page->where('lines.0.blockReasons', []));

        Fitment::query()->where('approval_document_id', $document->id)->update(['status' => 'retired']);

        $this->withCookies(wsCookies($car))->get('/warenkorb')->assertInertia(fn (AssertableInertia $page) => $page
            ->where('lines.0.blockReasons', [Basket::NOT_A_SET])
            ->where('lines.1.blockReasons', [Basket::NOT_A_SET]));
    });

    it('freezes both versions in the order: one line per axle, each with its own version\'s verdict', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();
        $resolver = app(FitmentResolver::class);

        $this->withCookies(wsCookies($car))->from('/felgen')->post('/warenkorb', [
            'kind' => 'WHEEL', 'wheelConfigId' => $wheel['front']->id, 'rearWheelConfigId' => $wheel['rear']->id, 'quantity' => 2,
        ])->assertSessionHasNoErrors();

        $this->withCookies(wsCookies($car))->from('/kasse')->post('/kasse', [
            'email' => 'satz@beispiel.de', 'phone' => '', 'name' => 'Erika Mustermann', 'street' => 'Hauptstraße',
            'houseNumber' => '12', 'zip' => '50667', 'city' => 'Köln', 'billingSame' => true, 'shipping' => 'standard',
        ])->assertSessionHasNoErrors();

        $order = Order::query()->latest('id')->firstOrFail();
        $lines = OrderLine::query()->where('order_id', $order->id)->orderBy('id')->get();
        $frozen = OrderLineFitment::query()->whereIn('order_line_id', $lines->pluck('id'))->orderBy('order_line_id')->get();

        expect($lines->pluck('wheel_config_id')->all())->toBe([$wheel['front']->id, $wheel['rear']->id])
            ->and($lines->pluck('axle')->all())->toBe(['FRONT', 'REAR'])
            ->and($lines->pluck('quantity')->all())->toBe([2, 2])
            ->and($lines[0]->label)->toStartWith('Felge Vorderachse: ')
            ->and($lines[1]->label)->toStartWith('Felge Hinterachse: ')
            ->and($frozen->pluck('wheel_config_id')->all())->toBe([$wheel['front']->id, $wheel['rear']->id])
            ->and($frozen[0]->verdict_status)->toBe(($resolver->resolve($car->id, $wheel['front']->id)->forRimAlone() ?? $resolver->resolve($car->id, $wheel['front']->id))->status->value)
            ->and($frozen[0]->verdict['mixedTyres']['partnerWheel'])->toContain('19')
            ->and($frozen[1]->verdict['mixedTyres']['partnerWheel'])->toContain('18')
            ->and($order->total_cents)->toBe(99_600);
    });
});

describe('the product page', function (): void {
    it('offers the set in each colour both versions share, names both axles, prices it two and two, and gives its versions no chip of their own', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();

        $page = $this->withCookies(wsCookies($car))->get('/felgen/'.$wheel['model']->slug)->assertOk()->viewData('page');
        $sets = collect($page['props']['wheelSets']);
        $plain = static fn (string $text): string => str_replace(["\u{00A0}", "\u{202F}"], ' ', $text);
        $black = $sets->firstWhere('frontId', $wheel['front']->id);

        expect($sets)->toHaveCount(2)
            ->and($plain($black['label']))->toBe('Vorne 2 × 8,5 × 18 ET 35 · Hinten 2 × 8,5 × 19 ET 35')
            ->and($black['rearId'])->toBe($wheel['rear']->id)
            ->and($black['finishId'])->toBe($wheel['front']->wheel_finish_id)
            ->and($black['priceCents'])->toBe(99_600)
            ->and($plain($black['price']))->toBe('996,00 €')
            ->and($plain($black['priceNote']))->toBe('2 × 229,00 € + 2 × 269,00 €')
            ->and($plain($black['bolt']))->toBe('Lochkreis 5 × 120')
            ->and(array_map($plain, $black['axles']))->toBe(['Vorne 2 × 8,5 × 18 ET 35', 'Hinten 2 × 8,5 × 19 ET 35'])
            ->and($black['inStock'])->toBeTrue()
            ->and($black['verdict']['status'])->toBe(app(WheelSets::class)->find($car->id, $wheel['front']->id, $wheel['rear']->id)->status()->value);

        foreach ($page['props']['configs'] as $config) {
            expect($config['onlyInSet'])->toBeTrue();
        }
    });

    it('offers no set where no car is chosen, and says nothing of one version being only for a set', function (): void {
        ['wheel' => $wheel] = wsStaggered();

        $page = $this->get('/felgen/'.$wheel['model']->slug)->assertOk()->viewData('page');

        expect($page['props']['wheelSets'])->toBe([]);

        foreach ($page['props']['configs'] as $config) {
            expect($config['onlyInSet'])->toBeFalse();
        }
    });
});

describe('the listing', function (): void {
    it('speaks for the set where the car has only sets, and says so on the card', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();
        $set = app(WheelSets::class)->find($car->id, $wheel['front']->id, $wheel['rear']->id);

        $page = $this->withCookies(wsCookies($car))->get('/felgen')->assertOk()->viewData('page');
        $card = collect($page['props']['cards'])->firstWhere('slug', $wheel['model']->slug);

        expect($card)->not->toBeNull()
            ->and($card['fitment']['onlyAsSet'])->toBeTrue()
            ->and(str_replace(["\u{00A0}", "\u{202F}"], ' ', (string) $card['fitment']['setPrice']))->toBe('996,00 €')
            ->and($card['fitment']['status'])->toBe($set->status()->value);
    });
});

describe('under a size filter', function (): void {
    it('prices the set whole and greys neither of its diameters, whichever one is filtered', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();

        foreach ([18, 19] as $inch) {
            $page = $this->withCookies(wsCookies($car))->get('/felgen?zoll='.$inch)->assertOk()->viewData('page');
            $card = collect($page['props']['cards'])->firstWhere('slug', $wheel['model']->slug);

            expect($card)->not->toBeNull()
                ->and(str_replace(["\u{00A0}", "\u{202F}"], ' ', (string) $card['fitment']['setPrice']))->toBe('996,00 €')
                ->and($card['diametersFitting'])->toBe(['18', '19']);
        }
    });
});

describe('the compare page', function (): void {
    it('names the set and its price, and offers it rather than four of one version', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();

        $page = $this->withCookies(wsCookies($car))->get('/vergleich?f='.$wheel['model']->id.':'.$wheel['front']->wheel_finish_id)->assertOk()->viewData('page');
        $item = $page['props']['items'][0];

        expect($item['fitment']['onlyAsSet'])->toBeTrue()
            ->and(str_replace(["\u{00A0}", "\u{202F}"], ' ', (string) $item['fitment']['setPrice']))->toBe('996,00 €')
            ->and($item['buy']['kind'])->toBe('choose')
            ->and($item['buy']['href'])->toContain('satz='.$wheel['front']->id.'-'.$wheel['rear']->id);
    });
});

describe('the printable RIMIFY-Check', function (): void {
    it('is not issued for a version sold only as a set: frozen, it would say „freigegeben“ for one axle', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();

        foreach ([$wheel['front'], $wheel['rear']] as $version) {
            $this->withCookies(wsCookies($car))->from('/felgen')->post('/rimify-check/ergebnis', ['wheelConfigId' => $version->id])->assertSessionHasErrors('wheelConfigId');
        }

        expect(CheckResult::query()->count())->toBe(0);
    });
});

describe('the RIMIFY-Check', function (): void {
    it('marks a version the car may have only in a set, so the page offers no four of it', function (): void {
        ['wheel' => $wheel, 'car' => $car] = wsStaggered();
        $finish = $wheel['front']->wheel_finish_id;
        $brand = $wheel['model']->brand->slug;

        $page = $this->withCookies(wsCookies($car))->get("/rimify-check?hersteller={$brand}&felge={$wheel['model']->slug}&ausfuehrung={$finish}&groesse={$wheel['front']->id}")->assertOk()->viewData('page');

        expect($page['props']['answer']['config']['onlyInSet'] ?? null)->toBeTrue()
            ->and($page['props']['answer']['config']['setKey'])->toBe($wheel['front']->id.'-'.$wheel['rear']->id);
    });
});
