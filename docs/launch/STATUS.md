# RIMIFY — launch ledger

The source of truth for progress on the launch prompt („From 70 % to live, in one run“). Resume at
the first unchecked item. Every milestone records its date, commit, gates, decisions and deviations.

## Milestones

- [ ] **M1 · Finish the Übersicht** — demo data, three charts, density pass, `num.ts`, SV-13
  - [x] SV-13 and `resources/js/lib/num.ts` (+ ESLint rule, `normalizeViewState`) — `f53414ab`, `3a50d656` (2026-09-27)
  - [x] Views own columns only by opt-in („Spalten mitspeichern“) — `3a50d656`
  - [x] R-12 amended: demo rows born demo, DELETE exemption only — `d4b3970a`
  - [x] DemoDashboardSeeder, `demo:seed|purge|reanchor|break-queue|assert-clean` — `14b7d021`
  - [x] Density pass: tiles, grid, Umsatz / Verdikte / Top-Felgen charts, Neueste Bestellungen, Systemzustand — see the M1 commit below
  - [x] Rail-foot demo strip (`demodaten.purge`, DemoDataPolicy, audited)
  - [x] `DashboardEmptyStateTest` (Pest + Vitest), `DemoDataConsistencyTest`, Playwright `dashboard-empty`
  - [x] Gates on `/admin`: style inventory, console (Chromium, WebKit, Firefox), axe (0 violations), overflow at 12 widths, OKLab palette test; screenshots in `docs/qa/shots/M1/`
  - [ ] Review fixes from ai-look-critic / interaction-qa (follow-up commit)

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

## Deviations

- **M1 · Bestellungen 104, not 300–420** (see the decision above; the three acceptance numbers are inconsistent).
- **M1 · Top-Felgen rows 36 px, not 28** — the two-weight label (model, then size) is two lines at 4 columns;
  a fixed 36 px row keeps its skeleton exact (UEB-02). 28 px would cut the name or the size.
- **M1 · Zu erledigen 8 beside Letzte Aktivität 4** — the brief places Letzte Aktivität at 4 and leaves the row's
  other 8 columns unnamed; the to-dos fill them.
