<?php

declare(strict_types=1);

use App\Domain\Storefront\VehicleContext;
use App\Models\Vehicle;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Inertia\Testing\AssertableInertia;

/**
 * /felgenrechner (home-overhaul §3.3): one document per device, the vehicle's size as prefill,
 * a shared comparison parsed on the server — and never an error page for a link that does not
 * parse.
 */
beforeEach(function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
});

const RECHNER_EXAMPLE = '7.5x17-45-225-45_8.5x19-35-225-35';

it('renders the desktop document with neither a prefill nor a shared comparison', function (): void {
    $this->get('/felgenrechner')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Felgenrechner/Desktop')
            ->where('prefill', null)
            ->where('state', null)
            ->where('routeName', 'felgenrechner.index')
        );
});

it('renders the phone document for a phone', function (): void {
    $mobile = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';

    $this->withHeaders(['User-Agent' => $mobile])
        ->get('/felgenrechner')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Felgenrechner/Mobile')->where('isMobile', true));
});

it('prefills Aktuell from the vehicle cookie, with the same size the homepage teaser gets', function (): void {
    $vehicle = Vehicle::query()->where('hsn', '0005')->where('tsn', '582')->firstOrFail();
    $cookies = [VehicleContext::COOKIE => (new VehicleContext($vehicle->id, true))->encode()];

    $prefill = $this->withCookies($cookies)
        ->get('/felgenrechner')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            // The props travel as JSON: a whole-number float (`18.0`) arrives as an integer.
            ->where('prefill.widthIn', fn ($w) => is_numeric($w) && $w >= 5.5 && $w <= 12)
            ->where('prefill.diameterIn', fn ($d) => is_numeric($d) && $d >= 13 && $d <= 24)
            ->where('prefill.etMm', fn ($et) => is_int($et))
            ->where('prefill.tyreWidth', fn ($tw) => is_int($tw) && $tw >= 135)
            ->where('prefill.aspect', fn ($a) => is_int($a) && $a >= 25)
            ->where('state', null)
        )
        ->viewData('page')['props']['prefill'];

    $home = $this->withCookies($cookies)->get('/')->viewData('page')['props']['calculator']['prefill'];

    expect($home)->toBe($prefill);
});

it('parses a shared comparison so the first paint already shows it', function (): void {
    $this->get('/felgenrechner?rechner='.RECHNER_EXAMPLE)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('state.current.widthIn', 7.5)
            // Whole-number floats arrive as integers through JSON; 7.5 stays a float.
            ->where('state.current.diameterIn', 17)
            ->where('state.current.etMm', 45)
            ->where('state.current.tyreWidthMm', 225)
            ->where('state.current.aspect', 45)
            ->where('state.next.widthIn', 8.5)
            ->where('state.next.diameterIn', 19)
            ->where('state.next.etMm', 35)
            ->where('state.next.tyreWidthMm', 225)
            ->where('state.next.aspect', 35)
        );

    // A whole-number width and a negative ET.
    $this->get('/felgenrechner?rechner=8x17--10-225-45_8x17--20-225-45')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('state.current.widthIn', 8)
            ->where('state.current.etMm', -10)
            ->where('state.next.etMm', -20)
        );
});

it('shows the defaults, never an error page, for a link the form could not have produced', function (string $query): void {
    $this->get('/felgenrechner?'.$query)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Felgenrechner/Desktop')->where('state', null));
})->with([
    'garbage' => ['rechner=unsinn'],
    'old format' => ['rechner=7.5-17-45-225-45_8.5-19-35-225-35'],
    'one side' => ['rechner=7.5x17-45-225-45'],
    'width not offered' => ['rechner=7.3x17-45-225-45_8.5x19-35-225-35'],
    'ET above 70' => ['rechner=7.5x17-71-225-45_8.5x19-35-225-35'],
    'ET below -30' => ['rechner=7.5x17--31-225-45_8.5x19-35-225-35'],
    'tyre width not in tens' => ['rechner=7.5x17-45-226-45_8.5x19-35-225-35'],
    'aspect not in fives' => ['rechner=7.5x17-45-225-45_8.5x19-35-225-36'],
    'diameter 25' => ['rechner=7.5x25-45-225-45_8.5x19-35-225-35'],
    'an array' => ['rechner[]=7.5x17-45-225-45_8.5x19-35-225-35'],
    'empty' => ['rechner='],
]);

it('keeps the header mode of a plain page', function (): void {
    $this->get('/felgenrechner')
        ->assertInertia(fn (AssertableInertia $page) => $page->where('headerMode', 'PLAIN')->where('vehicle', null));
});
