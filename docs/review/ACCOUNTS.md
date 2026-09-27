# RIMIFY — Zugänge für die Review

Drei Konten, eines je Rolle. Jede Rolle sieht eine andere Navigation und eine andere Übersicht. Melde
dich unter `/admin/anmelden` an.

| Rolle | E-Mail | Passwort | Was sie sieht |
|---|---|---|---|
| Verkauf | `verkauf@rimify.test` | `rimify-review-2026` | Bestellungen, Anfragen, Umsatz. Katalog und Gutachten nur lesend. |
| Lager | `lager@rimify.test` | `rimify-review-2026` | Katalog: Felgen, Größen, Preise, Bestände, Fotos. Gutachten und Fahrzeuge nur lesend. |
| Admin | `admin@rimify.test` | `rimify-review-2026` | Alles, auch Rollen & Rechte, Medien und Speicher, System. |

Das Passwort ist absichtlich einfach. Diese Konten gibt es **nur lokal und auf der Vorschau-Instanz**
(Staging): Der Seeder `ReviewAccountsSeeder` verweigert die Arbeit überall, wo die Review aus ist, und
auf dem Live-Shop ist sie immer aus (`RIMIFY_REVIEW=false`).

## Rückmeldungen

- Unten in der Seitenleiste steht **„Rückmeldung geben“** (auf dem Handy unter „Mehr“). Tastenkürzel: `R`.
- Mitgeschickt werden automatisch die Adresse der Seite, die Fenstergröße, der Browser, deine Rolle und
  ein Bildschirmfoto. Du schreibst nur einen Satz und wählst die Art: Fehler, Design, Text oder Wunsch.
- Alle Punkte stehen unter **Review › Rückmeldungen**. Den Stand der einzelnen Seiten zeigt **Review ›
  Stand der Seiten**.
- `php artisan review:report` schreibt die Punkte mit unseren Antworten nach `docs/review/OPEN-POINTS.md`.
