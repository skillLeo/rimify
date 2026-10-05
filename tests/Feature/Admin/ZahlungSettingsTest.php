<?php

declare(strict_types=1);

use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\PaymentSetting;
use App\Payments\PaymentConfig;
use App\Payments\Payments;
use App\Payments\Stripe\StripeGateway;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\Support\FakeStripe;

/*
 * Block G: Einstellungen › Zahlung, as Medien und Speicher — the Super-Admin alone, behind the password once more;
 * the keys encrypted at rest and write-only (their last four characters are all that comes back); every change
 * in the Protokoll with last fours only; the mode refusing the wrong kind of key; „Verbindung testen“ naming the
 * account or Stripe's own error. Stripe is FakeStripe.
 */

const ZAHLUNG_URL = '/admin/einstellungen/zahlung';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['services.stripe.key' => null, 'services.stripe.secret' => null, 'services.stripe.webhook_secret' => null, 'rimify.payments.driver' => 'stripe']);
    $this->stripe = FakeStripe::install();
});

afterEach(fn () => FakeStripe::uninstall());

function zahlungAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return array<string, mixed> */
function zahlungForm(array $over = []): array
{
    return ['mode' => 'test', 'publishable_key' => 'pk_test_fakeKeyA1b2', 'secret_key' => 'sk_test_fakeKeyC3d4', 'webhook_secret' => 'whsec_test_fakeE5f6', ...$over];
}

function zahlungSave(array $form): TestResponse
{
    return test()->actingAs(zahlungAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from(ZAHLUNG_URL)->put(ZAHLUNG_URL, $form);
}

it('refuses every role but the Super-Admin, and asks the Super-Admin for the password first', function (string $role): void {
    DB::table('role_permissions')->updateOrInsert(
        ['role_id' => DB::table('roles')->where('name', $role)->value('id'), 'module' => 'settings', 'action' => 'edit'],
        ['allowed' => true],
    );

    $this->actingAs(zahlungAdmin($role), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get(ZAHLUNG_URL)->assertForbidden();
    $this->actingAs(zahlungAdmin($role), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->put(ZAHLUNG_URL, zahlungForm())->assertForbidden();
    // A fresh session: the requests above carried a confirmed password.
    $this->flushSession();
    $this->actingAs(zahlungAdmin(), 'admin')->get(ZAHLUNG_URL)->assertRedirect('/admin/bestaetigen?weiter='.rawurlencode(ZAHLUNG_URL));

    expect(PaymentSetting::query()->count())->toBe(0);
})->with(['catalogue-manager', 'accountant']);

it('stores the keys encrypted, shows them as their last four only, and puts them in force before .env', function (): void {
    config(['services.stripe.secret' => 'sk_test_fromEnvZZ99', 'services.stripe.key' => 'pk_test_fromEnvZZ99', 'services.stripe.webhook_secret' => 'whsec_test_envZZ99']);

    zahlungSave(zahlungForm())->assertRedirect(ZAHLUNG_URL)->assertSessionHasNoErrors();

    $raw = DB::table('payment_settings')->first();

    expect($raw->secret_key)->not->toContain('sk_test_')->not->toContain('fakeKeyC3d4')
        ->and(decrypt($raw->secret_key, false))->toBe('sk_test_fakeKeyC3d4')
        ->and($raw->secret_last4)->toBe('C3d4')
        ->and(PaymentConfig::current()->summary())->toMatchArray(['source' => 'Einstellungen', 'mode' => 'test', 'secret' => 'C3d4', 'complete' => true])
        ->and(Payments::gateway())->toBeInstanceOf(StripeGateway::class);

    $this->actingAs(zahlungAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get(ZAHLUNG_URL)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page->component('Admin/Einstellungen/Zahlung')
            ->where('secretMasked', '••••C3d4')
            ->where('publishableMasked', '••••A1b2')
            ->where('webhookMasked', '••••E5f6')
            ->where('inForce.source', 'Einstellungen'))
        ->assertDontSee('sk_test_fakeKeyC3d4')
        ->assertDontSee('fakeKeyC3d4');
});

// The operator's brief of 05.10.2026, §7: no real payment while a check of „Recht und Pflichtangaben" fails — named on
// this page, each with the place where it is closed. A fresh database holds no seller and no legal text.
it('names the legal checks that keep real payments shut, each with where it is closed', function (): void {
    $this->actingAs(zahlungAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get(ZAHLUNG_URL)
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('liveBlockedBy', fn ($checks): bool => collect($checks)->pluck('id')->contains('impressum')
                && collect($checks)->firstWhere('id', 'impressum')['place'] === '/admin/einstellungen/verkaeufer-versand'
                && collect($checks)->every(fn (array $c): bool => $c['title'] !== '' && $c['sentence'] !== ''))
            ->where('liveBlockedBy', fn ($checks): bool => ! collect($checks)->pluck('id')->contains('mwst')));
});

it('keeps a stored key when its field is left empty', function (): void {
    zahlungSave(zahlungForm())->assertSessionHasNoErrors();
    zahlungSave(zahlungForm(['secret_key' => '', 'publishable_key' => '']))->assertSessionHasNoErrors();

    expect(PaymentSetting::current()?->secret_key)->toBe('sk_test_fakeKeyC3d4')
        ->and(PaymentSetting::current()?->publishable_key)->toBe('pk_test_fakeKeyA1b2');
});

it('refuses sk_live_ outside production, sk_test_ in Livemodus, and a key in the wrong field — and stores none of them', function (array $form, string $field, string $sentence): void {
    zahlungSave(zahlungForm($form))->assertSessionHasErrors([$field => $sentence]);

    expect(PaymentSetting::query()->count())->toBe(0);
})->with([
    'a live secret outside production' => [['secret_key' => 'sk_live_fakeKeyC3d4'], 'secret_key', 'Live-Schlüssel nimmt RIMIFY nur im Live-Shop an, hier nie. Wurde er hierher kopiert, roll ihn im Stripe-Dashboard.'],
    'a test secret in Livemodus' => [['mode' => 'live'], 'secret_key', 'Im Livemodus nimmt RIMIFY nur Live-Schlüssel (…_live_…) an. Mit einem Testschlüssel käme keine echte Zahlung an.'],
    'a publishable key as the secret' => [['secret_key' => 'pk_test_fakeKeyC3d4'], 'secret_key', 'Das ist kein geheimer Schlüssel von Stripe: er beginnt mit sk_… oder rk_….'],
    'something else as the webhook secret' => [['webhook_secret' => 'sk_test_fakeKeyC3d4'], 'webhook_secret', 'Das ist kein Webhook-Signaturschlüssel von Stripe: er beginnt mit whsec_….'],
]);

it('writes one Protokoll entry per save with the last four characters only — never a key', function (): void {
    zahlungSave(zahlungForm())->assertSessionHasNoErrors();

    $entry = AuditLog::query()->where('description', 'payments.settings_updated')->sole();
    $json = json_encode($entry->properties);

    expect($entry->properties['changed'])->toBe(['Öffentlicher Schlüssel', 'Geheimer Schlüssel', 'Webhook-Signaturschlüssel'])
        // Key by key: MySQL's JSON column returns an object's keys in its own order (`new` before `old`).
        ->and($entry->properties['signing_key_last4'])->toHaveCount(2)
        ->and($entry->properties['signing_key_last4']['old'])->toBeNull()
        ->and($entry->properties['signing_key_last4']['new'])->toBe('C3d4')
        ->and($entry->actor_email)->toBe('super-admin@rimify.test')
        ->and($json)->not->toContain('fakeKeyC3d4')->not->toContain('sk_test_')->not->toContain('whsec_');
});

it('tests the connection: the account behind the keys, or Stripe’s own error', function (): void {
    zahlungSave(zahlungForm())->assertSessionHasNoErrors();

    $this->actingAs(zahlungAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from(ZAHLUNG_URL)
        ->post(ZAHLUNG_URL.'/test')
        ->assertRedirect(ZAHLUNG_URL)
        ->assertSessionHas('toast', 'Verbindung steht.')
        ->assertSessionHas('payment_test', fn (array $test): bool => $test['ok'] === true && $test['name'] === 'RIMIFY' && $test['country'] === 'DE' && $test['currency'] === 'EUR' && in_array('SEPA-Lastschrift', $test['methods'], true));

    $this->stripe->refuse('GET /v1/account', 401, 'Invalid API Key provided: sk_test_****C3d4');

    $this->actingAs(zahlungAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from(ZAHLUNG_URL)
        ->post(ZAHLUNG_URL.'/test')
        ->assertSessionHas('payment_test', fn (array $test): bool => $test['ok'] === false && $test['error'] === 'Invalid API Key provided: sk_test_****C3d4');
});

it('says Testmodus on every admin page while Stripe is in test mode, and nowhere once it is not the driver', function (): void {
    zahlungSave(zahlungForm())->assertSessionHasNoErrors();

    $this->actingAs(zahlungAdmin(), 'admin')->get('/admin')->assertInertia(fn (AssertableInertia $page) => $page->where('admin.paymentsTestMode', true));

    config(['rimify.payments.driver' => 'none']);
    $this->actingAs(zahlungAdmin(), 'admin')->get('/admin')->assertInertia(fn (AssertableInertia $page) => $page->where('admin.paymentsTestMode', false));
});
