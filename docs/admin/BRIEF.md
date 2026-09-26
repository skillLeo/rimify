# RIMIFY — the admin, at agency standard

The brief for the admin rebuild. The storefront is at the level we want; the admin is not. This
document is the source the section specs are written from, and it is the thing to argue with when a
later decision seems to contradict it.

**Target quality:** the Shopify admin, Linear, Atlassian. Built on RIMIFY's own design system
(`docs/design/DIRECTION.md`) in a **denser variant** — the storefront is a showroom, the admin is a
workbench, and a workbench is tighter. Nothing in this rebuild changes how the storefront looks.

**Rules that do not move:** tokens only, no gradient blobs, no icon libraries, no chart library that
brings its own look. German throughout in the informal *du*. Small commits. **No deploying** while
this is in progress.

---

## 1 · The shell

### Sidebar

260 px, collapsible to 64 px, the collapse state remembered per viewer. At the top the RIMIFY logo
with a small environment badge — `Lokal` · `Staging` · `Live` — so nobody ever edits the wrong
shop's prices believing it is a copy.

One icon per item from `resources/js/icons/`, an active state, and a live count where a number means
work (offene Bestellungen, Gutachten zur Prüfung, Produkte ohne Bild). A count of zero does not
render; an absent count is not a zero.

| Gruppe | Seiten |
|---|---|
| Übersicht | Dashboard |
| Verkauf | Bestellungen · Rücksendungen & Gutschriften · Kunden · Anfragen („Sag mir Bescheid") |
| Katalog | Felgen · Reifen · Kompletträder · Marken · Bestände · Preise · Medien |
| Gutachten | Dokumente · Auflagen-Katalog · Abdeckung · Konflikte |
| Fahrzeuge | Hersteller · Modelle · Varianten · HSN/TSN · Importe |
| Inhalte | Seiten · Ratgeber · FAQ · Rechtstexte · Navigation · Hinweisleisten |
| Auswertungen | Verkäufe · Suchen ohne Treffer · Fahrzeuge ohne Felgen · Gutachten-Lücken |
| Einstellungen | Branding · Versand · Zahlung · Steuern · Servicezeiten · E-Mails · Feature-Flags |
| Team | Benutzer · Rollen & Rechte · Einladungen · Sitzungen · Audit-Log |
| System | Warteschlange · Fehler · Cache · Wartungsmodus |

**A navigation item a role may not open is not rendered at all.** Never a dead link, never a 403
after a click. A disabled item still tells somebody a capability exists.

### Top bar

Breadcrumbs left · global search centre · on the right the notification bell, a help link, and the
user menu: Name, Rolle, Profil, Passwort, Zwei-Faktor, **Abmelden**.

### Global search

⌘K / Strg+K opens it, `/` focuses it. One field across Bestellungen, Kunden, Produkte, Fahrzeuge,
Dokumente, Seiten and Einstellungen. Results grouped by type, each showing the record's key line
(Bestellnummer + Kunde + Summe), keyboard navigable, with recent items and jump-to-action entries
(„Neues Produkt", „Gutachten hochladen").

### The page pattern

Every admin page: a title, a one-line context beneath it, a single primary action, secondary actions
in a menu. Forms carry a sticky footer with *Speichern* and *Verwerfen*, disabled until something
changes, and a guard when leaving with unsaved changes.

### The five states

Every table and every form has all five designed: normal, empty, loading, error, no-permission.

### Mobile, below 768 px — a real app, not a resize

A bottom bar (Übersicht · Bestellungen · Katalog · Suche · Mehr), list-first screens with large rows,
filters and row actions in bottom sheets, a sticky save bar that stays above the keyboard
(`visualViewport`), 44 px targets, tables becoming stacked cards, and never a horizontal scroll.

---

## 2 · Rollen, Rechte, Audit-Log — before the rest

**Permissions** are `modul.aktion` — `bestellungen.ansehen`, `bestellungen.erstatten`,
`preise.aendern`, `inhalte.veroeffentlichen`, `rollen.verwalten`, `branding.aendern`,
`gutachten.veroeffentlichen`. Every route, action and bulk operation maps to exactly one permission,
enforced by a Policy on the server and used to render the UI.

**Roles:** the built-in ones ship (Super-Admin, Administrator, Katalog, Gutachten, Bestellungen,
Support, Inhalte, Buchhaltung) *and* the Super-Admin can create, rename, duplicate and delete custom
ones. The editor is a permission matrix: modules down, actions across, search, group toggles, „von
Rolle kopieren", a diff of what changes before saving, and „Ansicht als Rolle" showing the navigation
that role will see. Guards: the last Super-Admin cannot be demoted or deleted; raising your own
rights is impossible; every change is confirmed and logged.

**Users:** invite by e-mail with a role, resend and revoke invitations, deactivate (never
hard-delete), force logout, require two-factor for roles with destructive rights, a sessions list
with device and last activity, last login on the row.

**Audit log:** append-only, one row per change — who, when, which record, which fields, before →
after, IP. Filterable by user, module and date, exportable as CSV, and shown as a timeline on each
record's page („Änderungen"). Written through model events, never through the ORM's ordinary path, so
it cannot be forgotten.

---

## 3 · What each area must do

Summarised; each gets its own spec before it is built.

- **Bestellungen** — list with filters, saved views per user, multi-select bulk actions, search.
  Detail: positions carrying the **frozen fitment snapshot** (which document approved this wheel for
  this vehicle at purchase, with its conditions), addresses, payment and shipping state, tracking,
  invoice and credit-note PDFs, refunds with a reason, internal notes, the e-mail log, a print view,
  the change timeline.
- **Kunden** — profile, orders, saved vehicles, addresses, notes, and GDPR: export everything as a
  file, and a deletion flow that anonymises orders rather than breaking them.
- **Katalog** — a wheel model with its variants, prices (netto/brutto, Steuersatz, per piece and per
  set of four), stock with a warning threshold, delivery time, images with drag-to-reorder, alt text
  and angle tags, linked documents, SEO, publish state. Bulk price/stock/publish/brand/delete with a
  preview. CSV import and export with a dry run, a per-row error report, and a rollbackable history.
  A data-quality panel listing what is missing, each entry a one-click filter.
- **Gutachten** — upload, type (ABE / Teilegutachten / ECE), number, issuer, date, then the
  Verwendungsbereich rows with autocomplete against the vehicle database. The Auflagen catalogue maps
  each code to its full German sentence (R-15), written once and reused everywhere. Versioning that
  supersedes without touching placed orders. Coverage, and a conflict list.
- **Fahrzeuge** — makes, models, variants, HSN/TSN, importer history, duplicate detection, a merge
  tool, and the list of variants with no approved wheels, linked to the „Sag mir Bescheid" subscriptions.
- **Inhalte** — every public page as typed blocks, edited beside a live preview in a device frame
  rendered with the real storefront components. Draft, scheduled publish, revisions with a diff and
  one-click restore. Character counters matching what the design holds, required alt text, enforced
  aspect ratios. Legal pages carry a „vom Anwalt geprüft" flag and warn when edited.
- **Branding** — logo light/dark, favicon, brand colour with derived hover/pressed steps, e-mail and
  invoice marks, share image. The colour picker refuses a value that fails contrast and shows the
  check. Live preview. „Standard wiederherstellen" always available.
- **Einstellungen** — Versandarten, Zahlarten, Steuersätze, Servicezeiten with the federal state,
  sender addresses and e-mail templates with a test send, feature flags, and the demo-data switch
  behind the „Demodaten" badge.
- **System** — queue and failed jobs with retry, error log, cache clear, maintenance mode with a
  preview of what visitors see.

---

## 4 · Dashboards — real data only

Every widget is backed by a query. **A number with no data source is not built** — no invented
metrics, no placeholder graphs. Where there is no data yet the widget shows its empty state. Every
number links to the list it came from, already filtered.

One dashboard per role. Layout: a KPI row of stat tiles, then at most three charts, then two work
lists. A period switcher (7 / 30 / 90 Tage, custom) applies to the whole page and is remembered.
Every panel has „Tabelle anzeigen" and „CSV exportieren".

---

## 5 · Charts — our own, not a library's

Small Vue SVG components using only `d3-scale` and `d3-shape` for the maths. No Chart.js,
ApexCharts or ECharts: a charting library brings its own visual language and the whole point is that
these look like RIMIFY. Components: `StatTile`, `Sparkline`, `LineChart`, `BarChart`, `StackedBar`,
`Donut`, `Meter`, `ChartTable`.

**Form before colour.** One value → a stat tile, never a one-bar bar chart. A ratio against a limit →
a meter. Trend → a line. Magnitudes → bars. One series is the story → that series in the accent and
the rest grey. Part of a whole → a stacked bar; a donut only at-a-glance with ≤ 6 segments. More than
about seven classes that all matter → a table.

**Marks:** bars ≤ 24 px with a 4 px rounded data-end and a square baseline end; lines 2 px, round
caps; markers ≥ 8 px with a 2 px ring in the surface colour; a 2 px surface gap between touching
marks, never a stroke; gridlines hairline, solid, recessive. Text wears ink tokens, never the series
colour.

**Never:** two y-axes on one plot; a rainbow ramp for magnitude; recolouring when a filter changes
the order (colour follows the entity, not the rank); a darker-where-bigger ramp on unordered
categories; status colours as series colours; 3-D; gradient fills; a donut with a big number in the
middle pretending to be a KPI.

**The palette is computed, not judged.** Chart tokens in `tokens.css`: eight categorical hues in a
fixed order, one sequential ramp, a diverging pair with a neutral midpoint, and the reserved status
colours which are never series colours. `tests/charts/palette.test.ts` uses `culori` to check every
adjacent pair — OKLab ΔE ×100 ≥ 15 under normal vision and ≥ 8 under deuteranopia and protanopia —
and text contrast ≥ 4.5:1 against the chart surface. The test fails the build.

All aggregation on the server, one cached query per widget, formatted German in Europe/Berlin.

---

## 6 · Quality and speed

- Tables: server-side pagination or virtualisation above 200 rows; stable column widths; sticky
  header; Space selects a row; Shift-click selects a range; the selection survives paging.
- Keyboard: ⌘K search, `/` focus, `n` for the page's primary action, Esc closes the top layer, and a
  Tab order that matches the visual one.
- Destructive actions confirm; irreversible ones require typing the record's name.
- Optimistic updates roll back visibly, with the reason.
- Every list page answers in under 300 ms on the server, with no N+1 queries — guarded by a test.
- `interaction-qa` sweeps every admin route at 390, 768, 1280 and 1920 in three browsers.
- `perf-a11y-auditor`: axe clean on every admin route, full keyboard journeys, focus never hidden
  behind a sticky bar.

**Tests.** Pest: for every role × route, allowed answers 200 and forbidden answers 403; every policy
has a test; the audit log records create, update and delete for every model; an import dry run equals
the import. Vitest: bar heights proportional to values, stacked segments summing to the total, labels
never overflowing, empty and single-point series rendering, and the palette test. Playwright: one
journey per role, sign in → dashboard → that role's main task → sign out, plus no navigation item
leading to a 403 and unsaved changes always warning.

---

## 7 · Order of work

1. **The shell** — sidebar, top bar, search, user menu with Abmelden, breadcrumbs, the page pattern,
   the five states, the mobile shell. **Nothing else until this stands.**
2. **Rollen, Benutzer, Audit-Log**, with the policies wired into the shell.
3. **Bestellungen und Kunden** — the daily work.
4. **Katalog**, media, bulk actions, import/export, the data-quality panel.
5. **Gutachten**, the Auflagen catalogue, coverage, conflicts; **Fahrzeuge** and the imports.
6. **Inhalte** and **Branding**, with live preview and revisions.
7. **Dashboards and charts**, once real data exists behind them.
8. The **mobile pass** over every screen, then the gates, then `docs/admin/README.md` in German for
   the client's team.

A thin dashboard — the KPI row only, real numbers — may ship with step 1 so there is something to
look at. The charts wait for step 7.

---

## 8 · Done

Every role can do its whole job without a developer · no dead navigation and no 403 after a click ·
every number on a dashboard comes from a query and links to its list · the charts pass the palette
test and the anti-pattern list · every destructive action is logged · the admin works as an app on a
phone · G1–G9 green on every admin route · `docs/admin/README.md` explains each area in German for
the client's team.
