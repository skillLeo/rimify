<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Enums\FitmentStatus;
use App\Models\WheelConfig;
use App\Services\Commerce\OrderWriter;
use App\Services\Storefront\ProductCards;
use App\Support\GermanFormat;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The Gutachten rework §8: a version is one size row of the rim, with its own price and availability, chosen whole. What the
 * page's chips read comes from here: the version's name, the verdict that sorts it, the colour a link opens on — and the
 * cart, the order and everything printed from them name the whole version, never just width and ET.
 */

/** The car with published fitments on the wheel, and those configurations. @return array{0: int, 1: string, 2: list<int>} */
function versionCar(): array
{
    $row = DB::table('fitments as f')
        ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
        ->join('wheel_models as wm', 'wm.id', '=', 'wc.wheel_model_id')
        ->where('f.status', FitmentStatus::Published->value)
        ->orderBy('f.id')
        ->first(['f.vehicle_id', 'wm.slug', 'wm.id as model_id']);

    expect($row)->not->toBeNull('the seeded approvals must hold a published fitment');

    $ids = DB::table('fitments as f')
        ->join('wheel_configs as wc', 'wc.id', '=', 'f.wheel_config_id')
        ->where('f.vehicle_id', $row->vehicle_id)
        ->where('wc.wheel_model_id', $row->model_id)
        ->where('f.status', FitmentStatus::Published->value)
        ->pluck('f.wheel_config_id')
        ->map(static fn ($id): int => (int) $id)
        ->unique()
        ->values()
        ->all();

    return [(int) $row->vehicle_id, (string) $row->slug, $ids];
}

it('names every version of the rim on the product page by its width, ET and bolt pattern', function (): void {
    $this->seed(ApprovalSeeder::class);
    $config = WheelConfig::query()->with('wheelModel')->firstOrFail();

    $props = $this->get('/felgen/'.$config->wheelModel->slug)->assertOk()->viewData('page')['props'];
    $shipped = collect($props['configs'])->firstWhere('id', $config->id);

    expect($shipped['versionLabel'])->toBe(GermanFormat::wheelVersion((float) $config->width_in, (int) $config->et_mm, (int) $config->bolt_holes, (float) $config->bolt_circle_mm))
        ->and($shipped['versionLabel'])->toStartWith("Breite\u{00A0}");
});

it('without a car sends every version unjudged, so the page offers them all', function (): void {
    $this->seed(ApprovalSeeder::class);
    [, $slug] = versionCar();

    $props = $this->get('/felgen/'.$slug)->assertOk()->viewData('page')['props'];

    expect($props['hasVehicle'])->toBeFalse()
        ->and($props['configs'])->not->toBeEmpty()
        ->and(collect($props['configs'])->pluck('verdict')->filter()->all())->toBe([]);
});

it('with a car answers each version on its own, and the page can tell which words are true for it', function (): void {
    $this->seed(ApprovalSeeder::class);
    [$vehicleId, $slug] = versionCar();

    $props = $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($vehicleId, true))->encode()])
        ->get('/felgen/'.$slug)->assertOk()->viewData('page')['props'];
    $configs = collect($props['configs']);
    $answers = $configs->map(static fn (array $c): string => $c['verdict']['status'].' '.($c['verdict']['reasonCode'] ?? ''))->unique()->values()->all();

    // Sold on a released paper; a paper naming the car, its tyres not entered: a Freigabe is on record, the chip must not deny it (D-214);
    // a paper entered whole that does not name the car: it spoke (D-227).
    expect($answers)->toContain('NOT_PERMITTED NOT_COVERED')
        ->and($answers)->toContain('UNKNOWN TYRE_SIZES_NOT_RECORDED')
        ->and($configs->pluck('verdict.sellable')->filter()->count())->toBeGreaterThan(0);
});

it('answers „no document“ for a version nothing on record speaks about, never a refusal', function (): void {
    $this->seed(CommerceSeeder::class);
    $set = KomplettradFixture::permitted();
    $config = $set->undocumentedConfig();

    $props = $this->withCookies($set->cookies())->get('/felgen/'.$config->wheelModel->slug)->assertOk()->viewData('page')['props'];
    $shipped = collect($props['configs'])->firstWhere('id', $config->id);

    expect($shipped['verdict']['status'])->toBe('UNKNOWN')
        ->and($shipped['verdict']['reasonCode'])->toBe('NO_DOCUMENT')
        ->and($shipped['verdict']['sellable'])->toBeFalse();
});

it('opens a link to one size on the colour that size is in, and lets a named colour stand', function (): void {
    $this->seed(ApprovalSeeder::class);
    $model = DB::table('wheel_finishes')->select('wheel_model_id')->groupBy('wheel_model_id')->havingRaw('COUNT(*) > 1')->value('wheel_model_id');

    expect($model)->not->toBeNull('the seeded catalogue must hold a wheel in two colours');

    $last = WheelConfig::query()->where('wheel_model_id', $model)->orderByDesc('wheel_finish_id')->firstOrFail();
    $first = (int) WheelConfig::query()->where('wheel_model_id', $model)->min('wheel_finish_id');
    $slug = $last->wheelModel->slug;

    expect($last->wheel_finish_id)->not->toBe($first);

    $opened = fn (string $query): int => $this->get('/felgen/'.$slug.$query)->assertOk()->viewData('page')['props']['finishes'][0]['id'];

    expect($opened('?groesse='.$last->id))->toBe($last->wheel_finish_id)
        ->and($opened('?ausfuehrung='.$first.'&groesse='.$last->id))->toBe($first)
        // Nothing in the address that is not on this page: as without one.
        ->and($opened('?groesse=99999999'))->toBe($opened(''));
});

it('counts the versions on a card: all of them without a car, those the page offers with one', function (): void {
    $this->seed(ApprovalSeeder::class);
    [$vehicleId, $slug, $approved] = versionCar();
    $config = WheelConfig::query()->whereIn('id', $approved)->firstOrFail();
    $of = static fn (array $cards): ?array => collect($cards)->first(static fn (array $c): bool => $c['slug'] === $slug && $c['finishId'] === $config->wheel_finish_id);

    $all = WheelConfig::query()->where('wheel_model_id', $config->wheel_model_id)->where('wheel_finish_id', $config->wheel_finish_id)->count();
    $cards = app(ProductCards::class);

    // With a car it is the page's own count, over every car and card: CardMatchesProductPageTest.
    expect($of($cards->catalogue(limit: null))['versionCount'])->toBe($all)
        ->and($all)->toBeGreaterThan(1)
        ->and($of($cards->forVehicle($vehicleId, [], 200, 1)['cards'])['versionCount'])->toBeLessThan($all);
});

it('names the whole version in the cart, and freezes it on the order line', function (): void {
    $this->seed(CommerceSeeder::class);
    $config = WheelConfig::query()->where('stock_qty', '>', 4)->firstOrFail();
    $whole = GermanFormat::wheelLabel((float) $config->width_in, (float) $config->diameter_in, (int) $config->et_mm, (int) $config->bolt_holes, (float) $config->bolt_circle_mm, (float) $config->centre_bore_mm);

    $this->post('/warenkorb', ['kind' => 'WHEEL', 'wheelConfigId' => $config->id, 'tyreVariantId' => null, 'quantity' => 4])->assertSessionHasNoErrors();

    $line = $this->get('/warenkorb')->assertOk()->viewData('page')['props']['lines'][0];

    expect($line['sizeLabel'])->toBe($whole)
        ->and($line['sizeLabel'])->toContain(GermanFormat::boltPattern((int) $config->bolt_holes, (float) $config->bolt_circle_mm))
        ->and($line['sizeLabel'])->toContain(GermanFormat::millimetres((float) $config->centre_bore_mm));

    $label = (new ReflectionMethod(OrderWriter::class, 'label'))->invoke(null, $line);

    expect($label)->toContain($whole);
});
