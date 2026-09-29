<?php

declare(strict_types=1);

use App\Support\VehicleName;

it('names the model once where the variant already starts with it', function (?string $make, ?string $model, ?string $variant, string $name): void {
    expect(VehicleName::of($make, $model, $variant))->toBe($name);
})->with([
    'variant repeats the model' => ['Audi', 'RS 4', 'RS 4 Avant Quattro', 'Audi RS 4 Avant Quattro'],
    'variant without the model' => ['BMW', '3er', '320d', 'BMW 3er 320d'],
    'no model' => ['Volkswagen', null, 'Golf GTI', 'Volkswagen Golf GTI'],
    'no variant' => ['Volkswagen', 'Golf', null, 'Volkswagen Golf'],
    'stray spaces' => [' BMW ', ' X3 ', ' X3 M40i ', 'BMW X3 M40i'],
]);

it('reads the same from a row or a model', function (): void {
    expect(VehicleName::from((object) ['make' => 'Volkswagen', 'model' => 'Golf', 'variant' => 'Golf GTI']))->toBe('Volkswagen Golf GTI');
});
