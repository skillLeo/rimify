# RIMIFY — what the shop stores in a visitor's browser

For the Kanzlei writing the Datenschutzerklärung (BLOCKED.md, row 4), and for the operator, who asked for the
either-or to be resolved with a table (brief of 14.10.2026 §7, of 15.10.2026 §2.2; D-241). The legal body text is the
Kanzlei's (D-024); this sheet states the facts and our answer, entry by entry, to one question: **is it strictly
necessary for a service the visitor explicitly asked for (§ 25 Abs. 2 Nr. 2 TDDDG)?** § 25 covers browser storage as it
covers cookies, so both are here. The same answers are code (`app/Services/Legal/CookieInventory.php`), and the go-live
check „Cookies und Browser-Speicher“ reads them.

## How it lands

**Not everything passes.** Five entries only make the shop more convenient, and one keeps for a year what a visit
needs: the last five cars (`rmf_garage`), the figures typed from the papers for up to five cars for a year
(`rmf_papiere`), recent searches, the checkout's and the contact form's drafts across a reload, and the direction
the phone view slides. No statistics or marketing service exists. So the shop stores things that need consent, and
until one of two things happens the go-live check fails (and with it live payment, like every legal gap):

1. **They go** — kept for the visit only, or not at all. Then nothing needs consent, the notice stops being a consent
   dialog and becomes a quiet line, and it stops being the largest paint on a first visit (the LCP note of 14.10.).
2. **Consent is asked** — with „Ablehnen“ as prominent as „Annehmen“, and the six entries set only after a yes.

Which of the two is a product decision, and the Kanzlei confirms the answers below. **The notice is left exactly as it
is until then** (your brief „FINISH IT“ §1). Its category label „Funktional“ stays with it for now; the purposes
replace it when the notice changes.

## Entry by entry

| Name | Kind | Purpose | Lifetime | Strictly necessary? | Why |
|---|---|---|---|---|---|
| Session and `XSRF-TOKEN` | Cookie | The basket and the protection of every entry against other sites | 120 minutes | **Yes** | Without them there is no basket and no safe order. |
| `rmf_vehicle` | Cookie | The vehicle the visitor chose — only its number in our list | 90 days | **Yes** | Every answer is computed for that car; that is why it was chosen. *For the Kanzlei: 90 days beyond the visit.* |
| `rmf_garage` | Cookie | The last five vehicles chosen, to switch back quickly | 90 days | **No** | Convenience: a car is chosen, not a list of the last ones. |
| `rmf_papiere` | Cookie | 8.1, 8.2 (axle loads), T (top speed), where asked P.2 (power) and 15.1/15.2 (the tyres the papers name, D-242), typed from the papers, for up to five cars; apart from them body style and drive, where the shop asks, for up to five cars as well | 1 year | **No** (as set) | The answer needs the figures during the visit; a year and five cars is more than it needs. „Werte löschen“ clears a car's figures, „Meine Angaben zu Karosserieform und Antriebsart löschen“ its body style and drive. |
| `rmf_consent` | Cookie | That the notice was read, and when | 12 months | **Yes** | Otherwise the notice stands on every page. |
| `rmf_geraet` | Cookie | A random key of this browser, against which the limits on too many requests count | 1 year | **Yes** | Protection against abuse, without locking out visitors behind one mobile-network address. *For the Kanzlei: a year, or the session?* |
| `rmf_view` | Cookie | The view (phone or desktop) a link with `?view=mobile` or `?view=desktop` sets — links we use for demonstrations; the shop has no switch for it | 7 days | **Yes** | Set only when someone opens such a link and so asks for that view. *For the Kanzlei: 7 days, or the session?* |
| `rmf_vorschau` | Cookie | That the „Vorschau“ band was closed | 30 days | **Yes** | The preview only, and only once someone closes the band; the live shop has none. |
| `__stripe_mid`, `__stripe_sid` | Cookie (Stripe) | Stripe's fraud prevention on the checkout | 1 year, 30 minutes | **Yes** | Set by Stripe.js as soon as the checkout's „Zahlung“ step opens — before the payment, also when the visitor then does not pay —, for the payment he starts there. Stripe is to be named as a processor in the Datenschutzerklärung, whose text is still to come. |
| `rmf_compare` | Browser storage (stays) | The wheels the visitor put on the comparison | until he empties it | **Yes** | He puts them there to compare them. |
| `rmf.recent-searches` | Browser storage (stays) | Recent searches, offered under the search field | until he clears it | **No** | Convenience. |
| `rmf.kasse.v1` | Browser storage (tab) | What was already typed at the checkout, in case the page reloads | until the tab closes | **No** | Convenience: the order works without it. |
| `rmf-kontakt-entwurf` | Browser storage (tab) | A message begun in the contact form, in case the page reloads | until the tab closes | **No** | Convenience. |
| `rmf.nav.depth` | Browser storage (tab) | Which way the phone view slides when going back | until the tab closes | **No** | An animation, not a service. |

Flags of the cookies, as before: `rmf_vehicle`, `rmf_garage`, `rmf_geraet` and the session are encrypted, HttpOnly,
SameSite=Lax (Secure in production); `rmf_papiere` is HttpOnly and SameSite=Lax, not encrypted (it holds nothing but the
figures, and the server re-checks each); `rmf_consent` and `rmf_vorschau` are written by the browser, SameSite=Lax.

The admin's own storage (its command palette's recent entries, a refund's draft) belongs to the operator's staff, not
to visitors, and is not in this list.

The shop shows a part of these facts itself, from `resources/js/legal/cookies.ts` (the notice and the table on the
Datenschutz page). That list is left as it is with the notice; every name in it stands in the inventory
(`CookieInventoryTest`).
