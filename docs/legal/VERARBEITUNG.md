# Verarbeitung personenbezogener Daten – Dienstleister und Speicherfristen

> Erzeugt mit `php artisan rimify:verarbeitung` aus der Konfiguration dieser Installation – nicht von Hand geschrieben.
> Stand: 19.10.2026, 06:33 Uhr · Server: `us-bos-web1780.main-hosting.eu` · Umgebung: `staging`.
> Für den Betreiber und die Kanzlei: was der Shop heute tatsächlich tut. Was offen ist, steht als „offen“ da.

## 1 · Dienstleister, die personenbezogene Daten für den Shop verarbeiten

### 1.1 · Hosting: Webserver, Datenbank, CDN

| | |
|---|---|
| Stand in dieser Installation | In Betrieb: Server `us-bos-web1780.main-hosting.eu`, Standort USA. Entschieden ist Hostingers Rechenzentrum in Deutschland (D-181, docs/ops/UMZUG-DE.md). |
| Unternehmen | Hostinger International Ltd., 61 Lordou Vironos Street, 6023 Larnaka, Zypern |
| Ort der Verarbeitung | Standort des Rechenzentrums: USA. Der Shop läuft hinter Hostingers CDN. |
| Zweck | Betrieb des Shops: Webserver, Datenbank, Dateien auf dem Server, Server-Logs, das CDN vor der Seite, Hostingers eigene Sicherungen. |
| Daten | Alle Daten des Shops: Kundenkonten, Liefer- und Rechnungsanschriften, Bestellungen und Rechnungen, Fahrzeugangaben (HSN/TSN, Angaben aus dem Fahrzeugschein), Nachrichten aus dem Kontaktformular, Bewertungen, das Protokoll; IP-Adressen in den Server-Logs. |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO (Vertrag), lit. c (Aufbewahrungspflichten), lit. f (sicherer Betrieb). |
| Vertrag zur Auftragsverarbeitung | Hostinger stellt seinen Auftragsverarbeitungsvertrag (Data Processing Agreement) als Teil seiner Nutzungsbedingungen bereit. Für den Live-Shop offen: Der Vertragsinhaber bestätigt den Auftragsverarbeitungsvertrag bei Hostinger. |

### 1.2 · Speicher für Fotos und Dokumente (AWS S3)

| | |
|---|---|
| Stand in dieser Installation | In Betrieb: Bucket `rmfy-wbst-bkt-001` in `eu-north-1`, eingetragen in Einstellungen › Medien und Speicher. |
| Unternehmen | Amazon Web Services EMEA SARL, 38 Avenue John F. Kennedy, L-1855 Luxemburg |
| Ort der Verarbeitung | AWS-Region `eu-north-1` (Stockholm, Schweden). |
| Zweck | Ablage der Felgenfotos, der Bilder der Inhaltsseiten, der Gutachten-PDFs, der Rechnungen und Gutschriften (privat, nur über signierte Links) und der Exporte. |
| Daten | Rechnungen und Gutschriften (Name, Anschrift, Bestellinhalt, Beträge), Exporte von Bestellungen, hochgeladene Dokumente. Fotos und Gutachten enthalten keine Kundendaten. |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO (Vertrag), lit. c (Aufbewahrung der Rechnungen). |
| Vertrag zur Auftragsverarbeitung | AWS Data Processing Addendum: Teil der AWS Service Terms, gilt für jedes AWS-Konto ohne gesonderte Unterschrift. |

### 1.3 · E-Mail-Versand (Amazon SES)

| | |
|---|---|
| Stand in dieser Installation | Noch nicht in Betrieb: Die Mails des Shops gehen ins Server-Log (`log`) und erreichen niemanden, bis der Zugang in Einstellungen › E-Mail eingetragen und freigegeben ist (D-182). |
| Unternehmen | Amazon Web Services EMEA SARL, 38 Avenue John F. Kennedy, L-1855 Luxemburg |
| Ort der Verarbeitung | AWS-Region `eu-north-1` (Stockholm, Schweden) – dieselbe wie beim Bucket. |
| Zweck | Versand der Mails des Shops: Bestellbestätigung mit Rechnung, AGB und Widerrufsbelehrung, Versand- und Erstattungsmails, Anmeldelinks, Antworten auf Anfragen; Rückmeldung unzustellbarer Adressen und Beschwerden. |
| Daten | E-Mail-Adresse und Name der Empfänger, der Inhalt der Mails mit ihren Anhängen, Zustellmeldungen (unzustellbar, Beschwerde). |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO (Vertrag, § 312f BGB), lit. c. |
| Vertrag zur Auftragsverarbeitung | Wie 1.2: das AWS Data Processing Addendum. |

### 1.4 · Zahlungen (Stripe)

| | |
|---|---|
| Stand in dieser Installation | Nicht in Betrieb: Bestellungen werden mit der eingebauten Testzahlung abgeschlossen, ohne Stripe. |
| Unternehmen | Stripe Payments Europe, Ltd., One Wilton Park, Wilton Place, Dublin 2, D02 FX04, Irland |
| Ort der Verarbeitung | Irland (EWR). Stripe.js lädt im Browser nur an der Kasse. |
| Zweck | Abwicklung der Zahlung: Karte, Lastschrift und Wallets, Erstattungen und Rückbuchungen. |
| Daten | Name, E-Mail-Adresse, Rechnungsanschrift, Betrag und Bestellnummer. Kartendaten und Bankverbindung gibt der Kunde direkt in Stripes Feldern ein – sie erreichen den Server des Shops nie. Geräte- und Verbindungsdaten zur Betrugsabwehr erhebt Stripe selbst. |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO (Vertrag); die Betrugsabwehr verantwortet Stripe nach Art. 6 Abs. 1 lit. f selbst. |
| Vertrag zur Auftragsverarbeitung | Stripes Datenverarbeitungsvereinbarung (DPA) ist Teil des Stripe Services Agreement; für Betrugsabwehr und gesetzliche Pflichten ist Stripe eigener Verantwortlicher. |

### 1.5 · Postfach des Shops

| | |
|---|---|
| Stand in dieser Installation | `info@rimify.de`, Mailserver: `mx00.ionos.de`, `mx01.ionos.de`. |
| Unternehmen | 1&1 IONOS SE, Elgendorfer Straße 57, 56410 Montabaur, Deutschland |
| Ort der Verarbeitung | Laut Vertrag des Postfach-Anbieters. |
| Zweck | Empfang der Mails an den Shop: Kontaktanfragen (der Shop schickt jede auch dorthin), Antworten von Kunden, Meldungen an das Team. |
| Daten | Name und E-Mail-Adresse der Schreibenden, der Inhalt ihrer Nachrichten, Bestellnummern. |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO (Anfragen zu Vertrag und Bestellung), lit. f (sonstige Anfragen). |
| Vertrag zur Auftragsverarbeitung | Offen: der Vertrag des Betreibers mit dem Anbieter seines Postfachs; Anbieter wie IONOS stellen den Auftragsverarbeitungsvertrag im Kundenkonto bereit. |

### Keine Dienstleister im Sinne dieser Liste

- **Im Browser lädt der Shop nichts von Dritten:** Schriften, Bilder, Skripte und Stile kommen vom eigenen Server; einzige Ausnahmen sind der Medien-Bucket (1.2) und Stripe an der Kasse (1.4). Die Qualitätsprüfung `scripts/qa/third-party.mjs` (G8) schlägt bei jeder anderen Anfrage an einen fremden Server fehl.
- **Fahrzeugschein-Erkennung:** läuft auf dem Gerät des Kunden; das Foto verlässt es nicht.
- **GitHub:** Quellcode und Tests des Shops, keine Kundendaten.
- **Keine Statistik, keine Werbung, kein Tracking:** Der Shop setzt nur notwendige und funktionale Cookies (2.1).

## 2 · Speicherfristen, wie der Code sie umsetzt

| Daten | Frist | Umgesetzt durch |
|---|---|---|
| Kontaktanfragen | 12 Monate | `model:prune` täglich um 03:30 Uhr (`ContactMessage::KEEP_MONTHS`) |
| Ausdruckbarer RIMIFY-Check, mit den Werten aus der Zulassungsbescheinigung (2.2) | 12 Monate | `model:prune` täglich um 03:30 Uhr (`CheckResult::KEEP_MONTHS`) |
| Unbezahlte Bestellungen | verfallen nach 24 Stunden; der Bestand geht zurück, der Datensatz bleibt | `orders:expire` alle zehn Minuten (`OrderPayments::HOURS_TO_PAY`) – eine Löschung ist **nicht umgesetzt** (3) |
| Bestellungen, Rechnungen, Gutschriften | unbefristet; Rechnungen unveränderlich | Datenbank-Trigger; eine Löschung nach Ablauf der Aufbewahrungspflicht (§ 147 AO, § 14b UStG – die Frist bestätigt die Kanzlei) ist **nicht umgesetzt** (3) |
| Prüfnachweise der Bestellungen, Protokoll | unbefristet, unveränderlich | CLAUDE.md R-12: Trigger mit SQLSTATE 45000 |
| Zahlungsereignisse von Stripe | unbefristet, unveränderlich | Trigger auf `payment_events` |
| Kundenkonto | bis der Kunde es löscht (Konto › Konto löschen); Bestellungen und Rechnungen bleiben | `KontoController::destroy` |
| Gesperrte E-Mail-Adressen (unzustellbar, Beschwerde) | bis ein Admin die Sperre aufhebt | Einstellungen › E-Mail |
| Server-Log | 14 Tage | täglich neue Datei, `config/logging.php` › `max_files` (Kanal „daily“) |
| Log langsamer Datenbankabfragen | 14 Tage | `config/logging.php` › `slow_queries.max_files` |
| Log des Server-Renderings (`storage/logs/ssr.log`) | unbefristet | wächst fortlaufend, wird nicht rotiert – **offen** (3) |
| Sitzung (Warenkorb, Anmeldung) | 120 Minuten ohne Aktivität | `config/session.php` |
| Link zum Festlegen des Passworts für das Kundenkonto | 24 Stunden | `CustomerAccount::LINK_HOURS` |
| Einladung ins Team | 7 Tage | `AdminInvitation::VALID_DAYS` |
| Einladung zur Bewertung | wird 7 Tage nach der Zustellung verschickt; ihr Link gilt 60 Tage | `config/rimify.php` › `reviews` |
| Sicherungskopien beim Zurücksetzen der Testumgebung | 7 Tage, dann gelöscht und protokolliert – nur in der Testumgebung, nie im Live-Shop | `rimify:reset --prune` stündlich (`TestEnvironment::KEEP_DAYS`) |
| Sicherung vor einem Release | eine Woche auf dem Server, von Hand gelöscht | docs/launch/GO-LIVE.md § 1 |
| Hostingers eigene Sicherungen | nach Hostingers Tarif | Hostinger, nicht der Shop |

### 2.1 · Cookies

| Cookie | Speichert | Dauer |
|---|---|---|
| `rmf_vehicle` | Welches Fahrzeug du gewählt hast – nur seine Nummer in unserer Liste. | 90 Tage |
| `rmf_garage` | Die letzten fünf Fahrzeuge, die du gewählt hast, damit du schnell zurückwechseln kannst. | 90 Tage |
| `rmf_consent` | Dass du diesen Hinweis gelesen hast, und wann. | 12 Monate |
| `Sitzung und XSRF-TOKEN` | Deinen Warenkorb und den Schutz deiner Eingaben vor fremden Seiten. | 120 Minuten |
| `rmf_view` | Welche Ansicht ein Link für dich festgelegt hat – Telefon oder Desktop. Es wird nur gesetzt, wenn du einen Link mit „?view=mobile“ oder „?view=desktop“ öffnest; einen Schalter dafür gibt es im Shop nicht. | 7 Tage |
| `__stripe_mid, __stripe_sid` | Daten für den Betrugsschutz von Stripe, unserem Zahlungsdienst. Stripe setzt sie selbst, sobald du an der Kasse den Schritt „Zahlung“ öffnest – auch wenn du danach nicht bezahlst. | 1 Jahr, 30 Minuten |
| `rmf_papiere` | Die Werte, die du aus deiner Zulassungsbescheinigung einträgst – Achslasten (8.1, 8.2), Höchstgeschwindigkeit (T) und, wenn du sie angibst, Leistung (P.2) sowie Tragfähigkeits- und Geschwindigkeitsindex der Reifen (15.1, 15.2) –, für bis zu fünf Fahrzeuge; getrennt davon Karosserieform und Antriebsart, wenn wir danach fragen, ebenfalls für bis zu fünf. Ohne Namen, Kennzeichen oder Fahrgestellnummer. | 1 Jahr |
| `rmf_geraet` | Eine zufällige Kennung für diesen Browser und sonst nichts. Unser Schutz vor zu vielen Anfragen zählt nach ihr statt nach deiner IP-Adresse – so wirst du nicht mit anderen im selben Mobilfunknetz verwechselt. | 1 Jahr |

### 2.2 · Werte aus der Zulassungsbescheinigung

| | |
|---|---|
| Daten | Die Werte, die ein Kunde aus seiner Zulassungsbescheinigung Teil I einträgt: die zulässigen Achslasten (8.1, 8.2) und die Höchstgeschwindigkeit (T), wenn er will auch die Leistung (P.2) sowie Tragfähigkeits- und Geschwindigkeitsindex der Reifen (15.1, 15.2). Name, Kennzeichen und Fahrgestellnummer fragt der Shop dazu nicht ab. |
| Zweck | Die Antwort, welche Reifen zu einer Felge an diesem Fahrzeug zulässig sind – Tragfähigkeit und Geschwindigkeit (CLAUDE.md R-03). Gefragt wird nur nach den Werten, die dem Shop für diese Antwort fehlen. |
| Rechtsgrundlage | Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahme auf Anfrage des Kunden); für das Cookie § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlich für einen vom Kunden ausdrücklich gewünschten Dienst). Beides bestätigt die Kanzlei (3). |
| Im Browser des Kunden | Cookie `rmf_papiere`: 365 Tage ab dem letzten Eintrag (`PapersBook::LIFETIME_MINUTES`). Der Kunde löscht die Werte mit „Werte löschen“ oder mit seinen Cookies. |
| Im ausdruckbaren RIMIFY-Check | Wenn der Kunde einen Check druckt, mit dessen Ergebnis in der Datenbank (`check_results`). Gespeichert nur für diesen Check, deshalb mit ihm gelöscht: nach 12 Monaten, `model:prune` täglich um 03:30 Uhr (`CheckResult::KEEP_MONTHS`, D-292). |
| In einer Bestellung | Wenn der Kunde bestellt, die Achslasten und die Höchstgeschwindigkeit, mit denen das Ergebnis gerechnet wurde, im Prüfnachweis der Bestellposition (`order_line_fitments`): unveränderlich (CLAUDE.md R-12) und so lange wie die Bestellung (2). |

## 3 · Offen für die Kanzlei

- Der Server steht noch nicht in Deutschland (1.1): Umzug nach docs/ops/UMZUG-DE.md oder Live-Shop gleich in Deutschland anlegen.
- Abgelaufene unbezahlte Bestellungen bleiben mit Name und Anschrift gespeichert. Frist und Löschung festlegen.
- Bestellungen, Rechnungen und Prüfnachweise werden nicht gelöscht, auch nicht nach Ablauf der Aufbewahrungspflicht. Frist festlegen; die Prüfnachweise und das Protokoll sind nach CLAUDE.md R-12 unveränderlich, eine Löschung braucht eine eigene Entscheidung.
- Das Log des Server-Renderings wird nicht rotiert (es enthält Seitenpfade, keine Kundendaten).
- Verträge zur Auftragsverarbeitung für den Live-Shop nachweisen: Hostinger (1.1), Postfach (1.5); bei AWS und Stripe sind sie Teil der Vertragsbedingungen.
- Werte aus der Zulassungsbescheinigung (2.2): ob sie ohne Namen, Kennzeichen und Fahrgestellnummer personenbezogen sind, ob die Rechtsgrundlage stimmt und ob die Fristen (Cookie 365 Tage, RIMIFY-Check 12 Monate) passen.
