<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\EmailController;
use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\MailSetting;
use App\Services\Admin\AuditDescriber;
use App\Services\GoLive\GoLiveCheck;
use App\Services\GoLive\GoLiveChecks;
use App\Services\Mail\BrevoProbe;
use App\Services\Mail\MailSettings;
use App\Support\MailDelivery;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportException;

/*
 * Mail through Brevo (his round of 08.11, §7A; D-450): Einstellungen › E-Mail takes Brevo's SMTP login and SMTP key, signs in
 * to its relay on every save and „Verbindung testen“, and once the relay accepts them sends the shop's mail through it — so
 * the contact form and the order mails say „angekommen“ only then (MailDelivery). The key is stored encrypted and shown only
 * as its last four characters, never SES's secret reused. „Test-E-Mail senden“ sends one real message and says what came of
 * it, the transport's words where it failed.
 */

const BREVO_LOGIN = '8a1b2c001@smtp-brevo.com';
const BREVO_KEY = 'xsmtpsib-fake-key-for-tests-only-0000-K9Z1';
const BREVO_URL = '/admin/einstellungen/e-mail';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    config(['mail.default' => 'log']);
    $this->signIns = [];
    $this->refuse = null;
    app()->instance(BrevoProbe::class, new BrevoProbe(function (string $login, string $key): void {
        $this->signIns[] = [$login, $key];

        if ($this->refuse !== null) {
            throw new TransportException($this->refuse);
        }
    }));
});

function brevoAs(string $role = 'super-admin'): mixed
{
    return test()->actingAs(AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail(), 'admin')
        ->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from(BREVO_URL);
}

/** @return array<string, mixed> */
function brevoForm(array $over = []): array
{
    return ['provider' => 'brevo', 'from_address' => 'bestellung@rimify.de', 'from_name' => 'RIMIFY', 'smtp_login' => BREVO_LOGIN, 'secret' => BREVO_KEY, ...$over];
}

it('signs in to Brevo with the login and key on save, sends the shop\'s mail through its relay from then on, and keeps the key out of sight', function (): void {
    expect(MailDelivery::real())->toBeFalse();

    brevoAs()->put(BREVO_URL, brevoForm())->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert und geprüft. Der Shop verschickt seine Mails ab jetzt über Brevo.');

    $row = MailSetting::query()->sole();

    expect($this->signIns)->toBe([[BREVO_LOGIN, BREVO_KEY]])
        ->and($row->only(['state', 'provider', 'smtp_login', 'access_key', 'secret_last4']))->toBe(['state' => 'active', 'provider' => 'brevo', 'smtp_login' => BREVO_LOGIN, 'access_key' => null, 'secret_last4' => 'K9Z1'])
        // Encrypted at rest: the column never holds the key as typed.
        ->and(DB::table('mail_settings')->value('secret'))->not->toContain('xsmtpsib');

    app(MailSettings::class)->apply(app('mail.manager'));

    expect(config('mail.default'))->toBe('brevo')
        ->and(config('mail.mailers.brevo'))->toMatchArray(['transport' => 'smtp', 'host' => 'smtp-relay.brevo.com', 'port' => 587, 'username' => BREVO_LOGIN])
        ->and(config('mail.from.address'))->toBe('bestellung@rimify.de')
        ->and(MailDelivery::real())->toBeTrue();

    $page = brevoAs()->get(BREVO_URL)->assertOk()->viewData('page')['props'];

    expect($page['form'])->toMatchArray(['provider' => 'brevo', 'smtp_login' => BREVO_LOGIN])
        ->and($page['secretMasked'])->toEndWith('K9Z1')
        ->and($page['sendingProvider'])->toBe('brevo')
        ->and(json_encode($page))->not->toContain(BREVO_KEY);

    $entry = app(AuditDescriber::class)->describe(AuditLog::query()->where('description', 'mail.settings_updated')->sole());

    expect($entry['sentence'])->toEndWith('Der Zugang zu Brevo funktioniert.')
        ->and(collect($entry['changes'])->firstWhere('label', 'SMTP-Schlüssel')['after'] ?? null)->toBe('…K9Z1');
});

it('says on System › Was fehlt that mail goes through Brevo, and leaves the sender\'s DNS to Brevo\'s own check (R-17)', function (): void {
    brevoAs()->put(BREVO_URL, brevoForm())->assertSessionHasNoErrors();
    $checks = [];

    foreach (app(GoLiveChecks::class)->all(network: false) as $check) {
        $checks[$check->id] = $check;
    }

    expect($checks['mailversand']->state)->toBe(GoLiveCheck::OK)
        ->and($checks['mailversand']->sentence)->toBe('Die Mails des Shops gehen über Brevo (smtp-relay.brevo.com), Absender bestellung@rimify.de.')
        ->and($checks['mail_dns']->state)->toBe(GoLiveCheck::UNCHECKABLE)
        ->and($checks['mail_dns']->sentence)->toContain('prüft Brevo selbst')
        ->and($checks['bestaetigung']->sentence)->toStartWith('Die Bestätigung wird über Brevo verschickt');
});

it('keeps a set the relay refuses as pending, says the relay\'s own words, and goes on writing mail to the log', function (): void {
    $this->refuse = 'Expected response code "235" but got code "535", with message "535 5.7.8 Authentication failed".';

    brevoAs()->put(BREVO_URL, brevoForm())->assertSessionHasNoErrors()
        ->assertSessionHas('toast', 'Gespeichert, aber der Zugang zu Brevo klappt nicht. Es gelten weiter die bisherigen Einstellungen.')
        ->assertSessionHas('mail_test', fn (array $test): bool => $test['ok'] === false && str_contains((string) $test['steps'][0]['detail'], '535 5.7.8 Authentication failed'));

    app(MailSettings::class)->apply(app('mail.manager'));

    expect(MailSetting::query()->sole()->state)->toBe('pending')
        ->and(config('mail.default'))->toBe('log')
        ->and(MailDelivery::real())->toBeFalse();
});

it('never takes SES\'s stored secret for Brevo\'s key: switching provider asks for the key', function (): void {
    MailSetting::query()->create(['state' => 'active', 'provider' => 'ses', 'region' => 'eu-north-1', 'from_address' => 'bestellung@rimify.de', 'access_key' => 'FAKESESKEYFORTESTS12', 'secret' => 'fake/ses/secret/for/tests/only/00X9Y8', 'key_last4' => 'TS12', 'secret_last4' => 'X9Y8']);

    brevoAs()->put(BREVO_URL, brevoForm(['secret' => '']))->assertSessionHasNoErrors();

    $pending = MailSetting::query()->where('state', 'pending')->sole();

    expect($this->signIns)->toBe([])
        ->and($pending->secret)->toBeNull()
        ->and(session('mail_test')['steps'][0]['detail'] ?? null)->toBe('Absenderadresse, SMTP-Login und SMTP-Schlüssel werden gebraucht.')
        ->and(MailSetting::query()->where('state', 'active')->sole()->provider)->toBe('ses');
});

it('asks for Brevo\'s SMTP login in its own form, and names the fix', function (): void {
    brevoAs()->put(BREVO_URL, brevoForm(['smtp_login' => '']))
        ->assertSessionHasErrors(['smtp_login' => 'Gib bitte den SMTP-Login aus Brevo ein (SMTP & API › SMTP, z. B. 8a1b2c001@smtp-brevo.com).']);
    brevoAs()->put(BREVO_URL, brevoForm(['secret' => 'zu-kurz']))
        ->assertSessionHasErrors(['secret' => 'Der SMTP-Schlüssel ist zu kurz. Kopier ihn bitte vollständig aus Brevo (SMTP & API › SMTP).']);
    brevoAs()->put(BREVO_URL, brevoForm(['provider' => 'mailgun']))->assertSessionHasErrors('provider');

    expect(MailSetting::query()->count())->toBe(0);
});

it('tests the connection with the form\'s values, saving and sending nothing', function (): void {
    brevoAs()->post(BREVO_URL.'/test', brevoForm())->assertSessionHas('toast', 'Verbindung zu Brevo steht.');

    expect($this->signIns)->toBe([[BREVO_LOGIN, BREVO_KEY]])
        ->and(MailSetting::query()->count())->toBe(0);
});

it('sends a test mail only while a set is in force, and says what came of it — the transport\'s words where it failed', function (): void {
    Mail::fake();

    // Nothing in force: no message pretends to leave.
    brevoAs()->post(BREVO_URL.'/test-mail', ['test_to' => 'Ich@Beispiel.de'])
        ->assertSessionHas('test_mail', ['ok' => false, 'to' => 'ich@beispiel.de', 'error' => EmailController::NOT_SENDING]);

    brevoAs()->put(BREVO_URL, brevoForm())->assertSessionHasNoErrors();
    brevoAs()->post(BREVO_URL.'/test-mail', ['test_to' => 'ich@beispiel.de'])
        ->assertSessionHas('test_mail', ['ok' => true, 'to' => 'ich@beispiel.de', 'error' => null])
        ->assertSessionHas('toast', 'Die Test-E-Mail an ich@beispiel.de ist verschickt.');

    expect(app(AuditDescriber::class)->describe(AuditLog::query()->where('description', 'mail.test_sent')->latest('id')->firstOrFail())['sentence'])
        ->toBe('Eine Test-E-Mail an „ich@beispiel.de“ wurde verschickt.');

    // The relay refuses the message itself: said as it came.
    Mail::shouldReceive('raw')->once()->andThrow(new TransportException('550 5.7.1 Sender address rejected: not verified'));

    brevoAs()->post(BREVO_URL.'/test-mail', ['test_to' => 'ich@beispiel.de'])
        ->assertSessionHas('test_mail', ['ok' => false, 'to' => 'ich@beispiel.de', 'error' => '550 5.7.1 Sender address rejected: not verified']);

    brevoAs()->post(BREVO_URL.'/test-mail', ['test_to' => 'keine-adresse'])->assertSessionHasErrors(['test_to' => 'Das ist keine gültige E-Mail-Adresse.']);
});

it('is the Super-Admin\'s alone, saving and sending a test alike (R-11)', function (string $role): void {
    brevoAs($role)->put(BREVO_URL, brevoForm())->assertForbidden();
    brevoAs($role)->post(BREVO_URL.'/test-mail', ['test_to' => 'ich@beispiel.de'])->assertForbidden();

    expect(MailSetting::query()->count())->toBe(0)
        ->and(AuditLog::query()->where('description', 'mail.test_sent')->count())->toBe(0);
})->with(['content-editor', 'support-agent']);
