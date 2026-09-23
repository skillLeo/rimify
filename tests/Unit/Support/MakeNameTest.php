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

/*
 * key() — the join key a per-make price is stored under. One manufacturer, one key, whatever
 * spelling the vehicle import or the admin used.
 */

it('keys every spelling of a make to one canonical join key', function (string $in, string $key): void {
    expect(MakeName::key($in))->toBe($key);
})->with([
    ['VW', 'volkswagen'],
    ['vw', 'volkswagen'],
    ['Volkswagen', 'volkswagen'],
    ['  volkswagen  ', 'volkswagen'],
    ['Mercedes', 'mercedes-benz'],
    ['Mercedes-Benz', 'mercedes-benz'],
    ['Mercedes Benz', 'mercedes-benz'],
    ['MB', 'mercedes-benz'],
    ['Škoda', 'skoda'],
    ['Skoda', 'skoda'],
    ['Citroën', 'citroen'],
    ['Citroen', 'citroen'],
    ['Vauxhall', 'opel'],
    ['Opel', 'opel'],
    ['BMW', 'bmw'],
    ['Alfa Romeo', 'alfa-romeo'],
    ['Land  Rover', 'land-rover'],
    ['Rolls-Royce', 'rolls-royce'],
    ['Straßenbau Müller', 'strassenbau-mueller'],
    ['Peugeot / Citroën', 'peugeot-citroen'],
    ['--Ford--', 'ford'],
]);

it('keys an empty or unusable make to the empty string, which callers treat as no make', function (): void {
    expect(MakeName::key(''))->toBe('')
        ->and(MakeName::key('   '))->toBe('')
        ->and(MakeName::key('---'))->toBe('')
        ->and(MakeName::key('***'))->toBe('');
});

it('caps the key at the column width without ending on a hyphen', function (): void {
    $key = MakeName::key(str_repeat('ab ', 40));

    expect(mb_strlen($key))->toBeLessThanOrEqual(64)
        ->and($key)->not->toEndWith('-')
        ->and($key)->toMatch('/^[a-z0-9][a-z0-9-]*$/');
});

it('leaves normalise() and its labels exactly as they were', function (): void {
    // The two are deliberately different: the label keeps the manufacturer's own spelling, the
    // key does not — `VW` and `Volkswagen` are two labels and one key.
    expect(MakeName::normalise('vw'))->toBe('VW')
        ->and(MakeName::normalise('volkswagen'))->toBe('Volkswagen')
        ->and(MakeName::key('vw'))->toBe(MakeName::key('volkswagen'));
});
