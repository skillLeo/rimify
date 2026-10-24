# Admin audit — find everything, fix everything, prove it

The operator's brief of 23.10.2026. The client said „a lot of things wrong / not perfectly in admin panel“ and gave no
list; this document is that list, taken from the code and walked in a real browser. Every row of the inventory ends in
a result. Findings are classed **Bug**, **Friction** or **Rule** (deliberate behaviour from regulation or the R-rules —
kept, and explained on screen in German), with severity **S1** (verdict or data wrong or lost, a crash), **S2** (a task
cannot be completed), **S3** (friction), **S4** (cosmetic). Every S1–S3 and every S4 under half an hour is fixed, each
with a test that failed before the fix and passes after it (read against `docs/dev/TEST-SMELLS.md`). Verdict logic,
the R-rules, the append-only tables and the release door are not changed: a finding that would need that is recorded
and left for the operator. The client's own summary is `ADMIN-AUDIT-CLIENT.md`; the decisions are D-320 to D-334.

**In numbers:** 471 inventory rows, 471 with a result · 42 findings, 40 fixed, 2 open.

## Aufbau

- **Code:** the worktree at the commit named in the report, assets built (`npm run build`, client and SSR).
- **Database:** a fresh `rimify_audit` on RIMIFY's MariaDB 11.8.9 (:3308, production engine parity) — `migrate:fresh
  --seed`, then the admin's demonstration data (`demo:seed`, born demo) and the acceptance set (`rimify:demo --abnahme`,
  born demo); for the list checks, bulk rows written on top so every long list holds more than 1.000 rows (at setup:
  1.124 Felgen, 1.108 Reifen, 1.279 Fahrzeuge, 2.123 Bestellungen, 1.061 Dokumente, 1.022 Marken, 1.101 Bewertungen,
  1.100 Nachrichten (550 ungelesen), 1.100 Anfragen, 1.116 Nachfrage-Lücken, 1.336 Protokoll-Einträge; the walks added a
  few). For the re-check of the cut notes: one draft with 1.008 rows, one vehicle in 504 rows and 60 blocked addresses
  (`cut-data.txt`).
- **Server:** `scripts/e2e/serve.mjs` on :8050 with four PHP workers, `QUEUE_CONNECTION=sync`, mails to the log,
  `RIMIFY_SLOW_QUERY_MS=300` — every statement of 300 ms or more lands in `storage/logs/slow-queries-*.log`.
- **Browser:** Chromium through Playwright, 1440 × 900 primary, 1024 × 768 also: the sweep and the tasks' specs in
  `e2e/audit/` (`playwright.audit.config.ts`), and the walks — one call per step list — for the rest: `w-*` during the
  audit, `v-*` for the re-check after the fixes, in `docs/review/audit/gaenge/` with the tool that replays them. Every
  step is watched for console errors, page errors and answers of 4xx/5xx it did not ask for; the ledgers are in
  `docs/review/audit/`. The sweep's 184 pictures (20 MB) stay on the audit machine; one run of the sweep makes them
  again.

## Wie die Liste entstand

Not from memory: the admin routes from the router (`php artisan route:list --path=admin --json`), and the pages, forms,
tables, filters, bulk actions, uploads, exports and dialogs from the admin Vue files by pattern, each with its file and
line; the two imports as flows; the e-mails from the mail classes an admin's action sends. A row the patterns could not
see and the walk found is added with its source.

## Was über alle Formulare und Listen geprüft wurde

- **Every form:** sent empty; each required field left out; the longest value a field takes; umlauts and ß; the German
  decimal comma (2,5 · 8,5J · 1.060 kg); leading zeros (HSN 0005); the same record twice; a double click on save; the
  browser's Back after saving; the same record open in two tabs. After a refusal the input stays and the sentence is
  German and beside the field. Two code checks back the walks: every string rule has a maximum and every rule a German
  sentence — the 225 (field, rule) pairs that relied on the framework's English default now fall back to
  `lang/de/validation.php` (F-34) — and every save that rewrites several fields of a shared record refuses a stale one
  (F-25): 26 of the 39 save routes; the other 13 write one field or one switch, keep their own revision, save only what
  changed, or are the page editor with its own check (D-333).
- **Every list:** sort, filter, search with umlauts („Straße“, „Größe“, „Müller“, „Weiß“), pages, the empty state, and
  the speed with 1.000+ rows. Felgen, Reifen, Fahrzeuge, Bestellungen and the Protokoll passed (230–330 ms for a search,
  pages, the empty state with its way back). Bewertungen, Nachrichten, Anfragen, Gutachten › Dokumente, Marken,
  Nachfrage and Auflagen stopped at a fixed number or put a thousand rows on one page (F-04, F-26, F-31, F-33); a code
  sweep found four more caps (F-36, F-37, F-38). All now come in pages — Bewertungen, Nachrichten, Anfragen, Dokumente,
  Marken and Nachfrage with a search on the server, Auflagen with its filters — or name their cut.
- **Throughout:** zero console errors and zero page errors in the sweep and the walks; no unexpected 4xx/5xx;
  `laravel.log` clean apart from the expected „Gutachten-PDF nicht gefunden“ of the bulk rows (they name no file); one
  statement over 300 ms — the brand list's (805 ms, F-04), now paged.


## Befunde

| Klasse und Stufe | gefunden | behoben | offen |
|---|---|---|---|
| Bug S1 | 3 | 3 | 0 |
| Bug S2 | 3 | 2 | 1 |
| Bug S3 | 7 | 7 | 0 |
| Bug S4 | 10 | 10 | 0 |
| Friction S3 | 10 | 10 | 0 |
| Friction S4 | 8 | 7 | 1 |
| Rule S4 | 1 | 1 | 0 |
| **Zusammen** | **42** | **40** | **2** |

| # | Klasse | Stufe | Wo | Vorher | Nachher | Test | Stand |
|---|---|---|---|---|---|---|---|
| F-01 | Bug | S4 | Übersicht › Heute | „1050 Gutachten warten auf Prüfung.“ — a count above 999 without the thousands point (R-10); „4.297 Prüfungen“ on the same page is right | Every count in „Heute“ and „Zu tun“ through the German number format (1.050); „Gutachten öffnen“ opens the drafts | UebersichtListsTest | behoben |
| F-02 | Friction | S3 | Fahrzeuge › Neu | Sent with every required field empty, the form first asks „Ohne Achslasten anlegen?“; only after „Ohne Achslasten anlegen“ does it say that Hersteller, HSN, TSN … are missing | An empty form is sent at once: every required field says what it needs; the axle-load question comes only for a car the server would save | Neu.test.ts; e2e/audit/t3a | behoben |
| F-03 | Friction | S4 | Felgen › Felge › Suchmaschinen | The counters read „0 / 60“ and „0 / 155“ and turn red past them, while the fields take 70 and 170 — nothing says the lower figure is a recommendation | The help says search engines show about 60 / 155 characters and the field saves 70 / 170 | Felgen/Edit.test.ts | behoben |
| F-04 | Friction | S3 | Katalog › Marken; Kunden › Nachfrage | With 1.000+ rows: Marken 3,3–5,0 s per page view (one query 337 ms: every brand with two count subqueries), Nachfrage 4,5–6,4 s | Marken and Nachfrage come in pages of 50; Nachfrage asks the catalogue for all typed key numbers in one query (130 gaps: under 60 queries) | MarkenTest; NachfrageTest | behoben |
| F-05 | Bug | S4 | Gutachten › Vorschau im Shop | „Nur bei 225/40 R18· Vorder- und Hinterachse“ — no space before the dot | „Nur bei 235/45 R19 · Vorder- und Hinterachse“ — the space kept (shared component: admin preview and shop) | ConditionGroups.test.ts | behoben |
| F-06 | Friction | S4 | Gutachten › Vorschau im Shop | „Reifen: 225/40 R18 · hinten 225/40 R18, 255/35 R18“ — the front axle is not named, the rear is | „vorn … · hinten …“ wherever the rear axle takes other sizes — the admin preview and the shop's check result | fitment/axles.test.ts | behoben |
| F-07 | Bug | S1 | Gutachten › Auflagenverzeichnis › Art „Verbot“ | „Verbot“ means a forbidden use (snow chains, A12) and weighs as a restriction; nothing in the admin says so. Entered for „nicht zulässig für Kombi 1.5“, the shop tells the Kombi's owner „Die Felge selbst ist … mit Auflagen freigegeben … Die Felge allein kannst du schon bestellen“ beside the sentence „… nicht zulässig“. Verdict logic untouched (brief): the admin must say what each Art does, and a car a document excludes gets no row | Each Art says beside the choice what it does; „Verbot“ says it excludes no car and which Arten do | ConditionKindHelpTest; Auflagenverzeichnis.test.ts | behoben |
| F-08 | Friction | S3 | Felgen › Neue Felge | A second Felge with the same brand, model and Radtypenbezeichnung is saved without a word — two identical products in the shop and two identical groups in a Gutachten's row search; Fahrzeuge refuse their duplicate in a sentence | Refused under the Radtypenbezeichnung, naming the existing Felge (letter case aside; a removed Felge is no twin) | FelgenTest | behoben |
| F-09 | Friction | S4 | Reifen › Marke | The tyre form's brand list is every brand, wheel makers (AEZ, BBS …) included | Tyre makers only — a brand that is not a wheel brand, or one that already has a tyre — and the tyre's own brand | ReifenTest | behoben |
| F-10 | Bug | S2 | Shop › Komplettrad (engine) | A Gutachten with Bereifungskombinationen and one size scoped to an axle offers no Komplettrad at all: rule 3b (axle-scoped size → StaggeredLayout) fires before rule 4b, so combination 1 (225/40 both axles) never offers four tyres and combination 2 never offers its pair, against D-256; the sentence „vier gleiche Reifen gibt es dafür nicht“ contradicts the record. Engine and customer wording — recorded for the operator, not changed (brief; §9) | Not changed in this audit (verdict logic). Decided by the operator 24.10.2026: the Komplettrad as the combination the Gutachten lists, 2 + 2 per axle — built as its own commit on top | — | offen |
| F-11 | Bug | S4 | Bestellung › Erstattung (Testzahlung) | The refund dialog and help say „Das Geld geht über Stripe … zurück“ on an order paid with the Testzahlung, where the page itself says no money moves | Help and confirmation say that with the Testzahlung no money moves, the refund is recorded and the credit note sent | Bestellungen/Show.test.ts | behoben |
| F-12 | Bug | S4 | Passwort bestätigen | Asked before a refund, the page says „Dieser Bereich verwaltet die Zugänge des Shops.“ — true of Benutzer and Einstellungen, not of a refund | The page names what it guards: a refund, the company data, the shop's keys, the reset | PasswortBestaetigenTest; RefundsAndDisputesTest; Bestaetigen/Index.test.ts | behoben |
| F-13 | Friction | S3 | Bestellung › Erstattung | After the password prompt the person lands back on the order with the amount and the reason empty, and types both again | Amount and reason are kept across the password prompt and dropped once the refund is made | Bestellungen/Show.test.ts | behoben |
| F-14 | Friction | S3 | Bestellung › Als versendet markieren | The customer gets no mail when the order is sent: the tracking number the team types reaches nobody (mails on an order: confirmation, refund, review invitation) | „Deine Bestellung … ist unterwegs“ with the Sendungsnummer and the order's page; no carrier named; a failed mail never undoes the step | VersandmailTest; e2e/audit/t6 | behoben |
| F-15 | Bug | S1 | Bestellung › Versand after a partial refund | A delivered order refunded in part is „Teilweise erstattet“; its Versand reads „Zu prüfen“ and „Als versendet markieren“ is offered again. Pressed: the status becomes „Versendet“, the payment reads „Bezahlt“ (the refund gone from the status), „Versandt am“ is overwritten, „Zugestellt am“ predates it, and the order counts as revenue again | „Teilweise erstattet“ stays; shipping and delivery record their dates once each; the list reads its goods half from them | VersandNachErstattungTest | behoben |
| F-16 | Bug | S4 | Marken; Zubehörpreise › Wuchtgewichte | A brand made on the Marken page gets the slug „marke-a-ss-1“ for „Marke Ä ß 1“ (and a colour „anthrazit-glanzend“), while a brand made with a Felge or an import gets „gruenland“ — two transliterations for one name (Str::slug without 'de') | Str::slug(…, 'de'): „Marke Ä ß 1“ → marke-ae-ss-1, as everywhere else | MarkenTest | behoben |
| F-17 | Friction | S3 | Fahrzeuge › Fahrzeug | A car typed by hand cannot be corrected: make, model, variant, kW and build period are read-only, there is no „Entfernen“ (R-04), and entering it again with the same HSN/TSN/variant is refused as a duplicate — a typo stays for good | „Angaben korrigieren“ on a car typed by hand that nothing refers to; otherwise the page says why; every car says it is never deleted | FahrzeugKorrekturTest; Fahrzeuge/Show.test.ts | behoben |
| F-18 | Friction | S3 | Gutachten › Entwurf › Freigeben | The draft says „Kann freigegeben werden“ and offers „Freigeben“, then the release refuses: „Auflagen-Codes … laut Verwendungsbereich: 4, erfasst: 3“. The page shows only `check()`, the release adds the count comparison (release door unchanged; only shown earlier) | The count comparison the release makes is listed with the blockers before „Freigeben“ (release door unchanged) | DocumentCountTest | behoben |
| F-19 | Bug | S3 | Inhalte › Navigation | The footer entry „Blog“ reads „führt zu blog.index“; renaming it is refused („Bitte wähl ein Ziel aus der Liste.“) because the Blog's index is not among the targets (NavigationSchema::ROUTES lacks blog.index, D-230) | „Blog“ is a menu target (blog.index) | NavigationTest | behoben |
| F-20 | Friction | S4 | Inhalte › Seiten | The admin calls the articles „Ratgeber“ („aus der Liste der Ratgeber“, „Ratgeber: …“ as a menu target) while the shop's list is „Blog“ (D-230) | „Blog-Artikel“ in the admin, the Protokoll and the menu targets; addresses stay /ratgeber/{slug} | SeitenTest; ProtokollTest; AdminRailFoot.test.ts | behoben |
| F-21 | Bug | S3 | Team › Rollen & Rechte | The matrix offers rights the shop never checks: Katalog/Fahrzeuge/Gutachten/Kunden „Exportieren“, Fahrzeuge and Gutachten „Löschen“, Kunden „Bearbeiten“/„Löschen“, every „Medien“ right — switching them changes nothing (D-247: the admin is not told of an effect that is not there) | Only rights the shop checks are drawn; a migration removes the stored cells of the others | RollenVerwaltungTest | behoben |
| F-22 | Friction | S4 | Listen › Ansichten | Deleting the view one is looking at leaves the address on it: the page then says „Die verlinkte Ansicht gibt es nicht mehr oder sie ist nicht mit dir geteilt“ — a sentence for an old link, beside one's own „gelöscht“ | Deleting the open view leaves the list with its filters; „Rückgängig“ opens the view again | SavedViewsTest | behoben |
| F-23 | Bug | S4 | Katalog › Import › Probelauf | An empty ET cell is refused as „Die Einpresstiefe können wir nicht lesen“; text cells say „fehlt“ — empty and unreadable are two states (D-318) | An empty required cell „fehlt“; a cell that says something unreadable „können wir nicht lesen“ | KatalogImportTest | behoben |
| F-24 | Friction | S3 | Einstellungen › E-Mail › Sperren | „Sperre aufheben“ acts on one click — no question, no undo, no way to set the block again here; every other such action asks first | „Sperre für … aufheben?“ asks first, says what the block was and that it cannot be set again here | Email.test.ts | behoben |
| F-25 | Bug | S1 | Every multi-field form | Two tabs (or two people): the later save silently undoes the earlier one — Verkäufer & Versand: tab A saves the city, tab B (opened before) saves the street and puts the old city back. Only the page editor refuses a stale save (PageChangedMeanwhile) | A save from a page opened before the last save is refused with one sentence, nothing written, the input kept — every save that rewrites several fields of a shared record: 26 of the 39 save routes (rows, codes, brands, FAQ, menus, roles, orders of lists, prices, settings); the other 13 write one field or switch, keep their own revision, save only what changed, or are the page editor with its own check | EditStampTest; GutachtenStandTest; MarkenTest; FaqTest; NavigationTest; RollenVerwaltungTest; FelgenTest; RdksPreiseTest; WuchtgewichteTest; ReviewKitTest; BenachrichtigungenTest; e2e/audit/t8 | behoben |
| F-26 | Bug | S2 | Bewertungen; Nachrichten; Anfragen; Auflagen | The lists stop at 200 (Anfragen 220) with no paging and no search; Bewertungen's context says „200 Bewertungen“ of 1.101 — an older review can never be hidden or answered | Bewertungen, Nachrichten, Anfragen: pages of 50, a search, the real count | BewertungenListeTest; ListenSeitenTest | behoben |
| F-27 | Friction | S3 | Bewertung (Einladung, Kunde) | An expired or damaged review link answers „Dafür fehlt dir die Berechtigung.“ — no reason, no way on | „Dieser Link gilt nicht mehr.“ for every expired or damaged signed link, with three ways on and no admin sign-in | LinkAbgelaufenTest; Fehler/Index.test.ts | behoben |
| F-28 | Bug | S4 | Bewertungen › Antworten | Saving an empty answer on a review that has none says „Antwort entfernt.“ | An empty answer to a review without one saves nothing and says so | BewertungenListeTest | behoben |
| F-29 | Friction | S4 | Einladung annehmen | A short password with an empty repeat says only „Die beiden Passwörter stimmen nicht überein.“ — the length is the first thing to fix | Length before the repeat — invitation, the admin's own password, the customer's password | EinladungTest; AdminShellTest; KontoTest | behoben |
| F-30 | Bug | S4 | Einstellungen › E-Mail › Absender | „info@rimify“ (no dot in the domain) is saved as the sender | Sender, seller and invitation addresses need a domain with a dot (email:rfc,filter_unicode) | EmailSettingsTest; VerkaeuferVersandTest; BenutzerTest | behoben |
| F-31 | Friction | S3 | Gutachten › Dokumente; Katalog › Marken; Kunden › Nachfrage | 1.061 documents, 1.022 brands, 1.116 gaps on one page each — no search, no paging; 1,3–4,3 s | Gutachten › Dokumente, Marken, Nachfrage: pages, a search (Nachfrage by car or key numbers, added in the re-check), filters counted on the server | GutachtenListeTest; MarkenTest; NachfrageTest; Nachfrage/Index.test.ts | behoben |
| F-32 | Friction | S4 | Reifen, Fahrzeuge, Protokoll and the small lists | No sorting offered (fixed order) — Felgen and Bestellungen sort | Not changed: sorting more lists is over half an hour (S4) — a later round, the operator's decision of 24.10.2026 | — | offen |
| F-33 | Bug | S3 | Gutachten › Auflagen | „0 Gutachten … Hier ist noch nichts“ while released documents carry codes: the page takes the first 200 documents (drafts first) and then drops those without codes | The filter runs in SQL over every document with codes; pages of 20 | GutachtenErfassungTest | behoben |
| F-34 | Bug | S3 | Every form (safety net) | No German validation file: a rule without its own message shows its key — the login answers a 311-character address with „validation.max.string“; 225 (field, rule) pairs rely on it | lang/de/validation.php: every rule in German, naming no field | ValidierungDeutschTest | behoben |
| F-35 | Bug | S3 | Protokoll | 13 events the shop writes have no words: a refund, an order's status change from the webhook, the confirmation mail, an invoice that failed, the real invoice numbers opened, Stripe's keys and mode changed, the connection test, the seller's data, a chargeback's evidence, a brand's GPSR data — each reads „Hier wurde etwas geändert, das das Protokoll noch nicht in Worten beschreiben kann.“ and counts as „Sonstiges“ | Fifteen events have their sentence and area; a test reads every event name from the code | ProtokollTest | behoben |
| F-36 | Bug | S2 | Gutachten › Neu / Angaben ändern | „Nachtrag zu“ offers the newest 300 documents and „Ersetzt eine frühere Fassung“ the newest 200 released ones: with 1.061 documents a Nachtrag to an older Gutachten cannot be entered — the only way on is „Einem Gutachten, das uns nicht vorliegt“, which makes the shop say the Nachtrag alone is not the whole approval | Every document offered, newest first, with a field that shortens the list | GutachtenListeTest; DocumentSelect.test.ts | behoben |
| F-37 | Bug | S3 | Gutachten › Dokument; Fahrzeuge › Fahrzeug | The rows table stops at 1.000 (a vehicle's at 500) without a word, and the release then says „Alle 1.000 Zeilen gelten danach sofort im Shop“ of a document that releases every row | Every row counted; the page names the cut; the release sentences count all rows | ZeilenAbgeschnittenTest; Fahrzeuge/Show.test.ts | behoben |
| F-38 | Bug | S3 | E-Mail › Sperren; Seiten › Versionen; Anfragen › Gefragte Fahrzeuge; Fahrzeug-Import › Läufe | Four more lists stop without a word (the class of F-26): blocked addresses at 50 (an older one cannot be released), a page's versions at the latest 20 and the first (those between cannot be loaded back), the ranking at 20 vehicles, the vehicle import's runs at 20 (Katalog › Import says it of its own) | Block list: search and count; versions: all; ranking: „von N“; vehicle import runs: „die letzten 20 von N“ | EmailSettingsTest; Email.test.ts; SeitenTest; ListenSeitenTest; Anfragen/Index.test.ts; Fahrzeuge/Import.test.ts | behoben |
| F-39 | Friction | S4 | Kunden › Anfragen › Suche | A search that finds nothing is said twice: „0 Anfragen gefunden.“ above „Kein Treffer für diese Filter.“ — every other list says it once, in the state block (found in the re-check after the fixes) | A search without a hit is said once, by the list's state block, as everywhere else | Anfragen/Index.test.ts | behoben |
| F-40 | Rule | S4 | Team › Rollen & Rechte › Standardrolle | The seven standard roles cannot be renamed or deleted: the menu leaves both out and nothing on the page says why (the server's refusals say „Eine Standardrolle lässt sich nicht …“, but no way leads to them) | „Diese Standardrolle lässt sich weder umbenennen noch löschen. Ihre Rechte und ihre Beschreibung kannst du ändern.“ — the second sentence only for who may change it | Rollen/Index.test.ts | behoben |
| F-41 | Bug | S4 | Übersicht › Nachfrage | Since the list comes in pages (F-04), every page numbers its gaps from 1: the first gap on page 2 reads „1“, the place it holds is 51 (found in the re-check after the fixes) | Each gap carries its place in the whole ranking, on every page and in a search | NachfrageTest; Nachfrage/Index.test.ts | behoben |
| F-42 | Bug | S4 | Übersicht › Nachfrage-Lücken | With fewer than five gaps the loaded list is shorter than the skeleton of a lead line and five rows it replaces, so everything under the card moves up by a row when the charts land — the skeleton promised „the list's box, loaded or not“ (found by the final pass: UEB-02 at 1440 and 390, the demo demand of 27.09 having aged out of the 30-day window, four gaps left) | The loaded list keeps the skeleton's box as its least height: fewer gaps leave room at the foot, nothing under the card moves | CoverageRow.test.ts; e2e UEB-02 | behoben |

## Die acht Aufgaben

Walked at 1440 on the audit server, the checks of each form and list on the way; the ledgers name every step
(`docs/review/audit/`). Data the tasks made is named so it is found again: „Prüfrad“, „Prüfwerk“.

1. **A rim from nothing to the storefront with the correct verdict.** A new brand typed in („Prüfrad“), the model
   „Straße 18“ with its Radtypenbezeichnung PR18, a finish, sizes with the decimal comma (8,5J, ET 35, 66,6 mm), saved:
   empty send refused beside every field in German, the longest values taken, umlauts and ß kept, a duplicate SKU
   refused, a double click made one Felge. Published once the Gutachten of task 2 covered it; in the shop the 1.6 and the
   2.0 Limousine each get the verdict the document gives. Found: F-03, F-08, F-16.
2. **A Teilegutachten from the Borbet papers.** „366-0350-23-AUDT“ with its Bereifungskombinationen, Auflagen per axle
   including 16a), its count (Zählung), released; then a second version. In the shop: *PERMITTED* — the 2.0 Limousine
   at 250 km/h, the tyre's load index derated to 94 and its symbol W from the document's own table (the case above
   210 km/h); *CONDITIONAL* — the 1.6 Limousine; *NOT_PERMITTED* — the Kombi, after version 2 answered „Ja, alle“;
   *UNKNOWN* — the same car with its front axle load removed, the tyres „Noch nicht bestätigt“ (R-03). Found: F-05,
   F-06, F-07, F-10, F-18, F-33.
3. **A vehicle by hand, then the demo file through the Probelauf.** Two cars typed from their papers („Prüfwerk Größe
   Eins“, HSN 0005 kept, „1.060“ kg read as 1060, 250 and 200 km/h), each required field left out once — its own German
   sentence, the others kept —, a double click made one car, Back after saving made none; the import's sample file
   downloaded, a wrong file refused in German, the Probelauf counted, the import applied. Found: F-02, F-17.
4. **A tyre with EU label fields, combined into a Komplettrad.** A tyre with fuel and wet-grip classes, noise in dB and
   class, snow and ice marks and its EPREL number; in the shop a Komplettrad of the rim and the tyre in the basket at
   2.115,20 € with mounting 19,90 €. Found: F-09, F-10 (no Komplettrad where the Gutachten scopes a size to one axle).
5. **A blog post with a photo and a table.** Created, a photo uploaded with its alt text, a table with caption and
   header row, published, read in the shop at /ratgeber/… and listed in the Blog. Found: F-19, F-20.
6. **A test order, worked in the admin.** Placed in the shop with the Testzahlung (RMF-2026-1021), found by its number,
   opened, marked as sent with a tracking number, as delivered, refunded in part after the password prompt; every mail
   read from the server's log — the confirmation, the refund with its credit note, the review invitation after the
   delivery. Found: F-11, F-12, F-13, F-14 (no shipping mail), F-15 (a partly refunded order could be sent again).
7. **Edit and delete one of each entity, and what happens to dependents.** Brands (renamed; one in use refused, one
   without a Felge removed), Felgen (archived and back), Reifen (one removed), a vehicle's papers' figures (changed and
   emptied), Gutachten rows and codes (a row changed and removed, a new version started; a code in use not removable),
   menu entries and FAQ (changed and deleted; the locked Impressum and Datenschutz entries refused), an article
   (withdrawn; refused while a menu links it), roles (made, renamed; one somebody holds not deletable), users (role
   changed, suspended, reactivated), RDKS prices and weight colours (changed and deleted), a catalogue import taken
   back, saved views (saved, renamed, deleted), a blocked mail address released. Found: F-17, F-21, F-22, F-23, F-24,
   F-28, the Rules below.
8. **An Auflage's colour, reviews, the company data.** A code set to „Hinweis“, „Auflage“ and „Nicht zulässig“ and the
   shop's label watched change (D-104, D-260); a review written through the customer's signed link, answered and hidden
   in the admin; the company's details saved on Verkäufer & Versand — wrong values refused in German beside their
   fields, the same page saved from two tabs. Found: F-25 (the later tab put the earlier one's values back), F-26,
   F-27, F-28.

## Nach den Behebungen

Checked again on the audit server, on the build of the fixes, before the final gate:

- **t3a, the empty vehicle form (F-02):** passed — no question about the axle loads first; every required field says
  what it needs beside itself.
- **t6, the test order (F-05, F-12–F-15):** passed. RMF-2026-1023 placed through the Testzahlung, sent with a tracking
  number, delivered, refunded in part behind the password; the mail log holds the confirmation, „Deine Bestellung
  RMF-2026-1023 ist unterwegs“ (F-14) and „Erstattung zu deiner Bestellung RMF-2026-1023“; the order reads „Teilweise
  erstattet“ (F-15), and its Prüfnachweis prints „Nur bei 225/40 R18 · Vorder- und Hinterachse“ with its space (F-05).
  The first run after the fixes read the mail log before the refund's own request had answered — the refund, its credit
  note and its mail were there a moment later; the spec now waits for that answer (`docs/dev/TEST-SMELLS.md` §3).
- **t8, the company data in two tabs (F-25):** passed — the later tab's save refused in its sentence, the earlier
  one's values kept.
- **The sweep:** 96 pages at 1440 and 96 at 1024 — no console error, no page error, no answer of 4xx/5xx it did not
  ask for, no sideways scroll. A page answered in 0,96 s at the median and 1,27 s at the 90th percentile; the slowest,
  3,1 s, is the first — the Übersicht right after signing in.
- **The walks `v-*`** (`docs/review/audit/gaenge/`), one for each fix the browser can show: the Übersicht's
  „1.050 Gutachten warten auf Prüfung.“ opening the drafts (F-01); the password page's reason for a refund, the company
  data, the keys and the reset, and its German refusal (F-12); „Dieser Link gilt nicht mehr.“ with three ways on
  (F-27); a car typed by hand corrected, the HSN „005“ kept as „0005“, the Protokoll's before and after, and a car from
  a data set saying why it stays (F-17, F-35); the cut notes on a draft with 1.008 rows and a car in 504 (F-37); the
  block list's „50 von 60“, its search, the release asked first, and a search without a hit (F-24, F-38); the
  Anfragen ranking's „20 von 733“ (F-38); „Blog-Artikel anlegen“ (F-20); the empty vehicle form's eight sentences (F-02);
  the SEO help (F-03); a duplicate Felge refused beside the Radtypenbezeichnung (F-08); no wheel-only brand among the
  tyre makers (F-09); the picker filtering 1.062 documents (F-36); a short password told its length first (F-29);
  „neu@rimify“ refused and „jürgen.groß@rimify.de“ taken (F-30); a deleted view leaving no false sentence, and
  „Rückgängig“ (F-22); a stale save of a brand refused with the input kept (F-25); a standard role's sentence (F-40);
  a search without a hit said once (F-39) — at 1440, and the new forms and notes again at 1024 without sideways
  scroll.
- **The lists, timed again** (`lists-check-after.jsonl`, the same script as before the fixes): every list opens in
  0,66–0,79 s, the Nachfrage in 1,08 s (before: Marken up to 5 s, the Nachfrage up to 6,4 s); a search answers in
  0,24–0,29 s (Nachfrage 0,54 s), the next page in 0,26–0,35 s (Nachfrage 0,60 s). Umlauts are found — „Grün“ among
  the brands, „Müßig“ 275 times in the messages with „Alle“, „Größe“ in the Nachfrage — and a search without a hit says
  so once. No console error, no failed answer.
- **The logs:** since the re-check began, `laravel.log` holds only the expected „Gutachten-PDF nicht gefunden“ of the
  bulk rows, and no statement of the audit server took 300 ms or more.
- **The shell's dialogs:** „Tastenkürzel“ (?), „Rückmeldung geben“ (R), „Gutachten anfordern“, and on a phone (390 px)
  the „Mehr“ sheet and „Die Demodaten lassen sich gerade nicht entfernen“ with its reason; the admin's „Seite nicht
  gefunden“ for a wrong address and a missing order.


## Regeln, die bleiben

Deliberate behaviour, from regulation or the R-rules. Each stays; each is now said on the screen where the person
meets it, in the sentence quoted. Where the admin used to simply not offer a button, it now says why (the four marked
*neu*).

| Regel | Warum | Was der Bildschirm sagt |
|---|---|---|
| A car is never deleted; a car typed by hand is corrected while nothing refers to it (*neu*) | R-04: every approval and every order on a car stays explainable | Fahrzeuge › Fahrzeug: „Ein Fahrzeug wird nie gelöscht. Seine Angaben kannst du korrigieren, solange nichts darauf verweist.“ — or why not: „Auf dieses Fahrzeug verweist schon …“ |
| An Auflage code a row uses cannot be removed (*neu*) | a row would point at a code that no longer says what it means (R-15) | Auflagenverzeichnis: „Einen Code, den eine Zeile noch verwendet, kannst du nicht entfernen. Nimm ihn zuerst aus jeder Zeile heraus, die ihn verwendet …“ |
| A role somebody holds cannot be deleted (*neu*) | nobody is left without a role, and so without the screens they work in | Rollen & Rechte: „Löschen lässt sich eine Rolle erst, wenn kein Konto sie mehr hat. Gib … unter Benutzer zuerst eine andere Rolle.“ |
| A standard role keeps its name and is never deleted (*neu*) | they are the roles the shop is delivered with, and the test environment's baseline keeps exactly these seven (D-150); another set starts as a copy („Duplizieren“), which can be renamed | Rollen & Rechte: „Diese Standardrolle lässt sich weder umbenennen noch löschen. Ihre Rechte und ihre Beschreibung kannst du ändern.“ (F-40) |
| A brand that still has a Felge or a Reifen — a removed Felge too — is not removed | R-05: compliance data never disappears as a side effect of tidying the catalogue | Marken: „Entfernen lässt sich nur eine Marke ohne Felgen und Reifen – entfernte Felgen zählen mit.“ |
| A released Gutachten does not change; corrections go through a new version | an approval in the shop, and every order on it, stays explainable (R-12) | Gutachten: „Angaben, Codes und Zeilen eines freigegebenen Gutachtens lassen sich nicht mehr ändern. Änderungen gehen über eine neue Fassung …“ |
| A release is refused when the rows do not match the count | the shop may not offer less or more than the document approves (§2) | listed with the blockers before „Freigeben“ (F-18) |
| An Abnahme or work on the body is always an Auflage in the shop | a buyer must know before buying that a Prüfer or a workshop is needed | „Eine Abnahme oder Arbeit an der Karosserie ist immer eine Auflage: Sonst könnte jemand kaufen, ohne zu wissen, dass ein Prüfer oder eine Werkstatt nötig ist.“ |
| „Nicht zulässig“ in „Im Shop“ is a label, not a verdict | D-260: the verdict is the document's, never a setting's | „… Am Urteil des Gutachtens ändert das nichts.“ |
| „Verbot“ excludes no car | it is a forbidden use (snow chains), said under „Hinweise“ | „Etwas ist mit dieser Felge verboten, etwa Schneeketten. Der Shop nennt es unter „Hinweise“; es schließt kein Fahrzeug aus.“ (F-07) |
| Without the axle loads the tyres stay „Noch nicht bestätigt“ | R-03 | Fahrzeug: „… kann der Shop die Reifen nur für Kunden bestätigen, die ihre Werte aus der Zulassungsbescheinigung Teil I eintragen.“ |
| A tyre once ordered keeps its size, load index and speed symbol | the order's tyre must stay the tyre sold | „Dieser Reifen wurde schon bestellt. Größe, Lastindex und Geschwindigkeitssymbol lassen sich deshalb nicht mehr ändern …“ |
| Demonstration data is not changed, sent or counted | demo rows are born demo and never real (R-12) | „Ein Reifen aus den Demodaten: … lässt sich hier nicht ändern.“ · „Diese Bestellung gehört zu den Demodaten. Niemand hat sie aufgegeben; es wird nichts versandt.“ |
| An import never changes a size's measurements or demo data | measurements are what approvals name | Katalog-Import: „Maße ändert ein Import nie, Demodaten fasst er nicht an, und neue Felgen sind Entwürfe.“ |
| Reviews are written only by buyers, through their invitation | D-103: a review is a verified purchase's | Bewertungen: „Sie kommen nur über den Link aus der Einladung … – anlegen kann sie hier niemand.“ |
| Impressum and Datenschutz stay in the menus | they must be reachable from every page (§ 5 DDG, Art. 13 DSGVO) | Navigation: „… muss auf jeder Seite erreichbar sein“ |
| An article a menu links cannot be withdrawn | the entry would lead nowhere | „Der Artikel steht noch im Menü … Nimm ihn dort unter Navigation zuerst heraus, sonst führt der Eintrag ins Leere.“ |
| A refund cannot be taken back | money went back, the credit note is issued | „Eine Erstattung lässt sich nicht zurücknehmen.“ (F-11, F-12) |
| The password again before refunds, the shop's keys, the company data and the reset | these move money or open the shop to others | „Passwort bestätigen“ names which (F-12) |
| The real invoice numbers are opened once | a §14 series has no gaps and no way back | Zahlung: „Das lässt sich nicht rückgängig machen.“ |
| Live payments stay off while a legal text is a placeholder or an Impressum field is empty | D-319: a placeholder must never reach a paying customer | Zahlung and „Was fehlt“ name what is missing |
| A save from a page opened before the last save is refused | two people never silently undo each other (F-25) | „Das wurde inzwischen in einem anderen Tab oder von jemand anderem geändert, deshalb ist nichts gespeichert. Deine Eingaben sind noch da …“ |
| The test environment is reset only outside production | R-04.1 | System › Zurücksetzen says what each level removes and keeps |

## Was offen bleibt

- **F-10 (Bug, S2) — for the operator.** A Gutachten with Bereifungskombinationen in which one size is scoped to an
  axle offers no Komplettrad at all: the engine's TyreEligibility applies its rule for an axle-scoped size (3b) before
  its rule for combinations (4b), so combination 1 (225/40 R18 on both axles) never offers four tyres, and combination 2
  never offers its pair — against D-256 — while the shop says „vier gleiche Reifen gibt es dafür nicht“. Fixing it
  changes verdict logic and what a customer is told about the tyres for a car; the brief keeps the first, CLAUDE.md §9
  asks first for the second. Confirmed in the audit data: without the axle scope the Kompletträder appear.
  **Decided by the operator on 24.10.2026:** the Komplettrad is offered as the combination the Gutachten lists, never as
  four of one size; a combination with axle-scoped sizes is a fixed 2 + 2, checked per axle; an axle without a tyre the
  shop sells offers no Komplettrad for that combination. The source is the client's item 8. It is built as its own
  commit on top of this audit, with its own full pass.
- **F-32 (Friction, S4).** Reifen, Fahrzeuge, the Protokoll and the short lists have a fixed order; Felgen and
  Bestellungen sort. Adding sorting with its saved-view handling is more than half an hour per list: left for a later
  round, the operator's decision of 24.10.2026.


## Inventar (471 Zeilen, 471 mit Ergebnis)

Each row ends in a result taken from the evidence, never from memory: **Browser** — the sweep opened the page at the width(s) named and saw no console error, page error, unexpected 4xx/5xx or sideways scroll; **Gang** — the walk(s) that used it step by step (`docs/review/audit/gaenge/`: `w-*` during the audit, `v-*` the re-check after the fixes, each replayed with `node walk.mjs <gang>.json [Breite]`); **Pest** — how many requests of the PHP suite reached the route (a gate run with `TEST_ROUTE_LOG`); **Vitest** — the component test of the file; and, where it applies, the finding.

### Seiten (GET-Routen) (55)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 1 | Übersicht | GET /admin | `UebersichtController` | Browser 1440 + 1024: ohne Fehler · Gang v-01-uebersicht, v-dialoge, v-fehlerseite, v-telefon-mehr (+1) · Pest: 173 Aufrufe |
| 2 | Gutachten | GET /admin/abdeckung | `AbdeckungController@index` | Browser 1440 + 1024: ohne Fehler · Pest: 9 Aufrufe |
| 3 | Kunden & Nachfrage | GET /admin/anfragen | `AnfragenController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-1024-neu, v-25-zwei-tabs, v-38-lists · Pest: 27 Aufrufe |
| 4 | Konto & Rahmen | GET /admin/anmelden | `AdminLoginController@create` | Gang v-12-bestaetigen, w-f-3 · Pest: 9 Aufrufe |
| 5 | Gutachten | GET /admin/auflagen | `AuflagenController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-forms-a, w-l-1 · Pest: 7 Aufrufe |
| 6 | Konto & Rahmen | GET /admin/benachrichtigungen | `BenachrichtigungenController@index` | Pest: 15 Aufrufe |
| 7 | Team & Protokoll | GET /admin/benutzer | `BenutzerController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-forms-b, v-forms-c, v-forms-d, v-forms-e (+6) · Pest: 17 Aufrufe |
| 8 | Konto & Rahmen | GET /admin/bestaetigen | `SudoController@show` | Gang v-12-bestaetigen · Pest: 15 Aufrufe |
| 9 | Verkauf | GET /admin/bestellungen | `BestellungenController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-22-ansicht, w-t6-1, w-t7-36 · Pest: 96 Aufrufe |
| 10 | Verkauf | GET /admin/bestellungen/{order} | `BestellungenController@show` | Browser 1440 + 1024: ohne Fehler · Gang v-fehlerseite, w-t6-2, w-t6-3, w-t7-21 (+2) · Pest: 15 Aufrufe |
| 11 | Verkauf | GET /admin/bewertungen | `BewertungenController@index` | Browser 1440 + 1024: ohne Fehler · Gang w-t8-4, w-t8-6 · Pest: 12 Aufrufe |
| 12 | Team & Protokoll | GET /admin/einladung/{token} | `EinladungController@show` | Pest: 11 Aufrufe |
| 13 | Einstellungen | GET /admin/einstellungen/e-mail | `EmailController@edit` | Browser 1440 + 1024: ohne Fehler · Gang v-1024-neu, v-24-email, w-t7-37, w-t7-40 (+3) · Pest: 14 Aufrufe |
| 14 | Einstellungen | GET /admin/einstellungen/speicher | `SpeicherController@edit` | Browser 1440 + 1024: ohne Fehler · Pest: 9 Aufrufe |
| 15 | Einstellungen | GET /admin/einstellungen/verkaeufer-versand | `VerkaeuferVersandController@edit` | Browser 1440 + 1024: ohne Fehler · Gang w-t8-3 · Pest: 10 Aufrufe |
| 16 | Einstellungen | GET /admin/einstellungen/zahlung | `ZahlungController@edit` | Browser 1440 + 1024: ohne Fehler · Gang v-12-bestaetigen · Pest: 9 Aufrufe |
| 17 | Fahrzeuge | GET /admin/fahrzeuge | `FahrzeugeController@index` | Browser 1440 + 1024: ohne Fehler · Pest: 7 Aufrufe |
| 18 | Fahrzeuge | GET /admin/fahrzeuge/import | `FahrzeugImportController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-38-lists, w-t3b-1 · Pest: 2 Aufrufe |
| 19 | Fahrzeuge | GET /admin/fahrzeuge/import/{import} | `FahrzeugImportController@show` | Browser 1440 + 1024: ohne Fehler · Pest: 4 Aufrufe |
| 20 | Fahrzeuge | GET /admin/fahrzeuge/neu | `FahrzeugeController@create` | Browser 1440 + 1024: ohne Fehler · Gang v-17-korrektur, v-forms-a, w-t3a-1, w-t3a-2 (+2) · Pest: 2 Aufrufe |
| 21 | Fahrzeuge | GET /admin/fahrzeuge/pruefung | `FahrzeugeController@review` | Browser 1440 + 1024: ohne Fehler · Pest: 5 Aufrufe |
| 22 | Fahrzeuge | GET /admin/fahrzeuge/{vehicle} | `FahrzeugeController@show` | Browser 1440 + 1024: ohne Fehler · Gang v-1024-neu, v-17-korrektur, v-37-cut, v-37b-cut (+3) · Pest: 10 Aufrufe |
| 23 | Inhalte | GET /admin/faq | `FragenController@index` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-22, w-t7-24 · Pest: 14 Aufrufe |
| 24 | Katalog | GET /admin/felgen | `FelgenController@index` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-39, w-t7-6, w-t7-7 · Pest: 17 Aufrufe |
| 25 | Katalog | GET /admin/felgen/neu | `FelgenController@create` | Browser 1440 + 1024: ohne Fehler · Gang v-forms-d, w-t1-1, w-t1-2, w-t1-3 (+3) · Pest: 1 Aufrufe |
| 26 | Katalog | GET /admin/felgen/{model} | `FelgenController@edit` | Browser 1440 + 1024: ohne Fehler · Gang v-forms-a, w-t1-6, w-t1-8, w-t7-5 (+2) · Pest: 7 Aufrufe |
| 27 | Gutachten | GET /admin/gutachten | `GutachtenController@index` | Browser 1440 + 1024: ohne Fehler · Pest: 30 Aufrufe |
| 28 | Gutachten | GET /admin/gutachten/neu | `GutachtenController@create` | Browser 1440 + 1024: ohne Fehler · Gang v-1024-neu, v-forms-d, w-t2-1, w-t2-2 (+2) · Pest: 2 Aufrufe |
| 29 | Gutachten | GET /admin/gutachten/{document} | `GutachtenController@show` | Browser 1440 + 1024: ohne Fehler · Gang v-05-nurbei, v-1024-neu, v-22-ansicht, v-37-cut (+30) · Pest: 41 Aufrufe |
| 30 | Katalog | GET /admin/katalog/import | `KatalogImportController@index` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-37, w-t7-38 · Pest: 5 Aufrufe |
| 31 | Katalog | GET /admin/katalog/import/{import} | `KatalogImportController@show` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-39 · Pest: 4 Aufrufe |
| 32 | Gutachten | GET /admin/konflikte | `KonflikteController@index` | Browser 1440 + 1024: ohne Fehler · Pest: 10 Aufrufe |
| 33 | Gutachten | GET /admin/konflikte/{conflict} | `KonflikteController@show` | Pest: 1 Aufrufe |
| 34 | Katalog | GET /admin/marken | `MarkenController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 · Pest: 14 Aufrufe |
| 35 | Kunden & Nachfrage | GET /admin/nachfrage | `NachfrageController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-dialoge · Pest: 15 Aufrufe |
| 36 | Kunden & Nachfrage | GET /admin/nachrichten | `NachrichtenController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-nachrichten-suche · Pest: 11 Aufrufe |
| 37 | Inhalte | GET /admin/navigation | `NavigationController@index` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-22, w-t7-23, w-t7-24, w-t7-25 (+1) · Pest: 17 Aufrufe |
| 38 | Konto & Rahmen | GET /admin/profil | `AdminProfileController@show` | Gang v-forms-b, w-f-2 · Pest: 10 Aufrufe |
| 39 | Team & Protokoll | GET /admin/protokoll | `ProtokollController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-38-lists · Pest: 34 Aufrufe |
| 40 | Katalog | GET /admin/rdks-preise/{rest?} | `Closure` | Pest: 2 Aufrufe |
| 41 | Katalog | GET /admin/reifen | `ReifenController@index` | Browser 1440 + 1024: ohne Fehler · Pest: 22 Aufrufe |
| 42 | Katalog | GET /admin/reifen/neu | `ReifenController@create` | Browser 1440 + 1024: ohne Fehler · Gang v-forms-d, v-forms-e, w-t4-1, w-t4-2 (+2) · Pest: 3 Aufrufe |
| 43 | Katalog | GET /admin/reifen/{tyre} | `ReifenController@edit` | Browser 1440 + 1024: ohne Fehler · Gang w-t4-3, w-t7-3, w-t7-4 · Pest: 5 Aufrufe |
| 44 | Review-Board | GET /admin/review | `ReviewController@board` | Browser 1440 + 1024: ohne Fehler · Pest: 4 Aufrufe |
| 45 | Review-Board | GET /admin/review/rueckmeldungen | `ReviewController@feedback` | Browser 1440 + 1024: ohne Fehler · Pest: 3 Aufrufe |
| 46 | Team & Protokoll | GET /admin/rollen | `RollenController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a, v-forms-b (+5) · Pest: 29 Aufrufe |
| 47 | Verkauf | GET /admin/rueckbuchungen | `RueckbuchungenController@index` | Browser 1440 + 1024: ohne Fehler · Pest: 6 Aufrufe |
| 48 | Inhalte | GET /admin/seiten | `SeitenController@index` | Browser 1440 + 1024: ohne Fehler · Gang v-38-lists, w-l-1, w-t5-1 · Pest: 12 Aufrufe |
| 49 | Inhalte | GET /admin/seiten/{page} | `SeitenController@show` | Browser 1440 + 1024: ohne Fehler · Gang w-f-1, w-t5-2, w-t5-3, w-t7-25 (+1) · Pest: 7 Aufrufe |
| 50 | System | GET /admin/system | `SystemController@index` | Browser 1440 + 1024: ohne Fehler · Pest: 3 Aufrufe |
| 51 | System | GET /admin/system/was-fehlt | `WasFehltController@show` | Browser 1440 + 1024: ohne Fehler · Pest: 7 Aufrufe |
| 52 | System | GET /admin/system/zuruecksetzen | `ZuruecksetzenController@show` | Browser 1440 + 1024: ohne Fehler · Pest: 62 Aufrufe |
| 53 | Katalog | GET /admin/wuchtgewichte/{rest?} | `Closure` | Pest: 1 Aufrufe |
| 54 | Katalog | GET /admin/zubehoerpreise/rdks | `RdksPreiseController@index` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-31, w-t7-33, w-t7-34, w-t7-35 · Pest: 20 Aufrufe |
| 55 | Katalog | GET /admin/zubehoerpreise/wuchtgewichte | `WuchtgewichteController@index` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-31, w-t7-32 · Pest: 27 Aufrufe |

### Seiten (Vue-Komponenten) (48)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 56 | Gutachten | Seite „Abdeckung“ | `resources/js/Pages/Admin/Abdeckung/Index.vue:34` | Seite /admin/abdeckung ohne Fehler geöffnet |
| 57 | Kunden & Nachfrage | Seite „Anfragen“ | `resources/js/Pages/Admin/Anfragen/Index.vue:55` | Seite /admin/anfragen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-38-lists · Vitest: Index.test.ts |
| 58 | Gutachten | Seite „Auflagen“ | `resources/js/Pages/Admin/Auflagen/Index.vue:69` | Seite /admin/auflagen ohne Fehler geöffnet · Gang v-forms-a, w-l-1 |
| 59 | Konto & Rahmen | Seite „Benachrichtigungen“ | `resources/js/Pages/Admin/Benachrichtigungen/Index.vue:201` | Vitest: Index.test.ts |
| 60 | Team & Protokoll | Seite „Benutzer“ | `resources/js/Pages/Admin/Benutzer/Index.vue:245` | Seite /admin/benutzer ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+7) |
| 61 | Konto & Rahmen | Seite „Passwort bestätigen“ | `resources/js/Pages/Admin/Bestaetigen/Index.vue:27` | Seite /admin/bestaetigen ohne Fehler geöffnet · Gang v-12-bestaetigen · Vitest: Index.test.ts |
| 62 | Verkauf | Seite „Bestellungen“ | `resources/js/Pages/Admin/Bestellungen/Index.vue:243` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 63 | Verkauf | Seite (Titel aus `Bestellung ${order.number}`) | `resources/js/Pages/Admin/Bestellungen/Show.vue:274` | Seite /admin/bestellungen/{id} ohne Fehler geöffnet · Gang v-fehlerseite, w-t6-2, w-t6-3 (+3) · Vitest: Show.test.ts |
| 64 | Verkauf | Seite „Bewertungen“ | `resources/js/Pages/Admin/Bewertungen/Index.vue:118` | Seite /admin/bewertungen ohne Fehler geöffnet · Gang w-t8-4, w-t8-6 |
| 65 | Einstellungen | Seite „E-Mail“ | `resources/js/Pages/Admin/Einstellungen/Email.vue:131` | Seite /admin/einstellungen/e-mail ohne Fehler geöffnet · Gang v-1024-neu, v-24-email, w-t7-37 (+4) · Vitest: Email.test.ts |
| 66 | Einstellungen | Seite „Medien und Speicher“ | `resources/js/Pages/Admin/Einstellungen/Speicher.vue:94` | Seite /admin/einstellungen/speicher ohne Fehler geöffnet |
| 67 | Einstellungen | Seite „Verkäufer & Versand“ | `resources/js/Pages/Admin/Einstellungen/VerkaeuferVersand.vue:125` | Seite /admin/einstellungen/verkaeufer-versand ohne Fehler geöffnet · Gang w-t8-3 · Vitest: VerkaeuferVersand.test.ts |
| 68 | Einstellungen | Seite „Zahlung“ | `resources/js/Pages/Admin/Einstellungen/Zahlung.vue:93` | Seite /admin/einstellungen/zahlung ohne Fehler geöffnet · Gang v-12-bestaetigen |
| 69 | Fahrzeuge | Seite „Fahrzeug-Import“ | `resources/js/Pages/Admin/Fahrzeuge/Import.vue:110` | Seite /admin/fahrzeuge/import ohne Fehler geöffnet · Gang v-38-lists, w-t3b-1 · Vitest: Import.test.ts |
| 70 | Fahrzeuge | Seite (Titel aus run.file) | `resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue:219` | Seite /admin/fahrzeuge/import/{id} ohne Fehler geöffnet · Vitest: ImportRun.test.ts |
| 71 | Fahrzeuge | Seite (Titel aus review ? 'Zur Prüfung' : 'Fahrzeuge') | `resources/js/Pages/Admin/Fahrzeuge/Index.vue:62` | Seite /admin/fahrzeuge/pruefung ohne Fehler geöffnet |
| 72 | Fahrzeuge | Seite „Neues Fahrzeug“ | `resources/js/Pages/Admin/Fahrzeuge/Neu.vue:124` | Seite /admin/fahrzeuge/neu ohne Fehler geöffnet · Gang v-17-korrektur, v-forms-a, w-t3a-1 (+3) · Vitest: Neu.test.ts |
| 73 | Fahrzeuge | Seite (Titel aus vehicle.name) | `resources/js/Pages/Admin/Fahrzeuge/Show.vue:170` | Seite /admin/fahrzeuge/{id} ohne Fehler geöffnet · Gang v-1024-neu, v-17-korrektur, v-37-cut (+4) · Vitest: Show.test.ts |
| 74 | Inhalte | Seite „FAQ“ | `resources/js/Pages/Admin/Faq/Index.vue:348` | Seite /admin/faq ohne Fehler geöffnet · Gang w-t7-22, w-t7-24 |
| 75 | Sonstiges | Seite (Titel aus page.title) | `resources/js/Pages/Admin/Fehler/Index.vue:36` | Gang v-fehlerseite (falsche Adresse und fehlende Bestellung: „Seite nicht gefunden“, der Grund, „Zur Übersicht“) |
| 76 | Katalog | Seite (Titel aus title) | `resources/js/Pages/Admin/Felgen/Edit.vue:324` | Seite /admin/felgen/neu, /admin/felgen/{id} ohne Fehler geöffnet · Gang v-forms-d, w-t1-1, w-t1-2 (+10) · Vitest: Edit.test.ts |
| 77 | Katalog | Seite „Felgen“ | `resources/js/Pages/Admin/Felgen/Index.vue:279` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 78 | Gutachten | Seite „Dokumente“ | `resources/js/Pages/Admin/Gutachten/Index.vue:116` | Seite /admin/gutachten ohne Fehler geöffnet · Vitest: Index.test.ts |
| 79 | Gutachten | Seite „Neues Gutachten“ | `resources/js/Pages/Admin/Gutachten/Neu.vue:151` | Seite /admin/gutachten/neu ohne Fehler geöffnet · Gang v-1024-neu, v-forms-d, w-t2-1 (+3) |
| 80 | Gutachten | Seite (Titel aus document.label) | `resources/js/Pages/Admin/Gutachten/Show.vue:326` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 81 | Katalog | Seite „Katalog-Import“ | `resources/js/Pages/Admin/Katalog/Import.vue:103` | Seite /admin/katalog/import ohne Fehler geöffnet · Gang w-t7-37, w-t7-38 |
| 82 | Katalog | Seite (Titel aus run.file) | `resources/js/Pages/Admin/Katalog/ImportRun.vue:143` | Seite /admin/katalog/import/{id} ohne Fehler geöffnet · Gang w-t7-39 |
| 83 | Gutachten | Seite „Konflikte“ | `resources/js/Pages/Admin/Konflikte/Index.vue:141` | Seite /admin/konflikte ohne Fehler geöffnet |
| 84 | Katalog | Seite „Marken“ | `resources/js/Pages/Admin/Marken/Index.vue:367` | Seite /admin/marken ohne Fehler geöffnet · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 |
| 85 | Kunden & Nachfrage | Seite „Nachfrage-Lücken“ | `resources/js/Pages/Admin/Nachfrage/Index.vue:170` | Seite /admin/nachfrage ohne Fehler geöffnet · Gang v-dialoge · Vitest: Index.test.ts |
| 86 | Kunden & Nachfrage | Seite „Nachrichten“ | `resources/js/Pages/Admin/Nachrichten/Index.vue:81` | Seite /admin/nachrichten ohne Fehler geöffnet · Gang v-nachrichten-suche · Vitest: Index.test.ts |
| 87 | Inhalte | Seite „Navigation“ | `resources/js/Pages/Admin/Navigation/Index.vue:333` | Seite /admin/navigation ohne Fehler geöffnet · Gang w-t7-22, w-t7-23, w-t7-24 (+2) |
| 88 | Konto & Rahmen | Seite „Profil“ | `resources/js/Pages/Admin/Profil/Index.vue:43` | Seite /admin/profil ohne Fehler geöffnet · Gang v-forms-b, w-f-2 |
| 89 | Team & Protokoll | Seite „Protokoll“ | `resources/js/Pages/Admin/Protokoll/Index.vue:146` | Seite /admin/protokoll ohne Fehler geöffnet · Gang v-38-lists · Vitest: Index.test.ts |
| 90 | Katalog | Seite „Zubehörpreise“ | `resources/js/Pages/Admin/Rdks/Index.vue:197` | Seite /admin/zubehoerpreise/rdks ohne Fehler geöffnet · Gang w-t7-31, w-t7-33, w-t7-34 (+1) · Vitest: Index.test.ts |
| 91 | Katalog | Seite (Titel aus title) | `resources/js/Pages/Admin/Reifen/Edit.vue:185` | Seite /admin/reifen/neu, /admin/reifen/{id} ohne Fehler geöffnet · Gang v-forms-d, v-forms-e, w-t4-1 (+5) · Vitest: Edit.test.ts |
| 92 | Katalog | Seite „Reifen“ | `resources/js/Pages/Admin/Reifen/Index.vue:80` | Seite /admin/reifen ohne Fehler geöffnet |
| 93 | Review-Board | Seite „Stand der Seiten“ | `resources/js/Pages/Admin/Review/Board.vue:33` | Seite /admin/review ohne Fehler geöffnet |
| 94 | Review-Board | Seite „Rückmeldungen“ | `resources/js/Pages/Admin/Review/Feedback.vue:150` | Seite /admin/review/rueckmeldungen ohne Fehler geöffnet |
| 95 | Team & Protokoll | Seite „Rollen & Rechte“ | `resources/js/Pages/Admin/Rollen/Index.vue:370` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 96 | Verkauf | Seite „Rückbuchungen“ | `resources/js/Pages/Admin/Rueckbuchungen/Index.vue:108` | Seite /admin/rueckbuchungen ohne Fehler geöffnet · Vitest: Index.test.ts |
| 97 | Inhalte | Seite (Titel aus page.title) | `resources/js/Pages/Admin/Seiten/Bearbeiten.vue:707` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: Bearbeiten.test.ts |
| 98 | Inhalte | Seite „Seiten“ | `resources/js/Pages/Admin/Seiten/Index.vue:92` | Seite /admin/seiten ohne Fehler geöffnet · Gang v-38-lists, w-l-1, w-t5-1 |
| 99 | System | Seite „Systemzustand“ | `resources/js/Pages/Admin/System/Index.vue:29` | Seite /admin/system ohne Fehler geöffnet |
| 100 | System | Seite „Was fehlt“ | `resources/js/Pages/Admin/System/WasFehlt.vue:48` | Seite /admin/system/was-fehlt ohne Fehler geöffnet · Vitest: WasFehlt.test.ts |
| 101 | System | Seite „Testumgebung zurücksetzen“ | `resources/js/Pages/Admin/System/Zuruecksetzen.vue:133` | Seite /admin/system/zuruecksetzen ohne Fehler geöffnet · Vitest: Zuruecksetzen.test.ts |
| 102 | Übersicht | Seite „Übersicht“ | `resources/js/Pages/Admin/Uebersicht/Index.vue:211` | Seite /admin ohne Fehler geöffnet · Gang v-01-uebersicht, v-dialoge, v-fehlerseite (+2) |
| 103 | Katalog | Seite „Zubehörpreise“ | `resources/js/Pages/Admin/Wuchtgewichte/Index.vue:206` | Seite /admin/zubehoerpreise/wuchtgewichte ohne Fehler geöffnet · Gang w-t7-31, w-t7-32 · Vitest: Index.test.ts |

### Aktionen (schreibende Routen) (134)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 104 | Konto & Rahmen | POST /admin/abmelden | `AdminLoginController@destroy` | Pest: 2 Aufrufe |
| 105 | Konto & Rahmen | POST /admin/anmelden | `AdminLoginController@store` | Gang v-12-bestaetigen, w-f-3 · Pest: 27 Aufrufe |
| 106 | Konto & Rahmen | PATCH /admin/ansicht | `AdminPreferencesController@update` | Pest: 29 Aufrufe |
| 107 | Konto & Rahmen | POST /admin/ansichten | `SavedViewsController@store` | Pest: 15 Aufrufe |
| 108 | Konto & Rahmen | PATCH /admin/ansichten/{view} | `SavedViewsController@update` | Pest: 12 Aufrufe |
| 109 | Konto & Rahmen | DELETE /admin/ansichten/{view} | `SavedViewsController@destroy` | Pest: 5 Aufrufe |
| 110 | Konto & Rahmen | POST /admin/ansichten/{view}/wiederherstellen | `SavedViewsController@restore` | Pest: 4 Aufrufe |
| 111 | Einstellungen | PUT /admin/benachrichtigungen/einstellungen | `BenachrichtigungenController@preferences` | Pest: 6 Aufrufe |
| 112 | Konto & Rahmen | POST /admin/benachrichtigungen/gelesen | `BenachrichtigungenController@readAll` | Pest: 2 Aufrufe |
| 113 | Konto & Rahmen | POST /admin/benachrichtigungen/{notification}/gelesen | `BenachrichtigungenController@read` | Pest: 4 Aufrufe |
| 114 | Team & Protokoll | POST /admin/benutzer/einladungen | `BenutzerController@invite` | Pest: 15 Aufrufe |
| 115 | Team & Protokoll | DELETE /admin/benutzer/einladungen/{invitation} | `BenutzerController@revoke` | Pest: 3 Aufrufe |
| 116 | Team & Protokoll | POST /admin/benutzer/einladungen/{invitation}/erneut | `BenutzerController@resend` | Pest: 7 Aufrufe |
| 117 | Team & Protokoll | POST /admin/benutzer/{user}/abmelden | `BenutzerController@revokeSessions` | Pest: 4 Aufrufe |
| 118 | Team & Protokoll | POST /admin/benutzer/{user}/entsperren | `BenutzerController@reactivate` | Pest: 4 Aufrufe |
| 119 | Team & Protokoll | PATCH /admin/benutzer/{user}/rolle | `BenutzerController@changeRole` | Pest: 10 Aufrufe |
| 120 | Team & Protokoll | POST /admin/benutzer/{user}/sperren | `BenutzerController@suspend` | Pest: 7 Aufrufe |
| 121 | Konto & Rahmen | POST /admin/bestaetigen | `SudoController@store` | Gang v-12-bestaetigen · Pest: 14 Aufrufe |
| 122 | Verkauf | POST /admin/bestellungen/{order}/erstattung | `ErstattungController@store` | Pest: 9 Aufrufe |
| 123 | Verkauf | POST /admin/bestellungen/{order}/versendet | `VersandController@ship` | Pest: 8 Aufrufe |
| 124 | Verkauf | POST /admin/bestellungen/{order}/zugestellt | `VersandController@deliver` | Pest: 4 Aufrufe |
| 125 | Verkauf | PUT /admin/bewertungen/{review}/antwort | `BewertungenController@reply` | Pest: 5 Aufrufe |
| 126 | Verkauf | POST /admin/bewertungen/{review}/ausblenden | `BewertungenController@hide` | Pest: 3 Aufrufe |
| 127 | Verkauf | POST /admin/bewertungen/{review}/einblenden | `BewertungenController@show` | Pest: 1 Aufrufe |
| 128 | System | POST /admin/demodaten/entfernen | `DemoDataController@destroy` | Pest: 4 Aufrufe |
| 129 | Team & Protokoll | POST /admin/einladung/{token} | `EinladungController@accept` | Pest: 18 Aufrufe |
| 130 | Einstellungen | PUT /admin/einstellungen/e-mail | `EmailController@update` | Browser 1440 + 1024: ohne Fehler · Gang v-1024-neu, v-24-email, w-t7-37, w-t7-40 (+3) · Pest: 12 Aufrufe |
| 131 | Einstellungen | DELETE /admin/einstellungen/e-mail/sperren/{suppression} | `EmailController@release` | Pest: 4 Aufrufe |
| 132 | Einstellungen | POST /admin/einstellungen/e-mail/test | `EmailController@test` | Pest: 4 Aufrufe |
| 133 | Einstellungen | PUT /admin/einstellungen/speicher | `SpeicherController@update` | Browser 1440 + 1024: ohne Fehler · Pest: 14 Aufrufe |
| 134 | Einstellungen | POST /admin/einstellungen/speicher/buckets | `SpeicherController@buckets` | Pest: 2 Aufrufe |
| 135 | Einstellungen | POST /admin/einstellungen/speicher/test | `SpeicherController@test` | Pest: 1 Aufrufe |
| 136 | Einstellungen | PUT /admin/einstellungen/verkaeufer-versand | `VerkaeuferVersandController@update` | Browser 1440 + 1024: ohne Fehler · Gang w-t8-3 · Pest: 17 Aufrufe |
| 137 | Einstellungen | PUT /admin/einstellungen/zahlung | `ZahlungController@update` | Browser 1440 + 1024: ohne Fehler · Gang v-12-bestaetigen · Pest: 19 Aufrufe |
| 138 | Einstellungen | POST /admin/einstellungen/zahlung/rechnungsnummern | `RechnungsnummernController@store` | Pest: 11 Aufrufe |
| 139 | Einstellungen | POST /admin/einstellungen/zahlung/test | `ZahlungController@test` | Pest: 2 Aufrufe |
| 140 | Fahrzeuge | POST /admin/fahrzeuge | `FahrzeugeController@store` | Browser 1440 + 1024: ohne Fehler · Pest: 23 Aufrufe |
| 141 | Fahrzeuge | POST /admin/fahrzeuge/import/probelauf | `FahrzeugImportController@preview` | Pest: 20 Aufrufe |
| 142 | Fahrzeuge | POST /admin/fahrzeuge/import/{import}/importieren | `FahrzeugImportController@apply` | Pest: 13 Aufrufe |
| 143 | Fahrzeuge | POST /admin/fahrzeuge/import/{import}/zuordnung | `FahrzeugImportController@remap` | Pest: 2 Aufrufe |
| 144 | Fahrzeuge | PUT /admin/fahrzeuge/{vehicle} | `FahrzeugeController@update` | Browser 1440 + 1024: ohne Fehler · Gang v-1024-neu, v-17-korrektur, v-37-cut, v-37b-cut (+3) · Pest: 8 Aufrufe |
| 145 | Fahrzeuge | PUT /admin/fahrzeuge/{vehicle}/angaben | `FahrzeugeController@correct` | Pest: 6 Aufrufe |
| 146 | Inhalte | POST /admin/faq | `FragenController@store` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-22, w-t7-24 · Pest: 3 Aufrufe |
| 147 | Inhalte | PUT /admin/faq/reihenfolge | `FragenController@reorder` | Pest: 6 Aufrufe |
| 148 | Inhalte | PUT /admin/faq/{entry} | `FragenController@update` | Pest: 10 Aufrufe |
| 149 | Inhalte | DELETE /admin/faq/{entry} | `FragenController@destroy` | Pest: 13 Aufrufe |
| 150 | Inhalte | PATCH /admin/faq/{entry}/sichtbarkeit | `FragenController@visibility` | Pest: 2 Aufrufe |
| 151 | Katalog | POST /admin/felgen | `FelgenController@store` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-39, w-t7-6, w-t7-7 · Pest: 10 Aufrufe |
| 152 | Katalog | POST /admin/felgen/sammelaktion | `FelgenController@bulk` | Pest: 3 Aufrufe |
| 153 | Katalog | PUT /admin/felgen/{model} | `FelgenController@update` | Browser 1440 + 1024: ohne Fehler · Gang v-forms-a, w-t1-6, w-t1-8, w-t7-5 (+2) · Pest: 20 Aufrufe |
| 154 | Katalog | POST /admin/felgen/{model}/archivieren | `FelgenController@status` | Pest: 2 Aufrufe |
| 155 | Katalog | POST /admin/felgen/{model}/ausfuehrungen/{finish}/foto | `FelgenController@image` | Pest: 26 Aufrufe |
| 156 | Katalog | PUT /admin/felgen/{model}/ausfuehrungen/{finish}/fotos/reihenfolge | `FelgenController@reorderImages` | Pest: 5 Aufrufe |
| 157 | Katalog | PUT /admin/felgen/{model}/ausfuehrungen/{finish}/fotos/{image} | `FelgenController@relabelImage` | Pest: 4 Aufrufe |
| 158 | Katalog | DELETE /admin/felgen/{model}/ausfuehrungen/{finish}/fotos/{image} | `FelgenController@removeImage` | Pest: 4 Aufrufe |
| 159 | Katalog | POST /admin/felgen/{model}/veroeffentlichen | `FelgenController@status` | Pest: 6 Aufrufe |
| 160 | Katalog | POST /admin/felgen/{model}/wiederherstellen | `FelgenController@status` | Pest: 1 Aufrufe |
| 161 | Katalog | POST /admin/felgen/{model}/zurueckziehen | `FelgenController@status` | Pest: 1 Aufrufe |
| 162 | Gutachten | POST /admin/gutachten | `GutachtenController@store` | Browser 1440 + 1024: ohne Fehler · Pest: 37 Aufrufe |
| 163 | Gutachten | PUT /admin/gutachten/{document} | `GutachtenController@update` | Browser 1440 + 1024: ohne Fehler · Gang v-05-nurbei, v-1024-neu, v-22-ansicht, v-37-cut (+30) · Pest: 12 Aufrufe |
| 164 | Gutachten | POST /admin/gutachten/{document}/auflagen | `GutachtenAuflagenController@store` | Pest: 18 Aufrufe |
| 165 | Gutachten | POST /admin/gutachten/{document}/auflagen/stapel | `GutachtenAuflagenController@batch` | Pest: 16 Aufrufe |
| 166 | Gutachten | PUT /admin/gutachten/{document}/auflagen/{condition} | `GutachtenAuflagenController@update` | Pest: 5 Aufrufe |
| 167 | Gutachten | DELETE /admin/gutachten/{document}/auflagen/{condition} | `GutachtenAuflagenController@destroy` | Pest: 3 Aufrufe |
| 168 | Gutachten | POST /admin/gutachten/{document}/auflagen/{condition}/grenze | `GutachtenAuflagenController@confirmLimit` | Pest: 4 Aufrufe |
| 169 | Gutachten | PUT /admin/gutachten/{document}/auflagen/{condition}/stufe | `GutachtenAuflagenController@level` | Pest: 9 Aufrufe |
| 170 | Gutachten | POST /admin/gutachten/{document}/befestigungsmittel | `GutachtenAngabenController@store` | Pest: 80 Aufrufe |
| 171 | Gutachten | DELETE /admin/gutachten/{document}/befestigungsmittel/{fastener} | `GutachtenAngabenController@destroyFastener` | Pest: 1 Aufrufe |
| 172 | Gutachten | PUT /admin/gutachten/{document}/bereifungskombinationen | `GutachtenKombinationenController@update` | Pest: 16 Aufrufe |
| 173 | Fahrzeuge | POST /admin/gutachten/{document}/fahrzeuge | `GutachtenFahrzeugController@store` | Pest: 554 Aufrufe |
| 174 | Gutachten | POST /admin/gutachten/{document}/freigeben | `GutachtenController@release` | Pest: 48 Aufrufe |
| 175 | Gutachten | POST /admin/gutachten/{document}/hinweise | `GutachtenAngabenController@store` | Pest: 74 Aufrufe |
| 176 | Gutachten | DELETE /admin/gutachten/{document}/hinweise/{notice} | `GutachtenAngabenController@destroyNotice` | Pest: 2 Aufrufe |
| 177 | Gutachten | POST /admin/gutachten/{document}/nacharbeit | `GutachtenAngabenController@store` | Pest: 242 Aufrufe |
| 178 | Gutachten | DELETE /admin/gutachten/{document}/nacharbeit/{rework} | `GutachtenAngabenController@destroyRework` | Pest: 1 Aufrufe · GutachtenRecordTest (das Maß entfernt, wie die Ablehnung des Codes sagt, dann der Code; im Protokoll) |
| 179 | Gutachten | POST /admin/gutachten/{document}/neue-fassung | `GutachtenController@revise` | Pest: 7 Aufrufe |
| 180 | Gutachten | PUT /admin/gutachten/{document}/tragfaehigkeitstabelle | `GutachtenTabelleController@update` | Pest: 16 Aufrufe |
| 181 | Gutachten | POST /admin/gutachten/{document}/vollstaendigkeit | `GutachtenController@completeness` | Pest: 3 Aufrufe |
| 182 | Gutachten | POST /admin/gutachten/{document}/zaehlung | `GutachtenController@count` | Pest: 22 Aufrufe |
| 183 | Gutachten | POST /admin/gutachten/{document}/zeilen | `GutachtenZeilenController@store` | Pest: 950 Aufrufe |
| 184 | Gutachten | PUT /admin/gutachten/{document}/zeilen/{fitment} | `GutachtenZeilenController@update` | Pest: 6 Aufrufe |
| 185 | Gutachten | DELETE /admin/gutachten/{document}/zeilen/{fitment} | `GutachtenZeilenController@destroy` | Pest: 1 Aufrufe |
| 186 | Katalog | POST /admin/katalog/import/probelauf | `KatalogImportController@preview` | Pest: 26 Aufrufe |
| 187 | Katalog | POST /admin/katalog/import/{import}/importieren | `KatalogImportController@apply` | Pest: 16 Aufrufe |
| 188 | Katalog | POST /admin/katalog/import/{import}/zuordnung | `KatalogImportController@remap` | Pest: 3 Aufrufe |
| 189 | Katalog | POST /admin/katalog/import/{import}/zuruecknehmen | `KatalogImportController@rollback` | Pest: 4 Aufrufe |
| 190 | Gutachten | POST /admin/konflikte/entscheiden | `KonflikteController@decide` | Pest: 5 Aufrufe |
| 191 | Katalog | POST /admin/marken | `MarkenController@store` | Browser 1440 + 1024: ohne Fehler · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 · Pest: 6 Aufrufe |
| 192 | Katalog | PUT /admin/marken/{brand} | `MarkenController@update` | Pest: 6 Aufrufe |
| 193 | Katalog | DELETE /admin/marken/{brand} | `MarkenController@destroy` | Pest: 5 Aufrufe |
| 194 | Katalog | PUT /admin/marken/{brand}/hersteller | `MarkenController@manufacturer` | Pest: 8 Aufrufe |
| 195 | Katalog | POST /admin/marken/{brand}/logo | `MarkenController@logo` | Pest: 17 Aufrufe |
| 196 | Katalog | DELETE /admin/marken/{brand}/logo | `MarkenController@removeLogo` | Pest: 1 Aufrufe |
| 197 | Kunden & Nachfrage | POST /admin/nachfrage/markierung | `NachfrageController@mark` | Pest: 10 Aufrufe |
| 198 | Kunden & Nachfrage | DELETE /admin/nachfrage/markierung | `NachfrageController@unmark` | Pest: 2 Aufrufe |
| 199 | Kunden & Nachfrage | POST /admin/nachrichten/{message}/gelesen | `NachrichtenController@markRead` | Pest: 2 Aufrufe |
| 200 | Inhalte | POST /admin/navigation | `NavigationController@store` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-22, w-t7-23, w-t7-24, w-t7-25 (+1) · Pest: 4 Aufrufe |
| 201 | Inhalte | PUT /admin/navigation/reihenfolge | `NavigationController@reorder` | Pest: 6 Aufrufe |
| 202 | Inhalte | PUT /admin/navigation/{item} | `NavigationController@update` | Pest: 14 Aufrufe |
| 203 | Inhalte | DELETE /admin/navigation/{item} | `NavigationController@destroy` | Pest: 8 Aufrufe |
| 204 | Inhalte | PATCH /admin/navigation/{item}/sichtbarkeit | `NavigationController@visibility` | Pest: 3 Aufrufe |
| 205 | Konto & Rahmen | PUT /admin/profil/passwort | `AdminProfileController@updatePassword` | Pest: 11 Aufrufe |
| 206 | Katalog | POST /admin/reifen | `ReifenController@store` | Browser 1440 + 1024: ohne Fehler · Pest: 23 Aufrufe |
| 207 | Katalog | PUT /admin/reifen/{tyre} | `ReifenController@update` | Browser 1440 + 1024: ohne Fehler · Gang w-t4-3, w-t7-3, w-t7-4 · Pest: 11 Aufrufe |
| 208 | Katalog | DELETE /admin/reifen/{tyre} | `ReifenController@destroy` | Browser 1440 + 1024: ohne Fehler · Gang w-t4-3, w-t7-3, w-t7-4 · Pest: 3 Aufrufe |
| 209 | Review-Board | POST /admin/review/rueckmeldungen | `ReviewController@store` | Browser 1440 + 1024: ohne Fehler · Pest: 8 Aufrufe |
| 210 | Review-Board | PATCH /admin/review/rueckmeldungen/{feedback} | `ReviewController@update` | Pest: 5 Aufrufe |
| 211 | Team & Protokoll | POST /admin/rollen | `RollenController@store` | Browser 1440 + 1024: ohne Fehler · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a, v-forms-b (+5) · Pest: 8 Aufrufe |
| 212 | Team & Protokoll | PATCH /admin/rollen/{role} | `RollenController@update` | Pest: 9 Aufrufe |
| 213 | Team & Protokoll | DELETE /admin/rollen/{role} | `RollenController@destroy` | Pest: 8 Aufrufe |
| 214 | Team & Protokoll | POST /admin/rollen/{role}/duplizieren | `RollenController@duplicate` | Pest: 4 Aufrufe |
| 215 | Team & Protokoll | PATCH /admin/rollen/{role}/rechte | `RollenController@updatePermission` | Pest: 22 Aufrufe |
| 216 | Team & Protokoll | PUT /admin/rollen/{role}/rechte | `RollenController@replacePermissions` | Pest: 16 Aufrufe |
| 217 | Verkauf | POST /admin/rueckbuchungen/{dispute}/nachweise | `RueckbuchungenController@evidence` | Pest: 2 Aufrufe |
| 218 | Inhalte | POST /admin/seiten | `SeitenController@store` | Browser 1440 + 1024: ohne Fehler · Gang v-38-lists, w-l-1, w-t5-1 · Pest: 5 Aufrufe |
| 219 | Inhalte | POST /admin/seiten/{page}/bild | `SeitenController@image` | Pest: 5 Aufrufe |
| 220 | Inhalte | PUT /admin/seiten/{page}/entwurf | `SeitenController@saveDraft` | Pest: 13 Aufrufe |
| 221 | Inhalte | DELETE /admin/seiten/{page}/entwurf | `SeitenController@discardDraft` | Pest: 4 Aufrufe |
| 222 | Inhalte | POST /admin/seiten/{page}/platzhalter | `SeitenController@placeholder` | Pest: 9 Aufrufe |
| 223 | Inhalte | POST /admin/seiten/{page}/veroeffentlichen | `SeitenController@publish` | Pest: 59 Aufrufe |
| 224 | Inhalte | POST /admin/seiten/{page}/versionen/{revision} | `SeitenController@restore` | Pest: 3 Aufrufe |
| 225 | Inhalte | POST /admin/seiten/{page}/zurueckziehen | `SeitenController@withdraw` | Pest: 5 Aufrufe |
| 226 | System | POST /admin/system/zuruecksetzen | `ZuruecksetzenController@store` | Browser 1440 + 1024: ohne Fehler · Pest: 16 Aufrufe |
| 227 | System | POST /admin/system/zuruecksetzen/rueckgaengig | `ZuruecksetzenController@undo` | Pest: 11 Aufrufe |
| 228 | Uploads | POST /admin/uploads/pdf | `UploadController@presign` | Pest: 3 Aufrufe |
| 229 | Uploads | POST /admin/uploads/pdf/lokal/{name} | `UploadController@local` | Pest: 2 Aufrufe |
| 230 | Katalog | POST /admin/zubehoerpreise/rdks | `RdksPreiseController@store` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-31, w-t7-33, w-t7-34, w-t7-35 · Pest: 21 Aufrufe |
| 231 | Katalog | PUT /admin/zubehoerpreise/rdks/standard | `RdksPreiseController@updateDefaultPrice` | Pest: 4 Aufrufe |
| 232 | Katalog | PATCH /admin/zubehoerpreise/rdks/{price} | `RdksPreiseController@update` | Pest: 13 Aufrufe |
| 233 | Katalog | DELETE /admin/zubehoerpreise/rdks/{price} | `RdksPreiseController@destroy` | Pest: 11 Aufrufe |
| 234 | Katalog | POST /admin/zubehoerpreise/wuchtgewichte | `WuchtgewichteController@store` | Browser 1440 + 1024: ohne Fehler · Gang w-t7-31, w-t7-32 · Pest: 27 Aufrufe |
| 235 | Katalog | PUT /admin/zubehoerpreise/wuchtgewichte/montage | `WuchtgewichteController@updateMountingFee` | Pest: 6 Aufrufe |
| 236 | Katalog | PATCH /admin/zubehoerpreise/wuchtgewichte/{colour} | `WuchtgewichteController@update` | Pest: 13 Aufrufe |
| 237 | Katalog | DELETE /admin/zubehoerpreise/wuchtgewichte/{colour} | `WuchtgewichteController@destroy` | Pest: 13 Aufrufe |

### Weiterleitungen (1)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 238 | Katalog | GET\|POST\|PUT\|PATCH\|DELETE\|OPTIONS /admin/zubehoerpreise | `Illuminate\Routing\RedirectController` | Browser 1440 + 1024: ohne Fehler · Pest: 6 Aufrufe |

### Daten- und Dateiantworten (12)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 239 | Konto & Rahmen | GET /admin/benachrichtigungen/neueste | `BenachrichtigungenController@latest` | Pest: 2 Aufrufe |
| 240 | Verkauf | GET /admin/bestellungen/export | `BestellungenController@export` | Pest: 11 Aufrufe |
| 241 | Fahrzeuge | GET /admin/fahrzeuge/import/beispiel.csv | `FahrzeugImportController@sample` | e2e t3b lädt die Beispieldatei (415 Bytes, mit Kopfzeile; t3b.jsonl); ImportRun.test.ts |
| 242 | Fahrzeuge | GET /admin/gutachten/suche/fahrzeuge | `GutachtenZeilenController@vehicles` | Pest: 12 Aufrufe |
| 243 | Katalog | GET /admin/gutachten/suche/felgen | `GutachtenZeilenController@wheels` | Pest: 1 Aufrufe |
| 244 | Katalog | GET /admin/katalog/import/beispiel.csv | `KatalogImportController@sample` | Pest: 1 Aufrufe |
| 245 | Katalog | GET /admin/katalog/import/{import}/abgelehnt.csv | `KatalogImportController@refused` | Pest: 2 Aufrufe |
| 246 | Team & Protokoll | GET /admin/protokoll/export | `ProtokollController@export` | Pest: 6 Aufrufe |
| 247 | Review-Board | GET /admin/review/rueckmeldungen/{feedback}/bild | `ReviewController@image` | Pest: 1 Aufrufe |
| 248 | Inhalte | GET /admin/seiten/{page}/versionen/{revision}/vergleich | `SeitenController@compare` | Pest: 3 Aufrufe |
| 249 | System | GET /admin/system/puls | `SystemController@pulse` | Pest: 2 Aufrufe |
| 250 | Übersicht | GET /admin/uebersicht/export | `UebersichtController@export` | Pest: 2 Aufrufe |

### Formulare (73)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 251 | Kunden & Nachfrage | Formular runSearch | `resources/js/Pages/Admin/Anfragen/Index.vue:98` | Seite /admin/anfragen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-38-lists · Vitest: Index.test.ts |
| 252 | Konto & Rahmen | Formular login__fields | `resources/js/Pages/Admin/Anmelden/Index.vue:63` | Seite /admin/anmelden ohne Fehler geöffnet · Gang v-12-bestaetigen, w-f-3 |
| 253 | Konto & Rahmen | Formular submit | `resources/js/Pages/Admin/Anmelden/Index.vue:84` | Seite /admin/anmelden ohne Fehler geöffnet · Gang v-12-bestaetigen, w-f-3 |
| 254 | Team & Protokoll | Formular bn-invite | `resources/js/Pages/Admin/Benutzer/Index.vue:365` | Seite /admin/benutzer ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+7) |
| 255 | Team & Protokoll | Formular bn-role | `resources/js/Pages/Admin/Benutzer/Index.vue:432` | Seite /admin/benutzer ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+7) |
| 256 | Konto & Rahmen | Formular confirm | `resources/js/Pages/Admin/Bestaetigen/Index.vue:28` | Seite /admin/bestaetigen ohne Fehler geöffnet · Gang v-12-bestaetigen · Vitest: Index.test.ts |
| 257 | Verkauf | Formular apply | `resources/js/Pages/Admin/Bestellungen/Index.vue:281` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 258 | Verkauf | Formular Bestellungen filtern | `resources/js/Pages/Admin/Bestellungen/Index.vue:297` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 259 | Verkauf | Formular Bestellungen filtern | `resources/js/Pages/Admin/Bestellungen/Index.vue:324` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 260 | Verkauf | Formular ship | `resources/js/Pages/Admin/Bestellungen/Show.vue:310` | Seite /admin/bestellungen/{id} ohne Fehler geöffnet · Gang v-fehlerseite, w-t6-2, w-t6-3 (+3) · Vitest: Show.test.ts |
| 261 | Verkauf | Formular askRefund | `resources/js/Pages/Admin/Bestellungen/Show.vue:458` | Seite /admin/bestellungen/{id} ohne Fehler geöffnet · Gang v-fehlerseite, w-t6-2, w-t6-3 (+3) · Vitest: Show.test.ts |
| 262 | Verkauf | Formular apply | `resources/js/Pages/Admin/Bewertungen/Index.vue:125` | Seite /admin/bewertungen ohne Fehler geöffnet · Gang w-t8-4, w-t8-6 |
| 263 | Verkauf | Formular hide(item) | `resources/js/Pages/Admin/Bewertungen/Index.vue:173` | Seite /admin/bewertungen ohne Fehler geöffnet · Gang w-t8-4, w-t8-6 |
| 264 | Verkauf | Formular reply(item) | `resources/js/Pages/Admin/Bewertungen/Index.vue:192` | Seite /admin/bewertungen ohne Fehler geöffnet · Gang w-t8-4, w-t8-6 |
| 265 | Team & Protokoll | Formular submit | `resources/js/Pages/Admin/Einladung/Index.vue:102` | Gang w-t9-2, w-t9-3, w-t9-4 (Einladung über ihren Link angenommen, im Protokoll); EinladungTest (die Länge vor der Wiederholung, F-29) |
| 266 | Einstellungen | Formular editor.save | `resources/js/Pages/Admin/Einstellungen/Email.vue:139` | Seite /admin/einstellungen/e-mail ohne Fehler geöffnet · Gang v-1024-neu, v-24-email, w-t7-37 (+4) · Vitest: Email.test.ts |
| 267 | Einstellungen | Formular editor.save | `resources/js/Pages/Admin/Einstellungen/Speicher.vue:99` | Seite /admin/einstellungen/speicher ohne Fehler geöffnet |
| 268 | Einstellungen | Formular editor.save | `resources/js/Pages/Admin/Einstellungen/VerkaeuferVersand.vue:126` | Seite /admin/einstellungen/verkaeufer-versand ohne Fehler geöffnet · Gang w-t8-3 · Vitest: VerkaeuferVersand.test.ts |
| 269 | Einstellungen | Formular editor.save | `resources/js/Pages/Admin/Einstellungen/Zahlung.vue:115` | Seite /admin/einstellungen/zahlung ohne Fehler geöffnet · Gang v-12-bestaetigen |
| 270 | Einstellungen | Formular openSeries | `resources/js/Pages/Admin/Einstellungen/Zahlung.vue:196` | Seite /admin/einstellungen/zahlung ohne Fehler geöffnet · Gang v-12-bestaetigen |
| 271 | Fahrzeuge | Formular save | `resources/js/Pages/Admin/Fahrzeuge/IdentityForm.vue:57` | Seite /admin/fahrzeuge/{id} ohne Fehler geöffnet · Gang v-1024-neu, v-17-korrektur, v-37-cut (+4) |
| 272 | Fahrzeuge | Formular submit | `resources/js/Pages/Admin/Fahrzeuge/Import.vue:137` | Seite /admin/fahrzeuge/import ohne Fehler geöffnet · Gang v-38-lists, w-t3b-1 · Vitest: Import.test.ts |
| 273 | Fahrzeuge | Formular remap | `resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue:334` | Seite /admin/fahrzeuge/import/{id} ohne Fehler geöffnet · Vitest: ImportRun.test.ts |
| 274 | Fahrzeuge | Formular apply | `resources/js/Pages/Admin/Fahrzeuge/Index.vue:81` | Seite /admin/fahrzeuge/pruefung ohne Fehler geöffnet |
| 275 | Fahrzeuge | Formular submit | `resources/js/Pages/Admin/Fahrzeuge/Neu.vue:125` | Seite /admin/fahrzeuge/neu ohne Fehler geöffnet · Gang v-17-korrektur, v-forms-a, w-t3a-1 (+3) · Vitest: Neu.test.ts |
| 276 | Fahrzeuge | Formular save | `resources/js/Pages/Admin/Fahrzeuge/Show.vue:202` | Seite /admin/fahrzeuge/{id} ohne Fehler geöffnet · Gang v-1024-neu, v-17-korrektur, v-37-cut (+4) · Vitest: Show.test.ts |
| 277 | Inhalte | Formular faq-form | `resources/js/Pages/Admin/Faq/Index.vue:457` | Seite /admin/faq ohne Fehler geöffnet · Gang w-t7-22, w-t7-24 |
| 278 | Katalog | Formular editor.save | `resources/js/Pages/Admin/Felgen/Edit.vue:371` | Seite /admin/felgen/neu, /admin/felgen/{id} ohne Fehler geöffnet · Gang v-forms-d, w-t1-1, w-t1-2 (+10) · Vitest: Edit.test.ts |
| 279 | Katalog | Formular ohne Namen | `resources/js/Pages/Admin/Felgen/FinishPhotos.vue:535` | Seite /admin/felgen/neu, /admin/felgen/{id} ohne Fehler geöffnet · Gang v-forms-d, w-t1-1, w-t1-2 (+10) · Vitest: FinishPhotos.test.ts |
| 280 | Katalog | Formular apply | `resources/js/Pages/Admin/Felgen/Index.vue:313` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 281 | Katalog | Formular Felgen filtern | `resources/js/Pages/Admin/Felgen/Index.vue:319` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 282 | Katalog | Formular Felgen filtern | `resources/js/Pages/Admin/Felgen/Index.vue:375` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 283 | Gutachten | Formular confirmLimit(condition) | `resources/js/Pages/Admin/Gutachten/Auflagenverzeichnis.vue:464` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) · Vitest: Auflagenverzeichnis.test.ts |
| 284 | Gutachten | Formular save | `resources/js/Pages/Admin/Gutachten/CombinationsCard.vue:140` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) · Vitest: CombinationsCard.test.ts |
| 285 | Gutachten | Formular save | `resources/js/Pages/Admin/Gutachten/CountCard.vue:115` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) · Vitest: CountCard.test.ts |
| 286 | Gutachten | Formular save | `resources/js/Pages/Admin/Gutachten/DeratingTable.vue:137` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 287 | Gutachten | Formular add('fastener') | `resources/js/Pages/Admin/Gutachten/DocumentExtras.vue:204` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 288 | Gutachten | Formular add('notice') | `resources/js/Pages/Admin/Gutachten/DocumentExtras.vue:275` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 289 | Gutachten | Formular add('rework') | `resources/js/Pages/Admin/Gutachten/DocumentExtras.vue:342` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 290 | Gutachten | Formular fd-form | `resources/js/Pages/Admin/Gutachten/FactsDialog.vue:117` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 291 | Gutachten | Formular ohne Namen | `resources/js/Pages/Admin/Gutachten/Index.vue:124` | Seite /admin/gutachten ohne Fehler geöffnet · Vitest: Index.test.ts |
| 292 | Gutachten | Formular submit | `resources/js/Pages/Admin/Gutachten/Neu.vue:152` | Seite /admin/gutachten/neu ohne Fehler geöffnet · Gang v-1024-neu, v-forms-d, w-t2-1 (+3) |
| 293 | Gutachten | Formular rd-form | `resources/js/Pages/Admin/Gutachten/ReleaseDialog.vue:108` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 294 | Gutachten | Formular loadPreview | `resources/js/Pages/Admin/Gutachten/Show.vue:560` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 295 | Gutachten | Formular gs-edit-form | `resources/js/Pages/Admin/Gutachten/Show.vue:615` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 296 | Gutachten | Formular save | `resources/js/Pages/Admin/Gutachten/VehicleFromDocument.vue:107` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 297 | Katalog | Formular submit | `resources/js/Pages/Admin/Katalog/Import.vue:127` | Seite /admin/katalog/import ohne Fehler geöffnet · Gang w-t7-37, w-t7-38 |
| 298 | Katalog | Formular remap | `resources/js/Pages/Admin/Katalog/ImportRun.vue:239` | Seite /admin/katalog/import/{id} ohne Fehler geöffnet · Gang w-t7-39 |
| 299 | Gutachten | Formular decide(pair) | `resources/js/Pages/Admin/Konflikte/Index.vue:186` | Seite /admin/konflikte ohne Fehler geöffnet |
| 300 | Katalog | Formular submit | `resources/js/Pages/Admin/Marken/Index.vue:374` | Seite /admin/marken ohne Fehler geöffnet · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 |
| 301 | Katalog | Formular saveManufacturer | `resources/js/Pages/Admin/Marken/Index.vue:434` | Seite /admin/marken ohne Fehler geöffnet · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 |
| 302 | Katalog | Formular ohne Namen | `resources/js/Pages/Admin/Marken/Index.vue:506` | Seite /admin/marken ohne Fehler geöffnet · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 |
| 303 | Kunden & Nachfrage | Formular apply | `resources/js/Pages/Admin/Nachrichten/Index.vue:87` | Seite /admin/nachrichten ohne Fehler geöffnet · Gang v-nachrichten-suche · Vitest: Index.test.ts |
| 304 | Inhalte | Formular nav-form | `resources/js/Pages/Admin/Navigation/Index.vue:444` | Seite /admin/navigation ohne Fehler geöffnet · Gang w-t7-22, w-t7-23, w-t7-24 (+2) |
| 305 | Konto & Rahmen | Formular editor.save | `resources/js/Pages/Admin/Profil/Index.vue:45` | Seite /admin/profil ohne Fehler geöffnet · Gang v-forms-b, w-f-2 |
| 306 | Team & Protokoll | Formular Protokoll filtern | `resources/js/Pages/Admin/Protokoll/Index.vue:161` | Seite /admin/protokoll ohne Fehler geöffnet · Gang v-38-lists · Vitest: Index.test.ts |
| 307 | Team & Protokoll | Formular Protokoll filtern | `resources/js/Pages/Admin/Protokoll/Index.vue:181` | Seite /admin/protokoll ohne Fehler geöffnet · Gang v-38-lists · Vitest: Index.test.ts |
| 308 | Katalog | Formular saveDefault | `resources/js/Pages/Admin/Rdks/Index.vue:207` | Seite /admin/zubehoerpreise/rdks ohne Fehler geöffnet · Gang w-t7-31, w-t7-33, w-t7-34 (+1) · Vitest: Index.test.ts |
| 309 | Katalog | Formular submit | `resources/js/Pages/Admin/Rdks/Index.vue:236` | Seite /admin/zubehoerpreise/rdks ohne Fehler geöffnet · Gang w-t7-31, w-t7-33, w-t7-34 (+1) · Vitest: Index.test.ts |
| 310 | Katalog | Formular editor.save | `resources/js/Pages/Admin/Reifen/Edit.vue:224` | Seite /admin/reifen/neu, /admin/reifen/{id} ohne Fehler geöffnet · Gang v-forms-d, v-forms-e, w-t4-1 (+5) · Vitest: Edit.test.ts |
| 311 | Katalog | Formular apply | `resources/js/Pages/Admin/Reifen/Index.vue:105` | Seite /admin/reifen ohne Fehler geöffnet |
| 312 | Review-Board | Formular apply | `resources/js/Pages/Admin/Review/Feedback.vue:151` | Seite /admin/review/rueckmeldungen ohne Fehler geöffnet |
| 313 | Review-Board | Formular save(item) | `resources/js/Pages/Admin/Review/Feedback.vue:205` | Seite /admin/review/rueckmeldungen ohne Fehler geöffnet |
| 314 | Team & Protokoll | Formular rol-create | `resources/js/Pages/Admin/Rollen/Index.vue:591` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 315 | Team & Protokoll | Formular rol-rename | `resources/js/Pages/Admin/Rollen/Index.vue:628` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 316 | Verkauf | Formular confirmOpen = true | `resources/js/Pages/Admin/Rueckbuchungen/Index.vue:135` | Seite /admin/rueckbuchungen ohne Fehler geöffnet · Vitest: Index.test.ts |
| 317 | Inhalte | Formular sn-create | `resources/js/Pages/Admin/Seiten/Index.vue:143` | Seite /admin/seiten ohne Fehler geöffnet · Gang v-38-lists, w-l-1, w-t5-1 |
| 318 | System | Formular ask | `resources/js/Pages/Admin/System/Zuruecksetzen.vue:155` | Seite /admin/system/zuruecksetzen ohne Fehler geöffnet · Vitest: Zuruecksetzen.test.ts |
| 319 | Katalog | Formular saveMounting | `resources/js/Pages/Admin/Wuchtgewichte/Index.vue:217` | Seite /admin/zubehoerpreise/wuchtgewichte ohne Fehler geöffnet · Gang w-t7-31, w-t7-32 · Vitest: Index.test.ts |
| 320 | Katalog | Formular submit | `resources/js/Pages/Admin/Wuchtgewichte/Index.vue:246` | Seite /admin/zubehoerpreise/wuchtgewichte ohne Fehler geöffnet · Gang w-t7-31, w-t7-32 · Vitest: Index.test.ts |
| 321 | Sonstiges | Formular applyCustom | `resources/js/Components/Admin/Dashboard/PeriodSwitcher.vue:168` | Seite /admin/nachfrage, /admin ohne Fehler geöffnet · Gang v-dialoge, v-01-uebersicht, v-fehlerseite (+2) · Vitest: PeriodSwitcher.test.ts |
| 322 | Sonstiges | Formular send | `resources/js/Components/Admin/FeedbackDialog.vue:150` | Gang v-dialoge (Taste R); e2e review-01; ReviewKitTest (Speichern, PNG geprüft, Ablehnung auf Deutsch) |
| 323 | Sonstiges | Formular sv-form | `resources/js/Components/Admin/Lists/SaveViewDialog.vue:138` | Seite /admin/bestellungen, /admin/felgen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 (+3) |

### Tabellen und Listen (43)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 324 | Gutachten | Tabelle <table class="adm-table ab__table"> | `resources/js/Pages/Admin/Abdeckung/Index.vue:103` | Seite /admin/abdeckung ohne Fehler geöffnet |
| 325 | Kunden & Nachfrage | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Anfragen/Index.vue:72` | Seite /admin/anfragen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-38-lists · Vitest: Index.test.ts |
| 326 | Kunden & Nachfrage | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Anfragen/Index.vue:111` | Seite /admin/anfragen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-38-lists · Vitest: Index.test.ts |
| 327 | Gutachten | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Auflagen/Index.vue:89` | Seite /admin/auflagen ohne Fehler geöffnet · Gang v-forms-a, w-l-1 |
| 328 | Konto & Rahmen | Tabelle <table class="adm-table bn-prefs__table" :aria-busy="saving ? 'true' : undefined"> | `resources/js/Pages/Admin/Benachrichtigungen/Index.vue:284` | Vitest: Index.test.ts |
| 329 | Team & Protokoll | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Benutzer/Index.vue:255` | Seite /admin/benutzer ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+7) |
| 330 | Verkauf | Tabelle <table class="adm-table ob-table"> | `resources/js/Pages/Admin/Bestellungen/Index.vue:359` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 331 | Einstellungen | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Einstellungen/Email.vue:214` | Seite /admin/einstellungen/e-mail ohne Fehler geöffnet · Gang v-1024-neu, v-24-email, w-t7-37 (+4) · Vitest: Email.test.ts |
| 332 | Einstellungen | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Einstellungen/Email.vue:266` | Seite /admin/einstellungen/e-mail ohne Fehler geöffnet · Gang v-1024-neu, v-24-email, w-t7-37 (+4) · Vitest: Email.test.ts |
| 333 | Einstellungen | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Einstellungen/Speicher.vue:207` | Seite /admin/einstellungen/speicher ohne Fehler geöffnet |
| 334 | Fahrzeuge | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Fahrzeuge/Import.vue:171` | Seite /admin/fahrzeuge/import ohne Fehler geöffnet · Gang v-38-lists, w-t3b-1 · Vitest: Import.test.ts |
| 335 | Fahrzeuge | Tabelle <table class="adm-table" aria-labelledby="fr-h-gaps"> | `resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue:255` | Seite /admin/fahrzeuge/import/{id} ohne Fehler geöffnet · Vitest: ImportRun.test.ts |
| 336 | Fahrzeuge | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue:296` | Seite /admin/fahrzeuge/import/{id} ohne Fehler geöffnet · Vitest: ImportRun.test.ts |
| 337 | Fahrzeuge | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue:336` | Seite /admin/fahrzeuge/import/{id} ohne Fehler geöffnet · Vitest: ImportRun.test.ts |
| 338 | Fahrzeuge | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Fahrzeuge/Index.vue:103` | Seite /admin/fahrzeuge/pruefung ohne Fehler geöffnet |
| 339 | Fahrzeuge | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Fahrzeuge/Show.vue:262` | Seite /admin/fahrzeuge/{id} ohne Fehler geöffnet · Gang v-1024-neu, v-17-korrektur, v-37-cut (+4) · Vitest: Show.test.ts |
| 340 | Katalog | Tabelle <table class="adm-table fg-table"> | `resources/js/Pages/Admin/Felgen/Index.vue:454` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 341 | Katalog | Tabelle <table class="adm-table fe-sizes__table"> | `resources/js/Pages/Admin/Felgen/SizesTable.vue:65` | Seite /admin/felgen/neu, /admin/felgen/{id} ohne Fehler geöffnet · Gang v-forms-d, w-t1-1, w-t1-2 (+10) |
| 342 | Gutachten | Tabelle <table class="adm-table av__table"> | `resources/js/Pages/Admin/Gutachten/Auflagenverzeichnis.vue:367` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) · Vitest: Auflagenverzeichnis.test.ts |
| 343 | Gutachten | Tabelle <table class="adm-table kb-table"> | `resources/js/Pages/Admin/Gutachten/CombinationsCard.vue:112` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) · Vitest: CombinationsCard.test.ts |
| 344 | Gutachten | Tabelle <table class="kb-grid"> | `resources/js/Pages/Admin/Gutachten/CombinationsCard.vue:163` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) · Vitest: CombinationsCard.test.ts |
| 345 | Gutachten | Tabelle <table class="adm-table dt-table"> | `resources/js/Pages/Admin/Gutachten/DeratingTable.vue:107` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 346 | Gutachten | Tabelle <table class="dt-grid"> | `resources/js/Pages/Admin/Gutachten/DeratingTable.vue:160` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 347 | Gutachten | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Gutachten/DocumentExtras.vue:155` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 348 | Gutachten | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Gutachten/DocumentExtras.vue:297` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 349 | Gutachten | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Gutachten/Index.vue:167` | Seite /admin/gutachten ohne Fehler geöffnet · Vitest: Index.test.ts |
| 350 | Gutachten | Tabelle <table class="adm-table gs-table"> | `resources/js/Pages/Admin/Gutachten/Show.vue:493` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 351 | Katalog | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Katalog/Import.vue:181` | Seite /admin/katalog/import ohne Fehler geöffnet · Gang w-t7-37, w-t7-38 |
| 352 | Katalog | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Katalog/ImportRun.vue:188` | Seite /admin/katalog/import/{id} ohne Fehler geöffnet · Gang w-t7-39 |
| 353 | Katalog | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Katalog/ImportRun.vue:241` | Seite /admin/katalog/import/{id} ohne Fehler geöffnet · Gang w-t7-39 |
| 354 | Gutachten | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Konflikte/Index.vue:224` | Seite /admin/konflikte ohne Fehler geöffnet |
| 355 | Katalog | Tabelle <table class="adm-table mk__table"> | `resources/js/Pages/Admin/Marken/Index.vue:515` | Seite /admin/marken ohne Fehler geöffnet · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 |
| 356 | Kunden & Nachfrage | Tabelle <table ref="table" class="adm-table nf__table"> | `resources/js/Pages/Admin/Nachfrage/Index.vue:200` | Seite /admin/nachfrage ohne Fehler geöffnet · Gang v-dialoge · Vitest: Index.test.ts |
| 357 | Kunden & Nachfrage | Tabelle <table class="adm-table nf__table"> | `resources/js/Pages/Admin/Nachfrage/Index.vue:303` | Seite /admin/nachfrage ohne Fehler geöffnet · Gang v-dialoge · Vitest: Index.test.ts |
| 358 | Katalog | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Rdks/Index.vue:304` | Seite /admin/zubehoerpreise/rdks ohne Fehler geöffnet · Gang w-t7-31, w-t7-33, w-t7-34 (+1) · Vitest: Index.test.ts |
| 359 | Katalog | Tabelle <table class="adm-table"> | `resources/js/Pages/Admin/Reifen/Index.vue:153` | Seite /admin/reifen ohne Fehler geöffnet |
| 360 | Team & Protokoll | Tabelle <table class="rol__table"> | `resources/js/Pages/Admin/Rollen/Index.vue:469` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 361 | Inhalte | Tabelle <table class="pg-grid__table" :aria-labelledby="`${id}-label`" :style="{ '--pg-grid-column | `resources/js/Pages/Admin/Seiten/GridField.vue:150` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: GridField.test.ts |
| 362 | Inhalte | Tabelle <table class="adm-table sn__table"> | `resources/js/Pages/Admin/Seiten/Index.vue:100` | Seite /admin/seiten ohne Fehler geöffnet · Gang v-38-lists, w-l-1, w-t5-1 |
| 363 | Katalog | Tabelle <table class="adm-table wg__table"> | `resources/js/Pages/Admin/Wuchtgewichte/Index.vue:351` | Seite /admin/zubehoerpreise/wuchtgewichte ohne Fehler geöffnet · Gang w-t7-31, w-t7-32 · Vitest: Index.test.ts |
| 364 | Sonstiges | Tabelle <table class="ct"> | `resources/js/Components/Admin/Charts/ChartTable.vue:13` | Seite /admin ohne Fehler geöffnet · Gang v-01-uebersicht, v-dialoge, v-fehlerseite (+2) |
| 365 | Sonstiges | Tabelle <table class="cm__table"> | `resources/js/Components/Admin/Dashboard/CoverageMatrix.vue:106` | Seite /admin/abdeckung, /admin ohne Fehler geöffnet · Gang v-01-uebersicht, v-dialoge, v-fehlerseite (+2) · Vitest: CoverageMatrix.test.ts |
| 366 | Sonstiges | Tabelle <table class="dt"> | `resources/js/Components/Admin/Dashboard/RecentOrders.vue:22` | Seite /admin ohne Fehler geöffnet · Gang v-01-uebersicht, v-dialoge, v-fehlerseite (+2) |

### Filter und Suche (17)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 367 | Kunden & Nachfrage | Suche type="search" | `resources/js/Pages/Admin/Anfragen/Index.vue:101` | Seite /admin/anfragen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-38-lists · Vitest: Index.test.ts |
| 368 | Verkauf | Filter FilterFields | `resources/js/Pages/Admin/Bestellungen/Index.vue:335` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 369 | Verkauf | Suche type="search" | `resources/js/Pages/Admin/Bestellungen/Index.vue:287` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 370 | Verkauf | Suche type="search" | `resources/js/Pages/Admin/Bewertungen/Index.vue:128` | Seite /admin/bewertungen ohne Fehler geöffnet · Gang w-t8-4, w-t8-6 |
| 371 | Einstellungen | Suche type="search" | `resources/js/Pages/Admin/Einstellungen/Email.vue:258` | Seite /admin/einstellungen/e-mail ohne Fehler geöffnet · Gang v-1024-neu, v-24-email, w-t7-37 (+4) · Vitest: Email.test.ts |
| 372 | Fahrzeuge | Suche type="search" | `resources/js/Pages/Admin/Fahrzeuge/Index.vue:83` | Seite /admin/fahrzeuge/pruefung ohne Fehler geöffnet |
| 373 | Katalog | Suche type="search" | `resources/js/Pages/Admin/Felgen/Index.vue:315` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 374 | Gutachten | Suche type="search" | `resources/js/Pages/Admin/Gutachten/Index.vue:127` | Seite /admin/gutachten ohne Fehler geöffnet · Vitest: Index.test.ts |
| 375 | Gutachten | Suche type="search" | `resources/js/Pages/Admin/Gutachten/RowComposer.vue:313` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 376 | Katalog | Suche type="search" | `resources/js/Pages/Admin/Marken/Index.vue:509` | Seite /admin/marken ohne Fehler geöffnet · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 |
| 377 | Kunden & Nachfrage | Suche type="search" | `resources/js/Pages/Admin/Nachrichten/Index.vue:90` | Seite /admin/nachrichten ohne Fehler geöffnet · Gang v-nachrichten-suche · Vitest: Index.test.ts |
| 378 | Team & Protokoll | Filter FilterFields | `resources/js/Pages/Admin/Protokoll/Index.vue:182` | Seite /admin/protokoll ohne Fehler geöffnet · Gang v-38-lists · Vitest: Index.test.ts |
| 379 | Katalog | Suche type="search" | `resources/js/Pages/Admin/Reifen/Index.vue:108` | Seite /admin/reifen ohne Fehler geöffnet |
| 380 | Team & Protokoll | Suche type="search" | `resources/js/Pages/Admin/Rollen/Index.vue:462` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 381 | Sonstiges | Suche aria-label="Suche öffnen" | `resources/js/Components/Admin/AdminRailFoot.vue:197` | Vitest: AdminRailFoot.test.ts |
| 382 | Sonstiges | Suche aria-label="Suche öffnen" | `resources/js/Components/Admin/AdminTopbar.vue:69` | Vitest: AdminTopbar.test.ts |
| 383 | Sonstiges | Suche type="search" | `resources/js/Components/Admin/DocumentSelect.vue:54` | Seite /admin/gutachten/{id}, /admin/gutachten/neu ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+36) · Vitest: DocumentSelect.test.ts |

### Sammelaktionen (3)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 384 | Katalog | Sammelaktion „Veröffentlichen“ (publish) | `resources/js/Pages/Admin/Felgen/Index.vue:235` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 385 | Katalog | Sammelaktion „Zurückziehen“ (unpublish) | `resources/js/Pages/Admin/Felgen/Index.vue:239` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 386 | Katalog | Sammelaktion „Archivieren“ (archive) | `resources/js/Pages/Admin/Felgen/Index.vue:244` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |

### Importe (2)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 387 | Katalog | Katalog-Import: Datei, Probelauf, Zuordnung, Importieren, Abgelehnte als CSV, Zurücknehmen | `KatalogImportController` | KatalogImportTest; Gang w-t7-37, w-t7-38, w-t7-39 (katalog-audit.csv: leere und unlesbare Zellen, F-23) |
| 388 | Fahrzeuge | Fahrzeug-Import: Datei, Probelauf mit Lücken und Unplausiblem, Zuordnung, Importieren | `FahrzeugImportController` | VehicleImportTest; e2e t3b (die Demodatei durch den Probelauf); Gang w-t3b-1 |

### Exporte (6)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 389 | Verkauf | Export :href="exportUrls.xlsx" | `resources/js/Pages/Admin/Bestellungen/Index.vue:346` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 390 | Verkauf | Export :href="exportUrls.csv" | `resources/js/Pages/Admin/Bestellungen/Index.vue:347` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 391 | Fahrzeuge | Export href="/admin/fahrzeuge/import/beispiel.csv" | `resources/js/Pages/Admin/Fahrzeuge/Import.vue:117` | Seite /admin/fahrzeuge/import ohne Fehler geöffnet · Gang v-38-lists, w-t3b-1 · Vitest: Import.test.ts |
| 392 | Katalog | Export href="/admin/katalog/import/beispiel.csv" | `resources/js/Pages/Admin/Katalog/Import.vue:110` | Seite /admin/katalog/import ohne Fehler geöffnet · Gang w-t7-37, w-t7-38 |
| 393 | Team & Protokoll | Export :href="exportUrl" | `resources/js/Pages/Admin/Protokoll/Index.vue:185` | Seite /admin/protokoll ohne Fehler geöffnet · Gang v-38-lists · Vitest: Index.test.ts |
| 394 | Sonstiges | Export :href="exportUrl" | `resources/js/Components/Admin/Dashboard/PeriodSwitcher.vue:198` | Seite /admin/nachfrage, /admin ohne Fehler geöffnet · Gang v-dialoge, v-01-uebersicht, v-fehlerseite (+2) · Vitest: PeriodSwitcher.test.ts |

### Uploads (12)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 395 | Fahrzeuge | Upload <FilePick | `resources/js/Pages/Admin/Fahrzeuge/Import.vue:140` | Seite /admin/fahrzeuge/import ohne Fehler geöffnet · Gang v-38-lists, w-t3b-1 · Vitest: Import.test.ts |
| 396 | Katalog | Upload <FinishPhotos | `resources/js/Pages/Admin/Felgen/Edit.vue:505` | Seite /admin/felgen/neu, /admin/felgen/{id} ohne Fehler geöffnet · Gang v-forms-d, w-t1-1, w-t1-2 (+10) · Vitest: Edit.test.ts |
| 397 | Katalog | Upload <FilePick | `resources/js/Pages/Admin/Felgen/FinishPhotos.vue:540` | Seite /admin/felgen/neu, /admin/felgen/{id} ohne Fehler geöffnet · Gang v-forms-d, w-t1-1, w-t1-2 (+10) · Vitest: FinishPhotos.test.ts |
| 398 | Gutachten | Upload <FilePick | `resources/js/Pages/Admin/Gutachten/FactsDialog.vue:162` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 399 | Gutachten | Upload <FilePick | `resources/js/Pages/Admin/Gutachten/Neu.vue:157` | Seite /admin/gutachten/neu ohne Fehler geöffnet · Gang v-1024-neu, v-forms-d, w-t2-1 (+3) |
| 400 | Katalog | Upload <FilePick | `resources/js/Pages/Admin/Katalog/Import.vue:130` | Seite /admin/katalog/import ohne Fehler geöffnet · Gang w-t7-37, w-t7-38 |
| 401 | Katalog | Upload type="file" | `resources/js/Pages/Admin/Marken/Index.vue:561` | Seite /admin/marken ohne Fehler geöffnet · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 |
| 402 | Verkauf | Upload <FilePick | `resources/js/Pages/Admin/Rueckbuchungen/Index.vue:143` | Seite /admin/rueckbuchungen ohne Fehler geöffnet · Vitest: Index.test.ts |
| 403 | Verkauf | Upload <FilePick | `resources/js/Pages/Admin/Rueckbuchungen/Index.vue:147` | Seite /admin/rueckbuchungen ohne Fehler geöffnet · Vitest: Index.test.ts |
| 404 | Inhalte | Upload <ImageField | `resources/js/Pages/Admin/Seiten/Bearbeiten.vue:952` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: Bearbeiten.test.ts |
| 405 | Inhalte | Upload <FilePick | `resources/js/Pages/Admin/Seiten/ImageField.vue:142` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: ImageField.test.ts |
| 406 | Sonstiges | Upload type="file" | `resources/js/Components/Admin/FilePick.vue:120` | Seite /admin/fahrzeuge/import, /admin/felgen/neu (+6) ohne Fehler geöffnet · Gang v-38-lists, w-t3b-1, v-forms-d (+55) |

### Dialoge (57)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 407 | Team & Protokoll | Dialog „Person einladen“ | `resources/js/Pages/Admin/Benutzer/Index.vue:364` | Seite /admin/benutzer ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+7) |
| 408 | Team & Protokoll | Dialog (`Rolle von ${reroling?.name ?? ''} ändern`) | `resources/js/Pages/Admin/Benutzer/Index.vue:431` | Seite /admin/benutzer ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+7) |
| 409 | Team & Protokoll | Bestätigung (asking ? actionTitle(asking.action, asking.account) : '') | `resources/js/Pages/Admin/Benutzer/Index.vue:465` | Seite /admin/benutzer ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+7) |
| 410 | Team & Protokoll | Bestätigung (`Einladung an ${withdrawing?.email ?? ''} widerrufen?`) | `resources/js/Pages/Admin/Benutzer/Index.vue:474` | Seite /admin/benutzer ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+7) |
| 411 | Verkauf | Panel BottomSheet | `resources/js/Pages/Admin/Bestellungen/Index.vue:323` | Seite /admin/bestellungen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 · Vitest: Index.test.ts |
| 412 | Verkauf | Bestätigung (`${formatMoney(refundCents ?? 0)} erstatten?`) | `resources/js/Pages/Admin/Bestellungen/Show.vue:478` | Seite /admin/bestellungen/{id} ohne Fehler geöffnet · Gang v-fehlerseite, w-t6-2, w-t6-3 (+3) · Vitest: Show.test.ts |
| 413 | Einstellungen | Bestätigung (`Sperre für ${lifting?.email ?? ''} aufheben?`) | `resources/js/Pages/Admin/Einstellungen/Email.vue:293` | Seite /admin/einstellungen/e-mail ohne Fehler geöffnet · Gang v-1024-neu, v-24-email, w-t7-37 (+4) · Vitest: Email.test.ts |
| 414 | Fahrzeuge | Bestätigung (confirmText.title) | `resources/js/Pages/Admin/Fahrzeuge/ImportRun.vue:373` | Seite /admin/fahrzeuge/import/{id} ohne Fehler geöffnet · Vitest: ImportRun.test.ts |
| 415 | Fahrzeuge | Dialog (warning.title) | `resources/js/Pages/Admin/Fahrzeuge/Neu.vue:252` | Seite /admin/fahrzeuge/neu ohne Fehler geöffnet · Gang v-17-korrektur, v-forms-a, w-t3a-1 (+3) · Vitest: Neu.test.ts |
| 416 | Fahrzeuge | Bestätigung „Angabe entfernen?“ | `resources/js/Pages/Admin/Fahrzeuge/Show.vue:290` | Seite /admin/fahrzeuge/{id} ohne Fehler geöffnet · Gang v-1024-neu, v-17-korrektur, v-37-cut (+4) · Vitest: Show.test.ts |
| 417 | Inhalte | Dialog (title) | `resources/js/Pages/Admin/Faq/Index.vue:456` | Seite /admin/faq ohne Fehler geöffnet · Gang w-t7-22, w-t7-24 |
| 418 | Inhalte | Bestätigung (deleteTitle) | `resources/js/Pages/Admin/Faq/Index.vue:499` | Seite /admin/faq ohne Fehler geöffnet · Gang w-t7-22, w-t7-24 |
| 419 | Katalog | Bestätigung (step ? STEPS[step].title : '') | `resources/js/Pages/Admin/Felgen/Edit.vue:591` | Seite /admin/felgen/neu, /admin/felgen/{id} ohne Fehler geöffnet · Gang v-forms-d, w-t1-1, w-t1-2 (+10) · Vitest: Edit.test.ts |
| 420 | Katalog | Bestätigung (`Foto aus „${finishName}“ entfernen?`) | `resources/js/Pages/Admin/Felgen/FinishPhotos.vue:577` | Seite /admin/felgen/neu, /admin/felgen/{id} ohne Fehler geöffnet · Gang v-forms-d, w-t1-1, w-t1-2 (+10) · Vitest: FinishPhotos.test.ts |
| 421 | Katalog | Bestätigung (pending ? BULK[pending].title(felgen(selected.length)) : '') | `resources/js/Pages/Admin/Felgen/Index.vue:536` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 422 | Katalog | Panel BottomSheet | `resources/js/Pages/Admin/Felgen/Index.vue:374` | Seite /admin/felgen ohne Fehler geöffnet · Gang w-t7-39, w-t7-6, w-t7-7 |
| 423 | Gutachten | Bestätigung (`Code ${removing?.code ?? ''} entfernen?`) | `resources/js/Pages/Admin/Gutachten/Auflagenverzeichnis.vue:630` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) · Vitest: Auflagenverzeichnis.test.ts |
| 424 | Gutachten | Bestätigung (removing ? TITLE[removing.list] : '') | `resources/js/Pages/Admin/Gutachten/DocumentExtras.vue:388` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 425 | Gutachten | Dialog „Angaben ändern“ | `resources/js/Pages/Admin/Gutachten/FactsDialog.vue:116` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 426 | Gutachten | Dialog (mode === 'release' ? 'Gutachten freigeben' : 'Ist alles erfasst?') | `resources/js/Pages/Admin/Gutachten/ReleaseDialog.vue:100` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 427 | Gutachten | Dialog „Zeile ändern“ | `resources/js/Pages/Admin/Gutachten/Show.vue:613` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 428 | Gutachten | Bestätigung „Neue Fassung anlegen?“ | `resources/js/Pages/Admin/Gutachten/Show.vue:594` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 429 | Gutachten | Bestätigung „Zeile entfernen?“ | `resources/js/Pages/Admin/Gutachten/Show.vue:604` | Seite /admin/gutachten/{id} ohne Fehler geöffnet · Gang v-05-nurbei, v-1024-neu, v-22-ansicht (+31) |
| 430 | Katalog | Bestätigung (confirmText.title) | `resources/js/Pages/Admin/Katalog/ImportRun.vue:285` | Seite /admin/katalog/import/{id} ohne Fehler geöffnet · Gang w-t7-39 |
| 431 | Katalog | Bestätigung (`Marke „${confirming?.name ?? ''}“ entfernen?`) | `resources/js/Pages/Admin/Marken/Index.vue:616` | Seite /admin/marken ohne Fehler geöffnet · Gang v-25-zwei-tabs, w-t7-1, w-t7-2 |
| 432 | Kunden & Nachfrage | Dialog „Gutachten anfordern“ | `resources/js/Pages/Admin/Nachfrage/RequestDialog.vue:83` | Seite /admin/nachfrage ohne Fehler geöffnet · Gang v-dialoge · Gang v-dialoge (öffnet für die erste Lücke, Marken zur Wahl); e2e UEB-05, UEB-06, UEB-07 |
| 433 | Inhalte | Dialog (title) | `resources/js/Pages/Admin/Navigation/Index.vue:443` | Seite /admin/navigation ohne Fehler geöffnet · Gang w-t7-22, w-t7-23, w-t7-24 (+2) |
| 434 | Inhalte | Bestätigung (deleteTitle) | `resources/js/Pages/Admin/Navigation/Index.vue:516` | Seite /admin/navigation ohne Fehler geöffnet · Gang w-t7-22, w-t7-23, w-t7-24 (+2) |
| 435 | Team & Protokoll | Panel BottomSheet | `resources/js/Pages/Admin/Protokoll/Index.vue:180` | Seite /admin/protokoll ohne Fehler geöffnet · Gang v-38-lists · Vitest: Index.test.ts |
| 436 | Katalog | Bestätigung (`Preis für ${confirming?.makeLabelDe ?? ''} löschen?`) | `resources/js/Pages/Admin/Rdks/Index.vue:343` | Seite /admin/zubehoerpreise/rdks ohne Fehler geöffnet · Gang w-t7-31, w-t7-33, w-t7-34 (+1) · Vitest: Index.test.ts |
| 437 | Katalog | Bestätigung „Reifen entfernen?“ | `resources/js/Pages/Admin/Reifen/Edit.vue:415` | Seite /admin/reifen/neu, /admin/reifen/{id} ohne Fehler geöffnet · Gang v-forms-d, v-forms-e, w-t4-1 (+5) · Vitest: Edit.test.ts |
| 438 | Team & Protokoll | Dialog „Rolle anlegen“ | `resources/js/Pages/Admin/Rollen/Index.vue:590` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 439 | Team & Protokoll | Dialog (`Rechte für „${role?.label ?? ''}“ speichern?`) | `resources/js/Pages/Admin/Rollen/Index.vue:542` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 440 | Team & Protokoll | Dialog (`Rechte für „${role?.label ?? ''}“ kopieren`) | `resources/js/Pages/Admin/Rollen/Index.vue:550` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 441 | Team & Protokoll | Dialog (`Ansicht als „${role?.label ?? ''}“`) | `resources/js/Pages/Admin/Rollen/Index.vue:573` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 442 | Team & Protokoll | Dialog (role?.isSystem ? 'Beschreibung ändern' : 'Rolle umbenennen') | `resources/js/Pages/Admin/Rollen/Index.vue:627` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 443 | Team & Protokoll | Bestätigung (`Rolle „${role?.label ?? ''}“ löschen?`) | `resources/js/Pages/Admin/Rollen/Index.vue:658` | Seite /admin/rollen ohne Fehler geöffnet · Gang v-1024-neu, v-25-zwei-tabs, v-forms-a (+6) · Vitest: Index.test.ts |
| 444 | Verkauf | Bestätigung „Nachweise senden?“ | `resources/js/Pages/Admin/Rueckbuchungen/Index.vue:161` | Seite /admin/rueckbuchungen ohne Fehler geöffnet · Vitest: Index.test.ts |
| 445 | Inhalte | Dialog „Seite veröffentlichen?“ | `resources/js/Pages/Admin/Seiten/Bearbeiten.vue:1034` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: Bearbeiten.test.ts |
| 446 | Inhalte | Dialog (`Version vom ${shownRevision?.at ?? ''} laden?`) | `resources/js/Pages/Admin/Seiten/Bearbeiten.vue:1065` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: Bearbeiten.test.ts |
| 447 | Inhalte | Bestätigung „Entwurf verwerfen?“ | `resources/js/Pages/Admin/Seiten/Bearbeiten.vue:1083` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: Bearbeiten.test.ts |
| 448 | Inhalte | Bestätigung (switchCopy.title) | `resources/js/Pages/Admin/Seiten/Bearbeiten.vue:1096` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: Bearbeiten.test.ts |
| 449 | Inhalte | Bestätigung (`${page.title} zurückziehen?`) | `resources/js/Pages/Admin/Seiten/Bearbeiten.vue:1105` | Seite /admin/seiten/{id} ohne Fehler geöffnet · Gang w-f-1, w-t5-2, w-t5-3 (+2) · Vitest: Bearbeiten.test.ts |
| 450 | Inhalte | Dialog „Blog-Artikel anlegen“ | `resources/js/Pages/Admin/Seiten/Index.vue:142` | Seite /admin/seiten ohne Fehler geöffnet · Gang v-38-lists, w-l-1, w-t5-1 |
| 451 | System | Bestätigung (`${chosen?.label ?? ''} zurücksetzen`) | `resources/js/Pages/Admin/System/Zuruecksetzen.vue:199` | Seite /admin/system/zuruecksetzen ohne Fehler geöffnet · Vitest: Zuruecksetzen.test.ts |
| 452 | System | Bestätigung „Letztes Zurücksetzen rückgängig machen“ | `resources/js/Pages/Admin/System/Zuruecksetzen.vue:209` | Seite /admin/system/zuruecksetzen ohne Fehler geöffnet · Vitest: Zuruecksetzen.test.ts |
| 453 | Katalog | Bestätigung (`Farbe „${confirming?.nameDe ?? ''}“ löschen?`) | `resources/js/Pages/Admin/Wuchtgewichte/Index.vue:410` | Seite /admin/zubehoerpreise/wuchtgewichte ohne Fehler geöffnet · Gang w-t7-31, w-t7-32 · Vitest: Index.test.ts |
| 454 | Sonstiges | Dialog (title) | `resources/js/Components/Admin/AdminConfirm.vue:55` | Seite /admin/benutzer, /admin/bestellungen/{id} (+19) ohne Fehler geöffnet · Gang v-forms-b, v-forms-c, v-forms-d (+89) |
| 455 | Sonstiges | Dialog „Die Demodaten lassen sich gerade nicht entfernen“ | `resources/js/Components/Admin/AdminDemoBlocked.vue:21` | Gang v-telefon-mehr (390 px: sagt, warum, und den Weg über System › Zurücksetzen); e2e M1-05; Vitest: AdminRailFoot.test.ts |
| 456 | Sonstiges | Bestätigung „Demodaten entfernen“ | `resources/js/Components/Admin/AdminMoreSheet.vue:129` | Gang v-telefon-mehr (390 px: „Mehr“ mit Demodaten, Rückmeldung, Bereichen, „Neu anlegen“, Profil; ohne seitliches Scrollen); DemoStripTest; e2e M1-05 |
| 457 | Sonstiges | Panel BottomSheet | `resources/js/Components/Admin/AdminMoreSheet.vue:102` | Gang v-telefon-mehr (390 px: „Mehr“ mit Demodaten, Rückmeldung, Bereichen, „Neu anlegen“, Profil; ohne seitliches Scrollen); DemoStripTest; e2e M1-05 |
| 458 | Sonstiges | Panel BottomSheet | `resources/js/Components/Admin/AdminMoreSheet.vue:197` | Gang v-telefon-mehr (390 px: „Mehr“ mit Demodaten, Rückmeldung, Bereichen, „Neu anlegen“, Profil; ohne seitliches Scrollen); DemoStripTest; e2e M1-05 |
| 459 | Sonstiges | Bestätigung „Demodaten entfernen“ | `resources/js/Components/Admin/AdminRailFoot.vue:126` | Vitest: AdminRailFoot.test.ts |
| 460 | Sonstiges | Dialog „Änderungen nicht gespeichert“ | `resources/js/Components/Admin/AdminSaveBar.vue:75` | Seite /admin/einstellungen/e-mail, /admin/einstellungen/speicher (+9) ohne Fehler geöffnet · Gang v-1024-neu, v-24-email, w-t7-37 (+39) |
| 461 | Sonstiges | Dialog „Rückmeldung geben“ | `resources/js/Components/Admin/FeedbackDialog.vue:149` | Gang v-dialoge (Taste R: Art und Satz); e2e review-01; ReviewKitTest (die Rückmeldung mit Bildschirmfoto) |
| 462 | Sonstiges | Dialog (title) | `resources/js/Components/Admin/Lists/SaveViewDialog.vue:137` | Seite /admin/bestellungen, /admin/felgen ohne Fehler geöffnet · Gang v-22-ansicht, w-t6-1, w-t7-36 (+3) |
| 463 | Sonstiges | Dialog „Tastenkürzel“ | `resources/js/Components/Admin/ShortcutsDialog.vue:33` | Gang v-dialoge (Taste ?); Vitest: AdminTopbar.test.ts, AdminRailFoot.test.ts |

### E-Mails, die eine Admin-Handlung auslöst (8)

| # | Bereich | Was | Wo im Code | Ergebnis |
|---|---|---|---|---|
| 464 | E-Mail | AdminInvitationMail | `Team › Benutzer › Einladen / Erneut senden` | Mail geprüft: BenutzerTest (Einladen, Erneut senden), EinladungTest (Annehmen); Gang w-t9-* (verschickt und angenommen, im Protokoll) |
| 465 | E-Mail | RefundMail | `Verkauf › Bestellung › Erstattung` | Mail geprüft: RefundsAndDisputesTest; e2e t6 liest „Erstattung zu deiner Bestellung …“ aus dem Mail-Log |
| 466 | E-Mail | OrderShippedMail | `Verkauf › Bestellung › Als versendet markieren (neu, F-14)` | Mail geprüft: VersandmailTest (Text, Link, Sendungsnummer, Mail schlägt fehl); e2e t6 liest „Deine Bestellung … ist unterwegs“ (F-14) |
| 467 | E-Mail | ReviewInvitationMail | `Verkauf › Bestellung › Als zugestellt markieren (+7 Tage, rimify:bewertungen-einladen)` | Mail geprüft: ReviewsTest, VersandNachErstattungTest (auch nach Teilerstattung, F-15) |
| 468 | E-Mail | FitmentAvailableMail | `Gutachten › Freigeben (NotifyFitmentSubscribers, an Nachfrage-Abonnenten)` | Mail geprüft: FitmentNotifyTest, AdminAlertsTest |
| 469 | E-Mail | DeliverabilityTestMail | `Einstellungen › E-Mail › Test (rimify:mail-test)` | Mail geprüft: MailTestTest; Gang w-t9-6 („Verbindung testen“) |
| 470 | E-Mail | AdminAlertMail | `System-Meldungen an Admins (AdminAlerts)` | Mail geprüft: AdminAlertsTest |
| 471 | E-Mail | OrderConfirmationMail | `Testbestellung bezahlt (Webhook) — Aufgabe 6` | Mail geprüft: CheckoutPaymentTest, BestellungDetailTest, OrderLinkTest; e2e t6 (Testbestellung) |
