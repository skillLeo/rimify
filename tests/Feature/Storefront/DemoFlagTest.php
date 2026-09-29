<?php

declare(strict_types=1);

use App\Models\WheelModel;
use Database\Seeders\ContentSeeder;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia;

/*
 * Example data never reaches the storefront (the review release §2, superseding ACCURACY D4's badged
 * demo shop): a demo model cannot be published — the table refuses it — so the site-wide Demodaten
 * badge (`demoBadge`, one shared prop) can never be raised. It stays as the page's last line of
 * defence: were a demo row ever on show, every page would say so.
 */

beforeEach(function (): void {
    $this->seed(ContentSeeder::class);
});

it('refuses to publish a demo model at all', function (): void {
    expect(fn () => WheelModel::factory()->create(['is_demo' => true]))->toThrow(QueryException::class);
});

it('shares demo = false on every page: a draft demo row is not on show, and a real model is not demonstration data', function (string $path): void {
    WheelModel::factory()->draft()->create(['is_demo' => true]);
    WheelModel::factory()->create(['is_demo' => false]);

    $this->get($path)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->where('demoBadge', false));
})->with(['/kontakt', '/faq', '/rimify-check', '/rechtliches/impressum']);
