<?php

declare(strict_types=1);

namespace App\Services\Legal;

use App\Models\AdminInvitation;
use App\Models\ContactMessage;
use App\Models\CustomerAccount;
use App\Payments\PaymentConfig;
use App\Services\Commerce\OrderPayments;
use App\Services\GoLive\GoLiveChecks;
use App\Services\Mail\DnsLookup;
use App\Services\Mail\MailSettings;
use App\Services\Reset\TestEnvironment;
use App\Services\Storage\StorageConfig;
use App\Services\Storage\StorageSettings;
use App\Support\GermanFormat;
use Carbon\CarbonImmutable;
use Throwable;

/**
 * docs/legal/VERARBEITUNG.md, written from the configuration of the installation it runs on (the brief „AFTER CI“, §6)
 * — never typed by hand: which service providers handle the shop's personal data, for what, from where, on which legal
 * basis and under which agreement, and in which state each is here; then how long each kind of data is kept, read
 * from the constants and settings that keep it. A provider that is not in use here says so, and a period the code does
 * not enforce says that too: the record is the shop as it is, for the client and the Kanzlei to check.
 *
 * Written in German: its readers are the client and the Kanzlei.
 */
final class ProcessingRecord
{
    /** The providers' own addresses, as their contracts name them. */
    private const HOSTINGER = 'Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaka, Zypern';

    private const AWS = 'Amazon Web Services EMEA SARL, 38 Avenue John F. Kennedy, L-1855 Luxemburg';

    private const STRIPE = 'Stripe Payments Europe, Ltd., One Wilton Park, Wilton Place, Dublin 2, D02 FX04, Irland';

    /** Mail providers known by their MX hosts, for the shop's own mailbox. */
    private const MAILBOXES = [
        'ionos' => '1&1 IONOS SE, Elgendorfer Straße 57, 56410 Montabaur, Deutschland',
        'hostinger' => self::HOSTINGER,
        'google' => 'Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland',
        'outlook' => 'Microsoft Ireland Operations Limited, One Microsoft Place, South County Business Park, Leopardstown, Dublin 18, Irland',
    ];

    private const COUNTRIES = ['de' => 'Deutschland', 'us' => 'USA', 'uk' => 'Vereinigtes Königreich', 'nl' => 'Niederlande', 'lt' => 'Litauen', 'fr' => 'Frankreich', 'se' => 'Schweden', 'fi' => 'Finnland', 'in' => 'Indien', 'sg' => 'Singapur', 'br' => 'Brasilien', 'id' => 'Indonesien'];

    private const REGIONS = ['eu-north-1' => 'Stockholm, Schweden', 'eu-central-1' => 'Frankfurt am Main, Deutschland', 'eu-west-1' => 'Irland', 'eu-west-3' => 'Paris, Frankreich', 'eu-south-1' => 'Mailand, Italien'];

    public function __construct(
        private readonly StorageSettings $storage,
        private readonly MailSettings $mail,
        private readonly DnsLookup $dns,
    ) {}

    public function markdown(?string $hostname = null, ?CarbonImmutable $at = null): string
    {
        $hostname ??= (string) gethostname();
        $at ??= CarbonImmutable::now('Europe/Berlin');
        $lines = [
            '# Verarbeitung personenbezogener Daten – Dienstleister und Speicherfristen',
            '',
            '> Erzeugt mit `php artisan rimify:verarbeitung` aus der Konfiguration dieser Installation – nicht von Hand geschrieben.',
            '> Stand: '.GermanFormat::dateTime($at).' · Server: `'.$hostname.'` · Umgebung: `'.app()->environment().'`.',
            '> Für den Kunden und die Kanzlei: was der Shop heute tatsächlich tut. Was offen ist, steht als „offen“ da.',
            '',
            '## 1 · Dienstleister, die personenbezogene Daten für den Shop verarbeiten',
            '',
        ];

        foreach ($this->processors($hostname) as $i => $p) {
            $lines[] = '### 1.'.($i + 1).' · '.$p['name'];
            $lines[] = '';
            $lines[] = '| | |';
            $lines[] = '|---|---|';
            $lines[] = '| Stand hier | '.$p['status'].' |';
            $lines[] = '| Unternehmen | '.$p['company'].' |';
            $lines[] = '| Ort der Verarbeitung | '.$p['where'].' |';
            $lines[] = '| Zweck | '.$p['purpose'].' |';
            $lines[] = '| Daten | '.$p['data'].' |';
            $lines[] = '| Rechtsgrundlage | '.$p['basis'].' |';
            $lines[] = '| Vertrag zur Auftragsverarbeitung | '.$p['agreement'].' |';
            $lines[] = '';
        }

        $lines[] = '### Keine Dienstleister im Sinne dieser Liste';
        $lines[] = '';
        $lines[] = '- **Im Browser lädt der Shop nichts von Dritten:** Schriften, Bilder, Skripte und Stile kommen vom eigenen Server; einzige Ausnahmen sind der Medien-Bucket (1.2) und Stripe auf der Kasse (1.4). Die Qualitätsprüfung `scripts/qa/third-party.mjs` (G8) lässt jede andere Anfrage an einen fremden Server scheitern.';
        $lines[] = '- **Fahrzeugschein-Erkennung:** läuft auf dem Gerät des Kunden; das Foto verlässt es nicht.';
        $lines[] = '- **GitHub:** Quellcode und Tests des Shops, keine Kundendaten.';
        $lines[] = '- **Keine Statistik, keine Werbung, kein Tracking:** Der Shop setzt nur notwendige und funktionale Cookies (2.3).';
        $lines[] = '';

        $lines[] = '## 2 · Speicherfristen, wie der Code sie umsetzt';
        $lines[] = '';
        $lines[] = '| Daten | Frist | Umgesetzt durch |';
        $lines[] = '|---|---|---|';

        foreach ($this->retention() as [$data, $period, $how]) {
            $lines[] = "| {$data} | {$period} | {$how} |";
        }

        $lines[] = '';
        $lines[] = '### 2.3 · Cookies';
        $lines[] = '';
        $lines[] = '| Cookie | Speichert | Dauer |';
        $lines[] = '|---|---|---|';

        foreach (self::cookies() as $cookie) {
            $lines[] = '| `'.$cookie['name'].'` | '.$cookie['stores'].' | '.$cookie['lifetime'].' |';
        }

        $lines[] = '';
        $lines[] = '## 3 · Offen für die Kanzlei';
        $lines[] = '';

        foreach ($this->open($hostname) as $item) {
            $lines[] = '- '.$item;
        }

        return implode("\n", $lines)."\n";
    }

    /** @return list<array{name: string, status: string, company: string, where: string, purpose: string, data: string, basis: string, agreement: string}> */
    private function processors(string $hostname): array
    {
        return [$this->host($hostname), $this->bucket(), $this->ses(), $this->stripe(), $this->mailbox()];
    }

    /** @return array{name: string, status: string, company: string, where: string, purpose: string, data: string, basis: string, agreement: string} */
    private function host(string $hostname): array
    {
        $where = GoLiveChecks::locationOf($hostname);
        $country = $where === null ? null : (self::COUNTRIES[$where['country']] ?? strtoupper($where['country']));

        return [
            'name' => 'Hosting: Webserver, Datenbank, CDN',
            'status' => $where === null
                ? "Auf dieser Installation (`{$hostname}`) nicht feststellbar – sie läuft nicht bei Hostinger."
                : "In Betrieb: Server `{$hostname}` in {$country}.".($where['country'] === 'de' ? '' : ' Entschieden ist Hostingers Rechenzentrum in Deutschland (D-181, docs/ops/UMZUG-DE.md).'),
            'company' => self::HOSTINGER,
            'where' => $country === null ? 'Rechenzentrum laut Hostinger-Vertrag' : "Rechenzentrum in {$country}; der Shop läuft hinter Hostingers CDN.",
            'purpose' => 'Betrieb des Shops: Webserver, Datenbank, Dateien auf dem Server, Server-Logs, das CDN vor der Seite, Hostingers eigene Sicherungen.',
            'data' => 'Alle Daten des Shops: Kundenkonten, Liefer- und Rechnungsanschriften, Bestellungen und Rechnungen, Fahrzeugangaben (HSN/TSN, Angaben aus dem Fahrzeugschein), Nachrichten aus dem Kontaktformular, Bewertungen, das Protokoll; IP-Adressen in den Server-Logs.',
            'basis' => 'Art. 6 Abs. 1 lit. b DSGVO (Vertrag), lit. c (Aufbewahrungspflichten), lit. f (sicherer Betrieb).',
            'agreement' => 'Hostinger stellt seinen Auftragsverarbeitungsvertrag (Data Processing Agreement) als Teil seiner Nutzungsbedingungen bereit. Für den Vertrag des Live-Shops: offen – der Vertragsinhaber bestätigt ihn bei Hostinger.',
        ];
    }

    /** @return array{name: string, status: string, company: string, where: string, purpose: string, data: string, basis: string, agreement: string} */
    private function bucket(): array
    {
        $set = $this->storage->current();
        $region = self::REGIONS[$set->region] ?? $set->region;

        return [
            'name' => 'Speicher für Fotos und Dokumente (AWS S3)',
            'status' => match ($set->source) {
                StorageConfig::LOCAL => 'Nicht in Betrieb: Die Dateien liegen auf dem Webserver (1.1).',
                default => 'In Betrieb: Bucket `'.$set->bucket.'` in `'.$set->region.'`, eingetragen '.($set->source === StorageConfig::DATABASE ? 'in Einstellungen › Medien und Speicher.' : 'in der .env-Datei.'),
            },
            'company' => self::AWS,
            'where' => "AWS-Region `{$set->region}` ({$region}).",
            'purpose' => 'Ablage der Felgenfotos, der Bilder der Inhaltsseiten, der Gutachten-PDFs, der Rechnungen und Gutschriften (privat, nur über signierte Links) und der Exporte.',
            'data' => 'Rechnungen und Gutschriften (Name, Anschrift, Bestellinhalt, Beträge), Exporte von Bestellungen, hochgeladene Dokumente. Fotos und Gutachten enthalten keine Kundendaten.',
            'basis' => 'Art. 6 Abs. 1 lit. b DSGVO (Vertrag), lit. c (Aufbewahrung der Rechnungen).',
            'agreement' => 'AWS Data Processing Addendum: Teil der AWS Service Terms, gilt für jedes AWS-Konto ohne gesonderte Unterschrift.',
        ];
    }

    /** @return array{name: string, status: string, company: string, where: string, purpose: string, data: string, basis: string, agreement: string} */
    private function ses(): array
    {
        $sending = $this->mail->sending();

        return [
            'name' => 'E-Mail-Versand (Amazon SES)',
            'status' => $sending !== null
                ? 'In Betrieb: Absender `'.$sending->from_address.'`, Region `'.$sending->region.'`.'
                : 'Noch nicht eingesetzt: Die Mails des Shops gehen ins Protokoll (`'.config('mail.default').'`) und erreichen niemanden, bis der Zugang in Einstellungen › E-Mail eingetragen und freigegeben ist (D-182).',
            'company' => self::AWS,
            'where' => 'AWS-Region `eu-north-1` (Stockholm, Schweden) – dieselbe wie der Bucket.',
            'purpose' => 'Versand der Mails des Shops: Bestellbestätigung mit Rechnung, AGB und Widerrufsbelehrung, Versand- und Erstattungsmails, Anmeldelinks, Antworten auf Anfragen; Rückmeldung unzustellbarer Adressen und Beschwerden.',
            'data' => 'E-Mail-Adresse und Name der Empfänger, der Inhalt der Mails mit ihren Anhängen, Zustellmeldungen (unzustellbar, Beschwerde).',
            'basis' => 'Art. 6 Abs. 1 lit. b DSGVO (Vertrag, § 312f BGB), lit. c.',
            'agreement' => 'Wie 1.2: das AWS Data Processing Addendum.',
        ];
    }

    /** @return array{name: string, status: string, company: string, where: string, purpose: string, data: string, basis: string, agreement: string} */
    private function stripe(): array
    {
        $driver = (string) config('rimify.payments.driver');

        try {
            $test = PaymentConfig::current()->testMode();
        } catch (Throwable) {
            $test = true;
        }

        return [
            'name' => 'Zahlungen (Stripe)',
            'status' => match ($driver) {
                'stripe' => $test ? 'In Betrieb im Testmodus: Es fließt kein Geld.' : 'In Betrieb im Livemodus.',
                'sandbox' => 'Nicht in Betrieb: Bestellungen werden mit der eingebauten Testzahlung abgeschlossen, ohne Stripe.',
                default => 'Nicht in Betrieb: Der Shop nimmt keine Zahlungen an.',
            },
            'company' => self::STRIPE,
            'where' => 'Irland (EWR). Stripe.js lädt im Browser nur auf der Kasse.',
            'purpose' => 'Abwicklung der Zahlung: Karte, Lastschrift und Wallets, Erstattungen und Rückbuchungen.',
            'data' => 'Name, E-Mail-Adresse, Rechnungsanschrift, Betrag und Bestellnummer. Kartendaten und Bankverbindung gibt der Kunde direkt in Stripes Feldern ein – sie erreichen den Server des Shops nie. Geräte- und Verbindungsdaten zur Betrugsabwehr erhebt Stripe selbst.',
            'basis' => 'Art. 6 Abs. 1 lit. b DSGVO (Vertrag); die Betrugsabwehr verantwortet Stripe nach Art. 6 Abs. 1 lit. f selbst.',
            'agreement' => 'Stripes Datenverarbeitungsvereinbarung (DPA) ist Teil des Stripe Services Agreement; für Betrugsabwehr und gesetzliche Pflichten ist Stripe eigener Verantwortlicher.',
        ];
    }

    /** @return array{name: string, status: string, company: string, where: string, purpose: string, data: string, basis: string, agreement: string} */
    private function mailbox(): array
    {
        $address = (string) config('rimify.contact.email');
        $domain = str_contains($address, '@') ? substr($address, (int) strrpos($address, '@') + 1) : '';
        $hosts = array_map(static fn (array $r): string => strtolower((string) ($r['target'] ?? '')), $domain === '' ? [] : $this->dns->records($domain, DNS_MX));
        $company = null;

        foreach (self::MAILBOXES as $needle => $name) {
            foreach ($hosts as $host) {
                if (str_contains($host, $needle)) {
                    $company = $name;
                }
            }
        }

        return [
            'name' => 'Postfach des Shops',
            'status' => $address === ''
                ? 'Keine Adresse eingetragen.'
                : "`{$address}`".($hosts === [] ? ' – der Mailserver der Domain war nicht abzufragen.' : ', Mailserver: '.implode(', ', array_map(static fn (string $h): string => "`{$h}`", $hosts)).'.'),
            'company' => $company ?? 'Der Anbieter des Postfachs (nach dem Mailserver oben).',
            'where' => 'Laut Vertrag des Postfach-Anbieters.',
            'purpose' => 'Empfang der Mails an den Shop: Kontaktanfragen (der Shop schickt jede auch dorthin), Antworten von Kunden, Meldungen an das Team.',
            'data' => 'Name und E-Mail-Adresse der Schreibenden, der Inhalt ihrer Nachrichten, Bestellnummern.',
            'basis' => 'Art. 6 Abs. 1 lit. b DSGVO (Anfragen zu Vertrag und Bestellung), lit. f (sonstige Anfragen).',
            'agreement' => 'Offen: der Vertrag des Kunden mit dem Anbieter seines Postfachs; Anbieter wie IONOS stellen den Auftragsverarbeitungsvertrag im Kundenkonto bereit.',
        ];
    }

    /** @return list<array{0: string, 1: string, 2: string}> */
    private function retention(): array
    {
        $logDays = (int) config('logging.channels.daily.max_files', 14);
        $slowDays = (int) config('logging.channels.slow_queries.max_files', 14);

        return [
            ['Kontaktanfragen', ContactMessage::KEEP_MONTHS.' Monate', '`model:prune` täglich 03:30 (`ContactMessage::KEEP_MONTHS`)'],
            ['Unbezahlte Bestellungen', 'verfallen nach '.OrderPayments::HOURS_TO_PAY.' Stunden; der Bestand geht zurück, der Datensatz bleibt', '`orders:expire` alle zehn Minuten (`OrderPayments::HOURS_TO_PAY`) – eine Löschung ist **nicht umgesetzt** (3)'],
            ['Bestellungen, Rechnungen, Gutschriften', 'ohne Ende; Rechnungen unveränderlich', 'Datenbank-Trigger; eine Löschung nach Ablauf der Pflicht (§ 147 AO, § 14b UStG: 10 Jahre) ist **nicht umgesetzt** (3)'],
            ['Prüfnachweise der Bestellungen, Protokoll', 'ohne Ende, unveränderlich', 'CLAUDE.md R-12: Trigger mit SQLSTATE 45000'],
            ['Zahlungsereignisse von Stripe', 'ohne Ende, unveränderlich', 'Trigger auf `payment_events`'],
            ['Kundenkonto', 'bis der Kunde es löscht (Konto › Konto löschen); Bestellungen und Rechnungen bleiben', '`KontoController::destroy`'],
            ['Gesperrte E-Mail-Adressen (unzustellbar, Beschwerde)', 'bis ein Admin die Sperre aufhebt', 'Einstellungen › E-Mail'],
            ['Server-Log', $logDays.' Tage', '`config/logging.php` › `daily.max_files`'],
            ['Log langsamer Datenbankabfragen', $slowDays.' Tage', '`config/logging.php` › `slow_queries.max_files`'],
            ['Log des Server-Renderings (`storage/logs/ssr.log`)', 'ohne Ende', 'wird angehängt, nicht rotiert – **offen** (3)'],
            ['Sitzung (Warenkorb, Anmeldung)', config('session.lifetime').' Minuten ohne Aktivität', '`config/session.php`'],
            ['Link zum Passwort des Kundenkontos', CustomerAccount::LINK_HOURS.' Stunden', '`CustomerAccount::LINK_HOURS`'],
            ['Einladung ins Team', AdminInvitation::VALID_DAYS.' Tage', '`AdminInvitation::VALID_DAYS`'],
            ['Einladung zur Bewertung', 'geht '.config('rimify.reviews.invite_after_days').' Tage nach der Zustellung; ihr Link gilt '.config('rimify.reviews.link_days').' Tage', '`config/rimify.php` › `reviews`'],
            ['Sicherungskopien beim Zurücksetzen der Testumgebung', TestEnvironment::KEEP_DAYS.' Tage, dann gelöscht und protokolliert – nur in der Testumgebung, nie im Live-Shop', '`rimify:reset --prune` stündlich (`TestEnvironment::KEEP_DAYS`)'],
            ['Sicherung vor einem Release', 'eine Woche auf dem Server, von Hand gelöscht', 'docs/launch/GO-LIVE.md §1'],
            ['Hostingers eigene Sicherungen', 'nach Hostingers Tarif', 'Hostinger, nicht der Shop'],
        ];
    }

    /** @return list<string> */
    private function open(string $hostname): array
    {
        $where = GoLiveChecks::locationOf($hostname);

        return array_values(array_filter([
            $where !== null && $where['country'] !== 'de' ? 'Der Server steht noch nicht in Deutschland (1.1): Umzug nach docs/ops/UMZUG-DE.md oder Live-Shop gleich in Deutschland anlegen.' : null,
            'Abgelaufene unbezahlte Bestellungen bleiben mit Name und Anschrift gespeichert. Frist und Löschung festlegen.',
            'Bestellungen, Rechnungen und Prüfnachweise werden nicht gelöscht, auch nicht nach Ablauf der Aufbewahrungspflicht. Frist festlegen; die Prüfnachweise und das Protokoll sind nach CLAUDE.md R-12 unveränderlich, eine Löschung braucht eine eigene Entscheidung.',
            'Das Log des Server-Renderings wird nicht rotiert (es enthält Seitenpfade, keine Kundendaten).',
            'Verträge zur Auftragsverarbeitung für den Live-Shop nachweisen: Hostinger (1.1), Postfach (1.5); AWS und Stripe gelten mit ihren Bedingungen.',
        ]));
    }

    /** @return list<array{name: string, stores: string, lifetime: string}> */
    private static function cookies(): array
    {
        $source = is_file(base_path('resources/js/legal/cookies.ts')) ? (string) file_get_contents(base_path('resources/js/legal/cookies.ts')) : '';
        preg_match_all("/name:\s*'([^']+)'.*?stores:\s*'([^']+)'.*?lifetime:\s*'([^']+)'/s", $source, $m, PREG_SET_ORDER);

        return array_map(static fn (array $c): array => ['name' => $c[1], 'stores' => $c[2], 'lifetime' => $c[3]], $m);
    }
}
