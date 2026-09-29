# Vehicles from the documents, and the tyre half of a verdict

Design for Block C of `docs/launch/REMAINING.md` (items 7–10), after the user's answers of 2026-09-28. It
builds on the per-document model (docs/specs/gutachten-model.md).

## C7 · „Fahrzeug aus diesem Gutachten anlegen“

The real documents name cars by the maker's Fahrzeugtyp (`3C`, `UKL-C/X`), the EG type-approval number with
its extension range (`e1*2007/46*0563*..`), the trade name and a kW band per tyre size — never by HSN/TSN
(docs/launch/BLOCKED.md, top). So:

- In „Zeilen hinzufügen“, next to the vehicle search, a person can create the car the document names:
  maker, trade name, Fahrzeugtyp, EG number as printed, body style and drive where the document says them,
  and the page. It is stored with `source = gutachten`, `source_document_id`, `source_page`.
- **HSN and TSN stay empty** for such a car (`vehicles.hsn`/`tsn` become nullable, paired, and only a car from
  a Gutachten or checked by hand may lack them). RIMIFY never invents key numbers. The storefront says
  „HSN/TSN für dieses Fahrzeug noch nicht hinterlegt“ and offers the choice by maker, model and type.
- Axle loads and top speed are not in the document either: the car is stored with NULL and
  `needs_review = true` (R-03), and its tyre half stays open until the customer's papers or a dataset give
  them (C9, C10).

## C8 · The later merge

When a vehicle dataset arrives (BLOCKED.md #16), its import matches a car from a Gutachten on the
normalised EG number **and** the Fahrzeugtyp. A dry run lists, per car: matched (fills HSN/TSN, axle loads,
top speed, build window where empty — never overwrites a value a person entered), new, or ambiguous (two
candidates: nothing is merged, the row waits for a person). A car named by a released row is never
duplicated, re-keyed or removed by the merge; its id stays, so every fitment and order keeps pointing at it.

Built as `VehicleMerge` and `php artisan vehicles:merge datensatz.csv` (dry run; `--apply --by=<e-mail>` to
fill). Two rules the documents forced: a Gutachten prints the extension as `..`, which covers every extension
of its base number, while a named extension (`*11`) matches only itself; and one EG number usually covers
several engines, so **several dataset cars fitting one car is ambiguous too** — which engine the document
meant is a person's call. The CSV columns are the contract the dataset's own import maps onto.

## C9 · R-03, split (the user's Answer 1)

> R-03 — A tyre-related verdict (reifen_tragfaehigkeit, load index, speed derating) is never positive without
> the vehicle's permitted axle loads and top speed. Without them the tyre verdict is CONDITIONAL and must
> state the threshold from the document and which field of the papers it is compared against. A wheel
> verdict, which rests only on the vehicle type and kW band named in a released Gutachten, is not covered by
> this rule. The combined verdict is the weaker of the two and is never PERMITTED while the tyre part is
> CONDITIONAL or UNKNOWN.

- The verdict carries a **wheel** status (from the document: window, geometry, body style and drive, the
  Auflagen, the Eintragung) and a **tyre** status. The combined `status` is the weaker; `PERMITTED` only when
  both are.
- Without axle loads and top speed the tyre status is CONDITIONAL with a sentence naming the document's own
  threshold — the `max_axle_load_kg` of its `reifen_tragfaehigkeit` codes, e.g. T88 → 1.120 kg — and the
  field: „Felder 8.1 und 8.2 der Zulassungsbescheinigung Teil I (im alten Fahrzeugschein Ziffer 16)“.
- The wheel's own limit is checked when the loads are known: axle load ÷ 2 must not exceed the wheel's
  Radlast (DB8GT2: 700 kg).
- CLAUDE.md's R-03 is amended in the same commit, with that commit's hash and this reason.

## C10 · The customer's own figures

Three optional fields per vehicle, with a drawing of where they stand on the Zulassungsbescheinigung:
**8.1** (zulässige Achslast vorn), **8.2** (hinten), **T** (Höchstgeschwindigkeit); the document scanner reads
them together with **P.2** (Leistung in kW), which is checked against the chosen variant. There are no
customer accounts yet, so the figures are kept per vehicle in one functional cookie (`rmf_papiere`,
docs/launch/COOKIES.md) and move into the account once login exists. Each figure the engine uses is the
larger of the vehicle data's and the customer's, so typed figures can only make an answer stricter. With
them the tyre half becomes a definite answer, and the arithmetic is shown:

`Achslast 1.100 kg ÷ 2 = 550 kg je Rad. Reifen LI 88 = 560 kg × Minderung bei T (Tabelle) = … kg.`

The load-capacity derating by top speed and speed symbol, **as printed on page 6 of ABE 55255** (from the
user's brief of 2026-09-28; not derived, not extended):

| km/h | V | W | Y |
|---|---|---|---|
| 210 | 100 % | 100 % | 100 % |
| 220 | 97 % | 100 % | 100 % |
| 230 | 94 % | 100 % | 100 % |
| 240 | 91 % | 100 % | 100 % |
| 250 | – | 95 % | 100 % |
| 260 | – | 90 % | 100 % |
| 270 | – | 85 % | 100 % |
| 280 | – | – | 95 % |
| 290 | – | – | 90 % |
| 300 | – | – | 85 % |

The table is **data of each document** (`document_speed_deratings`), never a constant; a table the demo
seed wrote is marked as such. Read with three answers (the operator's reviews of C9): a share — apply it, the
speed rounded **up** to the next row, never interpolated; a „–“ — that symbol is **not permitted** at that
speed, and the required symbol is raised; no row, no column or no table — **UNKNOWN**, never read as 100 %.
The load decision is taken in whole numbers: `2 × capacity × percent ≥ 100 × axle load`.

## Acceptance (the user's)

- BMW 4er 3C: a positive wheel verdict with no axle data, a CONDITIONAL tyre line naming 1.120 kg, and a
  definite answer once the values are entered.
- A test that the combined verdict is never PERMITTED while the tyre part is CONDITIONAL.
