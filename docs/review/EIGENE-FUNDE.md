# EIGENE-FUNDE — what we found ourselves on the public pages

Our own findings, written before the client writes them: numbered from 100 so they can never be confused with his list
(1–34). One row per finding — the page, what is wrong in one sentence a shop owner understands, how serious, and where
it stands. Admin-side observations are in `ADMIN-GEFUNDEN.md` (from 500), recorded and not fixed.

**Severity.** S1 wrong information, a broken purchase path or a legal gap · S2 a dead end, a visibly broken layout, a
console error · S3 copy, consistency, polish · S4 an opinion.

**State of the sweep (14.10.2026).** This is the first pass, not the finished sweep — see „What has been looked at“ at
the end before reading the count as a result.

| Nr | Page | What is wrong | Sev. | State |
|---|---|---|---|---|
| 100 | Product page › „Originaltext anzeigen“ | Two conditions that contradict each other — „only fine-link snow chains“ and „no snow chains“ — stood side by side with nothing saying which tyre size each belongs to. | S1 | **Fixed** (13.10.). Each sentence now stands under the tyre sizes it applies to; tests fail on the old code. |
| 101 | Order confirmation e-mail | A condition that names an EG type-approval number (`e1*93/81*…`) lost its asterisks: the e-mail printed part of the number in italics. One of the 177 conditions in the three Gutachten was affected. | S1 | **Fixed** (13.10.). E-mails print every value literally; all 177 conditions are tested. |
| 102 | Contact form › the two e-mails it sends | Text typed by a visitor was read as formatting: a typed link became a real link, a typed image address loaded a remote image — also in the copy the shop sends to whatever address the visitor entered. | S1 | **Fixed** (13.10.), same change as 101. |
| 103 | Product page, RIMIFY-Check | For a wheel whose Gutachten approves it for the car, the headline reads „Keine Freigabe hinterlegt für …“ and the size is struck through with „… liegt uns für dein Fahrzeug keine Freigabe vor“ — whenever only the *tyres* cannot be confirmed. The row beneath says „Felge: Freigegeben mit Auflagen“. Seen on the preview: BBS LeMans × BMW 3er Coupe 346C (250 km/h, no load table for high speed on record). The wheel also cannot be bought. | S1 | **Open — needs your decision**: it changes what a customer is told about legality. Proposed: headline „Reifen nicht bestätigt für …“ (the wheel row stays „Freigegeben mit Auflagen“), size note „Durchgestrichene Größen können wir für dein Fahrzeug nicht bestätigen.“ The same word on the order page. That the wheel is not sold while the tyres are unconfirmed is the engine's rule (R-03) and is not part of this finding. |
| 104 | Product page, RIMIFY-Check | „Das Gutachten druckt keine Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit.“ states what the document prints. The shop only knows that no table has been *entered* for it; if the document does print one, the sentence is wrong. | S1 | **Open — needs your decision**, with 103. Proposed: „Zu diesem Gutachten ist keine Tragfähigkeitstabelle für hohe Geschwindigkeit hinterlegt.“ — and in the admin a way to say „this document prints none“, so the stronger sentence is only said when someone has said it. |
| 105 | Product page › „Gutachten öffnen“ | The link answered with an error page (403) for both of the client's documents: storage had been switched to the bucket after he uploaded them, and the files stayed behind. | S2 | **Fixed** on the preview (13.10.) by copying the two files over, verified. The cause is in the admin: `ADMIN-GEFUNDEN.md` 501. |
| 106 | Listing, basket | With a real Gutachten's long conditions a product tile grew to 2,500 px and a phone's basket to 9,900 px. | S2 | **Fixed** (13.10.). Long conditions are counted on the tile and unfold in the basket; no sentence is cut. |
| 107 | Listing | Above wheels that could be ordered with the test payment the page said they could not be ordered yet. | S3 | **Fixed** (13.10.). |
| 108 | Listing tile, basket | A single counted condition was called „1 Auflage“ although it could be a mere note. | S3 | **Fixed** (13.10.): „1 Auflage oder Hinweis“. |
| 109 | Contact form | The „too fast“ spam check let a message through after 2.1 seconds instead of 3. | S3 | **Fixed** (13.10.). |
| 110 | Listing (`/felgen`), also with a car and in the search | The product photos in the first row are loaded „lazily“, although they are the first thing on screen — the page paints later than it could. | S3 | Open. Recommendation: load the first row at once, the rest lazily. Cheap. |
| 111 | Vehicle picker (`/felgen-suchen`) | The page's headings skip a level: the title is followed directly by a third-level heading („Mit Schlüsselnummern“). Screen readers announce a gap. | S3 | Open. Recommendation: make it a second-level heading. Cheap. |
| 112 | Listing on the phone | Product names are third-level headings directly under the page title (on the desktop „Filter“ sits between them as the second level). | S3 | Open. Recommendation: one visually hidden second-level heading „Felgen“ above the tiles, on every width. Cheap. |
| 113 | Homepage | The same section is called „Was wir zusagen“ on the desktop and „Was RIMIFY zusagt“ on the phone. | S3 | Open. Recommendation: one name. Cheap. |
| 114 | Homepage on the phone | The second wheel photograph in the hero loads lazily although it is on the first screen. | S4 | Listed, not acted on: the first photograph is the one that counts for the first paint. |
| 115 | Product page | The client's own finish names are English („Black Gloss“, „Blue Gloss“) in an otherwise German shop. | S4 | Listed: his entries, his choice. |
| 116 | Homepage › „Wir lesen das Gutachten“ on an iPhone | In the WebKit test browser the small print of the example table is crushed together; in Chrome it is drawn correctly. | — | **To be checked on a real iPhone** (we have none): likely the test browser's handling of the condensed font, not Safari's. One look at `/#h4`. |

## What has been looked at, and what has not

Looked at, on the preview (release `d126238d`), Chromium 1440 × 900 and WebKit 390 × 844, 25 pages each — homepage,
listing (plain, filtered, a filter with no hits, with a car, the search), product page (without and with a car),
vehicle picker, RIMIFY-Check (plain and with a car), Felgenrechner, compare (empty), basket (empty), checkout
(without a basket), account, FAQ, contact, the legal index and five legal pages, the 404 — with `scripts/qa/sweep-public.mjs`:

| Class | What the pass checked | Found |
|---|---|---|
| 2.1 Content | placeholder and English words, raw codes, prices with a point, a missing space before €, ISO dates | nothing by machine (115 by eye) |
| 2.2 Dead ends | every internal link on every page asked once (62), links without a destination | **nothing** |
| 2.3 Empty states | values that are only a dash or empty | **nothing** real (the dash in the example Gutachten table is the document's) |
| 2.4 Layout | page wider than the window, stretched images, controls on top of one another | **nothing** real (the sticky price bar over scrolled content is intended) |
| 2.5 Consistency | — | 113; **the term list is not made yet** |
| 2.6 Meaning | bare codes outside the pictured document, a price without a word about VAT, `mailto:`, same-family conditions as ungrouped neighbours | 103, 104 (by reading the screen, not by the script); the script's checks: **nothing** |
| 2.7 Accessibility | heading order, one h1, inputs without a label, alt text | 111, 112; **axe not run on the preview yet** (it is green locally, `npm run qa`) |
| 2.8 Technical | console errors, crashes, failed requests, any 4xx/5xx; a landmark twice | **nothing** (the 404 page's own 404 is expected) |
| 2.9 Speed | lazy above the fold, images without `srcset` | 110, 114; **LCP and CLS not measured for the record** — this machine was busy, and numbers from it would mislead |

**Not done yet, and so not claimed:** the German copy review over every public page · twelve widths from 320 to 1920
and the short heights · a product page in each of the five verdict states (the preview has two: „Mit Auflagen“ and the
case of 103) · the basket with one and with many lines, and the checkout to the point before payment · signed in as a
customer · the Fahrzeugschein path · a real contact submission · the Gutachten PDF opening at its page · the 500 page ·
the list of terms used for the same thing (2.5) · speed on a quiet machine (2.9).

Sixteen entries so far, ten of them fixed in the last two days, two waiting for a decision, four small ones open.
