# RIMIFY — the cookies the shop sets

For the Kanzlei writing the Datenschutzerklärung (BLOCKED.md, row 4). The legal body text is theirs to
write (D-024); this sheet only states the facts that text must cover. The shop's own cookie list, in the
footer under *Cookie-Einstellungen*, shows the same categories. No statistics or marketing service is
configured, so no cookie here needs consent to be set. Whether the functional cookie counts as "strictly
necessary for a service the user explicitly requested" (§ 25 Abs. 2 Nr. 2 TDDDG) is for the Kanzlei to
confirm.

| Cookie | Category | What it holds | Set when | Lifetime | Flags |
|---|---|---|---|---|---|
| `rmf_vehicle` | Notwendig | The id of the vehicle the visitor chose, and whether they chose it deliberately | A vehicle is chosen | 90 days | encrypted, HttpOnly, SameSite=Lax |
| `rmf_garage` | Notwendig | The ids of the last five vehicles chosen | A vehicle is chosen | 90 days | encrypted, HttpOnly, SameSite=Lax |
| `rmf_papiere` | **Funktional** | For up to five vehicles: the vehicle id and three figures the visitor typed from their own Zulassungsbescheinigung Teil I — 8.1 and 8.2 (zulässige Achslast vorn/hinten, kg) and T (Höchstgeschwindigkeit, km/h). For up to five vehicles, the body style (Karosserieform) and kind of drive (Antriebsart) the visitor chose where the vehicle data has neither, as two digits. No name, no registration number, no VIN. At most 500 bytes | Only when the visitor enters figures on a product page and presses *Werte übernommen*, or chooses a body style or kind of drive the check asks for; removed by *Werte löschen* and by deleting those answers | 1 year | HttpOnly, SameSite=Lax, Secure in production; not encrypted (it holds nothing but these figures, and the server re-checks each one) |
| `rmf_geraet` | **Funktional** (listed so since 29.09.2026, Block G) | A random 40-character key and nothing else — no name, no vehicle, no history. The shop's rate limits count against it instead of the visitor's IP address, so customers who share one mobile network address are never turned away together | The first shop request that has none (never in the admin) | 1 year | encrypted, HttpOnly, SameSite=Lax, Secure in production |
| `rmf_consent` | Notwendig | That the cookie notice was acknowledged, and when | *Verstanden* is pressed | 12 months | SameSite=Lax, Secure on HTTPS; written by the browser |
| `rmf_view` | Notwendig | A layout preference (`desktop` / `mobile`), only when a `?view=` link is opened | A `?view=` link is opened | 7 days | SameSite=Lax |
| Session cookie | Notwendig | The session id (basket, form state) | Every visit | 120 minutes | encrypted, HttpOnly, SameSite=Lax |
| `XSRF-TOKEN` | Notwendig | The form-protection token | Every visit | 120 minutes | SameSite=Lax |

`rmf_papiere` moves into the customer's account once customer accounts exist; the cookie is then no longer
set for a signed-in customer (REMAINING.md, item 10).

The shop shows these facts itself, from one list (`resources/js/legal/cookies.ts`): in *Cookie-Einstellungen*
the two functional cookies by name, each with what it stores and how to clear it, and on the Datenschutz page
a table of every cookie below the Kanzlei's text (`#cookies`). That table is facts, not the legal text.

Stripe (Block G): on the checkout only, Stripe.js is loaded from js.stripe.com to take the payment; Stripe
sets its own cookies there for fraud prevention (`__stripe_mid`, `__stripe_sid`). No Stripe script is on any
other page. The Kanzlei decides how the Datenschutzerklärung names Stripe as a processor.
