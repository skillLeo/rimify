<?php

declare(strict_types=1);

use App\Enums\CatalogueStatus;
use App\Models\Brand;
use App\Models\Setting;
use App\Models\WheelModel;
use App\Payments\Stripe\StripeGateway;
use App\Payments\StripeKeys;
use App\Providers\AppServiceProvider;
use App\Support\ScheduleBeat;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\Support\FakeStripe;

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

/*
 * Block G §8: the rows the live shop cannot open without — the seller's data, shipping and delivery time, the legal
 * texts, GPSR per brand on sale — fail in production and warn elsewhere; the engine, the scheduler's pulse, the
 * invoices' private storage, the Stripe webhook and the code's freedom from credentials each have a row.
 */
it('refuses a production without the seller, shipping and delivery time, the legal texts or a brand’s manufacturer', function (): void {
    $brand = Brand::factory()->create(['name' => 'Ohneangaben']);
    WheelModel::factory()->create(['brand_id' => $brand->id, 'status' => CatalogueStatus::Published->value, 'is_demo' => false]);
    app()['env'] = 'production';
    config([
        'app.debug' => false, 'app.url' => 'https://rimify.de', 'mail.default' => 'smtp', 'mail.from.address' => 'shop@rimify.de',
        'rimify.seller' => ['name' => null, 'street' => null, 'zip' => null, 'city' => null, 'email' => null, 'vat_id' => null, 'tax_number' => null, 'register' => null],
        'rimify.shipping.cost_cents' => null, 'rimify.shipping.delivery_time' => null,
    ]);
    Http::fake(['*/health' => Http::response('OK')]);

    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain('Verkäuferangaben')
        ->expectsOutputToContain('fehlt: Versandkosten, Lieferzeit')
        ->expectsOutputToContain('noch Platzhalter')
        ->expectsOutputToContain('fehlen für: Ohneangaben')
        ->expectsOutputToContain('nicht eröffnet – jede Rechnung ist eine Testrechnung')
        ->assertFailed();
});

it('names the database engine and the scheduler’s pulse, keeps the invoices private and finds no credential in the code', function (): void {
    Setting::set(ScheduleBeat::SETTING, now()->subSeconds(30)->getTimestamp());
    Http::fake(['*/health' => Http::response('OK')]);
    $version = (string) DB::selectOne('SELECT VERSION() AS v')->v;

    $this->artisan('rimify:preflight', ['--skip-s3' => true])
        ->expectsOutputToContain($version)
        ->expectsOutputToContain('zuletzt vor')
        ->expectsOutputToContain('privat (invoices/)')
        ->expectsOutputToContain('keines gefunden');
});

it('says when the scheduler has never run', function (): void {
    Http::fake(['*/health' => Http::response('OK')]);

    $this->artisan('rimify:preflight', ['--skip-s3' => true])->expectsOutputToContain('noch nie gelaufen');
});

/*
 * Both pulse tests run on a stopped clock: read twice from a running one, a second could turn between the pulse and
 * the reading — CI on MariaDB, 02.10.2026, got 121 for 120.
 */
it('writes the scheduler’s pulse on every run of the cron line', function (): void {
    $this->freezeSecond();
    expect(ScheduleBeat::secondsAgo())->toBeNull();

    $this->artisan('schedule:run')->assertSuccessful();

    expect(ScheduleBeat::secondsAgo())->toBe(0);
});

it('keeps the scheduler’s pulse where a deploy’s cache clear cannot reach it', function (): void {
    $this->freezeSecond();
    ScheduleBeat::record();
    $this->travel(2)->minutes();
    Cache::flush();

    expect(ScheduleBeat::secondsAgo())->toBe(120);
});

it('checks that Stripe sends every event the shop acts on to its webhook address', function (): void {
    config(['rimify.payments.driver' => 'stripe', 'services.stripe.mode' => 'test', 'services.stripe.key' => 'pk_test_fakeKey', 'services.stripe.secret' => 'sk_test_fakeKey', 'services.stripe.webhook_secret' => 'whsec_test_fake']);
    $stripe = FakeStripe::install();
    Http::fake(['*/health' => Http::response('OK')]);

    try {
        $this->artisan('rimify:preflight', ['--skip-s3' => true])->expectsOutputToContain('Kein Webhook-Endpunkt');

        $stripe->webhooks = [['id' => 'we_1', 'object' => 'webhook_endpoint', 'url' => route('webhooks.payment', ['provider' => 'stripe']), 'status' => 'enabled', 'enabled_events' => ['payment_intent.succeeded']]];
        $this->artisan('rimify:preflight', ['--skip-s3' => true])->expectsOutputToContain('Stripe schickt diese Ereignisse nicht: payment_intent.processing');

        $stripe->webhooks[0]['enabled_events'] = StripeGateway::EVENTS;
        $this->artisan('rimify:preflight', ['--skip-s3' => true])
            ->expectsOutputToContain('Stripe im Testmodus')
            ->doesntExpectOutputToContain('Kein Webhook-Endpunkt')
            ->doesntExpectOutputToContain('Ereignisse nicht');
    } finally {
        FakeStripe::uninstall();
    }
});
