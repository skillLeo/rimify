<?php

declare(strict_types=1);

use App\Support\MakeName;

it('writes a lower-case make the way the manufacturer does', function (string $in, string $out): void {
    expect(MakeName::normalise($in))->toBe($out);
})->with([
    ['ford', 'Ford'],
    ['FORD', 'Ford'],
    ['bmw', 'BMW'],
    ['mercedes-benz', 'Mercedes-Benz'],
    ['skoda', 'Škoda'],
    ['alfa romeo', 'Alfa Romeo'],
    ['rotiform', 'Rotiform'],
    ['oz racing', 'OZ Racing'],
    ['  volkswagen  ', 'Volkswagen'],
    ['land  rover', 'Land Rover'],
    ['', ''],
]);

it('compares names without regard to case or surrounding space', function (): void {
    expect(MakeName::same('ford', ' Ford '))->toBeTrue()
        ->and(MakeName::same('Ford', 'Opel'))->toBeFalse();
});
