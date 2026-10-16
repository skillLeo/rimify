# #19 — the reviews the client already has, scoped on three questions (not built)

The operator's briefs: 16.10.2026 („THE HERO SAYS (VIELLEICHT)“ §3) — scope an importer for reviews he already has,
with source, date and rating per row, the source beside the average, build nothing yet; 17.10.2026 (§3) — the three
questions, the trap inside the third, and the design that follows from its answer. Scoped on that basis; sized below.

## The three questions, ready to send

The third decides the design; the first two decide how the reviews get in and whether there is anything honest to show.

1. **„Wo stehen deine Bewertungen heute – bei Google, bei Trustpilot, in deinem alten Shop oder woanders?“**
   Decides whether this is a paste, a CSV or an interface, and whether we can link the source.
2. **„Wie viele sind es, und hat jede ein Datum, eine Sternebewertung und einen Namen?“**
   Without a date and a rating there is nothing honest to display.
3. **„Geht es in den Bewertungen um deinen Shop – Beratung, Versand, Service – oder um bestimmte Felgen?“**
   The trap: a Google rating of his shop is not a review of a wheel. Shown under a wheel as that wheel's rating, it is
   the § 5 UWG problem we refused to build, in other clothes.

## What stands today (D-103)

- `reviews` holds only buyers' reviews: every row hangs on an order line (`order_id`, `order_line_id` NOT NULL, unique),
  `verified` is true, the rating is 1–5 (`chk_review_rating`). Nothing in the admin can create one.
- `ReviewSummary` writes the average and count of the **visible** rows into `wheel_models.rating` / `rating_count`; the
  tile, the product page and the comparison read only those two columns.
- The product page shows no stars until there is a review, and says how reviews are checked (§ 5b Abs. 3 UWG):
  „Alle Bewertungen stammen von Kundinnen und Kunden, die diese Felge hier gekauft haben. Wir prüfen das über die
  Bestellnummer.“ — a sentence that stops being true the day one imported review stands beside it.
- The shop emits no structured data at all — no JSON-LD, no `aggregateRating`.

## The design, by the answer to question 3

### A — reviews of his shop (Google, Trustpilot): a block of their own, never on a product

| | |
|---|---|
| Where | One block about the shop — the homepage's trust area or the footer, and „Über uns“ if it comes — never on a product page, a tile, the listing, the comparison or the basket. Never in a product's `aggregateRating`, now or when structured data is added; at most an `Organization` rating, and only from a source whose terms allow it. |
| What it says | The average and the count as the source shows them, the date they were taken („Stand: 12.10.2026“), the source named and linked („Bewertungen bei Google ansehen“). Optionally up to three reviews with date, stars and the name as the source prints it. |
| The checking sentence (§ 5b Abs. 3 UWG) | Beside the block: „Diese Bewertungen stammen aus unserem Google-Profil. Wir prüfen nicht, ob unsere Kundinnen und Kunden sie geschrieben haben.“ — weaker than our own verified-buyer line, and lawful. Our line stays beside our own reviews. |
| How they get in | **A1 — entered by hand:** the admin types the average, the count, the link and the date, and the excerpts if wanted; one Protokoll entry per change. **A2 — imported:** single reviews by CSV or paste (date, stars, name, text), the block computing its average from them. **A3 — read live from the source's interface:** needs an API key only he can supply, entered in the admin (R-16's rule for credentials), and the source's own display terms. |
| R-17 | Only what is on record: „laut Google, Stand …“, never „geprüft“, never a claim about reviews we do not hold. |

### B — reviews of the wheels (his old shop): on the product, beside ours, each set with its own sentence

The importer as scoped on 16.10, with the operator's rules: imported per wheel, the source shown beside the average
(„4,9 · 13 Bewertungen – 9 aus unserem früheren Shop, 4 von Käuferinnen und Käufern bei RIMIFY“), each imported review labelled with its
source and date and never called a verified purchase. Two checking sentences, each beside its own set — ours as today,
and for the imported ones „Diese Bewertungen haben wir aus unserem früheren Shop übernommen.
Ob sie von Käuferinnen und Käufern dieser Felge stammen, haben wir nicht geprüft.“
Imported reviews stay out of any `aggregateRating`; if structured data comes, only RIMIFY's verified buyers count there.

| Part | What it does |
|---|---|
| Schema | `reviews.source` (`rimify` for buyers; `altshop` … for imported rows), `source_label` (as printed), `source_ref` (the row's ID or link at the source, unique per source — a second import of the same file adds nothing), `reviewed_on`, `author_display` (optional), `import_id`. `order_id` / `order_line_id` become nullable, with a check that a `rimify` row has its order line and an imported row has none and is never `verified`. |
| Admin screen | Bewertungen › Importieren: CSV or paste (comma, semicolon or tab; German dates and decimals, a BOM, quoted fields). Columns: wheel (slug, name or SKU), source, date, rating, text and author (optional), reference (optional). |
| Dry run | Every row checked before anything is stored, as the catalogue import does it: unknown wheel, a rating outside 1–5, a date missing or in the future, a duplicate reference, a text over 1.000 characters — each refusal said in a sentence. |
| Import and undo | One import is one batch: one transaction, one Protokoll entry (source, count, who), taken back as a batch — never by date. The averages are recomputed for the wheels it touched. |
| Rights | Importing and undoing: who may edit orders (`orders.edit`); each a Form Request and a Policy check (R-11). |

## Size

| If he answers | What is built | Size |
|---|---|---|
| Shop reviews only, entered by hand (A1) | the block, its admin card, the checking sentence, Pest + Vitest, one Playwright look | **1–1½ days** |
| Shop reviews only, imported (A2) | A1 + the parser, the dry run, import and undo | **about 2½ days** |
| Shop reviews read live (A3) | A2 without the file, with the interface, its key in the admin and a nightly refresh | **3–4 days**, once he has a key |
| Wheel reviews only (B) | as scoped on 16.10 | **about 3 days** |
| Both (A2 + B) | one parser and one dry run serve both | **about 4 days** |

Every size includes its tests, the on-record ledger for the new sentences (R-17), the copy editor's reading and the
release.
