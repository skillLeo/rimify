# Engineering guide

Every change to RIMIFY is reviewed against this guide. Code comments cite it by section, for
example `CONTRIBUTING.md §2`.

## §1 · What this product is

RIMIFY sells alloy wheels (*Felgen*) and tyres to German car owners. The customer states their
vehicle; RIMIFY shows **only wheels that are legally approved for that exact car** under a German
type-approval document (*Gutachten* — ABE, Teilegutachten or ECE). Showing someone the wrong wheel
costs them their *Hauptuntersuchung* and their insurance position.

A wheel is not compatible because it physically bolts on. It is compatible because **a specific
document says so** — for that exact vehicle variant, in that exact rim width and offset, with that
exact tyre size, sometimes only under stated conditions.

**Compatibility is therefore not a product attribute. It is a relationship, and it is the primary
object in this database.**

## §2 · The governing rule

> RIMIFY may be silent. RIMIFY may be cautious. RIMIFY may say it does not know.
> **RIMIFY may never be confidently wrong.**

When two designs are otherwise equal, choose the one that fails to a missed sale rather than to a
wrong answer. Missing or unparseable data **always fails closed** — never open.

## §3 · Engineering rules

| # | Rule |
|---|---|
| R-01 | `VehicleResolver::byKeyNumbers()` returns a **Collection**, never a model. More than one result means the UI **must** show a disambiguation step. There is no flag that disables this. |
| R-02 | Build windows are two nullable `DATE` columns, `build_from` and `build_to`. **`build_to IS NULL` means still current, never today.** Overlap is written **once** in `RangeSql::windowsOverlap()` and never inlined again. |
| R-03 | A vehicle whose axle loads or top speed cannot be parsed is stored with `NULL` and `needs_review = true`, and **can never produce a positive verdict**. |
| R-04 | Vehicles are **soft-deleted, never hard-deleted**. |
| R-05 | Every foreign key out of `fitments` is `RESTRICT`. Compliance data never disappears as a side effect of tidying a catalogue. |
| R-06 | Where a Gutachten states its own minimum load index or speed symbol, **the document wins**; the derivation is the floor. The stricter always governs and the verdict records which source was used. |
| R-07 | A verdict has **four states** — `PERMITTED`, `CONDITIONAL`, `NOT_PERMITTED`, `UNKNOWN`. Never a boolean. `UNKNOWN` is not `NOT_PERMITTED`. |
| R-08 | Header mode is computed **server-side** and shipped in the first Inertia response. No client effect may change it after hydration. |
| R-09 | A vehicle-selector failure always offers three routes forward. Never a cleared form. Never a dead end. |
| R-10 | German formatting everywhere, through one helper. `1.425,00 €` · `8,5J` · `66,6 mm` · `245/45 R18 92Y` · leading zeros kept on HSN. |
| R-11 | Permissions are enforced **server-side on every mutation** via Policies. The UI only hides. |
| R-12 | `order_line_fitments` is written once and never updated. `BEFORE UPDATE` and `BEFORE DELETE` triggers raise `SQLSTATE 45000`, and the application user is granted only `SELECT, INSERT` on it. |
| R-13 | The fitment engine lives in `app/Domain/Fitment` and depends on **no** HTTP, Inertia or Vue code. Every surface calls the identical service. |
| R-14 | No raw string-concatenated SQL anywhere. Parameter binding only. |
| R-15 | Conditions render as **full German sentences**, never as codes such as `A02`. |

## §4 · Stack

- **Laravel 13** · PHP 8.3+ · **MySQL 8.4** (InnoDB, utf8mb4, **strict mode on**) · Redis · Horizon
- **Inertia v3 + Vue 3.5 + SSR** — server-side rendering is a requirement, not an option
- **Pest** for PHP tests, **Vitest** for component tests, **Playwright** for end-to-end
- **No Tailwind.** The design system is `resources/css/tokens.css` and `components.css`. Every
  rule resolves through a token; no literal colour, radius, shadow or duration in a scoped style.

## §5 · Design tokens

Sampled from the client's Figma; not open to adjustment.

```
--blue #1A44D4   --blue-h #1F4EE8   --blue-p #1536AE   --wash #EAEEFA   --bline #C9D4F5
--ok #2E8B22  --ok-w #E8F4E5   --warn #9A6400  --warn-w #FBF1DC   --danger #B01018  --danger-w #FBE8E8
--ink #0E1116  --ink2 #4A5160  --ink3 #7B8394
--ground #F7F8FD  --band #F2F5FC  --field #F5F5F5  --line #E5E5E5  --line-s #EEF0F5
```

`#1A44D4` is the **only** accent. Green, amber and red mean fitment status and stock, nothing else —
never a sale badge. Type: **Lato** 400/700/900 for language, **IBM Plex Mono** 400/500 for measured
values only. The uppercase +0.10em micro-label above a value is the system's signature device.

## §6 · Interface language

German only, informal *du*, `de-DE`. German terms of art stay German and are never translated:
*Felge · Einpresstiefe (ET) · Lochkreis · Mittenlochbohrung · Gutachten · ABE · Auflagen ·
Eintragung · Komplettrad · Zulassungsbescheinigung · HSN · TSN · Warenkorb*.

## §7 · Definition of done

Nothing is done until `composer verify` passes. It runs Pint, Larastan level 6, Pest with
coverage, vue-tsc, Vitest, the production build and the Playwright suite. **A feature with a
failing or skipped test is not finished.**

## §8 · Working rules

- Small, focused commits in conventional-commit form.
- Every new endpoint gets a Form Request, a Policy check and a feature test in the same change.
- Every money value is `integer` cents plus an explicit currency. Never a float.
- Every measurement column carries its unit in the name: `width_in`, `et_mm`, `axle_load_front_kg`.
- Timestamps are `TIMESTAMP`, stored UTC (connection timezone `+00:00`), rendered `Europe/Berlin`.
- Do not add a package without a one-line reason in the commit body.
- Architectural decisions are recorded in [`docs/decisions.md`](docs/decisions.md).
