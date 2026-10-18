<?php

declare(strict_types=1);

namespace App\Services\Legal;

use App\Domain\Storefront\PapersBook;
use App\Models\AdminInvitation;
use App\Models\CheckResult;
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
            '> Für den Betreiber und die Kanzlei: was der Shop heute tatsächlich tut. Was offen ist, steht als „offen“ da.',
            '',
            '## 1 · Dienstleister, die personenbezogene Daten für den Shop verarbeiten',
            '',
        ];

        foreach ($this->processors($hostname) as $i => $p) {
            $lines[] = '### 1.'.($i + 1).' · '.$p['name'];
            $lines[] = '';
            $lines[] = '| | |';
            $lines[] = '|---|---|';
            $lines[] = '| Stand in dieser Installation | '.$p['status'].' |';
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
        $lines[] = '- **Im Browser lädt der Shop nichts von Dritten:** Schriften, Bilder, Skripte und Stile kommen vom eigenen Server; einzige Ausnahmen sind der Medien-Bucket (1.2) und Stripe an der Kasse (1.4). Die Qualitätsprüfung `scripts/qa/third-party.mjs` (G8) schlägt bei jeder anderen Anfrage an einen fremden Server fehl.';
        $lines[] = '- **Fahrzeugschein-Erkennung:** läuft auf dem Gerät des Kunden; das Foto verlässt es nicht.';
        $lines[] = '- **GitHub:** Quellcode und Tests des Shops, keine Kundendaten.';
        $lines[] = '- **Keine Statistik, keine Werbung, kein Tracking:** Der Shop setzt nur notwendige und funktionale Cookies (2.1).';
        $lines[] = '';

        $lines[] = '## 2 · Speicherfristen, wie der Code sie umsetzt';
        $lines[] = '';
        $lines[] = '| Daten | Frist | Umgesetzt durch |';
        $lines[] = '|---|---|---|';

        foreach ($this->retention() as [$data, $period, $how]) {
            $lines[] = "| {$data} | {$period} | {$how} |";
        }

        $lines[] = '';
        $lines[] = '### 2.1 · Cookies';
        $lines[] = '';
        $lines[] = '| Cookie | Speichert | Dauer |';
        $lines[] = '|---|---|---|';

        foreach (self::cookies() as $cookie) {
            $lines[] = '| `'.$cookie['name'].'` | '.$cookie['stores'].' | '.$cookie['lifetime'].' |';
        }

        $lines[] = '';
        $lines[] = '### 2.2 · Werte aus der Zulassungsbescheinigung';
        $lines[] = '';
        $lines[] = '| | |';
        $lines[] = '|---|---|';

        foreach (self::papers() as [$label, $text]) {
            $lines[] = "| {$label} | {$text} |";
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
                : "In Betrieb: Server `{$hostname}`, Standort {$country}.".($where['country'] === 'de' ? '' : ' Entschieden ist Hostingers Rechenzentrum in Deutschland (D-181, docs/ops/UMZUG-DE.md).'),
            'company' => self::HOSTINGER,
            'where' => $country === null ? 'Rechenzentrum laut Hostinger-Vertrag.' : "Standort des Rechenzentrums: {$country}. Der Shop läuft hinter Hostingers CDN.",
            'purpose' => 'Betrieb des Shops: Webserver, Datenbank, Dateien auf dem Server, Server-Logs, das CDN vor der Seite, Hostingers eigene Sicherungen.',
            'data' => 'Alle Daten des Shops: Kundenkonten, Liefer- und Rechnungsanschriften, Bestellungen und Rechnungen, Fahrzeugangaben (HSN/TSN, Angaben aus dem Fahrzeugschein), Nachrichten aus dem Kontaktformular, Bewertungen, das Protokoll; IP-Adressen in den Server-Logs.',
            'basis' => 'Art. 6 Abs. 1 lit. b DSGVO (Vertrag), lit. c (Aufbewahrungspflichten), lit. f (sicherer Betrieb).',
            'agreement' => 'Hostinger stellt seinen Auftragsverarbeitungsvertrag (Data Processing Agreement) als Teil seiner Nutzungsbedingungen bereit. Für den Live-Shop offen: Der Vertragsinhaber bestätigt den Auftragsverarbeitungsvertrag bei Hostinger.',
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
                : 'Noch nicht in Betrieb: Die Mails des Shops gehen ins Server-Log (`'.config('mail.default').'`) und erreichen niemanden, bis der Zugang in Einstellungen › E-Mail eingetragen und freigegeben ist (D-182).',
            'company' => self::AWS,
            'where' => 'AWS-Region `eu-north-1` (Stockholm, Schweden) – dieselbe wie beim Bucket.',
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
            'where' => 'Irland (EWR). Stripe.js lädt im Browser nur an der Kasse.',
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
            'agreement' => 'Offen: der Vertrag des Betreibers mit dem Anbieter seines Postfachs; Anbieter wie IONOS stellen den Auftragsverarbeitungsvertrag im Kundenkonto bereit.',
        ];
    }

    /**
     * The server log as this installation writes it: the channel in force — through the stack, which LOG_STACK names —
     * kept its `max_files` days when it rotates daily, and a single file that only grows when it does not. A fresh
     * checkout's `.env.example` says `single`; the preview says `daily` (read 06.10.2026).
     *
     * @return array{0: string, 1: string, 2: string}
     */
    private static function serverLog(): array
    {
        $default = (string) config('logging.default');
        $names = $default === 'stack' ? array_values(array_filter((array) config('logging.channels.stack.channels', []), 'is_string')) : [$default];
        $rotated = [];
        $single = [];

        foreach ($names as $name) {
            match ((string) config("logging.channels.{$name}.driver")) {
                'daily' => $rotated[] = (int) config("logging.channels.{$name}.max_files", 14),
                'single' => $single[] = $name,
                default => null,
            };
        }

        return match (true) {
            $single !== [] => ['Server-Log', 'unbefristet: eine einzige Datei, die nicht rotiert wird', 'Kanal „'.implode('“, „', $single).'“ (`LOG_STACK`) – **offen** (3)'],
            $rotated !== [] => ['Server-Log', max($rotated).' Tage', 'täglich neue Datei, `config/logging.php` › `max_files` (Kanal „'.implode('“, „', $names).'“)'],
            default => ['Server-Log', 'nach dem Kanal „'.$default.'“', '`config/logging.php`'],
        };
    }

    /** Whether the server log only grows: one file, never rotated. */
    private static function serverLogUnrotated(): bool
    {
        return str_starts_with(self::serverLog()[1], 'unbefristet');
    }

    /** @return list<array{0: string, 1: string, 2: string}> */
    private function retention(): array
    {
        $slowDays = (int) config('logging.channels.slow_queries.max_files', 14);

        return [
            ['Kontaktanfragen', ContactMessage::KEEP_MONTHS.' Monate', '`model:prune` täglich um 03:30'.GermanFormat::NBSP.'Uhr (`ContactMessage::KEEP_MONTHS`)'],
            ['Ausdruckbarer RIMIFY-Check, mit den Werten aus der Zulassungsbescheinigung (2.2)', CheckResult::KEEP_MONTHS.' Monate', '`model:prune` täglich um 03:30'.GermanFormat::NBSP.'Uhr (`CheckResult::KEEP_MONTHS`)'],
            ['Unbezahlte Bestellungen', 'verfallen nach '.OrderPayments::HOURS_TO_PAY.' Stunden; der Bestand geht zurück, der Datensatz bleibt', '`orders:expire` alle zehn Minuten (`OrderPayments::HOURS_TO_PAY`) – eine Löschung ist **nicht umgesetzt** (3)'],
            // No period named here: which one applies to invoices since 2025 is the Kanzlei's to say (client-questions 36).
            ['Bestellungen, Rechnungen, Gutschriften', 'unbefristet; Rechnungen unveränderlich', 'Datenbank-Trigger; eine Löschung nach Ablauf der Aufbewahrungspflicht (§ 147 AO, § 14b UStG – die Frist bestätigt die Kanzlei) ist **nicht umgesetzt** (3)'],
            ['Prüfnachweise der Bestellungen, Protokoll', 'unbefristet, unveränderlich', 'CLAUDE.md R-12: Trigger mit SQLSTATE 45000'],
            ['Zahlungsereignisse von Stripe', 'unbefristet, unveränderlich', 'Trigger auf `payment_events`'],
            ['Kundenkonto', 'bis der Kunde es löscht (Konto › Konto löschen); Bestellungen und Rechnungen bleiben', '`KontoController::destroy`'],
            ['Gesperrte E-Mail-Adressen (unzustellbar, Beschwerde)', 'bis ein Admin die Sperre aufhebt', 'Einstellungen › E-Mail'],
            self::serverLog(),
            ['Log langsamer Datenbankabfragen', $slowDays.' Tage', '`config/logging.php` › `slow_queries.max_files`'],
            ['Log des Server-Renderings (`storage/logs/ssr.log`)', 'unbefristet', 'wächst fortlaufend, wird nicht rotiert – **offen** (3)'],
            ['Sitzung (Warenkorb, Anmeldung)', config('session.lifetime').' Minuten ohne Aktivität', '`config/session.php`'],
            ['Link zum Festlegen des Passworts für das Kundenkonto', CustomerAccount::LINK_HOURS.' Stunden', '`CustomerAccount::LINK_HOURS`'],
            ['Einladung ins Team', AdminInvitation::VALID_DAYS.' Tage', '`AdminInvitation::VALID_DAYS`'],
            ['Einladung zur Bewertung', 'wird '.config('rimify.reviews.invite_after_days').' Tage nach der Zustellung verschickt; ihr Link gilt '.config('rimify.reviews.link_days').' Tage', '`config/rimify.php` › `reviews`'],
            ['Sicherungskopien beim Zurücksetzen der Testumgebung', TestEnvironment::KEEP_DAYS.' Tage, dann gelöscht und protokolliert – nur in der Testumgebung, nie im Live-Shop', '`rimify:reset --prune` stündlich (`TestEnvironment::KEEP_DAYS`)'],
            ['Sicherung vor einem Release', 'eine Woche auf dem Server, von Hand gelöscht', 'docs/launch/GO-LIVE.md § 1'],
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
            self::serverLogUnrotated() ? 'Das Server-Log ist eine einzige Datei, die nicht rotiert wird (`LOG_STACK=single`): auf `daily` umstellen, dann gilt die Frist aus `max_files`.' : null,
            'Das Log des Server-Renderings wird nicht rotiert (es enthält Seitenpfade, keine Kundendaten).',
            'Verträge zur Auftragsverarbeitung für den Live-Shop nachweisen: Hostinger (1.1), Postfach (1.5); bei AWS und Stripe sind sie Teil der Vertragsbedingungen.',
            'Werte aus der Zulassungsbescheinigung (2.2): ob sie ohne Namen, Kennzeichen und Fahrgestellnummer personenbezogen sind, ob die Rechtsgrundlage stimmt und ob die Fristen (Cookie '.self::papersCookieDays().' Tage, RIMIFY-Check '.CheckResult::KEEP_MONTHS.' Monate) passen.',
        ]));
    }

    /**
     * The figures a customer types from their papers (the operator's brief of 18.10.2026, §4): what they are, why the
     * shop asks, on which basis, and where each copy is kept for how long — read from the constants that keep them.
     *
     * @return list<array{0: string, 1: string}>
     */
    private static function papers(): array
    {
        return [
            ['Daten', 'Die Werte, die ein Kunde aus seiner Zulassungsbescheinigung Teil'.GermanFormat::NBSP.'I einträgt: die zulässigen Achslasten (8.1, 8.2) und die Höchstgeschwindigkeit (T), wenn er will auch die Leistung (P.2) sowie Tragfähigkeits- und Geschwindigkeitsindex der Reifen (15.1, 15.2). Name, Kennzeichen und Fahrgestellnummer fragt der Shop dazu nicht ab.'],
            ['Zweck', 'Die Antwort, welche Reifen zu einer Felge an diesem Fahrzeug zulässig sind – Tragfähigkeit und Geschwindigkeit (CLAUDE.md R-03). Gefragt wird nur nach den Werten, die dem Shop für diese Antwort fehlen.'],
            ['Rechtsgrundlage', 'Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahme auf Anfrage des Kunden); für das Cookie § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich für einen vom Kunden ausdrücklich gewünschten Dienst). Beides bestätigt die Kanzlei (3).'],
            ['Im Browser des Kunden', 'Cookie `rmf_papiere`: '.self::papersCookieDays().' Tage ab dem letzten Eintrag (`PapersBook::LIFETIME_MINUTES`). Der Kunde löscht die Werte mit „Werte löschen“ oder mit seinen Cookies.'],
            ['Im ausdruckbaren RIMIFY-Check', 'Wenn der Kunde einen Check druckt, mit dessen Ergebnis in der Datenbank (`check_results`). Gespeichert nur für diesen Check, deshalb mit ihm gelöscht: nach '.CheckResult::KEEP_MONTHS.' Monaten, `model:prune` täglich um 03:30'.GermanFormat::NBSP.'Uhr (`CheckResult::KEEP_MONTHS`, D-292).'],
            ['In einer Bestellung', 'Wenn der Kunde bestellt, die Achslasten und die Höchstgeschwindigkeit, mit denen das Ergebnis gerechnet wurde, im Prüfnachweis der Bestellposition (`order_line_fitments`): unveränderlich (CLAUDE.md R-12) und so lange wie die Bestellung (2).'],
        ];
    }

    /** The papers cookie's lifetime in days. */
    private static function papersCookieDays(): int
    {
        return intdiv(PapersBook::LIFETIME_MINUTES, 60 * 24);
    }

    /** @return list<array{name: string, stores: string, lifetime: string}> */
    private static function cookies(): array
    {
        $source = is_file(base_path('resources/js/legal/cookies.ts')) ? (string) file_get_contents(base_path('resources/js/legal/cookies.ts')) : '';
        preg_match_all("/name:\s*'([^']+)'.*?stores:\s*'([^']+)'.*?lifetime:\s*'([^']+)'/s", $source, $m, PREG_SET_ORDER);

        return array_map(static fn (array $c): array => ['name' => $c[1], 'stores' => $c[2], 'lifetime' => $c[3]], $m);
    }
}
