<?php

declare(strict_types=1);

use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\DB;
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

// ── The Blog (the client's #10, D-230) ─────────────────────────────────────────────────────────────────────────────

it('lists every published article on /blog, and never the draft the lawyer has not signed off @admin-212', function (): void {
    $this->get('/blog')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Blog/Desktop')
            ->has('articles', 2)
            ->where('articles', fn ($articles) => collect($articles)->pluck('href')->sort()->values()->all() === ['/ratgeber/einpresstiefe-et-erklaert', '/ratgeber/hsn-und-tsn-finden'])
            ->where('articles.0.teaser', fn ($t) => is_string($t) && $t !== '')
            ->where('articles.0.minutes', fn ($m) => $m >= 1)
        );

    // The address the guides' parent always implied leads there too, once and for good.
    $this->get('/ratgeber')->assertStatus(301)->assertRedirect('/blog');
});

it('links the Blog from the footer, beside the Felgenrechner @admin-212', function (): void {
    $this->get('/blog')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('menus.footer_shop', fn ($items) => collect($items)->contains(fn ($i): bool => $i['label'] === 'Blog' && parse_url((string) $i['href'], PHP_URL_PATH) === '/blog')
            && collect($items)->contains(fn ($i): bool => $i['label'] === 'Felgenrechner'))
    );
});

it('names the Blog and every published article in the sitemap, and robots.txt names the sitemap on the live shop only', function (): void {
    $xml = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8')->getContent();
    $base = rtrim((string) config('app.url'), '/');

    expect($xml)->toContain("<loc>{$base}/blog</loc>")
        ->and($xml)->toContain("<loc>{$base}/ratgeber/hsn-und-tsn-finden</loc>")
        ->and($xml)->toContain("<loc>{$base}/ratgeber/einpresstiefe-et-erklaert</loc>")
        ->and($xml)->not->toContain('abe-teilegutachten-ece');

    expect($this->get('/robots.txt')->getContent())->not->toContain('Sitemap:');
});

it('shows a figure only with its alt text and a table only with its caption and header cells — and never HTML', function (): void {
    $id = (int) DB::table('pages')->where('slug', 'hsn-und-tsn-finden')->value('id');
    $order = (int) DB::table('page_blocks')->where('page_id', $id)->max('sort_order');

    foreach ([
        ['figure', ['src' => '/storage/website-images/zb1.webp', 'alt' => 'Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2', 'caption' => 'Feld 2.1 und 2.2']],
        ['figure', ['src' => '/storage/website-images/ohne-alt.webp', 'alt' => '']],
        ['figure', ['src' => 'https://example.org/fremd.jpg', 'alt' => 'Ein Bild von anderswo']],
        ['table', ['caption' => 'Einpresstiefe und Spur', 'head' => ['ET', 'Wirkung'], 'rows' => [['< 30', 'breitere Spur'], ['<script>alert(1)</script>', 'bleibt Text']]]],
        ['table', ['caption' => '', 'head' => ['ET'], 'rows' => [['35']]]],
    ] as $i => [$type, $data]) {
        DB::table('page_blocks')->insert(['page_id' => $id, 'type' => $type, 'data' => json_encode($data), 'sort_order' => $order + $i + 1, 'created_at' => now(), 'updated_at' => now()]);
    }

    $this->get('/ratgeber/hsn-und-tsn-finden')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('guide.blocks', function ($blocks): bool {
            $extra = collect($blocks)->reject(fn (array $b): bool => $b['type'] === 'prose')->values();

            return $extra->count() === 2
                && $extra[0]['type'] === 'figure' && $extra[0]['data']['alt'] === 'Zulassungsbescheinigung Teil I mit den Feldern 2.1 und 2.2'
                && $extra[1]['type'] === 'table' && $extra[1]['data']['head'] === ['ET', 'Wirkung']
                // A measurement is not a tag, and a tag is text: nothing is stripped, the page prints it as text.
                && $extra[1]['data']['rows'][0][0] === '< 30' && $extra[1]['data']['rows'][1][0] === '<script>alert(1)</script>';
        })
    );
});
