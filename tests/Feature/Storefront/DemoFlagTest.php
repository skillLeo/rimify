<?php

declare(strict_types=1);

use App\Models\WheelModel;
use Database\Seeders\ContentSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Inertia\Testing\AssertableInertia;

/*
 * The site-wide Demodaten badge (docs/phase0/ACCURACY.md D4) hangs on one shared prop, computed on
 * the server for every page: `demoBadge` is true while any published wheel model is a demonstration row.
 */

beforeEach(function (): void {
    $this->seed(ContentSeeder::class);
});

it('shares demo = true on every page while a published demo model exists', function (string $path): void {
    WheelModel::factory()->create(['is_demo' => true]);

    $this->get($path)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('demoBadge', true));
})->with(['/kontakt', '/faq', '/rimify-check', '/rechtliches/impressum']);

it('keeps the badge on a page that passes a demo prop of its own', function (): void {
    // /vergleich with nothing to compare passes `demo = false` for its own rows. A page prop named
    // like the shared one would replace it, which is why the badge has its own key. The page asks
    // the fitment engine, which fails closed without its reference tables.
    $this->seed(ReferenceDataSeeder::class);
    WheelModel::factory()->create(['is_demo' => true]);

    $this->get('/vergleich')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->where('demoBadge', true)->where('demo', false));
});

it('shares demo = false when no demo model is published', function (): void {
    $this->get('/kontakt')->assertInertia(fn (AssertableInertia $page) => $page->where('demoBadge', false));

    // A draft demo row is not on show, and a real model is not demonstration data.
    WheelModel::factory()->draft()->create(['is_demo' => true]);
    WheelModel::factory()->create(['is_demo' => false]);

    $this->get('/kontakt')->assertInertia(fn (AssertableInertia $page) => $page->where('demoBadge', false));
});
