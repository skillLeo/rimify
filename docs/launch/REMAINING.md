# RIMIFY — what is left

Only this. Everything done is in `DONE.md`, with its commit; every decision taken without asking is in
`docs/decisions.md`.

## Block G — payments (ours, once the keys are here)

- [ ] 29 · Stripe as the payments brief says, built against test keys only (R-16): `pk_test_…`, `sk_test_…` and the
      `whsec_…` from `stripe listen`, written into `.env` by hand. With it the tenth money surface — the §14 UStG
      invoice PDF (DONE item 19) — and a second look at the checkout's limits (D-044)

## Yours — the six things only a person can do

1. **Release the two Gutachten** on the preview after checking them against the PDFs: *Gutachten › ABE 55255*
   (draft #10, 140 rows, 70 cars) and *Gutachten › 366-0350-21-WIRD/N1* (draft #11, 110 rows, 55 cars). Then
   price and publish BORBET DB8GT2 (*Katalog › Felgen*) — until then no product page is public on the preview,
   and `rimify:smoke`'s product rows (the page without JavaScript, the lookup, the PDF, the test order) have
   nothing to check
2. **The Stripe test keys** — `pk_test_`, `sk_test_`, `whsec_` (Block G)
3. **The vehicle dataset** — the client's purchase (KBA, TecDoc or DAT); it brings the HSN/TSN the Gutachten cars
   still lack
4. **ABE 53841** — the base document of the 18″ Nachtrag, from the client; with it the 18″ tyre answer for fast
   cars and the missing-base sentence go away
5. **A pass on a real iPhone** — Safari's scrolling and the camera for the papers, which no emulator proves
6. **The production deploy** — by GO-LIVE.md, when you say so. It includes §6's two cron lines in hPanel; the
   preview needs them too (the renderer watchdog and the scheduler — `remote.sh` printed them, it did not write
   them)

## The gates, last run (2026-09-29)

| Where | What | Result |
|---|---|---|
| Local | Pest, with coverage | 1.992 / 1.992 passed; **92,9 %** of lines (18.206 of 19.590; min 85 %) |
| Local | Vitest, with coverage | 1.298 / 1.298 passed in 128 files |
| Local | Larastan level 6, Pint, vue-tsc, ESLint, stylelint, `secrets:scan` | clean (ESLint: warnings only, no errors) |
| Local | Playwright — main | 312 passed, 70 skipped by project design, 0 failed (25,6 min) |
| Local | Playwright — mobile | 178 passed, 14 skipped by design, 0 failed (9,3 min) |
| Local | `npm run qa` (overflow at 12 widths, console in three engines, axe, style inventory) | clean |
| Preview | `rimify:smoke` | Startseite *auf dem Server gerendert*, Admin-Anmeldung, Speicher-Präfixe ok; the product row (page without JavaScript, lookup, PDF, test order) waits for item 1 — no public product yet |
| Preview | `npm run qa` against https://rimify.skillleo.com | clean — overflow at 12 widths, console in Chromium, WebKit and Firefox, axe 0 violations, every style a token; the product route left out (none public, D-051) |
| Preview | Rollback, down to the smoke's last row | 14,4 s (GO-LIVE §7) |
