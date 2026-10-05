# Was dem Live-Shop noch fehlt

Stand: 05.10.2026, 20:49 Uhr · erzeugt mit `php artisan rimify:go-live-check --markdown=docs/review/WAS-FEHLT.md` aus dem Zustand des Shops zu diesem Zeitpunkt – nichts darin ist von Hand geschrieben.

**17 von 30 erfüllt · 2 bei uns · 8 beim Kunden · 3 nicht prüfbar**

## Offen beim Kunden: 8

- **Impressum (§ 5 DDG)** – Im Impressum fehlen: Name des Unternehmens, Anschrift, Umsatzsteuer-Identifikationsnummer, Text der Kanzlei. *Wo:* `/admin/einstellungen/verkaeufer-versand`
- **AGB** – Die AGB sind noch ein Platzhalter: Der Text der Kanzlei fehlt. *Wo:* `/admin/seiten/6`
- **Widerrufsbelehrung und Muster-Widerrufsformular** – Noch offen: der Text der Kanzlei und Name und Anschrift des Verkäufers für das Formular. *Wo:* `/admin/seiten/7`
- **Datenschutzerklärung** – Die Datenschutzerklärung ist noch ein Platzhalter: Der Text der Kanzlei fehlt. *Wo:* `/admin/seiten/5`
- **Versandkosten und Lieferzeit** – Es fehlen: Versandkosten, Lieferzeit. Ohne sie nimmt der Shop keine echte Bestellung an. *Wo:* `/admin/einstellungen/verkaeufer-versand`
- **Rechnungsangaben (§ 14 UStG)** – Solange etwas fehlt, ist jede Rechnung eine Testrechnung. Es fehlen: Name des Unternehmens, Straße und Hausnummer, PLZ, Ort, USt-IdNr. oder Steuernummer, die eröffneten Rechnungsnummern (Einstellungen › Zahlung). *Wo:* `/admin/einstellungen/verkaeufer-versand`
- **Erklärung zur Barrierefreiheit (BFSG)** – Die Erklärung zur Barrierefreiheit fehlt; ein Online-Shop braucht sie seit 28.06.2025, außer bei einem Kleinstunternehmen. *Wo:* `/admin/seiten`
- **Mindestens ein freigegebenes Gutachten** – Noch ist kein Gutachten freigegeben; bis dahin zeigt der Shop zu keinem Fahrzeug eine Felge. *Wo:* `/admin/gutachten`

## Offen bei uns: 2

- **Bestellbestätigung (§ 312f BGB)** – MAIL_MAILER=log: Die Bestätigung wird nicht verschickt. *Wo:* `MAIL_MAILER`
- **Letzte vollständige Testmatrix** – Noch nie gelaufen – die Testmatrix braucht die Testschlüssel. *Wo:* `docs/dev/STRIPE.md`

## Offen beim Host: 0

Nichts.

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
| Herstellerangaben je Marke (GPSR) | kunde | ok | Noch ist keine Felge im Verkauf; jede Marke braucht ihre Angaben, bevor ihre erste Felge erscheint. | `/admin/marken` |
| Erklärung zur Barrierefreiheit (BFSG) | kunde | fehlt | Die Erklärung zur Barrierefreiheit fehlt; ein Online-Shop braucht sie seit 28.06.2025, außer bei einem Kleinstunternehmen. | `/admin/seiten` |
| Prüfung der Bewertungen (§ 5b UWG) | wir | ok | Über den Bewertungen steht, dass nur Käufer bewerten und wie wir das prüfen: über die Bestellnummer (0 Bewertungen sichtbar). | `resources/js/Pages/Produkt/Index.vue` |

### Recht am Rad

| Prüfung | Zuständig | Status | Befund | Wo |
|---|---|---|---|---|
| Mindestens ein freigegebenes Gutachten | kunde | fehlt | Noch ist kein Gutachten freigegeben; bis dahin zeigt der Shop zu keinem Fahrzeug eine Felge. | `/admin/gutachten` |
| Jede veröffentlichte Felge steht in einem freigegebenen Gutachten | wir | ok | Noch ist keine Felge veröffentlicht. | `/admin/felgen` |
| Anlagen der Gutachten vollständig | kunde | ok | Noch ist kein Gutachten freigegeben. | `/admin/gutachten` |
| Kein Entwicklungsfahrzeug in einem freigegebenen Gutachten | wir | ok | Kein Fahrzeug in einem freigegebenen Gutachten ist ein Entwicklungsfahrzeug. | `/admin/fahrzeuge` |
| Achslasten und Höchstgeschwindigkeit der Fahrzeuge | wir | ok | Noch nennt kein freigegebenes Gutachten ein Fahrzeug. | `/admin/fahrzeuge` |

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
| Cron-Zeilen für Zeitplan und Wächter | host | ok | Der Zeitplan lief vor 50 Sekunden. | `hPanel › Cron-Jobs` |
| Schalter zum Zurücksetzen passend zur Umgebung | wir | ok | Der Testserver darf zurückgesetzt werden, der Live-Shop nie. | `RIMIFY_RESET_ERLAUBT` |
| Keine Demodaten veröffentlicht | wir | ok | Es gibt keine Demodaten. | `/admin/system` |
