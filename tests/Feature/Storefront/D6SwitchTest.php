<?php

declare(strict_types=1);

use App\Support\CatalogueVersion;
use App\Support\Switches;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * A1 of the operator's brief of 22.11.2026 (D-509): the D6 dropdowns are one switch, `RIMIFY_SWITCH_D6_DROPDOWNS`, off. The
 * server decides it and ships it in the first response (R-08), so the server's frame and the browser's agree; the page's
 * dropdown itself is proved in Produkt/Index.test.ts.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('ships the switch off to every page, and the caches keep their keys', function (): void {
    $this->get('/felgen')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('switches.d6', false));

    expect(Switches::d6Dropdowns())->toBeFalse()
        ->and(Switches::fingerprint())->toBe('')
        ->and(CatalogueVersion::key('probe'))->toBe('probe@'.CatalogueVersion::current());
});

it('ships it on where the env says so, and a cached answer from before is not the one read', function (): void {
    $before = CatalogueVersion::key('probe');
    config(['rimify.features.d6_dropdowns' => true]);

    $this->get('/felgen')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('switches.d6', true));

    expect(Switches::fingerprint())->toBe('~d6')
        ->and(CatalogueVersion::key('probe'))->not->toBe($before);
});
