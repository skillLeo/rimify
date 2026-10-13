# SELBSTTEST — the client's 34, walked by hand

For: the operator, before the client sees any of it. One check per item of his list „Rimify Changes“, in his numbering.
Each says where to go, at which size, what to press in which order, and the one thing to look at. The automated twin
of every check is `npm run kundenliste` (docs/review/KUNDENLISTE.md, pictures in `docs/qa/shots/kundenliste/`).

## Before you start

- **Address:** `https://rimify.skillleo.com` (the preview). Paths below are relative to it.
- **Which build.** The preview's footer prints `Testumgebung · Stand <commit>`. These checks describe the D-199 commit of
  13.10.2026 or later (`git log --grep D-199`). On 13.10.2026 the preview still stood on `ac0bbcc6`: GitHub Actions refuses to start any job („recent account
  payments have failed or your spending limit needs to be increased“ — GitHub › Settings › Billing & plans), so no
  release has been built since. What `ac0bbcc6` does not have yet: the counted Auflagen on a card and in the basket
  (#22, #15), the listing's sentence about the test payment (#30), and the database rule that keeps a demo wheel
  without a reference from being published (D-196) — the reason the acceptance set is not seeded on that build.
- **Two sizes.** *Desktop* = a browser window 1440 × 900 (Chrome DevTools › Dimensions, or a maximised window on a
  1440-wide screen). *Phone* = DevTools device mode at 390 × 844 (iPhone 12/13/14 preset), or a real phone.
- **A clean window for each check that says so:** a private window, so no car, basket or cookie from an earlier check
  is remembered.
- **The acceptance set must be on the preview** for every check marked ◆. It is `rimify:demo --abnahme`: the
  BORBET DB8GT2 on its two real Gutachten, three demo cars, tyres and the Komplettrad accessories, every row marked
  as demo. It is not seeded yet — you asked me to wait for the client's yes. Tell me he said yes and I seed it on the
  preview (one command; System › Zurücksetzen › Demodaten removes all of it in one press). Until then, the ◆ checks
  show an empty shop.
- **What the acceptance set contains** (names as the shop shows them):

  | | Name | Where it is used below |
  |---|---|---|
  | Wheel | BORBET DB8GT2 — `/felgen/borbet-db8gt2` — finishes *Schwarz matt*, *Bronze matt*; 18 Zoll 229,00 € (Nachtrag 366-0350-21), 19 Zoll 269,00 € (ABE 55255); 12 in stock per size | #9, #14–#18, #20–#22, #25, #28, #34 |
  | Car 1 | BMW 3er (E90) · 320i Limousine (Demo) — key `0005-Z90-00001` | 19 Zoll: *Mit Auflagen*, front/rear pairs only; 18 Zoll: no answer (the Nachtrag prints no table for 222 km/h) |
  | Car 2 | BMW 3er (E46) · 320i Limousine (Demo) — key `0005-Z46-00001` | 19 Zoll: *Mit Auflagen* (Abnahme, Radlauf), three front/rear pairs; 18 Zoll: no answer |
  | Car 3 | BMW X3 (E83) · 2.0d (Demo) — key `0005-Z83-00001` | 19 Zoll: *Mit Auflagen*, Komplettrad with three tyres, one of which needs the Abnahme |
  | Tyres | Laufwerk Sommer S5, 14 sizes | Komplettrad, Mischbereifung |
  | Accessories | Wuchtgewichte Silber/Schwarz; RDKS sensors for BMW at 49,00 € each (demo rows, only where the shop had none) | #15 |

- **Choosing a car.** Either open an address with `?fahrzeug=<key>` from the table (fastest), or use the selector:
  *Marke & Modell* › BMW › the model › the variant. The demo cars have no entry in a vehicle dataset, so the
  *HSN/TSN* tab does not find them — that tab says so in one sentence.
- **No sale and no delivery happen on the preview.** Where a check needs one, it says what stands in for it. A test
  order paid with the *Testzahlung* is possible on the acceptance set; it leaves an invoice behind, and an invoice is
  never deleted — after one, only System › Zurücksetzen › *Shopdaten* (not *Demodaten*) clears the shop again.
- **„Demodaten“** stands in the header while demo rows exist. That is intended (it was in the old strip, #3).

---

## The checks

### 1 · The hero's „Fahrzeug wählen“ in light blue while no car is chosen
- **Where:** `/` in a clean window. Desktop and phone.
- **Do:** nothing first; then press Tab until the button is focused and press Enter; then click it with the mouse.
- **Look at:** the button is pale blue with blue text before a car is chosen; it can be focused (a ring appears); a
  screen reader says „Noch kein Fahrzeug gewählt“; Enter and a click both move the page to the picker and put the
  cursor into its first field, *Marke*.

### 2 · Header higher
- **Where:** `/`. Desktop, then phone.
- **Do:** measure the header bar (DevTools › hover the `header`). Then open `/#h4`. On the desktop open the *Felgen*
  menu. ◆ Then open `/felgen?fahrzeug=0005-Z90-00001` and scroll.
- **Look at:** 72 px on the desktop, 64 px on the phone; the heading „Wir lesen das Gutachten…“ lands just below the
  header, never under it; the menu opens exactly at the header's lower edge; the filter column stays below the header
  and the vehicle bar while you scroll. There is no mobile bottom navigation in the shop (only the admin has one), so
  that part of the item has nothing to show.

### 3 · No strip above the header
- **Where:** `/`. Desktop and phone.
- **Look at:** nothing above the header. What the strip carried is still on the page: „Versand aus Deutschland“ and
  „Gutachten zu jeder Felge“ in the promise row under the hero, the help line with „Mo–Fr 9:00–17:00 Uhr“ under the
  hero's selector, and the „Demodaten“ badge in the header (while demo rows exist).
- **On the preview only:** a slim line „Vorschau — Testumgebung. Es werden keine echten Bestellungen ausgeführt.“ stands
  above the header. It is the test environment saying what it is — never in the live shop — and „Ausblenden“ puts it
  away. Tell the client before he reads it as the old strip.

### 4 · No product link and no price in the hero
- **Where:** `/`. Desktop and phone. Also once on an empty shop (the preview before the acceptance set is seeded).
- **Do:** hover and click the hero's wheel photograph.
- **Look at:** it is not a link (no hand cursor, nothing happens); no „€“ anywhere in the hero; the measurements on
  the photo (ET, Lochkreis, Mittenlochbohrung, KBA number) stay; with an empty shop the hero is complete all the same.

### 5 · „Meistgekaufte Felgen“ instead of „Felgen mit den meisten Freigaben“
- **Where:** `/`. Desktop.
- **Look at:** with fewer than four wheels in the shop — the acceptance set has one model — the shelf is absent, not
  empty. With four or more it reads „Meistgekaufte Felgen“ once something has sold in the last 90 days, else „Neu im
  Shop“, newest first. On the preview that means: absent today. *Stand-in:* the automated test checks both headings on
  the e2e shop's full catalogue (picture `05-1440.png`).

### 6 · The highlight in „Wir lesen das Gutachten“ off its row at some window sizes
- **Where:** `/`, scrolled to „Wir lesen das Gutachten. Du bekommst die Antwort.“
- **Do:** use DevTools' responsive mode at 1440 × 900, 1440 × 720, 1280 × 620, 1024 × 768, 1366 × 768, 1920 × 1080 and
  2560 × 1080; scroll the section through each time.
- **Look at:** the yellow highlight lies exactly on the BMW row at every one of the seven sizes.

### 7 · The hero jumps when switching „Marke & Modell“ / „HSN/TSN“ / „Fahrzeugschein scannen“
- **Where:** `/`. Desktop and phone.
- **Do:** click the three tabs back and forth, slowly, watching the button under them and the section below.
- **Look at:** nothing moves — not the button, not the page below. (Measured: zero layout shift during the switches;
  the room for the tallest tab is reserved in the server's first frame.)

### 8 · The car in the address, to save and share
- **Where:** ◆ `/felgen` in a clean window. Desktop.
- **Do:** choose the E46 (Marke & Modell › BMW › 3er (E46) › 320i Limousine (Demo)). Copy the address. Open it in a
  second private window. Then in the first window choose the E90, press Back, then click a wheel tile.
- **Look at:** the address carries `?fahrzeug=0005-Z46-00001`; the second window shows the same wheels with the same
  answers without choosing anything; after Back the page and the next click are the E46's (the product page's address
  says `0005-Z46-00001`), never the E90's. View the page source: `<link rel="canonical" …?fahrzeug=0005-Z46-00001>`.

### 9 · A real example wheel in the turning wheel
- **Where:** ◆ `/`, scrolled to the dark band „Kompletträder – montiert und gewuchtet“. Desktop and phone.
- **Do:** scroll slowly; then click the caption under the wheel.
- **Look at:** the wheel is the client's own photograph of the BORBET DB8GT2 in Bronze matt and turns with the
  scroll; the caption „Felge im Bild: BORBET DB8GT2, Bronze matt“ opens that product. No Motec image is used: the client
  sent three MOTEC MCR4 shots, but there is no MOTEC wheel with a Gutachten in the shop to link to.

### 10 · „Felgenrechner“ and „Blog“ in the footer
- **Where:** any page, the footer. Desktop and phone.
- **Look at:** „Felgenrechner“ is there and opens the calculator. There is no blog yet, so there is no „Blog“ link —
  it would lead to an empty page. When a blog exists, the link goes in.

### 11 · A better Felgenrechner drawing — judgement
- **Where:** `/felgenrechner`. Desktop, then phone (there under the tab „Neu“).
- **Do:** change the new wheel's ET by −20 mm, then by +20 mm.
- **Look at:** our own cross-section: Einpresstiefe (ET) from the centre plane to the mounting face, Maulweite, and
  beside it the front view with Lochkreis and Mittenlochbohrung; the new wheel visibly moves out and back in the arch.
  Whether it is better than before is yours and the client's call.

### 12 · Contact form on the contact page
- **Where:** `/kontakt`. Desktop and phone. ◆ For the car: choose the E46 first, then open `/kontakt`.
- **Do:** fill name, e-mail, subject, message; send at once. Wait three seconds; send again.
- **Look at:** the car comes ticked („Mein Fahrzeug mitschicken: …“) and can be unticked; the privacy line links the
  Datenschutzerklärung; the first, instant send says „Das ging zu schnell…“ and keeps your text; the second arrives.
  No captcha. Then Admin › Verkauf › Nachrichten shows the message with the car. *Stand-in for the sender's
  confirmation mail:* until Amazon SES is cleared, mail goes to the log; the message itself is kept either way.

### 13 · Cart icon in the phone header, left of the menu
- **Where:** ◆ phone, `/felgen/borbet-db8gt2?fahrzeug=0005-Z90-00001`, add the rims, then `/`.
- **Look at:** the basket icon left of the menu button on both pages, with its count, reachable without opening the menu.

### 14 · Price in the basket ×4 by mistake
- **Where:** ◆ `/felgen/borbet-db8gt2` (no car needed), 18 Zoll, Schwarz matt. Desktop.
- **Do:** for 1, 2, 3, 4 and 5 rims: set the amount, add to the basket, read the panel, open the basket; empty it again.
- **Look at:** one rim is always 229,00 €; the amount's total is 229,00 / 458,00 / 687,00 / 916,00 / 1.145,00 € on
  the product page, in the panel, on the basket line and in the basket's total. *Stand-in for the checkout summary, the
  order line, the invoice and the CSV:* the server test sweeps all nine surfaces at 1 to 5 (`MoneyDisplayTest`, 600
  assertions). To see them by hand, place a test order with the Testzahlung — see „Before you start“ for what that
  leaves behind.

### 15 · Weights, valves and TPMS with „Komplettrad“, none with „Nur Felgen“
- **Where:** ◆ `/felgen/borbet-db8gt2?fahrzeug=0005-Z83-00001`, 19 Zoll, Schwarz matt. Desktop.
- **Do:** choose „Komplettrad“, a tyre, „Mit RDKS-Sensoren“; add; open the basket. Empty it; add „Nur Felgen“; open
  the basket.
- **Look at:** the Komplettrad line lists Felge, Reifen, Montage und Auswuchten and Wuchtgewichte (Silber), each
  „4 × …“ with its price; the summary has its own row „RDKS-Sensoren (4 × 49,00 €)“ with 196,00 €; the VAT row.
  With „Nur Felgen“ none of them. The Gutachten's long Auflagen sit folded behind „… Auflagen und Hinweise aus dem
  Gutachten lesen“ and open in place, so „Zur Kasse“ stays within reach on a phone. **Open question for the client:** valves. No valve is offered on its own yet — which
  valves you fit without sensors is still unanswered (the DB8GT2's Gutachten asks for metal screw-in valves).

### 16 · A panel after „In den Warenkorb“
- **Where:** ◆ `/felgen/borbet-db8gt2`, 18 Zoll. Desktop and phone.
- **Do:** Tab to „In den Warenkorb“, press Enter; press Tab several times, then Shift+Tab; press Escape. Add again
  and press „Weiter einkaufen“.
- **Look at:** a card with the line („4 × BORBET DB8GT2“, 916,00 €), the basket's subtotal, „Weiter einkaufen“ and
  „Zum Warenkorb“; the focus goes into it and stays among its buttons; Escape and „Weiter einkaufen“ close it and the
  focus is back on „In den Warenkorb“; on the phone it covers part of the screen, never all of it.

### 17 · Amount selector beside the price, 4 preselected
- **Where:** ◆ `/felgen/borbet-db8gt2`, 18 Zoll, Schwarz matt. Desktop and phone.
- **Do:** press + until it stops, then − until it stops.
- **Look at:** 4 preselected; the line under the price reads „4 × 229,00 € = 916,00 €“ and follows every step; it
  stops at 8 and at 1 (and at the stock, if fewer than 8 are on the shelf).

### 18 · „Nur Felgen“ / „Felgen + Reifen“, with fitting tyres right there
- **Where:** ◆ `/felgen/borbet-db8gt2?fahrzeug=0005-Z83-00001`, 19 Zoll, Schwarz matt. Desktop.
- **Do:** set 2 rims; choose „Komplettrad“; click each of the three tyres in turn; go back to „Nur Felgen“.
- **Look at:** the RIMIFY-Check panel above answers for the tyre chosen: „Das verlangt das Gutachten mit
  255/40 R19“ with the Abnahme and the Eintragung, „… mit 235/45 R19“ without; the amount is still 2 after switching
  back. Then the E46 at 18 Zoll (`?fahrzeug=0005-Z46-00001`): no answer from the Gutachten, so neither the rims nor a
  Komplettrad can be put in the basket.

### 19 · Reviews under the wheel's name, created in the admin — solved differently
- **Where:** ◆ `/felgen/borbet-db8gt2`; Admin › Verkauf › Bewertungen.
- **Look at:** no stars without reviews; instead „2 Gutachten · für 3 Fahrzeugvarianten freigegeben · Freigabe vor dem
  Kauf geprüft“. In the admin, reviews can be answered and hidden, never written. *Stand-in for a real review:* it needs
  a delivered order; the server tests cover the whole path. Why: invented ratings are misleading advertising under
  § 5 UWG, and § 5b Abs. 3 UWG requires saying how reviews are checked. If he has real reviews elsewhere, they can be
  imported with their source named — only if he asks.

### 20 · Different sizes front and rear
- **Where:** ◆ `/felgen/borbet-db8gt2?fahrzeug=0005-Z46-00001`, 19 Zoll, Schwarz matt, „Komplettrad“. Desktop.
- **Do:** click each pair under „Mischbereifung“.
- **Look at:** only the pairs the ABE 55255 table V19 lists for this car (three), not every combination of its sizes;
  each pair names its number in the table and the page; the minimum per axle with that axle's own load (vorne 880 kg,
  hinten 1.020 kg) and which axle asks more.

### 21 · „Eintragung“ three times on wheels with Auflagen
- **Where:** ◆ `/felgen/borbet-db8gt2?fahrzeug=0005-Z46-00001`, 19 Zoll. Desktop.
- **Do:** read the RIMIFY-Check panel and the section „Was das Gutachten … verlangt“; open „Originaltext anzeigen“.
- **Look at:** the papers' sentence once, in the verdict under its headline, nowhere else; „Originaltext anzeigen“
  shows the Gutachten's sentences as printed, each with its page.
- **Then, one more:** ◆ `/felgen/borbet-db8gt2?fahrzeug=0005-Z83-00001`, 19 Zoll, open „Originaltext anzeigen“. The
  sentence about fine-link snow chains stands under „Nur bei 235/45 R19 und 245/40 R19“, „Die Verwendung von
  Schneeketten ist nicht zulässig.“ under „Nur bei 255/40 R19“ — never in one list. As first built for this item the
  list was flat and the two stood side by side; the full test run found it on 13.10. (D-199), not he.

### 22 · „Vergleichen“ covers „Mit Auflagen“ on the phone list
- **Where:** ◆ `/felgen?fahrzeug=0005-Z46-00001`. Phone at 320, 360, 390 and 414 px wide.
- **Look at:** on every card the „Mit Auflagen“ badge and „Vergleichen“ stand apart, neither cut off. The card
  itself is no taller than the screen: a real Gutachten's Auflagen are paragraphs, so the card says „… Auflagen und
  Hinweise aus dem Gutachten – im Wortlaut auf der Produktseite.“ instead of printing them (before this fix the E46's
  card was 2.500 px tall — found in this suite's own picture, not reported by him).

### 23 · „Mit Auflagen“ yellow only for real Auflagen, configurable — solved differently
- **Where:** Admin › Gutachten › ABE 55255 › Auflagenverzeichnis, column „Im Shop“. ◆ Then `/felgen?fahrzeug=0005-Z46-00001`.
- **Do:** open the level of A01 (the Abnahme).
- **Look at:** every code has a level — Hinweis, Auflage, Nicht zulässig — per document; for an Abnahme or work on the
  body „Hinweis“ cannot be chosen, and the note under the table says why. The shop shows „Mit Auflagen“ only where an
  Auflage-level code applies; a wheel whose codes are all Hinweise reads „Freigegeben“. No free green/yellow switch:
  it would one day let an Abnahme look like nothing to do.

### 24 · Filter scrollbar buggy at the end
- **Where:** `/felgen` on a shop with a long filter column. Desktop at 1440 and 1920 wide.
- **Do:** scroll the filter column to its very end; scroll the page.
- **Look at:** the last option is reachable, the column never runs off the window, the page does not scroll with it,
  and the column keeps its width (no jump as the scrollbar appears). *Note:* the acceptance set's column is short; the
  long one is on the e2e shop's full catalogue (picture `24-1440.png`).

### 25 · Remove the dead „Nur die Felgen bestellen“ button
- **Where:** ◆ `/felgen/borbet-db8gt2?fahrzeug=0005-Z46-00001`, 19 Zoll, „Komplettrad“. Desktop.
- **Look at:** where no Komplettrad of four equal tyres exists, one sentence why, „Schreib uns“, and the „Nur Felgen“
  choice right above it — no „Nur die Felgen bestellen“ anywhere; choosing „Nur Felgen“ makes the basket button work.

### 26 · Every e-mail button leads to the contact form
- **Where:** `/`, `/felgen`, a product page, `/warenkorb`, `/faq`, `/felgenrechner`, `/rimify-check`, `/gibt-es-nicht`;
  then `/impressum`.
- **Look at:** no link opens a mail program; „Schreib uns“ goes to `/kontakt`; the Impressum gives the e-mail address
  as text (§ 5 DDG requires one).

### 27 · Size or brand lost when the car is chosen after it
- **Where:** ◆ `/felgen` in a clean window. Desktop and phone.
- **Do:** click „19“ under Durchmesser (or the brand BORBET); then choose the E90 with Marke & Modell.
- **Look at:** after choosing the car the address reads `/felgen?zoll=19.0&fahrzeug=0005-Z90-00001` (or `marke=BORBET`),
  and the 19 or BORBET filter is still ticked.

### 28 · RIMIFY-Check: car and wheel, an answer for that pair, then buy
- **Where:** ◆ `/rimify-check?fahrzeug=0005-Z83-00001`. Desktop and phone.
- **Do:** choose BORBET › DB8GT2 › Schwarz matt › the 19-inch size. Then change the car to the E46 (`?fahrzeug=0005-Z46-00001`)
  and choose the 18-inch size.
- **Look at:** for the X3: one answer — „Mit Auflagen freigegeben“, what the Gutachten asks, the document and „Gutachten
  öffnen (PDF, Seite …)“ — and „Jetzt kaufen“ with „Komplettrad“ beside it. For the E46 at 18 Zoll: no buy button at
  all, one sentence why. The refusal is the product.

### 29 · Wrong footer on the phone homepage
- **Where:** `/`, `/felgen`, `/kontakt` at 390 × 844 and at 360 × 640.
- **Look at:** the same single footer everywhere, nothing wider than the screen.

### 30 · Filters without a car
- **Where:** ◆ `/felgen` in a clean window. Desktop and phone.
- **Do:** tick „18“ under Durchmesser.
- **Look at:** the filters work and count; no verdict badge on any card; one sentence: „Wähle dein Fahrzeug, um nur
  Felgen zu sehen, die dafür freigegeben sind.“

### 31 · Filter dropdown on the phone
- **Where:** `/felgen` on the phone.
- **Do:** press „Filter“.
- **Look at:** a sheet from below with the same groups, options and counts as the desktop's column.

### 32 · More colour, e.g. light blue sections — judgement
- **Where:** `/`. Desktop and phone, scrolled top to bottom.
- **Look at:** a pale blue-grey band alternating with white, not every section tinted. The pictures
  `32-vorher-1440.png` (bands in the old neutral grey) and `32-1440.png` (now), the same for 390, put both side by side.
- **What the AI-look critic said (13.10.2026), unsoftened:** it does **not** lift the page the way he asked. The band
  reads as a cooler grey, not as light blue — a small gain in structure (white cards stand off a little better), not in
  colour, and he will not notice it unprompted. It is not a pastel wash and does not look self-made; one step bluer
  would be. Three things it found, none changed without your word:
  1. *Band and action tint are now the same colour* — `--c-band-blue` #EBF0F7 against `--c-blue-tint` #E8EDFB is
     1,02 : 1 (calculated). A chosen chip on a band (the „8,5J“ chip in „Was die Zahlen … bedeuten“) keeps its blue border
     and text but loses its fill. Proposed: deepen `--c-blue-tint` to about #DCE5FB (blue text on it 5,9 : 1; 1,10 : 1
     against the band). That token has 32 uses across shop and admin, including the waiting „Fahrzeug wählen“ of #1 — a
     design-system change, so yours to decide.
  2. *It alternates by count, not by area* — hero and Gutachten story are both tinted with only the thin promise row
     between them, so the first 1.900 px read as one slab and the tint stops reading as a tint. Proposed: start white at
     the story. That changes two protected sections' ground (PROTECTED.md P4, P5), so it needs your explicit yes.
  3. *Two clickable tiles carry the band colour* (the brand cell, the „Größe vergleichen“ teaser) while DIRECTION §2 says
     tiles keep the neutral `--c-band`. Either the document gets one sentence or the two tiles go back to neutral.

### 33 · More blue on the homepage, e.g. icons and the chosen selector tab — judgement
- **Where:** `/`, the first screen. Desktop and phone.
- **Look at:** blue on the icons, the chosen selector tab, chosen chips, the focus ring and what can be pressed — and
  nowhere else, so a blue surface never reads as a button. (Counted on the first screen: no more than twelve blue
  elements, none of them neither an icon nor an action.)
- **What the AI-look critic said (13.10.2026):** approved — the blue is under control and on nothing inert. But it is
  too little to answer „a little more colourful“: neither width has a solid blue on the first screen while no car is
  chosen. If he still finds it pale, the one lever is the waiting „Fahrzeug wählen“ in solid blue — which is the
  opposite of what he asked for in #1, so that is a conversation with him, not a change.

### 34 · „Product Detail Page needs …“ — Rückfrage
- **Where:** ◆ `/felgen/borbet-db8gt2?fahrzeug=0005-Z46-00001`.
- **Look at:** the product page as it stands. Nothing was built for this item: the sentence in his list stops after
  „needs“. Please ask him to finish it.
