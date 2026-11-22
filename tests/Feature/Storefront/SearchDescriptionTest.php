<?php

declare(strict_types=1);

use App\Http\Middleware\SecurityHeaders;
use App\Models\WheelModel;
use Database\Seeders\CommerceSeeder;
use Inertia\Testing\AssertableInertia;
use Tests\Support\LegalFixture;

/*
 * The pre-launch audit of 22.11.2026, B2 line 6 (D-511): fifteen of the preview's twenty-two public pages had no search
 * description, and in the live shop nothing kept a person's own pages — the basket, the Kasse, an order — out of a search.
 */

beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
});

it('gives the shop pages a description of their own, and leaves the pages that write theirs alone', function (): void {
    $described = static fn (string $path) => test()->get($path)->assertOk()->viewData('page')['props']['pageDescription'] ?? null;

    expect($described('/felgen'))->toStartWith('Alufelgen für dein Auto')
        ->and($described('/felgen-suchen'))->toContain('HSN und TSN')
        ->and($described('/rimify-check'))->toStartWith('Der RIMIFY-Check')
        ->and($described('/faq'))->toContain('häufige Fragen')
        ->and($described('/kontakt'))->toStartWith('Frag uns')
        ->and($described('/rechtliches/impressum'))->toStartWith('Impressum von RIMIFY')
        ->and($described('/rechtliches/agb'))->toContain('Geschäftsbedingungen')
        // Written by the page itself: never a second one from here.
        ->and($described('/'))->toBeNull()
        ->and($described('/felgenrechner'))->toBeNull();
});

it('describes a wheel by the admin’s own text, or by its name where there is none', function (): void {
    $model = WheelModel::query()->where('status', 'published')->with('brand')->firstOrFail();
    $read = fn (): ?string => $this->get('/felgen/'.$model->slug)->assertOk()->viewData('page')['props']['pageDescription'] ?? null;

    $model->forceFill(['seo_description' => null])->save();
    expect($read())->toStartWith(trim($model->brand->name.' '.$model->name).': als Felge oder Komplettrad.');

    $model->forceFill(['seo_description' => 'Eigener Text für die Suche.'])->save();
    expect($read())->toBe('Eigener Text für die Suche.');
});

it('keeps a person’s own pages out of search in the live shop, and opens the catalogue to it', function (): void {
    LegalFixture::ready();
    app()['env'] = 'production';

    $this->get('/warenkorb')->assertHeader('X-Robots-Tag', 'noindex');
    $this->get('/kasse')->assertHeader('X-Robots-Tag', 'noindex');
    $this->get('/felgen')->assertHeaderMissing('X-Robots-Tag');
    $this->get('/')->assertHeaderMissing('X-Robots-Tag');

    expect(SecurityHeaders::PRIVATE_PATHS)->toContain('bestellung/*', 'konto/*', 'rimify-check/ergebnis/*');
});

it('sends no description into the admin', function (): void {
    $this->get('/admin/anmelden')->assertInertia(fn (AssertableInertia $page) => $page->where('pageDescription', null));
});
