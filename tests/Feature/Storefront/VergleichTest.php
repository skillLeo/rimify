<?php

declare(strict_types=1);

use App\Domain\Fitment\Verdict\VerdictStatus;
use App\Domain\Storefront\VehicleContext;
use App\Models\Vehicle;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * `/vergleich`: up to four wheels side by side, keyed by `modelId:finishId` in the query.
 *
 * The page never guesses: unknown keys are dropped and counted, a malformed query is the empty
 * state for a browser and a 422 for a client that asks for JSON, and with a vehicle every column
 * carries the engine's four-state verdict — never a boolean (R-07).
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

/** The encrypted vehicle cookie, as the browser would carry it (see PurchaseJourneyTest). */
function vergleichCookie(int $vehicleId): array
{
    return [VehicleContext::COOKIE => (new VehicleContext($vehicleId, true))->encode()];
}

/** @return list<array<string, mixed>> the catalogue cards the listing shows, with or without a vehicle */
function vergleichCards(TestCase $test, array $cookies = []): array
{
    $response = $cookies === [] ? $test->get('/felgen') : $test->withCookies($cookies)->get('/felgen');

    return $response->viewData('page')['props']['cards'];
}

function vergleichKey(array $card): string
{
    return $card['modelId'].':'.$card['finishId'];
}

it('renders the empty state with no pairs', function (): void {
    $this->get('/vergleich')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Vergleich/Desktop')
            ->where('items', [])
            ->where('missing', 0)
            ->where('cap', 4)
            ->where('demo', false)
        );
});

it('lines up two valid pairs with the figures the table needs', function (): void {
    [$a, $b] = vergleichCards($this);

    $this->get('/vergleich?f='.vergleichKey($a).','.vergleichKey($b))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Vergleich/Desktop')
            ->has('items', 2)
            ->where('items.0.modelId', $a['modelId'])
            ->where('items.0.finishId', $a['finishId'])
            ->where('items.0.compareKey', vergleichKey($a))
            ->where('items.1.compareKey', vergleichKey($b))
            ->has('items.0.brandName')
            ->has('items.0.modelName')
            ->has('items.0.finishName')
            ->has('items.0.fromPriceCents')
            ->has('items.0.specs.sizes')
            ->where('items.0.specs.sizes', fn ($sizes) => count($sizes) > 0 && str_contains((string) $sizes[0], 'J'))
            ->where('items.0.diameters', fn ($d) => count($d) > 0)
            ->where('items.0.specs.etRange', fn ($et) => str_starts_with($et, 'ET'))
            ->where('items.0.specs.boltPattern', fn ($lk) => str_starts_with($lk, 'LK'))
            ->where('items.0.specs.centreBore', fn ($mm) => str_ends_with($mm, 'mm'))
            ->has('items.0.specs.documents')
            ->has('items.0.isDemo')
            // No vehicle, no claim — in either direction.
            ->where('items.0.verdict', null)
            ->where('items.0.fitment', null)
            ->where('items.0.diametersFitting', null)
            ->where('items.0.buy.kind', 'choose')
            ->where('items.0.buy.href', fn ($href) => str_starts_with($href, '/felgen/'.$a['slug']))
            ->where('missing', 0)
            ->where('cap', 4)
        );
});

it('drops an unknown pair and counts it', function (): void {
    [$a] = vergleichCards($this);

    $this->get('/vergleich?f='.vergleichKey($a).',999999:999999')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('items', 1)
            ->where('items.0.compareKey', vergleichKey($a))
            ->where('missing', 1)
        );
});

it('refuses five pairs and a malformed pair', function (): void {
    $this->getJson('/vergleich?f=1:1,2:2,3:3,4:4,5:5')->assertStatus(422)->assertJsonValidationErrors('f');
    $this->getJson('/vergleich?f=abc')->assertStatus(422)->assertJsonValidationErrors('f');
    $this->getJson('/vergleich?f=1:1,2')->assertStatus(422)->assertJsonValidationErrors('f');
    $this->getJson('/vergleich?f=1:1;2:2')->assertStatus(422)->assertJsonValidationErrors('f');

    // A browser with a broken link lands on the empty comparison, never on an error page.
    $this->get('/vergleich?f=abc')->assertRedirect('/vergleich');
});

it('keeps the order asked for and ignores a repeated pair', function (): void {
    [$a, $b] = vergleichCards($this);

    $this->get('/vergleich?f='.vergleichKey($b).','.vergleichKey($a).','.vergleichKey($b))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('items', 2)
            ->where('items.0.compareKey', vergleichKey($b))
            ->where('items.1.compareKey', vergleichKey($a))
            ->where('missing', 0)
        );
});

it('carries the four-state verdict and the decided action per column with a vehicle', function (): void {
    // The BMW 330i G20 (5 × 112), a car the demo documents cover well.
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $cookies = vergleichCookie($vehicle->id);

    // The listing with a vehicle shows only wheels a document permits on it.
    $fitting = vergleichCards($this, $cookies);
    expect($fitting)->not->toBeEmpty();

    // A wheel the listing does not show for this car: no configuration of it is permitted.
    $catalogue = vergleichCards($this);
    $fittingKeys = array_map('vergleichKey', $fitting);
    $other = collect($catalogue)->first(fn (array $card): bool => ! in_array(vergleichKey($card), $fittingKeys, true));

    $keys = [vergleichKey($fitting[0])];

    if ($other !== null) {
        $keys[] = vergleichKey($other);
    }

    $response = $this->withCookies($cookies)->get('/vergleich?f='.implode(',', $keys));

    $response->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->has('items', count($keys))
        ->where('headerMode', fn ($mode) => in_array($mode, ['WHITE_BOX', 'BLUE_BAR', 'PLAIN'], true))
        ->where('items.0.verdict.status', fn ($status) => in_array($status, [VerdictStatus::Permitted->value, VerdictStatus::Conditional->value], true))
        ->where('items.0.verdict.sellable', true)
        ->has('items.0.verdict.label')
        ->has('items.0.verdict.conditions')
        ->has('items.0.verdict.tyreSizes')
        ->where('items.0.verdict.tyreSizes', fn ($sizes) => count($sizes) > 0)
        ->where('items.0.fitment.status', fn ($status) => in_array($status, [VerdictStatus::Permitted->value, VerdictStatus::Conditional->value], true))
        // Strings, the card's own spelling, so the tile can grey the sizes that are not in it.
        ->where('items.0.diametersFitting', fn ($d) => count($d) > 0 && collect($d)->every(fn ($v): bool => is_string($v)))
        ->where('items.0.buy.kind', fn ($kind) => in_array($kind, ['basket', 'choose'], true))
    );

    $items = $response->viewData('page')['props']['items'];

    foreach ($items as $item) {
        $status = $item['verdict']['status'];

        // Four states, never a boolean; the action follows the verdict.
        expect($status)->toBeIn(VerdictStatus::values());

        if ($status === VerdictStatus::NotPermitted->value) {
            expect($item['buy']['kind'])->toBe('none');
        }

        if ($item['buy']['kind'] === 'basket') {
            expect($item['buy']['configId'])->toBeInt()
                ->and($item['buy']['sizeLabel'])->toContain('ET')
                ->and($item['verdict']['sellable'])->toBeTrue();
        }
    }

    if ($other !== null) {
        // Not in the vehicle's listing: never a positive claim, whatever else it is.
        expect($items[1]['verdict']['status'])->toBeIn([VerdictStatus::NotPermitted->value, VerdictStatus::Unknown->value])
            ->and($items[1]['verdict']['sellable'])->toBeFalse()
            ->and($items[1]['buy']['kind'])->toBeIn(['none', 'choose']);
    }
});

it('renders the phone document for a phone', function (): void {
    $mobile = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

    $this->withHeaders(['User-Agent' => $mobile])
        ->get('/vergleich')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Vergleich/Mobile')->where('isMobile', true));
});
