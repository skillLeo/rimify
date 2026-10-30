# EXPECTATIONS — what „working“ means to the client

The human QA pass (`HUMAN-QA-FULL.md` §2) tests against this list, not against our own understanding. Every row is one
thing the client asked for, decided, or was told by us, with the check a person does and what they should see.

**Sources read (28.10.2026):** his storefront list „Rimify Changes“, items 1–34 (`scripts/kundenliste/items.mjs` — his
wish, quoted; `docs/review/KUNDENLISTE.csv` — the comment we sent and the state in his sheet); his admin list, items
1–18 = our 201–218 (`scripts/kundenliste/admin-items.mjs`, `docs/review/ADMINLISTE.csv`); every decision in
`docs/decisions.md` that names him as its source; `docs/client-questions.md`; `docs/review/BEWERTUNGEN-IMPORT.md`; and
the original Rimify 2.0 documents as we hold them (`_design-source/_artifact/`, in git history at `88a6ac61`): the Build
Bible SL/DOC/2026/RMF-02, the Master Build Prompt and the Laravel Build Pack.

**A gap in the sources.** His own PRD v1.0, the Project Overview, the ER model, the Figma kit and the PKW-Liste demo
package are **not in the repository**. We know them only through the Build Bible's summary of what each contributed
(§1.5) and its acceptance tests (§11.2). Rows taken from there say so; where they matter in the meeting, ask him for
the originals.

**Precedence,** as the Build Bible §1.5 fixes it: *Rimify's written answer > signed proposal RMF-01 > PRD > Project
Overview > Figma > demo package.* His two lists are his written answers, so a Bible default his list overrides is
recorded as **superseded**, not as a conflict. A **CONFLICT** is two sources of equal weight that disagree, or a source
that disagrees with what the shop does or what we told him; it is not resolved here — it goes to Meeting decisions
(`HUMAN-QA.md` §9).

**Personal data.** The repository is public: no name, address or vehicle of the client stands here.

**Count: 133 expectations** — 34 storefront items (S), 18 admin items (A), 27 decisions and answers he gave (C), 14
promises in our comments (P), 40 from the original documents (O). **5 rows marked CONFLICT; 8 conflicts in all**
for the meeting, listed at the end (the other three are states and open questions, not rows that disagree). Two were
settled by the operator on 29.10.2026 and are no longer for the meeting: S-19 is built as we told him (D-344), and S-25
never was a conflict.

| Column | Meaning |
|---|---|
| ID | S-nn storefront item, A-2nn admin item, C-nn his decision or answer, P-nn our promise, O-nn original document |
| Source | where it stands |
| His words | quoted as he wrote them (German), or the source's words |
| Check | what a person does, starting on the home page or the admin dashboard |
| Should see | the result that counts as working |

## S — his storefront list, items 1–34

| ID | Source | His words | Check | Should see |
|---|---|---|---|---|
| S-01 | Storefront 1 · Done | „Fahrzeug wählen“ im Hero hellblau, solange kein Fahrzeug gewählt ist | Open the home page without a car; look at the hero button; click it; choose a car and look again. | Light-blue button with readable blue text and a line saying why it waits; the click jumps to the selector with the cursor in the first field; with a car the button is the normal blue. |
| S-02 | Storefront 2 · Done | Header höher | Open the home page at 1440 and 390; click a jump link (e.g. a homepage section). | Header 72 px on desktop, 64 px on the phone; a jump lands with the heading visible under the header. |
| S-03 | Storefront 3 · Done | Leiste über dem Header entfernen | Open any page at 1440 and 390. | Nothing above the header; the strip's message still appears on the page. |
| S-04 | Storefront 4 · Done | Link zur Felge und Preis aus dem Hero entfernen | Hover and click the wheel photo in the hero. | Not a link, no price; the measurements beside it stay. |
| S-05 | Storefront 5 · Done | „Felgen mit den meisten Freigaben“ → meistgekaufte Felgen | Scroll the home page to the wheel row. | „Meistgekaufte Felgen“, by paid orders of 90 days; „Neu im Shop“ before the first sale; hidden with fewer than four wheels. |
| S-06 | Storefront 6 · Done | Markierung „Wir lesen das Gutachten · Du bekommst die Antwort“ bei manchen Seitenverhältnissen verrutscht | Scroll to the section at 1440, 1280, 1024, 768, 390 and in a low window. | The highlight sits on the BMW row at every size. |
| S-07 | Storefront 7 · Done | Hero springt beim Wechsel zwischen „Marke & Modell“, „HSN/TSN“ und „Fahrzeugschein scannen“ | Click the three tabs in turn, watching the content below. | Nothing moves. |
| S-08 | Storefront 8 · Done | Fahrzeug in die Adresse (URL), damit man die Seite speichern und teilen kann | Choose a car, copy the address, open it in another browser; use Back/Forward after changing car. | The address carries the car (`?fahrzeug=…`); the other browser shows the same wheels and answers; Back/Forward switch cleanly. |
| S-09 | Storefront 9 · solved differently · **Open in his sheet** | Echte Beispielfelge (z. B. Motec) im drehenden Rad | Look at the turning wheel on the home page. | A real wheel the shop sells (BORBET DB8GT2), not a Motec — no rights to Motec photos; swapped if he sends some. |
| S-10 | Storefront 10 · Done | „Felgenrechner“ und „Blog“ im Footer verlinken | Click both footer links. | Both open; the Blog lists its articles. |
| S-11 | Storefront 11 · his judgement | Bessere Illustration im Felgenrechner (wie bei jr-wheels.com) | Open the Felgenrechner; change the ET and the width. | Our cross-section shows ET as an arrow and the width as a dimension; the wheel moves in the arch as the ET changes. His verdict on the look. |
| S-12 | Storefront 12 · Done | Kontaktformular auf der Kontaktseite | Open Kontakt from the menu; send a message, also empty and too fast. | A form (name, e-mail, subject, message, privacy line, the car ticked); errors in German beside the fields; the message appears in the admin under Verkauf › Nachrichten. |
| S-13 | Storefront 13 · Done | Warenkorb-Symbol im Handy-Header, links neben dem Menü | At 390, add a wheel; look at the header. | The basket icon left of the menu, with the count, without opening the menu. |
| S-14 | Storefront 14 · Done | Preis im Warenkorb versehentlich × 4 | Add 1, 2, 4 and 5 wheels; compare tile, product page, basket, checkout, confirmation, invoice. | The same amounts everywhere: one wheel 229,00 €, four 916,00 € (example prices). |
| S-15 | Storefront 15 · Done · valves pending | Beim Komplettrad Wuchtgewichte, Ventile und Reifendrucksensoren anbieten, bei „Nur Felgen“ nicht | On a product page switch between Nur Felgen and Komplettrad; add both to the basket. | Komplettrad: weights and RDKS sensors as their own priced lines, counted per wheel; Nur Felgen: none of them. Valves not offered yet — waiting for his answer. **CONFLICT:** the brief lists 15 as an open item; his sheet says SkillLeo Done. |
| S-16 | Storefront 16 · Done | Nach „In den Warenkorb“ ein Fenster, damit man leichter weiterkommt | Add to the basket by mouse and by keyboard; press Esc. | A window with the line and total, „Weiter einkaufen“ and „Zum Warenkorb“; focus stays inside; Esc returns to the button; on the phone it covers part of the screen. |
| S-17 | Storefront 17 · Done | Mengenauswahl neben dem Preis, 4 vorausgewählt, Preis passt sich an | Open a product page; change the amount 1…8. | 4 preselected; 1–8 choosable; „4 × 229,00 € = 916,00 €“ updates. Whether 3 is a sensible amount is a meeting question (brief §8.4). Supersedes the Bible's default „sets of four only“ (O-34). |
| S-18 | Storefront 18 · Done | Auswahl „Nur Felgen“ / „Felgen + Reifen“, mit passenden Reifen direkt | Switch modes after choosing size, colour and amount; pick a tyre. | Nothing chosen is lost; the check shows what the Gutachten requires for that tyre size; a combination it does not allow cannot be bought. |
| S-19 | Storefront 19 · built (release 22) · **Open in his sheet** | Bewertungen unter dem Felgennamen, im Admin anlegbar (z. B. 4,9 Sterne, 13 Bewertungen) | In Katalog › Felgen › a rim › „Sterne von Hand“ enter stars, a count and the sentence where they come from; look under the rim's name; try a sentence that claims a check, and stars without a sentence. | The stars under the name with the sentence beside them; none without the sentence; a sentence claiming a check refused; never „Geprüfter Kauf“, never in the structured data, never added to the buyers' own reviews, which keep their section (D-103). Built 29.10.2026 (D-344): we had told him he could enter stars by hand, and the first build passed the item without it (HQ-17). |
| S-20 | Storefront 20 · Done | Unterschiedliche Größen vorne und hinten wählbar | On a wheel whose Gutachten has a pairing table or combination list, choose front and rear. | Only the pairs the document permits; each axle with its own load; the order keeps both axles. Supersedes the Bible's default „same-size only“ (O-35). |
| S-21 | Storefront 21 · Done | „Eintragung“ steht bei Felgen mit Auflagen dreimal | Open a product page whose answer needs an Eintragung. | „Eintragung“ once, under the result's heading; the Auflagen do not repeat it; „Originaltext anzeigen“ shows each sentence under its tyre sizes, with its page. |
| S-22 | Storefront 22 · Done | Handy-Liste: „Vergleichen“ verdeckt „Mit Auflagen“ | Open the list at 320, 360, 390, 414 with a car. | „Vergleichen“ never covers the result; long Auflagen appear as a count on the tile. |
| S-23 | Storefront 23 · solved differently · Done | „Mit Auflagen“ nur gelb bei echten Auflagen (z. B. Bördeln), im Backend einstellbar | In the admin set an Auflage's level to Hinweis / Auflage / Nicht zulässig; look at the tile and product page. | All-Hinweis answers read „Freigegeben“; an Abnahme or body work can never be set to green. |
| S-24 | Storefront 24 · Done | Scrollbalken der Filter am Ende manchmal fehlerhaft | Scroll the desktop filter column to the end. | It reaches the last entry without a jump. |
| S-25 | Storefront 25 · Done | Knopf „Nur die Felgen bestellen“ ohne Funktion entfernen | Open a product page with and without tyres offered. | No button without a function; „Nur Felgen“ / „Komplettrad“ by the price. His item removes the button where it has no function — when no tyres are available — and that is what was built: no conflict (the operator, 29.10.2026). |
| S-26 | Storefront 26 · Done | Alle E-Mail-Knöpfe sollen zum Kontaktformular führen | Click every contact button and e-mail link across the shop. | None opens an e-mail program; all lead to the contact form; the Impressum names the address as text once the seller details are entered. |
| S-27 | Storefront 27 · Done | Zollgröße oder Marke geht verloren, wenn man danach das Fahrzeug wählt | On the list choose 18″ or a brand, then choose a car. | Size and brand are kept. |
| S-28 | Storefront 28 · Done | RIMIFY-Check: Fahrzeug und Felge wählen, Antwort nur für dieses Paar, dann direkt kaufen | Open RIMIFY-Check; choose a car and a wheel; try a pair that does not fit. | One answer with Auflagen, the Gutachten and page, „Jetzt kaufen“ and the Komplettrad beside it; no buy button for a pair that does not fit. |
| S-29 | Storefront 29 · Done | Auf dem Handy falscher Footer auf der Startseite | Scroll to the footer on the home page and other pages at 390. | One footer, the same everywhere. |
| S-30 | Storefront 30 · Done | Filter auch ohne gewähltes Fahrzeug | Open the list without a car; use every filter. | All filters work; one sentence says results for a car need a car. |
| S-31 | Storefront 31 · Done | Filter-Auswahl in der Liste auch auf dem Handy | At 390 tap „Filter“. | A sheet from the bottom with the same filters and counts as desktop. |
| S-32 | Storefront 32 · his judgement | Seite etwas farbiger, z. B. hellblaue Abschnitte | Scroll the home page. | A pale blue-grey surface alternates with white. His verdict. |
| S-33 | Storefront 33 · his judgement | Startseite: mehr Blau, z. B. Symbole und der gewählte Reiter | Look at the home page's icons, tabs and option buttons. | Icons, the chosen tab, chosen options and the focus frame are blue. His verdict. |
| S-34 | Storefront 34 · question · **Open** | „Product Detail Page needs“ – der Satz bricht ab | — | Nothing built; his sentence is unfinished — ask him. |

## A — his admin list, items 1–18 (our 201–218)

| ID | Source | His words | Check | Should see |
|---|---|---|---|---|
| A-201 | Admin 1 · Done | Fahrzeug von Hand anlegen | Dashboard › Fahrzeuge › „Neues Fahrzeug“; save one, then without axle loads. | Saved as checked by hand, at once in the storefront selector; without axle loads the form says before saving what that means, and the car stands under „Zur Prüfung“. |
| A-202 | Admin 2 · solved differently · **Open in his sheet** | Import der Fahrzeugdaten, aufgebaut auf euren Demodaten; ohne Lochkreis – das Feld bleibt leer | Fahrzeuge › Import: upload a CSV/Excel, map columns, run the Probelauf, then import. | Any CSV or Excel; the mapping kept per source; the Probelauf counts new / changed / refused before anything is written; hand-made and Gutachten cars never overwritten; no bolt circle needed. His demo file was never sent. |
| A-203 | Admin 3 · Done | Beim Anlegen von Hand HSN, TSN und die weiteren Fahrzeugdaten eintragen | Open „Neues Fahrzeug“. | Every field labelled with its number in the papers: 2.1, 2.2, D.1, D.3, D.2, K, P.2, 8.1, 8.2, T. |
| A-204 | Admin 4 · Done | „Felgen-Typenbezeichnung“ beim Anlegen einer Felge Pflicht, nicht optional | Katalog › Felgen › new rim without Radtypenbezeichnung; publish one. | Refused in the form and at publishing; older and imported ones without it listed under „Radtypenbezeichnung: Fehlt noch“. |
| A-205 | Admin 5 · Done | Feld „Typenbezeichnung“ in „Radtypenbezeichnung“ umbenennen und in den Produktnamen aufnehmen | Open a rim. | The field reads „Radtypenbezeichnung“ and is part of the name in the shop and the admin heading. |
| A-206 | Admin 6 · Done | Die Radtypenbezeichnung zusammen mit Marke und Modell im Felgennamen | Look at a rim on cards, product page, basket, a new order, the RIMIFY-Check. | Brand + model + Radtypenbezeichnung everywhere, unless „Titel im Shop“ says otherwise. |
| A-207 | Admin 7 · Done | Keinen Lagerbestand als Zahl, nur „verfügbar“ und „nicht verfügbar“ | Set a size to „Nicht verfügbar“; open it in the shop; import a supplier file with quantities. | No number anywhere; an unavailable size cannot be bought and the shop says so; orders book nothing off; 1+ → Verfügbar, 0 → Nicht verfügbar. |
| A-208 | Admin 8 · Done · **Open in his sheet** | Feste Bereifungskombinationen im Teilegutachten, mit Auflagen je Achse | Gutachten › a draft › „Bereifungskombinationen“: type the list; release; open the wheel in the shop for a matching car. | Only the listed pairs as a Komplettrad, 2 + 2; Auflagen under „Vorderachse“ / „Hinterachse“; codes as printed, also `0)`, `R)`, `16a)` (D-335). Our note: „Ob dein Gutachten drei oder vier Kombinationen nennt, klären wir noch mit dir.“ — still open (C-25). |
| A-209 | Admin 9 · Done · **Open in his sheet** | Getrennte Felder für Lastindex und Geschwindigkeitsindex statt eines Felds | In a draft's entry form paste „245/35 R19 93Y“. | Two fields; pasting splits the size by itself; a front/rear pair becomes two rows; both checked at save and at release. |
| A-210 | Admin 10 · Done | Ein Bereich für Reifen im Admin: Marke, Größen, Saison … anlegen und verwalten | Katalog › Reifen: create a tyre, „Weitere Größe anlegen“, leave the EU label incomplete. | One size of one profile per row with EU label, price, availability; incomplete labels counted above the list; such a tyre is not offered as a Komplettrad. |
| A-211 | Admin 11 · solved differently · **Open in his sheet** | Blog: Fotos hochladen und HTML für Abschnitte, z. B. für Tabellen | Write an article with a section, an image, a table and a quote; publish. | Blocks in any order; the image uploaded in the article with a description; a table typed cell by cell (2–6 columns); no free HTML, deliberately. |
| A-212 | Admin 12 · Done | Eine Blogseite, auf der alle Artikel stehen (für Admin und Besucher) | Footer › Blog. | All published articles, newest first. |
| A-213 | Admin 13 · Done | Katalog › Felgen: der Standardtitel einer neuen Felge aus Marke, Modell und Typenbezeichnung | Create a rim; type another title; change the model. | Title composed by itself; a typed title stays and is flagged „Titel weicht ab“; one click restores the composed one. |
| A-214 | Admin 14 · Done | Für jede Felge automatisch ein Google-JSON-LD (Product) | View the source of a product page. | JSON-LD: ProductGroup with one Product per size and colour (SKU, EAN, price, availability); ratings only from real reviews; shipping once entered; no delivery time or returns yet; none for demo wheels. |
| A-215 | Admin 15 · solved differently · **Open in his sheet** | Unter Gutachten › Dokumente die „Tragfähigkeit bei hoher Geschwindigkeit“ nicht brauchen | Open a Gutachten that prints the table and one that does not. | The table only where the document prints one (and required there at release); elsewhere one folded line, „Keine Tabelle hinterlegt“. **CONFLICT:** his wish is to not need it; we kept it because ABE 55255 decides tyres above 210 km/h with it — meeting decision. |
| A-216 | Admin 16 · Done | Eine neue Felge erscheint nicht, weil der Browser alte Antworten hält – Listen und Fahrzeuge nicht zwischenspeichern | Publish a rim in the admin; reload the shop list in an open tab; use Back. | It appears at once; Back reloads where something changed. |
| A-217 | Admin 17 · question · **Open** | Rechnungserstellung entfernen | — | Not done: waiting for who issues the invoice and whether the shop keeps a copy. |
| A-218 | Admin 18 · no fault · **Open in his sheet** | Bestätigungslink unsicher: fortlaufende Nummer wie /bestellung/RMF-2026-XXXX – stattdessen Hash oder UUID, und befristet | Open an order by its mail link; change one character; open the bare number in another browser. | Only the signed link (12 months), the placing browser or the account open it; anything else looks like an order that does not exist. **CONFLICT:** the QA brief's list of open admin items (2, 8, 9, 11, 15, 17) leaves out 18, which his sheet still has as Open. |

## C — decisions and answers he gave

| ID | Source | His words / the decision | Check | Should see |
|---|---|---|---|---|
| C-01 | D-319, D-086 (his decision, 23.10) | Legal texts and the Impressum stay placeholders until he replaces them | Open each legal page; Einstellungen › Zahlung › live mode; System › Was fehlt. | Each placeholder says it is one; `noindex`; live payments refused while one remains; the go-live check red. |
| C-02 | D-335 · his item 8 | Fixed tyre combinations, Auflagen per axle | As A-208. | As A-208; never four of one size; an axle-limited size never on the other axle. |
| C-03 | D-315 (his message, 19.10) | His demo data's `fahrzeug_max_kmh` is field T | Import a file with that column. | It maps to T without being told. |
| C-04 | A-202 (his wish) | Bolt circle left empty | Import / create a car. | No bolt circle asked or needed. |
| C-05 | D-299, D-301 · his items 7, 10 | Stock replaced by available / not available | As A-207, for rims and tyres. | No counts anywhere. |
| C-06 | D-287, D-289 | Field T asked only where a released Gutachten needs it; the rim alone sells while only the papers' figures are missing | Choose a car without T / axle loads; open a wheel. | The form asks only the missing field, says why; „Nur Felgen“ stays buyable, the Komplettrad waits. |
| C-07 | D-254 · his item 8 | Codes typed with their bracket — `0)`, `R)`, `16a)` | Type `16a)` in a row. | Saved as the code; the customer reads the sentence. |
| C-08 | D-256 · his item 8 | The document's own combination list, closed once entered | As A-208. | Only listed pairs. |
| C-09 | D-295 · his items 9, 15 | Split index fields; the high-speed table only where printed | As A-209, A-215. | — |
| C-10 | D-296 · his items 1, 3 | A car typed by hand from the Zulassungsbescheinigung | As A-201, A-203. | — |
| C-11 | D-297 · his item 2 | Vehicle import with a Probelauf | As A-202. | — |
| C-12 | D-298 · his items 4, 5, 6, 13 | Radtypenbezeichnung required and in the name | As A-204–A-206, A-213. | — |
| C-13 | D-302, D-303 · his item 10 | Tyres in the admin with the EU label; offered only with the label complete | As A-210. | — |
| C-14 | D-305 · his item 14 | JSON-LD on every rim page | As A-214. | — |
| C-15 | D-306 · his item 11 | Blog articles from blocks, no free HTML | As A-211. | — |
| C-16 | D-189 · his item 9 | The phone's Komplettrad band shows the hero wheel in its other finish, from his photographs | At 390 scroll to the Komplettrad band; click its caption. | His wheel in the other finish; the caption opens the product. |
| C-17 | D-114 · his item 33 | More blue on the homepage | As S-33. | — |
| C-18 | D-106 · his item 2 | Header taller | As S-02. | **Superseded:** D-106 set 80 px desktop / 56 px phone; item 2 as built says 72 / 64 — check the current figure against what we told him (72 / 64). |
| C-19 | D-073 | The real invoice numbers are opened once, from his accounting | Einstellungen › Zahlung. | Super-Admin, after the password, both first numbers typed; until then every invoice is a test invoice. Tied to A-217. |
| C-20 | client-questions 2 (answered) | Opening hours Mo–Fr 9–17 | Look at the contact block and the status line. | „Mo–Fr 9:00–17:00 Uhr“; the status closes at 17:00. |
| C-21 | client-questions 3 (answered) | No phone, no WhatsApp | Look at every contact place. | No phone number, no WhatsApp anywhere. |
| C-22 | client-answers (memory of his message) | Contact e-mail info@rimify.de | Contact form recipient; Impressum once seller details are entered. | Messages go there. |
| C-23 | client-answers | Wheels and complete sets are the range | Browse the shop. | Felgen and Kompletträder; no tyres sold alone. |
| C-24 | client-questions 1 (open) | Federal state for the holiday calendar | — | Still open: ask him. |
| C-25 | A-208, our note | Three or four combinations in his Gutachten | — | Still open: ask him. |
| C-26 | A-217 | Who issues the invoice | — | Still open: ask him. |
| C-27 | S-15 | Which valves without sensors | — | Still open: ask him. |

## P — what our comments promised him

| ID | Source | What we told him | Check | Should see |
|---|---|---|---|---|
| P-01 | A-215 comment | The high-speed load table is kept where the document prints it | Open ABE 55255. | The table is there and required at release. |
| P-02 | A-218 comment | The order link is signed, valid twelve months, renewed on request | As A-218; open an expired link. | „Abgelaufen“ page offering a new link to the order's address. |
| P-03 | D-318 / import comment | A refused row is never silent | Import a file with bad rows. | Every refused row named with its reason; shares counted over every row. |
| P-04 | S-25 comment | „Nur Felgen“ or „Komplettrad“ chosen right by the price | As S-25. | As S-25 — no conflict. |
| P-05 | S-12 comment | Messages kept under Verkauf › Nachrichten; the sender's copy once mail is set up | Send a message; open the admin. | It is listed; the copy goes out where mail is configured. |
| P-06 | S-26 comment | The Impressum shows his address once seller details are entered | Enter seller details; open the Impressum. | Address as text; before that „noch nicht angegeben“. |
| P-07 | S-19 comment | Real reviews from Google or his old shop can be imported with the source named | — | Typed by hand per rim, with the sentence that names the source (D-344, S-19); an importer stays scoped only (BEWERTUNGEN-IMPORT.md, A2–A3, B). |
| P-08 | S-11, S-32, S-33 comments | Before and after pictures at desktop and phone width | — | Pictures exist for his verdict. |
| P-09 | A-208, A-209 comments | Enter the combinations / open the split fields in a draft on his preview | On the preview, open a draft. | The section and the two fields are there. |
| P-10 | A-202 comment | Send us your demo file and we check the mapping | — | Not received. |
| P-11 | S-15 comment | Valves once he says which | — | Waiting (C-27). |
| P-12 | A-214 comment | Delivery time and returns not in the JSON-LD yet | View source. | Absent, as said. |
| P-13 | A-212 comment | The third guide appears after the law firm's check | Footer › Blog. | Two guides. |
| P-14 | S-09 comment | Send Motec photos and we swap them in | — | Not received. |

## O — the original Rimify 2.0 documents (Build Bible RMF-02; his PRD and Project Overview through §1.5)

| ID | Source | The document's words | Check | Should see |
|---|---|---|---|---|
| O-01 | Bible §11.2 A1 (PRD §6) | Selecting a vehicle shows only wheels with a valid published approval for that exact variant | Choose a car; open the list. | Only approved wheels. |
| O-02 | A2 | HSN 1860 / TSN AAS presents both variants with build periods and top speeds | Type 1860 / AAS. | A choice of both variants, never one silently. |
| O-03 | A3 | Selecting a variant updates price, stock and approval status together | Change size / colour on a product page. | Price, availability and verdict change together. |
| O-04 | A4 | A size not permitted can never be added to the basket by any route | Try URL manipulation and Back after changing car. | Refused in German. |
| O-05 | A5 | 280 km/h, 1235 kg rear axle: no tyre below 92 / Y | Choose such a car; open the tyres. | None below the minimum. |
| O-06 | A6 | Every condition in German before add-to-basket; no bare code | Read every product page answer. | Full sentences, never „A02“. |
| O-07 | A7 | Eintragungspflicht visible on card, product page, basket and confirmation e-mail | Follow one wheel needing an Eintragung through all four. | Said at each. |
| O-08 | A8, A9 | Paid order and e-mail even if the browser closes after paying | Pay with a test card; close the tab. | Order paid, e-mail sent. |
| O-09 | A10 | An existing order keeps the verdict, conditions and revision shown at purchase | Release a new Fassung; open an old order. | The old order unchanged. |
| O-10 | A11 | Listing, product page, tyre selector and Rimify Check give identical verdicts | Compare one car and wheel on all four. | The same answer. |
| O-11 | A12 | Header state: white box on list, product, basket; blue bar on FAQ and Contact; no flicker | Walk through with a car chosen. | As described, no flicker. |
| O-12 | A13 | A Content Editor cannot reach orders or compatibility data, even by URL | Log in as content editor; type the URLs. | A German refusal; the attempt in the Protokoll. |
| O-13 | A14 | A malformed import writes nothing; a valid one commits whole | Import a broken file, then a good one. | Nothing written, a report; then all at once. |
| O-14 | A15 | A car missing axle loads or top speed is never PERMITTED | Choose such a car. | „Noch nicht bestätigt“ / „Zur Prüfung“, never a positive tyre answer. |
| O-15 | A16 | List under 2 s, LCP under 2.5 s, CLS under 0.1, INP under 200 ms | Time it on the preview. | Within the budget. |
| O-16 | A17 | The purchase path by keyboard alone and with a screen reader | Buy by keyboard. | Completable. |
| O-17 | §5.5 | The list shows „Ohne Eintragung“ as a filter | Open the filters. | Check whether it exists (record either way). |
| O-18 | §5.5 | Filters show live counts; an option with zero results is disabled, not hidden | Combine filters. | Counts update; zero options disabled. |
| O-19 | §5.5 | Every filter, sort and page in the address; Back and Forward work | Filter, then Back. | The address carries the state. |
| O-20 | §5.5 | Numbered pages (`?seite=`), not infinite scroll | Page through a long list. | Numbered pages. |
| O-21 | §5.5 | Without a car, cards offer „Kompatibilität prüfen“ | Open the list without a car. | A way to check each wheel. |
| O-22 | §5.6 | A size not permitted for the car is shown disabled with a one-line reason | Open a wheel with a refused size. | Disabled chip with its reason. |
| O-23 | §5.6 | The verdict sits above the add-to-basket button, with the document to download | Open a product page. | Verdict, document link, then the button. |
| O-24 | §5.6 | Product page without a car shows every size and „Passt diese Felge auf Ihr Auto? Fahrzeug wählen.“ | Open a product page without a car. | Complete page, an invitation to choose a car, nothing pretending to be verified. |
| O-25 | §5.6 | Each tyre shows why it qualifies — e.g. „Mindest-Tragfähigkeit 92, Geschwindigkeitsindex Y“ | Open the tyre choice. | The minimum said as a sentence. |
| O-26 | §5.7 | The Check result has its own address and a printable PDF | Run a check; share and print it. | A link that shows the same result; a one-page PDF. |
| O-27 | §5.7 | A shared result whose document changed says so and offers a re-check | Open an old check link after a new Fassung. | Said, with a re-check. |
| O-28 | §5.7 | NOT_PERMITTED offers permitted alternatives in the same diameter | Check a pair that does not fit. | Alternatives offered. |
| O-29 | §5.8 | The basket re-checks every line and marks one no longer permitted, never drops it | Change car with wheels in the basket. | Marked in place with a way out. |
| O-30 | §5.8 | The basket says the Eintragung once, near the total | Basket with such a line. | Said once near the total. |
| O-31 | §5.8 | A Komplettrad is one unit; removing the tyre turns it into wheels with a visible price change | „Reifen entfernen“ in the basket. | Wheels only, the price changes. |
| O-32 | §5.9 | Empty list for a car: says so, offers notify and contact | Choose a car with no wheels. | A sentence and two ways on. |
| O-33 | §5.9 | 404 offers the selector and search, not a dead end | Open a broken address. | Selector and search on the 404. |
| O-34 | §11.4 Q3 | Sets of four only; singles modelled, not exposed | — | **Superseded** by S-17 (1–8 choosable). |
| O-35 | §11.4 Q4 | Mixed fitment: engine supports it, storefront same-size only | — | **Superseded** by S-20 (front and rear sizes). |
| O-36 | §11.4 Q5 | TPMS not offered in v1 | — | **Superseded** by S-15 (sensors offered). |
| O-37 | §11.4 Q7 | First-party reviews with moderation and structured data | As S-19. | Built for buyers' reviews (D-103); stars typed by hand stand beside them and never enter the structured data (D-344). |
| O-38 | §1.4 / §11.4 Q8 (PRD §2) | Customer accounts out of scope; guest tracking by number and e-mail | Look for „Konto“. | **CONFLICT:** the PRD put accounts out of scope; the shop has a customer account (A-218 relies on it). Which is wanted — meeting. |
| O-39 | §11.4 Q6 | Cards plus PayPal at launch | Look at the payment methods in the checkout. | **CONFLICT** to check: the default was cards + PayPal; what Stripe offers on the preview is to be recorded. |
| O-40 | §5.8 / §11.4 Q1 | Stock checked again before payment; own stock | — | **Superseded** by A-207 (no counts, available / not available). |

## Conflicts for the meeting (§9)

1. **A-215 — the high-speed table.** His wish: not needed. Kept for documents that print it (ABE 55255, above 210 km/h).
2. **S-15 — state.** His sheet: SkillLeo Done. The QA brief: open. (Valves still wait for his answer.)
3. **A-218 — state.** His sheet: Open. The QA brief's open admin items leave it out.
4. **S-09, S-19, A-202, A-208, A-209, A-211, A-215 — „Open“ in his sheet** while ours says built or solved differently:
   his column is what he will tick.
5. **O-38 — customer accounts.** Out of scope in his PRD; present in the shop.
6. **O-39 — payment methods.** Cards + PayPal by default in the Bible; to record what the preview offers.
7. **C-25 — three or four combinations** in his Gutachten (open since A-208).
8. **C-18 — header height.** D-106 (80 / 56 px) and item 2 as built (72 / 64 px) — check the live figure.

Settled by the operator on 29.10.2026, no longer for the meeting: **S-19** (built as we told him — he enters the stars,
their count and the sentence that names their source; D-344) and **S-25** (no conflict: his item removes the button
where no tyres are available, and that is what was built).
