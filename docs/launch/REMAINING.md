# RIMIFY — what is left

Only this. Everything done is in `DONE.md`, with its commit; every decision taken without asking is in
`docs/decisions.md`; what the client must supply, with where it goes, is in `BLOCKED.md`.

## Ours — each waits on one of yours

- [ ] **§6 · With the Stripe test keys** (yours 2): the payment flows in Playwright against Stripe's test mode — a
      guest buys DB8GT2 with `4242…`, with 3-D Secure (`…3184`), and with a decline then a retry keeping every typed
      field (`…0002`); a refund reaching Stripe; a simulated chargeback on Rückbuchungen. The webhook fixtures are
      then recorded with `stripe listen` in place of the hand-written ones, and the preview's endpoint registered so
      the preflight's Stripe-Webhook row turns GO. `docs/dev/STRIPE.md` is the script.
- [ ] **§7 · After the release and the price** (yours 1): `rimify:smoke` with its product rows, output verbatim;
      `npm run qa` with the product routes and D-051's exemption removed; the rollback once more against GO-LIVE §7
      (last: 14,4 s); the renderer watchdog proven after the cron lines (yours 3) — kill it, a minute later the socket
      answers.

## Yours — only a person can do these

1. **Release the two Gutachten** on the preview after checking them against the PDFs (*ABE 55255*, draft #10;
   *366-0350-21-WIRD/N1*, draft #11), then **price and publish BORBET DB8GT2**. Until then no product page is public
   there and nothing can be bought.
2. **The Stripe test keys** — `pk_test_`, `sk_test_`, `whsec_` — typed into Einstellungen › Zahlung on the preview (or
   `.env`), never into a chat.
3. **The two cron lines in hPanel** for the preview (GO-LIVE §6): the renderer watchdog and the scheduler. Since
   Block G the scheduler also expires unpaid orders after 24 hours and gives their stock back.
4. **A pass on a real iPhone** — Safari's scrolling, the camera for the papers, Apple Pay in the checkout.
5. **The production deploy** — by GO-LIVE.md (§4.3 is new: the live keys, the webhook, the Apple Pay domain file),
   when you say so.

## The client's — the preflight names each until it is given

- **Before any sale:** the seller's legal name, address and USt-IdNr. or Steuernummer (BLOCKED 19 — until then every
  invoice is a TEST invoice); the shipping price and the delivery time (20); the legal texts from their lawyer (4);
  the manufacturer of every brand sold, for GPSR (21); the mail sender domain with SPF, DKIM, DMARC (5).
- **For the catalogue:** the vehicle dataset (16) and ABE 53841 with its tyre speed table (18).

## The gates, last run (2026-09-30, on `accfa858`)

| Where | What | Result |
|---|---|---|
| Local | Pest on MariaDB 11.8 (the host's engine) | 2.109 / 2.109 passed (13 min) |
| Local | Vitest | 1.328 / 1.328 passed in 131 files |
| Local | Larastan level 6, Pint, vue-tsc, ESLint | clean (ESLint: warnings only, no errors) |
| Local | Playwright — main | 317 passed, 71 skipped by project design, 0 failed (25,9 min) — with `e2e/kasse.spec.ts` (keyboard only at 320 px) and the review's `e2e/bugs/pay-01`, `pay-02` |
| Local | Playwright — mobile | 178 passed, 14 skipped by design, 0 failed (9,0 min) |
| Local | `npm run qa` (overflow at 12 widths, console in three engines, axe, style inventory) | clean |
| Preview | Release `c7ed307d` (of `accfa858`) by `remote.sh`, staging | four migrations, renderer on its socket, site up |
| Preview | `rimify:preflight` | GO with warnings: the cron line, the log mailer, the sandbox, the client's data (seller, shipping and delivery time, legal texts) — each a row |
| Preview | `rimify:smoke` | Startseite *auf dem Server gerendert*, Admin-Anmeldung, Speicher-Präfixe (invoices/ not public) ok; the product row waits for yours 1 |
| Preview | `npm run qa` against https://rimify.skillleo.com | clean — overflow at 12 widths, console in Chromium, WebKit and Firefox, axe 0 violations, every style a token; the product route left out until one is public (D-051, removed in §7) |
