# RIMIFY — what is left

The one list of what remains, from the final consolidation brief of 2026-09-28. Top to bottom. A line is
ticked only when its commit exists; the hash follows it. A line already done before the brief says so. If a
session is lost, the next one resumes at the first unticked line.

**§0 · Secured before anything else:** `1436cb23` (K2-01 brand names, S1), `95a68852` (K2-02 logo
transparency), `d3ab4de8` (smaller server-side items), `d39b2609` (the ten look fixes), `4bf51004` (K2-17
seeder, test to follow).

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

- [ ] 1 · Auflagen scoped per document (`gutachten_auflage`, unique on document + code), the global catalogue
      migrated into its documents; an unresolved code is UNKNOWN and blocks publishing; the A01-under-two-
      documents test
- [ ] 2 · Eintragung erforderlich derived from an `abnahme` Auflage, per tyre size; read-only with its code;
      an override needs an audited, displayed reason
- [ ] 3 · No auto-resolution between documents: verdict per document, the document named; a genuine
      disagreement goes to Konflikte and shows UNKNOWN
- [ ] 4 · The record's shape: Nachtrag and EG-Typgenehmigung, `nachtrag_zu`, Anlage, Prüfbericht-Nr,
      Ausfertigung, Benennungsnummer, Prüfort, Stand, gültig ab Fertigungsdatum; a supplement without its
      base shown on the record, the coverage matrix and to the customer; the twelve Auflage types,
      `auflage_nacharbeit`, `befestigungsmittel`, `gutachten_pflichthinweis`
- [ ] ai-look-critic and interaction-qa on the block

## Block C — vehicles

- [x] 5 · `quelle` on the vehicle (`import_kba` … `entwicklung`), `entwicklung` never released, anywhere —
      `9c4e74cd` (before this brief)
- [x] 6 · The 74 development cars: references reported (STATUS, `1ca5a2d4`), `entwicklung` + `is_demo` +
      `demo_ref`, covered by `demo:purge` / `demo:assert-clean`, BUGS.md DATA-01 at S1 — `7f9446a5`,
      `fce5bdfb` (before this brief; `docs/qa/` is kept out of git, so BUGS.md lives in the working copy)
- [ ] 7 · „Fahrzeug aus diesem Gutachten anlegen“ in step 5, `quelle = gutachten` with document and page
- [ ] 8 · The later merge path: EG number + Fahrzeugtyp, dry-run diff, never duplicates or breaks a released row
- [ ] 9 · R-03 split: wheel verdict from type and kW band, tyre verdict CONDITIONAL without axle loads and top
      speed, combined never PERMITTED while the tyre part is open; R-03 amended in CLAUDE.md with the hash
- [ ] 10 · The optional 8.1 / 8.2 / T fields, saved per vehicle for logged-in customers, the load-index sum
      shown with the derating table from page 6 of ABE 55255; the scanner reads 8.1, 8.2, T and P.2
- [ ] ai-look-critic and interaction-qa on the block

## Block D — the golden record

- [ ] 11 · ABE 55255 and Gutachten 366-0350-21-WIRD/N1 entered through the admin flow and released by a human
- [ ] 12 · Borbet DB8GT2: both sizes, both colours, the four photos, the client's description, the documents'
      values where they differ
- [x] 13 · DATA-CONFLICTS.md conflict 1 (72,5 vs 72,6) — `a876e4cc` (before this brief)
- [ ] 14 · The missing base ABE 53841 visible on the record, in the coverage matrix and to the customer
- [ ] 15 · The customer view: two-line verdict, Abnahme, Arbeiten am Fahrzeug with the mm profiles, the bolt
      set with torque and add-to-basket, tyre sizes with load index and axle limits, the notes incl. the 50 km
      check, the PDF at the right page
- [ ] 16 · The §7 acceptance fixtures, against the documents
- [x] 17 · HSN/TSN at the top of BLOCKED.md with the sources — `a876e4cc` (before this brief)
- [ ] ai-look-critic and interaction-qa on the block

## Block E — the launch release leftovers

- [x] 18 · The example catalogue is demo and leaves with `demo:purge`; no third state — `e11d06a4` (before)
- [ ] 19 · The money sweep: `Money`, one `formatMoney`, MoneyDisplayTest — **9 of 10 surfaces** today
      (`e05bd971`, set of four included); the invoice PDF is not built and arrives with the payments brief's
      §14 UStG invoice, so the tenth surface is added there
- [x] 20 · The mobile suite fixed and clean three times in a row — `28d2d633`, `f6694522` (before)
- [ ] 21 · The coverage number, measured with pcov, in the ledger
- [x] 22 · Review kit: the feedback row with its screenshot (`bb87bdb6`, ReviewKitTest), three visibly
      different admins (`af0ef57c`), `review:report` → OPEN-POINTS.md (`16249b5a`) (before)
- [x] 23 · `secrets:scan`, the pre-commit hook, the history sweep (clean, COMPLIANCE row 21), R-16 in
      CLAUDE.md — `e8f807b2`, `16249b5a` (before)
- [x] 24 · COMPLIANCE.md, all 32 rows answered; row 13: **RESTRICT**, not an S1, pinned by a test —
      `16249b5a`, `0e472447` (before)
- [ ] 25 · The final gates on every page: G1, G4, G5, G6 at twelve widths, three browsers, the OKLab check

## Block F — go live

- [ ] 26 · The rollback rehearsal, timed, the number written down (there is no staging: rehearsed locally on
      a scratch copy of the database — said as a deviation)
- [ ] 27 · GO-LIVE.md complete — written (`08ada467` onward, the no-JS price check and the first hour are in);
      §7 waits for the rehearsal's timings
- [ ] 28 · PRESENT.md — written (`af0ef57c`, `a809a0ec`); the walkthrough is rewritten on the Borbet golden
      record after Block D
- [ ] ai-look-critic and interaction-qa on the block

## Block G — payments

- [ ] 29 · Held until the test keys (`pk_test_`, `sk_test_`, `whsec_` from `stripe listen`) arrive; then the
      payments brief as written
