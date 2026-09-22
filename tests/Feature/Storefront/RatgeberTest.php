<?php

declare(strict_types=1);

use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * The guides (H10): seeded as pages of kind `guide`, served at /ratgeber/{slug}. Two are published;
 * the ABE/Teilegutachten/ECE guide is a draft until it is rewritten and legally signed off
 * (docs/phase0/ACCURACY.md §3.0), so it answers 404 and the homepage leaves it out.
 */
beforeEach(function (): void {
    $this->seed(ContentSeeder::class);
});

it('serves a guide with its lead, its sections and the other published guide', function (): void {
    $this->get('/ratgeber/hsn-und-tsn-finden')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Ratgeber/Desktop')
            ->where('guide.slug', 'hsn-und-tsn-finden')
            ->where('guide.title', 'HSN und TSN finden')
            ->where('guide.minutes', fn ($m) => $m >= 2)
            ->where('guide.teaser', fn ($t) => is_string($t) && $t !== '')
            ->where('guide.blocks', fn ($blocks) => count($blocks) >= 4 && collect($blocks)->every(fn (array $b): bool => $b['type'] === 'prose' && isset($b['data']['heading'], $b['data']['text'])))
            ->has('others', 1)
            ->where('others.0.slug', 'einpresstiefe-et-erklaert')
        );
});

it('lists exactly the two published guides on the homepage', function (): void {
    $this->seed(CommerceSeeder::class);

    $this->get('/')->assertInertia(fn (AssertableInertia $page) => $page
        ->has('guides', 2)
        ->where('guides.0.slug', 'hsn-und-tsn-finden')
        ->where('guides.1.slug', 'einpresstiefe-et-erklaert')
    );
});

it('answers 404 for a guide that does not exist or is not published', function (): void {
    $this->get('/ratgeber/gibt-es-nicht')->assertNotFound();
    $this->get('/ratgeber/abe-teilegutachten-ece')->assertNotFound();
});
