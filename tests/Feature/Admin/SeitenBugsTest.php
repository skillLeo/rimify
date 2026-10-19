<?php

declare(strict_types=1);

use App\Models\AdminUser;
use App\Models\Page;
use App\Services\Content\PageContent;
use App\Services\Content\PageSchema;
use App\Services\Storage\StorageSettings;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia;
use Tests\Support\FakeBucket;

/*
 * Bug tests of review SEI-BLOCKS-2026-10-19 (docs/qa/BUGS.md) whose fault is on the server: an article's building
 * blocks (his admin item 211, D-306). They run on the test database; nothing reaches the network.
 */
beforeEach(function (): void {
    config(['rimify.reset.allowed' => false]);
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

/*
 * SEI-25 (S2) — the Protokoll does not name a block that was removed where a block of another kind now stands.
 *
 * PageSchema::diff() takes the type of a place from its new block; where the old block there is of another kind it says
 * „<new> (neu)" only, and counts the labels after it wrong. An article of two text sections and a quote loses its quote:
 * today the Protokoll reads „Abschnitt 2 (neu)" and „Abschnitt 3 (entfernt)" — an Abschnitt 3 that never was — and the
 * quote's removal is said nowhere. The editor's dialog has the same fault (content.ts; e2e/bugs/SEI-25.spec.ts).
 */
it('SEI-25 names a removed quote in the Protokoll, also where a text section now stands at its place', function (): void {
    $schema = PageSchema::for(new Page(['kind' => Page::KIND_GUIDE]));

    expect($schema)->not->toBeNull();

    $lead = ['type' => 'guide_lead', 'data' => ['teaser' => 'Vorspann', 'minutes' => 3]];
    $prose = fn (string $heading): array => ['type' => 'prose', 'data' => ['heading' => $heading, 'text' => 'Text zu '.$heading]];
    $quote = ['type' => 'quote', 'data' => ['text' => 'Erst die Papiere, dann die Felge.', 'source' => '']];

    $before = ['title' => 'ET', 'metaDescription' => '', 'blocks' => [$lead, $prose('Eins'), $quote, $prose('Zwei')]];
    $after = ['title' => 'ET', 'metaDescription' => '', 'blocks' => [$lead, $prose('Eins'), $prose('Zwei')]];

    $labels = PageSchema::changes($schema, $before, $after);

    expect($labels)->toContain('Zitat 1 (entfernt)')
        ->and(implode(' | ', $labels))->not->toContain('Abschnitt 3');
});

/*
 * SEI-26 (S2, latent) — with a CDN in front of the bucket, no uploaded picture can be published.
 *
 * SeitenController::image answers the disk's URL; with a public base set under Einstellungen › Medien und Speicher (or
 * RIMIFY_S3_URL) that is the CDN's address. PageSchema::OWN_IMAGE knows only `/storage/` and `*.amazonaws.com`, so the
 * publish check refuses the picture just uploaded („Dieses Bild liegt nicht in unserem Speicher. Wähl es über „Anderes
 * Bild auswählen“ neu aus.“ — a new upload gets the same address), and ArticleBlocks drops it from the article. A CDN
 * base is a supported setting (StorageConfig::publicBase, SecurityHeadersTest).
 */
it('SEI-26 publishes a picture uploaded while a CDN serves the bucket, and the article shows it', function (): void {
    config(['media.s3' => ['key' => 'FAKEKEYFORTESTS0AB12', 'secret' => 'fake/secret/for/tests/only/0000X9Y8', 'region' => 'eu-north-1', 'bucket' => 'rimify-media-test', 'url' => 'https://cdn.rimify.test/medien', 'endpoint' => null, 'path_style' => false]]);
    FakeBucket::install();
    app(StorageSettings::class)->flush();

    $admin = AdminUser::query()->where('email', 'super-admin@rimify.test')->firstOrFail();
    $guide = Page::query()->where('slug', 'hsn-und-tsn-finden')->firstOrFail();

    $src = $this->actingAs($admin, 'admin')
        ->post('/admin/seiten/'.$guide->id.'/bild', ['image' => UploadedFile::fake()->image('schein.jpg', 1200, 800)], ['Accept' => 'application/json'])
        ->assertOk()
        ->json('src');

    expect($src)->toBeString()->toStartWith('https://cdn.rimify.test/medien/');

    $live = PageContent::live($guide);
    $content = PageSchema::normalise(PageSchema::for($guide) ?? [], $live, $live);
    $content['blocks'][] = ['type' => 'figure', 'data' => ['src' => $src, 'width' => 1200, 'height' => 800, 'alt' => 'Die Felder 2.1 und 2.2', 'caption' => '']];

    $this->actingAs($admin, 'admin')
        ->from('/admin/seiten/'.$guide->id)
        ->post('/admin/seiten/'.$guide->id.'/veroeffentlichen', $content + [
            'note' => '',
            'lawyerReviewed' => false,
            'baseVersion' => (int) Page::query()->whereKey($guide->id)->value('content_version'),
        ])
        ->assertSessionHasNoErrors();

    // The lead is not one of the article's blocks: the picture is the last of them.
    $this->get('/ratgeber/hsn-und-tsn-finden')->assertInertia(fn (AssertableInertia $page) => $page
        ->where('guide.blocks.'.(count($content['blocks']) - 2).'.type', 'figure'));
});
