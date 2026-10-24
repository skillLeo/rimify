<?php

declare(strict_types=1);

use App\Http\Middleware\E2eToday;
use App\Models\Setting;
use App\Services\Demo\DemoTables;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Route;

/*
 * D-337, the operator's decision of 24.10.2026: a browser spec that reads figures by the day („the last 30 days“) asks
 * the server to answer as on the demo set's last day, so it never breaks because the calendar moved — UEB-02 broke when
 * the demo data grew a month old. Never on a server that is not a developer's or the test run's, never without the
 * suite's own flag, and never dating a cookie on the frozen day.
 */

beforeEach(function (): void {
    Route::middleware('web')->get('/__e2e-today', static fn (): string => CarbonImmutable::now('Europe/Berlin')->format('Y-m-d H:i'));
});

it('answers as on the day the request names, at noon in Berlin, where the suite turned it on @d-337', function (): void {
    config(['rimify.e2e_clock' => true]);

    $this->get('/__e2e-today', [E2eToday::HEADER => '2026-09-27'])->assertOk()->assertSeeText('2026-09-27 12:00');

    // Set back once answered: nothing after the request runs on the frozen day.
    expect(CarbonImmutable::hasTestNow())->toBeFalse();
});

it('answers on the real day without the suite\'s flag, and for a day that is no day @d-337', function (): void {
    $today = CarbonImmutable::now('Europe/Berlin')->format('Y-m-d');

    // Off, as on every server (tests/env.php pins RIMIFY_E2E_CLOCK=off).
    $this->get('/__e2e-today', [E2eToday::HEADER => '2026-09-27'])->assertOk()->assertSeeText($today);

    config(['rimify.e2e_clock' => true]);

    foreach (['27.09.2026', '2026-02-30', 'gestern'] as $day) {
        $this->get('/__e2e-today', [E2eToday::HEADER => $day])->assertOk()->assertSeeText($today);
    }
});

it('is never allowed outside a developer\'s machine and the test run, whatever the flag says @d-337', function (string $environment, bool $allowed): void {
    config(['rimify.e2e_clock' => true]);
    app()->detectEnvironment(static fn (): string => $environment);

    expect(E2eToday::allowed())->toBe($allowed);
})->with([
    'production' => ['production', false],
    'the preview' => ['staging', false],
    'a developer\'s machine' => ['local', true],
    'the test run' => ['testing', true],
]);

it('never dates the session\'s cookie on the frozen day: a sign-in outlives a day long past @d-337', function (): void {
    config(['rimify.e2e_clock' => true]);

    $response = $this->get('/__e2e-today', [E2eToday::HEADER => '2020-01-01'])->assertOk()->assertSeeText('2020-01-01 12:00');
    $session = collect($response->headers->getCookies())->first(static fn ($cookie): bool => $cookie->getName() === config('session.cookie'));

    expect($session)->not->toBeNull()
        ->and($session->getExpiresTime())->toBeGreaterThan(time());
});

it('prints the demo set\'s last day for the suite, and fails where none is in place @d-337', function (): void {
    Setting::query()->whereKey(DemoTables::SETTING)->delete();

    $this->artisan('demo:anchor')->assertFailed();

    Setting::set(DemoTables::SETTING, ['anchor' => '2026-09-27', 'scale' => 1.0, 'seed' => 1]);

    $this->artisan('demo:anchor')->expectsOutput('2026-09-27')->assertSuccessful();
});
