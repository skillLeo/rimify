<?php

declare(strict_types=1);

use App\Models\ContactMessage;
use App\Models\MailSetting;
use App\Services\Legal\ProcessingRecord;
use App\Services\Mail\DnsLookup;
use App\Services\Reset\TestEnvironment;
use Carbon\CarbonImmutable;

/*
 * docs/legal/VERARBEITUNG.md is written from the configuration, never by hand (the brief „AFTER CI“, §6): each
 * provider says the state it is in on this installation, and each period is the one the code enforces — change the
 * setting, and the record says the new thing.
 */

function processingRecord(string $host = 'us-bos-web1780.main-hosting.eu'): string
{
    return app(ProcessingRecord::class)->markdown($host, CarbonImmutable::parse('2026-10-06 21:00', 'Europe/Berlin'));
}

it('names every provider with company, place, purpose, data, legal basis and agreement', function (): void {
    $record = processingRecord();

    foreach (['Hostinger International Ltd.', 'Amazon Web Services EMEA SARL', 'Stripe Payments Europe, Ltd.'] as $company) {
        expect($record)->toContain($company);
    }

    expect(substr_count($record, '| Rechtsgrundlage | '))->toBe(5)
        ->and(substr_count($record, '| Vertrag zur Auftragsverarbeitung | '))->toBe(5)
        ->and($record)->toContain('Stand: 06.10.2026, 21:00')
        ->and($record)->toContain('Server: `us-bos-web1780.main-hosting.eu`');
});

it('says each provider\'s state here, as the configuration has it', function (): void {
    config(['rimify.payments.driver' => 'none', 'mail.default' => 'log']);

    $record = processingRecord();

    expect($record)->toContain('In Betrieb: Server `us-bos-web1780.main-hosting.eu` in USA. Entschieden ist Hostingers Rechenzentrum in Deutschland')
        ->and($record)->toContain('Nicht in Betrieb: Der Shop nimmt keine Zahlungen an.')
        ->and($record)->toContain('Noch nicht eingesetzt: Die Mails des Shops gehen ins Protokoll (`log`)')
        ->and($record)->toContain('Der Server steht noch nicht in Deutschland (1.1)');

    config(['rimify.payments.driver' => 'sandbox']);
    MailSetting::query()->forceCreate([
        'state' => MailSetting::ACTIVE, 'from_address' => 'bestellung@rimify.de', 'access_key' => 'FAKESESKEYFORTESTS12', 'secret' => 'fake/ses/secret/for/tests/only/00X9Y8', 'verified_at' => now(),
        'last_test' => ['ok' => true, 'production_access' => true, 'sending_enabled' => true, 'identity_verified' => true],
    ]);

    $germany = processingRecord('de-fra-web1500.main-hosting.eu');

    expect($germany)->toContain('In Betrieb: Server `de-fra-web1500.main-hosting.eu` in Deutschland.')
        ->and($germany)->not->toContain('Der Server steht noch nicht in Deutschland')
        ->and($germany)->toContain('Nicht in Betrieb: Bestellungen werden mit der eingebauten Testzahlung abgeschlossen')
        ->and($germany)->toContain('In Betrieb: Absender `bestellung@rimify.de`, Region `eu-north-1`.');
});

it('names the periods the code enforces, the seven-day reset copy among them — and follows a changed setting', function (): void {
    expect(processingRecord())->toContain('| Kontaktanfragen | '.ContactMessage::KEEP_MONTHS.' Monate |')
        ->toContain('| Sicherungskopien beim Zurücksetzen der Testumgebung | '.TestEnvironment::KEEP_DAYS.' Tage, dann gelöscht und protokolliert')
        ->toContain('| Server-Log | 14 Tage |')
        ->toContain('| `rmf_papiere` |');

    config(['logging.channels.daily.max_files' => 30, 'session.lifetime' => 45]);

    expect(processingRecord())->toContain('| Server-Log | 30 Tage |')
        ->toContain('| Sitzung (Warenkorb, Anmeldung) | 45 Minuten ohne Aktivität |');
});

it('names the shop\'s mailbox provider by its mail servers', function (): void {
    app()->instance(DnsLookup::class, new class extends DnsLookup
    {
        public function records(string $host, int $type): array
        {
            return $host === 'rimify.de' && $type === DNS_MX ? [['target' => 'mx00.ionos.de'], ['target' => 'mx01.ionos.de']] : [];
        }
    });

    expect(processingRecord())->toContain('`info@rimify.de`, Mailserver: `mx00.ionos.de`, `mx01.ionos.de`.')
        ->toContain('1&1 IONOS SE');
});

it('writes the file the repository keeps', function (): void {
    $path = 'storage/framework/testing/verarbeitung-'.bin2hex(random_bytes(4)).'.md';

    try {
        $this->artisan('rimify:verarbeitung', ['--path' => $path])->expectsOutputToContain('Written to')->assertSuccessful();

        expect((string) file_get_contents(base_path($path)))->toStartWith('# Verarbeitung personenbezogener Daten');
    } finally {
        @unlink(base_path($path));
    }
});
