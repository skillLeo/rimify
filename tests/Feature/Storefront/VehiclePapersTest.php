<?php

declare(strict_types=1);

use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Storefront\PapersBook;
use App\Domain\Storefront\VehicleContext;
use App\Models\Vehicle;
use App\Support\GermanFormat;
use Database\Seeders\AccessSeeder;
use Database\Seeders\CommerceSeeder;
use Database\Seeders\ContentSeeder;
use Database\Seeders\KomplettradOptionsSeeder;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Http\Request;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Symfony\Component\HttpFoundation\Cookie;
use Tests\Support\Storefront\KomplettradFixture;

/**
 * Block C, item 10: the figures from the customer's papers, kept per car in one cookie and read by every
 * surface through the one vehicle repository (the second review of C9, §5).
 */
function papersCookie(TestResponse $response): ?Cookie
{
    foreach ($response->headers->getCookies() as $cookie) {
        if ($cookie->getName() === PapersBook::COOKIE) {
            return $cookie;
        }
    }

    return null;
}

/** @return array<string, int> */
function papersPost(int $front = 1100, int $rear = 1100, int $speed = 250): array
{
    return ['axle_front_kg' => $front, 'axle_rear_kg' => $rear, 'top_speed_kmh' => $speed];
}

it('keeps the figures in one cookie keyed by the car: Lax, HttpOnly, a year, not encrypted', function (): void {
    $vehicle = Vehicle::factory()->create();

    $response = $this->from('/felgen')->post("/fahrzeug/{$vehicle->id}/papiere", papersPost())
        ->assertRedirect('/felgen')
        ->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Werte übernommen.');

    $cookie = papersCookie($response);

    expect($cookie)->not->toBeNull()
        ->and($cookie?->getValue())->toBe("{$vehicle->id}.1100.1100.250")
        ->and($cookie?->isHttpOnly())->toBeTrue()
        ->and($cookie?->getSameSite())->toBe('lax')
        ->and($cookie?->getPath())->toBe('/')
        // Secure is set in production only; this is the test environment.
        ->and($cookie?->isSecure())->toBeFalse()
        ->and($cookie?->getExpiresTime())->toBeGreaterThan(now()->addDays(364)->getTimestamp())
        ->and($cookie?->getExpiresTime())->toBeLessThanOrEqual(now()->addDays(366)->getTimestamp());
});

it('sets Secure on the cookie in production', function (): void {
    $vehicle = Vehicle::factory()->create();
    app()->detectEnvironment(static fn (): string => 'production');

    // Outside the test environment the CSRF check no longer stands aside; it is not what this test is about.
    $cookie = papersCookie($this->withoutMiddleware(PreventRequestForgery::class)->post("/fahrzeug/{$vehicle->id}/papiere", papersPost()));

    app()->detectEnvironment(static fn (): string => 'testing');

    expect($cookie?->isSecure())->toBeTrue();
});

it('adds a second car beside the first, and forgets one without the other', function (): void {
    [$a, $b] = Vehicle::factory()->count(2)->create()->all();

    $first = papersCookie($this->post("/fahrzeug/{$a->id}/papiere", papersPost()));
    $second = papersCookie($this->withUnencryptedCookie(PapersBook::COOKIE, (string) $first?->getValue())
        ->post("/fahrzeug/{$b->id}/papiere", papersPost(980, 1010, 210)));

    expect($second?->getValue())->toBe("{$b->id}.980.1010.210_{$a->id}.1100.1100.250");

    $removed = $this->withUnencryptedCookie(PapersBook::COOKIE, (string) $second?->getValue())
        ->delete("/fahrzeug/{$b->id}/papiere")
        ->assertSessionHas('toast', 'Werte gelöscht.');

    expect(papersCookie($removed)?->getValue())->toBe("{$a->id}.1100.1100.250");

    // The last car gone, the cookie goes too.
    $gone = $this->withUnencryptedCookie(PapersBook::COOKIE, "{$a->id}.1100.1100.250")->delete("/fahrzeug/{$a->id}/papiere");

    expect(papersCookie($gone)?->getExpiresTime())->toBeLessThan(time());
});

it('refuses, in words, every figure that is not a whole number a road car can have', function (array $post, string $field, string $message): void {
    $vehicle = Vehicle::factory()->create();

    $response = $this->post("/fahrzeug/{$vehicle->id}/papiere", [...papersPost(), ...$post])
        ->assertSessionHasErrorsIn('papiere', [$field => $message]);

    expect(papersCookie($response))->toBeNull();
})->with([
    '99.999 kg' => [['axle_front_kg' => 99_999], 'axle_front_kg', 'Eine zulässige Achslast liegt zwischen 300 und 4.000 kg. Sieh bitte noch einmal in Feld 8.1 nach.'],
    'zero' => [['axle_rear_kg' => 0], 'axle_rear_kg', 'Eine zulässige Achslast liegt zwischen 300 und 4.000 kg. Sieh bitte noch einmal in Feld 8.2 nach.'],
    'negative' => [['axle_front_kg' => -1100], 'axle_front_kg', 'Eine zulässige Achslast liegt zwischen 300 und 4.000 kg. Sieh bitte noch einmal in Feld 8.1 nach.'],
    'a fraction' => [['axle_front_kg' => '1100.5'], 'axle_front_kg', 'Bitte nur die Zahl in Kilogramm, ohne Punkt und Komma.'],
    'a German thousands dot' => [['axle_rear_kg' => '1.100'], 'axle_rear_kg', 'Bitte nur die Zahl in Kilogramm, ohne Punkt und Komma.'],
    'a word' => [['top_speed_kmh' => 'schnell'], 'top_speed_kmh', 'Bitte nur die Zahl in km/h, ohne Punkt und Komma.'],
    'too fast' => [['top_speed_kmh' => 500], 'top_speed_kmh', 'Eine Höchstgeschwindigkeit liegt zwischen 60 und 420 km/h. Sieh bitte noch einmal in Feld T nach.'],
    'missing' => [['axle_front_kg' => ''], 'axle_front_kg', 'Trag die zulässige Achslast aus Feld 8.1 ein.'],
]);

it('takes no figures for a car the shop no longer offers', function (): void {
    $vehicle = Vehicle::factory()->create();
    $vehicle->delete();

    $this->post("/fahrzeug/{$vehicle->id}/papiere", papersPost())->assertNotFound();
});

it('answers the tyre half from the typed figures on every surface, and never in the admin panel', function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(KomplettradOptionsSeeder::class);
    $fixture = KomplettradFixture::permitted();

    // The car the fixture found, now without its legal data: the tyre half waits for the papers.
    Vehicle::query()->whereKey($fixture->vehicle->id)->update(['axle_load_front_kg' => null, 'axle_load_rear_kg' => null, 'max_speed_kmh' => null, 'needs_review' => true]);
    $resolve = fn () => app(FitmentResolver::class)->resolve((int) $fixture->vehicle->id, (int) $fixture->config->id);
    $as = function (string $path, ?string $papers): void {
        $this->app->instance('request', Request::create($path, 'GET', [], $papers === null ? [] : [PapersBook::COOKIE => $papers]));
    };

    $as('/felgen', null);
    expect($resolve()->tyre?->fromVehicleData)->toBeFalse();

    $as('/felgen', "{$fixture->vehicle->id}.1100.1100.200");
    $verdict = $resolve();
    expect($verdict->tyre?->fromVehicleData)->toBeTrue()
        ->and($verdict->tyre?->lines)->toContain('Vorderachse: 1.100'.GermanFormat::NBSP.'kg ÷ 2 = 550'.GermanFormat::NBSP.'kg je Rad.')
        ->and(app(VehicleRepository::class)->find((int) $fixture->vehicle->id)?->maxSpeedKmh)->toBe(200);

    // Another car's figures answer nothing for this one.
    $as('/felgen', '999999.1100.1100.200');
    expect($resolve()->tyre?->fromVehicleData)->toBeFalse();

    // The admin panel reads the vehicle data, whatever the browser holds.
    $as('/admin/gutachten/1', "{$fixture->vehicle->id}.1100.1100.200");
    expect($resolve()->tyre?->fromVehicleData)->toBeFalse();
});

it('shows the typed figures with the car, and says where the vehicle data asks for more', function (): void {
    $this->seed(CommerceSeeder::class);
    $this->seed(AccessSeeder::class);
    $this->seed(ContentSeeder::class);
    $vehicle = Vehicle::factory()->create(['axle_load_front_kg' => 1100, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 250]);

    $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($vehicle->id, true))->encode()])
        ->withUnencryptedCookie(PapersBook::COOKIE, "{$vehicle->id}.1050.1100.250")
        ->get('/felgenrechner')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('vehicle.papers.axleFrontKg', 1050)
            ->where('vehicle.papers.axleRearKg', 1100)
            ->where('vehicle.papers.topSpeedKmh', 250)
            ->where('vehicle.papers.notes', [
                'Für die Vorderachse rechnen wir mit 1.100'.GermanFormat::NBSP.'kg aus unseren Fahrzeugdaten – mehr als deine 1.050'.GermanFormat::NBSP.'kg aus Feld 8.1. So bist du auf der sicheren Seite.',
            ])
        );
});
