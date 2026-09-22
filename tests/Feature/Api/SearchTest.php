<?php

declare(strict_types=1);

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
    $this->getJson('/api/v1/search?q=ultim')
        ->assertOk()
        ->assertJsonPath('groups.0.key', 'felgen')
        ->assertJsonPath('groups.0.items.0.label', 'MCR4 Ultimate')
        ->assertJsonPath('groups.0.items.0.href', '/felgen/motec-mcr4-ultimate');
});

it('finds a brand by a fragment and links it to the filtered listing', function (): void {
    $response = $this->getJson('/api/v1/search?q=mote')->assertOk();

    $brands = collect($response->json('groups'))->firstWhere('key', 'marken');

    expect($brands)->not->toBeNull()
        ->and($brands['items'][0]['label'])->toBe('MOTEC')
        ->and($brands['items'][0]['href'])->toBe('/felgen?marke=MOTEC');
});

it('never finds a brand the catalogue no longer carries', function (): void {
    // The demo wheels once carried real brand names; none of them may surface again.
    foreach (['borbet', 'bbs', 'dezent'] as $q) {
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
    $this->getJson('/api/v1/search?q=motek')
        ->assertOk()
        ->assertJsonPath('total', 0)
        ->assertJsonPath('suggestion', 'MOTEC');

    $this->getJson('/api/v1/search?q=motek')->assertOk();

    $miss = DB::table('search_misses')->where('query', 'motek')->first();

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

it('is rate limited to sixty requests a minute', function (): void {
    $response = $this->getJson('/api/v1/search?q=motec');

    expect($response->headers->get('X-RateLimit-Limit'))->toBe('60');
});
