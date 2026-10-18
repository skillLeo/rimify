# RIMIFY — project constitution

Read this before every change. Where this file and any instruction disagree, this file wins.

## 1 · What this product is

RIMIFY sells alloy wheels (*Felgen*) and tyres to German car owners. The customer states their
vehicle; RIMIFY shows **only wheels that are legally approved for that exact car** under a German
type-approval document (*Gutachten* — ABE, Teilegutachten or ECE). Showing someone the wrong wheel
costs them their *Hauptuntersuchung* and their insurance position.

A wheel is not compatible because it physically bolts on. It is compatible because **a specific
document says so** — for that exact vehicle variant, in that exact rim width and offset, with that
exact tyre size, sometimes only under stated conditions.

**Compatibility is therefore not a product attribute. It is a relationship, and it is the primary
object in this database.**

## 2 · The governing rule

> RIMIFY may be silent. RIMIFY may be cautious. RIMIFY may say it does not know.
> **RIMIFY may never be confidently wrong.**

When two designs are otherwise equal, choose the one that fails to a missed sale rather than to a
wrong answer. Missing or unparseable data **always fails closed** — never open.

## 3 · Non-negotiable engineering rules

| # | Rule |
|---|---|
| R-01 | `VehicleResolver::byKeyNumbers()` returns a **Collection**, never a model. More than one result means the UI **must** show a disambiguation step. There is no flag that disables this. |
| R-02 | Build windows are two nullable `DATE` columns, `build_from` and `build_to`. **`build_to IS NULL` means still current, never today.** Overlap is written **once** in `RangeSql::windowsOverlap()` and never inlined again. |
| R-03 | A vehicle whose axle loads or top speed cannot be parsed is stored with `NULL` and `needs_review = true`. **A tyre-related verdict** (`reifen_tragfaehigkeit`, load index, speed derating) **is never positive without the vehicle's permitted axle loads and top speed** — except the top speed where every covering released Gutachten gives load index *and* speed symbol beside every tyre size (D-285): there it is neither asked nor used, and the tyre chosen must meet or exceed both figures. Without them the tyre verdict is `UNKNOWN` — „Noch nicht bestätigt“, never `CONDITIONAL` —, names the fields of the papers it waits for, and must state the threshold from the document and which field of the papers it is compared against. A wheel verdict, which rests only on the vehicle type and kW band named in a released Gutachten, is not covered by this rule. **The combined verdict is the weaker of the two and is never `PERMITTED` while the tyre part is `CONDITIONAL` or `UNKNOWN`.** *(Amended 2026-09-28 in `9cd02ace`, the operator's Answer 1: real Gutachten name cars by type and kW band, never by axle loads, so the old rule refused every wheel for every car a document names; the split keeps the refusal where it belongs — on the tyres. Amended 2026-10-18, the operator's two answers: the exception holds while the „bei jeder Reifengröße“ release requires index and symbol at every size — if it ever stops, the exception expires (D-284); `CONDITIONAL` is a grant with conditions, „Noch nicht bestätigt“ the absence of a grant, and a missing input produces the second, never the first (D-286). Amended 2026-10-18, the operator's brief §1: axle loads decide the tyre's load index, not whether the wheel is approved — so where only the figures from the papers are missing, a **rim sold alone** carries the wheel's own verdict, `CONDITIONAL` at best, with the sizes it may only be fitted with; unless a covering document itself limits by axle load (declared at release, or an Auflage naming a load and no index) and the car's load on that axle is unknown — then nothing is sold. A Komplettrad never, while its tyres are unconfirmed (D-289).)* |
| R-04 | Vehicles are **soft-deleted, never hard-deleted**. |
| R-04.1 | **Resetting the test environment.** `rimify:reset` may remove orders together with their frozen approvals, and only when all four conditions hold at the same time: `APP_ENV` is not `production`, the active database is not the production database, `RIMIFY_RESET_ERLAUBT=true` is set, and the call comes from `rimify:reset` or the System › Zurücksetzen screen. This path must not be reachable from application code, controllers, seeders, factories, queue jobs or tests. Before it runs, a backup is written and verified; afterwards, an audit-log entry is written into the restored database. |
| R-05 | Every foreign key out of `fitments` is `RESTRICT`. Compliance data never disappears as a side effect of tidying a catalogue. |
| R-06 | Where a Gutachten states its own minimum load index or speed symbol, **the document wins**; the derivation is the floor. The stricter always governs and the verdict records which source was used. |
| R-07 | A verdict has **four states** — `PERMITTED`, `CONDITIONAL`, `NOT_PERMITTED`, `UNKNOWN`. Never a boolean. `UNKNOWN` is not `NOT_PERMITTED`. |
| R-08 | Header mode is computed **server-side** and shipped in the first Inertia response. No client effect may change it after hydration. |
| R-09 | A vehicle-selector failure always offers three routes forward. Never a cleared form. Never a dead end. |
| R-10 | German formatting everywhere, through one helper. `1.425,00 €` · `8,5J` · `66,6 mm` · `245/45 R18 92Y` · leading zeros kept on HSN. |
| R-11 | Permissions are enforced **server-side on every mutation** via Policies. The UI only hides. |
| R-12 | **Fitment snapshots and the audit log are immutable.** Rows in `order_line_fitments` and `audit_logs` can never be updated. There is no exception, including for demo rows. A row may be deleted only if it was created as a demo row (`is_demo = 1` and `demo_ref IS NOT NULL`); both columns are immutable after insert, so a real row can never become a demo row. Foreign keys into these tables are `ON DELETE RESTRICT`, because MySQL does not fire triggers on cascading deletes. Every purge writes one non-demo audit entry naming the table, the row count and who ran it. Production holds no demo rows: `demo:assert-clean` runs in the deploy pipeline and daily and fails if it finds any. *(Supersedes the earlier R-12; implemented in `d4b3970a`.)* |
| R-12.3 | **Resetting the test environment.** The reset is *not* an exception to the append-only rule. The `shop` and `all` („Alles“) levels delete no rows; they replace the schema completely from a baseline, and in doing so neither an UPDATE nor a DELETE is executed against `order_line_fitments` or `audit_logs`. The `demo` level uses only the exception already described for born-demo rows (`is_demo = 1 AND demo_ref IS NOT NULL`). No other write path to these two tables may exist in the code. After every reset, `rimify:reset` checks that the triggers on both tables are present and actually raise SQLSTATE 45000; if this check fails, the reset counts as failed. |
| R-13 | The fitment engine lives in `app/Domain/Fitment` and depends on **no** HTTP, Inertia or Vue code. Every surface calls the identical service. |
| R-14 | No raw string-concatenated SQL anywhere. Parameter binding only. |
| R-15 | Conditions render as **full German sentences**, never as codes such as `A02`. |
| R-16 | Never accept, store or use a live payment or cloud credential. A key whose prefix marks it as live (`sk_live_`, `rk_live_`, `AKIA…` for a production account) is refused, is not written to any file, and the operator is told to roll it. Live credentials are entered by a human in the admin panel on the production site and nowhere else. Build and test only against test credentials. *(Added 2026-09-28; enforced by `secrets:scan`, the pre-commit hook and `App\Payments\StripeKeys` — `docs/dev/SECRETS.md`.)* |
| R-17 | **Say only what is on record.** The shop may state what RIMIFY has recorded and what follows from it. It may never state what an external document does or does not contain, unless that absence is itself a recorded and verified field. Where something is unknown, the wording names what is unknown, why, and what would resolve it — never a blanket refusal, and never a claim about the document itself. *(Added 2026-10-14, the operator's decision after three findings of one family — the product said more than its data supports: two tyre sizes' snow-chain Auflagen printed without their sizes (D-199), „Das Gutachten druckt keine Tabelle …“ for a table that was merely not entered (D-215), and „Keine Freigabe hinterlegt“ over a wheel whose Gutachten approves it (D-214). Enforced by `tests/Unit/OnRecordTest.php`: every sentence that names a Gutachten, an ABE, a Nachtrag, a manufacturer or a document and denies or restricts something stands in `tests/Support/on-record-ledger.php` with the recorded field that backs it, or it does not pass; `docs/review/ON-RECORD.md` is that list — D-216.)* |

## 4 · Stack

- **Laravel** (latest stable) · PHP 8.3+ · **MySQL 8.4** (InnoDB, utf8mb4, **strict mode on**) · Redis · Horizon
- **The host's engine, MariaDB 11.8.9, runs locally from `C:\rimify\tools\mariadb-11.8.9`** (data in
  `C:\rimify\tools\mariadb-11.8.9-data`, port 3308). That path and that `mariadbd` process are RIMIFY's alone: no other
  project may stop, move or remove them, whatever its own rules say about MariaDB. Reason: production engine parity —
  the append-only guarantee (R-12, R-12.3) is a trigger raising SQLSTATE 45000, and the engine that trigger runs on is
  the thing being tested. *(Added 2026-10-05, the operator's brief §1.1, after another project's session deleted the
  copy in the shared `C:\tools` twice.)*
- **Inertia v2 + Vue 3.5 + SSR** — server-side rendering is a requirement, not an option
- **Pest** for PHP tests, **Vitest** for component tests, **Playwright** for end-to-end
- **No Tailwind.** The design system is `resources/css/tokens.css`, governed by
  `docs/design/DIRECTION.md`. Every value a component uses comes from a token there.

## 5 · Design

The visual system — palette, type, grid, spacing, radii, elevation, motion, icons, imagery and copy
rules — is defined in `docs/design/DIRECTION.md`. Where a Figma mock, an old prototype or a memory
of either disagrees with that document, the document wins.

### Placeholder imagery and protected elements *(added 2026-09-28, after the hero lost its photographs)*

- **Placeholder imagery is used only for demo catalogue entries.** Editorial and marketing imagery on the
  homepage and landing pages uses real licensed photography. If no licensed photograph is available for a
  position, the position is raised with the operator — it is never silently replaced with a schematic.
- **An element listed in `docs/design/PROTECTED.md` is never removed, replaced, simplified or swapped for a
  placeholder as a side effect of another task.** If a rule appears to require it, stop and ask. Changing
  one is a task of its own, with the operator's explicit agreement, and `PROTECTED.md` is updated in the
  same change. The protected-elements suite (`e2e/protected.spec.ts`) fails when one goes missing.

## 6 · Interface language

German only, informal *du*, `de-DE`. German terms of art stay German and are never translated:
*Felge · Einpresstiefe (ET) · Lochkreis · Mittenlochbohrung · Gutachten · ABE · Auflagen ·
Eintragung · Komplettrad · Zulassungsbescheinigung · HSN · TSN · Warenkorb*.

## 7 · Definition of done

Nothing is "done" until `composer verify` passes. That command runs Pint, Larastan level 6, Pest
with coverage, Vitest, and the Playwright suite. **A feature with a failing or skipped test is not
finished.** Never report completion on the basis of code having been written.

## 8 · Working rules

- Small, focused commits in conventional-commit form.
- Every new endpoint gets a Form Request, a Policy check and a feature test in the same change.
- Every new money value is `integer` cents plus an explicit currency. Never a float.
- Every measurement column carries its unit in the name: `width_in`, `et_mm`, `axle_load_front_kg`.
- Timestamps are `TIMESTAMP`, stored UTC (connection timezone `+00:00`), rendered `Europe/Berlin`.
- Do not add a package without a one-line reason in the commit body.

## 9 · The standing decision rule *(added 2026-09-29, the operator's last prompt §0)*

> **Decide and record.** For anything reversible in under an hour, choose the most reasonable option,
> implement it, and write one line in `docs/DECISIONS.md`: the date, the choice, the reason, the commit.
> Do not ask first. This covers wording, layout, ordering, density, defaults, naming, test structure,
> refactors, and any choice between two behaviours that are already inconsistent — in that last case,
> always adopt the one already used elsewhere in the product.
>
> **Ask only when** the action is irreversible (data loss, money leaving an account, a production deploy),
> it needs a credential, file or purchase only the operator can supply, it contradicts `CLAUDE.md`, or it
> changes what a customer is told about the legality of a wheel on their car. Those four, and nothing else.
> Removing, replacing, simplifying or turning into a placeholder an element listed in
> `docs/design/PROTECTED.md` contradicts `CLAUDE.md` §5 and is therefore always asked first — whether the
> change is in the code or in the data that switches the element on *(added 2026-10-01, D-089)*.
