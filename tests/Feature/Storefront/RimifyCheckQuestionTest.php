<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Domain\Storefront\VehicleKey;
use App\Enums\CatalogueStatus;
use App\Models\Brand;
use App\Models\Vehicle;
use App\Models\WheelFinish;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The client's #28: the RIMIFY-Check as one question — „Passt diese Felge auf mein Auto?“. The car, the wheel and its
 * size all live in the address, so the page is the answer whoever opens the link; the answer is the product page's own
 * row for that car and that size, built by the same code; and a car chosen on the page brings the visitor back to the
 * question, never to the listing.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, KomplettradOptionsSeeder::class]);
});

/** @return array<string, mixed> */
function checkProps(mixed $response): array
{
    return $response->assertOk()->viewData('page')['props'];
}

it('answers for the car and one size with the very row the product page ships for them', function (): void {
    $set = KomplettradFixture::permitted();
    $wheel = $set->config->wheelModel;

    $check = checkProps($this->withCookies($set->cookies())->get('/rimify-check?felge='.$wheel->slug.'&groesse='.$set->config->id));
    $pdp = checkProps($this->withCookies($set->cookies())->get('/felgen/'.$wheel->slug));
    $row = collect($pdp['configs'])->firstWhere('id', $set->config->id);

    expect($check['answer'])->not->toBeNull()
        ->and($check['answer']['config'])->toEqual($row)
        ->and($check['answer']['komplettradOptions'])->toEqual($pdp['komplettradOptions'])
        ->and($check['answer']['product'])->toMatchArray(['slug' => $wheel->slug, 'modelName' => $wheel->name])
        ->and($check['chosen'])->toBe(['brand' => $wheel->brand->slug, 'wheel' => $wheel->slug, 'finish' => (int) $set->config->wheel_finish_id, 'size' => $set->config->id]);
});

it('asks for the car before it answers, and keeps the wheel and the size chosen', function (): void {
    $set = KomplettradFixture::permitted();
    $wheel = $set->config->wheelModel;

    $this->get('/rimify-check?felge='.$wheel->slug.'&groesse='.$set->config->id)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Check/Index')
            ->where('answer', null)
            ->where('chosen.wheel', $wheel->slug)
            ->where('chosen.size', $set->config->id)
            ->where('chosen.finish', (int) $set->config->wheel_finish_id)
            // The sizes of the size's own finish, each a size and nothing else (CHECK-05).
            ->has('wheelSizes', $wheel->configs()->where('wheel_finish_id', $set->config->wheel_finish_id)->count())
            ->where('changing', false));
});

it('keeps the size where another finish has it, and opens the first finish until one is chosen (CHECK-05)', function (): void {
    $set = KomplettradFixture::permitted();
    $wheel = $set->config->wheelModel;
    $first = $set->config;
    $other = WheelFinish::query()->create(['wheel_model_id' => $wheel->id, 'name_de' => 'Zweitfarbe', 'art_finish' => 'black']);
    $twin = $first->replicate(['sku'])->fill(['wheel_finish_id' => $other->id, 'sku' => $first->sku.'-ZW']);
    $twin->save();

    $props = checkProps($this->get('/rimify-check?felge='.$wheel->slug.'&groesse='.$first->id.'&ausfuehrung='.$other->id));

    expect($props['chosen']['finish'])->toBe($other->id)
        ->and($props['chosen']['size'])->toBe($twin->id)
        ->and(collect($props['wheelFinishes'])->pluck('name'))->toContain('Zweitfarbe')
        ->and(collect($props['wheelSizes'])->pluck('id')->all())->toContain($twin->id)
        ->and(collect($props['wheelSizes'])->pluck('label')->first())->not->toContain('·  ');

    // Nothing named: the first finish, its sizes listed, no size chosen while it has several.
    $fresh = checkProps($this->get('/rimify-check?felge='.$wheel->slug));
    expect($fresh['chosen']['finish'])->toBe(collect($fresh['wheelFinishes'])->first()['id'])
        ->and($fresh['wheelSizes'])->not->toBeEmpty();

    // „Ändern“ in the address.
    expect(checkProps($this->get('/rimify-check?aendern=1'))['changing'])->toBeTrue();
});

it('takes the car from the address (D-116), so a shared link carries the whole answer', function (): void {
    $set = KomplettradFixture::permitted();
    $wheel = $set->config->wheelModel;

    $props = checkProps($this->get('/rimify-check?felge='.$wheel->slug.'&groesse='.$set->config->id.'&fahrzeug='.$set->vehicle->id));

    expect($props['answer']['config']['id'])->toBe($set->config->id)
        ->and($props['answer']['config']['verdict'])->not->toBeNull();
});

it('says which part of a shared link the shop no longer has — the wheel or the size — and nothing for a good link', function (): void {
    $set = KomplettradFixture::permitted();
    $wheel = $set->config->wheelModel;

    expect(checkProps($this->get('/rimify-check?felge=gibt-es-nicht'))['notFound'])->toBe('wheel')
        ->and(checkProps($this->get('/rimify-check?felge='.$wheel->slug.'&groesse=999999999'))['notFound'])->toBe($wheel->configs()->count() === 1 ? null : 'size')
        ->and(checkProps($this->get('/rimify-check?felge='.$wheel->slug.'&groesse='.$set->config->id))['notFound'])->toBeNull()
        ->and(checkProps($this->get('/rimify-check'))['notFound'])->toBeNull();
});

it('lists only brands with a wheel in the shop, and narrows the wheels to the brand chosen', function (): void {
    $set = KomplettradFixture::permitted();
    $brand = $set->config->wheelModel->brand;
    $empty = Brand::query()->create(['name' => 'Ohne Felgen', 'slug' => 'ohne-felgen']);

    $props = checkProps($this->get('/rimify-check?hersteller='.$brand->slug));
    $published = WheelModel::query()->where('brand_id', $brand->id)->where('status', CatalogueStatus::Published->value)->pluck('slug')->sort()->values()->all();

    expect(collect($props['wheelBrands'])->pluck('slug'))->toContain($brand->slug)->not->toContain($empty->slug)
        ->and(collect($props['wheelModels'])->pluck('slug')->sort()->values()->all())->toBe($published)
        ->and($props['wheelSizes'])->toBe([])
        ->and($props['answer'])->toBeNull();
});

it('brings the visitor back to the question with the car in its address, from either way of choosing it', function (): void {
    $set = KomplettradFixture::permitted();
    $question = '/rimify-check?hersteller=x&felge='.$set->config->wheelModel->slug.'&groesse='.$set->config->id;

    $location = $this->post('/fahrzeug', ['fahrzeug' => $set->vehicle->id, 'zurueck' => $question])
        ->assertRedirect()->assertCookie(VehicleContext::COOKIE)->headers->get('Location');

    // The car as its key numbers where it has them, its number otherwise (VehicleKey, the client's #8).
    expect(parse_url((string) $location, PHP_URL_PATH))->toBe('/rimify-check');
    parse_str((string) parse_url((string) $location, PHP_URL_QUERY), $query);
    expect($query)->toBe(['hersteller' => 'x', 'felge' => $set->config->wheelModel->slug, 'groesse' => (string) $set->config->id, 'fahrzeug' => VehicleKey::of($set->vehicle)]);

    // By key numbers: a pair that names exactly one car.
    $unique = Vehicle::query()->whereNotNull('hsn')->whereNotNull('tsn')->get()
        ->groupBy(static fn (Vehicle $v): string => $v->hsn.'/'.$v->tsn)
        ->first(static fn ($cars): bool => $cars->count() === 1)
        ?->first();

    expect($unique)->not->toBeNull();

    $this->post('/fahrzeug/schluesselnummern', ['hsn' => $unique->hsn, 'tsn' => $unique->tsn, 'zurueck' => '/rimify-check?felge=a'])
        ->assertRedirect('/rimify-check?felge=a&fahrzeug='.VehicleKey::of($unique));
});

it('carries a return address through the selector page — the compare table’s „Fahrzeug wählen“ — and drops an unsafe one', function (): void {
    $this->get('/felgen-suchen?zurueck=/vergleich')->assertInertia(fn (AssertableInertia $page) => $page
        ->component('FelgenSuchen/Index')
        ->where('returnTo', '/vergleich'));

    $this->get('/felgen-suchen?zurueck=//example.org/x')->assertInertia(fn (AssertableInertia $page) => $page->where('returnTo', null));
    $this->get('/felgen-suchen')->assertInertia(fn (AssertableInertia $page) => $page->where('returnTo', null));
});

it('sends a return address that is not a path of this shop to the listing, as before', function (string $unsafe): void {
    $set = KomplettradFixture::permitted();

    $location = $this->post('/fahrzeug', ['fahrzeug' => $set->vehicle->id, 'zurueck' => $unsafe])
        ->assertRedirect()->headers->get('Location');

    expect(parse_url((string) $location, PHP_URL_HOST))->toBe(parse_url((string) config('app.url'), PHP_URL_HOST))
        ->and(parse_url((string) $location, PHP_URL_PATH))->toBe('/felgen');
})->with([
    'another host' => ['https://example.org/rimify-check'],
    'protocol-relative' => ['//example.org/rimify-check'],
    'a dot segment' => ['/rimify-check/../admin'],
    // A trailing one never arrives: TrimStrings takes it off, and what is left is a path of the shop.
    'a line break inside' => ["/rimify-check\nSet-Cookie: x=1"],
]);
