<?php

declare(strict_types=1);

use App\Domain\Storefront\VisitorKey;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;

/**
 * The instant search: four groups from one query, a typo still finds the wheel, a miss is counted
 * and answered with the nearest name.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('finds a wheel model by a prefix of its name', function (): void {
    $this->getJson('/api/v1/search?q=gipf')
        ->assertOk()
        ->assertJsonPath('groups.0.key', 'felgen')
        ->assertJsonPath('groups.0.items.0.label', 'Gipfel')
        ->assertJsonPath('groups.0.items.0.href', '/felgen/bergsteig-gipfel');
});

it('finds a brand by a fragment and links it to the filtered listing', function (): void {
    $response = $this->getJson('/api/v1/search?q=bergst')->assertOk();

    $brands = collect($response->json('groups'))->firstWhere('key', 'marken');

    expect($brands)->not->toBeNull()
        ->and($brands['items'][0]['label'])->toBe('Bergsteig')
        ->and($brands['items'][0]['href'])->toBe('/felgen?marke=Bergsteig');
});

it('never finds a brand the catalogue no longer carries', function (): void {
    // The demo wheels once carried real brand names, and then „Demo“; none of them may surface again.
    foreach (['borbet', 'bbs', 'dezent', 'motec', 'demo'] as $q) {
        $response = $this->getJson('/api/v1/search?q='.$q)->assertOk();

        expect(collect($response->json('groups'))->firstWhere('key', 'marken'))->toBeNull()
            ->and($response->json('suggestion'))->not->toBe(mb_strtoupper($q));
    }
});

it('reads a size however the customer spells it', function (string $q): void {
    $response = $this->getJson('/api/v1/search?q='.rawurlencode($q))->assertOk();

    $sizes = collect($response->json('groups'))->firstWhere('key', 'groessen');

    expect($sizes['items'][0]['label'])->toBe('18 Zoll')
        ->and($sizes['items'][0]['href'])->toBe('/felgen?zoll=18');
})->with(['18', '18 Zoll', '18″', '18zoll']);

it('offers the page a customer looks for by name', function (): void {
    $response = $this->getJson('/api/v1/search?q=widerruf')->assertOk();

    $pages = collect($response->json('groups'))->firstWhere('key', 'seiten');

    expect($pages['items'][0]['href'])->toBe('/rechtliches/widerrufsbelehrung');
});

it('answers a near miss with the nearest name and counts the miss', function (): void {
    $this->getJson('/api/v1/search?q=nordfelde')
        ->assertOk()
        ->assertJsonPath('total', 0)
        ->assertJsonPath('suggestion', 'Nordfelge');

    $this->getJson('/api/v1/search?q=nordfelde')->assertOk();

    $miss = DB::table('search_misses')->where('query', 'nordfelde')->first();

    expect($miss)->not->toBeNull()
        ->and((int) $miss->misses)->toBe(2);
});

it('refuses an empty or oversized query in German', function (): void {
    $this->getJson('/api/v1/search')
        ->assertStatus(422)
        ->assertJsonPath('errors.q.0', 'Gib einen Suchbegriff ein.');

    $this->getJson('/api/v1/search?q='.str_repeat('a', 81))
        ->assertStatus(422)
        ->assertJsonPath('errors.q.0', 'Der Suchbegriff darf höchstens 80 Zeichen lang sein.');
});

// Asked as the customer types: its own 120 a minute per visitor, apart from the vehicle picker's 60 (EF-04), and
// ten times that for an address without a visitor key yet (ShopRateLimits, ThrottleKeysTest).
it('is rate limited to 120 requests a minute per visitor, on a counter of its own', function (): void {
    $address = $this->getJson('/api/v1/search?q=motec');
    $visitor = $this->withCredentials()->withCookies([VisitorKey::COOKIE => str_repeat('k', 40)])->getJson('/api/v1/search?q=motec');

    expect($visitor->headers->get('X-RateLimit-Limit'))->toBe('120')
        ->and($address->headers->get('X-RateLimit-Limit'))->toBe('1200');
});
