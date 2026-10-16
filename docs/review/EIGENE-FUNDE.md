# EIGENE-FUNDE — what we found ourselves on the public pages

Our own findings, written before the client writes them: numbered from 100 so they can never be confused with his list
(1–34). One row per finding — the page, what is wrong in one sentence a shop owner understands, how serious, and where
it stands. Admin-side observations are in `ADMIN-GEFUNDEN.md` (from 500), recorded and not fixed.

**Severity.** S1 wrong information, a broken purchase path or a legal gap · S2 a dead end, a visibly broken layout, a
console error · S3 copy, consistency, polish · S4 an opinion.

**State of the sweep (16.10.2026, the run to the end).** The first pass ran on the preview (release `d126238d`); the
second on a shop of our own that holds every answer the engine gives (`scripts/qa/sweep-states.mjs`, the e2e shop with
one Gutachten marked as held in part); the third on the preview again, release 4 — the four items the second pass had
left („not done, and so not claimed“, below) and the client's 34 in two engines. Everything fixed here is on the
preview with release 4 (`e73553df`, 16.10.). 37 entries: 8 S1, 11 S2, 14 S3, 2 S4, one S3/S4, one to check on a real
iPhone. **Open S1/S2: two, and both wait on someone else** — 126 (the seller's name and postal address for the
Muster-Widerrufsformular, which come with the seller's details: the go-live check „Impressum“) and 129 (the promise
row's two titles: the client's questions #6 and #9).

| Nr | Page | What is wrong | Sev. | State |
|---|---|---|---|---|
| 100 | Product page › „Originaltext anzeigen“ | Two conditions that contradict each other — „only fine-link snow chains“ and „no snow chains“ — stood side by side with nothing saying which tyre size each belongs to. | S1 | **Fixed** (13.10.). Each sentence now stands under the tyre sizes it applies to; tests fail on the old code. |
| 101 | Order confirmation e-mail | A condition that names an EG type-approval number (`e1*93/81*…`) lost its asterisks: the e-mail printed part of the number in italics. One of the 177 conditions in the three Gutachten was affected. | S1 | **Fixed** (13.10.). E-mails print every value literally; all 177 conditions are tested. |
| 102 | Contact form › the two e-mails it sends | Anyone could have the shop send a link and a remote image of their choosing, under the shop's name, to any address: the „copy“ went to whatever address was typed, and the words were read as formatting. | S1 | **Fixed** (13.10. and 14.10., D-205, D-218). No such mail ever left: the preview's mailer is `log`, nothing else is set up, the form has stored no message there. The copy now goes only to a signed-in customer's own confirmed address; nothing in any mail is fetched from another host; limits per network address and per e-mail address. |
| 103 | Product page, RIMIFY-Check | A wheel its Gutachten approves, with a tyre size nobody could confirm, was headed „Keine Freigabe hinterlegt für …“, its size struck through. Seen on the client's own wheel and car. | S1 | **Fixed** (14.10., D-214) as you decided: „Felge freigegeben mit Auflagen · Reifengröße noch nicht bestätigt“, the size grey and dashed with your legend, a way on („Wunschreifen nennen“). Today 2 of the preview's 3 pairs stand there (D-217). |
| 104 | Product page, RIMIFY-Check | „Das Gutachten druckt keine Tabelle …“ said what a PDF prints. | S1 | **Fixed** (14.10., D-215): „Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.“ — and with it rule R-17 and ten more sentences (D-216). |
| 105 | Product page › „Gutachten öffnen“ | The link answered with an error page (403) for both of the client's documents: storage had been switched to the bucket after he uploaded them, and the files stayed behind. | S2 | **Fixed** on the preview (13.10.) by copying the two files over, verified. The cause is in the admin: `ADMIN-GEFUNDEN.md` 501. |
| 106 | Listing, basket | With a real Gutachten's long conditions a product tile grew to 2,500 px and a phone's basket to 9,900 px. | S2 | **Fixed** (13.10.). Long conditions are counted on the tile and unfold in the basket; no sentence is cut. |
| 107 | Listing | Above wheels that could be ordered with the test payment the page said they could not be ordered yet. | S3 | **Fixed** (13.10.). |
| 108 | Listing tile, basket | A single counted condition was called „1 Auflage“ although it could be a mere note. | S3 | **Fixed** (13.10.): „1 Auflage oder Hinweis“. |
| 109 | Contact form | The „too fast“ spam check let a message through after 2.1 seconds instead of 3. | S3 | **Fixed** (13.10.). |
| 110 | Listing, also with a car and in the search | Corrected: the first-row photographs were never lazy — every tile's *second* photograph, the one a mouse fades in, sat invisible on the first row and was fetched with the page. The product page's thumbnails were lazy on the first screen. | S3 | **Fixed** (14.10., D-219) with your rule as a test at both widths: nothing on the first screen loads lazily, nothing outside it is preloaded. |
| 111 | Vehicle picker | Headings jumped from the title to the third level. | S3 | **Fixed** (D-219). |
| 112 | Listing on the phone | Product names were third-level headings directly under the title. | S3 | **Fixed** (D-219): „Ergebnisse“ as the second level, on every width. |
| 113 | Homepage | One section, two names on desktop and phone. | S3 | **Fixed** (D-219): „Was wir zusagen“, as the design document has it. |
| 114 | Homepage on the phone | The hero's wheels were lazy although 6–23 px of them stand on the first screen. | S3 | **Fixed** (D-219): loaded at once at low priority — measured first: FCP and LCP unchanged, the wheel 1,9 s sooner on a slow phone. |
| 115 | Product page | The client's own finish names are English („Black Gloss“, „Blue Gloss“) in an otherwise German shop. | S4 | Listed: his entries, his choice. |
| 116 | Homepage › „Wir lesen das Gutachten“ on an iPhone | In the WebKit test browser the small print of the example table is crushed together; in Chrome it is drawn correctly. | — | **To be checked on a real iPhone** — you said you would. One look at `/#h4`. |
| 117 | Product page with a car the wheel is no answer for | „Nicht freigegeben“, „Keine Freigabe hinterlegt“ and „Anlage liegt noch nicht vor“ ended at „RIMIFY-Check drucken oder teilen“: no way on to the wheels that do fit. | S2 | **Fixed** (D-220): „Felgen für deinen BMW 3er anzeigen“ under the answer. |
| 118 | Product page › Auflagen | „Wörtlich aus dem Gutachten.“ and „So steht es im Gutachten – ohne unsere Gliederung und ohne Auslassungen.“ said the document holds exactly what is recorded. A record with one condition of the document's six reads the same — the client's own entry is that case. | S1 | **Fixed** (D-220) to what is on record — **yours to veto**: „Der Wortlaut des Gutachtens, wie er bei uns hinterlegt ist.“ and „Der hinterlegte Wortlaut des Gutachtens, ohne unsere Gliederung.“ |
| 119 | Product page, RIMIFY-Check | A car the recorded rows of a Gutachten do not name is answered „Nicht freigegeben“ — also where the document was entered only in part: it counts as complete unless someone fills the optional „fehlende Anlagen“. The client's Teilegutachten (Anlage BMW15 of a longer report) is that case. | S1 | **Fixed** (14.10., D-227, as you decided): the release asks „Sind alle Anlagen und alle Fahrzeuge dieses Gutachtens erfasst?“; „nicht zulässig“ only on „Ja, alle“, „Noch nicht bestätigt“ otherwise, with the missing Anlage named. In the release of 15.10. |
| 120 | Every answer the engine cannot give | „Für dieses Fahrzeug können wir die Freigabe nicht bestätigen.“ stood for two different causes and named neither. | S3 | **Fixed** (D-216): each cause has its sentence; a test keeps it so. |
| 121 | Legal › processing record | „Fotos und Gutachten enthalten keine Kundendaten.“ — a general statement no field backs. | S4 | Listed: your legal text. |
| 122 | Homepage, RIMIFY-Check, product page | The fourth answer has three names: „Unbekannt“ in the legends, „Keine Freigabe hinterlegt“ in the panel, „Keine Angabe“ in the tyre row. | S3 | **Open — your word**: verdict wording. |
| 123 | Every page, 1024–1279 px | The header was 21 px wider than the window: „Warenkorb“ cut off at the right edge, the page scrolled sideways, „RIMIFY-Check“ broke in two. | S2 | **Fixed** (D-220): the basket keeps icon and count there, the links stay on one line; a test checks ten widths from 320 to 1920 and the short windows. |
| 124 | Checkout | „Für dein Fahrzeug freigegeben“ on every line, the car named nowhere — at the moment of ordering. | S2 | **Fixed** (D-220): „Geprüft für Audi RS 4 Avant Quattro (HSN 1860 · TSN AAS)“ in the summary, as in the basket. |
| 125 | Basket, checkout | „Gesamt“ beside „Versand – wird noch festgelegt“: it was not the total. | S2 | **Fixed** (D-220): „Summe ohne Versand“ while shipping is open. |
| 126 | Legal › Muster-Widerrufsformular | „An E-Mail: info@rimify.de:“ — a doubled colon, and no name or postal address. | S2 | **Fixed in part** (D-220): the colon. Name and address come from the seller's data; the preview holds none yet (the go-live check „Impressum“ says so). |
| 127 | Eleven wordings across the shop (copy review) | Grammar, terms and next steps — „nur, dass wir es nicht belegen können“, „das steht im Gutachten“ in the Felgenrechner, „Auto wählen“ beside „Fahrzeug wählen“, „Bedingungen“ for Auflagen, the empty checkout and account, the 404, the legal placeholders. | S3 | **Fixed** (D-220); each with before and after in D-220. |
| 128 | Copy review, the rest | 20 smaller points: the FAQ named four ways, „Felgen“ counting designs here and finishes there, the filter's empty state, the selector's third field „Fahrzeug“, three names for the rim width, units that can wrap, „Passform“ and „Kompatibilität“, „Wähl“ beside „Wähle“, the brand wall's „Noch keine Felgen auf Lager“, the basket's doubled Eintragung line, an ASCII quote in the FAQ. | S3/S4 | **Applied** (14.–16.10.). Searched on 16.10.: none of the old wordings in the table below is left on a public page — what remains stands in code comments, the internal design specimen (`/__design`) and the admin, whose round is closed („Wähl sie bitte noch einmal aus“ in its upload forms). |
| 129 | Homepage › promise row | „Garantierte Passgenauigkeit“ (a guarantee carries legal weight) and „Express-Versand aus Deutschland“ (no delivery time is on record) — the client's own titles. | S2 | **Open — waiting on the client** (client questions #6 and #9). |
| 130 | Homepage, desktop | LCP 2,6 s on the preview from here (the hero photograph); the server answers in 0,75 s from Boston. | S3 | Listed: the lever is the host's location (UMZUG-DE, your call). |
| 131 | Order page (`/bestellung/{Nummer}`) | An order a real person places for the acceptance set's wheel counted as demonstration data, and the order page opens demonstration data to anyone who has the number — so that person's name, address and purchase would have been readable by guessing it. Reproduced (15.10.): a stranger got 200 instead of 404. On the preview no such order exists (read 15.10.: 3 real orders, none on a demo wheel); the acceptance wheel can be bought there. | S1 | **Fixed** (15.10., D-238) on provenance, as you set it: a seeded order opens by number; an order that came through the checkout never does — always, in every environment, whatever it contains (`orders.origin`, fixed at insert); `BestellungAcceptanceTest`. In the release of 15.10. |
| 132 | Every page, 1024–1279 px | The header was 29 px wider than the window again: the menu's „FAQ“ became „Häufige Fragen“ in the copy review, and the bar had no room left for it. Found by the release gate, before any release carried it. | S2 | **Fixed** (15.10., D-244): there the search is an icon that opens the palette, as on a phone; the field comes back from 1280, and where the bar is full only the field gives way. |
| 133 | Every page, first visit | When the shop's font arrives late, the cookie notice's text breaks into lines anew and the notice — standing on the window's bottom edge — moves up by up to 0,055 of a layout shift (budget 0,02). Seen in the gate's load tests at 768 and 1024 px when the notice drew before the font. | S3 | **Listed**, tied to the notice: as your FINISH brief says, the notice stays exactly as it is until its rework (D-241 — it goes or becomes the consent dialog); the rework must keep its box from moving. The load tests now measure the pages as a returning visitor sees them. |
| 134 | Homepage on the phone, opened below the Gutachten story (a link to `/#h5`) | The story's heading „Wir lesen das Gutachten. Du bekommst die Antwort.“ takes three lines in the fallback font and two in the shop's own; when the font arrives, everything below it moves up 30 px (0,0345, budget 0,02) — in four loads of six from here. A load from the top is not affected: the change happens off screen. | S3 | **Listed**: the fix is the fallback faces' metrics (`fonts-fallback.css`), which every page's text rests on — its own task, measured across the site. The load test leaves the link to `/#h5` out until then and keeps the reload part-way down. |
| 135 | Product page › „Zum Warenkorb hinzugefügt“, in Safari | With the keyboard, Tab walked out of the panel past „Zum Warenkorb“ to the page behind it: Safari's Tab skips links, and the panel only caught Tab at its first and last control. Found by the client's item #16 on the preview (WebKit; Chromium passed). | S2 | **Fixed** (16.10.): every Tab inside the panel is the panel's own and moves through its links and buttons in order, in every engine; its component test walks all three. On the preview with release 4. |
| 136 | Product page › „Werte aus einem Foto“ (and the homepage's scan) | Every photograph read on the device wrote „Estimating resolution as 588“ to the browser's console as an error — the reading engine's own diagnostics. Found by the sweep's photograph test on the preview (§3), in both engines; the values were read right. | S2 | **Fixed** (16.10.): the engine's diagnostics go nowhere; proven on the shop's own engine and language data — the same text is read, and nothing reaches the console. On the preview with release 4. |

## What has been looked at, and what has not

**First pass** (preview, release `d126238d`, Chromium 1440 × 900 and WebKit 390 × 844, 25 pages each,
`scripts/qa/sweep-public.mjs`): content, dead ends (62 links), empty states, layout at two sizes, consistency, meaning,
accessibility beyond axe, technical, speed. **Second pass** (our own shop, the build on `main`, `scripts/qa/sweep-states.mjs`):

| Sweep item | What ran | Found |
|---|---|---|
| 1 German copy review | Every public page's words at both widths, header and footer, every verdict state, basket, checkout, account — read by a German copy editor (`docs/qa/sweep-texte*.txt`) | 35 points: 118, 122, 124–129 here; 11 fixed (127), 20 listed (128) |
| 2 Twelve widths and short windows | 320, 360, 390, 414, 480, 600, 768, 1024, 1280, 1440, 1680, 1920 and 1440 × 720, 1280 × 620, 1024 × 768 — 16 pages each, a basket with a line: wider than the window, words cut off, controls on one another, small targets, bars on a short screen | 123; the example Gutachten table on the homepage cuts its cells with „…“ from 320 to 1024 px — a picture of a document, read out whole by its label (with 116) |
| 3 All five answers | „Freigegeben“, „Mit Auflagen“ (with and without Eintragung), „Nicht freigegeben“, „Keine Freigabe hinterlegt“ (no Gutachten; Anlage missing), „Felge freigegeben · Reifengröße noch nicht bestätigt“ — at both widths, with every size chip and its reason | 117, 119, 122 |
| 4 Basket and checkout | One line, then four; the checkout filled in, step by step, to „Zahlungspflichtig bestellen“ — present and enabled, **not pressed**, at both widths | 124, 125 |
| 5 Signed in as a customer | Sign-in, Mein Konto, the contact form (address filled in, copy promised only where one goes), basket and checkout | 127 (the empty account) |
| 6 Terms | Felge/Rad · Freigabe/Gutachten/Prüfnachweis · Warenkorb/Korb · Fahrzeug/Auto · Kasse · Komplettrad · Reifengröße · Auflage/Bedingung/Hinweis | **Felge** (Rad only for wheel and tyre together) · **Gutachten** for the document, **Freigabe** for what it grants, „Prüfnachweis“ and „Zulassung“ not used · **Warenkorb** · **Fahrzeug** („Auto“ only in the visitor's own questions) · **Kasse** · **Komplettrad / Kompletträder** · **Reifengröße** · **Auflagen** („Bedingungen“ replaced, 127). The fourth answer's three names: 122. |
| 7 LCP and CLS | Five loads per page and width, first visit, the LCP element named — the preview from here, and our own shop | Preview: LCP 1,0–1,5 s on every page but the desktop homepage (2,6 s, the hero photograph); CLS 0,000 everywhere but one product page (0,003). The LCP element is the hero photograph, the listing's first photograph, the page's lead sentence — or, on a first visit, the cookie notice. 130. |

**Third pass** (the preview, release 4, 16.10.2026, Chromium 1440 × 900 and WebKit 390 × 844, `tests/abnahme/sweep.spec.ts`
and `scripts/qa/axe.mjs`) — the four items the second pass had not done:

| Sweep item | What ran | Found |
|---|---|---|
| The 500 page | Opened on purpose (`/__fehlerseite/500`, D-243): the shop's frame, header and footer, three ways on, no mail link — and the standalone page a failed boot gets, which loads no bundle | nothing |
| The Fahrzeugschein photograph | A form drawn in the page and read on the device. On the product page 8.1, 8.2 and T were read right (1120, 1180, 250) and kept only on „Werte übernehmen“, which was not pressed. The homepage's scan waits with the key numbers on the preview, and says so; the reading itself is the same engine | 136 |
| The Gutachten PDF at its page | The link's page against the page the answer names, the file a PDF that has it — through the example document's marked page (D-239): page 5 of 13 of ABE 55255, the X3's row | nothing |
| axe on the preview | axe-core (WCAG 2.0 A/AA, 2.1 AA, 2.2 AA) on the fifteen routes a customer meets — the homepage to the order page, the legal pages, the admin's sign-in and the 404 — at 390 and 1440 | zero violations |

**Not done, and so not claimed:** a real contact submission on the preview (it would write a row the client sees) ·
the homepage's scan reading key numbers on the preview (it waits there with the key numbers until vehicle data opens
them) · anything on a real iPhone (116) · Safari's own numbers for LCP (WebKit does not report them).

### The copy review's smaller points (128), with the editor's proposals — applied by 16.10.

| Where | Now | Proposed |
|---|---|---|
| header, footer, FAQ, 404 | „FAQ“ · „Fragen und Antworten“ · „Meistgestellte Fragen“ · „Häufige Fragen lesen“ | „Häufige Fragen“ everywhere |
| homepage vs listing | „17 Felgen“ counts designs, „44 Felgen im Sortiment“ counts finishes | „17 Modelle“ on the homepage tiles |
| listing with a filter that finds nothing | „0 Felgen im Sortiment“ · „Keine Felgen für diese Filter.“ | „0 von 44 Felgen“ · „Keine Felge passt zu diesen Filtern.“ |
| vehicle selector | the third field is „Fahrzeug“, the step says „Variante“ | „Variante“ |
| listing, Felgenrechner, homepage | „Breite (Zoll)“ with „8,5“ · „Felgenbreite“ with „8,5J“ · „Maulweite“ | „Felgenbreite“, values „8,5J“ |
| product details, hero | „66,6 mm“, „15,4 kg“, „280 km/h“ with an ordinary space | the narrow no-break space of the format helper (R-10) |
| FAQ, contact, homepage, RIMIFY-Check | „Kompatibilität sofort prüfen“, „Fragen zur Passform?“, „Passt diese Felge auf mein Auto?“ | „Eine bestimmte Felge prüfen“, „Fragen zu einer Felge?“, „Darf diese Felge an mein Auto?“ |
| homepage, RIMIFY-Check | „Wähl …“ beside „Wähle …“ | „Wähle …“ throughout |
| homepage | „Stehen zwei Fahrzeuge hinter einem Schlüssel“ | „Gehören zu einer Schlüsselnummer mehrere Fahrzeuge“ |
| homepage, product page | „Kompletträder für mein Fahrzeug“; „montiert und gewuchtet“ three times; „Nur Felgen“ · „Komplettrad“ | „Kompletträder für dein Fahrzeug anzeigen“; once; „Nur Felgen“ · „Kompletträder“ |
| basket, product page, cards, footer | „Menge“/„Anzahl“, „pro“/„je Felge“, „zzgl. Versand“/„zzgl. Versandkosten“ | „Anzahl“, „pro Felge“, „inkl. MwSt., zzgl. Versandkosten“ |
| product page, tyre table | column „Leistung“ | „Motorleistung“ |
| checkout | „Hierhin schicken wir dir Infos …“; „Vollständiger Name *“; the asterisk unexplained | „An diese Adresse schicken wir dir die Bestellbestätigung.“; „Vor- und Nachname *“; „* Pflichtfeld“ |
| Felgenrechner | „Link zu dieser Rechnung“; „Aktuell“ beside „bisher“ | „Link zu dieser Berechnung“; „Bisher“/„Neu“ |
| homepage, brand wall | „Noch keine Felgen auf Lager“ | „Zurzeit keine Felgen lieferbar“ |
| basket | the Mesh 20's „Eintragung … erforderlich“ twice in a row | once, as on the product page |
| homepage, FAQ | „Eintragung erforderlich"? with an ASCII quote | „Eintragung erforderlich“? |
| homepage › scan | „Fahrzeugschein scannen“ (desktop) beside „fotografieren“ (phone) | one verb |
