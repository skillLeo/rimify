<?php

declare(strict_types=1);

use App\Models\Vehicle;
use App\Models\WheelFinish;
use App\Services\Storefront\ProductCards;
use App\Support\DemoWheels;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\CatalogueSeeder;
use Tests\Support\DemoWheelFixtures;

/*
 * The product card carries its finish's own photograph, or null — on both paths, the catalogue
 * without a vehicle and the listing for one.
 */

beforeEach(function (): void {
    $this->dir = DemoWheelFixtures::emptyDir();
});

afterEach(function (): void {
    DemoWheelFixtures::remove($this->dir);
});

it('emits the manifest of a pictured finish and null for the rest on the catalogue path', function (): void {
    $photos = DemoWheels::photos();
    $first = array_values($photos)[0];
    DemoWheelFixtures::write($this->dir, [$first['slug']]);

    $this->seed(CatalogueSeeder::class);

    $cards = app(ProductCards::class)->catalogue(limit: null);

    expect($cards)->not->toBeEmpty();

    $pictured = collect($cards)->firstWhere('slug', $first['model']);
    $picturedFinish = WheelFinish::query()
        ->whereHas('wheelModel', fn ($q) => $q->where('slug', $first['model']))
        ->where('name_de', $first['finish'])
        ->firstOrFail();

    foreach ($cards as $card) {
        expect($card)->toHaveKey('image');

        if ($card['finishId'] === $picturedFinish->id) {
            expect($card['image'])->toBeArray()
                ->and($card['image']['name'])->toBe($first['slug'])
                ->and($card['image']['fallback'])->toBe('png')
                ->and($card['image']['widths'])->toBe([480, 768, 1080]);
        } else {
            expect($card['image'])->toBeNull();
        }
    }

    expect($pictured)->not->toBeNull();
});

it('emits the same image field on the vehicle path', function (): void {
    $photos = DemoWheels::photos();
    DemoWheelFixtures::write($this->dir, array_column($photos, 'slug'));

    $this->seed(ApprovalSeeder::class);

    // The BMW 330i G20 (5 × 112): the photographed MCR4 is among its permitted wheels.
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', 'CKT')->firstOrFail();
    $result = app(ProductCards::class)->forVehicle($vehicle->id, [], 100, 1);

    expect($result['total'])->toBeGreaterThan(0);

    $pictured = 0;

    foreach ($result['cards'] as $card) {
        expect($card)->toHaveKey('image');

        if ($card['image'] !== null) {
            expect(DemoWheels::wellFormed($card['image']))->toBeTrue();
            $pictured++;
        }
    }

    // The manifests were attached before the listing ran, so the pictured finishes among the
    // permitted cards carry them — the vehicle path reads the same column as the catalogue path.
    $picturedFinishIds = WheelFinish::query()->whereNotNull('image_manifest')->pluck('id')->all();
    $expected = collect($result['cards'])->filter(fn (array $c): bool => in_array($c['finishId'], $picturedFinishIds, true))->count();

    expect($pictured)->toBe($expected);
});

it('fails closed to null when the stored manifest is not one Picture could render', function (): void {
    $this->seed(CatalogueSeeder::class);

    $finish = WheelFinish::query()->firstOrFail();
    $finish->image_manifest = ['name' => 'broken', 'widths' => []];
    $finish->save();

    $card = collect(app(ProductCards::class)->catalogue(limit: null))->firstWhere('finishId', $finish->id);

    expect($card)->not->toBeNull()
        ->and($card['image'])->toBeNull();
});
