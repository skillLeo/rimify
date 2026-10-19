<?php

declare(strict_types=1);

use App\Support\WheelTitle;

/*
 * His admin items 5, 6 and 13 (D-298): a wheel's name in the shop is the brand, the model and the Radtypenbezeichnung —
 * the designation the Gutachten identify the wheel by. A typed title stands instead and is never overwritten; it is read
 * as what follows the brand, which always leads. resources/js/lib/wheelTitle.ts holds the same rule for the admin.
 */

it('composes brand, model and Radtypenbezeichnung, never the designation twice @admin-205 @admin-206 @admin-213', function (): void {
    expect(WheelTitle::composed('BORBET', 'Havanna', 'HA 8018'))->toBe('BORBET Havanna HA 8018')
        ->and(WheelTitle::composed('BORBET', ' Havanna ', null))->toBe('BORBET Havanna')
        ->and(WheelTitle::composed('MOTEC', 'MCR4 Ultimate', 'mcr4'))->toBe('MOTEC MCR4 Ultimate');
});

it('gives the shop what follows the brand — composed, or typed with or without the brand @admin-206', function (): void {
    expect(WheelTitle::nameFor('BORBET', 'Havanna', 'HA 8018', null))->toBe('Havanna HA 8018')
        ->and(WheelTitle::nameFor('BORBET', 'Havanna', 'HA 8018', 'BORBET Havanna Black'))->toBe('Havanna Black')
        ->and(WheelTitle::nameFor('BORBET', 'Havanna', 'HA 8018', 'Havanna Black'))->toBe('Havanna Black')
        ->and(WheelTitle::afterBrand('BORBET', 'BORBETT Havanna'))->toBe('BORBETT Havanna');
});

it('stores nothing for a title the parts make, so it follows them; a title typed otherwise, kept @admin-213', function (): void {
    expect(WheelTitle::stored('', 'BORBET', 'Havanna', 'HA 8018'))->toBeNull()
        ->and(WheelTitle::stored('BORBET Havanna HA 8018', 'BORBET', 'Havanna', 'HA 8018'))->toBeNull()
        ->and(WheelTitle::stored('Havanna HA 8018', 'BORBET', 'Havanna', 'HA 8018'))->toBeNull()
        ->and(WheelTitle::stored(' Havanna  Black ', 'BORBET', 'Havanna', 'HA 8018'))->toBe('Havanna Black');
});

it('flags a typed title its parts no longer make @admin-213', function (): void {
    expect(WheelTitle::divergesFor('BORBET', 'Havanna', 'HA 8018', 'Havanna Black'))->toBeTrue()
        ->and(WheelTitle::divergesFor('BORBET', 'Havanna', 'HA 8018', 'BORBET Havanna HA 8018'))->toBeFalse()
        ->and(WheelTitle::divergesFor('BORBET', 'Havanna', 'HA 8018', null))->toBeFalse();
});
