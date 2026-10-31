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

    // The unit through the one helper, with its no-break space (R-10, the copy points of 14.10.2026).
    expect($sizes['items'][0]['label'])->toBe("18\u{00A0}Zoll")
        ->and($sizes['items'][0]['href'])->toBe('/felgen?zoll=18');
})->with(['18', '18 Zoll', '18″', '18zoll']);

// HQ-28 (Human QA, 31.10.2026): the empty search's own hint names „8,5J“, and „8,5J“ found nothing; nor did „8,5x18“,
// the way rims, their Gutachten and every classified ad print a size. Both lead to the listing filtered by them.
it('reads a rim width as the rim prints it', function (string $q): void {
    $sizes = collect($this->getJson('/api/v1/search?q='.rawurlencode($q))->assertOk()->json('groups'))->firstWhere('key', 'groessen');

    expect($sizes['items'][0]['label'])->toBe('8,5J')
        ->and($sizes['items'][0]['href'])->toBe('/felgen?breite=8.5');
})->with(['8,5J', '8.5j', '8,5 J']);

it('reads a width with its diameter as rims and ads print it', function (string $q): void {
    $sizes = collect($this->getJson('/api/v1/search?q='.rawurlencode($q))->assertOk()->json('groups'))->firstWhere('key', 'groessen');

    expect($sizes['items'][0]['label'])->toBe("8,5J\u{00A0}×\u{00A0}18")
        ->and($sizes['items'][0]['href'])->toBe('/felgen?breite=8.5&zoll=18');
})->with(['8,5x18', '8,5Jx18', '8.5 x 18', '8,5J x 18 Zoll', '8,5x18″']);

it('offers no width or size the catalogue does not carry', function (string $q): void {
    $response = $this->getJson('/api/v1/search?q='.rawurlencode($q))->assertOk();

    expect(collect($response->json('groups'))->firstWhere('key', 'groessen'))->toBeNull();
})->with(['10,5J', '8,5x22', '9x18']);

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
