<?php

declare(strict_types=1);

use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia;

/*
 * D-023 — contact details have exactly one source of truth.
 *
 * The homepage and the Kontakt page shipped different numbers and different opening hours in the
 * source documents. Rendering every appearance from config is what stops that divergence being
 * reintroduced one page at a time, so these tests police the rule rather than the symptom.
 */

/** @return list<string> every file that could render a contact detail to a customer */
function renderableSources(): array
{
    $roots = [
        base_path('resources/views'),
        base_path('resources/js'),
        base_path('app'),
        base_path('routes'),
        base_path('database/seeders'),
    ];

    $files = [];

    foreach ($roots as $root) {
        if (! is_dir($root)) {
            continue;
        }

        foreach (File::allFiles($root) as $file) {
            if (in_array($file->getExtension(), ['php', 'vue', 'ts', 'js', 'blade'], true)) {
                $files[] = $file->getRealPath();
            }
        }
    }

    return $files;
}

it('ships the contact details the client has given, and no others', function (): void {
    // The client gave an e-mail address and service hours, and no phone and no WhatsApp. A default
    // number here would be invented, and an invented number is a confident wrong answer.
    expect(config('rimify.contact.email'))->toBe('info@rimify.de')
        ->and(config('rimify.contact.phone'))->toBeNull()
        ->and(config('rimify.contact.phone_intl'))->toBeNull()
        ->and(config('rimify.contact.whatsapp'))->toBeNull()
        ->and(config('rimify.contact.hours'))->toBe('Mo–Fr 9:00–17:00 Uhr')
        ->and(config('rimify.service.to'))->toBe('17:00');
});

it('shares the e-mail and the hours, and no phone, on every page by default', function (): void {
    $this->get('/kontakt')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('contact.email', 'info@rimify.de')
                ->where('contact.phone', null)
                ->where('contact.phoneIntl', null)
                ->where('contact.whatsapp', null)
                ->where('contact.hours', 'Mo–Fr 9:00–17:00 Uhr')
        );
});

/** The homepage and the checkout render the catalogue, which fails closed without its reference data. */
function seedStorefront(): void
{
    test()->seed([CommerceSeeder::class, AccessSeeder::class, ContentSeeder::class]);
}

it('renders the homepage without a phone or WhatsApp link when none is configured', function (): void {
    seedStorefront();
    $response = $this->get('/')->assertOk();

    $response->assertInertia(
        fn (AssertableInertia $page) => $page
            ->where('contact.phone', null)
            ->where('contact.whatsapp', null)
            ->where('contact.email', 'info@rimify.de')
    );

    $html = (string) $response->getContent();

    // No link to a phone, none to WhatsApp, and nothing shaped like a German number anywhere.
    expect($html)
        ->not->toContain('href="tel:')
        ->not->toContain('wa.me/')
        ->and(preg_match('/(\+49[\s\d]{9,}|\b0\d{2,4}[\s\/]\d{6,}\b)/', $html))->toBe(0);
});

it('treats an empty phone setting as no phone', function (): void {
    config()->set('rimify.contact.phone', '  ');
    config()->set('rimify.contact.phone_intl', '');

    $this->get('/kontakt')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('contact.phone', null)->where('contact.phoneIntl', null));
});

it('shows the phone once one is configured', function (): void {
    // Not a real number: it only proves the path from configuration to page is open.
    seedStorefront();
    config()->set('rimify.contact.phone', '0800 000 00 00');
    config()->set('rimify.contact.phone_intl', '+49-800-0000000');

    $this->get('/')
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('contact.phone', '0800 000 00 00')
                ->where('contact.phoneIntl', '+49-800-0000000')
        )
        ->assertSee('0800 000 00 00', false);

    $this->get('/faq')
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('contact.phone', '0800 000 00 00')
                ->where('contact.phoneIntl', '+49-800-0000000')
        );
});

it('passes the whole shared contact shape wherever a page passes its own', function (string $path): void {
    // A page prop named `contact` replaces the shared one, and the header and the footer read it:
    // a narrower shape there would leave the hours blank in the header on that page.
    seedStorefront();
    $this->get($path)
        ->assertOk()
        ->assertInertia(
            fn (AssertableInertia $page) => $page
                ->where('contact.email', 'info@rimify.de')
                ->where('contact.phone', null)
                ->where('contact.phoneIntl', null)
                ->where('contact.whatsapp', null)
                ->where('contact.hours', 'Mo–Fr 9:00–17:00 Uhr')
        );
})->with(['/faq', '/kasse', '/kontakt']);

it('uses en dashes in the opening hours, not hyphens', function (): void {
    $hours = (string) config('rimify.contact.hours');

    expect($hours)->toContain("\u{2013}")->not->toContain('-');
});

it('contains no trace of the superseded phone number anywhere in the codebase', function (): void {
    // `1234567` is the homepage's old number. Its reappearance means someone hard-coded a
    // contact detail instead of reading it from config.
    $offenders = [];

    foreach (renderableSources() as $path) {
        $contents = (string) file_get_contents($path);

        if (str_contains($contents, '1234567')) {
            $offenders[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path);
        }
    }

    expect($offenders)->toBe([], 'Superseded contact number found in: '.implode(', ', $offenders));
});

it('hard-codes no phone number in any renderable file', function (): void {
    // Any German landline or mobile shape outside config is a divergence waiting to happen.
    $offenders = [];
    $configPath = config_path('rimify.php');

    foreach (renderableSources() as $path) {
        if ($path === $configPath) {
            continue;
        }

        $contents = (string) file_get_contents($path);

        // `0211 1255555`, `+49 211 …`, `+49 176 …` and friends.
        if (preg_match('/(\+49[\s\d]{9,}|\b0\d{2,4}[\s\/]\d{6,}\b)/', $contents) === 1) {
            $offenders[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path);
        }
    }

    expect($offenders)->toBe([], 'Hard-coded phone number in: '.implode(', ', $offenders));
});

it('hard-codes no contact email in any renderable file', function (): void {
    $offenders = [];
    $configPath = config_path('rimify.php');

    foreach (renderableSources() as $path) {
        if ($path === $configPath) {
            continue;
        }

        if (str_contains((string) file_get_contents($path), 'info@rimify.de')) {
            $offenders[] = str_replace(base_path().DIRECTORY_SEPARATOR, '', $path);
        }
    }

    expect($offenders)->toBe([], 'Hard-coded contact email in: '.implode(', ', $offenders));
});
