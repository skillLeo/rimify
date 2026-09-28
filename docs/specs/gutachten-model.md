# The Gutachten model, after the two real Borbet documents

Design for Block B of `docs/launch/REMAINING.md` (the corrections memo §1–§4, the Borbet brief §2–§3). It says
what changes in the schema and the engine, in which order, and what each step proves. Blocks C and D build
on it; nothing here waits for them.

## Names

The code base names its tables in English (`approval_documents`, `fitments`); the briefs name the new
tables in German. The schema stays in one language, and this is the map:

| Brief | Table / column here |
|---|---|
| `gutachten` | `approval_documents` |
| `gutachten_auflage` (gutachten_id, code, typ, text_de, seite) | `document_conditions` (approval_document_id, code, kind, text_de, source_page) |
| `auflage_nacharbeit` | `document_condition_reworks` |
| `befestigungsmittel` | `document_fasteners` |
| `gutachten_pflichthinweis` | `document_notices` |
| `nachtrag_zu` | `approval_documents.supplement_to_id`, and `supplement_to_number` for a base we do not hold |
| `anlage`, `pruefbericht_nummer`, `ausfertigung`, `benennungsnummer`, `pruefort`, `stand`, `gueltig_ab_fertigung` | `annex`, `test_report_number`, `copy_number`, `designation_number`, `test_site`, `revision_date`, `valid_from_production` |

## B1 · Auflagen belong to their document

- `document_conditions`: one row per code a document defines — `approval_document_id`, `code` (as printed),
  `kind` (the twelve types below), `text_de` (the full sentence, never empty — R-15), `source_page`, and the
  machine-readable parameter a kind needs: `body_forms` (json, for `karosserieform`), `drive` (json, for
  `antrieb`), `max_axle_load_kg` (for `reifen_tragfaehigkeit` — the user's decision: the kg limit is stored per
  code, never re-parsed from the sentence), `axle` (for `reifen_achse`). **Unique on (document, code).**
- `fitment_conditions` points at `document_conditions`, not at a global code. A row may only carry a code of
  its **own** document: checked at save (the form offers only that document's list) and at release.
- **An unresolved code fails closed:** a code on a row that its document does not define (or whose
  definition was taken away) makes the row's verdict UNKNOWN (`CONDITION_UNRESOLVED`) and blocks the release
  with „Code A01 ist in diesem Gutachten nicht definiert“. Nothing ever falls back to another document.
- **Migration:** every (document, global code) pair in use becomes a `document_conditions` row of that
  document — its printed code from `condition_code_aliases` where the document had one, the global code
  otherwise — with the global sentence, and a kind mapped from what the code did (`ENTRY_REQUIRED` →
  `abnahme`, a workshop code → `karosseriearbeit`, a restriction → `hinweis` with its sentence, info →
  `hinweis`). Then `condition_codes` and `condition_code_aliases` go. The Auflagen-Katalog page becomes the
  read-only index of every document's list plus the „nicht zugeordnete Codes“.
- **Proof:** A01 stored under two documents with different sentences; a verdict from the 18″ document never
  shows the 19″ sentence; a row whose code its document lacks is UNKNOWN and not releasable.

### The twelve kinds, and what each does to a verdict

| kind | shown as | effect |
|---|---|---|
| `abnahme` | „Abnahme“, first | derives the Eintragung (B2); verdict CONDITIONAL |
| `karosseriearbeit` | „Arbeiten am Fahrzeug“ | CONDITIONAL, acknowledged before the basket |
| `nacharbeitsprofil` | „Arbeiten am Fahrzeug“, with the mm per vehicle type and axle | as above |
| `karosserieform` | not a sentence: a filter | the customer's body style outside `body_forms` → NOT_PERMITTED for that row |
| `antrieb` | not a sentence: a filter | the drive outside `drive` → NOT_PERMITTED for that row |
| `befestigung` | „Befestigung“ with the set | information; the set is offered |
| `reifen_tragfaehigkeit` | „Reifen“ | the tyre line (Block C, R-03 split) |
| `reifen_achse` | „Reifen“ | the size only on that axle |
| `reifen_kombination` | „Reifen“ | the front/rear pairs allowed |
| `tacho` | „Hinweise“ | CONDITIONAL (the speedometer must be checked) |
| `verbot` | „Hinweise“, loud | information that forbids something (snow chains) |
| `hinweis` | „Hinweise“, folded | information |

A filter kind with no parameter entered (no body style ticked) cannot narrow anything and so fails closed:
the row is UNKNOWN until a person enters it.

## B2 · The Eintragung is derived, per tyre size

- Codes hang off the row **and** off each tyre size of the row (`fitment_tyre_size_conditions`). For a size,
  its codes are its own plus the row's.
- „Eintragung / Abnahme erforderlich“ for a size = one of its codes is of kind `abnahme`. Never typed. The
  entry form shows it read-only with the code it came from („erforderlich — A01, Seite 6“).
- An override is possible only with a written reason; it is stored on the row (`entry_override`,
  `entry_override_reason`, `entry_override_by`, `entry_override_at`), audited, and shown beside the derived
  value in the admin and to the customer as „laut Prüfer: …“. `fitments.requires_entry` stops being input.

## B3 · One verdict per document, never blended

- The resolver groups the covering rows **by document** and decides each document on its own rows only. The
  merge toward caution across documents is removed.
- One document covers: its verdict, naming it. Several cover and agree: the verdict of each, named, the
  newest first. Several cover and **disagree** about a (wheel, vehicle, tyre size) triple — a different
  verdict, other Auflagen, another Eintragung: that triple is UNKNOWN (`DOCUMENTS_DISAGREE`) and an open
  conflict stands on the Konflikte list until a person decides.
- Konflikte (admin): both sides side by side with their pages; the decision is „beide gelten jeweils für
  sich“ or „nur Dokument X gilt“, with a reason, audited. Until then: UNKNOWN.

### As built (2026-09-28)

- A code may be typed on a row before the document's list holds it: it is said on the row, listed as
  „nicht zugeordnet“, keeps the row UNKNOWN and stops the Freigabe. Codes compare exactly as printed.
- `fitments.requires_entry` is the derived (or overridden) value, written by FitmentRows and refreshed when
  the document's list changes; the engine derives it from the codes itself and reads the column only as a
  floor — a stale value can make an answer stricter, never looser.
- A Prüfer's override reaches the customer: „required“ adds „Laut Prüfer: …“ to the entry note;
  „not required“ adds the Hinweis „Laut Prüfer ist keine Eintragung erforderlich: …“.
- Documents are compared by their answer, their Eintragung, the kinds of their non-Hinweis Auflagen and their
  tyre sizes per axle. Agreeing documents are read together (the centre bore still says „differs“ when it
  does). A decision is per car and wheel and covers every open conflict of that pair; a new open conflict
  makes the pair undecided again.
- A disagreement the engine sees without a conflict row (released before the check ran) is UNKNOWN too, but
  cannot be decided on the Konflikte page until a conflict is recorded — a known gap, fails closed.

## B4 · The record's shape

- Kinds: ABE, Nachtrag, Teilegutachten, EG-Typgenehmigung, ECE.
- Header fields from page 1: Anlage, Prüfbericht-Nr., Ausfertigung, Benennungsnummer, Prüfort, Prüfdatum,
  Stand, gültig ab Fertigungsdatum (a month: a wheel made before it is not covered — shown to the customer).
- A Nachtrag names its base: `supplement_to_id` when we hold it, `supplement_to_number` when we do not. A
  Nachtrag without its base can be saved and released; the record, the coverage matrix and the customer see
  „Grundgutachten ABE 53841 liegt uns nicht vor — dieser Nachtrag allein ist nicht die ganze Freigabe.“
- `document_condition_reworks` (condition, vehicle type, axle, from/to mm, flare mm), `document_fasteners`
  (no., thread, seat, torque Nm, shaft length mm, article no., for which vehicle types), `document_notices`
  (the duties always shown: the 50 km torque check, the TPMS note, the papers correction).
