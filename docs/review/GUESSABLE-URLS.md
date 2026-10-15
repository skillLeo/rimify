# GUESSABLE-URLS — the client's admin item 18, checked on 14.10.2026

For: the operator, who has to decide today whether item 18 is an Article 33 question.

**Item 18 says** the order confirmation `/bestellung/RMF-2026-XXXX` can be read by guessing the number. **It cannot, and
never could on the preview.** The number in the address is display only: the page opens for the browser that placed the
order (its session), through the signed link in the confirmation mail, or for the signed-in account that owns it.
Anyone else gets the same 404 as an order that does not exist. The guard has been in the code since 27.09.2026
(`c56f71dc`), two weeks before the preview's first order (10.10.2026).

**Proven on the preview today**, as a stranger (no cookies, plain GET):

| Address | Answer |
|---|---|
| `/bestellung/RMF-2026-0001` (the client's) | 404, 122.469 bytes |
| `/bestellung/RMF-2026-0002` (the client's) | 404, 122.469 bytes |
| `/bestellung/RMF-2026-0003` (the smoke's) | 404, 122.469 bytes |
| `/bestellung/RMF-2026-0999` (does not exist) | 404, 122.469 bytes — the same page, byte for byte |
| `/bestellung/RMF-2026-0001/status` | 404 |
| `/bestellung/RMF-2026-0001?signature=000…` (forged) | 404 |

**The access logs.** The hosting account holds no web-server access log (`~/.logs` has cron and git logs only; LiteSpeed's
logs stay on Hostinger's side, in hPanel if anywhere). So a walk of the numbers cannot be ruled out from the files — but
it would not matter: every answer to such a walk was the 404 above, so no name, address or purchase was ever readable by
number. **No personal data was disclosed; this is not an Article 33 question.**

## Every other address with a parameter, and its shape

| Address | Shape | Who can open it |
|---|---|---|
| `/bestellung/{Nummer}`, `/status` | sequential number, display only | A seeded order opens by number. An order that came through the checkout requires its signed link (or the browser that placed it, or the account it was placed under) — always, in every environment, whatever it contains. |
| `/bestellung/{Nummer}/konto` (POST) | sequential number | the placing browser only, paid orders only, CSRF |
| `/rechnung/{Nummer}` | sequential invoice number | signed link only, expires after 30 minutes; the file lives under the bucket's private `invoices/` (403 to anyone) |
| `/bewertung/{Nummer}` | order number | signed link only, expires (the invitation's 30 days) |
| `/kasse/testzahlung/{Nummer}` | order number | signed link only, expires in minutes; sandbox only |
| `/konto/passwort/{id}` | numeric account id | signed link only, expires, and dies when the password changes (fingerprint) |
| `/rimify-check/ergebnis/{token}` | 32 random letters and digits | anyone with the link — it is the share link; it holds a car and a wheel, no personal data |
| `/benachrichtigung/bestaetigen/{token}`, `/abmelden/{token}` | 64 random characters each | anyone with the mail's link |
| `/vorschau/seite/{id}` | numeric page id | signed link only, expires; a draft of a shop page, no personal data |
| `/admin/einladung/{token}` | 20–128 random characters | the invited person; throttled to 6 a minute |
| Gutachten PDF (`/storage/ABEs/…` or the bucket's `ABEs/…`) | 26-character ULID file name | anyone with the link — a public document, no personal data; the bucket lists nothing to strangers |
| Exports (orders, Protokoll, Übersicht) | no stored file — streamed | admin with the export right; every export is written to the Protokoll |
| System › Zurücksetzen › Rückgängig | no token — a POST | Super-Admin, after re-entering the password, test environments only, throttled |
| `/warenkorb/{Zeile}` | line id in the session | only the session that holds the basket |

Changed since this check: who may open an order is decided by where it came from, never by what it contains — the
first line of the table (EIGENE-FUNDE 131, D-238). The mail's link is to expire after twelve months, an expired one
leading to a page that sends a fresh link to the address the order went to (your answer of 15.10.2026; not built yet).
