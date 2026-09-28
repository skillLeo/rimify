# RIMIFY — compliance audit of every prompt so far

Audited on 2026-09-28, **before** any work of the launch release, against branch `release` at `5c360c56`. Every
row was checked in the code, the database or the git history, not from memory. Status is one of
`erledigt` (with the commit), `teilweise` (with what is missing) or `nicht gebaut`.

The column **after** records what the launch release did about it; the audit column is left as it was found.

| # | Item | Status (audit) | Evidence / what is missing | After the launch release |
|---|---|---|---|---|
| **Demo data prompt** | | | | |
| 1 | `num.ts` with `formatNumber`, `formatCurrency`, `formatMoney`, `formatPercent`, `parseNumber`, German | teilweise | `f53414ab`: four of the five. **`formatCurrency` does not exist**, although the ESLint message names it. `format.ts` (`euro`, `decimal`) delegates to `num.ts`. | |
| 2 | ESLint rule failing on `toLocaleString(` outside that file | erledigt | `f53414ab`, `eslint.config.js`: `toLocaleString` **and** `new Intl.NumberFormat` refused in `resources/js/**` except `lib/num.ts`. No offender today. | |
| 3 | `normalizeViewState()` on both sides of the dirty check, SV-13 five-case test | erledigt | `3a50d656`: `sameViewState` normalises both sides; `viewState.test.ts` „the five cases of SV-13“. | |
| 4 | KPI tiles render formatted money, not minor units | erledigt | `0e7362e7`: `KpiTile.vue` splits `formatMoney(value)` into figure and unit. | |
| 5 | `DemoDashboardSeeder` with environment guard and `DEMO_DATA=1` | erledigt | `14b7d021`: refuses production and anything but local/staging/testing without `DEMO_DATA=1`; tests „the fence“. | |
| 6 | `demo:purge`, `demo:reanchor`, `demo:break-queue`, `demo:assert-clean` | erledigt | `14b7d021`: four commands; `demo:assert-clean` scheduled daily in production (`routes/console.php`). | |
| 7 | `DemoDataConsistencyTest` — cross-widget invariants | erledigt | `0e7362e7`: `tests/Feature/Demo/DemoDataConsistencyTest.php`. | |
| 8 | Three charts hand-built in SVG with `d3-scale` and `d3-shape` | erledigt | `e08337f4`, `0e7362e7`: `LineChart`, `BarChart`, `StackedBar` (+ `Sparkline`); `d3-scale`, `d3-shape` only, no chart library. | |
| 9 | Dashboard density pass: no card `min-height`, spans as specified, empty cards collapse | erledigt | `0e7362e7`: no `min-height` on any card (only on controls); spans from `layout.ts`; empty state `DashboardEmptyStateTest`. | |
| **R-12 answer** | | | | |
| 10 | Delete-only exemption on `order_line_fitments`, `audit_logs`; predicate `is_demo = 1 AND demo_ref IS NOT NULL`; both columns immutable | erledigt | `d4b3970a`: `trg_olf_no_delete` / `trg_audit_no_delete` let only that predicate through; `trg_*_demo_fixed` refuses any change of either column; CHECK keeps them together. | |
| 11 | UPDATE forbidden for every row including demo; the six trigger tests | erledigt | `d4b3970a`: `trg_olf_no_update`, `trg_audit_no_update`; `DemoRowsTest` (7 tests) and `AppendOnlyTest`. | |
| 12 | `demo:purge` writes one non-demo audit entry before it deletes | erledigt | `14b7d021`: `DemoPurge::run` records `demo.purged` first, in the same transaction; `DemoDataTest` asserts exactly one entry that stays. | |
| 13 | **Foreign keys into those two tables: RESTRICT or CASCADE?** | erledigt — **not an S1** | Checked in `information_schema` today: `order_line_fitments.order_line_id → order_lines` is **ON DELETE RESTRICT**; `audit_logs` has **no foreign key at all**. The only cascade on the path, `order_lines → orders`, is itself blocked by that RESTRICT whenever a snapshot exists. No cascade can remove a row past the triggers; R-12 was never bypassable. | |
| 14 | R-12's replacement wording in `CLAUDE.md` | teilweise | The wording is in `CLAUDE.md` (R-12, „Supersedes the earlier R-12; implemented in `d4b3970a`“), **but `CLAUDE.md` is excluded from git** (`.git/info/exclude`), so it exists only in this working copy and no commit carries it. | |
| **S3 prompts** | | | | |
| 15 | Four disks, private prefix `invoices/` | erledigt | `452449a4`: `media_products` (product-images/), `media_site` (website-images/), `docs_public` (ABEs/), `docs_private` (invoices/). | |
| 16 | Credentials in the admin: encrypted, write-only (last four), sudo-gated, audited, `.env` fallback | erledigt | `452449a4`: Einstellungen › Medien und Speicher; `SpeicherTest` (13). | |
| 17 | **No ACL on any upload** | erledigt | `452449a4`: every bucket disk is built `visibility => private`, `ACL => null`; the client strips `ACL` from every command and throws on `PutObjectAcl` (`MediaDisks`). The string `'visibility' => 'public'` remains only as our own per-prefix label in `config/media.php` (decides whether a URL is public) and on Laravel's local `public` disk — neither reaches the bucket. | |
| 18 | Bucket field from `ListBuckets` | erledigt | `452449a4`: `SpeicherController` lists buckets; the name is chosen, not typed. | |
| 19 | `rimify:s3-audit`, ten checks, the 403 probe on `invoices/` | erledigt | `452449a4`: `S3Audit` check 5 expects 200/200/200 and **403** on `invoices/`. | |
| 20 | `media:migrate-to-s3`: dry run, checksum verification, resumable | erledigt | `452449a4`: `--dry-run`, `--verify`, idempotent by size + MD5. | |
| 21 | No credential in the repository or its history | erledigt | Scanned all history today: no strict `AKIA…` key id (the loose pattern only hits base64 WebAssembly of the OCR engine), no `AWS_SECRET…=` value, no private key, neither host password; only `.env.example` is tracked. | |
| **Katalog prompt** | | | | |
| 22 | Variant matrix generator on the product form | erledigt | `3348a39c`: `MatrixPanel` (finishes × Ø × Breite × ET). | |
| 23 | Drag-and-drop images, reorder, per-variant assignment, required alt text | teilweise | `3348a39c`: one photograph **per finish** with required alt text. **No drag-and-drop, no second image, no reordering.** | |
| 24 | Freigabe-Check panel blocking publish until empty | erledigt | `3348a39c`: `PublishCheck` blockers; `FelgenController::status` refuses on the server. | |
| 25 | Importer: mapping per supplier, Probelauf diff, error report, Windows-1252 and semicolon | teilweise | `3348a39c`, `62b05656`: Probelauf plan per line, Windows-1252 → UTF-8, `;`/`,`/tab detected. **The mapping is remembered once, not per supplier; refused lines are listed on screen but there is no downloadable error report.** | |
| **Review release prompt** | | | | |
| 26 | §2 example data: invented brands, generated placeholders, demo badge, real sizes | erledigt | `0b9fd246`. | |
| 27 | §3 review board `/admin/review` | erledigt | `bb87bdb6`. | |
| 28 | §3 feedback button: URL, viewport, browser, role, screenshot | erledigt | `bb87bdb6` (rail foot, phone „Mehr“, key `R`); `9d0075ca`: screenshot shows the window where it is scrolled. | |
| 29 | §3 three role accounts, `docs/review/ACCOUNTS.md` | teilweise | `bb87bdb6`: Verkauf (order-manager), Lager (catalogue-manager), Admin (super-admin); `ACCOUNTS.md`. **Not yet shown** that the three see visibly different sidebars and Übersichten. | |
| 30 | §3 `review:report` → `docs/review/OPEN-POINTS.md` | teilweise | `bb87bdb6`: command and test exist. **`OPEN-POINTS.md` has never been generated into the repository.** | |
| **Finishing prompt** | | | | |
| 31 | `rimify:preflight` with its go/no-go table | erledigt | `452449a4`: key, environment/debug, database, migrations, demo data, storage source, S3 audit, storage table. | |
| 32 | `docs/launch/BLOCKED.md` kept current | teilweise | Last touched in `0b9fd246` (27.09.). **Nothing from the last two days** (sandbox payment, renderer watchdog, go-live steps); #1 still names a `ProductImporter` that is called `CatalogueImporter`. | |

## Summary of the audit

- **Erledigt: 25 · teilweise: 7 (rows 1, 14, 23, 25, 29, 30, 32) · nicht gebaut: 0.**
- No S1 found. Item 13 is answered: RESTRICT, and `audit_logs` has no foreign key at all.
- The seven `teilweise` rows are the work list of the launch release, together with its own parts 2–6.
