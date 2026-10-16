<?php

declare(strict_types=1);

use App\Services\Legal\CookieInventory;

/*
 * The inventory of what the shop stores in a browser (D-241) and the notice's own list (`resources/js/legal/cookies.ts`)
 * can never say different things: every name the notice gives stands in the inventory, with its purpose, its lifetime
 * and the reason for its answer.
 */
it('holds every cookie the notice names', function (): void {
    $source = (string) file_get_contents(dirname(__DIR__, 3).'/resources/js/legal/cookies.ts');
    preg_match_all("/name:\s*'([^']+)'/", $source, $named);
    $held = array_column(CookieInventory::ENTRIES, 'name');

    expect($named[1])->not->toBeEmpty()
        ->and(array_values(array_diff($named[1], $held)))->toBe([]);
});

it('says for every entry what it is for, how long it stays and why it is or is not necessary', function (): void {
    foreach (CookieInventory::ENTRIES as $entry) {
        expect(mb_strlen($entry['purpose']))->toBeGreaterThan(15, $entry['name'])
            ->and($entry['lifetime'])->not->toBe('', $entry['name'])
            ->and(mb_strlen($entry['why']))->toBeGreaterThan(15, $entry['name'])
            ->and($entry['kind'])->toBeIn([CookieInventory::COOKIE, CookieInventory::LOCAL, CookieInventory::SESSION], $entry['name']);
    }

    expect(CookieInventory::notNecessary())->toContain('rmf_garage')->not->toContain('Sitzung und XSRF-TOKEN');
});
