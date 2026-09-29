# RIMIFY — compliance audit of every prompt so far

Audited on 2026-09-28, **before** any work of the launch release, against branch `release` at `5c360c56`. Every
row was checked in the code, the database or the git history, not from memory. Status is one of
`erledigt` (with the commit), `teilweise` (with what is missing) or `nicht gebaut`.

The column **after** records what the launch release did about it; the audit column is left as it was found.

| # | Item | Status (audit) | Evidence / what is missing | After the launch release |
|---|---|---|---|---|
| **Demo data prompt** | | | | |
| 1 | `num.ts` with `formatNumber`, `formatCurrency`, `formatMoney`, `formatPercent`, `parseNumber`, German | teilweise | `f53414ab`: four of the five. **`formatCurrency` does not exist**, although the ESLint message names it. `format.ts` (`euro`, `decimal`) delegates to `num.ts`. | erledigt — `e05bd971`: `formatCurrency` exists and, like `formatMoney`, takes integer minor units; the minus is U+2212, the space before € U+202F. `euro()` is gone from `format.ts`. |
| 2 | ESLint rule failing on `toLocaleString(` outside that file | erledigt | `f53414ab`, `eslint.config.js`: `toLocaleString` **and** `new Intl.NumberFormat` refused in `resources/js/**` except `lib/num.ts`. No offender today. | erledigt — unchanged; `e05bd971` adds a second rule: no division or multiplication of a cents value outside `num.ts`. |
| 3 | `normalizeViewState()` on both sides of the dirty check, SV-13 five-case test | erledigt | `3a50d656`: `sameViewState` normalises both sides; `viewState.test.ts` „the five cases of SV-13“. | erledigt — unchanged. |
| 4 | KPI tiles render formatted money, not minor units | erledigt | `0e7362e7`: `KpiTile.vue` splits `formatMoney(value)` into figure and unit. | erledigt — unchanged; `MoneyDisplayTest` (Pest) and `MoneyDisplay.test.ts` pin the tiles to the cent. |
| 5 | `DemoDashboardSeeder` with environment guard and `DEMO_DATA=1` | erledigt | `14b7d021`: refuses production and anything but local/staging/testing without `DEMO_DATA=1`; tests „the fence“. | erledigt — unchanged. |
| 6 | `demo:purge`, `demo:reanchor`, `demo:break-queue`, `demo:assert-clean` | erledigt | `14b7d021`: four commands; `demo:assert-clean` scheduled daily in production (`routes/console.php`). | erledigt — `e11d06a4`, `fce5bdfb`: `demo:purge` also takes the example catalogue and hides the development cars; `demo:assert-clean` counts both. |
| 7 | `DemoDataConsistencyTest` — cross-widget invariants | erledigt | `0e7362e7`: `tests/Feature/Demo/DemoDataConsistencyTest.php`. | erledigt — unchanged. |
| 8 | Three charts hand-built in SVG with `d3-scale` and `d3-shape` | erledigt | `e08337f4`, `0e7362e7`: `LineChart`, `BarChart`, `StackedBar` (+ `Sparkline`); `d3-scale`, `d3-shape` only, no chart library. | erledigt — unchanged. |
| 9 | Dashboard density pass: no card `min-height`, spans as specified, empty cards collapse | erledigt | `0e7362e7`: no `min-height` on any card (only on controls); spans from `layout.ts`; empty state `DashboardEmptyStateTest`. | erledigt — unchanged. |
| **R-12 answer** | | | | |
| 10 | Delete-only exemption on `order_line_fitments`, `audit_logs`; predicate `is_demo = 1 AND demo_ref IS NOT NULL`; both columns immutable | erledigt | `d4b3970a`: `trg_olf_no_delete` / `trg_audit_no_delete` let only that predicate through; `trg_*_demo_fixed` refuses any change of either column; CHECK keeps them together. | erledigt — unchanged; `fce5bdfb` gives `vehicles` the same pair (`trg_veh_demo_fixed`, CHECK `chk_veh_demo`) — 13 triggers then; 14 since `0ed8bb30` (`trg_check_results_no_update`, the frozen RIMIFY-Check), counted in the 2026-09-29 rollback rehearsal. |
| 11 | UPDATE forbidden for every row including demo; the six trigger tests | erledigt | `d4b3970a`: `trg_olf_no_update`, `trg_audit_no_update`; `DemoRowsTest` (7 tests) and `AppendOnlyTest`. | erledigt — unchanged. |
| 12 | `demo:purge` writes one non-demo audit entry before it deletes | erledigt | `14b7d021`: `DemoPurge::run` records `demo.purged` first, in the same transaction; `DemoDataTest` asserts exactly one entry that stays. | erledigt — the entry now also counts the example catalogue (`e11d06a4`) and the development cars (`fce5bdfb`). |
| 13 | **Foreign keys into those two tables: RESTRICT or CASCADE?** | erledigt — **not an S1** | Checked in `information_schema` today: `order_line_fitments.order_line_id → order_lines` is **ON DELETE RESTRICT**; `audit_logs` has **no foreign key at all**. The only cascade on the path, `order_lines → orders`, is itself blocked by that RESTRICT whenever a snapshot exists. No cascade can remove a row past the triggers; R-12 was never bypassable. | erledigt — **RESTRICT**. `order_line_fitments.order_line_id → order_lines` is `ON DELETE RESTRICT`; nothing else references either table; `audit_logs` has no foreign key. `orders → order_lines` cascades, but the RESTRICT stops it at the first snapshot. `0e472447` pins this in `AppendOnlyTest` (the order-level cascade test and the one foreign key by name). |
| 14 | R-12's replacement wording in `CLAUDE.md` | teilweise | The wording is in `CLAUDE.md` (R-12, „Supersedes the earlier R-12; implemented in `d4b3970a`“), **but `CLAUDE.md` is excluded from git** (`.git/info/exclude`), so it exists only in this working copy and no commit carries it. | bewusst so — `CLAUDE.md` stays out of git by the standing rule that no Claude traces enter the repository. What R-12 demands lives in the code that enforces it (`d4b3970a`, `fce5bdfb`, `AppendOnlyTest`, `DemoRowsTest`); R-16 (no live credentials) lives in `docs/dev/SECRETS.md`, `StripeKeys` and `secrets:scan` (`e8f807b2`). |
| **S3 prompts** | | | | |
| 15 | Four disks, private prefix `invoices/` | erledigt | `452449a4`: `media_products` (product-images/), `media_site` (website-images/), `docs_public` (ABEs/), `docs_private` (invoices/). | erledigt — unchanged. |
| 16 | Credentials in the admin: encrypted, write-only (last four), sudo-gated, audited, `.env` fallback | erledigt | `452449a4`: Einstellungen › Medien und Speicher; `SpeicherTest` (13). | erledigt — `792921ba`: the sudo step returns to the page it interrupted (`?weiter=`), open redirects refused; `SpeicherTest` covers both. |
| 17 | **No ACL on any upload** | erledigt | `452449a4`: every bucket disk is built `visibility => private`, `ACL => null`; the client strips `ACL` from every command and throws on `PutObjectAcl` (`MediaDisks`). The string `'visibility' => 'public'` remains only as our own per-prefix label in `config/media.php` (decides whether a URL is public) and on Laravel's local `public` disk — neither reaches the bucket. | erledigt — unchanged. |
| 18 | Bucket field from `ListBuckets` | erledigt | `452449a4`: `SpeicherController` lists buckets; the name is chosen, not typed. | erledigt — unchanged. |
| 19 | `rimify:s3-audit`, ten checks, the 403 probe on `invoices/` | erledigt | `452449a4`: `S3Audit` check 5 expects 200/200/200 and **403** on `invoices/`. | erledigt — unchanged. |
| 20 | `media:migrate-to-s3`: dry run, checksum verification, resumable | erledigt | `452449a4`: `--dry-run`, `--verify`, idempotent by size + MD5. | erledigt — unchanged. |
| 21 | No credential in the repository or its history | erledigt | Scanned all history today: no strict `AKIA…` key id (the loose pattern only hits base64 WebAssembly of the OCR engine), no `AWS_SECRET…=` value, no private key, neither host password; only `.env.example` is tracked. | erledigt — `e8f807b2`: `php artisan secrets:scan --history` scans every commit of every ref; run again today: **no credential found** (261 commits, 2 025 697 added lines). The same scanner runs as the pre-commit hook (`.githooks/pre-commit`) and in `composer verify`. |
| **Katalog prompt** | | | | |
| 22 | Variant matrix generator on the product form | erledigt | `3348a39c`: `MatrixPanel` (finishes × Ø × Breite × ET). | erledigt — unchanged. |
| 23 | Drag-and-drop images, reorder, per-variant assignment, required alt text | teilweise | `3348a39c`: one photograph **per finish** with required alt text. **No drag-and-drop, no second image, no reordering.** | erledigt — `2748ac22`, `161cf294`: up to twelve photos per colour (`wheel_finish_images`), each with its own required alt text; reordered by arrows, the ⋯ menu or dragging; the first is the cover everywhere the shop shows one. `FelgenTest` (5 new), `FinishPhotos.test.ts`, `e2e/katalog-marken-fotos.spec.ts`. |
| 24 | Freigabe-Check panel blocking publish until empty | erledigt | `3348a39c`: `PublishCheck` blockers; `FelgenController::status` refuses on the server. | erledigt — unchanged. |
| 25 | Importer: mapping per supplier, Probelauf diff, error report, Windows-1252 and semicolon | teilweise | `3348a39c`, `62b05656`: Probelauf plan per line, Windows-1252 → UTF-8, `;`/`,`/tab detected. **The mapping is remembered once, not per supplier; refused lines are listed on screen but there is no downloadable error report.** | erledigt — `0629548c`: a run names its supplier; the mapping of that supplier's last applied import is where its next file starts, and the run says so. Refused lines download as a CSV with the line number, the reason and the line as the file had it. `KatalogImportTest` (3 new). |
| **Review release prompt** | | | | |
| 26 | §2 example data: invented brands, generated placeholders, demo badge, real sizes | erledigt | `0b9fd246`. | erledigt — `e11d06a4`: the example catalogue is demo data and leaves with `demo:purge`; it never reaches production. |
| 27 | §3 review board `/admin/review` | erledigt | `bb87bdb6`. | erledigt — `af0ef57c`: the board is current (Marken added `b9df9b1e`). |
| 28 | §3 feedback button: URL, viewport, browser, role, screenshot | erledigt | `bb87bdb6` (rail foot, phone „Mehr“, key `R`); `9d0075ca`: screenshot shows the window where it is scrolled. | erledigt — unchanged. |
| 29 | §3 three role accounts, `docs/review/ACCOUNTS.md` | teilweise | `bb87bdb6`: Verkauf (order-manager), Lager (catalogue-manager), Admin (super-admin); `ACCOUNTS.md`. **Not yet shown** that the three see visibly different sidebars and Übersichten. | erledigt — `af0ef57c`: `ReviewKitTest` proves the three roles see different navigation and different Übersichten; `docs/review/roles/*.png` shows them. |
| 30 | §3 `review:report` → `docs/review/OPEN-POINTS.md` | teilweise | `bb87bdb6`: command and test exist. **`OPEN-POINTS.md` has never been generated into the repository.** | erledigt — `docs/review/OPEN-POINTS.md` generated today from the development database: 0 of 7 points open — all seven were the e2e spec's own test points (`review-shots.spec.ts`) and were closed with that reason. The client's points live on the review host; the same command there writes his list, and the file names its source. |
| **Finishing prompt** | | | | |
| 31 | `rimify:preflight` with its go/no-go table | erledigt | `452449a4`: key, environment/debug, database, migrations, demo data, storage source, S3 audit, storage table. | erledigt — `08ada467`: the placeholder rows and the payment keys row (`StripeKeys`) added. |
| 32 | `docs/launch/BLOCKED.md` kept current | teilweise | Last touched in `0b9fd246` (27.09.). **Nothing from the last two days** (sandbox payment, renderer watchdog, go-live steps); #1 still names a `ProductImporter` that is called `CatalogueImporter`. | erledigt — `08ada467`, `7f9446a5`, `a876e4cc`: current as of today; the HSN/TSN bridge heads it; `CatalogueImporter` named correctly. |

## Summary of the audit

- **Erledigt: 25 · teilweise: 7 (rows 1, 14, 23, 25, 29, 30, 32) · nicht gebaut: 0.**
- No S1 found. Item 13 is answered: RESTRICT, and `audit_logs` has no foreign key at all.
- The seven `teilweise` rows are the work list of the launch release, together with its own parts 2–6.

## After the launch release (28.09.2026)

- **31 of 32 rows erledigt; row 14 is deliberately so** — `CLAUDE.md` stays out of git by the standing rule
  that no Claude traces enter the repository; what its rules demand is enforced in code and tested.
- The two catalogue rows were built: several photos per colour (row 23, `2748ac22`) and the supplier
  mapping with the refused-lines download (row 25, `0629548c`).
- Row 13: RESTRICT, now pinned by a test (`0e472447`). Row 21: the history scan is a command
  (`secrets:scan --history`) and was clean today.
- Added beside the audit: the development cars are demo rows and no freigegebenes Gutachten may name a car
  that did not come from a vehicle data import in production (`fce5bdfb`, BUGS.md DATA-01, S1).
