# Link matrix — admin action to storefront

Human QA Part B (`HUMAN-QA-FULL.md` §5), on our own instance: each admin action done in the admin as a person does it,
then every storefront place asked again without clearing anything. Written by `scripts/qa/link-matrix.mjs` from the
run of `e2e/kundenliste/link-matrix.spec.ts` and the cells checked by other means; pictures in
`storage/qa-evidence/part-b/` (not in the repository).

**49 cells: 46 PASS · 0 FAIL · 3 n/a.** (The row for #19 was rewritten on 29.10.2026, when the stars typed in the admin
were built — D-344; its cells are checked by the tests named beside them.)

| Admin action | listing | filter-brand | filter-diameter | search-brand | search-model | search-designation | product | json-ld | compare | sitemap | amount-total | cart-holding-it | checkout | cart | search | product-url | rimify-check | admin-order | selector | home | blog | legal-pages | admin-messages | impressum |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Felge angelegt (alle Felder) und veröffentlicht | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| Preis geändert, Felge schon im Warenkorb | ✅ PASS | – | – | – | – | – | ✅ PASS | ✅ PASS | – | – | ✅ PASS | ✅ PASS | ✅ PASS | – | – | – | – | – | – | – | – | – | – | – |
| Namensteile geändert (Modell, Radtypenbezeichnung) | ✅ PASS | – | – | – | – | – | ✅ PASS | – | – | – | – | – | – | ✅ PASS | ✅ PASS | – | – | – | – | – | – | – | – | – |
| Verfügbar → Nicht verfügbar, Felge im Warenkorb | ✅ PASS | – | – | – | – | – | ✅ PASS | ✅ PASS | – | – | – | ✅ PASS | ✅ PASS | – | – | – | – | – | – | – | – | – | – | – |
| Zurückgezogen | ✅ PASS | – | – | – | – | – | – | – | – | ✅ PASS | – | ✅ PASS | – | – | ✅ PASS | ✅ PASS | – | – | – | – | – | – | – | – |
| Auflage level (Hinweis / Auflage) | ✅ PASS | – | – | – | – | – | ✅ PASS | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| Sterne von Hand eingetragen und entfernt (#19) | n/a | – | – | – | – | – | ✅ PASS | ✅ PASS | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| Gutachten released | – | – | – | – | – | – | ✅ PASS | – | – | – | – | – | – | – | – | – | ✅ PASS | – | – | – | – | – | – | – |
| New Fassung released | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✅ PASS | – | – | – | – | – | – |
| Fixed tyre combination (V19, item 8) | – | – | – | – | – | – | ✅ PASS | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| Tyre created | – | – | – | – | – | – | ✅ PASS | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| Vehicle created by hand | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✅ PASS | – | – | – | – | – |
| Vehicle imported (Probelauf) | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✅ PASS | – | – | – | – | – |
| Komplettrad options | – | – | – | – | – | – | ✅ PASS | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |
| Meistgekaufte Felgen | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✅ PASS | – | – | – | – |
| Blog post with photo and table | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✅ PASS | – | – | – |
| Legal page placeholder flag | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✅ PASS | – | – |
| Contact form | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | ✅ PASS | – |
| Shipping price and time | – | – | – | – | – | – | – | – | – | – | – | – | – | n/a | – | – | – | – | – | – | – | – | – | – |
| Company data | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | n/a |

## Every cell

| Action | Place | Result | What was checked | How |
|---|---|---|---|---|
| Felge angelegt (alle Felder) und veröffentlicht | listing | PASS | the plain list without a car | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | filter-brand | PASS | Marke filter | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | filter-diameter | PASS | Durchmesser filter 18 | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | search-brand | PASS | header search by brand | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | search-model | PASS | header search by model | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | search-designation | PASS | header search by Radtypenbezeichnung | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | product | PASS | H1 „Beispielmarke Matrix H2T58 MX H2T58“ | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | json-ld | PASS | ProductGroup name equals the H1 | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | compare | PASS | the compare page names it | browser, link-matrix.spec.ts |
| Felge angelegt (alle Felder) und veröffentlicht | sitemap | PASS | sitemap.xml lists it | browser, link-matrix.spec.ts |
| Preis geändert, Felge schon im Warenkorb | listing | PASS | the tile says 199,00 € | browser, link-matrix.spec.ts |
| Preis geändert, Felge schon im Warenkorb | product | PASS | price line 4 × 199,00 € | browser, link-matrix.spec.ts |
| Preis geändert, Felge schon im Warenkorb | amount-total | PASS | total for four 796,00 € | browser, link-matrix.spec.ts |
| Preis geändert, Felge schon im Warenkorb | json-ld | PASS | offer price 199.00 | browser, link-matrix.spec.ts |
| Preis geändert, Felge schon im Warenkorb | cart-holding-it | PASS | the line in a basket filled at 189,00 € now charges 199,00 € | browser, link-matrix.spec.ts |
| Preis geändert, Felge schon im Warenkorb | checkout | PASS | the checkout totals 4 × 199,00 € | browser, link-matrix.spec.ts |
| Namensteile geändert (Modell, Radtypenbezeichnung) | product | PASS | H1 „Beispielmarke Matrix H2T58b MX H2T58b“ at the old address (or its redirect) | browser, link-matrix.spec.ts |
| Namensteile geändert (Modell, Radtypenbezeichnung) | listing | PASS | the tile names the new model | browser, link-matrix.spec.ts |
| Namensteile geändert (Modell, Radtypenbezeichnung) | cart | PASS | the basket line names the new model | browser, link-matrix.spec.ts |
| Namensteile geändert (Modell, Radtypenbezeichnung) | search | PASS | search finds the new Radtypenbezeichnung | browser, link-matrix.spec.ts |
| Verfügbar → Nicht verfügbar, Felge im Warenkorb | product | PASS | „Nicht verfügbar“, the button off, the reason under it | browser, link-matrix.spec.ts |
| Verfügbar → Nicht verfügbar, Felge im Warenkorb | json-ld | PASS | availability OutOfStock | browser, link-matrix.spec.ts |
| Verfügbar → Nicht verfügbar, Felge im Warenkorb | listing | PASS | the tile says so (or it is left out) | browser, link-matrix.spec.ts |
| Verfügbar → Nicht verfügbar, Felge im Warenkorb | cart-holding-it | PASS | the basket line says it cannot be bought now | browser, link-matrix.spec.ts |
| Verfügbar → Nicht verfügbar, Felge im Warenkorb | checkout | PASS | the checkout cannot be ordered from, and says why | browser, link-matrix.spec.ts |
| Zurückgezogen | listing | PASS | gone from the list | browser, link-matrix.spec.ts |
| Zurückgezogen | search | PASS | gone from search | browser, link-matrix.spec.ts |
| Zurückgezogen | sitemap | PASS | gone from the sitemap | browser, link-matrix.spec.ts |
| Zurückgezogen | product-url | PASS | the old address answers 404 or 410, never 500 | browser, link-matrix.spec.ts |
| Zurückgezogen | cart-holding-it | PASS | the basket opens and says what happened to the line | browser, link-matrix.spec.ts |
| Auflage level (Hinweis / Auflage) | listing | PASS | a level changed shows on the tile's label | e2e kundenliste @kunde-23 (both widths), 28.10.2026 |
| Auflage level (Hinweis / Auflage) | product | PASS | the answer's label follows; an Abnahme can never be a Hinweis | e2e kundenliste @kunde-23 · tests/abnahme batch-e #23 |
| Sterne von Hand eingetragen und entfernt (#19) | listing | n/a | tiles show no stars, typed or bought — only the product page does | — |
| Sterne von Hand eingetragen und entfernt (#19) | product | PASS | typed in the admin, they stand under the name beside their sentence at once, never as „Geprüfter Kauf“; taken off, they are gone (29.10.2026, D-344) | e2e kundenliste @kunde-19 (both widths) · tests/abnahme batch-e #19 |
| Sterne von Hand eingetragen und entfernt (#19) | json-ld | PASS | typed stars never enter the JSON-LD; only the buyers' visible reviews make a rating there | Pest StatedRatingTest · ProductJsonLdTest @admin-214 |
| Gutachten released | product | PASS | the verdict for a matching car, with the Auflagen per axle | Part E cases 2, 4, 5 — read from the shop and worked by hand |
| Gutachten released | rimify-check | PASS | one answer with its Auflagen, document and page | e2e kundenliste @kunde-28 (both widths) |
| New Fassung released | admin-order | PASS | an existing order keeps its frozen snapshot and says the document was replaced since | Pest BestellungDetailTest: says when the Gutachten was replaced since, and keeps the snapshot |
| Fixed tyre combination (V19, item 8) | product | PASS | only the listed pairs, 2 + 2, rear-only sizes never in front | Part E case 4 (three cars, by hand) · e2e @kunde-20 · @admin-208 |
| Tyre created | product | PASS | offered only with its EU label complete, where the document allows its size | Pest ReifenTest @admin-210 |
| Vehicle created by hand | selector | PASS | found by HSN/TSN, lower case and slash included, at once | e2e kundenliste @admin-201 · Part C HSN/TSN journey |
| Vehicle imported (Probelauf) | selector | PASS | counted before writing; refused rows named; cars without T stand under „Zur Prüfung“ | e2e kundenliste @admin-202 |
| Komplettrad options | product | PASS | weights and RDKS only for the Komplettrad, per wheel, priced | e2e kundenliste @kunde-15 · Part A basket picture |
| Meistgekaufte Felgen | home | PASS | by paid orders of 90 days; „Neu im Shop“ before the first sale; hidden under four | e2e kundenliste @kunde-05 |
| Blog post with photo and table | blog | PASS | list, post, footer link; the table renders; no free HTML | e2e kundenliste @admin-211, @admin-212, @kunde-10 |
| Legal page placeholder flag | legal-pages | PASS | placeholder said on the page, noindex, live payments refused while one remains | Pest TestEnvironmentTest · D-319 tests |
| Contact form | admin-messages | PASS | a message sent appears under Verkauf › Nachrichten | e2e kundenliste @kunde-12 |
| Shipping price and time | cart | n/a | not settable yet: the shop says „Versand wird noch festgelegt“ everywhere — a go-live item | Part A basket picture (#14) |
| Company data | impressum | n/a | seller details not entered on this instance: the Impressum says „noch nicht angegeben“; a go-live item | tests/abnahme #26 annotation |
