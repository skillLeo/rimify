<?php

declare(strict_types=1);

use App\Domain\Storefront\Garage;

it('keeps the last five vehicles, most recent first', function (): void {
    $garage = new Garage;

    foreach ([1, 2, 3, 4, 5, 6] as $id) {
        $garage = $garage->with($id);
    }

    expect($garage->vehicleIds)->toBe([6, 5, 4, 3, 2]);
});

it('moves a vehicle chosen again to the front instead of listing it twice', function (): void {
    $garage = (new Garage([3, 2, 1]))->with(1);

    expect($garage->vehicleIds)->toBe([1, 3, 2]);
});

it('survives a round trip through the cookie', function (): void {
    $garage = Garage::decode((new Garage([7, 3]))->encode());

    expect($garage->vehicleIds)->toBe([7, 3]);
});

it('decodes anything malformed to an empty garage', function (?string $payload): void {
    expect(Garage::decode($payload)->isEmpty())->toBeTrue();
})->with([null, '', '{', '"x"', '[0, -1, "a"]', '{"v": 1}']);

it('drops duplicates and non-ids while decoding', function (): void {
    expect(Garage::decode('[4, 4, "x", 2, 0, 9, 8, 7, 6]')->vehicleIds)->toBe([4, 2, 9, 8, 7]);
});
