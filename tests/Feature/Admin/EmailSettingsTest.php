<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\EmailController;
use App\Http\Middleware\EnsureSudo;
use App\Models\AdminUser;
use App\Models\AuditLog;
use App\Models\MailSetting;
use App\Models\MailSuppression;
use App\Services\Mail\DnsLookup;
use App\Services\Mail\MailSettings;
use App\Support\EditStamp;
use Database\Seeders\AccessSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia;
use Tests\Support\FakeBucket;

/*
 * Einstellungen › E-Mail (the brief „AFTER CI“, §3): the Super-Admin alone, behind the password once more; the SES keys
 * write-only; every save tested against SES before it replaces what works; the shop's mail switched to SES only once
 * the test clears it — key working, account out of the sandbox, sender's domain verified. AWS is FakeBucket, DNS a
 * lookup of the test's own.
 */

const EMAIL_KEY = 'FAKESESKEYFORTESTS12';
const EMAIL_SECRET = 'fake/ses/secret/for/tests/only/00X9Y8';
const EMAIL_URL = '/admin/einstellungen/e-mail';

beforeEach(function (): void {
    $this->seed(AccessSeeder::class);
    $this->aws = FakeBucket::install();
    $this->aws->answers = [
        'GetAccount' => ['SendingEnabled' => true, 'ProductionAccessEnabled' => true, 'SendQuota' => ['Max24HourSend' => 50000.0], 'SuppressionAttributes' => ['SuppressedReasons' => ['BOUNCE', 'COMPLAINT']]],
        'GetEmailIdentity' => [
            'VerifiedForSendingStatus' => true,
            'DkimAttributes' => ['Status' => 'SUCCESS', 'Tokens' => ['tok1', 'tok2', 'tok3']],
            'MailFromAttributes' => ['MailFromDomain' => 'bounce.rimify.de', 'MailFromDomainStatus' => 'SUCCESS'],
        ],
    ];
});

function emailAdmin(string $role = 'super-admin'): AdminUser
{
    return AdminUser::query()->where('email', $role.'@rimify.test')->firstOrFail();
}

/** @return array<string, mixed> */
function emailForm(array $over = []): array
{
    return ['from_address' => 'bestellung@rimify.de', 'from_name' => 'RIMIFY', 'topic_arn' => 'arn:aws:sns:eu-north-1:123456789012:rimify-ses-meldungen', 'access_key' => EMAIL_KEY, 'secret' => EMAIL_SECRET, ...$over];
}

/** @return array<string, mixed> */
function emailProps(): array
{
    $props = [];

    test()->actingAs(emailAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get(EMAIL_URL)
        ->assertOk()
        ->assertInertia(function (AssertableInertia $page) use (&$props): void {
            $props = $page->component('Admin/Einstellungen/Email')->toArray()['props'];
        });

    return $props;
}

function emailSave(array $form): TestResponse
{
    return test()->actingAs(emailAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->put(EMAIL_URL, $form);
}

it('refuses every role but the Super-Admin — even one given the settings rights', function (string $role): void {
    DB::table('role_permissions')->updateOrInsert(
        ['role_id' => DB::table('roles')->where('name', $role)->value('id'), 'module' => 'settings', 'action' => 'view'],
        ['allowed' => true],
    );
    $block = MailSuppression::query()->forceCreate(['email' => 'a@example.org', 'reason' => 'bounce', 'sns_message_id' => 'm', 'occurred_at' => now()]);
    $session = [EnsureSudo::SESSION_KEY => now()->getTimestamp()];

    $this->actingAs(emailAdmin($role), 'admin')->withSession($session)->get(EMAIL_URL)->assertForbidden();
    $this->actingAs(emailAdmin($role), 'admin')->withSession($session)->put(EMAIL_URL, emailForm())->assertForbidden();
    $this->actingAs(emailAdmin($role), 'admin')->withSession($session)->post(EMAIL_URL.'/test', emailForm())->assertForbidden();
    $this->actingAs(emailAdmin($role), 'admin')->withSession($session)->delete(EMAIL_URL.'/sperren/'.$block->id)->assertForbidden();

    expect(MailSetting::query()->count())->toBe(0)
        ->and($block->fresh()?->released_at)->toBeNull()
        ->and($this->aws->sent)->toBe([]);
})->with(['catalogue-manager', 'accountant', 'content-editor']);

it('asks for the password again before the page', function (): void {
    $this->actingAs(emailAdmin(), 'admin')->get(EMAIL_URL)->assertRedirect('/admin/bestaetigen?weiter='.rawurlencode(EMAIL_URL));
});

it('saves a working key, switches the mail to SES once the test clears it, and never sends a key back', function (): void {
    expect(app(MailSettings::class)->sending())->toBeNull();

    emailSave(emailForm())->assertRedirect()->assertSessionHas('toast', 'Gespeichert und geprüft. Der Shop verschickt seine Mails ab jetzt über Amazon SES.');

    $set = MailSetting::query()->where('state', MailSetting::ACTIVE)->sole();
    $props = emailProps();

    expect($set->access_key)->toBe(EMAIL_KEY)
        ->and($set->verified_at)->not->toBeNull()
        ->and($set->last_test['dkim_tokens'])->toBe(['tok1', 'tok2', 'tok3'])
        ->and(app(MailSettings::class)->sending()?->id)->toBe($set->id)
        ->and(config('mail.default'))->toBe('ses-v2')
        ->and(config('services.ses.region'))->toBe('eu-north-1')
        // Never more than the last four characters, anywhere on the page.
        ->and(json_encode($props))->not->toContain(EMAIL_KEY)->not->toContain(EMAIL_SECRET)
        ->and($props['keyMasked'])->toEndWith('TS12')
        ->and($props['sending'])->toBeTrue()
        ->and($this->aws->names())->toBe(['GetAccount', 'GetEmailIdentity']);

    $entry = AuditLog::query()->where('description', 'mail.settings_updated')->sole();
    expect(json_encode($entry->properties))->not->toContain(EMAIL_SECRET)->not->toContain(EMAIL_KEY);
});

it('keeps a key that works in force, but sends nothing through SES from a sandbox account', function (): void {
    $this->aws->answers['GetAccount']['ProductionAccessEnabled'] = false;

    emailSave(emailForm())->assertSessionHas('toast', 'Gespeichert. Der Zugang klappt; verschickt wird über SES, sobald die Prüfung unten keine offenen Punkte mehr nennt.');

    $props = emailProps();
    $step = collect($props['test']['steps'])->firstWhere('step', 'Produktionszugang: Versand an jede Adresse');

    expect(MailSetting::query()->where('state', MailSetting::ACTIVE)->exists())->toBeTrue()
        ->and(app(MailSettings::class)->sending())->toBeNull()
        ->and(config('mail.default'))->toBe('array')
        ->and($step['ok'])->toBeFalse()
        ->and($step['detail'])->toContain('Sandbox');
});

it('keeps a key AWS refuses as pending, and the working set in force', function (): void {
    emailSave(emailForm());
    $this->aws->failWith('InvalidClientTokenId');

    emailSave(emailForm(['access_key' => 'ANOTHERKEYFORTESTS99']))
        ->assertSessionHas('toast', 'Gespeichert, aber der Zugang zu Amazon SES klappt nicht. Es gelten weiter die bisherigen Einstellungen.');

    expect(MailSetting::query()->where('state', MailSetting::ACTIVE)->sole()->access_key)->toBe(EMAIL_KEY)
        ->and(MailSetting::query()->where('state', MailSetting::PENDING)->sole()->access_key)->toBe('ANOTHERKEYFORTESTS99')
        ->and(emailProps()['pending'])->toBeTrue();
});

it('names a sender domain SES does not know yet, in a sentence', function (): void {
    $this->aws->refuse['GetEmailIdentity'] = 'NotFoundException';

    test()->actingAs(emailAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
        ->post(EMAIL_URL.'/test', emailForm())->assertRedirect();

    $steps = session('mail_test')['steps'];

    expect(end($steps)['detail'])->toBe('Die Domain ist in SES (eu-north-1) noch nicht angelegt: unter „Identities“ als Domain mit Easy DKIM anlegen.')
        ->and(MailSetting::query()->count())->toBe(0);
});

it('shows each DNS record SES needs, as the world sees it', function (): void {
    emailSave(emailForm());
    app()->instance(DnsLookup::class, new class extends DnsLookup
    {
        public function records(string $host, int $type): array
        {
            return match ([$host, $type]) {
                ['bounce.rimify.de', DNS_TXT] => [['txt' => 'v=spf1 include:amazonses.com ~all']],
                ['tok1._domainkey.rimify.de', DNS_CNAME] => [['target' => 'tok1.dkim.amazonses.com']],
                default => [],
            };
        }
    });

    $dns = collect(emailProps()['dns'])->mapWithKeys(static fn (array $r): array => [$r['type'].' '.$r['name'] => $r['found']])->all();

    expect($dns)->toBe([
        'TXT bounce.rimify.de' => true,
        'MX bounce.rimify.de' => false,
        'CNAME tok1._domainkey.rimify.de' => true,
        'CNAME tok2._domainkey.rimify.de' => false,
        'CNAME tok3._domainkey.rimify.de' => false,
        'TXT _dmarc.rimify.de' => false,
    ]);
});

it('releases a blocked address, once, and says so in the Protokoll', function (): void {
    $block = MailSuppression::query()->forceCreate(['email' => 'zurueck@example.org', 'reason' => 'complaint', 'detail' => 'abuse', 'sns_message_id' => 'm', 'occurred_at' => now()]);

    expect(emailProps()['suppressions'][0]['email'])->toBe('zurueck@example.org');

    test()->actingAs(emailAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])
        ->delete(EMAIL_URL.'/sperren/'.$block->id)->assertRedirect();

    expect($block->fresh()?->released_at)->not->toBeNull()
        ->and(AuditLog::query()->where('description', 'mail.suppression_released')->count())->toBe(1)
        ->and(emailProps()['suppressions'])->toBe([]);
});

it('refuses a sender without a dot in its domain — SES sends from no such address (the admin audit\'s F-30)', function (): void {
    emailSave(emailForm(['from_address' => 'info@rimify']))
        ->assertSessionHasErrors(['from_address' => 'Die Absenderadresse ist keine gültige E-Mail-Adresse.']);

    expect(MailSetting::query()->count())->toBe(0);
});

it('counts every blocked address beside the newest it lists, and finds an older one by its address (the sweep after F-26)', function (): void {
    $rows = [];

    foreach (range(1, EmailController::SUPPRESSIONS_SHOWN + 10) as $n) {
        $rows[] = ['email' => "weg{$n}@example.org", 'reason' => 'bounce', 'sns_message_id' => "m{$n}", 'occurred_at' => now()->subMinutes(500 - $n), 'created_at' => now(), 'updated_at' => now()];
    }

    DB::table('mail_suppressions')->insert($rows);

    $props = emailProps();
    expect($props['suppressions'])->toHaveCount(EmailController::SUPPRESSIONS_SHOWN)
        ->and($props['suppressionsTotal'])->toBe(EmailController::SUPPRESSIONS_SHOWN + 10)
        // The oldest is past the list …
        ->and(array_column($props['suppressions'], 'email'))->not->toContain('weg1@example.org');

    // … and found by its address, in any letter case.
    $found = [];
    test()->actingAs(emailAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->get(EMAIL_URL.'?sperre=WEG1%40')
        ->assertInertia(function (AssertableInertia $page) use (&$found): void {
            $found = $page->toArray()['props'];
        });

    expect(array_column($found['suppressions'], 'email'))->toBe(['weg1@example.org'])
        ->and($found['suppressionsFound'])->toBe(1)
        ->and($found['suppressionSearch'])->toBe('weg1@');
});

it('refuses a save from a page opened before the last save, and keeps that save (the admin audit\'s F-25)', function (): void {
    emailSave(emailForm())->assertSessionHasNoErrors();
    $stale = emailProps()['stamp'];

    // Another tab saves a new sender name.
    emailSave(emailForm(['from_name' => 'RIMIFY Räder']))->assertSessionHasNoErrors();

    test()->actingAs(emailAdmin(), 'admin')->withSession([EnsureSudo::SESSION_KEY => now()->getTimestamp()])->from(EMAIL_URL)
        ->withHeader(EditStamp::HEADER, $stale)->put(EMAIL_URL, emailForm(['from_name' => 'RIMIFY alt']))
        ->assertSessionHasErrors(['_stamp' => EditStamp::MESSAGE]);

    expect(MailSetting::query()->orderByDesc('id')->value('from_name'))->toBe('RIMIFY Räder');
});
