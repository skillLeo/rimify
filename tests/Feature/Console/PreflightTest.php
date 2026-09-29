<?php

declare(strict_types=1);

use App\Payments\StripeKeys;
use App\Providers\AppServiceProvider;
use Illuminate\Support\Facades\Http;

/**
 * rimify:preflight's go-live rows (the launch release §5): a production started with APP_DEBUG=true
 * is switched off at boot and fails the preflight until .env is corrected; the renderer, the mail
 * and the payment driver each have a row; the storage rows are covered by S3AuditTest.
 */
afterEach(function (): void {
    app()->forgetInstance(AppServiceProvider::DEBUG_WAS_ON);
    app()->forgetInstance(StripeKeys::REFUSED);
    app()['env'] = 'testing';
});

it('never uses a live Stripe key from .env outside production, and fails the preflight on it', function (): void {
    $live = 'sk_'.'live_'.str_repeat('Ab3', 8);
    config(['services.stripe.mode' => 'live', 'services.stripe.secret' => $live]);

    StripeKeys::enforce(app());

    expect(config('services.stripe.secret'))->toBeNull()
        ->and(app(StripeKeys::REFUSED))->toHaveKey('secret');

    Http::fake(['*/health' => Http::response('OK')]);
    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('STRIPE_SECRET: Live-Schlüssel nimmt RIMIFY nur im Live-Shop an')
        ->doesntExpectOutputToContain($live)
        ->assertFailed();
});

it('keeps a test key from .env in Testmodus', function (): void {
    $test = 'sk_'.'test_'.str_repeat('Ab3', 8);
    config(['services.stripe.mode' => 'test', 'services.stripe.secret' => $test]);

    StripeKeys::enforce(app());

    expect(config('services.stripe.secret'))->toBe($test)
        ->and(app()->bound(StripeKeys::REFUSED))->toBeFalse();
});

it('never lets a production run with debug on, and fails the preflight until .env says false', function (): void {
    app()['env'] = 'production';
    config(['app.debug' => true]);

    AppServiceProvider::enforceNoDebugInProduction(app());

    expect(config('app.debug'))->toBeFalse()
        ->and(app()->bound(AppServiceProvider::DEBUG_WAS_ON))->toBeTrue();

    Http::fake(['*/health' => Http::response('OK')]);
    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('APP_DEBUG=true in .env')
        ->assertFailed();
});

it('leaves debug alone outside production', function (): void {
    config(['app.debug' => true]);

    AppServiceProvider::enforceNoDebugInProduction(app());

    expect(config('app.debug'))->toBeTrue()->and(app()->bound(AppServiceProvider::DEBUG_WAS_ON))->toBeFalse();
});

it('refuses a production that writes its mail to the log, runs the sandbox or has no renderer', function (): void {
    app()['env'] = 'production';
    config([
        'app.debug' => false,
        'app.url' => 'https://rimify.de',
        'mail.default' => 'log',
        'rimify.payments.driver' => 'sandbox',
        'inertia.ssr.enabled' => true,
        'inertia.ssr.url' => 'http://127.0.0.1:13714',
    ]);
    Http::fake(['*/health' => Http::response('', 503)]);

    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('MAIL_MAILER=log')
        ->expectsOutputToContain('RIMIFY_PAYMENTS=sandbox im Live-Shop')
        ->expectsOutputToContain('Renderer antwortet nicht')
        ->assertFailed();
});

it('names the sender domain when mail goes out from another one', function (): void {
    config(['app.url' => 'https://rimify.de', 'mail.default' => 'smtp', 'mail.from.address' => 'shop@example.com']);
    Http::fake(['*/health' => Http::response('OK')]);

    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('nicht die Domain von rimify.de');
});
