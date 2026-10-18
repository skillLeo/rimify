<?php

declare(strict_types=1);

use App\Domain\Fitment\Contracts\VehicleRepository;
use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Storefront\PapersBook;
use App\Domain\Storefront\VehicleContext;
use App\Http\Requests\Storefront\VehiclePapersRequest;
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
    'a fraction' => [['axle_front_kg' => '1100.5'], 'axle_front_kg', 'Bitte nur die ganze Zahl in Kilogramm, zum Beispiel 1.160.'],
    'a decimal comma' => [['axle_rear_kg' => '1100,5'], 'axle_rear_kg', 'Bitte nur die ganze Zahl in Kilogramm, zum Beispiel 1.160.'],
    'a word' => [['top_speed_kmh' => 'schnell'], 'top_speed_kmh', 'Bitte nur die ganze Zahl in km/h, zum Beispiel 250.'],
    'too fast' => [['top_speed_kmh' => 500], 'top_speed_kmh', 'Eine Höchstgeschwindigkeit liegt zwischen 60 und 420 km/h. Sieh bitte noch einmal in Feld T nach.'],
    // Asked for, it must come (D-291).
    'missing where asked' => [['axle_front_kg' => '', 'asked' => ['8.1', '8.2', 'T']], 'axle_front_kg', 'Trag die zulässige Achslast aus Feld 8.1 ein.'],
    'T missing where asked' => [['top_speed_kmh' => '', 'asked' => ['T']], 'top_speed_kmh', 'Trag die Höchstgeschwindigkeit aus Feld T ein.'],
]);

// The fields are text fields now (D-290): a German writes 1160 kg as „1.160“, and that is what it is.
it('reads a German thousands dot or space as the thousands it is', function (): void {
    $vehicle = Vehicle::factory()->create();

    $kept = papersCookie($this->post("/fahrzeug/{$vehicle->id}/papiere", ['axle_front_kg' => '1.160', 'axle_rear_kg' => '1 210', 'top_speed_kmh' => ' 250 ']));

    expect($kept?->getValue())->toBe("{$vehicle->id}.1160.1210.250");
});

/*
 * D-291: the form asks for what the answer is missing and shows the rest. What it sends it sets — an emptied field is no
 * longer given —, what it does not send stays as the customer gave it before, and an all-empty save is refused.
 */
it('takes T alone where only T is asked, and keeps what the customer gave before', function (): void {
    $vehicle = Vehicle::factory()->create();

    $alone = papersCookie($this->post("/fahrzeug/{$vehicle->id}/papiere", ['asked' => ['T'], 'top_speed_kmh' => '250']));
    expect($alone?->getValue())->toBe("{$vehicle->id}.-.-.250");

    // 8.1 and 8.2 given before, T asked now: they stay.
    $kept = papersCookie($this->withUnencryptedCookie(PapersBook::COOKIE, "{$vehicle->id}.1100.1180.-")
        ->post("/fahrzeug/{$vehicle->id}/papiere", ['asked' => ['T'], 'top_speed_kmh' => '240']));
    expect($kept?->getValue())->toBe("{$vehicle->id}.1100.1180.240");

    // One axle where the data knows the other — another car, so the cookie above answers nothing for it.
    $other = Vehicle::factory()->create();
    $rear = papersCookie($this->post("/fahrzeug/{$other->id}/papiere", ['asked' => ['8.2'], 'axle_rear_kg' => '1180']));
    expect($rear?->getValue())->toStartWith("{$other->id}.-.1180.-");
});

it('lets go of a figure whose field was emptied, keeps one it was not shown, and refuses a save with nothing in it', function (): void {
    $vehicle = Vehicle::factory()->create(['power_kw' => null]);
    $before = "{$vehicle->id}.1100.1180.250.140.p91W.p94Y";

    // T emptied, P.2 and 15.1/15.2 emptied; 8.1 and 8.2 not sent (shown as known): they stay.
    $emptied = papersCookie($this->withUnencryptedCookie(PapersBook::COOKIE, $before)
        ->post("/fahrzeug/{$vehicle->id}/papiere", ['top_speed_kmh' => '', 'power_kw' => '', 'index_front' => '', 'index_rear' => '', 'axle_front_kg' => '1120']));
    expect($emptied?->getValue())->toBe("{$vehicle->id}.1120.1180.-");

    // Nothing in any field it sent: refused on the first of them, in words, and nothing kept as nothing.
    $nothing = $this->withUnencryptedCookie(PapersBook::COOKIE, $before)
        ->post("/fahrzeug/{$vehicle->id}/papiere", ['top_speed_kmh' => '', 'index_front' => '', 'index_rear' => ''])
        ->assertSessionHasErrorsIn('papiere', ['top_speed_kmh' => 'Trag die Höchstgeschwindigkeit aus Feld T ein.']);
    expect(papersCookie($nothing))->toBeNull();

    // Nothing but 15.1 and 15.2 shown — our data holds every figure —, and both empty: said under 15.1, where the form
    // can show it (the interaction review of D-291) — with figures of the customer's on record, how to delete them too.
    $this->withUnencryptedCookie(PapersBook::COOKIE, $before)
        ->post("/fahrzeug/{$vehicle->id}/papiere", ['index_front' => '', 'index_rear' => ''])
        ->assertSessionHasErrorsIn('papiere', ['index_front' => VehiclePapersRequest::NOTHING_GIVEN.' '.VehiclePapersRequest::DELETE_ALL]);

    // Another car, nothing of the customer's on record: only what to type, or how to leave.
    $other = Vehicle::factory()->create();
    $this->post("/fahrzeug/{$other->id}/papiere", ['index_front' => '', 'index_rear' => ''])
        ->assertSessionHasErrorsIn('papiere', ['index_front' => VehiclePapersRequest::NOTHING_GIVEN]);

    // An answer that asks for nothing is not a way round the fields: „asked“ names only fields of the papers.
    $this->post("/fahrzeug/{$vehicle->id}/papiere", ['asked' => ['X'], 'top_speed_kmh' => '250'])
        ->assertSessionHasErrorsIn('papiere', ['asked.0']);
});

it('keeps P.2 where it is given, and refuses one no car has', function (): void {
    $vehicle = Vehicle::factory()->create(['power_kw' => null]);

    $kept = papersCookie($this->post("/fahrzeug/{$vehicle->id}/papiere", [...papersPost(), 'power_kw' => 140]));
    expect($kept?->getValue())->toBe("{$vehicle->id}.1100.1100.250.140");

    $this->post("/fahrzeug/{$vehicle->id}/papiere", [...papersPost(), 'power_kw' => 5000])
        ->assertSessionHasErrorsIn('papiere', ['power_kw' => 'Die Leistung liegt zwischen 10 und 1.000 kW. Sieh bitte noch einmal in Feld P.2 nach – die erste Zahl vor dem Schrägstrich.']);
});

it('keeps 15.1 and 15.2 where both are given, and refuses one alone or one it cannot read, in words', function (): void {
    $vehicle = Vehicle::factory()->create();

    $kept = papersCookie($this->post("/fahrzeug/{$vehicle->id}/papiere", [...papersPost(), 'index_front' => '225/40 R19 91W', 'index_rear' => '255/35 ZR19 (96Y)']));
    expect($kept?->getValue())->toBe("{$vehicle->id}.1100.1100.250.p91W.p96Yx");

    $alone = $this->post("/fahrzeug/{$vehicle->id}/papiere", [...papersPost(), 'index_front' => '225/40 R19 91W'])
        ->assertSessionHasErrorsIn('papiere', ['index_rear' => 'Trag auch Feld 15.2 ein – vorn und hinten gehören zusammen, auch wenn beide gleich sind.']);
    expect(papersCookie($alone))->toBeNull();

    $unread = $this->post("/fahrzeug/{$vehicle->id}/papiere", [...papersPost(), 'index_front' => '225/40 R19', 'index_rear' => '225/40 R19 91W'])
        ->assertSessionHasErrorsIn('papiere', ['index_front' => 'Trag aus Feld 15.1 die Reifenangabe so ein, wie sie dort steht – zum Beispiel 225/45 R17 91W. Wir brauchen die Zahl und den Buchstaben am Ende.']);
    expect(papersCookie($unread))->toBeNull();

    // Neither given: the figures are kept without them, as before.
    expect(papersCookie($this->post("/fahrzeug/{$vehicle->id}/papiere", [...papersPost(), 'index_front' => '', 'index_rear' => '']))?->getValue())
        ->toBe("{$vehicle->id}.1100.1100.250");

    // Emptied where they were given (D-291): they go.
    expect(papersCookie($this->withUnencryptedCookie(PapersBook::COOKIE, "{$vehicle->id}.1100.1100.250.p91W.p94Y")
        ->post("/fahrzeug/{$vehicle->id}/papiere", [...papersPost(), 'index_front' => '', 'index_rear' => '']))?->getValue())
        ->toBe("{$vehicle->id}.1100.1100.250");
});

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
    $vehicle = Vehicle::factory()->create(['axle_load_front_kg' => 1100, 'axle_load_rear_kg' => 1000, 'max_speed_kmh' => 250, 'power_kw' => 135]);

    $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($vehicle->id, true))->encode()])
        ->withUnencryptedCookie(PapersBook::COOKIE, "{$vehicle->id}.1050.1100.250.p91W.p95Yx")
        ->get('/felgenrechner')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            // The power a photographed P.2 is checked against.
            ->where('vehicle.powerKw', 135)
            ->where('vehicle.papers.axleFrontKg', 1050)
            ->where('vehicle.papers.axleRearKg', 1100)
            ->where('vehicle.papers.topSpeedKmh', 250)
            // 15.1 and 15.2 as the papers print them (D-242).
            ->where('vehicle.papers.index', ['front' => '91W', 'rear' => '(95Y)'])
            ->where('vehicle.papers.notes', [
                'Für die Vorderachse rechnen wir mit 1.100'.GermanFormat::NBSP.'kg aus unseren Fahrzeugdaten – mehr als deine 1.050'.GermanFormat::NBSP.'kg aus Feld 8.1. So bist du auf der sicheren Seite.',
            ])
            // What our data holds, for the form to show beside what it asks (D-291).
            ->where('vehicle.figures', ['axleFrontKg' => 1100, 'axleRearKg' => 1000, 'topSpeedKmh' => 250])
        );

    // T alone given: the other two are null, and no note compares a figure the customer did not give.
    $this->withCookies([VehicleContext::COOKIE => (new VehicleContext($vehicle->id, true))->encode()])
        ->withUnencryptedCookie(PapersBook::COOKIE, "{$vehicle->id}.-.-.240")
        ->get('/felgenrechner')
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('vehicle.papers.axleFrontKg', null)
            ->where('vehicle.papers.topSpeedKmh', 240)
            ->where('vehicle.papers.notes', [
                'Als Höchstgeschwindigkeit rechnen wir mit 250'.GermanFormat::NBSP.'km/h aus unseren Fahrzeugdaten – mehr als deine 240'.GermanFormat::NBSP.'km/h aus Feld T. So bist du auf der sicheren Seite.',
            ])
        );
});
