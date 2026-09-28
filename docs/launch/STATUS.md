# RIMIFY — launch ledger

The source of truth for progress on the launch prompt („From 70 % to live, in one run“). Resume at
the first unchecked item. Every milestone records its date, commit, gates, decisions and deviations.

## Current target — the launch release (brief of 2026-09-28)

The last build before go-live and the client presentation. Order: audit, then the work, then the runbook.
No push, no deploy: the user runs `docs/launch/GO-LIVE.md`.

- [x] **§1 Compliance audit** — `docs/launch/COMPLIANCE.md`, `e3823278`: 25 erledigt, 7 teilweise, no S1 (item 13: RESTRICT)
- [x] **§3 SSR, order numbers, debug** — fallback counter + amber health row + log line with the URL; readiness loop
      before leaving maintenance; no-JS synthetic check (`rimify:smoke`, `e2e/ssr-nojs.spec.ts`); order numbers:
      unique index + numeric MAX under a row lock + retry + a second-connection test; `APP_DEBUG` forced off in
      production and a failing preflight; our own 500 page — `9cb03cdc`
- [x] **§5 `rimify:smoke`** passes locally (seven rows) — `9cb03cdc`

Remaining, in the order the user set on 2026-09-28 (then the Stripe brief, with test keys only):

1. [x] The two loose edits committed on their own — `257de430`
2. [x] Example catalogue: demo, goes with `demo:purge` (decision below)
3. [ ] Money sweep — `Money` in PHP, one `formatMoney` in JS, `MoneyDisplayTest` over ten surfaces, the set of four
4. [ ] Mobile suite: cause found and fixed, then three clean runs in a row
5. [ ] Coverage with pcov, the number in this ledger
6. [ ] Review-kit proofs: a feedback row with its screenshot, three accounts visibly different, `review:report` → OPEN-POINTS.md
7. [ ] `docs/launch/GO-LIVE.md` and `docs/review/PRESENT.md`
8. [ ] `COMPLIANCE.md` complete, every row answered, row 13's foreign keys written out
- [ ] **Guards (added 2026-09-28)** — `secrets:scan` + pre-commit hook, the whole history scanned once (row 21); the
      live-credential rule in CLAUDE.md and in a versioned doc; the payment-key guard (`sk_live_` refused outside
      production, `sk_test_` refused in live mode)

## Previous target — the admin review release (brief of 2026-09-27)

The client reviews the admin on example data before sending the catalogue, the Gutachten and the payment
credentials. The admin is the deliverable; his review is the gate. Work in the brief's §4 order; anything
not listed stays behind an honest „noch nicht gebaut“ on the review board.

- [x] **Storage (S3) — Einstellungen › Medien und Speicher** — `452449a4`, `7da6da8b` (§4.5, first half)
- [x] **§4.1 Übersicht, review fixes** — interaction-qa M1-01…M1-20 and the accepted ai-look-critic fixes;
      gates on `/admin` clean (style inventory, console ×3, axe 0, overflow at 12 widths) — see the M1 entry below.
      The demo *names* still change with §2 (MOTEC and „Demo …“ → invented brands).
- [x] **§2 Example data** — 21 wheels under Nordfelge, Kraftrad, Stahlwerk 19, Aventin, Bergsteig (renamed in
      place: ids, SKUs, fitments kept); tyres under Laufwerk without a label; no KBA/Radlast/hump on any demo
      wheel; placeholder drawings per finish (DemoPlaceholders, SVG, „Platzhalterbild · kein Produktfoto“);
      demo never published (CHECK `wheel_models_demo_never_published`, seeded as drafts, PDP/basket refuse a
      model that is not published); storefront tests on their own shop (Pest `$shopFixture`, Playwright
      `rimify_wf_e2e` on :8010 via `composer e2e:shop`).
- [x] **§4.2 Katalog** — `/admin/felgen`: list on the AdminLists pattern (views, Spaltenwahl, filters Status /
      Marke / Freigaben / Herkunft, search by SKU and EAN, bulk publish / take out / archive with demo and the
      Freigabe-Check refused per model and named), Freigaben counted from published fitment rows („Freigaben
      noch nicht hinterlegt“). Form: Stammdaten, Ausführungen with photographs (ImageUpload → `media_products`,
      alt text required), Größen-Matrix (finishes × Ø × Breite × ET, SKU from its parts), SEO with a preview,
      Freigabe-Check (blockers vs. hints); a size an approval names keeps its measurements and cannot be removed.
      A save never publishes. `/admin/katalog/import`: CSV (`;` `,` tab, UTF-8 or Windows-1252) and XLSX,
      columns mapped by name or by hand (kept for the next file), Probelauf with the plan per row, import only
      of the plan shown (refused if the catalogue moved), rollback whole while nothing builds on it, sample
      file. Pest `FelgenTest` (22), `KatalogImportTest` (11); Vitest `list`, `matrix`; shots `docs/qa/shots/m-katalog/`.
      Open in this area: Reifen, Marken, Bestände pages (rail shows them only once built).
- [x] **§4.3 Gutachten und Fahrzeuge** — Gutachten › Neu (PDF straight to the bucket, confirmed and hashed; kind
      with its own number; issuer, date, pages; the revision it replaces), one document's workspace (facts,
      rows grouped by vehicle, „Zeilen hinzufügen“ for vehicles × sizes found by name/HSN-TSN and model/SKU,
      tyre sizes typed „225/40 R18 93Y“, Auflagen from the library with a note, Eintragung, page → PDF at that
      page, the document's own limits folded away), „Vorschau im Shop“ by the shop's own resolver on the draft
      rows (EloquentFitmentRepository::forPreviewOf), Freigeben of the whole document (blockers in sentences;
      conflicts with other documents recorded, the stricter governs; the replaced revision superseded). Auflagen-
      Katalog (full sentences checked, weight, in-use count, no delete while used). Fahrzeuge list and „Zur
      Prüfung“, one vehicle with its rows and its legal data (all three → leaves the review, R-03). Abdeckung
      was already counted from rows. Pest `GutachtenErfassungTest` (14). Konflikte page: not built (on the board).
- [x] **§4.4 Verkauf** — order detail: facts, customer, addresses, lines, and per wheel line the verdict restored
      from its frozen snapshot (never recomputed), with a line when the document was replaced since; an
      unreadable snapshot says so. List rows link to it. Pest `BestellungDetailTest` (4). Sandbox payment built
      (`c56f71dc`): where the review is on, the checkout writes the order with its verdicts frozen (OrderWriter)
      and a signed Testzahlung page ends it bezahlt / abgelehnt / abgebrochen; production sets
      `RIMIFY_PAYMENTS none` and Payments refuses the sandbox anyway. Pest `TestzahlungTest` (9). Editing an
      order (status, shipping, invoice, refund): not built (on the board).
- [x] **§4.5 Einstellungen** — storage screen ✔, roles screen ✔ (built earlier); both clean at 12 widths (overflow,
      axe 0, console clean in three engines; the roles grid's 5 px overflow at 1280 fixed)
- [x] **§3 Review kit** — `/admin/review` (every screen: fertig / in Arbeit / noch nicht gebaut, link, one line,
      open points), „Rückmeldung geben“ in the rail foot and the phone's „Mehr“, key `R` (URL, window, browser,
      role and a screenshot drawn in the browser with html-to-image, one sentence, Fehler/Design/Text/Wunsch),
      Review › Rückmeldungen (filters by kind, screen and state; neu/angenommen/erledigt/abgelehnt with a reason;
      assignee), accounts Verkauf/Lager/Admin (`ReviewAccountsSeeder`, `docs/review/ACCOUNTS.md`), `php artisan
      review:report` → `docs/review/OPEN-POINTS.md`. Only where `RIMIFY_REVIEW` is on (local, staging); the
      deploy sets it for staging and off for production, and the seeder refuses where it is off.
- [x] **§1 Golden record** — `e2e/golden-record.spec.ts`: supplier CSV → Probelauf → import → publish → Gutachten
      (placeholder PDF, ABE „PLATZHALTER-GR-1“) → row via HSN/TSN × model, tyre size, Auflage, page → preview →
      Freigeben → shop by HSN/TSN → verdict, Auflage, „Gutachten öffnen (PDF, Seite 2)“ → basket → Kasse →
      Testzahlung → confirmation → Verkauf with the frozen proof. Every stand-in says it is one. 15 shots in
      `docs/review/golden-record/`, told in `docs/review/GOLDEN-RECORD.md`. Found and fixed on the way: tiles
      showed a quarter of the price, the PDP a one-rim price as four; entry flag and entry Auflage could
      disagree; order numbers compared as text collided; a database error reached the checkout as text.
- [x] **§5 Drop-in** — Pest `DropInTest`: the golden record (document, rows, paid order, frozen snapshot, byte
      for byte) survives `demo:purge`; the Übersicht with one paid order and with the demo set (the empty
      database was `DashboardEmptyStateTest`); the Katalog list was tested with all three in §4.2.

## Storage milestone — S3 media storage, configured from the admin (2026-09-27)

- Four disks on one bucket by prefix (`product-images/`, `website-images/`, `ABEs/` public; `invoices/` private,
  with `exports/` and `pending/`), built lazily by the `rimify` driver from the set in force: admin screen →
  `.env` → local folders. A save bumps a version stamp; queue workers rebuild before their next job.
- Einstellungen › Medien und Speicher: Super-Admin + sudo (15 min), write-only keys (last four only), bucket
  select from ListBuckets, „Verbindung testen“ (a real round trip on `invoices/`), a failed test keeps the
  previous set (saved as pending), one Protokoll entry per save with last fours only.
- Never an ACL: every disk's client strips `ACL` from each command and refuses `PutObjectAcl`.
- Uploads: `ImageUpload` (type from the bytes, ≤ 10 MB, ≤ 8000 px a side and ≤ 40 MP before decoding, scanner
  hook, re-encoded without EXIF/GPS, ULID names, immutable caching); `PdfUpload` (presigned POST into
  `invoices/pending/`, confirmed → size, `%PDF-`, scanner → moved; the feature's row only after) with
  `usePresignedUpload` (3 tries, 1 s / 3 s back-off, no retry on a refusal).
- Bucket down: `UploadRejected::STORAGE_DOWN` in German, the health line amber „Speicher nicht erreichbar“
  (probe ≤ every 5 min, or at once after a failed write), photos fall back to `Media/Photo.vue`'s drawn art.
- `rimify:s3-audit` (10 checks, report in `docs/launch/s3-audit-<date>.md`), one row in `rimify:preflight`;
  `media:migrate-to-s3` (`--dry-run`, `--verify`, idempotent by size + MD5).
- Secrets: log redaction on every channel (`SecretRedactor`), `dontFlash` for the keys, Telescope hides them,
  `#[SensitiveParameter]` on every key argument, test keys assembled so no scanner takes them for real ones.
- **Tests:** Pest `SpeicherTest` 13, `MediaStorageTest` 15, `MediaUploadTest` 11, `S3AuditTest` 5,
  `MediaMigrateToS3Test` 4, `LogRedactionTest` 2, CSP 1 — all against `FakeBucket`, no network. Vitest
  `usePresignedUpload` 7. Shots: `docs/qa/shots/m-storage/` (1440, 390).

## Milestones (the launch prompt's plan; order now set by the review release above)

- [ ] **M1 · Finish the Übersicht** — demo data, three charts, density pass, `num.ts`, SV-13
  - [x] SV-13 and `resources/js/lib/num.ts` (+ ESLint rule, `normalizeViewState`) — `f53414ab`, `3a50d656` (2026-09-27)
  - [x] Views own columns only by opt-in („Spalten mitspeichern“) — `3a50d656`
  - [x] R-12 amended: demo rows born demo, DELETE exemption only — `d4b3970a`
  - [x] DemoDashboardSeeder, `demo:seed|purge|reanchor|break-queue|assert-clean` — `14b7d021`
  - [x] Density pass: tiles, grid, Umsatz / Verdikte / Top-Felgen charts, Neueste Bestellungen, Systemzustand — see the M1 commit below
  - [x] Rail-foot demo strip (`demodaten.purge`, DemoDataPolicy, audited)
  - [x] `DashboardEmptyStateTest` (Pest + Vitest), `DemoDataConsistencyTest`, Playwright `dashboard-empty`
  - [x] Gates on `/admin`: style inventory, console (Chromium, WebKit, Firefox), axe (0 violations), overflow at 12 widths, OKLab palette test; screenshots in `docs/qa/shots/M1/`
  - [x] M1 itself — `0e7362e7`
  - [x] Review fixes from ai-look-critic / interaction-qa — the commit after `7da6da8b`. QA (0 S1, 6 S2, 11 S3,
    4 S4): M1-01 switch colour only, M1-02 purge not a hidden Tab stop, M1-03 a touch scroll pins nothing
    (tap / sideways drag still read), M1-04 no `order` lift below 900 px, M1-05 reka `scrollBody` without
    padding (root.ts), M1-06 Top-Felgen with the page (no skeleton), M1-07/08 KPI subgrid + the delta's words
    heard-only on narrow tiles, M1-09 card keeps „noch nicht versandt“, M1-10 demo line in Mehr, M1-11 first
    arrow = last day, M1-12 touch heads 44 px, M1-13 Nachfrage bar = the count, M1-14 halo, M1-15/17
    no-break space and hyphen, M1-16 focus home in Safari, M1-18 singular, M1-19 one Tab stop per order,
    M1-20 comments. Critic: plain states as text (chips only for exceptions), one-line titles, one-kind
    to-dos without a tag, no Demodaten tag in the note, tokens for 6 px, deltas with one decimal,
    „Gezählt seit“ only inside the Zeitraum. M1-21 (report files) needs nothing.

  **M1 figures (30 days, demo set at scale 1):** Umsatz 162.019,00 € (+15 %), Bestellungen 104 (+11,8 %),
  Ø Bestellwert 1.557,87 €, Prüfungen 1.411, Freigabequote 63,2 %, Heute 13 (9 demo + 4 CommerceSeeder).
  Top-Felgen: MOTEC MCR4 Ultimate 8,5J × 19 (19), Demo Zehnspeiche Z-07 9J × 19 (18), Demo Zehnspeiche Z-13 8J × 18 (12).
  **Tests:** Pest 1.560 (1.559 + the one fixed after the run; 0 skipped) — Vitest 1.136 — Playwright: dashboard, saved views, menus, UEB/SV bug specs green.
- [ ] **M2 · Verkauf** — order detail with frozen snapshots, state machine, refunds, shipping, invoices, mail log
- [ ] **M3 · Katalog** — variants, tyres, Komplettrad, prices, media, SEO, publish rules, importer wired
- [ ] **M4 · Fahrzeuge und Gutachten** — vehicles + KBA importer, Gutachten record, Verwendungsbereich, Auflagen library, matching, Freigeben flow
- [ ] **M5 · Storefront gaps** — account, mails with admin preview, comparison persistence, invoice download
- [ ] **M6 · Inhalte, Einstellungen, System, Auswertungen**
- [ ] **M7 · Legal, SEO and errors**
- [ ] **M8 · Launch hardening** — gates everywhere, budgets, backups with a tested restore, `rimify:preflight`

Cross-cutting, built inside the milestones that need them:

- [ ] `App\Payments\PaymentGateway` + `SandboxGateway` (five outcomes, admin toggle, webhook route, idempotency table)
- [ ] `App\Import\ImportSource` + `ProductImporter` (CSV/JSON, mapping screen, dry-run diff, error report, sample feed)

## Test counts

| Date | Pest | Vitest | Playwright |
|---|---|---|---|
| before saved views | 1493 | — | — |
| 2026-09-27, storage (`452449a4`) | 1611 (0 failed, 0 skipped) | 1146 | M1-0x, UEB-03, dashboard, menus, storage shots green |

## Decisions

- **2026-09-27 · R-12 amended (user decision).** Snapshots and the audit log are never updated; a row may be
  deleted only if born demo (`is_demo = 1`, `demo_ref` set, both immutable). CLAUDE.md carries the new
  wording (CLAUDE.md is gitignored, so the change is local). `d4b3970a`.
- **2026-09-27 · Demo acceptance numbers.** The brief's Umsatz 140–190k, Bestellungen 300–420 and Ø 1.500–1.800 €
  cannot all hold (140k ÷ 300 = 467 € per order, less than one wheel at catalogue prices of 480–1.230 €).
  Kept Umsatz and Ø; Bestellungen come out near 104. Sets of four alone would make Ø ≈ 3.300 €, so the
  paid orders run a fixed cycle of single, set, single, pair, single wheels at real catalogue prices.
- **2026-09-27 · Open checkouts expire.** `PENDING_PAYMENT` stays only for the last two days; older „offen“
  checkouts end as `EXPIRED`, as a payment session does.
- **2026-09-27 · Verdict chart palette.** DIRECTION's verdict colours fail the brief's OKLab gate in a chart
  (Mit Auflagen / Nicht freigegeben ΔE 0,9 for deuteranopes). Charts use `--chart-verdict-*` (same hues,
  stepped lightness; ΔE ≥ 15 normal, ≥ 9,5 under CVD); badges keep `--c-ok` … `--c-unk`. DIRECTION §2 updated.
- **2026-09-27 · Legal texts (CLAUDE.md and the standing rule win).** German legal text is never written by
  me: M7 builds the pages, their structure and the lawyer's slot, visibly placeholder, and BLOCKED.md #4
  tracks the signed texts.

- **2026-09-27 · Money on tiles has cents.** The Katalog brief §0 (`59.748,00 €`) supersedes the Übersicht
  brief's „no cents in tiles and charts“. Money is minor units everywhere and becomes text only through
  `num.ts formatMoney`; only a chart axis' round ticks drop the cents. Server-built sentences use
  `GermanFormat::money` (R-10's PHP side); the storefront's pre-formatted strings are out of M1's scope.
- **2026-09-27 · Order of work.** M1, then the S3 storage prompt, then M3 Katalog (pulled out by the user,
  before M2), so the Katalog's image upload lands on the bucket disks from its first commit.
- **2026-09-27 · Storage credentials are Super-Admin only** — the role, plus the Einstellungen edit right,
  plus sudo mode. The one place a Policy names a role: the brief says no other role may ever hold it.
- **2026-09-27 · No ACL is ever sent.** `visibility: private` with `options.ACL = null` alone does not do it —
  the Flysystem adapter falls back (`$options['ACL'] ?? visibilityToAcl()`) and would send `ACL: private` —
  so every disk's S3 client also strips `ACL` from each command (MediaDisks).
- **2026-09-27 · A public disk's URL base carries no prefix.** Laravel's S3 adapter puts the disk's `root` in
  front of every path itself; a base ending in the prefix doubled it (`…/product-images/product-images/…`).
- **2026-09-27 · Uploads under review are private.** A presigned PDF lands in `invoices/pending/` and is copied
  to its public prefix only when confirmed, so an unchecked file is never readable and never in the database.
- **2026-09-27 · The Protokoll property is `signing_key_last4`, not `secret_last4`.** The describer drops every
  property named like a secret — the safety net stays as strict as it is.
- **2026-09-27 · `dontFlash` lives in `bootstrap/app.php`.** A FormRequest's `$dontFlash` is never read; the
  exception handler's list is. Without it the secret sat in the session after a refused save (a test caught it).
- **2026-09-27 · The CSP names the bucket.** `img-src` and `connect-src` gain the public base's and the bucket's
  own origins when a bucket is in force — named hosts, never `*.amazonaws.com`.
- **2026-09-27 · Demo is never on the storefront (review release §2; supersedes ACCURACY D4).** The badged,
  walkable demo shop is gone: demo models are drafts and the table refuses a published demo row. Until the
  golden record (and later the client's catalogue) is published, the storefront shows no wheel and the hero
  draws its outline. The Demodaten badge stays as a last line of defence.
- **2026-09-27 · MOTEC MCR4 Ultimate leaves the example data (supersedes ACCURACY D1).** A real brand on demo
  prices, stock and fitments, pictured by the maker's own photographs, is what §2 rules out. It is now the
  invented Bergsteig Gipfel: sizes, bolt patterns and SKUs kept; KBA numbers, Radlast, weights, hump and
  Felgenhorn (all from the real ABE) removed; the photo map is empty. The client's files stay in
  `database/seeders/content/client-photos/` for the day the real product comes back.
- **2026-09-27 · Tyres are invented too.** `Laufwerk`, sizes/load/speed that exist, no EU label (label values
  travel only with a verified EPREL registration, D7).
- **2026-09-27 · Storefront tests get their own shop.** Pest: `CatalogueSeeder::$shopFixture` (honoured only
  under test) publishes the seeded catalogue as the test's shop. Playwright: `rimify_wf_e2e` (the `rimify_wf%`
  grant; `E2eShopSeeder` refuses any database not named `*_e2e`) served on :8010 — :8001 belongs to another
  local project.
- **2026-09-27 · The preview becomes staging.** `deploy/remote.sh` takes `TARGET_ENV` (production by default,
  demo guard unchanged); staging switches the admin on and writes the demo set once. The push/deploy itself
  was refused by the session's permission check — the user runs it (BLOCKED #12).
- **2026-09-27 · The review release reorders the work.** The admin on example data is the deliverable; the §4
  order of that brief replaces „M3 next“. M1–M8 stay the long plan.

- **2026-09-28 · `price_cents` is one rim, everywhere (docs/specs/komplettrad.md §9).** The storefront tiles, hero and
  compare table divided it by four and the PDP printed it under „für 4 Felgen“, while basket, orders, admin and
  importer charge it per rim. The display now follows the charge: „pro Felge“ everywhere, the PDP adds „4 Felgen:
  …“ formatted on the server. Found by the golden record.
- **2026-09-28 · An Auflage carried by a freigegebenes Gutachten keeps its meaning (GUTACHTEN-44).** Its wording,
  Einstufung and flags are refused a change (only the import key may still be corrected); a new wording is a new
  Auflage. A released Gutachten changes only by a new Fassung, and verdicts must not move under it.
- **2026-09-28 · Entry flag and entry Auflage agree.** The engine treats an ENTRY_REQUIRED Auflage as requiring
  entry and drops „Keine Eintragung erforderlich.“ where any source requires one (caution wins); the row form
  refuses the contradiction. The golden record's first row predates this and stays as released.
- **2026-09-28 · A real order's confirmation page is private.** Order numbers count up; the page opens only for
  the browser that placed the order or through a signed link (404 otherwise). Demo orders stay open.
- **2026-09-28 · Missing PDFs are said, not linked.** A stored key whose file is absent shows „Die Datei fehlt im
  Speicher“ in the admin (the seeded example documents have no files); the shop links a Gutachten's PDF, opened
  at the row's page, wherever one is stored.

- **2026-09-28 · Speed (user: pages take 2–10 s).** Measured locally: PHP and SQL are 150–350 ms a page (SQL 5–90 ms);
  the renderer 75–280 ms; a renderer that is starting, stalled or gone held pages for seconds (the HTTP client waits
  up to 10 + 30 s). Now: SSR with 0,5 s to connect and 2,5 s to render, paused 30 s after a failure (the browser
  renders meanwhile, same first-frame data, R-08); the renderer listens on 127.0.0.1 only; a cron watchdog
  (`deploy/ssr-watch.sh`, installed by `remote.sh`) restarts it within a minute. Static files: hashed build files
  cached a year (immutable), images and CSS/JS a week, text compressed. No `information_schema` lookups per request
  (DemoTables, StorageSettings). Telescope is opt-in locally. Not done: SSR cluster mode (forks one process per
  visible CPU — over a shared host's limits).

- **2026-09-28 · The example catalogue is demo, and it goes with `demo:purge`.** Not part of the golden record, not a
  third state of hidden drafts. `DemoCatalogue` names it — the models and tyres born `is_demo`, their finishes and
  sizes, the rows on them with their Auflagen, tyre sizes and conflicts, the documents of the invented issuer
  („Prüfstelle (Demodaten)“) with no row on a real wheel, the invented brands no real wheel or tyre carries, and the
  placeholder drawings — and the purge removes it child first in the same transaction as the figures, after the one
  Protokoll entry that counts it. Refused as a whole, nothing removed, while something real names it: a real
  Gutachten with rows on an example wheel (R-05), a real document replacing an example one, or an order line not
  born demo on an example wheel or tyre (R-12 — only CommerceSeeder's orders on a development database; checkout
  refuses a demo line). `demo:assert-clean`, the preflight and the rail's strip count the catalogue; `demo:reanchor`
  and the release seed renew the figures only. The seeders never write the example catalogue in production, so the
  live shop's first wheel is a real one. The development database keeps its catalogue (41 seeded order lines name
  it) until rebuilt. Pest `DemoCataloguePurgeTest` (7).

## Deviations

- **M1 · Bestellungen 104, not 300–420** (see the decision above; the three acceptance numbers are inconsistent).
- **M1 · Top-Felgen rows 36 px, not 28** — the two-weight label (model, then size) is two lines at 4 columns;
  a fixed 36 px row keeps its skeleton exact (UEB-02). 28 px would cut the name or the size.
- **M1 · Heute follows Umsatz below 900 px** (was lifted above it with `order: -1`, my own choice, not the
  brief's): the only way the keyboard reads the cards where the eye does (M1-04).
- **M1 · Top-Felgen is not deferred** — it comes with the page. A ranking whose names may wrap cannot have a
  skeleton of its exact height; one short query avoids the skeleton instead of cutting the names (M1-06).
- **M1 · Zu erledigen 8 beside Letzte Aktivität 4** — the brief places Letzte Aktivität at 4 and leaves the row's
  other 8 columns unnamed; the to-dos fill them.
