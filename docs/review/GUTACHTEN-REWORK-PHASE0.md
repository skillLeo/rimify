# Gutachten rework — Phase 0

*1 November 2026 · base `7dbc46a4` (release 25 on the preview) · answers the operator's brief „Gutachten rework" v2, §11 Phase 0.
The brief, the proposal PDF, the transcript, the client's answers and the screens stay outside the repository.*

**Result.** No blocker from §11. The target can be built without changing a verdict rule, and every existing paper can be
carried over with the same answers. Four points differ from the brief and are set out at the end. The sketch (Phase 1)
shows the variant that leaves the verdict logic as it is.

---

## 1 · What „Zeilen hinzufügen" stores today

Example: 3 cars, 2 „Felgengrößen" ticked, 2 tyre sizes typed, 3 codes beside each size, 2 general codes.
`FitmentRows::add()` writes one row per car × ticked size × axle, all with one shared spec, and skips rows that already exist.

| Table | One row per | Rows here | Columns |
|---|---|---|---|
| `fitments` | car × colour SKU (`wheel_config_id`) × axle | 3 × 2 = **6** | approval_document_id, vehicle_id, wheel_config_id, axle (ALL / FRONT / REAR), build_from, build_to, permitted_width_min/max, permitted_et_min/max, centre_bore_mm, requires_entry (derived from an Abnahme code, never typed), entry_note_de, entry_override (+ reason, by, at), source_page, status |
| `fitment_tyre_sizes` | tyre size × row | 6 × 2 = **12** | width_mm, aspect, diameter_in, min_load_index and min_speed_symbol (NULL = not given), axle, kw_min, kw_max, entry_key |
| `fitment_tyre_size_conditions` | code × tyre size × row | 12 × 3 = **36** | fitment_tyre_size_id, code |
| `fitment_conditions` | general code × row | 6 × 2 = **12** | fitment_id, code, note_de |

That is 66 rows, and all 6 car × size cells carry the same tyres. This is the defect the client named. A code's meaning is
not repeated in these rows: it is stored once per paper in `document_conditions` (§12).

## 2 · Sizes or colours?

They are colours. A `wheel_configs` row is one colour (`wheel_finish_id`) in one dimension. The form lists each of these
SKUs as a „Felgengröße", so BBS LeMans 8,5 × 18 ET 30 in Black Gloss and in Blue Gloss count as two sizes, and Borbet
DB8GT2 shows four (two dimensions × two colours). The engine answers per SKU
(`EloquentFitmentRepository::publishedRowsFor(vehicleId, wheelConfigIds)`).

What the data holds:

- **Preview:** on every paper, the colours of one dimension carry identical rows (#17, #19, #20 and #23 have several
  colours; none differs).
- **Dev database:** the 8 development papers, which span several dimensions, give their colours different rows
  (1,231 of 1,356 car × dimension groups). The tyres never differ; the page does (1,231), the row codes (1,098) and
  the Eintragung note (582). These papers come from the development seed, not from a paper anyone read. See §8 for
  what that means for the migration.

## 3 · Admin 19 matching and field K

`App\Support\EgNumber` reads an EG type-approval number the way a paper prints it and the way field K holds it (no
spaces, lower case, trailing asterisks dropped):

- `..` or nothing means every extension;
- `11` means that one extension;
- `00-09` is a range;
- `04-..` means from 04 on. The paper's „ab e1\*93/81\*0029\*08" is `…*08-..`.

`covers()` says whether the paper's number takes in the car's number. Two places use it today:
`CombinationEntry::for()`, to choose a car's front/rear pairs (D-358), and „Fahrzeug aus diesem Gutachten anlegen"
(`VehicleFromDocumentRequest`), which uses `overlaps()` so that a car is never created twice.

**It can drive car groups.** A car belongs to a group when one of the group's printed numbers `covers()` its field K and
its kW lies inside the group's range. Two limits:

- **Old national approval numbers** (`G191`, `F920` in the M3 row) are not EG numbers, and `EgNumber::parse()` returns
  null for them. They need an exact comparison of the normalised text with field K. That is a small addition to the
  same class, not a second rule.
- **A car without a kW figure** cannot be matched by range. Staff add it to the group by hand.

| Database | Source | Cars | Field K | K reads as EG number | kW |
|---|---|---|---|---|---|
| Preview | demo („Entwicklung") | 3 | 3 | 3 | 3 |
| Preview | aus einem Gutachten | 1 | 1 | 1 | 0 |
| Preview | von Hand geprüft | 1 | 1 | 1 | 1 |
| Dev | demo („Entwicklung") | 74 | 74 | 71 | 74 |
| Dev | aus einem Gutachten | 76 | 76 | 76 | 0 |

Every car has field K. None of the cars created from a paper has a kW figure, so automatic linking would miss all of
them. Neither database holds a car from a vehicle-data import yet.

## 4 · Where the verdict reads tyre data

`FitmentResolver` reads, for every row that covers the car:

- the row's tyre sizes, with each size's own minimum load index (LI) and speed symbol (SI), axle, kW band and codes
  (`fitment_tyre_sizes`, `fitment_tyre_size_conditions`);
- the row's codes;
- the paper's setting for LI and SI (`approval_documents.tyre_index_source`);
- its high-speed load table (`document_speed_deratings`);
- its front/rear pairs (`document_tyre_combinations`).

The minimum a tyre must meet is derived from the car's papers: `LoadIndexDeriver` works from the axle loads in fields
8.1 and 8.2, and `SpeedSymbolDeriver` from the top speed in field T. That derivation is the floor. Where the paper prints
a stricter figure, the paper wins, and the verdict records which source it used (R-06, `MinSource`).

The setting (`TyreIndexSource`, D-277) is read off the paper and asked before release:

- **„bei jeder Reifengröße"** (`document`): the paper prints LI and SI beside every size. The release door refuses the
  paper while any size lacks either. The car's top speed is neither asked for nor used (D-285), and the tyre must meet
  or exceed both figures.
- **„aus den Fahrzeugpapieren"** (`papers`): the paper refers the reader to the car's papers. The minimum comes from the
  axle loads and the top speed.
- **„aus der Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit"** (`table`): ABE 55255's table lowers the load a tyre
  may carry at high speed. The needed LI is read from that table against the car's top speed.

**Missing LI or SI today: nothing is guessed.**

- In `papers` and `table` mode, a size without figures takes the derivation from the car's papers.
- Without the car's axle loads or top speed, the tyre half is `UNKNOWN`, „Noch nicht bestätigt", and names the fields
  it waits for (R-03, D-286). The combined verdict is then never `PERMITTED`.
- A rim sold alone still carries the wheel's own verdict, `CONDITIONAL` at best, with the sizes it may only be fitted
  with (D-289). The exception: the paper limits by axle load and the car's load on that axle is unknown.
- In `document` mode, a paper with a size missing LI or SI cannot be released at all.

The new editor stores LI and SI in the same two nullable columns, as a value or as „nicht angegeben". All of the above
stays as it is.

## 5 · Front/rear pairs (F-10)

**How they are stored.** Per paper and per EG-number entry, in `document_tyre_combinations`: approval_document_id,
eg_number as printed, eg_number_norm, the paper's own number, front and rear width, aspect and diameter, source_page,
carried_over.

**How the engine reads them.**

- For a car, it takes the entry whose number `covers()` the car's field K (`CombinationEntry::for`, D-358).
- With no such entry, or two entries with different lists, the car gets an empty list: its tyres are „Noch nicht
  bestätigt" and no Komplettrad is offered. It never gets another type's list.
- A Komplettrad is made of the paper's combinations, two plus two per axle (D-335). Each order line freezes the
  combination row it was sold in.

**What changes if the pairs move under a car group × size cell.**

- A paper has one wheel size, so a cell is one group. A group is one row of the paper, which prints one or two approval
  numbers, so groups map almost 1 : 1 onto today's entries.
- The engine's table can stay. On every save, each pair is written once for every approval number of its group, so
  D-358 keeps choosing pairs by field K, unchanged.
- **One case the table cannot hold:** two groups of one paper with the same approval number but different pairs. An
  EG-number key cannot tell them apart. The release door names this case rather than merging the lists. No existing
  paper has it: the preview holds 3 pairs (#18 one, #21 two, one entry each), and the dev database holds none.
- A car added to a group by hand without field K gets no pairs, as today. Giving it pairs would widen what the shop
  sells, which is a verdict change and not part of this work.

## 6 · Two versions in one diameter (the client's question at 23:35)

The client's own example, BBS LeMans 9 × 18 ET 40 5 × 115, was never saved (§10). The preview has a real case: Borbet
DBGT8 in Bronze has two versions in 18″, both covered by ABE 53841 Fassung 2 (#21):

- 8 × 18 ET 35 5 × 120 at 400,00 €;
- 8,5 × 18 ET 35 5 × 120 at 444,00 €.

**Without a car.** The page shows Farbe and Durchmesser „18". Since finding 138 (release 23) it also shows a row
„Breite und Einpresstiefe (ET)" with one chip per version: „8J × 18 · ET 35" and „8,5J × 18 · ET 35". Each chip switches
the price and the RIMIFY-Check. Both can be put in the basket.

**With a car** (BMW 3er Coupé, type 346C, car 152 on the preview). The same two chips, each „Mit Auflagen freigegeben".
Both can be bought.

**BBS LeMans** shows only „18", because each of its colours has one version (screen 08).

So the answer to the client is: yes, since release 23 both versions are shown and both can be bought. Three things are
still missing against §8:

1. **The chip does not name the Lochkreis.** Two versions that differ only in bolt pattern (9 × 18 ET 40 5 × 115 and
   9 × 18 ET 40 5 × 120) would show two identical chips.
2. **The chip carries no price.** The price changes only after the click.
3. **With a car, an unapproved version stays visible, struck through, with the reason.** That is the page's own rule:
   hiding it would let the customer believe the wheel is not made in that size. §8 hides such versions and counts them
   instead (difference 4).

Screenshots, at 1440 unless marked, outside git in `storage/qa-evidence/gutachten-phase0/`:

- `dbgt8-ohne-auto-1440.png` and `dbgt8-ohne-auto-zweite-ausfuehrung-1440.png` (both also at 390);
- `dbgt8-mit-auto-1440.png` and `dbgt8-mit-auto-zweite-ausfuehrung-1440.png`;
- `bbs-lemans-ohne-auto-1440.png`.

## 7 · Today's Komplettrad flow

On the preview: BMW X3 (E83) 2.0d (demo), Borbet DB8GT2, 19″, Schwarz matt. One screenshot per step, `kr-1.png` to
`kr-6.png`:

1. **Product page:** „Was möchtest du bestellen?", Nur Felgen / Kompletträder.
2. **„Kompletträder":** a sentence names the LI and SI the tyres need, followed by a plain radio list with one line per
   tyre: brand and model, season, size with LI/SI, price per wheel. There is no picture, no EU label, no filter and no
   sorting.
3. **A tyre is chosen:** Wuchtgewichte (Silber / Schwarz, +3,00 €) and RDKS (Mit / Ohne) appear.
4. **Both answered:** the set price and „Als Komplettrad in den Warenkorb".
5. **The popup** after adding.
6. **The basket** shows the set as its own lines: rims, tyres, mounting, extras. I removed the line again afterwards.

## 8 · Mapping, migration, riskiest part

### Current → target, field by field

| Target (§6 of the brief) | Today | Change |
|---|---|---|
| Paper: PDF, Art, Nummer (required) | `approval_documents`: pdf_key, pdf_sha256, kind, kba_number / report_number | none |
| Aussteller, Datum | issuer, issued_on | none |
| „Weitere Angaben" | approval_mark, annex, report number, revision, supersedes_id, page_count, valid_from, production_from, missing_annexes, counted_axle_limit_kg, tyre_index_source | none in the data; folded away in the UI |
| Versioning, release door, completeness | `DocumentRevision`, `DocumentRelease`, completeness (D-227; the brief says D-119, which is another decision) | kept; the revision also copies the new tables |
| Wheel size, one dimension | none at paper level; every row names a colour SKU | new `document_wheel_sizes`: paper, wheel model, diameter, width, ET, holes × circle, centre bore |
| Every colour inherits | rows per SKU | rows written for every live SKU of the dimension |
| Car group: approval number(s), kW range, type code, notes | none; every row names one car | new `document_car_groups` (paper, Verkaufsbezeichnung, type code, numbers as printed, kw_min, kw_max, notes, page) and `document_car_group_vehicles` (group, car, how: matched / added / removed) |
| Tyre option, same on both axles: size, LI, SI, kW, codes | `fitment_tyre_sizes` + `fitment_tyre_size_conditions`, per row | new `document_tyre_options`, per group × size; same columns |
| Tyre option, front/rear pair | `document_tyre_combinations`, per EG-number entry | the pair line of the cell, written per approval number of the group (§5) |
| General codes of the row, page | `fitment_conditions` (code, note), `fitments.source_page` | on the cell |
| Axle restriction (advanced) | `fitments.axle`, `fitment_tyre_sizes.axle` | on the option, under „…" |
| Code definitions per paper | `document_conditions`, already per paper | none; „definieren" writes here |
| Build window, width/ET range, centre bore, Eintragung override and note | `fitments` columns | kept on the cell under „Weitere Angaben", shown only where set |

**The engine does not change.** Staff edit the new tables. The engine keeps reading `fitments`, `fitment_tyre_sizes`,
`fitment_conditions`, `fitment_tyre_size_conditions` and `document_tyre_combinations`. One service rewrites those rows
from the new tables on every save of a draft: car × colour SKU × axle, exactly today's rows. The release door, the
admin preview and every shop surface work on those rows as they do now. A released version is never rewritten.

### Migration

The migration builds the new tables **from** the existing rows and leaves the rows the engine reads untouched. Verdicts
therefore cannot change through the migration itself.

1. **Wheel sizes.** One `document_wheel_sizes` row per dimension a paper's rows name.
2. **Car groups.** One group per car × dimension × axle, holding that one car, marked „aus der bisherigen Eingabe", with
   no approval number and no kW range. No other car ever joins a migrated group by itself.
3. **Tyre options and codes.** Copied from the rows; pairs from the entry that covers the group's car.
4. **Colours.**
   - Where a dimension's colours carry identical rows, they become one size. That is every paper on the preview.
   - Where they differ, only the 8 development papers, the codes do too, and so would the answers if the colours were
     merged. Those papers are seed data: the development seed writes them in the new shape instead, one size each.
     Should a real paper ever differ by colour, the cell keeps a colour scope, a migration-only field shown as „nur
     Bronze matt", which new entries never set.

**The test.** For every paper on the demo and acceptance data:

- every verdict, car × colour SKU × tyre option, computed before and after the migration, must be identical;
- writing a migrated paper back from the new tables must reproduce its rows exactly.

The second condition is what makes a new Fassung of a migrated paper give the same answers.

### The riskiest part

**1. The round trip.** The new tables must hold everything a row holds today: ranges, centre bore, Eintragung note and
override, axle rows, kW bands, codes with their notes, pages, colour scope. If one field is lost, a new Fassung changes
answers that nobody meant to change.

**2. Linking cars to groups.** Membership is fixed when staff take the group over in step 3, and frozen at release. A
car imported later that matches the group shows up for staff as a to-do on the paper („2 neue Fahrzeuge passen zu BMW X3
· X83"). It is never approved by itself. A live link would approve cars nobody looked at.

## 9 · Effort, and what is harder than it looks

| Phase | Working days | What it holds |
|---|---|---|
| 1 Sketch | 1 | four areas, in memory, on the preview |
| 2 Entry flow | 7–9 | new tables and the service that writes the engine's rows (2) · migration with the verdict-equivalence and round-trip test (1.5) · five steps with autosave, PDF panel, Auflagen panel, copy and paste (3.5) · read view and list status (0.5) · tests, gate, deploy (1) |
| 3 Product page versions | 2 | chip with Lochkreis and price · hidden and counted with a car · „Anfrage" · URL · full spec in basket, checkout, mails and admin order · JSON-LD offers · tests |
| 4 Tyres | 5 | tyre model with photos (the rim page's upload) · supplier per size line · admin list for hundreds · shop: steps, cards, filters, sorting, details, front/rear sets, extras never preselected · tests |

Phase 3 does not depend on Phase 2: it reads today's per-SKU verdicts. It can go first if the client wants the quickest
visible change.

**Harder than it looks:**

1. **„Aktuelle PDF-Seite übernehmen".** The browser's own PDF viewer does not tell the page which page is on screen.
   - Without a library, our own page control (◀ Seite 7 von 24 ▶) drives the viewer through `#page=7`, and the button
     copies that number. Scrolling inside the viewer goes unseen.
   - Exact tracking needs pdf.js, a new library of about 1 MB.
   - The CSP allows frames from our own origin only (`frame-src 'self'`), so a PDF on the bucket has to be served
     through our own URL.
2. **Car groups.** National approval numbers need an exact text match. Cars without kW cannot be matched by range (all
   76 cars made from papers on dev). Membership is frozen at release (§8).
3. **Colours.** The engine answers per SKU, so a colour added after release needs its rows written for the released
   papers of its dimension. That is a recorded step, not an edit of the paper.
4. **Codes keep their kind.** „definieren" needs the kind and, for four kinds, the one value that kind needs
   (difference 1).
5. **Pairs are keyed by approval number** (§5).
6. **Autosave must not touch what the shop reads.** Only a draft's rows are rewritten; a released version never is.
7. **„Mehrere einfügen" must read the paper's own long paragraphs.** One front size with several rear sizes
   („Nr. 1: 215/35R19 – 245/30R19, 255/30R19") is two pairs. `TyrePairingTable::parse()` already holds that grammar.

## 10 · The client's changes on the preview during the call

All read only. Nothing touched.

- **ABE 55255, Fassung 2 (#23):** a draft, created 31.10. 11:20 UTC from Fassung 1 with „Neue Fassung anlegen". It holds
  6 rows, 22 tyre lines and 76 codes, all copied. The shop still answers from Fassung 1.
- **ABE 11111 (#22):** an empty draft, created 31.10. 11:14 UTC.
- **BBS LeMans:** the row 9 × 18 ET 40 5 × 115 Blue Gloss was not saved: the page showed „Ungespeicherte Änderungen", and
  later „Änderungen nicht gespeichert". The wheel still has #123 Black Gloss and #124 Blue Gloss, both 8,5 × 18 ET 30
  5 × 120. There is nothing to keep or delete.
- **Not from the call:** Teilegutachten 1810080716 (#17), a draft the client created on 10.10. Two of its rows are
  axle-specific.

## 11 · How tyres are stored

One table, `tyre_variants`, with one row per size line. Its columns:

- brand_id;
- name (the model, as text);
- season (sommer / winter / ganzjahres);
- width_mm, aspect, diameter_in;
- load_index;
- speed_symbol and speed_rank (every comparison uses the rank, because H lies between U and V);
- the EU label: eu_fuel_class A–E, eu_wet_grip_class A–E, eu_noise_db, eu_noise_class A–C, eu_snow_grip, eu_ice_grip,
  eprel_id (NULL = not on record);
- price_cents and currency;
- available (stock_qty is kept but no longer read);
- is_demo / demo_ref.

What is missing for the target:

- **No model level.** One model in five sizes is five unrelated rows with the same name.
- **No pictures.**
- **No supplier per tyre.** The catalogue import records which supplier a file came from, to remember its column
  mapping (`catalogue_imports.supplier`), and nothing per line.

The preview holds 15 size lines: 14 demo lines, 2 model names, 1 line with an EPREL number.

## 12 · How codes are stored, and what the shop makes of them

**Storage, per paper.** There is no global library. `document_conditions` holds:

- paper and code as printed;
- **kind**;
- **level**;
- text_de, as printed;
- page;
- the kind's one value: body_forms, drive, max_axle_load_kg, or axle;
- the load-limit confirmation.

**Where codes appear.**

- Rows reference codes by their text (`fitment_conditions.code`, `fitment_tyre_size_conditions.code`).
- Admin › Auflagen (`AuflagenController`) is a read-only overview across papers.
- „Neue Fassung anlegen" (`DocumentRevision`) copies everything: rows, tyre lines, their codes, the code list,
  fastening, notices, high-speed table, pairs.
- A code that the paper's list does not hold yet may be typed on a row. The row says so, and the release door refuses
  the paper until the code is defined: „Code 24J ist im Auflagenverzeichnis dieses Gutachtens nicht hinterlegt".

**What the shop derives from them.**

- **„Eintragung erforderlich"** comes from a code of kind Abnahme (`requires_entry`, derived and never typed). It can be
  overridden only with a written reason.
- **„Mit Auflagen"** is the verdict `CONDITIONAL`, shown as the amber badge (`verdict--warn`). The kind decides what a
  code does:
  - Karosserieform and Antrieb are filters that narrow the cars a row covers;
  - Tragfähigkeit, Achse and Kombination narrow the tyres;
  - every other kind is a sentence in its section.
- **The level** (Hinweis / Auflage / Nicht zulässig, the client's item 23) changes only the badge's words. Where every
  code of an answer is a Hinweis and nothing else makes it conditional, the badge reads „Freigegeben" with a quiet „mit
  Hinweisen" (`FitmentVerdict::notesOnly`). An Abnahme or work on the body is always at least an Auflage. No level gives
  a sentence its own colour (D-247). The yellow the brief recalls is the amber „Mit Auflagen" badge.

---

## Differences from the brief

1. **Codes keep their kind.**
   - The brief (§0a.8, §4.5) asks for code, text and level only.
   - The kind is what makes a code act: it derives the Eintragung, filters body forms and drives, and limits tyres.
     Without it, a „nur Cabrio" code would become a plain sentence and the wheel would be approved for a saloon.
   - The PDF says the codes' meaning „is set once in the admin, as today", and today's meaning includes the kind.
   - So „68B definieren" asks for the text, the kind (one select) and, for four kinds, the one value the kind needs. The
     level stays optional, with its floor.
2. **An undescribed code stops the release, as it does today.**
   - The brief wants a warning that never blocks, with the shop saying „Mit Auflagen". That contradicts R-03 as amended
     (D-286: a missing input gives „Noch nicht bestätigt", never `CONDITIONAL`) and R-15 (there is no sentence to show).
     It can also be wrong: an undescribed „nur Cabrio" code would let the shop approve the wheel for a saloon.
   - The sketch keeps today's door. Step 5 lists the codes in amber with „Jetzt beschreiben" inline, one click each, and
     „Freigeben" names them as what is left.
   - The alternative: release anyway, and the tyres that carry such a code answer „Noch nicht bestätigt" until it is
     described. That needs a new reason in the engine, which is a verdict change.
3. **The LI/SI question moves to step 5, prefilled rather than defaulted.**
   - A silent default can be more permissive than the paper: a paper with a high-speed table, left on „aus den
     Fahrzeugpapieren", would skip the derating.
   - The sketch asks the question beside the completeness question in step 5, with a suggestion read from the tyres
     entered. „Weitere Angaben" in step 1 can set it earlier. There is no banner either way.
4. **With a car, versions the car has no approval for are counted in words that are true (R-17), and can be shown.**
   - „passt nicht zu deinem Fahrzeug" (§8, PDF p. 9) says more than the record does when there is simply no paper for
     that version.
   - The count line follows the verdict, as the page's struck-through sizes already do:
     - „… ist für dein Fahrzeug nicht freigegeben" where a paper rules the car out;
     - „Für 1 weitere Ausführung liegt uns für dein Fahrzeug keine Freigabe vor" where none is on record.
   - „Anzeigen" brings those versions back, struck through, so nobody concludes the wheel is not made in that size.
