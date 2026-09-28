<?php

declare(strict_types=1);

use App\Providers\AppServiceProvider;
use Illuminate\Support\Facades\Http;

/**
 * rimify:preflight's go-live rows (the launch release §5): a production started with APP_DEBUG=true
 * is switched off at boot and fails the preflight until .env is corrected; the renderer, the mail
 * and the payment driver each have a row; the storage rows are covered by S3AuditTest.
 */
afterEach(function (): void {
    app()->forgetInstance(AppServiceProvider::DEBUG_WAS_ON);
    app()['env'] = 'testing';
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
