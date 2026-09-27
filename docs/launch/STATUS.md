# RIMIFY — launch ledger

The source of truth for progress on the launch prompt („From 70 % to live, in one run“). Resume at
the first unchecked item. Every milestone records its date, commit, gates, decisions and deviations.

## Current target — the admin review release (brief of 2026-09-27)

The client reviews the admin on example data before sending the catalogue, the Gutachten and the payment
credentials. The admin is the deliverable; his review is the gate. Work in the brief's §4 order; anything
not listed stays behind an honest „noch nicht gebaut“ on the review board.

- [x] **Storage (S3) — Einstellungen › Medien und Speicher** — `452449a4`, `7da6da8b` (§4.5, first half)
- [x] **§4.1 Übersicht, review fixes** — interaction-qa M1-01…M1-20 and the accepted ai-look-critic fixes;
      gates on `/admin` clean (style inventory, console ×3, axe 0, overflow at 12 widths) — see the M1 entry below.
      The demo *names* still change with §2 (MOTEC and „Demo …“ → invented brands).
- [ ] **§2 Example data** — invented brands only (`Nordfelge`, `Kraftrad`, `Stahlwerk 19`, `Aventin`, `Bergsteig`), honest
      generated placeholder wheels, real sizes/ET/Lochkreis/Mittenloch, demo never publishable
- [ ] **§4.2 Katalog** — list, form with variant matrix, images (ImageUpload → media_products), importer with Probelauf
- [ ] **§4.3 Gutachten und Fahrzeuge** — PDF upload (PdfUpload), Verwendungsbereich, Auflagen library, preview,
      Freigeben, Abdeckung from real rows
- [ ] **§4.4 Verkauf** — order list, order detail with the frozen snapshot per line
- [ ] **§4.5 Einstellungen** — storage screen ✔, roles screen ✔ (built earlier), review of both at 12 widths
- [ ] **§3 Review kit** — `/admin/review`, the feedback button (context + screenshot), the Feedback list,
      role accounts (`docs/review/ACCOUNTS.md`), `review:report` → `docs/review/OPEN-POINTS.md`
- [ ] **§1 Golden record** — the chain end to end against a stand-in, `docs/review/GOLDEN-RECORD.md` with a shot per step
- [ ] **§5 Drop-in** — dashboard and Katalog list tested with an empty database, one row and the demo set;
      `demo:purge` leaves the golden record standing

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
- **2026-09-27 · The review release reorders the work.** The admin on example data is the deliverable; the §4
  order of that brief replaces „M3 next“. M1–M8 stay the long plan.

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
