# #19 — the review importer, scoped (not built)

The operator's brief of 16.10.2026 („THE HERO SAYS (VIELLEICHT)“ §3): scope an importer for reviews the client already
has, by CSV or pasted from a spreadsheet, with source, date and rating per row, and the source shown beside the average.
Tell the size of the job and build nothing yet.

## What stands today (D-103)

- `reviews` holds only buyers' reviews: every row hangs on an order line (`order_id`, `order_line_id` NOT NULL, unique),
  `verified` is true, the rating is 1–5 (`chk_review_rating`). Nothing in the admin can create one.
- `ReviewSummary` writes the average and count of the **visible** rows into `wheel_models.rating` / `rating_count`. The
  tile, the product page and the comparison read only those two columns.
- The admin (Verkauf › Bewertungen) can hide a review with a reason and answer it.
- The product page shows no stars until there is a review, and says how reviews are checked (§ 5b Abs. 3 UWG).
- No structured data (`aggregateRating`) is emitted.

## What the importer would be

| Part | What it does |
|---|---|
| Schema | `reviews.source` (`rimify` for buyers; `altshop`, `google`, … for imported rows), `source_label` (as printed), `source_ref` (the row's ID or link at the source, unique per source — so a second import of the same file adds nothing), `reviewed_on` (the date the source gives), `author_display` (as the source shows it, optional), `import_id`. `order_id` / `order_line_id` become nullable, with a check that a `rimify` row has its order line and an imported row has none and is never `verified`. |
| Admin screen | Bewertungen › Importieren: upload a CSV or paste from a spreadsheet (comma, semicolon or tab; German dates and decimals, a BOM, quoted fields). Columns: wheel (slug, name or SKU), source, date, rating, text (optional), author (optional), reference (optional). |
| Dry run | Each row checked before anything is stored, the way the catalogue import does it (Probelauf): unknown wheel, rating outside 1–5, a date in the future or missing, a duplicate reference, a text over 1.000 characters. Each refused row says why; the rest can be imported. |
| Import and undo | One import is one batch: stored in one transaction, one Protokoll entry (source, count, who), and the whole batch can be taken back again — the rows of one import, never by date. The averages are recomputed for the wheels it touched. |
| The product page | The average and the count as today, the sources beside them — e.g. „4,9 · 13 Bewertungen – 9 aus deinem früheren Shop, 4 von Käufern bei RIMIFY“. Each imported review is labelled with its source and date and is never called a verified purchase. The sentence on how reviews are checked names both kinds (§ 5b UWG; R-17: only what is on record — „übernommen aus …“, never „geprüft“). |
| The list and the tile | The average includes imported reviews; the tile shows it as now. |
| Structured data | If `aggregateRating` is ever emitted, imported reviews stay out of it (search engines' rules forbid ratings taken from other sites). Noted, nothing to build now. |
| Rights | Importing and undoing an import: who may edit orders (`orders.edit`), each a Form Request and a Policy check (R-11). |

## Size

About **three working days**, tests included: schema, model and the summary with sources ½ day · parser, dry run,
import and undo with its screen 1–1½ days · product page, list and the wording ½ day · Pest (parser, refusals, batch,
undo, rights, averages), Vitest (the line with sources), one Playwright walk, the on-record ledger for the new
sentences, and the release ½–1 day.

## What the client has to answer first

1. **Which reviews, from where?** Product reviews from his old shop can be matched to a wheel. Google reviews are about
   the shop, not a wheel — they would need a different place (a shop rating), which is not this job.
2. **The file itself:** an export from his old shop system (which one?) or a sheet he fills in by hand.
3. **Names:** show the author as the source shows it, initials only, or not at all.
