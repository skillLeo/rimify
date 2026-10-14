<?php

declare(strict_types=1);

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Models\AdminUser;
use App\Models\ApprovalDocument;
use App\Models\Fitment;
use App\Models\FitmentTyreSize;
use App\Models\MailSetting;
use App\Models\Page;
use App\Models\Setting;
use App\Models\Vehicle;
use App\Models\WheelConfig;
use App\Services\Commerce\InvoiceSeries;
use App\Services\GoLive\GoLiveCheck;
use App\Services\GoLive\GoLiveChecks;
use App\Services\GoLive\TyreConfirmations;
use App\Services\GoLive\WasFehlt;
use App\Services\Mail\DnsLookup;
use App\Support\Seller;
use Database\Seeders\ApprovalSeeder;
use Database\Seeders\ReferenceDataSeeder;
use Illuminate\Console\Scheduling\Schedule;

/*
 * rimify:go-live-check's checks (the operator's brief of 05.10.2026, §7): each reads the state the shop is in — the
 * seller's data, the pages' texts, the Gutachten, the payment keys — never a value written down for it; and while a
 * check of „Recht und Pflichtangaben" fails, the shop takes no real payment.
 */

/** A legal page as the Kanzlei delivers it — or, with `$placeholder`, as ContentSeeder writes it. */
function goLivePage(string $slug, string $title, bool $placeholder = false): void
{
    $page = Page::query()->firstOrCreate(['slug' => $slug], ['locale' => 'de', 'kind' => Page::KIND_LEGAL, 'title' => $title, 'status' => Page::STATUS_PUBLISHED, 'published_at' => now()]);
    $page->blocks()->delete();
    $page->blocks()->create(['type' => 'legal_body', 'sort_order' => 10, 'data' => ['heading' => $title, 'text' => $placeholder ? '[Rechtstext folgt]' : "Der Text der Kanzlei: {$title}.", ...($placeholder ? ['placeholder' => true] : [])]]);
}

/** A seller as Einstellungen › Verkäufer & Versand stores it. */
function goLiveSeller(array $over = []): void
{
    Setting::set(Seller::KEY, [
        'name' => 'Beispiel Felgen GmbH', 'street' => 'Musterweg 1', 'zip' => '50667', 'city' => 'Köln', 'email' => 'shop@beispiel.test',
        'vat_id' => 'DE000000000', 'tax_number' => null, 'register_court' => 'Amtsgericht Köln', 'register_number' => 'HRB 00000',
        'managing_director' => 'Erika Mustermann', 'phone' => null, 'placeholder' => false, ...$over,
    ]);
}

/** Everything „Recht und Pflichtangaben" asks for, given. */
function goLiveLegalComplete(): void
{
    goLiveSeller();

    foreach (['impressum' => 'Impressum', 'agb' => 'AGB', 'widerrufsbelehrung' => 'Widerrufsbelehrung', 'datenschutz' => 'Datenschutz', 'barrierefreiheit' => 'Erklärung zur Barrierefreiheit'] as $slug => $title) {
        goLivePage($slug, $title);
    }

    config([
        'mail.default' => 'smtp',
        'rimify.seller.small_business' => false,
        'rimify.shipping.cost_cents' => 990,
        'rimify.shipping.free_from_cents' => null,
        'rimify.shipping.delivery_time' => '3–5 Werktage',
    ]);
    app(InvoiceSeries::class)->open(AdminUser::factory()->create(), 1, 1);
}

/** @return array<string, GoLiveCheck> */
function goLiveById(): array
{
    $byId = [];

    foreach (app(GoLiveChecks::class)->all(network: false) as $check) {
        $byId[$check->id] = $check;
    }

    return $byId;
}

it('counts what is met, and what is open at whose side', function (): void {
    $line = GoLiveChecks::countLine([
        new GoLiveCheck('a', GoLiveChecks::LEGAL, 'A', GoLiveCheck::US, GoLiveCheck::OK, '.', 'X'),
        new GoLiveCheck('b', GoLiveChecks::LEGAL, 'B', GoLiveCheck::US, GoLiveCheck::MISSING, '.', 'X'),
        new GoLiveCheck('c', GoLiveChecks::LEGAL, 'C', GoLiveCheck::CLIENT, GoLiveCheck::MISSING, '.', 'X'),
        new GoLiveCheck('d', GoLiveChecks::LEGAL, 'D', GoLiveCheck::CLIENT, GoLiveCheck::MISSING, '.', 'X'),
        new GoLiveCheck('e', GoLiveChecks::PAYMENT, 'E', GoLiveCheck::CLIENT, GoLiveCheck::UNCHECKABLE, '.', 'X'),
    ]);

    expect($line)->toBe('1 von 5 erfüllt · 1 bei uns · 2 beim Kunden · 1 nicht prüfbar');
});

it('counts the Anlagen a gap names', function (string $gap, int $count): void {
    expect(GoLiveChecks::annexCount($gap))->toBe($count);
})->with([
    'ABE 53841' => ['1–15', 15],
    'a list with a range' => ['3, 5–7', 4],
    'one Anlage' => ['2', 1],
    'a hyphen for the dash' => ['1-3', 3],
]);

it('names every check once, in four groups, each with an owner, a state and a place', function (): void {
    $checks = app(GoLiveChecks::class)->all(network: false);
    $ids = array_map(static fn (GoLiveCheck $c): string => $c->id, $checks);

    expect($ids)->toBe(array_values(array_unique($ids)))
        ->and(array_values(array_unique(array_map(static fn (GoLiveCheck $c): string => $c->group, $checks))))->toBe(GoLiveChecks::GROUPS);

    foreach ($checks as $check) {
        expect($check->owner)->toBeIn([GoLiveCheck::US, GoLiveCheck::CLIENT, GoLiveCheck::HOST])
            ->and($check->state)->toBeIn([GoLiveCheck::OK, GoLiveCheck::MISSING, GoLiveCheck::UNCHECKABLE])
            // A full sentence: a statement, or the question the check cannot answer from here.
            ->and($check->sentence)->toMatch('/[.?]$/')
            ->and($check->place)->not->toBe('');
    }
});

// The preview's server answered as `us-bos-web1780.main-hosting.eu` (06.10.2026): the host's own naming says where.
it('reads where the server stands from the host\'s naming, and claims nothing a name does not say', function (string $host, ?array $where): void {
    expect(GoLiveChecks::locationOf($host))->toBe($where);
})->with([
    'the preview, in Boston' => ['us-bos-web1780.main-hosting.eu', ['country' => 'us', 'eu' => false]],
    'the Netherlands' => ['nl-srv-web1234.main-hosting.eu', ['country' => 'nl', 'eu' => true]],
    'Lithuania, no domain' => ['lt-vln-web2001', ['country' => 'lt', 'eu' => true]],
    'Germany' => ['de-fra-web1500.main-hosting.eu', ['country' => 'de', 'eu' => true]],
    'the United Kingdom' => ['uk-lon-web301.main-hosting.eu', ['country' => 'uk', 'eu' => false]],
    'a desktop' => ['DESKTOP-7Q2K', null],
    'another host\'s scheme' => ['web123.example.net', null],
]);

it('gives the server\'s place to the host, and asks it only of the test server and the live shop', function (): void {
    expect(goLiveById()['serverstandort']->state)->toBe(GoLiveCheck::OK);

    app()->detectEnvironment(static fn (): string => 'staging');
    $check = goLiveById()['serverstandort'];
    $where = GoLiveChecks::locationOf((string) gethostname());

    expect($check->owner)->toBe(GoLiveCheck::HOST)
        ->and($check->group)->toBe(GoLiveChecks::OPERATIONS)
        ->and($check->state)->toBe(match (true) {
            $where === null => GoLiveCheck::UNCHECKABLE,
            $where['country'] === 'de' => GoLiveCheck::OK,
            default => GoLiveCheck::MISSING,
        })
        ->and($check->sentence)->toContain((string) gethostname());
});

// Decided (D-181): Germany for the web server and the database. Another EU state is no pass, and says what was decided.
it('passes the server\'s place in Germany alone', function (string $host, string $state, string $says): void {
    app()->detectEnvironment(static fn (): string => 'production');

    $check = (fn (string $h) => $this->serverLocation($h))->call(app(GoLiveChecks::class), $host);

    expect($check->state)->toBe($state)
        ->and($check->sentence)->toContain($says)
        ->and($check->title)->toBe('Serverstandort in Deutschland');
})->with([
    'Frankfurt' => ['de-fra-web1500.main-hosting.eu', GoLiveCheck::OK, 'in Deutschland.'],
    'the Netherlands' => ['nl-srv-web1234.main-hosting.eu', GoLiveCheck::MISSING, 'in der EU (NL), aber nicht in Deutschland'],
    'Boston' => ['us-bos-web1780.main-hosting.eu', GoLiveCheck::MISSING, 'außerhalb der EU (US)'],
    'London' => ['uk-lon-web301.main-hosting.eu', GoLiveCheck::MISSING, 'außerhalb der EU (UK)'],
]);

it('reads the Impressum from the seller: a GmbH needs its register and its representative, a sole trader neither', function (): void {
    goLivePage('impressum', 'Impressum');

    goLiveSeller(['register_court' => null, 'register_number' => null, 'managing_director' => null]);
    expect(goLiveById()['impressum']->sentence)->toBe('Im Impressum fehlen: Vertretungsberechtigte, Registergericht und -nummer.');

    goLiveSeller(['name' => 'Erika Mustermann Felgenhandel', 'register_court' => null, 'register_number' => null, 'managing_director' => null]);
    expect(goLiveById()['impressum']->state)->toBe(GoLiveCheck::OK)
        // No telephone is no gap: the contact form is the second fast way (§ 5 Abs. 1 Nr. 2 DDG).
        ->and(goLiveById()['impressum']->sentence)->toContain('der zweite schnelle Kontaktweg ist das Kontaktformular');

    goLiveSeller(['placeholder' => true]);
    expect(goLiveById()['impressum']->state)->toBe(GoLiveCheck::MISSING)
        ->and(goLiveById()['impressum']->owner)->toBe(GoLiveCheck::CLIENT)
        ->and(goLiveById()['impressum']->place)->toBe('/admin/einstellungen/verkaeufer-versand');
});

it('says a legal page is missing while it holds the placeholder, and points at the page to fill', function (): void {
    goLivePage('agb', 'AGB', placeholder: true);
    $agb = goLiveById()['agb'];

    expect($agb->state)->toBe(GoLiveCheck::MISSING)
        ->and($agb->sentence)->toBe('Die AGB sind noch ein Platzhalter: Der Text der Kanzlei fehlt.')
        ->and($agb->place)->toBe('/admin/seiten/'.Page::query()->where('slug', 'agb')->value('id'));

    goLivePage('agb', 'AGB');

    expect(goLiveById()['agb']->state)->toBe(GoLiveCheck::OK);
});

it('names each released Gutachten whose Anlagen are missing, with how many', function (): void {
    ApprovalDocument::factory()->create(['kind' => 'ABE', 'kba_number' => '53841', 'status' => 'published', 'missing_annexes' => '1–15', 'valid_from' => null, 'valid_to' => null]);

    $anlagen = goLiveById()['anlagen'];

    expect($anlagen->state)->toBe(GoLiveCheck::MISSING)
        ->and($anlagen->sentence)->toStartWith('ABE 53841: 15 Anlagen fehlen (1–15).')
        ->and($anlagen->sentence)->toContain('„noch nicht gelesen“, nie ein Nein');
});

it('counts the pairs of a vehicle and a wheel that stand on „Reifengröße noch nicht bestätigt“ (finding 103, §1.5)', function (): void {
    $this->seed(ReferenceDataSeeder::class);

    // An RS 4 runs 280 km/h. One wheel's Gutachten carries the table of tyre load at speed; the other's does not.
    $vehicle = Vehicle::factory()->rs4AvantFirst()->create();
    $confirmed = WheelConfig::factory()->havanna85x18()->create();
    $open = WheelConfig::factory()->havanna85x18()->create();

    foreach ([[$confirmed, ApprovalDocument::factory()->printingDeratingTable()], [$open, ApprovalDocument::factory()]] as [$config, $document]) {
        $fitment = Fitment::factory()->create(['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id, 'approval_document_id' => $document]);
        FitmentTyreSize::factory()->for($fitment)->size(245, 40, 18.0)->create();
    }

    $resolver = app(FitmentResolver::class);
    expect($resolver->resolve($vehicle->id, $confirmed->id)->tyreUnconfirmed())->toBeFalse()
        ->and($resolver->resolve($vehicle->id, $open->id)->tyreUnconfirmed())->toBeTrue();

    $check = goLiveById()['reifenbestaetigung'];

    expect($check->state)->toBe(GoLiveCheck::MISSING)
        ->and($check->owner)->toBe(GoLiveCheck::CLIENT)
        ->and($check->sentence)->toStartWith('1 von 2 Kombinationen aus Fahrzeug und Felge steht auf „Felge freigegeben · Reifengröße noch nicht bestätigt“.')
        ->and($check->sentence)->toContain('Zum Beispiel: Audi ')
        ->and($check->sentence)->toContain(' mit ')
        // The report rimify:go-live-check writes carries the same line.
        ->and(WasFehlt::markdown([$check], now()))->toContain('1 von 2 Kombinationen aus Fahrzeug und Felge steht auf');

    // Once the table is on record, nothing is open — asked afresh, as the command asks.
    ApprovalSeeder::seedDerating(ApprovalDocument::query()->findOrFail(Fitment::query()->where('wheel_config_id', $open->id)->value('approval_document_id')));
    $after = app(TyreConfirmations::class)->count(fresh: true);

    expect($after)->toMatchArray(['pairs' => 2, 'open' => 0, 'demo' => 0])
        ->and(goLiveById()['reifenbestaetigung']->state)->toBe(GoLiveCheck::OK)
        ->and(goLiveById()['reifenbestaetigung']->sentence)->toStartWith('Keine der 2 Kombinationen aus Fahrzeug und Felge in freigegebenen Gutachten steht auf „Felge freigegeben · Reifengröße noch nicht bestätigt“. Gezählt: ');
});

it('never makes a page count a large shop: it reads what the command and the hour have counted, or says nothing is counted yet', function (): void {
    $this->seed(ReferenceDataSeeder::class);

    $vehicle = Vehicle::factory()->rs4AvantFirst()->create();
    $document = ApprovalDocument::factory()->create();
    Fitment::factory()->count(TyreConfirmations::INLINE_PAIRS + 1)->create(['vehicle_id' => $vehicle->id, 'approval_document_id' => $document->id]);

    $pending = goLiveById()['reifenbestaetigung'];

    expect(app(TyreConfirmations::class)->count()['state'])->toBe(TyreConfirmations::PENDING)
        ->and($pending->state)->toBe(GoLiveCheck::UNCHECKABLE)
        ->and($pending->sentence)->toStartWith('Noch nicht gezählt: Die 201 Kombinationen aus Fahrzeug und Felge werden stündlich im Hintergrund geprüft')
        ->and($pending->place)->toBe('php artisan rimify:go-live-check');

    // The hour's run is registered, and what it counts is what the page then reads.
    $hourly = collect(app(Schedule::class)->events())->first(fn ($event): bool => $event->description === 'reifenbestaetigung-zaehlen');
    expect($hourly)->not->toBeNull()
        ->and($hourly->expression)->toBe('0 * * * *');

    app(TyreConfirmations::class)->count(fresh: true);

    expect(app(TyreConfirmations::class)->count()['state'])->toBe(TyreConfirmations::COUNTED)
        ->and(goLiveById()['reifenbestaetigung']->state)->not->toBe(GoLiveCheck::UNCHECKABLE);
});

it('says it cannot answer where the engine\'s reference tables are missing, instead of failing the whole report', function (): void {
    $vehicle = Vehicle::factory()->rs4AvantFirst()->create();
    $config = WheelConfig::factory()->havanna85x18()->create();
    FitmentTyreSize::factory()->for(Fitment::factory()->create(['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id]))->size(245, 40, 18.0)->create();

    $check = goLiveById()['reifenbestaetigung'];

    expect($check->state)->toBe(GoLiveCheck::UNCHECKABLE)
        ->and($check->owner)->toBe(GoLiveCheck::US)
        ->and($check->sentence)->toContain('ohne sie beantwortet die Prüfung keine der 1 Kombination aus Fahrzeug und Felge');
});

it('says so when every open pair comes from example data, and does not call the shop unready for it', function (): void {
    $this->seed(ReferenceDataSeeder::class);

    // The acceptance set's case: a born-demo Gutachten without the table, a car faster than 210 km/h.
    $vehicle = Vehicle::factory()->rs4AvantFirst()->create();
    $config = WheelConfig::factory()->havanna85x18()->create();
    $document = ApprovalDocument::factory()->create(['is_demo' => true, 'demo_ref' => 'test:doc:ohne-tabelle']);
    FitmentTyreSize::factory()->for(Fitment::factory()->create(['vehicle_id' => $vehicle->id, 'wheel_config_id' => $config->id, 'approval_document_id' => $document->id]))->size(245, 40, 18.0)->create();

    $check = goLiveById()['reifenbestaetigung'];

    expect(app(TyreConfirmations::class)->count())->toMatchArray(['pairs' => 1, 'open' => 1, 'demo' => 1])
        ->and($check->state)->toBe(GoLiveCheck::OK)
        ->and($check->sentence)->toStartWith('1 von 1 Kombination aus Fahrzeug und Felge steht auf „Felge freigegeben · Reifengröße noch nicht bestätigt“ – alle aus Beispieldaten.');
});

it('takes no real payment while a legal check fails — and says nothing of it in test mode', function (): void {
    goLiveLegalComplete();
    config(['rimify.payments.driver' => 'stripe', 'services.stripe.mode' => 'test', 'services.stripe.key' => 'pk_test_fakeKey', 'services.stripe.secret' => 'sk_test_fakeKey', 'services.stripe.webhook_secret' => 'whsec_test_x']);

    // Test mode: no money moves, nothing to refuse.
    goLivePage('agb', 'AGB', placeholder: true);
    expect(app(GoLiveChecks::class)->liveRefusal())->toBeNull();

    app()['env'] = 'production';

    try {
        config(['rimify.review.enabled' => false, 'services.stripe.mode' => 'live', 'services.stripe.key' => 'pk_live_fakeKey', 'services.stripe.secret' => 'sk_live_fakeKey', 'services.stripe.webhook_secret' => 'whsec_live_x']);

        $refused = app(GoLiveChecks::class)->liveRefusal();
        expect($refused)->not->toBeNull()
            ->and(array_map(static fn (GoLiveCheck $c): string => $c->id, $refused ?? []))->toBe(['agb']);

        goLivePage('agb', 'AGB');
        expect(app(GoLiveChecks::class)->liveRefusal())->toBeNull();
    } finally {
        app()['env'] = 'testing';
    }
});

// ── Mail (the brief „AFTER CI“, §3) ─────────────────────────────────────────────────────────────────────────────────

/** A set in Einstellungen › E-Mail with its last SES test. */
function goLiveMailSet(array $test, string $state = MailSetting::ACTIVE): MailSetting
{
    return MailSetting::query()->forceCreate([
        'state' => $state, 'from_address' => 'bestellung@rimify.de', 'access_key' => 'FAKESESKEYFORTESTS12', 'secret' => 'fake/ses/secret/for/tests/only/00X9Y8',
        'verified_at' => $state === MailSetting::ACTIVE ? now() : null,
        'last_test' => ['ok' => true, 'steps' => [], 'at' => now()->toIso8601String(), 'production_access' => true, 'sending_enabled' => true, 'identity_verified' => true, 'dkim_status' => 'SUCCESS', 'dkim_tokens' => ['tok1', 'tok2', 'tok3'], 'mail_from_domain' => 'bounce.rimify.de', 'mail_from_status' => 'SUCCESS', ...$test],
    ]);
}

it('reads „fehlt“ for the mail while no SES key is in, naming every DNS record the sender needs', function (): void {
    $sending = goLiveById()['mailversand'];
    $dns = goLiveById()['mail_dns'];

    expect($sending->state)->toBe(GoLiveCheck::MISSING)
        ->and($sending->sentence)->toBe('Die Mails gehen über „array“ und erreichen bis dahin niemanden. Noch offen: der Zugang zu Amazon SES in Einstellungen › E-Mail.')
        ->and($dns->state)->toBe(GoLiveCheck::MISSING)
        ->and($dns->owner)->toBe(GoLiveCheck::CLIENT)
        // The sender .env names (noreply@rimify.de) until the screen holds one; DKIM's three names come from SES.
        ->and($dns->sentence)->toBe('Für rimify.de fehlen im DNS: SPF: TXT bounce.rimify.de → „v=spf1 include:amazonses.com ~all“; SPF: MX bounce.rimify.de → „10 feedback-smtp.eu-north-1.amazonses.com“; DKIM: CNAME (drei Einträge)._domainkey.rimify.de → „(…).dkim.amazonses.com – SES nennt sie, sobald die Domain dort angelegt ist“; DMARC: TXT _dmarc.rimify.de → „v=DMARC1; p=none; rua=mailto:dmarc@rimify.de“.');
});

it('names what keeps a working SES key from carrying the mail: the sandbox, an unverified domain', function (): void {
    goLiveMailSet(['production_access' => false, 'identity_verified' => false]);

    expect(goLiveById()['mailversand']->sentence)->toBe('Die Mails gehen über „array“ und erreichen bis dahin niemanden. Noch offen: der Produktionszugang bei AWS (das Konto ist noch in der Sandbox), die bestätigte Absenderdomain rimify.de.');
});

it('passes the mail once SES carries it and every record is in the DNS, and the confirmation says SES', function (): void {
    goLiveMailSet([]);
    app()->instance(DnsLookup::class, new class extends DnsLookup
    {
        public function records(string $host, int $type): array
        {
            return match (true) {
                $type === DNS_TXT && $host === 'bounce.rimify.de' => [['txt' => 'v=spf1 include:amazonses.com ~all']],
                $type === DNS_MX && $host === 'bounce.rimify.de' => [['target' => 'feedback-smtp.eu-north-1.amazonses.com']],
                $type === DNS_CNAME => [['target' => str_replace('._domainkey.rimify.de', '', $host).'.dkim.amazonses.com']],
                $type === DNS_TXT && $host === '_dmarc.rimify.de' => [['txt' => 'v=DMARC1; p=quarantine; rua=mailto:dmarc@rimify.de']],
                default => [],
            };
        }
    });

    $checks = goLiveById();

    expect($checks['mailversand']->state)->toBe(GoLiveCheck::OK)
        ->and($checks['mailversand']->sentence)->toBe('Die Mails des Shops gehen über Amazon SES (eu-north-1), Absender bestellung@rimify.de.')
        ->and($checks['mail_dns']->state)->toBe(GoLiveCheck::OK)
        ->and($checks['mail_dns']->sentence)->toBe('SPF, DKIM (drei CNAME-Einträge) und DMARC für rimify.de stehen im DNS.')
        ->and($checks['bestaetigung']->sentence)->toStartWith('Die Bestätigung wird über Amazon SES verschickt');
});
