<?php

declare(strict_types=1);

use App\Enums\DocumentStatus;
use App\Models\ApprovalDocument;
use App\Models\Vehicle;
use App\Models\WheelModel;
use App\Services\Storefront\VehicleTree;
use App\Support\CatalogueVersion;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Testing\TestResponse;
use Tests\Support\Storefront\KomplettradFixture;

/*
 * The client's admin item 16 (D-294): „when creating a new rim the browser caches the old requests and the new rim does
 * not show up". Worse than he put it: a kept page can show a verdict after its Gutachten was corrected. No answer of the
 * shop is kept anywhere on its way; the shop's own caches are kept under the catalogue's version, which every write to
 * the catalogue renews; and every answer's ETag names it.
 */

beforeEach(function (): void {
    $this->seed([CommerceSeeder::class, AccessSeeder::class]);
});

/** The catalogue's version an answer's ETag names: `W/"k<version>-<content>"`. */
function etagVersion(TestResponse $response): string
{
    preg_match('/^W\/"k(.+)-[0-9a-f]{16}"$/', (string) $response->headers->get('ETag'), $match);

    return $match[1] ?? '';
}

function assertKeptNowhere(TestResponse $response, string $address): void
{
    $cache = (string) $response->headers->get('Cache-Control');
    $vary = array_map(trim(...), explode(',', (string) $response->headers->get('Vary')));

    expect(str_contains($cache, 'no-store') && str_contains($cache, 'private'))->toBeTrue("{$address}: Cache-Control „{$cache}“")
        ->and($response->headers->get('X-LiteSpeed-Cache-Control'))->toBe('no-cache', $address)
        ->and(in_array('Cookie', $vary, true))->toBeTrue("{$address}: Vary „".implode(', ', $vary).'“')
        ->and(etagVersion($response))->toBe(CatalogueVersion::current(), $address);
}

it('keeps no answer of the shop anywhere on its way — pages, JSON, an Inertia visit, the admin @admin-216', function (): void {
    $fx = KomplettradFixture::permitted();
    $vehicle = $fx->vehicle;

    foreach ([
        '/',
        '/felgen',
        '/felgen/'.$fx->config->wheelModel->slug,
        '/warenkorb',
        '/rimify-check',
        '/api/v1/vehicles/models?marke='.rawurlencode($vehicle->make),
        '/api/v1/vehicles/variants?marke='.rawurlencode($vehicle->make).'&modell='.rawurlencode($vehicle->model),
        '/api/v1/fitment/count?fahrzeug='.$vehicle->id,
        '/api/v1/search?q=felge',
        '/admin/anmelden',
    ] as $address) {
        assertKeptNowhere($this->withCookies($fx->cookies())->get($address)->assertOk(), $address);
    }

    // The visit after the first page: Inertia's own request, answered as JSON.
    $version = $this->get('/felgen')->viewData('page')['version'];
    $visit = $this->withCookies($fx->cookies())->withHeaders(['X-Inertia' => 'true', 'X-Inertia-Version' => (string) $version, 'X-Requested-With' => 'XMLHttpRequest'])->get('/felgen')->assertOk();

    assertKeptNowhere($visit, 'Inertia visit');
    expect(array_map(trim(...), explode(',', (string) $visit->headers->get('Vary'))))->toContain('X-Inertia');
});

it('leaves an answer the rule it chose itself: the postcode lookup keeps its day', function (): void {
    $response = $this->getJson('/api/v1/plz/80331')->assertOk();

    expect((string) $response->headers->get('Cache-Control'))->toContain('public')->toContain('max-age=86400')
        ->and($response->headers->has('X-LiteSpeed-Cache-Control'))->toBeFalse();
});

it('fetches, changes, fetches: a Gutachten taken off the shop is gone from the page, the count and the ETag at once @admin-216', function (): void {
    $fx = KomplettradFixture::permitted();
    $page = fn (): TestResponse => $this->withCookies($fx->cookies())->get('/felgen/'.$fx->config->wheelModel->slug)->assertOk();
    $count = fn (): int => (int) $this->withCookies($fx->cookies())->getJson('/api/v1/fitment/count?fahrzeug='.$fx->vehicle->id)->assertOk()->json('count');
    $size = static fn (TestResponse $r): array => collect($r->viewData('page')['props']['configs'])->firstWhere('id', $fx->config->id) ?? [];

    // Fetched: the answer, and the count under the selector — which is now kept in the shop's cache.
    $before = $page();
    expect($size($before)['verdict']['sellable'] ?? false)->toBeTrue()
        ->and($count())->toBeGreaterThan(0)
        ->and($before->viewData('page')['props']['catalogue'])->toBe(etagVersion($before));

    // Changed: every released Gutachten that names the car is replaced — as a correction replaces one.
    ApprovalDocument::query()
        ->where('status', DocumentStatus::Published->value)
        ->whereHas('fitments', static fn ($q) => $q->where('vehicle_id', $fx->vehicle->id))
        ->get()
        ->each(static fn (ApprovalDocument $document) => $document->forceFill(['status' => DocumentStatus::Superseded->value])->save());

    // Fetched again: nothing kept answers — not the page, not the count, and the ETag names the new state.
    $after = $page();
    expect($size($after)['verdict']['sellable'] ?? false)->toBeFalse()
        ->and($count())->toBe(0)
        ->and(etagVersion($after))->not->toBe(etagVersion($before))
        ->and($after->viewData('page')['props']['catalogue'])->toBe(etagVersion($after));
});

it('renews the version once a write commits, never for one rolled back @admin-216', function (): void {
    $wheel = WheelModel::query()->firstOrFail();
    $before = CatalogueVersion::current();

    try {
        DB::transaction(static function () use ($wheel): void {
            $wheel->touch();

            throw new RuntimeException('rolled back');
        });
    } catch (RuntimeException) {
        // The write never happened.
    }

    expect(CatalogueVersion::current())->toBe($before);

    DB::transaction(static fn () => $wheel->touch());

    expect(CatalogueVersion::current())->not->toBe($before);
});

it('keeps the shop’s own caches under the version: a vehicle written stands in the selector at once @admin-216', function (): void {
    $tree = app(VehicleTree::class);

    expect(collect($tree->makes())->pluck('make'))->not->toContain('Testmarke');

    Vehicle::factory()->create(['make' => 'Testmarke']);

    expect(collect($tree->makes())->pluck('make'))->toContain('Testmarke');
});

it('listens to every model the shop’s answers rest on', function (string $model): void {
    expect(Event::hasListeners('eloquent.saved: '.$model))->toBeTrue()
        ->and(Event::hasListeners('eloquent.deleted: '.$model))->toBeTrue();
})->with(CatalogueVersion::MODELS);
