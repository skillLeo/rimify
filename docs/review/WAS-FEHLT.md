# Was dem Live-Shop noch fehlt

Stand: 14.10.2026, 14:40 Uhr · erzeugt mit `php artisan rimify:go-live-check --markdown=docs/review/WAS-FEHLT.md` aus dem Zustand des Shops zu diesem Zeitpunkt – nichts darin ist von Hand geschrieben.

**17 von 34 erfüllt · 3 bei uns · 10 beim Kunden · 1 beim Host · 3 nicht prüfbar**

## Offen beim Kunden: 10

- **Impressum (§ 5 DDG)** – Im Impressum fehlen: Name des Unternehmens, Anschrift, Umsatzsteuer-Identifikationsnummer, Text der Kanzlei. *Wo:* `/admin/einstellungen/verkaeufer-versand`
- **AGB** – Die AGB sind noch ein Platzhalter: Der Text der Kanzlei fehlt. *Wo:* `/admin/seiten/6`
- **Widerrufsbelehrung und Muster-Widerrufsformular** – Noch offen: der Text der Kanzlei und Name und Anschrift des Verkäufers für das Formular. *Wo:* `/admin/seiten/7`
- **Datenschutzerklärung** – Die Datenschutzerklärung ist noch ein Platzhalter: Der Text der Kanzlei fehlt. *Wo:* `/admin/seiten/5`
- **Versandkosten und Lieferzeit** – Es fehlen: Versandkosten, Lieferzeit. Ohne sie nimmt der Shop keine echte Bestellung an. *Wo:* `/admin/einstellungen/verkaeufer-versand`
- **Rechnungsangaben (§ 14 UStG)** – Solange etwas fehlt, ist jede Rechnung eine Testrechnung. Es fehlen: Name des Unternehmens, Straße und Hausnummer, PLZ, Ort, USt-IdNr. oder Steuernummer, die eröffneten Rechnungsnummern (Einstellungen › Zahlung). *Wo:* `/admin/einstellungen/verkaeufer-versand`
- **Herstellerangaben je Marke (GPSR)** – Herstellerangaben liegen noch nicht vor für: BBS, Borbet. *Wo:* `/admin/marken`
- **Erklärung zur Barrierefreiheit (BFSG)** – Die Erklärung zur Barrierefreiheit fehlt; ein Online-Shop braucht sie seit 28.06.2025, außer bei einem Kleinstunternehmen. *Wo:* `/admin/seiten`
- **Reifengröße zu jeder freigegebenen Felge bestätigt** – 2 von 3 Kombinationen aus Fahrzeug und Felge stehen auf „Felge freigegeben · Reifengröße noch nicht bestätigt“. Die Felge ist dort freigegeben und wird nicht verkauft, bis die Angaben zu den Reifen hinterlegt sind; welche fehlt, steht in der Vorschau des Gutachtens. Zum Beispiel: BMW 3er Coupe 346C mit LeMans 8,5J × 18 · ET 30. Gezählt: 14.10.2026, 14:40 Uhr. *Wo:* `/admin/gutachten`
- **Absenderdomain: SPF, DKIM und DMARC** – Für rimify.de fehlen im DNS: SPF: TXT bounce.rimify.de → „v=spf1 include:amazonses.com ~all“; SPF: MX bounce.rimify.de → „10 feedback-smtp.eu-north-1.amazonses.com“; DKIM: CNAME (drei Einträge)._domainkey.rimify.de → „(…).dkim.amazonses.com – SES nennt sie, sobald die Domain dort angelegt ist“. *Wo:* `DNS der Domain · Einstellungen › E-Mail`

## Offen bei uns: 3

- **Bestellbestätigung (§ 312f BGB)** – MAIL_MAILER=log: Die Bestätigung wird nicht verschickt. *Wo:* `MAIL_MAILER`
- **Letzte vollständige Testmatrix** – Noch nie gelaufen – die Testmatrix braucht die Testschlüssel. *Wo:* `docs/dev/STRIPE.md`
- **E-Mail-Versand über Amazon SES** – Die Mails gehen über „log“ und erreichen bis dahin niemanden. Noch offen: der Zugang zu Amazon SES in Einstellungen › E-Mail. *Wo:* `Einstellungen › E-Mail · docs/ops/MAIL-SES.md`

## Offen beim Host: 1

- **Serverstandort in Deutschland** – Nach dem Namensschema des Hosts steht der Server us-bos-web1780.main-hosting.eu außerhalb der EU (US). Die Kundendaten würden dort gespeichert, und jeder Seitenaufruf ginge dorthin und zurück. Entschieden ist Hostingers Rechenzentrum in Deutschland für Webserver und Datenbank. *Wo:* `hPanel › Hosting › Rechenzentrum · docs/ops/UMZUG-DE.md`

## Alle Prüfungen

### Recht und Pflichtangaben

| Prüfung | Zuständig | Status | Befund | Wo |
|---|---|---|---|---|
| Impressum (§ 5 DDG) | kunde | fehlt | Im Impressum fehlen: Name des Unternehmens, Anschrift, Umsatzsteuer-Identifikationsnummer, Text der Kanzlei. | `/admin/einstellungen/verkaeufer-versand` |
| AGB | kunde | fehlt | Die AGB sind noch ein Platzhalter: Der Text der Kanzlei fehlt. | `/admin/seiten/6` |
| Widerrufsbelehrung und Muster-Widerrufsformular | kunde | fehlt | Noch offen: der Text der Kanzlei und Name und Anschrift des Verkäufers für das Formular. | `/admin/seiten/7` |
| Datenschutzerklärung | kunde | fehlt | Die Datenschutzerklärung ist noch ein Platzhalter: Der Text der Kanzlei fehlt. | `/admin/seiten/5` |
| Versandkosten und Lieferzeit | kunde | fehlt | Es fehlen: Versandkosten, Lieferzeit. Ohne sie nimmt der Shop keine echte Bestellung an. | `/admin/einstellungen/verkaeufer-versand` |
| Umsatzsteuer und Bruttopreise | wir | ok | Jeder Preis ist ein Bruttopreis mit 19 % Umsatzsteuer, auf der Seite, in der Bestellung und auf der Rechnung. | `RIMIFY_SELLER_SMALL_BUSINESS` |
| Rechnungsangaben (§ 14 UStG) | kunde | fehlt | Solange etwas fehlt, ist jede Rechnung eine Testrechnung. Es fehlen: Name des Unternehmens, Straße und Hausnummer, PLZ, Ort, USt-IdNr. oder Steuernummer, die eröffneten Rechnungsnummern (Einstellungen › Zahlung). | `/admin/einstellungen/verkaeufer-versand` |
| Bestellknopf (§ 312j BGB) | wir | ok | Der Knopf der Kasse sagt „Zahlungspflichtig bestellen“. | `resources/js/Pages/Kasse/Index.vue` |
| Bestellbestätigung (§ 312f BGB) | wir | fehlt | MAIL_MAILER=log: Die Bestätigung wird nicht verschickt. | `MAIL_MAILER` |
| Cookies (§ 25 TDDDG) | wir | ok | Der Shop setzt nur Cookies der Kategorien „Notwendig“ und „Funktional“ und fragt keine Einwilligung ab – es gibt also nichts gleichwertig abzulehnen. | `resources/js/legal/cookies.ts` |
| Herstellerangaben je Marke (GPSR) | kunde | fehlt | Herstellerangaben liegen noch nicht vor für: BBS, Borbet. | `/admin/marken` |
| Erklärung zur Barrierefreiheit (BFSG) | kunde | fehlt | Die Erklärung zur Barrierefreiheit fehlt; ein Online-Shop braucht sie seit 28.06.2025, außer bei einem Kleinstunternehmen. | `/admin/seiten` |
| Prüfung der Bewertungen (§ 5b UWG) | wir | ok | Über den Bewertungen steht, dass nur Käufer bewerten und wie wir das prüfen: über die Bestellnummer (0 Bewertungen sichtbar). | `resources/js/Pages/Produkt/Index.vue` |

### Recht am Rad

| Prüfung | Zuständig | Status | Befund | Wo |
|---|---|---|---|---|
| Mindestens ein freigegebenes Gutachten | kunde | ok | 2 Gutachten sind freigegeben und gültig. | `/admin/gutachten` |
| Jede veröffentlichte Felge steht in einem freigegebenen Gutachten | wir | ok | Jede der 2 veröffentlichten Felgen steht für mindestens ein Fahrzeug in einem freigegebenen Gutachten. | `/admin/felgen` |
| Anlagen der Gutachten vollständig | kunde | ok | Jedes freigegebene Gutachten liegt mit allen Anlagen vor. | `/admin/gutachten` |
| Kein Entwicklungsfahrzeug in einem freigegebenen Gutachten | wir | ok | Kein Fahrzeug in einem freigegebenen Gutachten ist ein Entwicklungsfahrzeug. | `/admin/fahrzeuge` |
| Achslasten und Höchstgeschwindigkeit der Fahrzeuge | wir | ok | Für alle 1 Fahrzeuge der freigegebenen Gutachten sind Achslasten und Höchstgeschwindigkeit hinterlegt. | `/admin/fahrzeuge` |
| Reifengröße zu jeder freigegebenen Felge bestätigt | kunde | fehlt | 2 von 3 Kombinationen aus Fahrzeug und Felge stehen auf „Felge freigegeben · Reifengröße noch nicht bestätigt“. Die Felge ist dort freigegeben und wird nicht verkauft, bis die Angaben zu den Reifen hinterlegt sind; welche fehlt, steht in der Vorschau des Gutachtens. Zum Beispiel: BMW 3er Coupe 346C mit LeMans 8,5J × 18 · ET 30. Gezählt: 14.10.2026, 14:40 Uhr. | `/admin/gutachten` |

### Zahlung

| Prüfung | Zuständig | Status | Befund | Wo |
|---|---|---|---|---|
| Zahlungsschlüssel passend zur Umgebung | kunde | ok | Testschlüssel im Testsystem, passend zur Umgebung. | `/admin/einstellungen/zahlung` |
| Stripe-Webhook | wir | nicht prüfbar | Signaturschlüssel und eindeutige Ereignis-ID sind vorhanden; ob Stripe den Endpunkt kennt, lässt sich erst prüfen, wenn Stripe als Zahlungsart in Kraft ist. | `/admin/einstellungen/zahlung` |
| Domain für Apple Pay | kunde | nicht prüfbar | Von hier nicht prüfbar: Im Stripe-Dashboard unter Zahlungsmethoden-Domains muss diese Domain stehen. | `Stripe-Dashboard › Zahlungsmethoden-Domains` |
| Letzte vollständige Testmatrix | wir | fehlt | Noch nie gelaufen – die Testmatrix braucht die Testschlüssel. | `docs/dev/STRIPE.md` |

### Betrieb und Sicherheit

| Prüfung | Zuständig | Status | Befund | Wo |
|---|---|---|---|---|
| CLAUDE.md und Entscheidungsprotokoll im Repository | wir | ok | CLAUDE.md und docs/decisions.md sind im Repository. | `CLAUDE.md` |
| Sicherungen nicht über HTTP erreichbar | wir | ok | Sicherungen, Protokoll und Testdateien antworten über HTTP mit 403. | `storage/app/private/.htaccess` |
| Rechnungen nicht öffentlich | wir | ok | Rechnungen liegen im privaten Speicher des Servers, nicht im Bucket, und sind nur über signierte Links abrufbar. | `FILESYSTEM_DISK` |
| Beide Datenbank-Engines grün in CI | wir | nicht prüfbar | Von hier nicht prüfbar: Der Lauf steht auf GitHub (MySQL 8.4 und MariaDB 11.8.9). | `.github/workflows/suite.yml` |
| Server-Rendering | wir | ok | Der Renderer antwortet; jede Seite kommt fertig aufgebaut an. | `deploy/ssr-watch.sh` |
| Cron-Zeilen für Zeitplan und Wächter | host | ok | Der Zeitplan lief vor 53 Sekunden. | `hPanel › Cron-Jobs` |
| E-Mail-Versand über Amazon SES | wir | fehlt | Die Mails gehen über „log“ und erreichen bis dahin niemanden. Noch offen: der Zugang zu Amazon SES in Einstellungen › E-Mail. | `Einstellungen › E-Mail · docs/ops/MAIL-SES.md` |
| Absenderdomain: SPF, DKIM und DMARC | kunde | fehlt | Für rimify.de fehlen im DNS: SPF: TXT bounce.rimify.de → „v=spf1 include:amazonses.com ~all“; SPF: MX bounce.rimify.de → „10 feedback-smtp.eu-north-1.amazonses.com“; DKIM: CNAME (drei Einträge)._domainkey.rimify.de → „(…).dkim.amazonses.com – SES nennt sie, sobald die Domain dort angelegt ist“. | `DNS der Domain · Einstellungen › E-Mail` |
| Serverstandort in Deutschland | host | fehlt | Nach dem Namensschema des Hosts steht der Server us-bos-web1780.main-hosting.eu außerhalb der EU (US). Die Kundendaten würden dort gespeichert, und jeder Seitenaufruf ginge dorthin und zurück. Entschieden ist Hostingers Rechenzentrum in Deutschland für Webserver und Datenbank. | `hPanel › Hosting › Rechenzentrum · docs/ops/UMZUG-DE.md` |
| Schalter zum Zurücksetzen passend zur Umgebung | wir | ok | Der Testserver darf zurückgesetzt werden, der Live-Shop nie. | `RIMIFY_RESET_ERLAUBT` |
| Keine Demodaten veröffentlicht | wir | ok | Es gibt keine Demodaten. | `/admin/system` |
