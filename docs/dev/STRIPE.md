# Stripe in RIMIFY

How the shop takes money, how to test it with test keys, and what the live shop needs. Keys never enter this
repository (R-16, `docs/dev/SECRETS.md`): not here, not in a test, not in a commit message.

## How a payment runs

1. The checkout's third step mounts Stripe's **Express Checkout** (Apple Pay, Google Pay) and the **Payment
   Element** with the publishable key; Stripe.js comes from `js.stripe.com` on `/kasse` only (the CSP admits it
   nowhere else).
2. **„Zahlungspflichtig bestellen“** lets Stripe check its fields (`elements.submit()`), then
   `POST /kasse/zahlung` decides everything again on the server — refusals, stock, and what the page showed
   (`CheckoutShown`: verdicts, Auflagen, Gutachten revisions, prices). Only then is the order written (verdicts
   frozen, stock reserved) and the PaymentIntent created at the order's total, `eur`, automatic payment methods,
   idempotency key `rmf-pi-{order}-{total}`.
3. The browser confirms (`stripe.confirmPayment`), 3-D Secure on the way; a decline is answered on the page.
4. Stripe sends the customer to `/bestellung/{number}` — **which pays nothing**. The page polls
   `/bestellung/{number}/status`.
5. The signed webhook `payment_intent.succeeded` at `POST /webhooks/stripe` pays the order — for its own total
   only; any other amount is recorded and flagged. Then the basket empties, the §14 invoice is issued and the
   confirmation mail (AGB, Widerrufsbelehrung, Muster-Widerrufsformular, invoice attached) goes out.

Unpaid orders expire after 24 hours (`orders:expire`, every ten minutes by the scheduler) and their stock goes
back. Refunds are made on the admin's order page, chargebacks answered under Verkauf › Rückbuchungen — both
through the API only.

## Test keys (the day they arrive)

The user types them into `.env` by hand — never echoed, never committed, never pasted into a chat:

```
RIMIFY_PAYMENTS=stripe
STRIPE_MODE=test
STRIPE_KEY=pk_test_…
STRIPE_SECRET=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…
```

or, preferably on the preview, in **Einstellungen › Zahlung** (encrypted at rest, shown as dots and the last four
characters). Then „Verbindung testen“ names the account, its country, currency and payment methods. Anything
printed while testing masks a key to its last four characters.

### Webhooks on a laptop: `stripe listen`

```bash
stripe login                                   # once, in the browser, with the Stripe account's test mode
stripe listen --forward-to http://localhost:8000/webhooks/stripe \
  --events payment_intent.succeeded,payment_intent.processing,payment_intent.payment_failed,payment_intent.canceled,charge.refunded,charge.dispute.created,charge.dispute.closed
```

`stripe listen` prints a `whsec_…` for this session: that one goes into `.env` as `STRIPE_WEBHOOK_SECRET` (it
differs from the dashboard endpoint's). Leave it running while testing; each event prints a line with its answer
(`200`).

### Webhooks on the preview

Stripe-Dashboard (test mode) › Entwickler › Webhooks › Endpunkt hinzufügen:
`https://rimify.skillleo.com/webhooks/stripe`, with exactly the seven events above (`StripeGateway::EVENTS`).
Its signing secret goes into Einstellungen › Zahlung. `rimify:preflight` checks the endpoint is registered,
enabled and sends every event.

### Test cards

| Card | What happens |
|---|---|
| `4242 4242 4242 4242` | paid at once |
| `4000 0027 6000 3184` | 3-D Secure: the bank's page asks; „Complete“ pays, „Fail“ declines |
| `4000 0000 0000 0002` | declined (`card_declined`): the checkout says so, everything typed stays, a second try uses the same order |
| `4000 0000 0000 9995` | declined, insufficient funds |
| `4000 0000 0000 0259` | paid, then a chargeback (`charge.dispute.created`) — it appears under Verkauf › Rückbuchungen |

Any future expiry date, any CVC, any PLZ. SEPA test IBAN `DE89 3704 0044 0532 0130 00` pays after a delay
(„Zahlung läuft“, then paid).

### What to check by hand, once

1. A guest buys DB8GT2 (released and priced) with `4242…`: the order page says „wird bestätigt“, then paid; the
   mail arrives with the invoice; the admin shows the order paid with its invoice.
2. With `4000 0027 6000 3184`: the 3-D Secure page, then paid.
3. With `4000 0000 0000 0002`, then `4242…`: the decline on the page, the address still filled in, one order.
4. Open the return address of an unpaid order by hand: it stays unpaid (also a feature test).
5. Refund part of it on the admin's order page: Stripe's dashboard shows the refund, the customer mail carries
   the credit note.
6. `4000 0000 0000 0259`: the chargeback appears under Rückbuchungen with its deadline; answer it once.

The Playwright flows for these (`e2e/payments.spec.ts`) run against Stripe's test mode once the keys are there.

## The live shop

- Live keys are typed by a person into Einstellungen › Zahlung **on the production site** — nowhere else. The
  app refuses a live key outside production and a test key in Livemodus.
- The live webhook endpoint (`https://<domain>/webhooks/stripe`, the seven events) in the live dashboard; its
  secret in Einstellungen › Zahlung.
- **Apple Pay:** Stripe-Dashboard › Einstellungen › Zahlungsmethoden › Apple Pay › Domain hinzufügen, then place
  the file Stripe offers at `public/.well-known/apple-developer-merchantid-domain-association` on the live
  domain (GO-LIVE §4.3). Google Pay needs no file.
- `rimify:preflight` must show Zahlung „Stripe im Livemodus“ and the Stripe-Webhook row GO.
