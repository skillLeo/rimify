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
| `rmf_papiere` | **Funktional** | For up to five vehicles: the vehicle id and three figures the visitor typed from their own Zulassungsbescheinigung Teil I — 8.1 and 8.2 (zulässige Achslast vorn/hinten, kg) and T (Höchstgeschwindigkeit, km/h). No name, no registration number, no VIN. At most 500 bytes | Only when the visitor enters figures on a product page and presses *Werte übernommen*; removed by *Werte löschen* | 1 year | HttpOnly, SameSite=Lax, Secure in production; not encrypted (it holds nothing but these figures, and the server re-checks each one) |
| `rmf_consent` | Notwendig | That the cookie notice was acknowledged, and when | *Verstanden* is pressed | 12 months | SameSite=Lax, Secure on HTTPS; written by the browser |
| `rmf_view` | Notwendig | A layout preference (`desktop` / `mobile`), only when a `?view=` link is opened | A `?view=` link is opened | 7 days | SameSite=Lax |
| Session cookie | Notwendig | The session id (basket, form state) | Every visit | 120 minutes | encrypted, HttpOnly, SameSite=Lax |
| `XSRF-TOKEN` | Notwendig | The form-protection token | Every visit | 120 minutes | SameSite=Lax |

`rmf_papiere` moves into the customer's account once customer accounts exist; the cookie is then no longer
set for a signed-in customer (REMAINING.md, item 10).
