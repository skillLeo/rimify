# RIMIFY — what is done

The ledger of the final consolidation (brief of 2026-09-28) and the last prompt (2026-09-29): every line with the
commit that did it. What is still open is in `REMAINING.md` — only that.
**§0 · Secured before anything else:** `1436cb23` (K2-01 brand names, S1), `95a68852` (K2-02 logo
transparency), `d3ab4de8` (smaller server-side items), `d39b2609` (the ten look fixes), `4bf51004` (K2-17
seeder, test to follow).

## First — bring the hero back (the operator's brief of 28.09.2026, ahead of the list)

- [x] The hero wheel and the numbers section's photograph restored on the client's official Borbet DB8GT2
      pictures, the numbers section photograph-first (Maulweite, Zoll, Lochkreis, Mittenlochbohrung, KBA on
      the photo; ET on the cross-section), „hier 8,5J“ no longer glued by a translator; placeholder scope and
      the protected-elements rule in CLAUDE.md; docs/design/PROTECTED.md (P1–P9, with the audit of what
      changed since approval); e2e/protected.spec.ts at 1440 and 390, fails legibly when an element goes;
      ai-look-critic's eight fixes taken — `94418abf`. Caption reads the 18″ (the photographed stamp is KBA
      53841); the two Gutachten still wait for a human release (item 11)

## Block A — finish the QA batch

- [x] K2-17: the seeder test — `5dd194c1`
- [x] K2-03, K2-04, K2-05: the focus bugs — `78fc4049` (`useFocusAfter`) — one cause (focus set while the target is disabled or inside the
      menu's focus trap), fixed once; asserted in the specs
- [x] The drop marker where the photo lands (K2-07); a dropped file never opens in the tab (K2-08); Enter
      submits the add form (K2-09); new brands at the end of the wall (K2-12); the import file field's
      errors (K2-21); the smaller browser items (K2-06, K2-11, K2-22) — `78fc4049`
- [x] Every K2 spec green at 1440 and 390 (31 passed with the Katalog specs); the full Pest suite (1805, three failures fixed in `d20884e2`, the files re-run green); BUGS.md updated
- [x] K2-15 (CSS-styled SVGs) and K2-10 (interrupted upload) left open with a one-line reason each (BUGS.md)
- [x] ai-look-critic and interaction-qa on the block — both ran (the look pass, and the re-review
      K2-29 … K2-44); their findings fixed in `a7b2b21e`, `c5e93d76`, `740fb68b`, `a5793e39`; the K2, Marken/Fotos
      and KATALOG-09 specs green at 1440 and 390 (33 passed, 09d skipped on the phone by design); K2-10, K2-15
      and K2-24 stay open with their reasons

## Block B — the Gutachten model corrections

- [x] 1 · Auflagen scoped per document (`gutachten_auflage`, unique on document + code), the global catalogue
      migrated into its documents; an unresolved code is UNKNOWN and blocks publishing; the A01-under-two-
      documents test — `89e61480` (table `document_conditions`, see docs/specs/gutachten-model.md; body-style
      and drive codes narrow a row and fail closed)
- [x] 2 · Eintragung erforderlich derived from an `abnahme` Auflage, per tyre size; read-only with its code;
      an override needs an audited, displayed reason — `89e61480`
- [x] 3 · No auto-resolution between documents: verdict per document, the document named; a genuine
      disagreement goes to Konflikte and shows UNKNOWN — `57191f6d` (Konflikte page: „beide gelten jeweils für
      sich“ or „nur Dokument X gilt“, with a reason, audited, Freigeben right)
- [x] 4 · The record's shape: Nachtrag and EG-Typgenehmigung, `nachtrag_zu`, Anlage, Prüfbericht-Nr,
      Ausfertigung, Benennungsnummer, Prüfort, Stand, gültig ab Fertigungsdatum; a supplement without its
      base shown on the record, the coverage matrix and to the customer; the twelve Auflage types,
      `auflage_nacharbeit`, `befestigungsmittel`, `gutachten_pflichthinweis` — see the B4 commit below
      (tables `document_condition_reworks`, `document_fasteners`, `document_notices`) — `3eb13651`
- [x] ai-look-critic and interaction-qa on the block — both ran; look: 12 fixes, 10 taken (the brief's
      base-missing sentence kept as written; the key-number formatter left alone), interaction: 4 × S2 and 8 × S3
      fixed with QA's specs `e2e/bugs/b-01…b-04` green at 1440 and 390

## Block C — vehicles

- [x] 5 · `quelle` on the vehicle (`import_kba` … `entwicklung`), `entwicklung` never released, anywhere —
      `9c4e74cd` (before this brief)
- [x] 6 · The 74 development cars: references reported (STATUS, `1ca5a2d4`), `entwicklung` + `is_demo` +
      `demo_ref`, covered by `demo:purge` / `demo:assert-clean`, BUGS.md DATA-01 at S1 — `7f9446a5`,
      `fce5bdfb` (before this brief; `docs/qa/` is kept out of git, so BUGS.md lives in the working copy)
- [x] 7 · „Fahrzeug aus diesem Gutachten anlegen“ in step 5, `quelle = gutachten` with document and page —
      `58d4a199` (HSN/TSN nullable and paired; „HSN/TSN noch nicht hinterlegt“, never „0000“)
- [x] 8 · The later merge path: EG number + Fahrzeugtyp, dry-run diff, never duplicates or breaks a released row
      — `vehicles:merge`, `de15395c`; a `..` extension covers every extension, several dataset cars for one car
      wait for a person
- [x] 9 · R-03 split: wheel verdict from type and kW band, tyre verdict CONDITIONAL without axle loads and top
      speed, combined never PERMITTED while the tyre part is open; R-03 amended in CLAUDE.md with the hash —
      `9cd02ace`; the operator's two reviews in `d40b49c8` (the decision in whole numbers, the rows pinned,
      the index cross-check warns and asks for a reason, demo-seeded tables marked as such)
- [x] 10 · The optional 8.1 / 8.2 / T fields, the load-index sum shown with the document's own derating table;
      the scanner reads 8.1, 8.2, T and P.2 — scanner and drawing `4deda617`, the endpoint, the cookie and every
      surface `b7672e58`, the photo in the form with the P.2 check against the chosen variant `615cbcef`. No
      customer accounts exist yet, so the figures are kept per vehicle in the browser (`rmf_papiere`,
      docs/launch/COOKIES.md); **when login exists they move into the account** and the cookie is merged on
      sign-in, like the garage
- [x] ai-look-critic and interaction-qa on the block — both ran. Look: 12 fixes, all taken (`eb49a8bf`).
      Interaction: 1 × S1, 4 × S2, 4 × S3 fixed (`12af5d2e`), with e2e/bugs/c-01…c-05 green at 1440 and 390 (30 of
      30 over three repeats); C-10 is by design. Running the golden-record walkthrough afterwards found the shop
      saying „kein Gutachten“ where only the tyres were open, and the papers form pushing the purchase below
      the fold — fixed in `5995e15f`, `fcd7b17e`. Open for the operator: the per-axle sum still puts
      „In den Warenkorb“ at about 1.400 px on a 1440 × 900 desktop

## Block D — the golden record

- [ ] 11 · ABE 55255 and Gutachten 366-0350-21-WIRD/N1 entered through the admin flow and released by a human —
      **entered, waiting for the release.** Transcribed from the PDFs into docs/gutachten (legends extracted, rows
      cross-checked cell by cell), typed in by `e2e/tools/gutachten-eingabe.mjs` through the admin's own screens
      and endpoints — `ce5e5501`. On the development shop both are drafts without a release blocker: 55255 #12
      (140 rows, 70 cars), the Nachtrag #13 (110 rows, 55 cars). Entering them found and fixed four engine
      gaps (`cd812177`: body codes read as alternatives, a size's codes narrow that size, one size printed twice,
      the strictest printed symbol) and one form bug (`e9345818`: one code beside several sizes). Not entered:
      M3B and 3 B (national Betriebserlaubnis), measure 27B (in no legend), one `M+S` entry without a winter code,
      and the Nachtrag's page-24 Hinweisblatt (drawings and a code list; removed from draft #13 in `585942a5`) —
      each with its reason in docs/gutachten
- [x] 12 · Borbet DB8GT2: both sizes, both colours, the four photos, the client's description, the documents'
      values where they differ — `94418abf` (GoldenRecordSeeder; a draft at no price until the client sends
      one; the 19″ product-page note „Abbildung zeigt die 18-Zoll-Ausführung“ — `0eee744a`)
- [x] 13 · DATA-CONFLICTS.md conflict 1 (72,5 vs 72,6) — `a876e4cc` (before this brief)
- [x] 14 · The missing base ABE 53841 visible on the record, in the coverage matrix and to the customer — built in
      Block B, now asserted with the real Nachtrag in all three places (`b6d50b2a`)
- [ ] 15 · The customer view: two-line verdict, Abnahme, Arbeiten am Fahrzeug with the mm profiles, the bolt
      set with torque and add-to-basket, tyre sizes with load index and axle limits, the notes incl. the 50 km
      check, the PDF at the right page — **all but the add-to-basket** (`b6d50b2a`; below the purchase in
      `27ed26e9`, designed in `05469e0f`, sizes, sets and our own words told apart in `6512c530`; the 19″ photo
      note `0eee744a`). The shop sells no accessory and no price exists for the bolt sets 5248, 5275, 5276, 5284:
      the set, thread, seat, shaft length and torque are shown, the button waits for a product and a price
- [x] 16 · The §7 acceptance fixtures, against the documents — `42067d46`, extended in `b6d50b2a`
      (BorbetAcceptanceTest: both documents typed in through the endpoints and released there in the test).
      §7 says PERMITTED for BMW 1er 187 on 235/35R19; the four states answer CONDITIONAL, because the row
      carries A01 (Abnahme) and body work (R-07)
- [x] 17 · HSN/TSN at the top of BLOCKED.md with the sources — `a876e4cc` (before this brief)
- [x] ai-look-critic and interaction-qa on the block — the look review's fixes in `05469e0f` (a sticky buy bar on
      the desk is left to the operator); the interaction review found one S1, five S2, nine S3 and two S4:
      D-05 `efc8f392`; D-06, D-14, D-15 `094a6f5c`; D-02 `0ae22d1a`; D-03 `585942a5`; D-01, D-04, D-07–D-12
      `6512c530` (their German by copy-editor-de in `cd969373`), each S1/S2 with a Vitest or Pest regression. D-11 covers the new link only — „Gutachten
      öffnen“ and „So haben wir gerechnet“ are still under 44 px on touch. D-13 (column gaps) is the split's
      intent; D-16 and D-17 (S4, WebKit ignores `#page=N`) stay open. The review's Playwright specs need the
      throwaway review shop and are run by hand, not in the suite: all 16 pass against it (D-01's rewritten for
      the fix — the link now adds no history entry, so there is no Back to test). Gates after the fixes: Pest
      1.950/1.950, Vitest 1.283/1.283, Larastan, Pint, ESLint, stylelint, vue-tsc clean

## Block E — the launch release leftovers

- [x] 18 · The example catalogue is demo and leaves with `demo:purge`; no third state — `e11d06a4` (before)
- [ ] 19 · The money sweep: `Money`, one `formatMoney`, MoneyDisplayTest — **9 of 10 surfaces** today
      (`e05bd971`, set of four included); the invoice PDF is not built and arrives with the payments brief's
      §14 UStG invoice, so the tenth surface is added there
- [x] 20 · The mobile suite fixed and clean three times in a row — `28d2d633`, `f6694522` (before)
- [x] 21 · The coverage number, measured with pcov, in the ledger — **92,6 %** (STATUS item 5; min 85)
- [x] 22 · Review kit: the feedback row with its screenshot (`bb87bdb6`, ReviewKitTest), three visibly
      different admins (`af0ef57c`), `review:report` → OPEN-POINTS.md (`16249b5a`) (before)
- [x] 23 · `secrets:scan`, the pre-commit hook, the history sweep (clean, COMPLIANCE row 21), R-16 in
      CLAUDE.md — `e8f807b2`, `16249b5a` (before)
- [x] 24 · COMPLIANCE.md, all 32 rows answered; row 13: **RESTRICT**, not an S1, pinned by a test —
      `16249b5a`, `0e472447` (before)
- [x] 25 · The final gates on every page: G1, G4, G5, G6 at twelve widths, three browsers, the OKLab check —
      `npm run qa` clean, OKLab in Vitest (palette.test.ts), every suite green (STATUS item 10). The first full
      run failed 23 tests; four were real bugs, fixed: the collapsed admin rail's toggle could not be clicked
      (`7cbac119`); the verdicts widget shrank under its skeleton (`c0214ee4`); the mobile homepage jumped up
      to 634 px under the finger on iPhones, so taps landed elsewhere (`736d250e`); every rate limit shared
      one counter per user or IP, so searching could lock a customer out of „Bestellen“ (`b1df00f3`). The rest
      were specs behind the product's own changes (`39cf74f7`, `a2ed0bc2`), the proof shots retaken (`0adec718`)

## Block F — go live

- [x] 26 · The rollback rehearsal, timed, the number written down — **6,8 s** down to the smoke test's last row,
      smoke 7/7 (GO-LIVE §7). Deviation: there is no staging, so it ran locally on a scratch copy of the
      database; the host's own time stays with the user (BLOCKED row 13)
- [x] 27 · GO-LIVE.md complete — written (`08ada467` onward); §7 has the rehearsal's timings, and §1 compares
      the dump's triggers with the live database's instead of a fixed count that had gone stale (13 → 14)
- [x] 28 · PRESENT.md — the walkthrough on the Borbet golden record (`b876ad50`); it found that the chooser
      showed a split car's halves alike (fixed, `2aa57bb3`) and that most cars of the two documents answer
      „Keine Freigabe hinterlegt“ until body style and drive are known — a decision for the operator
- [x] ai-look-critic and interaction-qa on Blocks E and F — the look review (Feld K squeezed, cut mid-number,
      „und später“ read as a date, not in one helper) fixed in `bcaa1eae`, checked by eye at 375, 900, 1024
      and 1440. The interaction review: EF-01 (S1, no car a Gutachten names could be chosen on the homepage —
      needs_review rows were refused; now named, not refused, as /felgen-suchen does), EF-02, EF-03 and part
      of EF-06 in `f6d0115f`; EF-04 `4ccb295a`; EF-05 and EF-07 `ec7f8ea4`; EF-09, EF-10, EF-11 `7b23cc73`.
      Its specs e2e/bugs/ef-01…05 pass (not seen failing first: the reviewer had no shell; the Vitest and
      Pest regressions do fail on the old code). Open: EF-06's garage chips (both halves read „BMW 1er-Reihe“
      if one customer chose both), EF-08 (storefront limits are per IP — a carrier's shared address shares
      them; inherent to limiting guests)

## Block G — payments (the prompt „EVERYTHING TO LAUNCH-READY“, 29.–30.09.2026)

- [x] §1 · The host is MariaDB 11.8.9, the suite ran on MySQL 8.4.9 (S1): the suite now runs on MariaDB by default
      and on MySQL too, CI has one leg each, the app refuses an engine the suite has not run against — `1411c342`
      (D-052). Foreign keys into `order_line_fitments` are RESTRICT; none point into `audit_logs` — nothing to
      change. The Nachtrag prints no tyre speed table: every car over 210 km/h answers UNKNOWN on the 18″, with its
      sentence; Abdeckung lists the gap; BLOCKED 18 — `0601ae25` (D-053)
- [x] §2 · Stripe behind `PaymentGateway`: PaymentIntent at the order's total with an idempotency key; the signed
      webhook stored raw under its event id, work after the 200; paid only on `payment_intent.succeeded` for the
      order's own amount; the order state machine in the model; stock held from the order to its death unpaid;
      `orders:expire` — `f8cc2dc2` (D-054, D-055). Einstellungen › Zahlung — `62967b73`. The checkout: Payment
      Element, the Express place, the order written only at the button after the server re-checks what the page
      showed (`CheckoutShown`), the return address paying nothing, the basket emptied only when paid, blur checks,
      typing kept in the tab, billing behind an unchecked box — `315b2bc4` (D-056 … D-061); PLZ → Ort — `7efa09f4`;
      an account after the order in one click — `545afead` (D-068); keyboard-only at 320 px (`e2e/kasse.spec.ts`)
- [x] §3 · „Zahlungspflichtig bestellen“ and the §312j block above it; the Muster-Widerrufsformular page; the
      §312f mail with AGB and Widerrufsbelehrung in its text — `315b2bc4`; GPSR per brand on every product page, the
      cookie facts (rmf_papiere, rmf_geraet functional, with how to clear them), the price note in the hero, the
      TTDSG test — `3b5a27e4` (D-062 … D-064)
- [x] §4 · §14 invoices and credit notes: gapless per series, stored once with their checksum, signed links; a
      TEST series for test orders; invoice = order = PaymentIntent to the cent in one test — `315b2bc4`
- [x] §5 · Refunds from the order page through the API only, credit note, mail, Protokoll; Verkauf › Rückbuchungen
      with the deadline counted down and the evidence sent once — `3fadaa85` (D-065, D-066)
- [x] §8 · `rimify:preflight` covers the payment mode and the webhook, queue, scheduler, engine, invoices, seller,
      shipping and delivery time, legal texts, GPSR, secrets — `42d9d156`
- [x] §9 · A key-number miss says „… die Daten für dieses Fahrzeug noch nicht hinterlegt“ and never guesses —
      `e23f6307` (D-067); the 18″ record names its missing base (Abdeckung)
- [x] The copy review of the whole block, and what it found underneath (reply-to, signed mail link, the invoice on
      the order page) — `25f25f36` (D-069, D-070); `docs/dev/STRIPE.md`, GO-LIVE §4.3 — `52c452b5`;
      `docs/launch/HOST-FINDINGS.md`
- [ ] §6 · With the test keys: the Playwright payment flows against Stripe's test mode (paid, 3-D Secure, declined
      and retried, a chargeback), recorded webhook fixtures in place of the hand-written ones
- [ ] §7 · After the release and the price on the preview: the smoke with the product rows, `npm run qa` with the
      product routes (D-051 removed), the rollback once more, the renderer watchdog after the cron lines

## The last prompt (2026-09-29)

- [x] §0 · The standing decision rule in CLAUDE.md §9; `docs/decisions.md` (lower case, D-031) carries D-031 … D-049
- [x] §1.1 · Karosserieform and Antriebsart: derived from an unambiguous word of the name first, asked second, in
      plain words with silhouettes, kept per car in `rmf_papiere`, frozen in the snapshot with their source —
      `f27d9a8d`, `19ab5335`, `f28c10a0`, `e283f31e`, `6a5081cf`
- [x] §1.2 · Each document keeps its own words: the per-document body-code map, DATA-CONFLICTS Nr. 5 — `136be8b5`
- [x] §2 · EF-01 kept, the missing field named with what it unlocks; the recent-car chips carry Feld K and the
      type — `84fefd68`, `6a5081cf`; rate limits keyed on a device cookie with a ×10 address ceiling over every
      request, checkout exempt, the warning once a minute — `60b8d7d0`, `6a5081cf`; the review file notes its specs
      were never seen failing, with the regression behind each fix
- [x] Reviews of this round: look (10 fixes, `e283f31e`), interaction (G-01 … G-14: six S2 fixed with the review's
      own tests, which failed on the old code in the gate run; G-08 and G-13 left with a reason, D-044, D-046),
      copy (two passes, taken)
- [x] §4 · Deployed to the preview as staging by GO-LIVE.md; the renderer moved to a socket file, because the host
      reaches no TCP port a customer's process opens — no page on the preview had ever been server-rendered
      (`cbf439ce`, D-047); both Borbet documents entered through the admin (drafts #10 and #11, 140 and 110 rows);
      the rollback rehearsed on the host and timed (14,4 s, after the first run exposed §7.2's DEFINER failure);
      where the runbook was wrong is written at the end of GO-LIVE.md; the preview runs `ce08c074` (a lost database connection ends in an error, not a recursion — found when the local MySQL stopped under the gates)