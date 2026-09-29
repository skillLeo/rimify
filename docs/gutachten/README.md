# The Borbet DB8GT2 documents, transcribed

Two real Gutachten, read off their PDFs and typed into the admin through the admin flow — never a seeder.

| File | Document |
|---|---|
| `abe-55255.json` | ABE 55255, Anlage 19 zum Prüfbericht 55051823, TÜV Rheinland, 8.5JX19 H2 Typ DB8GT2-8519, 13 pages |
| `366-0350-21-WIRD-N1.json` | Gutachten 366-0350-21-WIRD/N1 zur Erteilung eines Nachtrags zur ABE 53841, Anlage 16, TÜV Austria, 8 1/2 J X 18 H2 Typ DB8GT2-8518, 24 pages |
| `fahrzeuge.json` | The cars both documents name, one record each, with the document and page that names it |

## Entering them

```
RIMIFY_ADMIN_EMAIL=… RIMIFY_ADMIN_PASSWORD=… node e2e/tools/gutachten-eingabe.mjs \
  --dokument docs/gutachten/abe-55255.json --pdf "…/Borbet DB8GT2_19_ABE_BMW.pdf"
RIMIFY_ADMIN_EMAIL=… RIMIFY_ADMIN_PASSWORD=… node e2e/tools/gutachten-eingabe.mjs \
  --dokument docs/gutachten/366-0350-21-WIRD-N1.json --pdf "…/Borbet DB8GT2_18_ABE_BMW.pdf"
```

Then the first command once more: six of its cars are named by the Nachtrag, and their rows follow once the
Nachtrag stands. The tool signs in as that admin, creates each document through „Neues Gutachten" with its PDF,
and sends the requests the entry screens send. It releases nothing: a person checks each draft against its PDF
and presses „Freigeben". Run again, it keeps what exists and corrects a code whose sentence differs.

## How they were read

- **Legends** (55255 pages 7–12, the Nachtrag pages 10–18): extracted from the PDFs' text, not retyped. Words
  the text layer splits inside a justified line (`Radhausausschnittkant en`) are joined back. Every one of the
  158 sentences ends as printed.
- **Rows**: typed block by block from a dump of every text cell with its position. They were cross-checked
  against that dump three ways: every size, printed index, kW band and size code must stand beside that size on
  that page; every 55255 block's own codes must equal its printed column; and the Nachtrag's „Auflagen" column
  was compared by eye, page by page. A deliberate slip (one code dropped, one band changed) is caught.
- **Kinds** are chosen per code, as a person chooses them: a body style or drive is a filter; anything that
  limits which tyres may be bought (tables, winter-only, brand bindings, ZR confirmations) is a tyre kind, so
  no Komplettrad is put together on a guess.
- **The Nachtrag prints words, not codes, in its Auflagen column** (`Cabrio`, `Heckantrieb`, `Schrägheck 2-türig`,
  `Nicht 330D`). They are entered as its own entries, with the page they first stand on; a filter's sentence
  only says where it was printed. Its EG limits (`Nur bis …*03`, `ab …*08`) and series notes (`BMW 3er (F30) ab
  2012`) choose the cars a block covers and are not entered as codes.
- **Cars**: one record per car as the documents name it. Where two documents print different extension ranges
  for one car (Z3 at `*07/*08`, 4er at `*08/*09`, Paceman at `*00/*01`), the car is split at that boundary so each
  document's rows cover only what that document prints. Pairings of types and approval numbers that a block
  prints as lists are made by the order printed, confirmed by other blocks where possible; each is noted in
  `fahrzeuge.json`.
- **One car in several blocks of one document** becomes one row: what all blocks print stays on the row, what
  only one prints moves to that block's sizes.

## Not entered, and why

Each file lists it under `notEntered`, and what was read without a column of its own under `read`. In short:
BMW M3 (M3B, Betriebserlaubnis G191) and BMW 3 B (F920) carry a national approval the car form does not take;
the rework measure `27B` appears in no legend and no row; one `225/40R18 92 M+S` entry prints no code limiting
it to winter tyres. The Nachtrag prints no issue date (only its Stand, 02.07.2025), no Prüfort and no table of
tyre load at speed; none is filled in. It prints no rework profile for type 1K2 either, though its 1K2 row names
26B, 26J, 26N, 27F and 27H. Its page-24 Hinweisblatt captions drawings the shop does not show and names only codes,
so it is not entered as a Hinweis; the Auflagen it illustrates are entered as sentences, and the PDF shows the sheet.
