# What the admin navigation can honestly point at

`BRIEF.md` lists fifty-odd pages across ten groups, and says: **no dead navigation, no 403 after a
click.** So before the shell renders a single item, this is what each one has behind it today.

Three answers only:

- **Da** — the tables exist and hold real rows. The page can be built now.
- **Ableitbar** — no table of its own; the page is a view over tables that do exist. Buildable now,
  but it is a query, not a CRUD screen, and the spec should say so.
- **Fehlt** — nothing behind it. **The item is not rendered until it has a table.** A navigation
  entry that opens an empty shell is the dead link the brief forbids, only slower to discover.

Checked against `database/migrations/**` and `app/Models/`.

---

## Verkauf

| Seite | Stand | Dahinter |
|---|---|---|
| Bestellungen | **Da** | `orders`, `order_lines`, `order_line_fitments`, `stripe_events` |
| Rücksendungen & Gutschriften | **Fehlt** | — |
| Kunden | **Da** | `customers`, `addresses` |
| Anfragen („Sag mir Bescheid") | **Da** | `fitment_subscriptions` |

`order_line_fitments` is the frozen snapshot the brief asks the order detail to show, and it is
write-once (R-12) — the order page reads it and must never offer to edit it.

## Katalog

| Seite | Stand | Dahinter |
|---|---|---|
| Felgen | **Da** | `wheel_models`, `wheel_configs`, `wheel_finishes` |
| Reifen | **Da** | `tyre_variants` |
| Kompletträder | **Ableitbar** | a wheel + a tyre + `balance_weight_colours` + `tpms_sensor_prices` |
| Marken | **Da** | `brands` |
| Bestände | **Ableitbar** | `wheel_configs.stock_qty` — a view with a threshold, not its own table |
| Preise | **Ableitbar** | `wheel_configs.price_cents` plus the two option tables and `settings` |
| Medien | **Da** | `media` |

## Gutachten

| Seite | Stand | Dahinter |
|---|---|---|
| Dokumente | **Da** | `approval_documents` |
| Auflagen-Katalog | **Da** | `condition_codes`, `condition_code_aliases`, `fitment_conditions` |
| Abdeckung | **Ableitbar** | `fitments` × `fitment_tyre_sizes` × `vehicles` |
| Konflikte | **Da** | `fitment_conflicts` |

## Fahrzeuge

| Seite | Stand | Dahinter |
|---|---|---|
| Hersteller · Modelle · Varianten · HSN/TSN | **Ableitbar** | all four are facets of `vehicles` |
| Importe | **Fehlt** | no import-run table, so no history and nothing to roll back |

Four navigation items over one table is four ways into the same list. Worth deciding in the
Fahrzeuge spec whether that is one page with a facet switch instead.

## Inhalte

| Seite | Stand | Dahinter |
|---|---|---|
| Seiten | **Da** | `pages`, `page_blocks` |
| Ratgeber | **Fehlt** | probably `pages` with a type — decide in the Inhalte spec |
| FAQ | **Da** | `faq_entries` |
| Rechtstexte | **Da** | `pages` |
| Navigation | **Da** | `nav_items` |
| Hinweisleisten | **Fehlt** | — |

## Auswertungen

| Seite | Stand | Dahinter |
|---|---|---|
| Verkäufe | **Ableitbar** | `orders` |
| Suchen ohne Treffer | **Da** | `search_misses` |
| Fahrzeuge ohne Felgen | **Ableitbar** | `vehicles` left join `fitments` |
| Gutachten-Lücken | **Da** | `catalogue_gap_events` |

## Einstellungen

| Seite | Stand | Dahinter |
|---|---|---|
| Branding · Versand · Zahlung · Steuern · Servicezeiten · E-Mails · Feature-Flags | **Ableitbar** | `settings` plus `config/rimify.php` |

`KomplettradSettings` already shows the pattern these screens follow: a row in `settings` wins over
the configured default, and a row holding an explicit null means *deliberately unset* rather than
*never touched*.

## Team

| Seite | Stand | Dahinter |
|---|---|---|
| Benutzer | **Da** | `admin_users` |
| Rollen & Rechte | **Da** | `roles`, `role_permissions`, `model_has_roles` — already editable |
| Einladungen | **Fehlt** | — |
| Sitzungen | **Teilweise** | `sessions` exists but the admin guard's rows are not distinguished |
| Audit-Log | **Da** | `audit_logs` |

## System

| Seite | Stand | Dahinter |
|---|---|---|
| Warteschlange | **Da** | `jobs`, `job_batches`, `failed_jobs` |
| Fehler | **Da** | `failed_jobs`, plus Telescope where it is installed |
| Cache | **Ableitbar** | `cache`, `cache_locks` |
| Wartungsmodus | **Ableitbar** | the framework's own maintenance file |

---

## What this means for the shell

Five items — **Rücksendungen & Gutschriften, Importe, Ratgeber, Hinweisleisten, Einladungen** — have
nothing behind them. They do not appear in the sidebar until they do. The shell's navigation is
therefore built from a list that names, per item, both the permission it needs *and* whether it
exists yet; adding a page later is one entry, not a redesign.

## One thing already right, which the brief should not undo

`BRIEF.md` §2 asks for permissions shaped `modul.aktion`. That is exactly what
`App\Enums\PermissionModule` × `App\Enums\PermissionAction` already is — twelve modules by six
actions, stored in `role_permissions`, read by `PermissionMatrix` on every request with no
cross-request cache, and enforced by the Policies. The German examples in the brief
(`bestellungen.ansehen`, `preise.aendern`) are the same idea in another language.

So this is not rebuilt. What is missing against the brief is the rest of §2: custom roles, the diff
before saving, „Ansicht als Rolle", invitations, sessions, and the audit log written through model
events rather than by hand in each controller.
